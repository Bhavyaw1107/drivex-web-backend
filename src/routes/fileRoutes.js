const express = require("express");
const router = express.Router(); // ✅ FIRST declare router

const upload = require("../middleware/upload.js");
const { requireAuth, attachUser } = require("../middleware/authMiddleware");

const {
  uploadFile,
  getFiles,
  getFile,
  getFileUrl,
  deleteFile,
  updateFile,
  moveFile,
  toggleStarFile,
  getStarredFiles,
  getRecentFiles,
  getTrashFiles,
  restoreFile,
  emptyTrashFiles
} = require("../controllers/fileController.js");

// ✅ Apply auth AFTER router is created
router.use(requireAuth, attachUser);

// Routes
router.get("/starred", getStarredFiles);
router.get("/recent", getRecentFiles);
router.get("/trash", getTrashFiles);
router.post("/upload", upload.single("file"), uploadFile);
router.get("/", getFiles);
router.delete("/trash/empty", emptyTrashFiles);
router.get("/:id", getFile);
router.get("/:id/url", getFileUrl);
router.patch("/:id/star", toggleStarFile);
router.patch("/:id/restore", restoreFile);
router.put("/:id", updateFile);
router.put("/:id/move", moveFile);
router.delete("/:id", deleteFile);

module.exports = router;
