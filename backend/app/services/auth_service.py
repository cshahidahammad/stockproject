import re
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from werkzeug.security import check_password_hash, generate_password_hash

from app.core.config import BACKEND_DIR

DB_DIR = BACKEND_DIR / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "users.db"

EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,}$")


class AuthService:
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
            conn.commit()

    def create_user(self, name: str, email: str, password: str) -> Dict[str, Any]:
        """Validate input, hash password with PBKDF2-SHA256, and persist new user."""
        cleaned_name = name.strip() if name else ""
        cleaned_email = email.strip().lower() if email else ""

        if len(cleaned_name) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        if len(cleaned_name) > 100:
            raise ValueError("Name cannot exceed 100 characters.")

        if not cleaned_email or not EMAIL_REGEX.match(cleaned_email):
            raise ValueError("Please provide a valid email address.")

        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if len(password) > 128:
            raise ValueError("Password cannot exceed 128 characters.")

        password_hash = generate_password_hash(password, method="pbkdf2:sha256")
        now_iso = datetime.now(timezone.utc).isoformat()

        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO users (name, email, password_hash, created_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (cleaned_name, cleaned_email, password_hash, now_iso),
                )
                user_id = cursor.lastrowid
                conn.commit()
                return {
                    "id": user_id,
                    "name": cleaned_name,
                    "email": cleaned_email,
                }
        except sqlite3.IntegrityError:
            raise ValueError("An account with this email address already exists.")

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Look up user and verify salted password hash."""
        cleaned_email = email.strip().lower() if email else ""
        if not cleaned_email or not password:
            raise ValueError("Email and password are required.")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (cleaned_email,))
            row = cursor.fetchone()

        if not row:
            raise ValueError("Invalid email or password.")

        if not check_password_hash(row["password_hash"], password):
            raise ValueError("Invalid email or password.")

        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
        }

    def create_session(self, user_id: int, duration_days: int = 7) -> str:
        """Issue a cryptographically secure session token stored with expiration."""
        token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        expires = now + timedelta(days=duration_days)

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO sessions (token, user_id, created_at, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                (token, user_id, now.isoformat(), expires.isoformat()),
            )
            conn.commit()

        return token

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify token against database and check expiration timestamp."""
        if not token:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT u.id, u.name, u.email
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ? AND s.expires_at > ?
                """,
                (token, now_iso),
            )
            row = cursor.fetchone()

        if not row:
            return None

        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
        }

    def delete_session(self, token: str) -> bool:
        """Revoke active session token on logout."""
        if not token:
            return False

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
            return cursor.rowcount > 0


auth_service = AuthService()
