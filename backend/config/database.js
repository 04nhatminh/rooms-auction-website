require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'a2airbnb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log('🔍 Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password ? '***hidden***' : 'empty',
    database: dbConfig.database
});

const pool = mysql.createPool(dbConfig);

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL thành công!');
        connection.release();
    } catch (error) {
        console.error('❌ Lỗi kết nối MySQL:', error.message);
    }
}

async function createUsersTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Users (
            UserID INT AUTO_INCREMENT PRIMARY KEY,
            FullName VARCHAR(255) NOT NULL,
            Email VARCHAR(255) UNIQUE NOT NULL,
            HashPassword VARCHAR(255),
            PhoneNumber VARCHAR(20),
            AvatarURL TEXT,
            IsVerified BOOLEAN DEFAULT FALSE,
            VerificationToken VARCHAR(255),
            VerificationTokenExpires DATETIME,
            Role ENUM('guest', 'admin') DEFAULT 'guest',
            Rating DECIMAL(2,1) DEFAULT 0.0,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`;
    await pool.execute(query);
}

async function createOAuthAccountsTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS OAuthAccounts (
            OAuthID INT AUTO_INCREMENT PRIMARY KEY,
            Provider VARCHAR(15),
            ProviderUID VARCHAR(128),
            UserID INT,
            FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
        )`;
    await pool.execute(query);
}

async function createPaymentMethodsTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS PaymentMethods (
            MethodID INT AUTO_INCREMENT PRIMARY KEY,
            AccountIdentifier VARCHAR(4),
            Token TEXT,
            Provider VARCHAR(15),
            IsDefault BOOLEAN,
            UserID INT,
            CreatedAt TIMESTAMP,
            UpdatedAt TIMESTAMP,
            FOREIGN KEY (UserID) REFERENCES Users(UserID)
        )`;
    await pool.execute(query);
}

async function createCategoriesTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Categories (
            CategoryID INT PRIMARY KEY,
            ParentID INT,
            CategoryName VARCHAR(50),
            CategoryImageURL VARCHAR(255)
        )`;
    await pool.execute(query);
}

async function createPropertiesTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Properties (
            PropertyID INT PRIMARY KEY,
            PropertyName VARCHAR(50),
            PropertyImageURL VARCHAR(255)
        )`;
    await pool.execute(query);
}

async function createRoomTypesTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS RoomTypes (
            RoomTypeID INT PRIMARY KEY,
            RoomTypeName VARCHAR(50),
            RoomTypeImageURL VARCHAR(255)
        )`;
    await pool.execute(query);
}

async function createProductsTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Products (
            ProductID INT PRIMARY KEY,
            CategoryID INT,
            Source VARCHAR(20),
            ExternalID VARCHAR(30),
            Name VARCHAR(100),
            Description TEXT,
            Address VARCHAR(100),
            Latitude FLOAT,
            Longitude FLOAT,
            PropertyType INT,
            RoomType INT,
            MaxGuests SMALLINT,
            NumBedrooms SMALLINT,
            NumBeds SMALLINT,
            NumBathrooms SMALLINT,
            Price DECIMAL(10, 2),
            CleanlinessPoint FLOAT,
            AccuracyPoint FLOAT,
            CheckinPoint FLOAT,
            CommunicationPoint FLOAT,
            LocationPoint FLOAT,
            ValuePoint FLOAT,
            LastSyncedAt TIMESTAMP,
            FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
            FOREIGN KEY (PropertyType) REFERENCES Properties(PropertyID),
            FOREIGN KEY (RoomType) REFERENCES RoomTypes(RoomTypeID)
        )`;
    await pool.execute(query);
}

async function createProductPhotosTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS ProductPhotos (
            PhotoID INT AUTO_INCREMENT PRIMARY KEY,
            ProductID INT,
            PhotoURL VARCHAR(255),
            IsBaseImage BOOLEAN,
            Position SMALLINT,
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        )`;
    await pool.execute(query);
}

async function createAmenitiesTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Amenities (
            AmenitiesID INT PRIMARY KEY,
            AmenitiesName VARCHAR(50),
            AmenitiesImageURL VARCHAR(255)
        )`;
    await pool.execute(query);
}

async function createProductAmenitiesTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS ProductAmenities (
            ProductAmenitiesID INT PRIMARY KEY,
            ProductID INT,
            AmenitiesID INT,
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
            FOREIGN KEY (AmenitiesID) REFERENCES Amenities(AmenitiesID)
        )`;
    await pool.execute(query);
}

async function createMarkingTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Marking (
            MarkingID INT AUTO_INCREMENT PRIMARY KEY,
            UserID INT,
            ProductID INT,
            IsFavourite BOOLEAN,
            FOREIGN KEY (UserID) REFERENCES Users(UserID),
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        )`;
    await pool.execute(query);
}

async function createAuctionTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Auction (
            AuctionID INT UNSIGNED PRIMARY KEY,
            ProductID INT,
            StartTime TIMESTAMP,
            EndTime TIMESTAMP,
            InstantPrice DECIMAL(10, 2),
            StartPrice DECIMAL(10, 2),
            BidIncrement DECIMAL(10, 2),
            CurrentPrice DECIMAL(10, 2),
            Status VARCHAR(20),
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        )`;
    await pool.execute(query);
}

async function createBidsTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Bids (
            BidID INT UNSIGNED PRIMARY KEY,
            AuctionID INT UNSIGNED,
            UserID INT,
            Amount DECIMAL(9, 2),
            BidTime TIMESTAMP,
            PaymentMethodID INT,
            FOREIGN KEY (AuctionID) REFERENCES Auction(AuctionID),
            FOREIGN KEY (UserID) REFERENCES Users(UserID),
            FOREIGN KEY (PaymentMethodID) REFERENCES PaymentMethods(MethodID)
        )`;
    await pool.execute(query);
}

async function createBookingTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Booking (
            BookingID INT UNSIGNED PRIMARY KEY,
            BidID INT UNSIGNED,
            UserID INT,
            ProductID INT,
            StartDate DATE,
            EndDate DATE,
            BookingStatus VARCHAR(20),
            WinningPrice DECIMAL(10, 2),
            PaymentMethodID INT,
            PaidAt TIMESTAMP,
            CreatedAt TIMESTAMP,
            UpdatedAt TIMESTAMP,
            FOREIGN KEY (BidID) REFERENCES Bids(BidID),
            FOREIGN KEY (UserID) REFERENCES Users(UserID),
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
            FOREIGN KEY (PaymentMethodID) REFERENCES PaymentMethods(MethodID)
        )`;
    await pool.execute(query);
}

async function createRatingTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS Rating (
            RatingID INT UNSIGNED PRIMARY KEY,
            BookingID INT UNSIGNED,
            ProductID INT,
            CleanlinessPoint FLOAT,
            AccuracyPoint FLOAT,
            CheckinPoint FLOAT,
            CommunicationPoint FLOAT,
            LocationPoint FLOAT,
            ValuePoint FLOAT,
            FOREIGN KEY (BookingID) REFERENCES Booking(BookingID),
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        )`;
    await pool.execute(query);
}

async function initDatabase() {
    await testConnection();
    await createUsersTable();
    await createOAuthAccountsTable();
    await createPaymentMethodsTable();
    await createCategoriesTable();
    await createPropertiesTable();
    await createRoomTypesTable();
    await createProductsTable();
    await createProductPhotosTable();
    await createAmenitiesTable();
    await createProductAmenitiesTable();
    await createMarkingTable();
    await createAuctionTable();
    await createBidsTable();
    await createBookingTable();
    await createRatingTable();
}

initDatabase();

module.exports = pool;
