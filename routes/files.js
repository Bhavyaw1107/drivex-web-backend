const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const auth = require('../middleware/auth');
const File = require('../models/File');
const Folder = require('../models/Folder');

const router = express.Router();

// S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Multer setup for file uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// Generate S3 URL
const getS3Url = (key) => {
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// Get S3 key for file
const getS3Key = (userId, folderId, filename) => {
  if (folderId) {
    return `${userId}/${folderId}/${filename}`;
  }
  return `${userId}/${filename}`;
};

// Upload file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const folderId = req.body.folderId || null;
    const file = req.file;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const s3Key = getS3Key(req.userId, folderId, `${uniqueSuffix}-${file.originalname}`);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    await s3Client.send(new PutObjectCommand(params));

    const s3Url = getS3Url(s3Key);

    const newFile = new File({
      userId: req.userId,
      folderId: folderId,
      filename: s3Key,
      originalName: file.originalname,
      s3Key: s3Key,
      s3Url: s3Url,
      mimeType: file.mimetype,
      size: file.size
    });

    await newFile.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: newFile._id,
        filename: newFile.originalName,
        s3Url: newFile.s3Url,
        mimeType: newFile.mimeType,
        size: newFile.size,
        folderId: newFile.folderId,
        createdAt: newFile.createdAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

// List files in a folder (or root if no folderId)
router.get('/', auth, async (req, res) => {
  try {
    const { folderId } = req.query;

    const query = { userId: req.userId };

    if (folderId === 'root' || !folderId || folderId === 'null' || folderId === 'undefined') {
      query.folderId = null;
    } else {
      // Verify folder belongs to user
      const folder = await Folder.findOne({ _id: folderId, userId: req.userId });
      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
      query.folderId = folderId;
    }

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .select('-s3Key -userId -__v');

    res.json({
      files: files.map(file => ({
        id: file._id,
        filename: file.originalName,
        s3Url: file.s3Url,
        mimeType: file.mimeType,
        size: file.size,
        folderId: file.folderId,
        createdAt: file.createdAt
      }))
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ message: 'Failed to fetch files' });
  }
});

// Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.userId });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete from S3
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));

    // Delete from MongoDB
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Get file by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.userId });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json({
      file: {
        id: file._id,
        filename: file.originalName,
        s3Url: file.s3Url,
        mimeType: file.mimeType,
        size: file.size,
        folderId: file.folderId,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ message: 'Failed to fetch file' });
  }
});

// Get presigned URL for file download/view
router.get('/:id/url', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.userId });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const getObjectParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key
    };

    const command = new GetObjectCommand(getObjectParams);
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      presignedUrl,
      expiresIn: 3600,
      file: {
        id: file._id,
        filename: file.originalName,
        mimeType: file.mimeType,
        size: file.size
      }
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ message: 'Failed to generate download URL' });
  }
});

// Move file to folder
router.put('/:id/move', auth, async (req, res) => {
  try {
    const { folderId } = req.body;

    // If moving to a folder, verify it exists and belongs to user
    if (folderId) {
      const folder = await Folder.findOne({ _id: folderId, userId: req.userId });
      if (!folder) {
        return res.status(404).json({ message: 'Target folder not found' });
      }
    }

    const file = await File.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { folderId: folderId || null },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json({
      id: file._id,
      filename: file.originalName,
      s3Url: file.s3Url,
      mimeType: file.mimeType,
      size: file.size,
      folderId: file.folderId,
      createdAt: file.createdAt
    });
  } catch (error) {
    console.error('Move file error:', error);
    res.status(500).json({ message: 'Failed to move file' });
  }
});

module.exports = router;
