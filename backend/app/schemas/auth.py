from pydantic import BaseModel, EmailStr, Field


class SignUpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full user name")
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (minimum 6 characters)")
    confirm_password: str = Field(..., min_length=6, max_length=128, description="Confirmation password")


class LoginRequest(BaseModel):
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserResponse(BaseModel):
    id: int
    name: str
    email: str


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str


class MessageResponse(BaseModel):
    message: str
