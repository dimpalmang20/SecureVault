from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from server.database import get_db_connection
from server.email_service import generate_otp, save_otp, send_otp_email, verify_otp_logic
import sqlite3

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/test", methods=["GET"])
def test_auth():
    return {"message": "Auth blueprint working"}


# ✅ SAFE REGISTER (FIXED)
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    # ✅ Check if email already exists
    c.execute("SELECT id, is_verified FROM users WHERE email = ?", (email,))
    existing_user = c.fetchone()

    # ✅ If user exists and VERIFIED → block registration
    if existing_user and existing_user["is_verified"] == 1:
        conn.close()
        return jsonify({"error": "Email already registered and verified. Please login."}), 409

    # ✅ If user exists but NOT VERIFIED → resend OTP (do not insert again)
    if existing_user and existing_user["is_verified"] == 0:
        try:
            otp = generate_otp()
            save_otp(email, otp)

            sent = send_otp_email(email, otp)
            if not sent:
                conn.close()
                return jsonify({"error": "Failed to send OTP email. Please try again."}), 500

            conn.close()
            return jsonify({"message": "OTP resent. Please verify OTP.", "email": email})

        except Exception as e:
            conn.close()
            return jsonify({"error": f"OTP send failed: {str(e)}"}), 500

    # ✅ New user insert
    password_hash = generate_password_hash(password)

    try:
        c.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash),
        )
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

    # ✅ Now send OTP safely
    try:
        otp = generate_otp()
        save_otp(email, otp)

        sent = send_otp_email(email, otp)
        if not sent:
            # if email sending returns False
            raise Exception("Email send failed")

    except Exception as e:
        # 🔥 IMPORTANT: if OTP sending fails, delete user so they can retry
        try:
            c.execute("DELETE FROM users WHERE email = ?", (email,))
            conn.commit()
        except:
            pass

        conn.close()
        return jsonify({"error": f"OTP send failed: {str(e)}"}), 500

    conn.close()
    return jsonify({"message": "Registration successful. Please verify OTP.", "email": email})


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    email = data.get("email")
    otp = data.get("otp")

    if not email or not otp:
        return jsonify({"error": "Missing fields"}), 400

    success, message = verify_otp_logic(email, otp)
    if not success:
        return jsonify({"error": message}), 400

    conn = get_db_connection()
    c = conn.cursor()

    c.execute("UPDATE users SET is_verified = 1 WHERE email = ?", (email,))
    conn.commit()

    c.execute("SELECT id, username, email FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "User not found after verification"}), 404

    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["email"] = user["email"]
    session.permanent = True

    return jsonify({
        "message": "Account verified and logged in successfully",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        }
    })


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    if not user["is_verified"]:
        return jsonify({
            "error": "Account not verified. Please verify OTP.",
            "email": email,
            "needs_verification": True
        }), 403

    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["email"] = user["email"]
    session.permanent = True

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        }
    })


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@auth_bp.route("/profile", methods=["GET"])
def profile():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("SELECT username, email, created_at FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()

    c.execute(
        "SELECT COUNT(*) as count, SUM(file_size) as total_size FROM files WHERE user_id = ?",
        (user_id,)
    )
    stats = c.fetchone()

    conn.close()

    if not user:
        session.clear()
        return jsonify({"error": "User not found"}), 404

    # ✅ safe stats fallback
    total_files = stats["count"] if stats and stats["count"] else 0
    used_storage = stats["total_size"] if stats and stats["total_size"] else 0

    return jsonify({
        "username": user["username"],
        "email": user["email"],
        "total_files": total_files,
        "used_storage": used_storage
    })