const express = require("express");
const upload = require("../middleware/upload.js");
const auth = require("../middleware/auth.js");
const {
  uploadFile,
  getFiles,
  getFile,
  getFileUrl,
  deleteFile,
  updateFile,
  moveFile
} = require("../controllers/fileController.js");

const router = express.Router();

router.post("/upload", auth, upload.single("file"), uploadFile);
router.get("/", auth, getFiles);
router.get("/:id", auth, getFile);
router.get("/:id/url", auth, getFileUrl);
router.put("/:id", auth, updateFile);
router.put("/:id/move", auth, moveFile);
router.delete("/:id", auth, deleteFile);

module.exports = router;
