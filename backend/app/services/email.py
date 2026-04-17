"""Email service for sending transactional emails."""

from typing import Any

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import get_settings


class EmailService:
    """Service for sending emails."""

    def __init__(self):
        settings = get_settings()
        self.smtp_host = getattr(settings, "smtp_host", "")
        self.smtp_port = getattr(settings, "smtp_port", 587)
        self.smtp_user = getattr(settings, "smtp_user", "")
        self.smtp_password = getattr(settings, "smtp_password", "")
        self.smtp_from = getattr(settings, "smtp_from", "noreply@example.com")
        self.frontend_url = getattr(settings, "frontend_url", "http://localhost:3000")
        self.enabled = all([self.smtp_host, self.smtp_user, self.smtp_password])

    async def _send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str | None = None,
    ) -> bool:
        """Send an email.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content
            text_content: Plain text content (optional)

        Returns:
            True if email was sent successfully
        """
        if not self.enabled:
            # Email not configured, log and return
            print(f"[EMAIL] Would send to {to_email}: {subject}")
            print(f"[EMAIL] HTML: {html_content[:200]}...")
            return True

        try:
            message = MIMEMultipart("alternative")
            message["From"] = self.smtp_from
            message["To"] = to_email
            message["Subject"] = subject

            # Add text part if provided
            if text_content:
                message.attach(MIMEText(text_content, "plain"))

            # Add HTML part
            message.attach(MIMEText(html_content, "html"))

            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True,
            )

            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    async def send_verification_email(self, email: str, token: str) -> bool:
        """Send email verification email.

        Args:
            email: Recipient email address
            token: Verification token

        Returns:
            True if email was sent successfully
        """
        verification_url = f"{self.frontend_url}/verify-email?token={token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Verify Your Email</h1>
                <p>Thank you for registering! Please click the button below to verify your email address:</p>
                <a href="{verification_url}" class="button">Verify Email</a>
                <p>Or copy and paste this link into your browser:</p>
                <p>{verification_url}</p>
                <p>This link will expire in 24 hours.</p>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Verify Your Email

        Thank you for registering! Please visit the following link to verify your email address:

        {verification_url}

        This link will expire in 24 hours.
        """

        return await self._send_email(
            email,
            "Verify Your Email",
            html_content,
            text_content,
        )

    async def send_password_reset_email(self, email: str, token: str) -> bool:
        """Send password reset email.

        Args:
            email: Recipient email address
            token: Reset token

        Returns:
            True if email was sent successfully
        """
        reset_url = f"{self.frontend_url}/reset-password?token={token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #dc3545;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 20px 0;
                }}
                .warning {{
                    color: #856404;
                    background-color: #fff3cd;
                    padding: 10px;
                    border-radius: 4px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Password Reset Request</h1>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="{reset_url}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p>{reset_url}</p>
                <div class="warning">
                    <strong>Important:</strong> This link will expire in 24 hours.
                    If you didn't request this, please ignore this email.
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Password Reset Request

        We received a request to reset your password. Please visit the following link to create a new password:

        {reset_url}

        This link will expire in 24 hours.

        If you didn't request this, please ignore this email.
        """

        return await self._send_email(
            email,
            "Password Reset Request",
            html_content,
            text_content,
        )

    async def send_welcome_email(self, email: str, username: str | None = None) -> bool:
        """Send welcome email after verification.

        Args:
            email: Recipient email address
            username: User's username (optional)

        Returns:
            True if email was sent successfully
        """
        name = username or "there"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to SIGINT Wiki!</h1>
                <p>Hi {name},</p>
                <p>Your email has been verified and your account is now active.</p>
                <p>You can now log in and start exploring the wiki.</p>
                <p>Best regards,<br>The SIGINT Wiki Team</p>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Welcome to SIGINT Wiki!

        Hi {name},

        Your email has been verified and your account is now active.
        You can now log in and start exploring the wiki.

        Best regards,
        The SIGINT Wiki Team
        """

        return await self._send_email(
            email,
            "Welcome to SIGINT Wiki!",
            html_content,
            text_content,
        )
