const User = require("../models/user");
const Quiz = require("../models/quiz");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Otp = require("../models/otp");
const sendEmail = require("../configs/sendEmail");

// Generate a 16-character random string
function generateRandomString(length = 16) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

// Register user
async function register(req, res) {
    const { email, password, role, name, surname, branch, division, rollNo, year } = req.body;

    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: "Email already registered" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
            role,
            name,
            surname,
            ...(role === "user" && { branch, division, rollNo, year }),
        });
        await newUser.save();

        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

// Login user
async function login(req, res) {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid email or password" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ msg: "Invalid email or password" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "2h",
        });

        res.json({
            token,
            user: {
                email: user.email,
                role: user.role,
                name: user.name,
                surname: user.surname,
                ...(user.role === "user" && { branch: user.branch, division: user.division, rollNo: user.rollNo, year: user.year }),
            },
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

// Refresh token
async function refreshToken(req, res) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const newToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "2h",
        });

        res.json({
            token: newToken,
            user: {
                email: user.email,
                role: user.role,
                name: user.name,
                surname: user.surname,
                ...(user.role === "user" && { branch: user.branch, division: user.division, rollNo: user.rollNo, year: user.year }),
            },
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

// Request OTP for password reset
async function requestPasswordReset(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Save OTP to database
        await Otp.create({ email, otp: hashedOtp });

        // Send OTP via email
        const subject = "UniQ Password Reset OTP";
        const text = `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`;
        await sendEmail(email, subject, text);

        res.status(200).json({ msg: "OTP sent to your email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
}

// Verify OTP and reset password
async function resetPassword(req, res) {
    try {
        const { email, otp, newPassword } = req.body;

        // Find OTP record
        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ msg: "OTP not found or expired" });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }

        // Validate new password
        if (newPassword.length < 8) {
            return res.status(400).json({ msg: "Password must be at least 8 characters long" });
        }

        // Update user password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findOneAndUpdate({ email }, { password: hashedPassword });

        // Delete OTP record
        await Otp.deleteOne({ email });

        res.status(200).json({ msg: "Password reset successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
}

// Get profile
async function getProfile(req, res) {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

// Update profile
async function updateProfile(req, res) {
    const { name, surname, branch, division, rollNo, year } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        user.name = name || user.name;
        user.surname = surname || user.surname;
        if (user.role === "user") {
            user.branch = branch || user.branch;
            user.division = division || user.division;
            user.rollNo = rollNo || user.rollNo;
            user.year = year || user.year;
        }

        await user.save();
        res.json({ msg: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

// Change password
async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(401).json({ msg: "Current password is incorrect" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

// Get all users (for admins only)
async function getAllUsers(req, res) {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ msg: "Access denied. Admins only." });
        }

        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

// Delete user
async function deleteUser(req, res) {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ msg: "Access denied. Admins only." });
        }

        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "User not found" });

        // Prevent admins from deleting other admins
        if (user.role === "admin") {
            return res.status(403).json({ msg: "Admins cannot delete other admin accounts" });
        }

        // Delete quizzes created by the user
        await Quiz.deleteMany({ createdBy: userId });

        await User.findByIdAndDelete(userId);
        res.json({ msg: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

module.exports = {
    register,
    login,
    refreshToken,
    requestPasswordReset,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    deleteUser
};