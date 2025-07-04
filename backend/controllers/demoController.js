const demoModel = require('../models/demoModel');

// Demo Controller - xử lý các API requests
class DemoController {
    
    // GET /api/demo - Lấy tất cả dữ liệu
    getAllItems(req, res) {
        try {
            const items = demoModel.getAll();
            res.status(200).json({
                success: true,
                message: 'Lấy dữ liệu thành công',
                data: items,
                total: items.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // GET /api/demo/:id - Lấy dữ liệu theo ID
    getItemById(req, res) {
        try {
            const { id } = req.params;
            const item = demoModel.getById(id);
            
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy sản phẩm với ID ${id}`
                });
            }

            res.status(200).json({
                success: true,
                message: 'Lấy dữ liệu thành công',
                data: item
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // POST /api/demo - Tạo mới
    createItem(req, res) {
        try {
            const { name, description, price, category } = req.body;
            
            // Validation cơ bản
            if (!name || !description || !price || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc (name, description, price, category)'
                });
            }

            const newItem = demoModel.create({
                name,
                description,
                price: parseFloat(price),
                category
            });

            res.status(201).json({
                success: true,
                message: 'Tạo sản phẩm thành công',
                data: newItem
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // PUT /api/demo/:id - Cập nhật theo ID
    updateItem(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            // Chuyển đổi price thành number nếu có
            if (updateData.price) {
                updateData.price = parseFloat(updateData.price);
            }

            const updatedItem = demoModel.update(id, updateData);
            
            if (!updatedItem) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy sản phẩm với ID ${id}`
                });
            }

            res.status(200).json({
                success: true,
                message: 'Cập nhật thành công',
                data: updatedItem
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // DELETE /api/demo/:id - Xóa theo ID
    deleteItem(req, res) {
        try {
            const { id } = req.params;
            const deleted = demoModel.delete(id);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy sản phẩm với ID ${id}`
                });
            }

            res.status(200).json({
                success: true,
                message: 'Xóa sản phẩm thành công'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // GET /api/demo/search?name=... - Tìm kiếm theo tên
    searchItems(req, res) {
        try {
            const { name, category } = req.query;
            let results;

            if (name) {
                results = demoModel.searchByName(name);
            } else if (category) {
                results = demoModel.filterByCategory(category);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Cần cung cấp tham số tìm kiếm (name hoặc category)'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Tìm kiếm thành công',
                data: results,
                total: results.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }
}

module.exports = new DemoController();