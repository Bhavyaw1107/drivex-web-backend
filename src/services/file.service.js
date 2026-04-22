const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require("../config/s3.js");

const uploadToS3 = async (file) => {
  const bucketName = process.env.AWS_BUCKET_NAME || process.env.AWS_BUCKET;

  if (!bucketName) {
    throw new Error("AWS bucket name is not configured");
  }

  const key = `${Date.now()}-${file.originalname}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });

  const data = await upload.done();
  return {
    key: key,
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

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: "inline",
  });

  return getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });
};

module.exports = {
  uploadToS3,
  getSignedFileUrl,
};
