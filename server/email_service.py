import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import random
import time
from server.database import get_db_connection


# ================= CONFIG =================
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
OTP_EXPIRY_SECONDS = 300  # 5 minutes
# =========================================


def generate_otp():
    return str(random.randint(100000, 999999))


def save_otp(email, otp):
    conn = get_db_connection()
    c = conn.cursor()
    expiry = time.time() + OTP_EXPIRY_SECONDS
    c.execute(
        "INSERT OR REPLACE INTO otps (email, otp, expiry_time) VALUES (?, ?, ?)",
        (email, otp, expiry),
    )
    conn.commit()
    conn.close()


def verify_otp_logic(email, otp):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT otp, expiry_time FROM otps WHERE email = ?", (email,))
    row = c.fetchone()
    conn.close()

    if not row:
        return False, "No OTP found for this email."

    stored_otp = row["otp"]
    expiry = row["expiry_time"]

    if time.time() > expiry:
        return False, "OTP has expired."

    if stored_otp != otp:
        return False, "Invalid OTP."

    return True, "OTP verified."


def send_otp_email(to_email, otp):
    # 🔐 REAL SMTP ONLY — NO MOCK MODE
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise Exception("SMTP not configured. Set environment variables.")

    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USERNAME
        msg["To"] = to_email
        msg["Subject"] = "SecureVault Verification Code"

        body = f"""
Your SecureVault verification code is:

{otp}

This code expires in 5 minutes.

If you did not request this, please ignore this email.
"""
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, to_email, msg.as_string())
        server.quit()

        return True

    except Exception as e:
        print("EMAIL SEND FAILED:", e)
        return False
