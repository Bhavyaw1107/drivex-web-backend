const File = require("../models/file.models.js");
const { uploadToS3 } = require("../services/file.service.js");
const crypto = require("crypto");

const generateHash = (buffer) => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    const fileBuffer = req.file.buffer;
    const hash = generateHash(fileBuffer);

    const existingFile = await File.findOne({
      filename: req.file.originalname,
      folderId: req.body.folderId || null
    });

    let version = 1;

    if (existingFile) {
      version = (existingFile.version || 1) + 1;
    }

    const fileUrl = await uploadToS3(req.file);

    let savedFile;

    if (existingFile) {
      existingFile.url = fileUrl;
      existingFile.version = version;
      existingFile.hash = hash;
      savedFile = await existingFile.save();
    } else {
      savedFile = await File.create({
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        folderId: req.body.folderId || null,
        hash: hash,
        status: "synced"
      });
    }

    res.json({
      status: "uploaded",
      file: savedFile
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get files
exports.getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    const query = folderId ? { folderId } : { folderId: null };
    const files = await File.find(query).sort({ createdAt: -1 });
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single file
exports.getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get file URL
exports.getFileUrl = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json({ presignedUrl: file.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update file
exports.updateFile = async (req, res) => {
  try {
    const { filename, folderId } = req.body;
    const updateData = {};
    if (filename) updateData.filename = filename;
    if (folderId !== undefined) updateData.folderId = folderId;

    const file = await File.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Move file
exports.moveFile = async (req, res) => {
  try {
    const { folderId } = req.body;
    const file = await File.findByIdAndUpdate(
      req.params.id,
      { folderId: folderId || null },
      { new: true }
    );
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    await File.findByIdAndDelete(req.params.id);
    res.json({ message: "File deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
