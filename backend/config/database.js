require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const { spawn } = require('child_process');
const path = require('path');

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
    port: dbConfig.port,
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
    
    // Tạo index với error handling
    try {
        await pool.execute(`CREATE INDEX idx_Provinces_Region ON Provinces(AdministrativeRegionID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') {
            throw error; // Re-throw nếu không phải lỗi duplicate key
        }
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_Provinces_Unit ON Provinces(AdministrativeUnitID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') {
            throw error;
        }
    }
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
    
    try {
        await pool.execute(`CREATE INDEX idx_Districts_Province ON Districts(ProvinceCode)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_Districts_Unit ON Districts(AdministrativeUnitID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
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
            ID INT AUTO_INCREMENT PRIMARY KEY,
            Provider VARCHAR(50) NOT NULL,
            ProviderUID VARCHAR(255) NOT NULL,
            UserID INT NOT NULL,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
            UNIQUE KEY unique_oauth (Provider, ProviderUID)
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
    
    try {
        await pool.execute(`CREATE INDEX idx_PaymentMethods_UserID ON PaymentMethods(UserID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
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
            UID BIGINT UNSIGNED,
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
    
    try {
        await pool.execute(`CREATE INDEX idx_Products_ProvinceCode ON Products(ProvinceCode)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_Products_DistrictCode ON Products(DistrictCode)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_Products_Price ON Products(Price)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
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
    
    try {
        await pool.execute(`CREATE INDEX idx_product_amenities_product ON ProductAmenities(ProductID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_product_amenities_amenity ON ProductAmenities(AmenityID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
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
    
    try {
        await pool.execute(`CREATE INDEX idx_Auction_ProductID ON Auction(ProductID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_Auction_StartTime ON Auction(StartTime)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_Auction_Status_EndTime ON Auction(Status, EndTime)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
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
    
    try {
        await pool.execute(`CREATE INDEX idx_Bids_AuctionID ON Bids(AuctionID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_Bids_UserID ON Bids(UserID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
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
    
    try {
        await pool.execute(`CREATE INDEX idx_Booking_UserID ON Booking(UserID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_Booking_ProductID ON Booking(ProductID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
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
    
    try {
        await pool.execute(`CREATE INDEX idx_Rating_ProductID ON Rating(ProductID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
}

// Procedure
async function dropUpsertPropertyProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS UpsertProperty;
    `);
}

async function createUpsertPropertyProcedure() {
    await pool.query(`
        
        CREATE PROCEDURE UpsertProperty(IN p_PropertyName VARCHAR(255))
        BEGIN
            DECLARE v_PropertyID INT;
            DECLARE v_OldName VARCHAR(255);

            SELECT PropertyID, PropertyName INTO v_PropertyID, v_OldName
            FROM Properties
            WHERE PropertyName = p_PropertyName
            LIMIT 1;

            IF v_PropertyID IS NULL THEN
                INSERT INTO Properties(PropertyName, PropertyImageURL)
                VALUES(p_PropertyName, NULL);
            ELSE
                IF v_OldName <> p_PropertyName THEN
                    UPDATE Properties
                    SET PropertyName = p_PropertyName
                    WHERE PropertyID = v_PropertyID;
                END IF;
            END IF;
        END;
    `);
}

async function dropUpsertRoomTypeProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS UpsertRoomType;
    `);
}

async function createUpsertRoomTypeProcedure() {
    await pool.query(`
        
        CREATE PROCEDURE UpsertRoomType(IN p_RoomTypeName VARCHAR(255))
        BEGIN
            DECLARE v_RoomTypeID INT;
            DECLARE v_OldName VARCHAR(255);

            SELECT RoomTypeID, RoomTypeName INTO v_RoomTypeID, v_OldName
            FROM RoomTypes
            WHERE RoomTypeName = p_RoomTypeName
            LIMIT 1;

            IF v_RoomTypeID IS NULL THEN
                INSERT INTO RoomTypes(RoomTypeName, RoomTypeImageURL)
                VALUES(p_RoomTypeName, NULL);
            ELSE
                IF v_OldName <> p_RoomTypeName THEN
                    UPDATE RoomTypes
                    SET RoomTypeName = p_RoomTypeName
                    WHERE RoomTypeID = v_RoomTypeID;
                END IF;
            END IF;
        END;
    `);
}

async function dropUpsertProductProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS UpsertProduct;
    `);
}

async function createUpsertProductProcedure() {
    await pool.query(`
        
        CREATE PROCEDURE UpsertProduct(
            IN p_UID BIGINT UNSIGNED,
            IN p_ExternalID VARCHAR(30),
            IN p_Source VARCHAR(20),
            IN p_Name VARCHAR(255),
            IN p_Address VARCHAR(255),
            IN p_ProvinceCode VARCHAR(20),
            IN p_DistrictCode VARCHAR(20),
            IN p_Latitude FLOAT,
            IN p_Longitude FLOAT,
            IN p_PropertyType INT,
            IN p_RoomType INT,
            IN p_MaxGuests SMALLINT,
            IN p_NumBedrooms SMALLINT,
            IN p_NumBeds SMALLINT,
            IN p_NumBathrooms SMALLINT,
            IN p_Price DECIMAL(10,2),
            IN p_Currency VARCHAR(20),
            IN p_Cleanliness FLOAT,
            IN p_Location FLOAT,
            IN p_Service FLOAT,
            IN p_Value FLOAT,
            IN p_Communication FLOAT,
            IN p_Convenience FLOAT,
            IN p_CreatedAt TIMESTAMP,
            IN p_LastSyncedAt TIMESTAMP
        )
        BEGIN
            DECLARE v_ProductID INT;

            SELECT ProductID INTO v_ProductID
            FROM Products
            WHERE ExternalID = p_ExternalID
            LIMIT 1;

            IF v_ProductID IS NULL THEN
                -- Insert nếu chưa có
                INSERT INTO Products(UID, Source, ExternalID, Name, Address, ProvinceCode, DistrictCode, Latitude, Longitude,
                                    PropertyType, RoomType, MaxGuests, NumBedrooms, NumBeds, NumBathrooms, Price, Currency,
                                    CleanlinessPoint, LocationPoint, ServicePoint, ValuePoint, CommunicationPoint, ConveniencePoint,
                                    CreatedAt, LastSyncedAt)
                VALUES(p_UID, p_Source, p_ExternalID, p_Name, p_Address, p_ProvinceCode, p_DistrictCode, p_Latitude, p_Longitude,
                    p_PropertyType, p_RoomType, p_MaxGuests, p_NumBedrooms, p_NumBeds, p_NumBathrooms, p_Price, p_Currency,
                    p_Cleanliness, p_Location, p_Service, p_Value, p_Communication, p_Convenience,
                    p_CreatedAt, p_LastSyncedAt);
            ELSE
                -- Chỉ update nếu có sự khác biệt
                IF EXISTS (
                    SELECT 1 FROM Products
                    WHERE ProductID = v_ProductID
                    AND (
                        Source <> p_Source OR
                        Name <> p_Name OR
                        Address <> p_Address OR
                        ProvinceCode <> p_ProvinceCode OR
                        DistrictCode <> p_DistrictCode OR
                        Latitude <> p_Latitude OR
                        Longitude <> p_Longitude OR
                        PropertyType <> p_PropertyType OR
                        RoomType <> p_RoomType OR
                        MaxGuests <> p_MaxGuests OR
                        NumBedrooms <> p_NumBedrooms OR
                        NumBeds <> p_NumBeds OR
                        NumBathrooms <> p_NumBathrooms OR
                        Price <> p_Price OR
                        Currency <> p_Currency OR
                        CleanlinessPoint <> p_Cleanliness OR
                        LocationPoint <> p_Location OR
                        ServicePoint <> p_Service OR
                        ValuePoint <> p_Value OR
                        CommunicationPoint <> p_Communication OR
                        ConveniencePoint <> p_Convenience
                    )
                ) THEN
                    UPDATE Products
                    SET 
                        Source = p_Source,
                        Name = p_Name,
                        Address = p_Address,
                        ProvinceCode = p_ProvinceCode,
                        DistrictCode = p_DistrictCode,
                        Latitude = p_Latitude,
                        Longitude = p_Longitude,
                        PropertyType = p_PropertyType,
                        RoomType = p_RoomType,
                        MaxGuests = p_MaxGuests,
                        NumBedrooms = p_NumBedrooms,
                        NumBeds = p_NumBeds,
                        NumBathrooms = p_NumBathrooms,
                        Price = p_Price,
                        Currency = p_Currency,
                        CleanlinessPoint = p_Cleanliness,
                        LocationPoint = p_Location,
                        ServicePoint = p_Service,
                        ValuePoint = p_Value,
                        CommunicationPoint = p_Communication,
                        ConveniencePoint = p_Convenience,
                        CreatedAt = p_CreatedAt,
                        LastSyncedAt = p_LastSyncedAt
                    WHERE ProductID = v_ProductID;
                ELSE
                    -- Chỉ cập nhật thời gian đồng bộ nếu không thay đổi gì khác
                    UPDATE Products
                    SET LastSyncedAt = p_LastSyncedAt
                    WHERE ProductID = v_ProductID;
                END IF;
            END IF;
        END;
    `);
}

async function dropUpsertAmenityGroupProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS UpsertAmenityGroup;
    `);
}

async function createUpsertAmenityGroupProcedure() {
    await pool.query(`
        
        CREATE PROCEDURE UpsertAmenityGroup(IN p_GroupName VARCHAR(255))
        BEGIN
            DECLARE v_GroupID INT;
            DECLARE v_OldName VARCHAR(255);

            SELECT AmenityGroupID, AmenityGroupName INTO v_GroupID, v_OldName
            FROM AmenityGroups
            WHERE AmenityGroupName = p_GroupName
            LIMIT 1;

            IF v_GroupID IS NULL THEN
                INSERT INTO AmenityGroups(AmenityGroupName)
                VALUES(p_GroupName);
            ELSE
                IF v_OldName <> p_GroupName THEN
                    UPDATE AmenityGroups
                    SET AmenityGroupName = p_GroupName
                    WHERE AmenityGroupID = v_GroupID;
                END IF;
            END IF;
        END;
    `);
}

async function dropUpsertAmenityProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS UpsertAmenity;
    `);
}

async function createUpsertAmenityProcedure() {
    await pool.query(`
        
        CREATE PROCEDURE UpsertAmenity(IN p_AmenityName VARCHAR(255), IN p_GroupID INT)
        BEGIN
            DECLARE v_AmenityID INT;
            DECLARE v_OldName VARCHAR(255);
            DECLARE v_OldGroupID INT;

            SELECT AmenityID, AmenityName, AmenityGroupID INTO v_AmenityID, v_OldName, v_OldGroupID
            FROM Amenities
            WHERE AmenityName = p_AmenityName
            LIMIT 1;

            IF v_AmenityID IS NULL THEN
                INSERT INTO Amenities(AmenityName, AmenityGroupID, AmenityImageURL)
                VALUES(p_AmenityName, p_GroupID, NULL);
            ELSE
                IF v_OldName <> p_AmenityName OR v_OldGroupID <> p_GroupID THEN
                    UPDATE Amenities
                    SET AmenityName = p_AmenityName,
                        AmenityGroupID = p_GroupID
                    WHERE AmenityID = v_AmenityID;
                END IF;
            END IF;
        END;
    `);
}

async function dropUpsertProductAmenityProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS UpsertProductAmenity;
    `);
}

async function createUpsertProductAmenityProcedure() {
    await pool.query(`
        
        CREATE PROCEDURE UpsertProductAmenity(IN p_ProductID INT, IN p_AmenityID INT)
        BEGIN
            DECLARE v_Count INT;

            SELECT COUNT(*) INTO v_Count
            FROM ProductAmenities
            WHERE ProductID = p_ProductID AND AmenityID = p_AmenityID;

            IF v_Count = 0 THEN
                INSERT INTO ProductAmenities(ProductID, AmenityID)
                VALUES(p_ProductID, p_AmenityID);
            END IF;
            -- Không có gì để update nên không cần phần ELSE
        END;
    `);
}

async function dropUpsertRatingProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS UpsertRating;
    `);
}

async function createUpsertRatingProcedure() {
    await pool.query(`
        
        CREATE PROCEDURE UpsertRating(
            IN p_ExternalID VARCHAR(30),
            IN p_BookingID INT,
            IN p_ProductID INT,
            IN p_Cleanliness FLOAT,
            IN p_Location FLOAT,
            IN p_Service FLOAT,
            IN p_Value FLOAT,
            IN p_Communication FLOAT,
            IN p_Convenience FLOAT
        )
        BEGIN
            DECLARE v_RatingID INT;
            
            SELECT RatingID INTO v_RatingID
            FROM Rating
            WHERE ExternalID = p_ExternalID
            LIMIT 1;
            
            IF v_RatingID IS NULL THEN
                INSERT INTO Rating(ExternalID, BookingID, ProductID, CleanlinessPoint, LocationPoint,
                                ServicePoint, ValuePoint, CommunicationPoint, ConveniencePoint)
                VALUES(p_ExternalID, p_BookingID, p_ProductID, p_Cleanliness, p_Location,
                    p_Service, p_Value, p_Communication, p_Convenience);
            ELSE
                UPDATE Rating
                SET BookingID = p_BookingID,
                    ProductID = p_ProductID,
                    CleanlinessPoint = p_Cleanliness,
                    LocationPoint = p_Location,
                    ServicePoint = p_Service,
                    ValuePoint = p_Value,
                    CommunicationPoint = p_Communication,
                    ConveniencePoint = p_Convenience
                WHERE RatingID = v_RatingID;
            END IF;
        END;
    `);
}

async function dropGetTopProductsByProvinceProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS GetTopProductsByProvince;
    `);
}

async function createGetTopProductsByProvinceProcedure() {
    await pool.query(`
        
        CREATE PROCEDURE GetTopProductsByProvince(
            IN province_code_input VARCHAR(20),
            IN limit_input INT
        )
        BEGIN
            SELECT 
                p.ProductID,
                p.UID,
                p.ExternalID,
                p.Name,
                p.Address,
                prov.Name AS ProvinceName,
                disct.Name AS DistrictName,
                p.ProvinceCode,
                p.DistrictCode,
                prop.PropertyName,
                p.Price,
                p.Currency,
                p.CleanlinessPoint,
                p.LocationPoint,
                p.ServicePoint,
                p.ValuePoint,
                p.CommunicationPoint,
                p.ConveniencePoint,
                ROUND((
                    COALESCE(p.CleanlinessPoint, 0) + 
                    COALESCE(p.LocationPoint, 0) + 
                    COALESCE(p.ServicePoint, 0) + 
                    COALESCE(p.ValuePoint, 0) + 
                    COALESCE(p.CommunicationPoint, 0) + 
                    COALESCE(p.ConveniencePoint, 0)
                ) / 6, 2) AS AverageRating,
                prop.PropertyName,
                prop.PropertyImageURL,
                rt.RoomTypeName,
                rt.RoomTypeImageURL
            FROM Products p
            LEFT JOIN Properties prop ON p.PropertyType = prop.PropertyID
            LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
            LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
            LEFT JOIN Districts disct ON p.DistrictCode = disct.DistrictCode
            WHERE p.ProvinceCode = province_code_input
                AND p.CleanlinessPoint IS NOT NULL
                AND p.LocationPoint IS NOT NULL  
                AND p.ServicePoint IS NOT NULL
                AND p.ValuePoint IS NOT NULL
                AND p.CommunicationPoint IS NOT NULL
                AND p.ConveniencePoint IS NOT NULL
            ORDER BY AverageRating DESC
            LIMIT limit_input;
        END;
    `);
}

async function installPythonDependencies() {    
    return new Promise((resolve, reject) => {
        const crawlerDir = path.join(__dirname, '../../crawler');
        const requirementsPath = path.join(crawlerDir, 'requirements.txt');
        
        // Kiểm tra xem requirements.txt có tồn tại không
        if (!require('fs').existsSync(requirementsPath)) {
            console.log('⚠️ requirements.txt not found, skipping dependency installation');
            resolve();
            return;
        }
        
        const pipProcess = spawn('pip', ['install', '-r', 'requirements.txt'], {
            cwd: crawlerDir,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdoutData = '';
        let stderrData = '';
        
        pipProcess.stdout.on('data', (data) => {
            const output = data.toString();
            stdoutData += output;
        });
        
        pipProcess.stderr.on('data', (data) => {
            const error = data.toString();
            stderrData += error;
        });
        
        pipProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Python dependencies installed successfully!');
                resolve(stdoutData);
            } else {
                console.error(`❌ Pip install failed with exit code: ${code}`);
                console.error(`❌ Error output: ${stderrData}`);
                reject(new Error(`Pip install exited with code ${code}`));
            }
        });
        
        pipProcess.on('error', (error) => {
            console.error('❌ Failed to start pip process:', error);
            // Không reject để script vẫn tiếp tục chạy
            console.log('⚠️ Continuing without dependency installation...');
            resolve();
        });
    });
}

async function importBasicData() {    
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        const dataFilePath = path.join(__dirname, '../../crawler/output/data.sql');
        
        // Kiểm tra xem file data.sql có tồn tại không
        if (!fs.existsSync(dataFilePath)) {
            console.log('⚠️ data.sql not found, skipping basic data import');
            resolve();
            return;
        }
        
        // Đọc nội dung file SQL với encoding UTF-8
        fs.readFile(dataFilePath, 'utf8', async (err, sqlContent) => {
            if (err) {
                console.error('❌ Error reading data.sql:', err);
                reject(err);
                return;
            }
            
            try {
                // Loại bỏ BOM nếu có
                if (sqlContent.charCodeAt(0) === 0xFEFF) {
                    sqlContent = sqlContent.slice(1);
                }
                
                // Tách các câu lệnh SQL bằng dấu ;
                const sqlStatements = sqlContent
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => 
                        stmt.length > 0 && 
                        !stmt.startsWith('--') && 
                        !stmt.startsWith('/*') &&
                        !stmt.toUpperCase().startsWith('USE') // Loại bỏ lệnh USE
                    );
                
                // Nhóm các statements theo bảng để đảm bảo thứ tự insert đúng
                const administrativeRegionsStatements = [];
                const administrativeUnitsStatements = [];
                const provincesStatements = [];
                const districtsStatements = [];
                const otherStatements = [];
                
                // Phân loại statements
                for (const statement of sqlStatements) {
                    const upperStmt = statement.toUpperCase();
                    if (upperStmt.includes('ADMINISTRATIVEREGIONS')) {
                        administrativeRegionsStatements.push(statement);
                    } else if (upperStmt.includes('ADMINISTRATIVEUNITS')) {
                        administrativeUnitsStatements.push(statement);
                    } else if (upperStmt.includes('PROVINCES')) {
                        provincesStatements.push(statement);
                    } else if (upperStmt.includes('DISTRICTS')) {
                        districtsStatements.push(statement);
                    } else {
                        otherStatements.push(statement);
                    }
                }
                
                // Thực thi theo thứ tự đúng để tránh foreign key constraint
                const orderedStatements = [
                    ...administrativeRegionsStatements,
                    ...administrativeUnitsStatements,
                    ...provincesStatements,
                    ...districtsStatements,
                    ...otherStatements
                ];
                
                // Thực thi từng câu lệnh SQL
                for (let i = 0; i < orderedStatements.length; i++) {
                    const statement = orderedStatements[i];
                    if (statement) {
                        try {
                            await pool.execute(statement);
                        } catch (execError) {
                            // Ignore duplicate entry errors for INSERT statements
                            if (execError.code === 'ER_DUP_ENTRY') {
                                // Skip duplicate entries silently
                                continue;
                            } else {
                                console.error(`❌ Error executing statement ${i + 1}: ${execError.message}`);
                                console.error(`❌ Statement: ${statement.substring(0, 100)}...`);
                                // Continue with next statement instead of failing completely
                            }
                        }
                    }
                }
                
                console.log('✅ Basic data import completed successfully!');
                resolve();
                
            } catch (parseError) {
                console.error('❌ Error parsing SQL file:', parseError);
                reject(parseError);
            }
        });
    });
}

async function runCrawlerDataImport() {
    console.log('🐍 Starting crawler data import...');
    
    return new Promise((resolve, reject) => {
        // Đường dẫn đến file Python
        const crawlerPath = path.join(__dirname, '../../crawler/database/upsert_listing_info.py');
        const crawlerDir = path.join(__dirname, '../../crawler');
        
        // Spawn Python process
        const pythonProcess = spawn('python', [crawlerPath], {
            cwd: crawlerDir,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdoutData = '';
        let stderrData = '';
        
        pythonProcess.stdout.on('data', (data) => {
            const output = data.toString();
            stdoutData += output;
            console.log(`🐍 Python: ${output.trim()}`);
        });
        
        pythonProcess.stderr.on('data', (data) => {
            const error = data.toString();
            stderrData += error;
            console.error(`🐍 Python Error: ${error.trim()}`);
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Crawler data import completed successfully!');
                resolve(stdoutData);
            } else {
                console.error(`❌ Crawler data import failed with exit code: ${code}`);
                console.error(`❌ Error output: ${stderrData}`);
                reject(new Error(`Python script exited with code ${code}`));
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.error('❌ Failed to start Python process:', error);
            reject(error);
        });
    });
}

async function initSchema() {
    console.log('🚀 Initializing database schema...');
    
    try {
        await testConnection();
        
        console.log('\n📋 Creating tables...');

        await createAdministrativeRegionsTable();
        console.log('✅ AdministrativeRegions table ready');
        
        await createAdministrativeUnitsTable();
        console.log('✅ AdministrativeUnits table ready');
        
        await createProvincesTable();
        console.log('✅ Provinces table ready');
        
        await createDistrictsTable();
        console.log('✅ Districts table ready');
        
        await createUsersTable();
        console.log('✅ Users table ready');
        
        await createOAuthAccountsTable();
        console.log('✅ OAuthAccounts table ready');
        
        await createPaymentMethodsTable();
        console.log('✅ PaymentMethods table ready');
        
        await createPropertiesTable();
        console.log('✅ Properties table ready');
        
        await createRoomTypesTable();
        console.log('✅ RoomTypes table ready');
        
        await createProductsTable();
        console.log('✅ Products table ready');
        
        await createAmenityGroupsTable();
        console.log('✅ AmenityGroups table ready');
        
        await createAmenitiesTable();
        console.log('✅ Amenities table ready');
        
        await createProductAmenitiesTable();
        console.log('✅ ProductAmenities table ready');
        
        await createAuctionTable();
        console.log('✅ Auction table ready');
        
        await createBidsTable();
        console.log('✅ Bids table ready');
        
        await createBookingTable();
        console.log('✅ Booking table ready');
        
        await createRatingTable();
        console.log('✅ Rating table ready');

        console.log('\n📋 Creating procedures...');

        await dropUpsertPropertyProcedureIfExists();
        await createUpsertPropertyProcedure();
        console.log('✅ UpsertProperty procedure ready');

        await dropUpsertRoomTypeProcedureIfExists();
        await createUpsertRoomTypeProcedure();
        console.log('✅ UpsertRoomType procedure ready');

        await dropUpsertProductProcedureIfExists();
        await createUpsertProductProcedure();
        console.log('✅ UpsertProduct procedure ready');

        await dropUpsertAmenityGroupProcedureIfExists();
        await createUpsertAmenityGroupProcedure();
        console.log('✅ UpsertAmenityGroup procedure ready');

        await dropUpsertAmenityProcedureIfExists();
        await createUpsertAmenityProcedure();
        console.log('✅ UpsertAmenity procedure ready');

        await dropUpsertProductAmenityProcedureIfExists();
        await createUpsertProductAmenityProcedure();
        console.log('✅ UpsertProductAmenity procedure ready');

        await dropUpsertRatingProcedureIfExists();
        await createUpsertRatingProcedure();
        console.log('✅ UpsertRating procedure ready');

        await dropGetTopProductsByProvinceProcedureIfExists();
        await createGetTopProductsByProvinceProcedure();
        console.log('✅ GetTopProductsByProvince procedure ready');
        
        // Cài đặt Python dependencies
        console.log('\n📦 Installing Python dependencies...');
        await installPythonDependencies();
        
        // Import dữ liệu cơ bản từ data.sql
        console.log('\n📊 Importing basic data...');
        await importBasicData();
        
        // Chạy crawler data import sau khi schema và basic data được tạo xong
        // console.log('\n📋 Starting crawler data import process...');
        // await runCrawlerDataImport();

        console.log('\n🎉 Database schema initialization completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error during database schema initialization:', error);
        throw error;
    }
}

initSchema();

module.exports = pool;