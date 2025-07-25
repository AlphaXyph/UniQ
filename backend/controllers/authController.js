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

// Validate email format and domain
const validateEmail = (email) => {
    const lowerCaseEmail = email.toLowerCase().trim();
    if (!lowerCaseEmail) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lowerCaseEmail)) return "Invalid email format";
    if (!lowerCaseEmail.endsWith("@ves.ac.in")) return "Email must end with @ves.ac.in";
    return "";
};

// Validate password
const validatePassword = (password) => {
    const trimmedPassword = password.trim();
    if (!trimmedPassword) return "Password is required";
    if (trimmedPassword.length < 8) return "Password must be at least 8 characters long";
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%_*?&])[A-Za-z\d@$!%_*?&]{8,}$/;
    if (!passwordRegex.test(trimmedPassword)) {
        return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
    }
    return "";
};

// Register user
async function register(req, res) {
    const { email, password, role, name, surname, branch, division, rollNo, year } = req.body;

    try {
        // Validate email
        const emailError = validateEmail(email);
        if (emailError) return res.status(400).json({ msg: emailError });

        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) return res.status(400).json({ msg: passwordError });

        // Validate role
        if (!["admin", "user"].includes(role)) {
            return res.status(400).json({ msg: "Role must be admin or user" });
        }

        // Validate fields for user role
        if (role === "user") {
            if (!name || name.trim().length > 20) {
                return res.status(400).json({ msg: "Name is required and must be 20 characters or less" });
            }
            if (!surname || surname.trim().length > 20) {
                return res.status(400).json({ msg: "Surname is required and must be 20 characters or less" });
            }
            if (!branch || branch.trim().length > 4) {
                return res.status(400).json({ msg: "Branch is required and must be 4 characters or less" });
            }
            if (!["A", "B", "C", "D"].includes(division)) {
                return res.status(400).json({ msg: "Division must be one of A, B, C, or D" });
            }
            if (!rollNo || isNaN(rollNo) || rollNo < 1 || rollNo > 999) {
                return res.status(400).json({ msg: "Roll No is required and must be a number between 1 and 999" });
            }
            if (!["FY", "SY", "TY", "FOURTH"].includes(year)) {
                return res.status(400).json({ msg: "Year must be one of FY, SY, TY, or FOURTH" });
            }
        }

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) return res.status(400).json({ msg: "Email already registered" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password.trim(), salt);

        const newUser = new User({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role,
            name: name ? name.trim() : undefined,
            surname: surname ? surname.trim() : undefined,
            ...(role === "user" && {
                branch: branch ? branch.trim().toUpperCase() : undefined,
                division,
                rollNo: Number(rollNo), // Ensure rollNo is a number
                year,
            }),
        });

        await newUser.save();
        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        console.error("Register error:", err.message);
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
}

// Login user
async function login(req, res) {
    const { email, password } = req.body;

    try {
        // Validate email
        const emailError = validateEmail(email);
        if (emailError) return res.status(400).json({ msg: emailError });

        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) return res.status(400).json({ msg: passwordError });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
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
                ...(user.role === "user" && {
                    branch: user.branch,
                    division: user.division,
                    rollNo: user.rollNo,
                    year: user.year,
                    lastProfileUpdate: user.lastProfileUpdate, // Include lastProfileUpdate
                }),
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
                ...(user.role === "user" && {
                    branch: user.branch,
                    division: user.division,
                    rollNo: user.rollNo,
                    year: user.year,
                    lastProfileUpdate: user.lastProfileUpdate, // Include lastProfileUpdate
                }),
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

        // Validate email
        const emailError = validateEmail(email);
        if (emailError) return res.status(400).json({ msg: emailError });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
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

        // Validate email
        const emailError = validateEmail(email);
        if (emailError) return res.status(400).json({ msg: emailError });

        // Validate new password
        const passwordError = validatePassword(newPassword);
        if (passwordError) return res.status(400).json({ msg: passwordError });

        // Find OTP record
        const otpRecord = await Otp.findOne({ email: email.toLowerCase().trim() });
        if (!otpRecord) {
            return res.status(400).json({ msg: "OTP not found or expired" });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }

        // Update user password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findOneAndUpdate({ email: email.toLowerCase().trim() }, { password: hashedPassword });

        // Delete OTP record
        await Otp.deleteOne({ email: email.toLowerCase().trim() });

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
        res.json({
            email: user.email,
            role: user.role,
            name: user.name,
            surname: user.surname,
            ...(user.role === "user" && {
                branch: user.branch,
                division: user.division,
                rollNo: user.rollNo,
                year: user.year,
                lastProfileUpdate: user.lastProfileUpdate, // Include lastProfileUpdate
            }),
        });
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

        // Validate division for user role
        if (user.role === "user" && division && !["A", "B", "C", "D"].includes(division)) {
            return res.status(400).json({ msg: "Division must be one of A, B, C, or D" });
        }

        // Check if 7 days have passed since last profile update
        if (user.lastProfileUpdate) {
            const now = new Date();
            const lastUpdate = new Date(user.lastProfileUpdate);
            const daysSinceLastUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
            if (daysSinceLastUpdate < 7) {
                return res.status(403).json({ msg: "You can only update your profile once every 7 days" });
            }
        }

        user.name = name || user.name;
        user.surname = surname || user.surname;
        if (user.role === "user") {
            user.branch = branch || user.branch;
            user.division = division || user.division;
            user.rollNo = rollNo || user.rollNo;
            user.year = year || user.year;
        }

        user.lastProfileUpdate = new Date(); // Update timestamp
        await user.save();
        res.json({ msg: "Profile updated successfully", lastProfileUpdate: user.lastProfileUpdate });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    try {
        // Check for missing fields
        if (!currentPassword) {
            return res.status(400).json({ msg: "Current password is required" });
        }
        if (!newPassword) {
            return res.status(400).json({ msg: "New password is required" });
        }

        // Validate new password
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ msg: passwordError });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).json({ msg: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: "Password changed successfully" });
    } catch (err) {
        console.error("Change password error:", err.message);
        res.status(500).json({ msg: "Server error: " + err.message });
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