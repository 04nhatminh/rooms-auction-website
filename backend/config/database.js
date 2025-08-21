require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const { spawn } = require('child_process');
const path = require('path');
const { create } = require('domain');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'a2airbnb',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    supportBigNumbers: true,
    bigNumberStrings: true
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

async function configureSession() {
  await pool.query(`SET SESSION time_zone = '+00:00'`);
  await pool.query(`
    SET SESSION sql_mode =
    'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY'
  `);
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
            Email VARCHAR(255) NOT NULL UNIQUE,
            HashPassword VARCHAR(255),
            PhoneNumber VARCHAR(20),
            DateOfBirth DATE NULL,
            Gender ENUM('male','female','other') NULL,
            Address VARCHAR(512) NULL,
            AvatarURL TEXT,
            Role ENUM('guest', 'admin') DEFAULT 'guest',
            Rating DECIMAL(3,2) DEFAULT 0.0,
            IsVerified TINYINT(1) DEFAULT FALSE,
            VerificationToken VARCHAR(255),
            VerificationTokenExpires DATETIME,
            Status ENUM('active','disabled','suspended','deleted') DEFAULT 'active',
            SuspendedUntil DATETIME NULL,
            UnpaidStrikeCount INT NOT NULL DEFAULT 0,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    try {
        await pool.execute(`CREATE INDEX idx_Users_Email ON Users(Email)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Users_Status ON Users(Status)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
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
            IsDefault TINYINT(1) DEFAULT 0,
            UserID INT,
            CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
            Latitude DECIMAL(9,6),
            Longitude DECIMAL(9,6),
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
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            LastSyncedAt TIMESTAMP NULL DEFAULT NULL,
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

    try {
        await pool.execute(`CREATE UNIQUE INDEX idx_Products_UID ON Products(UID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
}

async function createFavoritesTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Favorites (
            FavoriteID INT AUTO_INCREMENT PRIMARY KEY,
            UserID INT NOT NULL,
            ProductID INT NOT NULL,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
            UNIQUE KEY unique_user_product (UserID, ProductID)
        );
    `);

    try {
        await pool.execute(`CREATE INDEX idx_Favorites_UserID ON Favorites(UserID)`);
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
        await pool.execute(`CREATE INDEX idx_ProductAmenities_Product ON ProductAmenities(ProductID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    try {
        await pool.execute(`CREATE INDEX idx_ProductAmenities_Amenity ON ProductAmenities(AmenityID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
}

async function createAuctionTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Auction (
            AuctionID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            ProductID INT,
            StartTime TIMESTAMP NULL DEFAULT NULL,
            EndTime TIMESTAMP NULL DEFAULT NULL,
            InstantPrice DECIMAL(10, 2),
            StartPrice DECIMAL(10, 2),
            BidIncrement DECIMAL(10, 2),
            CurrentPrice DECIMAL(10, 2),
            Status ENUM('active','ended','cancelled') DEFAULT 'active',
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

     try {
        await pool.execute(`CREATE INDEX idx_Bids_AuctionBidTime ON Bids(AuctionID, BidTime)`);
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
            BookingStatus ENUM('pending','confirmed','cancelled','completed','expired') DEFAULT 'pending',
            WinningPrice DECIMAL(10, 2),
            PaymentMethodID INT,
            PaidAt TIMESTAMP,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

    try {
        await pool.execute(`CREATE INDEX idx_Booking_UserStatus ON Booking(UserID, BookingStatus)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Booking_ProductDates ON Booking(ProductID, StartDate, EndDate)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
}

async function createCalendarTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Calendar (
            ProductID INT NOT NULL,
            Day DATE NOT NULL,
            Status ENUM('available','reserved','booked','blocked') NOT NULL DEFAULT 'available',
            LockReason ENUM('booking_hold','manual','auction','external_sync') NULL,
            BookingID INT UNSIGNED NULL,    -- nếu status=reserved/booked
            AuctionID INT UNSIGNED NULL,    -- nếu status=auction
            HoldExpiresAt DATETIME NULL,  -- cho “giữ chỗ tạm” (reserve)
            CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (ProductID, Day)
        );
    `);

    const dbname = dbConfig.database;
    const triggerNames = ['bi_Calendar_validate', 'bu_Calendar_validate', 'bi_Calendar_refcheck', 'bu_Calendar_refcheck'];

    // Kiểm tra tồn tại trong INFORMATION_SCHEMA rồi DROP từng cái
    const [trgRows] = await pool.query(
        `SELECT TRIGGER_NAME 
        FROM INFORMATION_SCHEMA.TRIGGERS 
        WHERE TRIGGER_SCHEMA = ? 
            AND TRIGGER_NAME IN (?, ?, ?, ?)`,
        [dbname, ...triggerNames]
    );

    for (const r of trgRows) {
        // schema-qualified DROP
        await pool.query(`DROP TRIGGER IF EXISTS \`${dbname}\`.\`${r.TRIGGER_NAME}\``);
    }

    const validateBody = `
        BEGIN
        IF NEW.Status = 'available' THEN
            SET NEW.BookingID = NULL,
                NEW.AuctionID = NULL,
                NEW.LockReason = NULL,
                NEW.HoldExpiresAt = NULL;

        ELSEIF NEW.Status = 'reserved' THEN
            IF NEW.LockReason IS NULL THEN SET NEW.LockReason = 'booking_hold'; END IF;
            IF NOT (NEW.LockReason = 'booking_hold' AND NEW.BookingID IS NOT NULL AND NEW.HoldExpiresAt IS NOT NULL) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'reserved: require LockReason=booking_hold, BookingID, HoldExpiresAt';
            END IF;
            SET NEW.AuctionID = NULL;

        ELSEIF NEW.Status = 'booked' THEN
            IF NEW.BookingID IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'booked: require BookingID';
            END IF;
            SET NEW.LockReason = NULL,
                NEW.HoldExpiresAt = NULL,
                NEW.AuctionID = NULL;

        ELSEIF NEW.Status = 'blocked' THEN
            IF NEW.LockReason = 'auction' THEN
                IF NEW.AuctionID IS NULL THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'blocked(auction): require AuctionID';
                END IF;
                SET NEW.BookingID = NULL,
                    NEW.HoldExpiresAt = NULL;

            ELSEIF NEW.LockReason IN ('manual','external_sync') THEN
                SET NEW.BookingID = NULL,
                    NEW.AuctionID = NULL,
                    NEW.HoldExpiresAt = NULL;

            ELSE
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'blocked: LockReason must be auction/manual/external_sync';
            END IF;

        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unknown Status';
        END IF;
        END
    `;

    try {
        await pool.query(`
            CREATE TRIGGER \`${dbname}\`.\`bi_Calendar_validate\`
            BEFORE INSERT ON \`${dbname}\`.\`Calendar\`
            FOR EACH ROW
            ${validateBody}
        `);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.query(`
            CREATE TRIGGER \`${dbname}\`.\`bu_Calendar_validate\`
            BEFORE UPDATE ON \`${dbname}\`.\`Calendar\`
            FOR EACH ROW
            ${validateBody}
        `);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
    const refcheckBody = `
    BEGIN
        DECLARE v_exists INT;

        -- Product phải tồn tại
        SELECT 1 INTO v_exists FROM Products WHERE Products.ProductID = NEW.ProductID LIMIT 1;
        IF v_exists IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ProductID not found';
        END IF;

        -- BookingID nếu có phải tồn tại
        IF NEW.BookingID IS NOT NULL THEN
            SET v_exists = NULL;
            SELECT 1 INTO v_exists FROM Booking WHERE Booking.BookingID = NEW.BookingID LIMIT 1;
            IF v_exists IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BookingID not found';
            END IF;
        END IF;

        -- AuctionID nếu có phải tồn tại
        IF NEW.AuctionID IS NOT NULL THEN
            SET v_exists = NULL;
            SELECT 1 INTO v_exists FROM Auction WHERE Auction.AuctionID = NEW.AuctionID LIMIT 1;
            IF v_exists IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'AuctionID not found';
            END IF;
        END IF;
    END`;

    try {
        await pool.query(`
            CREATE TRIGGER \`${dbname}\`.\`bi_Calendar_refcheck\`
            BEFORE INSERT ON \`${dbname}\`.\`Calendar\`
            FOR EACH ROW
            ${refcheckBody}
        `);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.query(`
            CREATE TRIGGER \`${dbname}\`.\`bu_Calendar_refcheck\`
            BEFORE UPDATE ON \`${dbname}\`.\`Calendar\`
            FOR EACH ROW
            ${refcheckBody}
        `);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Calendar_BookingID ON Calendar(BookingID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Calendar_AuctionID ON Calendar(AuctionID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Calendar_Day ON Calendar(Day)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Calendar_StatusDayProductID ON Calendar(Status, Day, ProductID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    const [pinfo] = await pool.query(`
        SELECT 
        SUM(CASE WHEN PARTITION_NAME IS NOT NULL THEN 1 ELSE 0 END) AS part_count,
        SUM(CASE WHEN PARTITION_NAME = 'pmax' THEN 1 ELSE 0 END)    AS has_pmax
        FROM information_schema.PARTITIONS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Calendar';
    `, [dbname]);

    const partCount = Number(pinfo?.[0]?.part_count || 0);
    const hasPmax   = Number(pinfo?.[0]?.has_pmax   || 0);

    if (partCount === 0) {
        // Bảng chưa partition -> thêm scheme với pmax
        await pool.query(`
        ALTER TABLE \`${dbname}\`.\`Calendar\`
        PARTITION BY RANGE COLUMNS(Day) (
            PARTITION pmax VALUES LESS THAN (MAXVALUE)
        );
        `);
    } else if (hasPmax === 0) {
        // Đã partition nhưng thiếu pmax -> bổ sung pmax
        await pool.query(`
        ALTER TABLE \`${dbname}\`.\`Calendar\`
        ADD PARTITION (
            PARTITION pmax VALUES LESS THAN (MAXVALUE)
        );
        `);
    }
}

async function createPaymentsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Payments (
            PaymentID BIGINT AUTO_INCREMENT PRIMARY KEY,
            BookingID INT UNSIGNED NOT NULL,
            UserID INT NOT NULL,
            Amount DECIMAL(10,2) NOT NULL,
            Currency VARCHAR(10) NOT NULL DEFAULT 'VND',
            Provider VARCHAR(50) NOT NULL,
            ProviderTxnID VARCHAR(128) NULL,
            Status ENUM('initiated','authorized','captured','failed','refunded','voided') NOT NULL DEFAULT 'initiated',
            FailureReason VARCHAR(255) NULL,
            CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (BookingID) REFERENCES Booking(BookingID),
            FOREIGN KEY (UserID) REFERENCES Users(UserID),
            UNIQUE KEY uq_provider_txn (Provider, ProviderTxnID)
        );
    `);

    try {
        await pool.execute(`CREATE INDEX idx_Payments_BookingID ON Payments(BookingID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Payments_UserID ON Payments(UserID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Payments_Status ON Payments(Status)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Payments_CreatedAt ON Payments(CreatedAt)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
}

async function createUserViolationsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS UserViolations (
            ViolationID BIGINT AUTO_INCREMENT PRIMARY KEY,
            UserID INT NOT NULL,
            BookingID INT UNSIGNED NULL,
            Kind ENUM('non_payment') NOT NULL,
            Note VARCHAR(255) NULL,
            CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_user_booking_kind (UserID, BookingID, Kind),
            INDEX idx_user_kind (UserID, Kind),
            FOREIGN KEY (UserID) REFERENCES Users(UserID),
            FOREIGN KEY (BookingID) REFERENCES Booking(BookingID) ON DELETE SET NULL
        );
    `);

    try {
        await pool.execute(`CREATE INDEX idx_UserViolations_BookingID ON UserViolations(BookingID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
}

async function createEmailOutboxTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS EmailOutbox (
            EmailID BIGINT AUTO_INCREMENT PRIMARY KEY,
            ToEmail VARCHAR(255) NOT NULL,
            Subject VARCHAR(255) NOT NULL,
            Body TEXT NOT NULL,
            SendAfter DATETIME DEFAULT CURRENT_TIMESTAMP,
            Meta JSON NULL,
            ProcessedAt DATETIME NULL,
            CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_unprocessed (ProcessedAt)
        );
    `);
}

async function createRatingTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Rating (
            RatingID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            UserID INT NOT NULL,
            BookingID INT UNSIGNED,
            ProductID INT,
            CleanlinessPoint FLOAT,
            LocationPoint FLOAT,
            ServicePoint FLOAT,
            ValuePoint FLOAT,
            CommunicationPoint FLOAT,
            ConveniencePoint FLOAT,
            Comment TEXT,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_rating_booking_user (BookingID, UserID),
            FOREIGN KEY (UserID) REFERENCES Users(UserID),
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

async function dropAddToFavoritesProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS AddToFavorites;
    `);
}

async function dropRemoveFromFavoritesProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS RemoveFromFavorites;
    `);
}

async function createAddToFavoritesProcedure() {
    await pool.query(`
        CREATE PROCEDURE AddToFavorites(
            IN p_UserID INT,
            IN p_ProductID INT
        )
        BEGIN
            DECLARE v_Count INT DEFAULT 0;
            DECLARE v_UserExists INT DEFAULT 0;
            DECLARE v_ProductExists INT DEFAULT 0;
            
            SELECT COUNT(*) INTO v_UserExists 
            FROM Users 
            WHERE UserID = p_UserID;
            
            SELECT COUNT(*) INTO v_ProductExists 
            FROM Products 
            WHERE ProductID = p_ProductID;
            
            IF v_UserExists = 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
            END IF;
            
            IF v_ProductExists = 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product not found';
            END IF;
            
            SELECT COUNT(*) INTO v_Count
            FROM Favorites
            WHERE UserID = p_UserID AND ProductID = p_ProductID;
            
            IF v_Count = 0 THEN
                INSERT INTO Favorites(UserID, ProductID, CreatedAt)
                VALUES(p_UserID, p_ProductID, NOW());
                
                SELECT 'SUCCESS' AS Status, 'Product added to favorites' AS Message;
            ELSE
                SELECT 'INFO' AS Status, 'Product already in favorites' AS Message;
            END IF;
        END;
    `);
}

async function createRemoveFromFavoritesProcedure() {
    await pool.query(`
        CREATE PROCEDURE RemoveFromFavorites(
            IN p_UserID INT,
            IN p_ProductID INT
        )
        BEGIN
            DECLARE v_Count INT DEFAULT 0;
            
            SELECT COUNT(*) INTO v_Count
            FROM Favorites
            WHERE UserID = p_UserID AND ProductID = p_ProductID;
            
            IF v_Count > 0 THEN
                DELETE FROM Favorites
                WHERE UserID = p_UserID AND ProductID = p_ProductID;
                
                SELECT 'SUCCESS' AS Status, 'Product removed from favorites' AS Message;
            ELSE
                SELECT 'INFO' AS Status, 'Product not found in favorites' AS Message;
            END IF;
        END;
    `);
}

async function dropGetUserFavoritesProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS GetUserFavorites;
    `);
}

async function createGetUserFavoritesProcedure() {
    await pool.query(`
        CREATE PROCEDURE GetUserFavorites(
            IN p_UserID INT,
            IN p_Limit INT,
            IN p_Offset INT
        )
        BEGIN
            SELECT 
                f.FavoriteID,
                f.UserID,
                f.ProductID,
                f.CreatedAt,
                p.UID,
                p.Name AS ProductName,
                p.Address,
                p.Price,
                p.Currency,
                prop.PropertyName,
                rt.RoomTypeName,
                prov.Name AS ProvinceName,
                ROUND((
                    COALESCE(p.CleanlinessPoint, 0) + 
                    COALESCE(p.LocationPoint, 0) + 
                    COALESCE(p.ServicePoint, 0) + 
                    COALESCE(p.ValuePoint, 0) + 
                    COALESCE(p.CommunicationPoint, 0) + 
                    COALESCE(p.ConveniencePoint, 0)
                ) / 6, 2) AS AverageRating
            FROM Favorites f
            JOIN Products p ON f.ProductID = p.ProductID
            LEFT JOIN Properties prop ON p.PropertyType = prop.PropertyID
            LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
            LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
            WHERE f.UserID = p_UserID
            ORDER BY f.CreatedAt DESC
            LIMIT p_Limit OFFSET p_Offset;
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

async function dropGetTopProductsByDistrictProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS GetTopProductsByDistrict;
    `);
}

async function createGetTopProductsByDistrictProcedure() {
    await pool.query(`
        CREATE PROCEDURE GetTopProductsByDistrict(
            IN district_code_input VARCHAR(20),
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
            WHERE p.DistrictCode = district_code_input
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

async function dropGetPopularProvincesProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS GetPopularProvinces;
    `);
}

async function createGetPopularProvincesProcedure() {
    await pool.query(`
        CREATE PROCEDURE GetPopularProvinces(IN p_limit INT)
        BEGIN
            SELECT 
                prov.ProvinceCode AS code,
                prov.Name,
                prov.NameEn,
                prov.CodeName,
                COUNT(p.ProductID) AS ProductCount,
                'province' AS type
            FROM Provinces prov
            LEFT JOIN Products p 
                ON prov.ProvinceCode = p.ProvinceCode
            GROUP BY 
                prov.ProvinceCode, 
                prov.Name, 
                prov.NameEn, 
                prov.FullName, 
                prov.FullNameEn, 
                prov.CodeName
            HAVING ProductCount > 0
            ORDER BY 
                ProductCount DESC, 
                prov.Name ASC
            LIMIT p_limit;
        END;
    `);
}

async function dropGetPopularDistrictsProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS GetPopularDistricts;
    `);
}

async function createGetPopularDistrictsProcedure() {
    await pool.query(`
        CREATE PROCEDURE GetPopularDistricts(IN p_limit INT)
        BEGIN
            SELECT 
                disct.DistrictCode AS code,
                disct.Name,
                disct.NameEn,
                disct.CodeName,
                COUNT(p.ProductID) AS ProductCount,
                'district' AS type
            FROM Districts disct
            LEFT JOIN Products p 
                ON disct.DistrictCode = p.DistrictCode
            GROUP BY 
                disct.DistrictCode, 
                disct.Name, 
                disct.NameEn, 
                disct.CodeName
            HAVING ProductCount > 0
            ORDER BY 
                ProductCount DESC, 
                disct.Name ASC
            LIMIT p_limit;
        END;
    `);
}

async function dropSearchProvincesProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS SearchProvinces;
    `);
}

async function createSearchProvincesProcedure() {
    await pool.query(`
        CREATE PROCEDURE SearchProvinces(
            IN p_name VARCHAR(255),
            IN p_limit INT
        )
        BEGIN
            SELECT 
                ProvinceCode AS code,
                Name,
                NameEn,
                FullName,
                FullNameEn,
                CodeName,
                'province' AS type
            FROM Provinces
            WHERE 
                Name = p_name OR 
                NameEn = p_name OR 
                FullName = p_name OR 
                FullNameEn = p_name OR 
                CodeName = p_name
            ORDER BY 
                CASE 
                    WHEN Name = p_name THEN 1
                    WHEN FullName = p_name THEN 2
                    ELSE 3
                END,
                Name ASC
            LIMIT p_limit;
        END;
    `);
}

async function dropSearchDistrictsProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS SearchDistricts;
    `);
}

async function createSearchDistrictsProcedure() {
    await pool.query(`
        CREATE PROCEDURE SearchDistricts(
            IN p_name VARCHAR(255),
            IN p_limit INT
        )
        BEGIN
            SELECT 
                d.DistrictCode AS code,
                d.Name,
                d.NameEn,
                d.FullName,
                d.FullNameEn,
                d.CodeName,
                d.ProvinceCode,
                p.Name AS ProvinceName,
                p.NameEn AS ProvinceNameEn,
                'district' AS type
            FROM Districts d
            LEFT JOIN Provinces p 
                ON d.ProvinceCode = p.ProvinceCode
            WHERE 
                d.Name = p_name OR 
                d.NameEn = p_name OR 
                d.FullName = p_name OR 
                d.FullNameEn = p_name OR 
                d.CodeName = p_name
            ORDER BY 
                CASE 
                    WHEN d.Name = p_name THEN 1 
                    WHEN d.FullName = p_name THEN 2 
                    ELSE 3 
                END,
                d.Name ASC
            LIMIT p_limit;
        END;
    `);
}

async function dropSearchProductIDFromUIDProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS SearchProductIDFromUID;
    `);
}

