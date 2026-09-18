import sys
from getpass import getpass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy.orm import Session

from backend.app.core.security import hash_password
from backend.app.db.session import SessionLocal
from backend.app.models.user import User


def main() -> None:
    print("RiskPulse AI - Create Analyst User")
    print("-" * 40)

    name = input("Name: ").strip()
    email = input("Email: ").strip().lower()
    password = getpass("Password: ")
    confirm_password = getpass("Confirm password: ")

    if not name:
        raise ValueError("Name cannot be empty.")

    if not email:
        raise ValueError("Email cannot be empty.")

    if len(password) < 8:
        raise ValueError(
            "Password must contain at least 8 characters."
        )

    if password != confirm_password:
        raise ValueError("Passwords do not match.")

    db: Session = SessionLocal()

    try:
        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            raise ValueError(
                f"A user with email '{email}' already exists."
            )

        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role="Transaction Risk Analyst",
            is_active=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print()
        print("User created successfully.")
        print(f"ID: {user.id}")
        print(f"Name: {user.name}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()