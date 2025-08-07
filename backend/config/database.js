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

async function createAdministrativeRegionsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS AdministrativeRegions (
            RegionID INT PRIMARY KEY,
            Name VARCHAR(255) NOT NULL,
            NameEn VARCHAR(255) NOT NULL,
            CodeName VARCHAR(255),
            CodeNameEn VARCHAR(255)
        )
    `);
}

async function createAdministrativeUnitsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS AdministrativeUnits (
            UnitID INT PRIMARY KEY,
            FullName VARCHAR(255),
            FullNameEn VARCHAR(255),
            ShortName VARCHAR(255),
            ShortNameEn VARCHAR(255),
            CodeName VARCHAR(255),
            CodeNameEn VARCHAR(255)
        )
    `);
}

async function createProvincesTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Provinces (
            ProvinceCode VARCHAR(20) PRIMARY KEY,
            Name VARCHAR(255) NOT NULL,
            NameEn VARCHAR(255),
            FullName VARCHAR(255),
            FullNameEn VARCHAR(255),
            CodeName VARCHAR(255),
            AdministrativeUnitID INT,
            AdministrativeRegionID INT,
            FOREIGN KEY (AdministrativeUnitID) REFERENCES AdministrativeUnits(UnitID),
            FOREIGN KEY (AdministrativeRegionID) REFERENCES AdministrativeRegions(RegionID)
        )
    `);
    await pool.execute(`CREATE INDEX idx_Provinces_Region ON Provinces(AdministrativeRegionID)`);
    await pool.execute(`CREATE INDEX idx_Provinces_Unit ON Provinces(AdministrativeUnitID)`);
}

async function createDistrictsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Districts (
            DistrictCode VARCHAR(20) PRIMARY KEY,
            Name VARCHAR(255) NOT NULL,
            NameEn VARCHAR(255),
            FullName VARCHAR(255),
            FullNameEn VARCHAR(255),
            CodeName VARCHAR(255),
            ProvinceCode VARCHAR(20),
            AdministrativeUnitID INT,
            FOREIGN KEY (ProvinceCode) REFERENCES Provinces(ProvinceCode),
            FOREIGN KEY (AdministrativeUnitID) REFERENCES AdministrativeUnits(UnitID)
        )
    `);
    await pool.execute(`CREATE INDEX idx_Districts_Province ON Districts(ProvinceCode)`);
    await pool.execute(`CREATE INDEX idx_Districts_Unit ON Districts(AdministrativeUnitID)`);
}

async function createUsersTable() {
    await pool.execute(`
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
        )
    `);
}

async function createOAuthAccountsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS OAuthAccounts (
            OAuthID INT PRIMARY KEY,
            Provider VARCHAR(15),
            ProviderUID VARCHAR(128),
            UserID INT,
            FOREIGN KEY (UserID) REFERENCES Users(UserID)
        )
    `);
}

async function createPaymentMethodsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS PaymentMethods (
            MethodID INT PRIMARY KEY,
            AccountIdentifier VARCHAR(4),
            Token TEXT,
            Provider VARCHAR(15),
            IsDefault BIT(1),
            UserID INT,
            CreatedAt TIMESTAMP,
            UpdatedAt TIMESTAMP,
            FOREIGN KEY (UserID) REFERENCES Users(UserID)
        )
    `);
    await pool.execute(`CREATE INDEX idx_PaymentMethods_UserID ON PaymentMethods(UserID)`);
}

async function createPropertiesTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Properties (
            PropertyID INT AUTO_INCREMENT PRIMARY KEY,
            PropertyName VARCHAR(255),
            PropertyImageURL VARCHAR(255)
        )
    `);
}

async function createRoomTypesTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS RoomTypes (
            RoomTypeID INT AUTO_INCREMENT PRIMARY KEY,
            RoomTypeName VARCHAR(255),
            RoomTypeImageURL VARCHAR(255)
        )
    `);
}

async function createProductsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Products (
            ProductID INT AUTO_INCREMENT PRIMARY KEY,
            Source VARCHAR(20),
            ExternalID VARCHAR(30),
            Name VARCHAR(255),
            Address VARCHAR(255),
            ProvinceCode VARCHAR(20),
            DistrictCode VARCHAR(20),
            Latitude FLOAT,
            Longitude FLOAT,
            PropertyType INT,
            RoomType INT,
            MaxGuests SMALLINT,
            NumBedrooms SMALLINT,
            NumBeds SMALLINT,
            NumBathrooms SMALLINT,
            Price DECIMAL(10, 2),
            Currency VARCHAR(20),
            CleanlinessPoint FLOAT,
            LocationPoint FLOAT,
            ServicePoint FLOAT,
            ValuePoint FLOAT,
            CommunicationPoint FLOAT,
            ConveniencePoint FLOAT,
            CreatedAt TIMESTAMP,
            LastSyncedAt TIMESTAMP,
            FOREIGN KEY (ProvinceCode) REFERENCES Provinces(ProvinceCode),
            FOREIGN KEY (DistrictCode) REFERENCES Districts(DistrictCode),
            FOREIGN KEY (PropertyType) REFERENCES Properties(PropertyID),
            FOREIGN KEY (RoomType) REFERENCES RoomTypes(RoomTypeID)
        )
    `);
    await pool.execute(`CREATE INDEX idx_Products_ProvinceCode ON Products(ProvinceCode)`);
    await pool.execute(`CREATE INDEX idx_Products_DistrictCode ON Products(DistrictCode)`);
    await pool.execute(`CREATE INDEX idx_Products_Price ON Products(Price)`);
}

async function createAmenityGroupsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS AmenityGroups (
            AmenityGroupID INT AUTO_INCREMENT PRIMARY KEY,
            AmenityGroupName VARCHAR(255)
        )
    `);
}

