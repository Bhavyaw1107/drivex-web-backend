import File from "../models/file.models.js";
import { uploadToS3 } from "../services/file.service.js";

export const uploadFile = async (req, res) => {
  try {
    // 1. Generate hash from file
    const fileBuffer = req.file.buffer;
    const hash = generateHash(fileBuffer);

    // 2. Check if file already exists
    const existingFile = await File.findOne({
      name: req.file.originalname
    });

    let conflict = false;
    let version = 1;

    if (existingFile) {
      // 3. Compare versions
      const incomingVersion = req.body.version || 1;
      const latestVersionInDB = existingFile.version;

      if (incomingVersion < latestVersionInDB) {
        conflict = true;
      }

      version = latestVersionInDB + 1;
    }

    // ❗ If conflict → return immediately
    if (conflict) {
      return res.json({
        status: "conflict",
        message: "File conflict detected"
      });
    }

    // 4. Upload to S3
    const fileUrl = await uploadToS3(req.file);

    // 5. Save / Update file
    let savedFile;

    if (existingFile) {
      existingFile.url = fileUrl;
      existingFile.version = version;
      existingFile.hash = hash;
      savedFile = await existingFile.save();
    } else {
      savedFile = await File.create({
        name: req.file.originalname,
        url: fileUrl,
        version: 1,
        hash: hash,
        status: "synced"
      });
    }

    // 7. Response
    res.json({
      status: "uploaded",
      file: savedFile
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};