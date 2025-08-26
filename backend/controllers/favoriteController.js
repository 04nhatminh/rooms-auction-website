const pool = require('../config/database');

class FavoriteController {
    // GET /favorite - Lấy danh sách yêu thích
    async getUserFavorites(req, res) {
        try {
            const userId = req.user?.UserID || req.user?.id;
            if (!userId) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Unauthorized' 
                });
            }

            const [rows] = await pool.query(`
                SELECT 
                    f.ProductID,
                    p.UID,
                    p.Name AS ProductName,
                    p.Price,
                    p.Currency,
                    pr.Name AS ProvinceName,
                    f.CreatedAt,
                    ROUND((
                        COALESCE(p.CleanlinessPoint, 0) + 
                        COALESCE(p.LocationPoint, 0) + 
                        COALESCE(p.ServicePoint, 0) + 
                        COALESCE(p.ValuePoint, 0) + 
                        COALESCE(p.CommunicationPoint, 0) + 
                        COALESCE(p.ConveniencePoint, 0)
                    ) / 6, 2) AS AvgRating
                FROM Favorites f
                JOIN Products p ON p.ProductID = f.ProductID
                LEFT JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode  
                WHERE f.UserID = ?
                ORDER BY f.CreatedAt DESC
            `, [userId]);

            // Lấy ảnh cho từng sản phẩm bằng cách gọi internal API
            const favoritesWithImages = await Promise.all(
                rows.map(async (item) => {
                    try {
                        // Gọi API lấy ảnh chính
                        const response = await fetch(`http://localhost:3000/api/images/product/${item.ProductID}/main`);
                        if (response.ok) {
                            const imageData = await response.json();
                            item.MainImageURL = imageData.url || null;
                        } else {
                            item.MainImageURL = null;
                        }
                    } catch (error) {
                        console.error(`Error fetching image for product ${item.ProductID}:`, error);
                        item.MainImageURL = null;
                    }
                    return item;
                })
            );
            
            return res.json({ 
                success: true, 
                favorites: favoritesWithImages 
            });
        } catch (error) {
            console.error('getUserFavorites error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi server khi tải danh sách yêu thích',
                error: error.message 
            });
        }
    }

    // DELETE /favorite/:productId - Xóa khỏi yêu thích
    async removeFavorite(req, res) {
        try {
            const userId = req.user?.UserID || req.user?.id;
            const { uid } = req.params;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            // Tra cứu ProductID từ UID
            const [productRows] = await pool.query('SELECT ProductID FROM Products WHERE UID = ?', [uid]);
            if (productRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
            }
            const productId = productRows[0].ProductID;

            const [result] = await pool.query(
                'DELETE FROM Favorites WHERE UserID = ? AND ProductID = ?',
                [userId, productId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong danh sách yêu thích' });
            }

            res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server khi xóa yêu thích', error: error.message });
        }
    }

    // POST /favorite/:productId - Thêm vào yêu thích
    async addFavorite(req, res) {
        try {
            const userId = req.user?.UserID || req.user?.id;
            const { uid } = req.params;

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            // Tra cứu ProductID từ UID
            const [productRows] = await pool.query('SELECT ProductID FROM Products WHERE UID = ?', [uid]);
            if (productRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
            }
            const productId = productRows[0].ProductID;

            await pool.query(
                'INSERT IGNORE INTO Favorites (UserID, ProductID) VALUES (?, ?)',
                [userId, productId]
            );

            res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server khi thêm yêu thích', error: error.message });
        }
    }
}

module.exports = new FavoriteController();