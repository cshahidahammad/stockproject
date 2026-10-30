import io
import json
import sqlite3
import pytest
from fastapi.testclient import TestClient
import pandas as pd
import numpy as np

from app.main import app
from app.services.dataset_service import DEFAULT_DATASET_ID
from app.services.auth_service import DB_PATH

client = TestClient(app)


@pytest.fixture(scope="session")
def auth_headers():
    """Create a test user and return valid Bearer authorization headers."""
    email = "analyst@terminal.test"
    password = "TerminalSecure123!"

    # Sign up
    res = client.post(
        "/api/auth/signup",
        json={
            "name": "Market Analyst",
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )
    if res.status_code == 201:
        token = res.json()["token"]
    else:
        # User already exists from previous test run; log in
        login_res = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert login_res.status_code == 200
        token = login_res.json()["token"]

    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

def test_unauthenticated_request_rejected():
    """Verify protected dataset endpoints reject unauthenticated access with 401."""
    response = client.get(f"/api/dataset/{DEFAULT_DATASET_ID}/summary")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]


def test_auth_signup_success():
    """Verify new user registration with secure password hashing."""
    unique_email = f"user_{pd.Timestamp.now().value}@test.com"
    payload = {
        "name": "Jane Doe",
        "email": unique_email,
        "password": "Password123!",
        "confirm_password": "Password123!",
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == unique_email.lower()
    assert data["user"]["name"] == "Jane Doe"


def test_auth_signup_password_mismatch():
    """Verify signup rejects mismatched passwords with a clear error."""
    payload = {
        "name": "Mismatch User",
        "email": "mismatch@test.com",
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!",
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    assert "Passwords do not match" in response.json()["detail"]


def test_auth_signup_short_password():
    """Verify signup enforces minimum password length."""
    payload = {
        "name": "Short Pass",
        "email": "short@test.com",
        "password": "123",
        "confirm_password": "123",
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code in [400, 422]


def test_auth_signup_duplicate_email():
    """Verify signup rejects duplicate email addresses."""
    email = "duplicate@test.com"
    payload = {
        "name": "First User",
        "email": email,
        "password": "Password123!",
        "confirm_password": "Password123!",
    }
    client.post("/api/auth/signup", json=payload)

    # Second attempt with same email
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_auth_login_success():
    """Verify login authenticates and returns session token."""
    email = f"login_user_{pd.Timestamp.now().value}@test.com"
    password = "CorrectPassword123!"

    client.post(
        "/api/auth/signup",
        json={
            "name": "Login Tester",
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )

    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == email.lower()


def test_auth_login_invalid_password():
    """Verify login rejects incorrect passwords with 401."""
    email = f"wrong_pass_{pd.Timestamp.now().value}@test.com"
    client.post(
        "/api/auth/signup",
        json={
            "name": "Tester",
            "email": email,
            "password": "CorrectPassword123!",
            "confirm_password": "CorrectPassword123!",
        },
    )

    response = client.post("/api/auth/login", json={"email": email, "password": "WrongPassword"})
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_auth_get_me_and_logout():
    """Verify /api/auth/me returns user profile and logout revokes the session token."""
    email = f"logout_user_{pd.Timestamp.now().value}@test.com"
    password = "Password123!"

    reg = client.post(
        "/api/auth/signup",
        json={
            "name": "Logout Tester",
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    ).json()
    token = reg["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify profile
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email.lower()

    # Logout
    logout_res = client.post("/api/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # Subsequent request with revoked token must fail with 401
    me_after = client.get("/api/auth/me", headers=headers)
    assert me_after.status_code == 401


def test_passwords_are_never_stored_plaintext():
    """Direct database audit: assert passwords are stored strictly as salted PBKDF2 hashes."""
    with sqlite3.connect(str(DB_PATH)) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users LIMIT 5")
        rows = cursor.fetchall()
        assert len(rows) > 0
        for (hash_val,) in rows:
            assert hash_val.startswith("pbkdf2:sha256:")
            assert len(hash_val) > 40


# ============================================================================
# DATASET & ML FEATURE TESTS (PROTECTED WITH AUTH)
# ============================================================================

def test_health_endpoint():
    """Verify health endpoint returns status healthy and default dataset is available."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    assert data["default_dataset_available"] is True


def test_root_endpoint():
    """Verify root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "documentation" in response.json()


def test_default_dataset_meta():
    """Verify default dataset metadata is returned correctly."""
    response = client.get("/api/dataset/default")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset_id"] == "default"
    assert data["filename"] == "stock_data.csv"
    assert data["is_default"] is True
    assert data["valid_rows"] == 706
    assert "Date" in data["columns"]
    assert "Close" in data["columns"]


def test_default_dataset_summary(auth_headers):
    """Verify default dataset summary statistics calculated accurately from actual data."""
    response = client.get(f"/api/dataset/{DEFAULT_DATASET_ID}/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_valid_observations"] == 706
    assert data["latest_close"] is not None
    assert data["previous_close"] is not None
    assert data["price_change"] is not None
    assert data["price_change_pct"] is not None
    assert data["latest_ma10"] is not None
    assert data["latest_ma20"] is not None
    assert data["has_sufficient_data"] is True
    assert data["most_recent_date"] == "2026-09-15"


def test_default_dataset_analysis(auth_headers):
    """Verify historical indicator pagination, row data, and summary statistics."""
    response = client.get(f"/api/dataset/{DEFAULT_DATASET_ID}/analysis?page=1&page_size=10", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_records"] == 706
    assert data["filtered_records"] == 706
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert len(data["data"]) == 10
    first_row = data["data"][0]
    assert "Date" in first_row
    assert "Open" in first_row
    assert "High" in first_row
    assert "Low" in first_row
    assert "Close" in first_row
    assert "Volume" in first_row
    assert "Daily_Return" in first_row
    assert "MA10" in first_row
    assert "MA20" in first_row
    assert "summary_stats" in data
    assert "Close" in data["summary_stats"]


def test_analysis_date_range_filter(auth_headers):
    """Verify date filtering in analysis endpoint."""
    response = client.get(
        f"/api/dataset/{DEFAULT_DATASET_ID}/analysis?start_date=2024-01-02&end_date=2024-01-15&page=1&page_size=50",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filtered_records"] > 0
    assert data["filtered_records"] <= 10
    for row in data["data"]:
        assert row["Date"] >= "2024-01-02"
        assert row["Date"] <= "2024-01-15"


def test_default_dataset_charts(auth_headers):
    """Verify chart time series data contains necessary fields for visualizations."""
    response = client.get(f"/api/dataset/{DEFAULT_DATASET_ID}/charts", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 706
    assert len(data["data"]) == 706
    pt = data["data"][-1]
    assert "Date" in pt
    assert "Close" in pt
    assert "MA10" in pt
    assert "MA20" in pt
    assert "Daily_Return" in pt
    assert "Volume" in pt


def test_default_dataset_prediction(auth_headers):
    """Verify machine learning trend prediction returns expected metrics and format."""
    response = client.post(f"/api/dataset/{DEFAULT_DATASET_ID}/predict", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_trend"] in ["UP", "DOWN/FLAT"]
    assert data["latest_eligible_date"] == "2026-09-15"
    assert 0.0 <= data["accuracy"] <= 1.0
    assert 0.0 <= data["precision"] <= 1.0
    assert 0.0 <= data["recall"] <= 1.0
    assert 0.0 <= data["f1_score"] <= 1.0
    assert len(data["confusion_matrix"]) == 2
    assert len(data["confusion_matrix"][0]) == 2
    assert data["training_rows"] > 0
    assert data["test_rows"] > 0
    assert "feature_names" in data
    assert "limitations" in data
    assert "probability" not in data


def test_download_processed_csv(auth_headers):
    """Verify processed CSV download header and content."""
    response = client.get(f"/api/dataset/{DEFAULT_DATASET_ID}/download/processed", headers=auth_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "attachment" in response.headers["content-disposition"]
    text = response.text
    assert "Date,Open,High,Low,Close,Volume,Daily_Return,MA10,MA20,Next_Close,Trend" in text.splitlines()[0]


def test_download_evaluation_json(auth_headers):
    """Verify evaluation JSON download."""
    response = client.get(f"/api/dataset/{DEFAULT_DATASET_ID}/download/evaluation", headers=auth_headers)
    assert response.status_code == 200
    assert "application/json" in response.headers["content-type"]
    eval_data = response.json()
    assert "accuracy" in eval_data
    assert "confusion_matrix" in eval_data


def test_download_prediction_json(auth_headers):
    """Verify prediction JSON download."""
    response = client.get(f"/api/dataset/{DEFAULT_DATASET_ID}/download/prediction", headers=auth_headers)
    assert response.status_code == 200
    assert "application/json" in response.headers["content-type"]
    pred_data = response.json()
    assert "predicted_trend" in pred_data
    assert "latest_eligible_date" in pred_data


def test_dataset_upload_valid_csv_and_isolation(auth_headers):
    """Verify user can upload a custom stock CSV and that it is strictly isolated."""
    dates = pd.date_range("2024-01-01", periods=30, freq="B").strftime("%Y-%m-%d")
    rows = []
    price = 50.0
    for d in dates:
        open_p = price + 0.1
        high_p = price + 1.0
        low_p = price - 0.5
        close_p = price + 0.2
        price = close_p
        rows.append(f"{d},{open_p:.2f},{high_p:.2f},{low_p:.2f},{close_p:.2f},100000")
    csv_bytes = ("Date,Open,High,Low,Close,Volume\n" + "\n".join(rows)).encode("utf-8")

    files = {"file": ("custom_stock.csv", io.BytesIO(csv_bytes), "text/csv")}
    response = client.post("/api/dataset/upload", files=files, headers=auth_headers)
    assert response.status_code == 200
    upload_res = response.json()
    new_id = upload_res["dataset_id"]
    assert new_id != DEFAULT_DATASET_ID
    assert upload_res["valid_rows"] == 30

    # Query summary for new dataset
    summary_res = client.get(f"/api/dataset/{new_id}/summary", headers=auth_headers)
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert summary_data["dataset_id"] == new_id
    assert summary_data["total_valid_observations"] == 30

    # Verify default dataset was NOT changed or overwritten
    default_summary = client.get(f"/api/dataset/{DEFAULT_DATASET_ID}/summary", headers=auth_headers).json()
    assert default_summary["total_valid_observations"] == 706


def test_dataset_upload_case_insensitive_and_whitespace_columns(auth_headers):
    """Verify upload handles column capitalization and whitespace trimming properly."""
    csv_text = (
        " date , OPEN , High , low , Close , Volume \n"
        "2024-01-02, 100, 105, 95, 102, 50000\n"
        "2024-01-03, 102, 108, 100, 106, 60000\n"
        "2024-01-04, 106, 110, 104, 105, 55000\n"
        "2024-01-05, 105, 109, 101, 108, 70000\n"
    )
    files = {"file": ("flexible.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    response = client.post("/api/dataset/upload", files=files, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["valid_rows"] == 4


def test_dataset_upload_missing_required_column(auth_headers):
    """Verify upload fails with clear error when required column is missing."""
    csv_text = "Date,Open,High,Low,Volume\n2024-01-02,100,105,95,50000\n"
    files = {"file": ("missing_close.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    response = client.post("/api/dataset/upload", files=files, headers=auth_headers)
    assert response.status_code == 422
    assert "Missing required columns in CSV: Close" in response.json()["detail"]


def test_dataset_upload_invalid_file_extension(auth_headers):
    """Verify non-CSV files are rejected."""
    files = {"file": ("test.txt", io.BytesIO(b"Hello world"), "text/plain")}
    response = client.post("/api/dataset/upload", files=files, headers=auth_headers)
    assert response.status_code == 400
    assert "Only CSV files" in response.json()["detail"]


def test_nonexistent_dataset_returns_404(auth_headers):
    """Verify requesting an unknown dataset ID returns 404."""
    response = client.get("/api/dataset/non_existent_id_123/summary", headers=auth_headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_insufficient_data_for_prediction(auth_headers):
    """Verify meaningful error is returned when dataset has too few rows for ML."""
    csv_text = (
        "Date,Open,High,Low,Close,Volume\n"
        "2024-01-02,100,105,95,102,50000\n"
        "2024-01-03,102,108,100,106,60000\n"
    )
    files = {"file": ("tiny.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")}
    upload_res = client.post("/api/dataset/upload", files=files, headers=auth_headers).json()
    tiny_id = upload_res["dataset_id"]

    pred_res = client.post(f"/api/dataset/{tiny_id}/predict", headers=auth_headers)
    assert pred_res.status_code == 422
    assert "usable rows" in pred_res.json()["detail"].lower()
