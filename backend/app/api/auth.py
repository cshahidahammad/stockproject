from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    SignUpRequest,
    UserResponse,
)
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency to enforce authenticated access via Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split("Bearer ", 1)[1].strip()
    user = auth_service.get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpRequest) -> AuthResponse:
    """Register a new user account with secure password hashing."""
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )

    try:
        user = auth_service.create_user(
            name=payload.name,
            email=payload.email,
            password=payload.password,
        )
        token = auth_service.create_session(user["id"])
        return AuthResponse(
            user=UserResponse(**user),
            token=token,
            message="Account successfully created.",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    """Authenticate user with email and password, returning a session token."""
    try:
        user = auth_service.authenticate_user(
            email=payload.email,
            password=payload.password,
        )
        token = auth_service.create_session(user["id"])
        return AuthResponse(
            user=UserResponse(**user),
            token=token,
            message="Successfully authenticated.",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/logout", response_model=MessageResponse)
def logout(authorization: Optional[str] = Header(None)) -> MessageResponse:
    """Invalidate and delete the caller's active session token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        auth_service.delete_session(token)
    return MessageResponse(message="Successfully signed out.")


@router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)) -> UserResponse:
    """Retrieve profile of the currently authenticated user."""
    return UserResponse(**user)
