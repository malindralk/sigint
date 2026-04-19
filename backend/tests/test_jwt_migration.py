"""Tests for PyJWT migration from python-jose.

Verifies that JWT encode/decode, expiration claims, custom claims,
and signature validation all work correctly with PyJWT.
"""

import time
from datetime import datetime, timedelta, timezone

import jwt
import pytest


# Test constants
SECRET_KEY = "test-secret-key-for-jwt-migration"
WRONG_SECRET_KEY = "wrong-secret-key-should-fail"
ALGORITHM = "HS256"


class TestJWTEncodeDecode:
    """Test basic JWT encode/decode with PyJWT."""

    def test_encode_returns_string(self):
        """PyJWT encode() should return a string (not bytes)."""
        payload = {"sub": "user123", "role": "admin"}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        assert isinstance(token, str)

    def test_decode_returns_payload(self):
        """Decoding a valid token should return the original payload."""
        payload = {"sub": "user123", "role": "admin"}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "user123"
        assert decoded["role"] == "admin"

    def test_roundtrip_preserves_claims(self):
        """Encoding then decoding should preserve all claims."""
        payload = {
            "sub": "550e8400-e29b-41d4-a716-446655440000",
            "role": "editor",
            "type": "access",
            "jti": "abc123def456",
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == payload["sub"]
        assert decoded["role"] == payload["role"]
        assert decoded["type"] == payload["type"]
        assert decoded["jti"] == payload["jti"]


class TestExpirationClaims:
    """Test that expiration claims work correctly with PyJWT."""

    def test_valid_expiration_accepted(self):
        """A token with future expiration should decode successfully."""
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        payload = {"sub": "user123", "exp": expire}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "user123"

    def test_expired_token_raises_error(self):
        """A token with past expiration should raise ExpiredSignatureError."""
        expire = datetime.now(timezone.utc) - timedelta(minutes=1)
        payload = {"sub": "user123", "exp": expire}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    def test_iat_claim_preserved(self):
        """The 'iat' (issued at) claim should be preserved after decode."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=15)
        payload = {
            "sub": "user123",
            "exp": expire,
            "iat": now,
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "iat" in decoded
        assert "exp" in decoded

    def test_exp_claim_is_numeric(self):
        """The 'exp' claim should be a numeric timestamp after decode."""
        expire = datetime.now(timezone.utc) + timedelta(hours=1)
        payload = {"sub": "user123", "exp": expire}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert isinstance(decoded["exp"], (int, float))


class TestCustomClaims:
    """Test that custom claims are preserved through encode/decode."""

    def test_uuid_string_claim(self):
        """UUID string claims should be preserved."""
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        payload = {"sub": user_id, "type": "access"}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == user_id

    def test_role_claim(self):
        """Role claims should be preserved."""
        payload = {"sub": "user123", "role": "admin"}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["role"] == "admin"

    def test_token_type_claim(self):
        """Token type claims (access/refresh) should be preserved."""
        for token_type in ["access", "refresh"]:
            payload = {"sub": "user123", "type": token_type}
            token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
            decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            assert decoded["type"] == token_type

    def test_jti_claim(self):
        """JTI (JWT ID) claims should be preserved."""
        jti = "a1b2c3d4e5f6"
        payload = {"sub": "user123", "jti": jti}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["jti"] == jti

    def test_full_access_token_payload(self):
        """A full access token payload matching the app should work."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=15)
        payload = {
            "sub": "550e8400-e29b-41d4-a716-446655440000",
            "role": "admin",
            "exp": expire,
            "iat": now,
            "jti": "abc123def456789012345678",
            "type": "access",
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == payload["sub"]
        assert decoded["role"] == payload["role"]
        assert decoded["type"] == payload["type"]
        assert decoded["jti"] == payload["jti"]

    def test_full_refresh_token_payload(self):
        """A full refresh token payload matching the app should work."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(days=7)
        payload = {
            "sub": "550e8400-e29b-41d4-a716-446655440000",
            "exp": expire,
            "iat": now,
            "jti": "abc123def456789012345678",
            "type": "refresh",
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == payload["sub"]
        assert decoded["type"] == payload["type"]
        assert decoded["jti"] == payload["jti"]


class TestSignatureValidation:
    """Test that signature validation works correctly."""

    def test_wrong_key_raises_error(self):
        """Decoding with the wrong secret key should raise InvalidSignatureError."""
        payload = {"sub": "user123", "role": "admin"}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, WRONG_SECRET_KEY, algorithms=[ALGORITHM])

    def test_wrong_key_is_invalid_token_error_subclass(self):
        """InvalidSignatureError should be a subclass of InvalidTokenError."""
        payload = {"sub": "user123"}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        with pytest.raises(jwt.InvalidTokenError):
            jwt.decode(token, WRONG_SECRET_KEY, algorithms=[ALGORITHM])

    def test_tampered_token_fails(self):
        """A tampered token should fail validation."""
        payload = {"sub": "user123", "role": "admin"}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        # Tamper with the payload section (middle part)
        parts = token.split(".")
        # Flip a character in the payload
        tampered_payload = parts[1][:-1] + ("A" if parts[1][-1] != "A" else "B")
        tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"
        with pytest.raises(jwt.InvalidTokenError):
            jwt.decode(tampered_token, SECRET_KEY, algorithms=[ALGORITHM])

    def test_correct_key_succeeds(self):
        """Decoding with the correct key should succeed."""
        payload = {"sub": "user123", "role": "admin"}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "user123"

    def test_algorithm_must_match(self):
        """Decoding with a different algorithm list should fail if not matching."""
        payload = {"sub": "user123"}
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        # Trying to decode expecting only HS384 should fail
        with pytest.raises(jwt.InvalidAlgorithmError):
            jwt.decode(token, SECRET_KEY, algorithms=["HS384"])


class TestPyJWTErrorHierarchy:
    """Test that PyJWT error types work as expected for our error handling."""

    def test_expired_signature_is_invalid_token(self):
        """ExpiredSignatureError should be caught by InvalidTokenError."""
        expire = datetime.now(timezone.utc) - timedelta(minutes=1)
        payload = {"sub": "user123", "exp": expire}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        # This confirms our catch clause in security.py works:
        # except (jwt.ExpiredSignatureError, jwt.InvalidTokenError)
        with pytest.raises(jwt.InvalidTokenError):
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    def test_decode_complete_returns_dict(self):
        """jwt.decode should return a dict payload."""
        payload = {"sub": "user123"}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert isinstance(decoded, dict)
