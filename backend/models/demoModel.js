class DemoModel {
    constructor() {
        // Mock data
        this.data = [
            {
                id: 1,
                name: "Sản phẩm A",
                description: "Mô tả sản phẩm A",
                price: 100000,
                category: "Điện tử",
                createdAt: new Date('2024-01-01')
            },
            {
                id: 2,
                name: "Sản phẩm B", 
                description: "Mô tả sản phẩm B",
                price: 200000,
                category: "Thời trang",
                createdAt: new Date('2024-01-02')
            },
            {
                id: 3,
                name: "Sản phẩm C",
                description: "Mô tả sản phẩm C", 
                price: 150000,
                category: "Gia dụng",
                createdAt: new Date('2024-01-03')
            }
        ];
        this.nextId = 4; // ID tiếp theo cho sản phẩm mới
    }

    // Lấy tất cả dữ liệu
    getAll() {
        return this.data;
    }

    // Lấy dữ liệu theo ID
    getById(id) {
        return this.data.find(item => item.id === parseInt(id));
    }

    // Tạo mới
    create(itemData) {
        const newItem = {
            id: this.nextId++,
            ...itemData,
            createdAt: new Date()
        };
        this.data.push(newItem);
        return newItem;
    }

    // Cập nhật theo ID
    update(id, updateData) {
        const index = this.data.findIndex(item => item.id === parseInt(id));
        if (index === -1) {
            return null;
        }
        
        this.data[index] = {
            ...this.data[index],
            ...updateData,
            id: parseInt(id), // Đảm bảo ID không bị thay đổi
            updatedAt: new Date()
        };
        
        return this.data[index];
    }

    // Xóa theo ID
    delete(id) {
        const index = this.data.findIndex(item => item.id === parseInt(id));
        if (index === -1) {
            return false;
        }
        
        this.data.splice(index, 1);
        return true;
    }

    // Tìm kiếm theo tên
    searchByName(name) {
        return this.data.filter(item => 
            item.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    // Lọc theo category
    filterByCategory(category) {
        return this.data.filter(item => 
            item.category.toLowerCase() === category.toLowerCase()
        );
    }
}

// Export singleton instance
module.exports = new DemoModel();