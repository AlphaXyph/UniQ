const AdminRegisterURL = require("../models/adminRegisterURL");
const crypto = require("crypto");

// Generate a 16-character random string
function generateRandomString(length = 16) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

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