async function createSearchProductIDFromUIDProcedure() {
    await pool.query(`
        CREATE PROCEDURE SearchProductIDFromUID(
            IN p_uid BIGINT UNSIGNED
        )
        BEGIN
            SELECT ProductID FROM Products WHERE UID = p_uid;
        END;
    `);
}

async function dropGetAllProvincesProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS GetAllProvinces;
    `);
}

async function createGetAllProvincesProcedure() {
    await pool.query(`
        CREATE PROCEDURE GetAllProvinces()
        BEGIN
            SELECT 
                ProvinceCode AS code,
                Name,
                NameEn,
                'province' AS type
            FROM Provinces;
        END;
    `);
}

async function dropGetAllDistrictsProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS GetAllDistricts;
    `);
}

async function createGetAllDistrictsProcedure() {
    await pool.query(`
        CREATE PROCEDURE GetAllDistricts()
        BEGIN
            SELECT 
                DistrictCode AS code,
                Name,
                NameEn,
                'district' AS type
            FROM Districts;
        END;
    `);
}

async function dropRotateMonthPartitionsProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS RotateMonthPartitions;
    `);
}

async function createRotateMonthPartitionsProcedure(pool) {
    await pool.query(`
        CREATE PROCEDURE RotateMonthPartitions(
        IN in_schema VARCHAR(64),
        IN in_table  VARCHAR(64),
        IN keep_months INT
        )
        proc: BEGIN
            DECLARE v_schema VARCHAR(64);
            DECLARE v_table  VARCHAR(64);

            DECLARE v_today DATE;
            DECLARE v_month0 DATE;        -- ngày 1 của tháng hiện tại
            DECLARE v_is_first_day BOOLEAN;

            DECLARE v_has_pmax INT DEFAULT 0;

            DECLARE i INT DEFAULT 0;
            DECLARE v_part_name VARCHAR(16);
            DECLARE v_part_boundary DATE;

            DECLARE v_sql TEXT;

            -- Cursor xóa partition cũ (boundary < v_month0)
            DECLARE c_name VARCHAR(64);
            DECLARE done INT DEFAULT 0;
            DECLARE cur_old CURSOR FOR
                SELECT PARTITION_NAME
                FROM information_schema.PARTITIONS
                WHERE TABLE_SCHEMA = v_schema
                AND TABLE_NAME   = v_table
                AND PARTITION_NAME IS NOT NULL
                AND PARTITION_NAME <> 'pmax'
                AND PARTITION_DESCRIPTION REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                AND PARTITION_DESCRIPTION < DATE_FORMAT(v_month0, '%Y-%m-%d');
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

            -- Chuẩn hóa input
            SET v_schema = NULLIF(TRIM(in_schema), '');
            IF v_schema IS NULL THEN SET v_schema = DATABASE(); END IF;

            SET v_table = TRIM(in_table);
            IF v_table IS NULL OR v_table = '' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Table name is required';
            END IF;

            IF keep_months IS NULL OR keep_months < 1 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'keep_months must be >= 1';
            END IF;

            -- Chỉ chạy đầu tháng
            SET v_today = CURRENT_DATE();
            SET v_month0 = DATE_SUB(v_today, INTERVAL DAY(v_today) - 1 DAY);
            SET v_is_first_day = (v_today = v_month0);
            /*IF NOT v_is_first_day THEN
                LEAVE proc;
            END IF;*/

            -- Phải có pmax
            SELECT COUNT(*) INTO v_has_pmax
            FROM information_schema.PARTITIONS
            WHERE TABLE_SCHEMA = v_schema
            AND TABLE_NAME   = v_table
            AND PARTITION_NAME = 'pmax';
            IF v_has_pmax = 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing partition pmax (MAXVALUE).';
            END IF;

            -- (1) Xóa tất cả partition cũ (boundary < ngày đầu tháng hiện tại)
            OPEN cur_old;
            old_loop: LOOP
                FETCH cur_old INTO c_name;
                IF done = 1 THEN LEAVE old_loop; END IF;

                SET v_sql = CONCAT(
                'ALTER TABLE ', v_schema, '.', v_table, ' DROP PARTITION ', c_name
                );
                SET @sql := v_sql;
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END LOOP;
            CLOSE cur_old;

            -- (2) Bổ sung đủ các partition từ tháng hiện tại → hiện tại + (keep_months - 1)
            SET i = 0;
            ensure_loop: WHILE i < keep_months DO
                SET v_part_name = CONCAT('p', DATE_FORMAT(DATE_ADD(v_month0, INTERVAL i MONTH), '%Y_%m'));
                SET v_part_boundary = DATE_ADD(DATE_ADD(v_month0, INTERVAL i MONTH), INTERVAL 1 MONTH);

                IF NOT EXISTS (
                SELECT 1
                FROM information_schema.PARTITIONS
                WHERE TABLE_SCHEMA = v_schema
                    AND TABLE_NAME   = v_table
                    AND PARTITION_NAME = v_part_name
                ) THEN
                SET v_sql = CONCAT(
                    'ALTER TABLE ', v_schema, '.', v_table, ' ',
                    'REORGANIZE PARTITION pmax INTO (',
                    'PARTITION ', v_part_name, ' VALUES LESS THAN (''',
                    DATE_FORMAT(v_part_boundary, '%Y-%m-01'), '''), ',
                    'PARTITION pmax VALUES LESS THAN (MAXVALUE)',
                    ')'
                );
                SET @sql := v_sql;
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                END IF;

                SET i = i + 1;
            END WHILE;

        END
    `);
}

async function dropAddCalendarForRoomProcedureIfExists() {
    await pool.query(`
        DROP PROCEDURE IF EXISTS AddCalendarForRoom;
    `);
}

async function createAddCalendarForRoomProcedure() {
    await pool.query(`
        CREATE PROCEDURE \`AddCalendarForRoom\`(
        IN in_schema       VARCHAR(64),   -- NULL => DATABASE()
        IN in_product_id   INT,           -- NULL => tất cả Products
        IN in_months_ahead INT            -- số tháng (>=1)
        )
        BEGIN
            DECLARE v_months INT;
            DECLARE v_cur DATE;
            DECLARE v_end DATE;
            DECLARE v_total BIGINT DEFAULT 0;

            -- months >= 1
            SET v_months = IFNULL(in_months_ahead, 6);
            IF v_months < 1 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'in_months_ahead must be >= 1';
            END IF;

            -- [v_cur .. v_end) theo ngày
            SET v_cur = DATE_SUB(CURRENT_DATE(), INTERVAL DAY(CURRENT_DATE())-1 DAY);
            SET v_end = DATE_ADD(v_cur, INTERVAL v_months MONTH);

            day_loop: WHILE v_cur < v_end DO
                -- chỉ chèn (ProductID, v_cur) chưa tồn tại
                INSERT INTO Calendar (ProductID, Day, Status)
                SELECT p.ProductID, v_cur, 'available'
                FROM Products p
                LEFT JOIN Calendar c
                    ON c.ProductID = p.ProductID AND c.Day = v_cur
                WHERE c.ProductID IS NULL
                AND (in_product_id IS NULL OR p.ProductID = in_product_id);

                SET v_total = v_total + ROW_COUNT();

                SET v_cur = DATE_ADD(v_cur, INTERVAL 1 DAY);
            END WHILE;

            -- trả về số dòng đã thêm (optional)
            SELECT v_total AS inserted_rows;
        END
    `);
}


async function initSchema() {
    try {
        await testConnection();
        await configureSession();
        console.log('✅ Database connection established successfully!');
        
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

        await createFavoritesTable();
        console.log('✅ Favorites table ready');

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

        await createCalendarTable();
        console.log('✅ Calendar table ready');

        await createPaymentsTable();
        console.log('✅ Payments table ready');

        await createUserViolationsTable();
        console.log('✅ UserViolations table ready');

        await createEmailOutboxTable();
        console.log('✅ EmailOutbox table ready');
        
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

        await dropAddToFavoritesProcedureIfExists();
        await createAddToFavoritesProcedure();
        console.log('✅ AddToFavorites procedure ready');

        await dropRemoveFromFavoritesProcedureIfExists();
        await createRemoveFromFavoritesProcedure();
        console.log('✅ RemoveFromFavorites procedure ready');

        await dropGetUserFavoritesProcedureIfExists();
        await createGetUserFavoritesProcedure();
        console.log('✅ GetUserFavorites procedure ready');

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

        await dropGetTopProductsByDistrictProcedureIfExists();
        await createGetTopProductsByDistrictProcedure();
        console.log('✅ GetTopProductsByDistrict procedure ready');

        await dropGetPopularProvincesProcedureIfExists();
        await createGetPopularProvincesProcedure();
        console.log('✅ GetPopularProvinces procedure ready');

        await dropGetPopularDistrictsProcedureIfExists();
        await createGetPopularDistrictsProcedure();
        console.log('✅ GetPopularDistricts procedure ready');

        await dropSearchProvincesProcedureIfExists();
        await createSearchProvincesProcedure();
        console.log('✅ SearchProvinces procedure ready');

        await dropSearchDistrictsProcedureIfExists();
        await createSearchDistrictsProcedure();
        console.log('✅ SearchDistricts procedure ready');

        await dropSearchProductIDFromUIDProcedureIfExists();
        await createSearchProductIDFromUIDProcedure();
        console.log('✅ SearchProductIDFromUID procedure ready');

        await dropGetAllProvincesProcedureIfExists();
        await createGetAllProvincesProcedure();
        console.log('✅ GetAllProvinces procedure ready');

        await dropGetAllDistrictsProcedureIfExists();
        await createGetAllDistrictsProcedure();
        console.log('✅ GetAllDistricts procedure ready');

        await dropRotateMonthPartitionsProcedureIfExists();
        await createRotateMonthPartitionsProcedure(pool);
        console.log('✅ RotateMonthPartitions procedure ready');

        await pool.execute('CALL RotateMonthPartitions(NULL, ?, ?)', ['Calendar', 12]);
        console.log('✅ Initial partition rotation for Calendar table completed');

        await dropAddCalendarForRoomProcedureIfExists();
        await createAddCalendarForRoomProcedure();
        console.log('✅ AddCalendarForRoom procedure ready');

        console.log('\n🎉 Database schema initialization completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error during database schema initialization:', error);
        throw error;
    }
}

initSchema();

module.exports = pool;