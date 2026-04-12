const File = require("../models/file.models.js");
const { uploadToS3, getSignedFileUrl } = require("../services/file.service.js");
const crypto = require("crypto");

const generateHash = (buffer) => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

const normalizeFile = (file) => ({
  id: file._id,
  filename: file.filename,
  originalName: file.originalName,
  mimeType: file.mimeType,
  size: file.size,
  url: file.url,
  s3Key: file.s3Key,
  folderId: file.folderId,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
  isStarred: file.isStarred || false,
  deletedAt: file.deletedAt
});

// Upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const hash = generateHash(req.file.buffer);

    const existingFile = await File.findOne({
      filename: req.file.originalname,
      folderId: req.body.folderId || null,
      owner: req.user.clerkId,
      deletedAt: null
    });

    let version = existingFile ? (existingFile.version || 1) + 1 : 1;

    const uploadedFile = await uploadToS3(req.file);

    let savedFile;

    if (existingFile) {
      existingFile.url = uploadedFile.location;
      existingFile.s3Key = uploadedFile.key;
      existingFile.version = version;
      existingFile.hash = hash;
      savedFile = await existingFile.save();
    } else {
      savedFile = await File.create({
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: uploadedFile.location,
        s3Key: uploadedFile.key,
        folderId: req.body.folderId || null,
        owner: req.user.clerkId,
        hash,
        status: "synced"
      });
    }

    res.json({ file: normalizeFile(savedFile) });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get files
exports.getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;

    const files = await File.find({
      folderId: folderId || null,
      owner: req.user.clerkId,
      deletedAt: null
    });

    res.json({ files: files.map(normalizeFile) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one
exports.getFile = async (req, res) => {
  const file = await File.findOne({
    _id: req.params.id,
    owner: req.user.clerkId
  });

  if (!file) return res.status(404).json({ error: "Not found" });

  res.json(normalizeFile(file));
};

// URL
exports.getFileUrl = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      owner: req.user.clerkId
    });

    if (!file) return res.status(404).json({ error: "Not found" });

    const presignedUrl = await getSignedFileUrl(file);

    res.json({ presignedUrl });
  } catch (err) {
    console.error("GET FILE URL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update
exports.updateFile = async (req, res) => {
  const file = await File.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.clerkId },
    { filename: req.body.filename },
    { new: true }
  );

  if (!file) return res.status(404).json({ error: "Not found" });

  res.json(normalizeFile(file));
};

// Move
exports.moveFile = async (req, res) => {
  const file = await File.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.clerkId },
    { folderId: req.body.folderId || null },
    { new: true }
  );

  if (!file) return res.status(404).json({ error: "Not found" });

  res.json(normalizeFile(file));
};

// Delete (soft delete - move to trash)
exports.deleteFile = async (req, res) => {
  const file = await File.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.clerkId },
    { deletedAt: new Date() },
    { new: true }
  );

  res.json({ message: "Moved to trash" });
};

// Toggle star
exports.toggleStarFile = async (req, res) => {
  const file = await File.findOne({
    _id: req.params.id,
    owner: req.user.clerkId
  });

  if (!file) return res.status(404).json({ error: "Not found" });

  file.isStarred = !file.isStarred;
  await file.save();

  res.json(normalizeFile(file));
};

// Get starred files
exports.getStarredFiles = async (req, res) => {
  const files = await File.find({
    owner: req.user.clerkId,
    isStarred: true,
    deletedAt: null
  });

  res.json({ files: files.map(normalizeFile) });
};

// Get recent files (last 7 days)
exports.getRecentFiles = async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const files = await File.find({
    owner: req.user.clerkId,
    createdAt: { $gte: sevenDaysAgo },
    deletedAt: null
  }).sort({ createdAt: -1 });

  res.json({ files: files.map(normalizeFile) });
};

// Get trash files
exports.getTrashFiles = async (req, res) => {
  const query = {
    owner: req.user.clerkId,
  };

  if (req.query.folderId) {
    query.folderId = req.query.folderId;
  } else {
    query.deletedAt = { $ne: null };
  }

  const files = await File.find(query).sort(
    req.query.folderId ? { createdAt: -1 } : { deletedAt: -1 }
  );

  res.json({ files: files.map(normalizeFile) });
};

// Restore file from trash
exports.restoreFile = async (req, res) => {
  const file = await File.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.clerkId },
    { deletedAt: null },
    { new: true }
  );

  if (!file) return res.status(404).json({ error: "Not found" });

  res.json(normalizeFile(file));
};

// Empty trash (permanent delete)
exports.emptyTrashFiles = async (req, res) => {
  await File.deleteMany({
    owner: req.user.clerkId,
    deletedAt: { $ne: null }
  });

  res.json({ message: "Trash emptied" });
};
