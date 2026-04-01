const crypto = require("crypto");

exports.generateHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};