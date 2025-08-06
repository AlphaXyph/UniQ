# 🧠 UniQ – University Quiz App

A full-stack **MERN application** to conduct MCQ-based quizzes securely within a university environment — replacing Google Forms and addressing challenges like cheating through AI tools.

Currently being adopted at **VESIT MCA Department**, Mumbai.

## 📦 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v3
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (access + refresh) + bcrypt
- **File Handling**: PapaParse (CSV import), Multer (uploads), Cloudinary (image storage)
- **Email Services**: Nodemailer (OTP-based registration & password reset)

## 🚀 Key Features

- 👨‍🏫 **Admin/Teacher Panel**

  - Create/edit quizzes (manual or CSV)
  - Generate quizzes via AI chatbot (Gemini API)
  - View reports, analytics & responses
  - Set visibility delays (e.g., 6 hours after submission)
  - Target quizzes by year, branch, division
  - Manage user roles securely
  - Dynamic admin registration URL (auto-refreshes every 3 hours)
  - Pause/resume URL access for added control

- 👨‍🎓 **Student/User Panel**

  - Secure registration via email OTP
  - Attempt quizzes in full-screen mode
  - View personal results (with 6-hour delay)
  - Edit profile (cooldown enforced for misuse protection)

- 🔒 **Security & Anti-Cheating**

  - Full-screen enforcement, tab/split screen detection
  - Session management with heartbeat monitoring
  - Auto-submit on major violations (tab change, inactivity, etc.)
  - Token refresh system for long quizzes
  - One active session allowed per user

- 📊 **Report Management**

  - View, filter, and sort quiz responses
  - Submission types: Submitted / Timeout / Tab Changed / Split-Screen / Disconnected, etc.
  - Bulk delete reports to allow re-attempts
  - Advanced filters (name, email, subject, dates, year/branch/division)

- ✅ **Miscellaneous**
  - Clean mobile-responsive UI (Tailwind)
  - Separate `.env` setup for backend/frontend
  - Supports both development and deployment setups
  - All logic is validated on both frontend & backend
  - Separate quiz editing, result viewing, and answer review pages

## 🛠️ Setup Instructions

```bash
# 1. Clone the Repository
git clone https://github.com/yourusername/UniQ.git
cd UniQ

# 2. Install Dependencies
cd frontend
npm install
cd ../backend
npm install

# 3. Configure Environment Variables
cp backend/.env.example backend/.env
```

Then, fill in `backend/.env` with:

- `MONGO_URI`
- `JWT_SECRET`
- `EMAIL_USER`, `EMAIL_PASS`
- `CLOUDINARY_*` keys

```bash
# 4. Run the App Locally
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

## ✅ Login Roles

- **Admin/Teacher**: Quiz creation, results, user management
- **Student**: Attempt quizzes, view results (after delay)

_Test credentials should be removed before sharing._

## 📎 Sample CSV Format

```csv
question,optionA,optionB,optionC,optionD,correct
What is 2+2?,2,3,4,5,4
Capital of India?,Mumbai,Delhi,Kolkata,Chennai,Delhi
```

## 🧪 Admin Register URL

- Rotates every 3 hours with a secure 16-character random string
- Can be paused/resumed
- Only one URL active at a time (stored in DB for fallback)
- Prevents unauthorized admin registrations

## 🔐 Security Highlights

- OTP for account setup & password reset
- Prevents full-screen exit, tab changes, and split-screen
- Session tokens with auto-refresh before expiry
- Backend-enforced validation for all actions
- One-device login enforcement during exams

## 👨‍🏫 Made For

A final-year MCA project at **VESIT** (University of Mumbai) to:

- Conduct secure online MCQ exams
- Prevent misuse of AI tools like ChatGPT
- Provide real-time analytics and data visibility to teachers
- Simplify and automate academic assessments within colleges

## 📜 License

```
This project is licensed for **educational and institutional use only**.

🛑 Redistribution, commercial resale, or unauthorized public deployment is strictly prohibited.

The source code is provided to **VESIT MCA Department** for internal academic use, continuation by future batches, and learning purposes only.

All rights remain with the original developer.

© 2025 Bharat Patel
```
