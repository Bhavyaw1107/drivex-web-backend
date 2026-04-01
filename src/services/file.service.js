import s3 from "../config/s3.js";

export const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: Date.now() + "-" + file.originalname,
    Body: file.buffer
  };

  const data = await s3.upload(params).promise();
  return data.Location;
};