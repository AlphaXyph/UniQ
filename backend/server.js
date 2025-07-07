const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./configs/db");

dotenv.config(); // Load .env
connectDB();     // Connect to MongoDB

const app = express();
app.use(cors());
app.use(express.json()); // Body parser for JSON

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/quiz", require("./routes/quizRoutes"));
app.use("/api/result", require("./routes/resultRoutes"));
app.use("/api/admin-register-url", require("./routes/adminRegisterRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));