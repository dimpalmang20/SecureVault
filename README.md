🔐 SecureVault – Secure File Server (OTP Verified)

SecureVault is a secure multi-user file server web application where users can register, verify their email using OTP, login securely, and manage their personal file vault.

Each user gets a private isolated storage space, and only the logged-in user can access their uploaded files.

🚀 Features

✅ User Registration (Signup)
✅ Email OTP Verification (Real Gmail SMTP)
✅ Secure Login (Session-based Authentication)
✅ User Profile Dashboard (username, email, storage stats)
✅ Upload Files (up to 100MB)
✅ Download Files
✅ Delete Files
✅ Per-user file isolation (each user sees only their files)
✅ SQLite database storage for users + OTP + file metadata

🧠 Project Goal

In real organizations, teams need a centralized system to share and manage files securely.
This project simulates a real-world secure vault system where users can authenticate using OTP and store their files safely.

SecureVault provides:

Centralized file management

Secure user authentication

Private file access control

Data persistence using database

🛠 Tech Stack
✅ Frontend

React + TypeScript

Tailwind CSS

shadcn/ui + Radix UI (modern accessible UI components)

Framer Motion (smooth animations)

Wouter (lightweight routing)

Vite (fast development & build tool)

Lucide Icons

✅ Backend

Python Flask (REST API server)

Flask-CORS (frontend-backend communication)

SMTP Gmail (sending OTP email)

Session-based authentication using Flask session cookies

✅ Database & Storage

SQLite Database (securevault.db)

Stores: users, OTPs, files metadata

Local file storage

Stored under: server/uploads/user_<id>/

📂 Folder Structure
Secure-File-Server/
│
├── client/                     # Frontend React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── login.tsx        # Login page
│   │   │   ├── register.tsx     # Register + OTP verification UI
│   │   │   ├── dashboard.tsx    # File management dashboard
│   │   │   └── not-found.tsx    # 404 page
│   │   ├── lib/
│   │   │   └── queryClient.ts   # API requests + credentials handling
│   │   ├── App.tsx              # Routing setup
│   │   └── main.tsx             # Entry point
│   └── index.html
│
├── server/                      # Flask Backend API
│   ├── app.py                   # Flask main app
│   ├── auth.py                  # Register/Login/OTP/Profile routes
│   ├── files.py                 # Upload/Download/Delete routes
│   ├── database.py              # SQLite connection + DB init
│   ├── email_service.py         # OTP generation + email sending
│   ├── securevault.db           # SQLite database file
│   └── uploads/                 # Uploaded files stored per user
│
├── vite.config.ts               # Vite frontend config + proxy
├── package.json                 # dependencies & scripts
└── README.md

✅ How Authentication Works (Real OTP Flow)
🔹 Registration Flow

User enters username + email + password

Backend stores user in SQLite (unverified state)

OTP is generated and stored in otps table

OTP is sent to user’s Gmail using SMTP

User enters OTP → Account verified

🔹 Login Flow

User logs in with email + password

Password is checked using hashed password validation

Session cookie is created (session['user_id'])

User stays logged in until logout

🗃 Database Tables (SQLite)

SQLite database file:
📍 server/securevault.db

Tables used:

users

id, username, email, password_hash, is_verified, created_at

otps

email, otp, expiry_time

files

id, user_id, original_name, file_path, file_size, uploaded_at, mime_type

💾 File Storage Isolation

Files are stored like this:

server/uploads/
   ├── user_1/
   │     ├── file1.pdf
   │     └── image.png
   ├── user_2/
   │     └── report.docx


✅ Only that user can access those files
✅ File metadata is linked using user_id in SQLite table

⚙️ Setup & Run Locally (Step-by-Step)
✅ 1) Clone Repository
git clone <your-github-repo-link>
cd Secure-File-Server

✅ 2) Setup Python Backend
🔹 Create & Activate Virtual Environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

🔹 Install Backend Packages
pip install flask flask-cors python-dotenv werkzeug

✅ 3) Configure Gmail SMTP (OTP Email Sending)
🔹 Enable App Password

Go to:
✅ Google Account → Security → App passwords
Generate a password (16-digit)

🔹 Set Environment Variables in PowerShell

Run this inside your project folder:

✅ 4) Start Backend Server
python -m server.app

Backend runs at:
✅ http://localhost:5000

✅ 5) Start Frontend (React)

Open a new terminal (same project folder):

npm install
npm run dev


Frontend runs at:
✅ http://localhost:5173

🔁 Vite Proxy Setup (Frontend to Backend)

In vite.config.ts, proxy is used:

proxy: {
  "/api": {
    target: "http://localhost:5000",
    changeOrigin: true,
    secure: false,
  }
}


✅ This avoids CORS issues
✅ Frontend can directly call /api/register, /api/login, etc.

📌 API Endpoints
✅ Auth APIs
Method	Endpoint	Description
POST	/api/register	Register new user + send OTP
POST	/api/verify-otp	Verify OTP & activate account
POST	/api/login	Login user
POST	/api/logout	Logout user
GET	/api/profile	Get logged-in user profile
✅ File APIs
Method	Endpoint	Description
POST	/api/upload	Upload file
GET	/api/files	List my files
GET	/api/download/<id>	Download file
DELETE	/api/delete/<id>	Delete file
📸 Screenshots (Add yours)

You can add images like:

/screenshots/login.png
/screenshots/register.png
/screenshots/dashboard.png


Then in README:

## Screenshots
### Login Page
![Login](screenshots/login.png)

### Dashboard Page
![Dashboard](screenshots/dashboard.png)

✅ Future Improvements (Optional Enhancements)

🔁 Resend OTP button with cooldown timer

🔐 Password reset feature

🗂 Folder management

🔒 File encryption at rest

👨‍💼 Admin dashboard

☁️ Cloud storage integration (AWS S3 / Azure)
