const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getCurrentURL, regenerateURL, toggleActive, validateAdminUrl, adminRegister } = require("../controllers/adminRegisterController");

// Admin-only middleware
const adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ msg: "Access denied. Admins only." });
    }
    next();
};

// Routes
router.post('/admin-register', adminRegister);
router.get("/", authMiddleware, adminOnly, getCurrentURL);
router.post('/validate-admin-url', validateAdminUrl);
router.post("/regenerate", authMiddleware, adminOnly, regenerateURL);
router.post("/toggle-active", authMiddleware, adminOnly, toggleActive);

module.exports = router;