// Admin Settings Management
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT category, key, value, type, description 
      FROM admin_settings 
      ORDER BY category, key
    `);
    
    // Group settings by category
    const settings = result.rows.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = {};
      }
      acc[row.category][row.key] = {
        value: row.value,
        type: row.type,
        description: row.description
      };
      return acc;
    }, {});
    
    res.json(settings);
  } catch (error) {
    console.error('❌ Error fetching admin settings:', error);
    res.status(500).json({ message: 'Lỗi khi lấy cấu hình admin' });
  }
});

router.put('/settings', authenticateAdmin, async (req, res) => {
  try {
    const { category, key, value, type = 'string', description } = req.body;
    
    if (!category || !key) {
      return res.status(400).json({ message: 'Category và key là bắt buộc' });
    }
    
    await db.query(`
      INSERT INTO admin_settings (category, key, value, type, description, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (category, key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        type = EXCLUDED.type,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
    `, [category, key, value, type, description]);
    
    res.json({ message: 'Cập nhật cấu hình thành công' });
  } catch (error) {
    console.error('❌ Error updating admin setting:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật cấu hình' });
  }
});

router.delete('/settings/:category/:key', authenticateAdmin, async (req, res) => {
  try {
    const { category, key } = req.params;
    
    await db.query(`
      DELETE FROM admin_settings 
      WHERE category = $1 AND key = $2
    `, [category, key]);
    
    res.json({ message: 'Xóa cấu hình thành công' });
  } catch (error) {
    console.error('❌ Error deleting admin setting:', error);
    res.status(500).json({ message: 'Lỗi khi xóa cấu hình' });
  }
}); 