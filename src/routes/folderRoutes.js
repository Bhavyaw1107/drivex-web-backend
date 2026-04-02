const express = require("express");
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

router.post("/", createFolder);
router.get("/", getFolders);
router.get("/:id", getFolder);
router.get("/:id/breadcrumb", getBreadcrumb);
router.put("/:id", renameFolder);
router.put("/:id/move", moveFolder);
router.delete("/:id", deleteFolder);
router.delete("/:id/contents", deleteFolderContents);

module.exports = router;
