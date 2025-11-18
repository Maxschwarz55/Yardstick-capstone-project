const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");

const s3 = new AWS.S3({ region: "us-east-2" }); // replace with your region
const BUCKET = "your-bucket-name"; // replace with your S3 bucket

router.post("/api/upload-selfie", async (req, res) => {
  const { personId } = req.body;
  if (!personId) return res.status(400).json({ error: "Missing personId" });

  const key = `uploads/selfies/${personId}_${Date.now()}.jpg`;

  const params = {
    Bucket: BUCKET,
    Key: key,
    ContentType: "image/jpeg",
    ACL: "private"
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
    res.json({ uploadUrl, s3Key: key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

module.exports = router;
