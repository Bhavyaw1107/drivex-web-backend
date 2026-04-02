const express = require("express");
const upload = require("../middleware/upload.js");
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

router.post("/upload", upload.single("file"), uploadFile);
router.get("/", getFiles);
router.get("/:id", getFile);
router.get("/:id/url", getFileUrl);
router.put("/:id", updateFile);
router.put("/:id/move", moveFile);
router.delete("/:id", deleteFile);

module.exports = router;
