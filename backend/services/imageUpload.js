const cloudinary = require("../configs/cloudinary");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No image uploaded" });
        }
        const result = await cloudinary.uploader.upload_stream({
            folder: "quiz_images",
            resource_type: "image",
        }, (error, result) => {
            if (error) {
                console.error("Cloudinary upload error:", error);
                return res.status(500).json({ msg: "Image upload failed" });
            }
            res.json({ imageUrl: result.secure_url });
        }).end(req.file.buffer);
    } catch (err) {
        console.error("Image upload error:", err);
        res.status(500).json({ msg: "Server error" });
    }
};

module.exports = { upload, uploadImage };