async function createAmenitiesTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Amenities (
            AmenityID INT AUTO_INCREMENT PRIMARY KEY,
            AmenityName VARCHAR(255),
            AmenityGroupID INT,
            AmenityImageURL VARCHAR(255),
            FOREIGN KEY (AmenityGroupID) REFERENCES AmenityGroups(AmenityGroupID)
        )
    `);
}

async function createProductAmenitiesTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS ProductAmenities (
            ProductID INT NOT NULL,
            AmenityID INT NOT NULL,
            PRIMARY KEY (ProductID, AmenityID),
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
            FOREIGN KEY (AmenityID) REFERENCES Amenities(AmenityID) ON DELETE CASCADE
        )
    `);
    await pool.execute(`CREATE INDEX idx_product_amenities_product ON ProductAmenities(ProductID)`);
    await pool.execute(`CREATE INDEX idx_product_amenities_amenity ON ProductAmenities(AmenityID)`);
}

async function createAuctionTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Auction (
            AuctionID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            ProductID INT,
            StartTime TIMESTAMP,
            EndTime TIMESTAMP,
            InstantPrice DECIMAL(10, 2),
            StartPrice DECIMAL(10, 2),
            BidIncrement DECIMAL(10, 2),
            CurrentPrice DECIMAL(10, 2),
            Status VARCHAR(20),
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        )
    `);
    await pool.execute(`CREATE INDEX idx_Auction_ProductID ON Auction(ProductID)`);
    await pool.execute(`CREATE INDEX idx_Auction_StartTime ON Auction(StartTime)`);
    await pool.execute(`CREATE INDEX idx_Auction_Status_EndTime ON Auction(Status, EndTime)`);
}

async function createBidsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Bids (
            BidID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            AuctionID INT UNSIGNED,
            UserID INT,
            Amount DECIMAL(9, 2),
            BidTime TIMESTAMP,
            PaymentMethodID INT,
            FOREIGN KEY (AuctionID) REFERENCES Auction(AuctionID),
            FOREIGN KEY (UserID) REFERENCES Users(UserID),
            FOREIGN KEY (PaymentMethodID) REFERENCES PaymentMethods(MethodID)
        )
    `);
    await pool.execute(`CREATE INDEX idx_Bids_AuctionID ON Bids(AuctionID)`);
    await pool.execute(`CREATE INDEX idx_Bids_UserID ON Bids(UserID)`);
}

async function createBookingTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Booking (
            BookingID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
        )
    `);
    await pool.execute(`CREATE INDEX idx_Booking_UserID ON Booking(UserID)`);
    await pool.execute(`CREATE INDEX idx_Booking_ProductID ON Booking(ProductID)`);
}

async function createRatingTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Rating (
            RatingID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            ExternalID VARCHAR(30),
            BookingID INT UNSIGNED,
            ProductID INT,
            CleanlinessPoint FLOAT,
            LocationPoint FLOAT,
            ServicePoint FLOAT,
            ValuePoint FLOAT,
            CommunicationPoint FLOAT,
            ConveniencePoint FLOAT,
            FOREIGN KEY (BookingID) REFERENCES Booking(BookingID),
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        )
    `);
    await pool.execute(`CREATE INDEX idx_Rating_ProductID ON Rating(ProductID)`);
}

async function initSchema() {
    await testConnection();
    await createAdministrativeRegionsTable();
    await createAdministrativeUnitsTable();
    await createProvincesTable();
    await createDistrictsTable();
    await createUsersTable();
    await createOAuthAccountsTable();
    await createPaymentMethodsTable();
    await createPropertiesTable();
    await createRoomTypesTable();
    await createProductsTable();
    await createAmenityGroupsTable();
    await createAmenitiesTable();
    await createProductAmenitiesTable();
    await createAuctionTable();
    await createBidsTable();
    await createBookingTable();
    await createRatingTable();
}

initSchema();

module.exports = pool;