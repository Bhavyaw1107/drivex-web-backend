const express = require("express");
const auth = require("../middleware/auth.js");
const {
  createFolder,
  getFolders,
  getFolder,
  getBreadcrumb,
  renameFolder,
  moveFolder,
  deleteFolder,
  deleteFolderContents
} = require("../controllers/folderController.js");

const router = express.Router();

router.post("/", auth, createFolder);
router.get("/", auth, getFolders);
router.get("/:id", auth, getFolder);
router.get("/:id/breadcrumb", auth, getBreadcrumb);
router.put("/:id", auth, renameFolder);
router.put("/:id/move", auth, moveFolder);
router.delete("/:id", auth, deleteFolder);
router.delete("/:id/contents", auth, deleteFolderContents);

module.exports = router;
