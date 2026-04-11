const express = require('express');
const Folder = require('../models/Folder');
const File = require('../models/File');
const auth = require('../middleware/auth');
const { S3Client, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const router = express.Router();
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Create folder
router.post('/', auth, async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    // If parentId provided, verify it exists and belongs to user
    if (parentId) {
      const parentFolder = await Folder.findOne({ _id: parentId, userId: req.userId });
      if (!parentFolder) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }
    }

    const folder = new Folder({
      name: name.trim(),
      parentId: parentId || null,
      userId: req.userId
    });

    await folder.save();

    res.status(201).json({
      id: folder._id,
      name: folder.name,
      parentId: folder.parentId,
      createdAt: folder.createdAt
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ message: 'Failed to create folder' });
  }
});

// List root folders or subfolders of a parent
router.get('/', auth, async (req, res) => {
  try {
    const { parentId } = req.query;

    const query = { userId: req.userId };

    if (parentId === 'root' || !parentId) {
      query.parentId = null;
    } else {
      query.parentId = parentId;
    }

    const folders = await Folder.find(query).sort({ name: 1 });

    res.json({
      folders: folders.map(f => ({
        id: f._id,
        name: f.name,
        parentId: f.parentId,
        createdAt: f.createdAt
      }))
    });
  } catch (error) {
    console.error('List folders error:', error);
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
});

// Get folder by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.userId });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.json({
      folder: {
        id: folder._id,
        name: folder.name,
        parentId: folder.parentId,
        createdAt: folder.createdAt
      }
    });
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({ message: 'Failed to fetch folder' });
  }
});

// Get folder breadcrumb path
router.get('/:id/breadcrumb', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.userId });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Build breadcrumb from root to current folder
    const breadcrumb = [];
    let currentFolder = folder;

    while (currentFolder) {
      breadcrumb.unshift({
        id: currentFolder._id,
        name: currentFolder.name
      });

      if (currentFolder.parentId) {
        currentFolder = await Folder.findById(currentFolder.parentId);
      } else {
        currentFolder = null;
      }
    }

    res.json({ breadcrumb });
  } catch (error) {
    console.error('Get breadcrumb error:', error);
    res.status(500).json({ message: 'Failed to fetch breadcrumb' });
  }
});

// Rename folder
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name: name.trim() },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.json({
      id: folder._id,
      name: folder.name,
      parentId: folder.parentId,
      createdAt: folder.createdAt
    });
  } catch (error) {
    console.error('Rename folder error:', error);
    res.status(500).json({ message: 'Failed to rename folder' });
  }
});

// Move folder
router.put('/:id/move', auth, async (req, res) => {
  try {
    const { parentId } = req.body;

    // Prevent moving folder into itself
    if (parentId && parentId.toString() === req.params.id.toString()) {
      return res.status(400).json({ message: 'Cannot move folder into itself' });
    }

    // If moving to a parent folder, verify it exists and belongs to user
    if (parentId) {
      const parentFolder = await Folder.findOne({ _id: parentId, userId: req.userId });
      if (!parentFolder) {
        return res.status(404).json({ message: 'Target folder not found' });
      }
    }

    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { parentId: parentId || null },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.json({
      id: folder._id,
      name: folder.name,
      parentId: folder.parentId,
      createdAt: folder.createdAt
    });
  } catch (error) {
    console.error('Move folder error:', error);
    res.status(500).json({ message: 'Failed to move folder' });
  }
});

// Delete folder (moves children to parent)
router.delete('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.userId });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Move child folders to parent
    await Folder.updateMany(
      { parentId: req.params.id, userId: req.userId },
      { parentId: folder.parentId }
    );

    // Move files to parent (or root if no parent)
    await File.updateMany(
      { folderId: req.params.id, userId: req.userId },
      { folderId: folder.parentId }
    );

    await Folder.findByIdAndDelete(req.params.id);

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ message: 'Failed to delete folder' });
  }
});

// Delete folder and all contents
router.delete('/:id/contents', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.userId });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Recursively get all folder IDs
    const getAllFolderIds = async (folderId) => {
      const folderIds = [folderId];
      const childFolders = await Folder.find({ parentId: folderId, userId: req.userId });

      for (const child of childFolders) {
        const grandChildIds = await getAllFolderIds(child._id);
        folderIds.push(...grandChildIds);
      }

      return folderIds;
    };

    const allFolderIds = await getAllFolderIds(req.params.id);

    // Get all files in these folders
    const files = await File.find({
      folderId: { $in: allFolderIds },
      userId: req.userId
    });

    // Delete files from S3
    for (const file of files) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.s3Key
        }));
      } catch (s3Error) {
        console.error('S3 delete error for file:', file.s3Key, s3Error.message);
      }
    }

    // Delete files from MongoDB
    await File.deleteMany({
      folderId: { $in: allFolderIds },
      userId: req.userId
    });

    // Delete all folders recursively
    await Folder.deleteMany({
      _id: { $in: allFolderIds },
      userId: req.userId
    });

    res.json({ message: 'Folder and contents deleted successfully' });
  } catch (error) {
    console.error('Delete folder contents error:', error);
    res.status(500).json({ message: 'Failed to delete folder and contents' });
  }
});

module.exports = router;
