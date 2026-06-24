const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let cachedClient = null;

function getS3Config() {
  const bucket = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || 'biblecms';
  const region = process.env.AWS_REGION || 'eu-north-1';

  return {
    bucket,
    region,
    client: cachedClient || (cachedClient = new S3Client({ region }))
  };
}

function createS3ObjectKey({ keyPrefix = 'uploads', originalName = 'file' }) {
  const ext = path.extname(originalName);
  const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${keyPrefix}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`;
}

async function createPresignedPutUrl({ key, expiresIn = 900 }) {
  const { bucket, region, client } = getS3Config();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return {
    bucket,
    region,
    key,
    uploadUrl,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  };
}

async function uploadFileToS3({ filePath, originalName, mimeType, keyPrefix = 'uploads' }) {
  const { bucket, region, client } = getS3Config();
  const key = createS3ObjectKey({ keyPrefix, originalName: originalName || filePath });

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fs.createReadStream(filePath),
    ContentType: mimeType || 'application/octet-stream'
  }));

  return {
    bucket,
    region,
    key,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  };
}

module.exports = {
  createPresignedPutUrl,
  createS3ObjectKey,
  uploadFileToS3
};
