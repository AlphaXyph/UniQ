const AdminRegisterURL = require("../models/adminRegisterURL");
const crypto = require("crypto");

// Generate a 16-character random string
function generateRandomString(length = 16) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}


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

// Get the current admin registration URL
exports.getCurrentURL = async (req, res) => {
    try {
        console.log("getCurrentURL: Fetching AdminRegisterURL...");
        const currentURL = await AdminRegisterURL.findOne();
        if (!currentURL) {
            console.log("getCurrentURL: No URL found, creating new one...");
            const randomString = generateRandomString();
            const newURL = `/admin-register/${randomString}`; // Using slash as per previous fix
            const newAdminURL = new AdminRegisterURL({
                url: newURL,
                randomString,
                expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
                isActive: true
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

// Regenerate a new URL
exports.regenerateURL = async (req, res) => {
    try {
        console.log("regenerateURL: Regenerating AdminRegisterURL...");
        const randomString = generateRandomString();
        const newURL = `/admin-register/${randomString}`; // Using slash as per previous fix
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours

        // Delete all existing AdminRegisterURL documents to invalidate old URLs
        await AdminRegisterURL.deleteMany({});
        console.log("regenerateURL: Cleared all existing AdminRegisterURL documents");

        // Create a new AdminRegisterURL document
        const newAdminURL = new AdminRegisterURL({
            url: newURL,
            randomString,
            expiresAt,
            isActive: true
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