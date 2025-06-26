# 🧠 UniQ – University Quiz App

A full-stack MERN application to conduct MCQ-based quizzes securely within a university network — replacing Google Forms.

## 📦 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v3
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Auth**: JWT + bcrypt
- **Other Tools**: Axios, React Router, PapaParse (CSV import)

---

## 🚀 Features

- 👩‍🏫 Teacher/Admin registration with quiz creation
- 👨‍🎓 Student registration and secure login
- 📝 Upload quiz questions via CSV or manual form
- 🕒 Quiz timer (in minutes)
- 📊 Admin reports: results for all students
- ✅ Secure local hosting (prevent AI/Cheating)
- 📱 Mobile-responsive dashboard

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/UniQ.git
cd UniQ
```

### 2. Install Frontend & Backend Dependencies

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example file and add your values
cp backend/.env.example backend/.env
```

Fill in:

- MongoDB connection string
- JWT secret key

---

### 4. Run the App Locally

In **two terminals**:

```bash
# Terminal 1 - backend
cd backend
npm start

# Terminal 2 - frontend
cd frontend
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## ✅ Login Roles

- `Admin/Teacher`: Can create quizzes, see reports
- `Student`: Can only attempt quizzes, see results

---

## 📎 Notes

- Works inside private college network
- No external internet needed to take test
- Minimal UI, student-friendly

---

## 🧪 Sample CSV Format (for uploading quiz)

```
question,optionA,optionB,optionC,optionD,correct
What is 2+2?,2,3,4,5,4
Capital of India?,Mumbai,Delhi,Kolkata,Chennai,Delhi
```

---

## 👨‍🏫 Made For

College project presentation with a focus on security, usability & speed for classroom MCQ exams.
