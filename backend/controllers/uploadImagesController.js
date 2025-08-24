
const cloudinary = require('../config/cloudinary.js');
const { cloudinaryUpload } = require('../middleware/cloudinaryUpload.js');
const ImageModel = require('../models/imageModel.js');
const { MongoClient } = require('mongodb');

// MongoDB connection helper
async function connectToMongoDB() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://11_a2airbnb:anhmanminhnhu@cluster0.cyihew1.mongodb.net/';
    const client = new MongoClient(mongoUri);
    await client.connect();
    return client.db('a2airbnb');
}

// Tạo ID duy nhất cho ảnh (dạng số như trong database)
function generateImageId() {
    return String(Date.now() + Math.floor(Math.random() * 1000));
}

class uploadImagesController {
    // Upload tất cả ảnh cho một sản phẩm
    static async uploadAllProductImages(req, res) {
        try {
            const { ProductID, Source = 'bidstay', roomTourData } = req.body;
            const files = req.files || [];

            if (!ProductID) {
                return res.status(400).json({ success: false, message: 'ProductID is required' });
            }

            if (files.length === 0) {
                return res.status(400).json({ success: false, message: 'No files provided' });
            }

            // Parse roomTourData nếu có
            let tourData = [];
            if (roomTourData) {
                try {
                    tourData = typeof roomTourData === 'string' ? JSON.parse(roomTourData) : roomTourData;
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Invalid roomTourData format' });
                }
            }

            // Bước 1: Tạo ID cho tất cả ảnh và upload lên Cloudinary
            const allImages = await Promise.all(files.map(async (file, index) => {
                // Tạo ID duy nhất cho ảnh
                const imageId = generateImageId();

                // Upload lên Cloudinary
                const streamUpload = (buf) => new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream({
                        folder: `a2airbnb/products/${ProductID}`,
                        resource_type: 'image',
                        overwrite: false,
                        exif: true
                    }, (error, result) => error ? reject(error) : resolve(result));
                    stream.end(buf);
                });

                const cloudinaryResult = await streamUpload(file.buffer);

                // Xác định orientation
                const orientation = (cloudinaryResult.width > cloudinaryResult.height) ? 'LANDSCAPE'
                                  : (cloudinaryResult.width < cloudinaryResult.height) ? 'PORTRAIT'
                                  : 'SQUARE';

                // Tạo accessibilityLabel dựa trên room tour hoặc mặc định
                let accessibilityLabel = `Hình ảnh nhà/phòng cho thuê ${index + 1}`;
                
                // Nếu có roomTourData, tìm xem ảnh này thuộc phòng nào
                if (tourData && tourData.length > 0) {
                    for (const room of tourData) {
                        if (room.fileIndices && room.fileIndices.includes(index)) {
                            const imageIndexInRoom = room.fileIndices.indexOf(index) + 1;
                            accessibilityLabel = `Hình ảnh ${room.title} ${imageIndexInRoom}`;
                            break;
                        }
                    }
                }

                return {
                    id: imageId,
                    orientation: orientation,
                    accessibilityLabel: accessibilityLabel,
                    baseUrl: cloudinaryResult.secure_url,
                    width: cloudinaryResult.width,
                    height: cloudinaryResult.height,
                    public_id: cloudinaryResult.public_id,
                    originalIndex: index // Để map với roomTourData
                };
            }));

            // Bước 2: Lưu tất cả ảnh vào collection "images"
            const imagesData = allImages.map(img => ({
                id: img.id,
                orientation: img.orientation,
                accessibilityLabel: img.accessibilityLabel,
                baseUrl: img.baseUrl
            }));

            await ImageModel.upsertProductImages(parseInt(ProductID), Source, imagesData);

            // Bước 3: Nếu có roomTourData, lưu vào collection "room_tour_images"
            let roomTourItems = [];
            if (tourData && tourData.length > 0) {
                roomTourItems = tourData.map(room => ({
                    title: room.title,
                    imageIds: room.fileIndices.map(fileIndex => {
                        const image = allImages.find(img => img.originalIndex === fileIndex);
                        return image ? image.id : null;
                    }).filter(id => id !== null)
                })).filter(room => room.imageIds.length > 0);

                if (roomTourItems.length > 0) {
                    await ImageModel.upsertRoomTour(parseInt(ProductID), Source, roomTourItems);
                }
            }

            return res.json({
                success: true,
                message: 'Images uploaded successfully',
                ProductID: parseInt(ProductID),
                totalImages: allImages.length,
                images: imagesData,
                roomTourItems: roomTourItems,
                uploadedImages: allImages.map(img => ({
                    id: img.id,
                    baseUrl: img.baseUrl,
                    accessibilityLabel: img.accessibilityLabel
                }))
            });

        } catch (error) {
            console.error('Upload error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // API để lấy ảnh của một product
    static async getProductImages(req, res) {
        try {
            const { ProductID } = req.params;
            const { Source = 'bidstay' } = req.query;

            const database = await connectToMongoDB();
            
            // Lấy ảnh thông thường
            const imagesCol = database.collection('images');
            const images = await imagesCol.findOne({ ProductID: parseInt(ProductID), Source });

            // Lấy room tour images
            const tourCol = database.collection('room_tour_images');
            const roomTour = await tourCol.findOne({ ProductID: parseInt(ProductID), Source });

            return res.json({
                success: true,
                ProductID: parseInt(ProductID),
                images: images?.Images || [],
                roomTour: roomTour?.RoomTourItems || []
            });

        } catch (error) {
            console.error('Get images error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Backward compatibility - redirect to new endpoint
    static async uploadProductImages(req, res) {
        return uploadImagesController.uploadAllProductImages(req, res);
    }

    static async uploadRoomTourImages(req, res) {
        return uploadImagesController.uploadAllProductImages(req, res);
    }
}

module.exports = uploadImagesController;