const Folder = require("../models/folder.models.js");

// Create folder
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const folder = await Folder.create({ name, parentId: parentId || null });
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get folders
exports.getFolders = async (req, res) => {
  try {
    const { parentId } = req.query;
    const query = parentId ? { parentId } : { parentId: null };
    const folders = await Folder.find(query).sort({ name: 1 });
    res.json({ folders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single folder
exports.getFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: "Folder not found" });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get breadcrumb
exports.getBreadcrumb = async (req, res) => {
  try {
    const breadcrumb = [];
    let currentId = req.params.id;

    while (currentId) {
      const folder = await Folder.findById(currentId);
      if (!folder) break;
      breadcrumb.unshift({ id: folder._id, name: folder.name });
      currentId = folder.parentId;
    }

    res.json({ breadcrumb });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rename folder
exports.renameFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!folder) return res.status(404).json({ error: "Folder not found" });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Move folder
exports.moveFolder = async (req, res) => {
  try {
    const { parentId } = req.body;
    const folder = await Folder.findByIdAndUpdate(
      req.params.id,
      { parentId: parentId || null },
      { new: true }
    );
    if (!folder) return res.status(404).json({ error: "Folder not found" });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete folder
exports.deleteFolder = async (req, res) => {
  try {
    await Folder.findByIdAndDelete(req.params.id);
    res.json({ message: "Folder deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete folder and contents
exports.deleteFolderContents = async (req, res) => {
  try {
    const folderId = req.params.id;
    const idsToDelete = [folderId];

    let hasMore = true;
    while (hasMore) {
      const subfolders = await Folder.find({ parentId: { $in: idsToDelete } });
      if (subfolders.length === 0) {
        hasMore = false;
      } else {
        idsToDelete.push(...subfolders.map(f => f._id));
      }
    }

    await Folder.deleteMany({ _id: { $in: idsToDelete } });

    res.json({ message: "Folder and contents deleted", deletedFolders: idsToDelete.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
