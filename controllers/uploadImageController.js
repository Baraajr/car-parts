const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

exports.getPresignedURL = async (req, res) => {
  const allowedTypes = ['user', 'product', 'category', 'brand'];
  const { type } = req.query;

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      status: 'fail',
      message: `Wrong value ${type}.`,
    });
  }

  if (type === 'user' && !req.user?.id) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'User ID missing.' });
  }

  const folderName = type === 'user' ? req.user.id : `${type}s`;
  const key = `${folderName}/${uuidv4()}.jpeg`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'car-parts-bucket-123',
      Key: key,
      ContentType: 'image/jpeg',
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 180 });

    return res.status(200).json({ key, url });
  } catch (err) {
    console.error('S3 v3 Signed URL Error:', err);
    return res.status(500).json({ error: 'Failed to generate signed URL' });
  }
};
