const db = require('../database');

class MusicItem {
  async getAll(filters = {}) {
    try {
      let query = "SELECT * FROM music_items WHERE 1=1";
      const params = [];

      if (filters.type) {
        query += " AND type = ?";
        params.push(filters.type);
      }

      if (filters.categoryId) {
        query += " AND categoryId = ?";
        params.push(parseInt(filters.categoryId));
      }

      const rows = await db.all(query, params);
      return rows;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async findById(id) {
    try {
      const row = await db.get("SELECT * FROM music_items WHERE id = ?", [parseInt(id)]);
      return row || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async create({ title, type, image, audioUrl, categoryId, category }) {
    try {
      const createdAt = new Date().toISOString();
      const result = await db.run(
        "INSERT INTO music_items (title, type, image, audioUrl, categoryId, category, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [title, type, image, audioUrl, categoryId || null, category || null, createdAt]
      );
      return {
        id: result.lastID,
        title,
        type,
        image,
        audioUrl,
        categoryId: categoryId || null,
        category: category || null,
        createdAt
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async delete(id) {
    try {
      const result = await db.run("DELETE FROM music_items WHERE id = ?", [parseInt(id)]);
      return result.changes > 0;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

module.exports = new MusicItem();
