const musicItemModel = require('../models/MusicItem');

class MusicItemController {
  async getAll(req, res) {
    try {
      const filters = {};
      if (req.query.type) {
        filters.type = req.query.type;
      }
      if (req.query.categoryId) {
        filters.categoryId = req.query.categoryId;
      }
      const items = await musicItemModel.getAll(filters);
      res.status(200).json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async getById(req, res) {
    try {
      const item = await musicItemModel.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Müzik kaydı bulunamadı.' });
      }
      res.status(200).json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async create(req, res) {
    try {
      let { title, type, image, audioUrl, categoryId, category } = req.body;
      
      if (req.files) {
        if (req.files['image'] && req.files['image'][0]) {
          image = `/uploads/${req.files['image'][0].filename}`;
        }
        if (req.files['audio'] && req.files['audio'][0]) {
          audioUrl = `/uploads/${req.files['audio'][0].filename}`;
        }
      }
      if (req.file) {
        image = `/uploads/${req.file.filename}`;
      }

      if (!title || !type || !image || !audioUrl) {
        return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun (title, type, image, audioUrl).' });
      }

      const newItem = await musicItemModel.create({
        title,
        type,
        image,
        audioUrl,
        categoryId: categoryId ? parseInt(categoryId) : null,
        category: category || null
      });

      res.status(201).json({
        message: 'Müzik başarıyla eklendi.',
        musicItem: newItem
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }

  async delete(req, res) {
    try {
      const success = await musicItemModel.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Müzik kaydı bulunamadı.' });
      }
      res.json({ message: 'Müzik başarıyla silindi.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
  }
}

module.exports = new MusicItemController();
