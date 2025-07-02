const User = require("../models/User");
const Quiz = require("../models/Quiz");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminRegisterURL = require("../models/AdminRegisterURL");
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

// Get the current admin registration URL
exports.getCurrentURL = async (req, res) => {
    try {
        console.log("getCurrentURL: Fetching AdminRegisterURL...");
        let currentURL = await AdminRegisterURL.findOne();

        // Log current time and expiresAt for debugging
        const now = new Date();
        console.log("getCurrentURL: Current server time (UTC):", now.toISOString());
        if (currentURL) {
            console.log("getCurrentURL: Found URL expiresAt (UTC):", currentURL.expiresAt.toISOString());
        }

        if (!currentURL) {
            console.log("getCurrentURL: No URL found, creating new one...");
            const randomString = generateRandomString();
            const newURL = `/admin-register/${randomString}`;
            const newAdminURL = new AdminRegisterURL({
                url: newURL,
                randomString,
                expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
                isActive: true,
            });
            await newAdminURL.save();
            console.log("getCurrentURL: New URL saved:", newAdminURL);
            return res.json(newAdminURL);
        }

        console.log("getCurrentURL: Found existing URL:", currentURL);
        res.json(currentURL);
    } catch (err) {
        console.error("getCurrentURL: Error:", err.message, err.stack);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// Regenerate a new URL
exports.regenerateURL = async (req, res) => {
    try {
        console.log("regenerateURL: Regenerating AdminRegisterURL...");
        const randomString = generateRandomString();
        const newURL = `/admin-register/${randomString}`;
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours

        // Delete all existing AdminRegisterURL documents to invalidate old URLs
        await AdminRegisterURL.deleteMany({});
        console.log("regenerateURL: Cleared all existing AdminRegisterURL documents");

        // Create a new AdminRegisterURL document
        const newAdminURL = new AdminRegisterURL({
            url: newURL,
            randomString,
            expiresAt,
            isActive: true,
        });
        await newAdminURL.save();
        console.log("regenerateURL: New URL created:", newAdminURL);

        res.json(newAdminURL);
    } catch (err) {
        console.error("regenerateURL: Error:", err.message, err.stack);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// Toggle active status (pause/resume)
exports.toggleActive = async (req, res) => {
    try {
        console.log("toggleActive: Toggling AdminRegisterURL active status...");
        const currentURL = await AdminRegisterURL.findOne();
        if (!currentURL) {
            console.log("toggleActive: No URL found");
            return res.status(404).json({ msg: "No admin register URL found" });
        }
        currentURL.isActive = !currentURL.isActive;
        await currentURL.save();
        console.log("toggleActive: URL status updated:", currentURL);
        res.json(currentURL);
    } catch (err) {
        console.error("toggleActive: Error:", err.message, err.stack);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// Admin register
exports.adminRegister = async (req, res) => {
    const { email, password, name, surname, randomString } = req.body;

    try {
        // Verify the randomString
        const adminRegisterURL = await AdminRegisterURL.findOne({ randomString, isActive: true });
        if (!adminRegisterURL || adminRegisterURL.expiresAt < Date.now()) {
            return res.status(403).json({ msg: "Invalid or expired registration URL" });
        }

        // Check if email already exists
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: "Email already registered" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin user
        const newUser = new User({
            email,
            password: hashedPassword,
            role: "admin",
            name,
            surname,
        });
        await newUser.save();

        res.status(201).json({ msg: "Admin registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};

// Validate admin URL
exports.validateAdminUrl = async (req, res) => {
    const { randomString } = req.body;

    try {
        const adminRegisterURL = await AdminRegisterURL.findOne({ randomString, isActive: true });
        if (!adminRegisterURL || adminRegisterURL.expiresAt < Date.now()) {
            return res.status(403).json({ msg: "Invalid or expired registration URL" });
        }
        res.status(200).json({ msg: "URL is valid" });
    } catch (err) {
        console.error(err);
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