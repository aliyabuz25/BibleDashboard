const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Sha256 } = require('@aws-crypto/sha256-js');
const { SignatureV4 } = require('@smithy/signature-v4');

let cachedClient = null;

function getS3Config() {
  const bucket = process.env.AWS_S3_BUCKET || 'gstockfootage-media';
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;
  const credentials = accessKeyId && secretAccessKey
    ? {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {})
      }
    : undefined;

  return {
    bucket,
    region,
    credentials,
    client: cachedClient || (cachedClient = new S3Client({
      region,
      ...(credentials ? { credentials } : {})
    }))
  };
}

function createS3ObjectKey({ keyPrefix = 'uploads', originalName = 'file' }) {
  const ext = path.extname(originalName);
  const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${keyPrefix}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`;
}

async function createPresignedPutUrl({ key, contentType = 'application/octet-stream', expiresIn = 900 }) {
  const { bucket, region, credentials, client } = getS3Config();
  const credentialsProvider = credentials || client.config.credentials;
  const resolvedCredentials = typeof credentialsProvider === 'function'
    ? await credentialsProvider()
    : credentialsProvider;
  if (!resolvedCredentials?.accessKeyId || !resolvedCredentials?.secretAccessKey) {
    throw new Error('AWS credentials are required. Attach an EC2 IAM role or provide fresh AWS credentials.');
  }
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const pathname = `/${key.split('/').map(part => encodeURIComponent(part)).join('/')}`;
  const signer = new SignatureV4({
    credentials: resolvedCredentials,
    region,
    service: 's3',
    sha256: Sha256,
    uriEscapePath: false
  });
  const presigned = await signer.presign({
    method: 'PUT',
    protocol: 'https:',
    hostname: host,
    path: pathname,
    query: {},
    headers: {
      host,
      'content-type': contentType
    }
  }, { expiresIn });
  const queryString = Object.keys(presigned.query)
    .sort()
    .flatMap((name) => {
      const value = presigned.query[name];
      return Array.isArray(value)
        ? value.map(item => `${encodeURIComponent(name)}=${encodeURIComponent(item)}`)
        : [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
    })
    .join('&');

  return {
    bucket,
    region,
    key,
    uploadUrl: `https://${host}${pathname}?${queryString}`,
    url: `https://${host}${pathname}`
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
