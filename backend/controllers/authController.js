const User = require("../models/user");
const Quiz = require("../models/quiz");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate a 16-character random string
function generateRandomString(length = 16) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

// Register user
exports.register = async (req, res) => {
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
};

// Login user
exports.login = async (req, res) => {
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
};

// Get profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
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
};

// Change password
exports.changePassword = async (req, res) => {
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
};

// Get all users (for admins only)
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ msg: "Access denied. Admins only." });
        }

        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
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
};