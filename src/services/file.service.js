const s3 = require("../config/s3.js");

const uploadToS3 = async (file) => {
  const bucketName = process.env.AWS_BUCKET_NAME || process.env.AWS_BUCKET;

  if (!bucketName) {
    throw new Error("AWS bucket name is not configured");
  }

  const params = {
    Bucket: bucketName,
    Key: `${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const data = await s3.upload(params).promise();
  return {
    key: params.Key,
    location: data.Location,
  };
};

const resolveObjectKey = (file) => {
  if (file.s3Key) {
    return file.s3Key;
  }

  if (!file.url) {
    throw new Error("File URL is missing");
  }

  const parsedUrl = new URL(file.url);
  return decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ""));
};

const getSignedFileUrl = async (file) => {
  const bucketName = process.env.AWS_BUCKET_NAME || process.env.AWS_BUCKET;

  if (!bucketName) {
    throw new Error("AWS bucket name is not configured");
  }

  const key = resolveObjectKey(file);

  return s3.getSignedUrlPromise("getObject", {
    Bucket: bucketName,
    Key: key,
    Expires: 60 * 10,
    ResponseContentDisposition: "inline",
  });
};

module.exports = {
  uploadToS3,
  getSignedFileUrl,
};
