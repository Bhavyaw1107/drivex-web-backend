const express = require("express");
const router = express.Router(); // ✅ FIRST

const { requireAuth, attachUser } = require("../middleware/authMiddleware");

const {
  createFolder,
  getFolders,
  getFolder,
  getBreadcrumb,
  renameFolder,
  moveFolder,
  deleteFolder,
  deleteFolderContents,
  toggleStarFolder,
  getStarredFolders,
  getRecentFolders,
  getTrashFolders,
  restoreFolder,
  emptyTrashFolders
} = require("../controllers/folderController.js");

// ✅ Apply auth
router.use(requireAuth, attachUser);

// Routes
router.get("/starred", getStarredFolders);
router.get("/recent", getRecentFolders);
router.get("/trash", getTrashFolders);
router.post("/", createFolder);
router.get("/", getFolders);
router.delete("/trash/empty", emptyTrashFolders);
router.get("/:id", getFolder);
router.get("/:id/breadcrumb", getBreadcrumb);
router.patch("/:id/star", toggleStarFolder);
router.patch("/:id/restore", restoreFolder);
router.put("/:id", renameFolder);
router.put("/:id/move", moveFolder);
router.delete("/:id", deleteFolder);
router.delete("/:id/contents", deleteFolderContents);

module.exports = router;
