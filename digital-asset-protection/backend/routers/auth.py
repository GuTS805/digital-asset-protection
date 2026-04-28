import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", "shieldsync-jwt-secret-key-2026")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "shieldsync123")

_security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(_security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    if req.username != ADMIN_USERNAME or req.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return TokenResponse(
        access_token=create_token(req.username),
        username=req.username,
    )


@router.get("/me")
def me(username: str = Depends(verify_token)):
    return {"username": username}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, username: str = Depends(verify_token)):
    if req.current_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    env_path = os.path.join(os.path.dirname(__file__), "../.env")
    try:
        with open(env_path) as f:
            lines = f.readlines()
        with open(env_path, "w") as f:
            for line in lines:
                if line.startswith("ADMIN_PASSWORD="):
                    f.write(f"ADMIN_PASSWORD={req.new_password}\n")
                else:
                    f.write(line)
        # Update in-memory value
        import importlib, sys
        mod = sys.modules.get("routers.auth")
        if mod:
            mod.ADMIN_PASSWORD = req.new_password
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update password: {e}")

    return {"message": "Password updated successfully"}
