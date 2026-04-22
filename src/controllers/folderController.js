const Folder = require("../models/folder.models.js");

const normalize = (f) => ({
  id: f._id,
  name: f.name,
  parentId: f.parentId,
  createdAt: f.createdAt,
  isStarred: f.isStarred || false,
  deletedAt: f.deletedAt
});

// Create
exports.createFolder = async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    const folder = await Folder.create({
      name,
      parentId: req.body.parentId || null,
      owner: req.user.clerkId
    });

    res.json(normalize(folder));
  } catch (err) {
    console.error("CREATE FOLDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get
exports.getFolders = async (req, res) => {
  const folders = await Folder.find({
    parentId: req.query.parentId || null,
    owner: req.user.clerkId,
    deletedAt: null
  });

  res.json({ folders: folders.map(normalize) });
};

// Get one
exports.getFolder = async (req, res) => {
  if (!req.params.id) return res.status(400).json({ error: "Folder ID is required" });
  const folder = await Folder.findOne({
    _id: req.params.id,
    owner: req.user.clerkId
  });

  if (!folder) return res.status(404).json({ error: "Not found" });

  res.json(normalize(folder));
};

// Breadcrumb
exports.getBreadcrumb = async (req, res) => {
  if (!req.params.id) return res.status(400).json({ error: "Folder ID is required" });
  const breadcrumb = [];
  let current = req.params.id;

  while (current) {
    const folder = await Folder.findById(current);
    if (!folder) break;

    breadcrumb.unshift({ id: folder._id, name: folder.name });
    current = folder.parentId;
  }

  res.json({ breadcrumb });
};

// Rename
exports.renameFolder = async (req, res) => {
  if (!req.params.id) return res.status(400).json({ error: "Folder ID is required" });
  const folder = await Folder.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.clerkId },
    { name: req.body.name },
    { new: true }
  );

  res.json(normalize(folder));
};

// Move
exports.moveFolder = async (req, res) => {
  if (!req.params.id) return res.status(400).json({ error: "Folder ID is required" });
  const folder = await Folder.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.clerkId },
    { parentId: req.body.parentId || null },
    { new: true }
  );

  res.json(normalize(folder));
};

// Delete (soft delete - move to trash)
exports.deleteFolder = async (req, res) => {
  if (!req.params.id) return res.status(400).json({ error: "Folder ID is required" });
  const folder = await Folder.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.clerkId },
    { deletedAt: new Date() },
    { new: true }
  );

  res.json({ message: "Moved to trash" });
};

// Delete contents
exports.deleteFolderContents = async (req, res) => {
  if (!req.params.id) return res.status(400).json({ error: "Folder ID is required" });
  await Folder.deleteMany({ parentId: req.params.id });

  res.json({ message: "Deleted contents" });
};

// Toggle star
exports.toggleStarFolder = async (req, res) => {
  if (!req.params.id) return res.status(400).json({ error: "Folder ID is required" });
  const folder = await Folder.findOne({
    _id: req.params.id,
    owner: req.user.clerkId
  });

  if (!folder) return res.status(404).json({ error: "Not found" });

  folder.isStarred = !folder.isStarred;
  await folder.save();

  res.json(normalize(folder));
};

// Get starred folders
exports.getStarredFolders = async (req, res) => {
  const folders = await Folder.find({
    owner: req.user.clerkId,
    isStarred: true,
    deletedAt: null
  });

  res.json({ folders: folders.map(normalize) });
};

// Get recent folders (last 7 days)
exports.getRecentFolders = async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const folders = await Folder.find({
    owner: req.user.clerkId,
    createdAt: { $gte: sevenDaysAgo },
    deletedAt: null
  }).sort({ createdAt: -1 });

  res.json({ folders: folders.map(normalize) });
};

// Get trash folders
exports.getTrashFolders = async (req, res) => {
  const query = {
    owner: req.user.clerkId,
  };

  if (req.query.parentId) {
    query.parentId = req.query.parentId;
  } else {
    query.deletedAt = { $ne: null };
  }

  const folders = await Folder.find(query).sort(
    req.query.parentId ? { createdAt: -1 } : { deletedAt: -1 }
  );

  res.json({ folders: folders.map(normalize) });
};

// Restore folder from trash
exports.restoreFolder = async (req, res) => {
  if (!req.params.id) return res.status(400).json({ error: "Folder ID is required" });
  const folder = await Folder.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.clerkId },
    { deletedAt: null },
    { new: true }
  );

  if (!folder) return res.status(404).json({ error: "Not found" });

  res.json(normalize(folder));
};

// Empty trash (permanent delete)
exports.emptyTrashFolders = async (req, res) => {
  await Folder.deleteMany({
    owner: req.user.clerkId,
    deletedAt: { $ne: null }
  });

  res.json({ message: "Trash emptied" });
};
