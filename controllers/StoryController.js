const storyModel = require('../models/Story');
const fs = require('fs/promises');
const { uploadFileToS3 } = require('../lib/s3');

async function maybeUploadToS3(file, keyPrefix) {
  if (!file) return null;
  const hasS3Env = process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  if (!hasS3Env) {
    return `https://cdn.biblecms.com/${keyPrefix}/${file.filename}`;
  }

  const rootPrefix = process.env.AWS_S3_PREFIX || 'kidsbible-content';
  const finalPrefix = `${rootPrefix}/${keyPrefix}`;

  const result = await uploadFileToS3({
    filePath: file.path,
    originalName: file.originalname,
    mimeType: file.mimetype,
    keyPrefix: finalPrefix
  });

  try {
    await fs.unlink(file.path);
  } catch (err) {
    console.error('Local file cleanup failed:', err);
  }

  return result.url;
}

class StoryController {
  async getAll(req, res) {
    try {
      const filters = {};
      if (req.query.categoryId) filters.categoryId = req.query.categoryId;
      if (req.query.type) filters.type = req.query.type;
      if (req.query.isPublished !== undefined) filters.isPublished = req.query.isPublished === 'true' || req.query.isPublished === '1';

      const stories = await storyModel.getAll(filters);
      res.status(200).json(stories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async create(req, res) {
    try {
      let { title, slug, type, categoryId, duration, durationSeconds, image, contentText, audioUrl, isLocked, isPublished, orderIndex } = req.body;
      
      if (req.files) {
        if (req.files['image'] && req.files['image'][0]) {
          image = await maybeUploadToS3(req.files['image'][0], 'story-images');
        }
        if (req.files['audio'] && req.files['audio'][0]) {
          audioUrl = await maybeUploadToS3(req.files['audio'][0], 'story-audio');
        }
      }
      if (req.file) {
        image = await maybeUploadToS3(req.file, 'story-images');
      }

      if (!title || !slug || !image) {
        return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun (title, slug, image).' });
      }

      const newStory = await storyModel.create({
        title,
        slug,
        type: type || 'story',
        categoryId,
        duration,
        durationSeconds,
        image,
        contentText,
        audioUrl,
        isLocked: isLocked === 'true' || isLocked === 1 || isLocked === true,
        isPublished: isPublished === 'true' || isPublished === 1 || isPublished === true,
        orderIndex
      });

      res.status(201).json({
        message: 'Hikaye başarıyla eklendi.',
        story: newStory
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async update(req, res) {
    try {
      let { title, slug, type, categoryId, duration, durationSeconds, image, contentText, audioUrl, isLocked, isPublished, orderIndex } = req.body;
      
      if (req.files) {
        if (req.files['image'] && req.files['image'][0]) {
          image = await maybeUploadToS3(req.files['image'][0], 'story-images');
        }
        if (req.files['audio'] && req.files['audio'][0]) {
          audioUrl = await maybeUploadToS3(req.files['audio'][0], 'story-audio');
        }
      }
      if (req.file) {
        image = await maybeUploadToS3(req.file, 'story-images');
      }

      const updated = await storyModel.update(req.params.id, {
        title,
        slug,
        type,
        categoryId,
        duration,
        durationSeconds,
        image,
        contentText,
        audioUrl,
        isLocked: isLocked === undefined ? undefined : (isLocked === 'true' || isLocked === 1 || isLocked === true),
        isPublished: isPublished === undefined ? undefined : (isPublished === 'true' || isPublished === 1 || isPublished === true),
        orderIndex
      });

      if (!updated) {
        return res.status(404).json({ message: 'Hikaye bulunamadı.' });
      }

      res.json({
        message: 'Hikaye başarıyla güncellendi.',
        story: updated
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async delete(req, res) {
    try {
      const success = await storyModel.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Hikaye bulunamadı.' });
      }
      res.json({ message: 'Hikaye başarıyla silindi.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }
}

module.exports = new StoryController();
