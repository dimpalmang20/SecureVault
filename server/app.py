from flask import Flask
from dotenv import load_dotenv
load_dotenv()


from server.auth import auth_bp
from server.files import files_bp
from server.database import init_db
import os
from datetime import timedelta

app = Flask(__name__)

# ------------------ CONFIG ------------------
app.config['SECRET_KEY'] = 'securevault-secret-key'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB

# ------------------ CORS ------------------


# ------------------ FOLDERS ------------------
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ------------------ BLUEPRINTS ------------------
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(files_bp, url_prefix='/api')

# ------------------ DB INIT ------------------
with app.app_context():
    init_db()

# ------------------ TEST ROUTE ------------------
@app.route('/')
def index():
    return "SecureVault Backend is Running!"

# ------------------ RUN ------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
