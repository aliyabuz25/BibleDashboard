const fs = require('fs/promises');
const { uploadFileToS3 } = require('../lib/s3');

class AwsUploadController {
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Lütfen yüklenecek bir dosya seçin.' });
      }

      const result = await uploadFileToS3({
        filePath: req.file.path,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        keyPrefix: 'uploads'
      });

      res.status(200).json({
        message: 'Dosya başarıyla AWS S3\'e yüklendi.',
        url: result.url,
        key: result.key,
        bucket: result.bucket,
      });

      // Cleanup local file after upload
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Local file cleanup failed:', err);
      }

    } catch (error) {
      console.error('AWS S3 Upload Error:', error);
      res.status(500).json({
        message: 'AWS S3 yükleme hatası: ' + error.message,
      });
    }
  }
}

module.exports = new AwsUploadController();
