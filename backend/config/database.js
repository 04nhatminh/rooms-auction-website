require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { create } = require('domain');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3308,
    password: process.env.DB_PASSWORD || '22127007', 
    database: process.env.DB_NAME || 'a2airbnb',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    supportBigNumbers: true,
    bigNumberStrings: true,
    decimalNumbers: true
};

console.log('🔍 Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    port: dbConfig.port,
    password: dbConfig.password ? '***hidden***' : 'empty',
    database: dbConfig.database
});

const pool = mysql.createPool(dbConfig);

pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+07:00'");
  conn.query("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY'");
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL thành công!');
        connection.release();
    } catch (error) {
        console.error('❌ Lỗi kết nối MySQL:', error.message);
    }
}

async function createSystemParametersTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS SystemParameters (
            ParamID INT PRIMARY KEY AUTO_INCREMENT,
            ParamName VARCHAR(255) NOT NULL,
            ParamValue VARCHAR(255) NOT NULL
        )
    `);

    const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM SystemParameters`);
    if (rows[0].cnt == 0) {
        await pool.query(`
        INSERT INTO SystemParameters (ParamName, ParamValue) VALUES
            ('StartPriceFactor', '0.7'),
            ('BidIncrementFactor', '0.05'),
            ('AuctionDurationDays', '5'),
            ('BidLeadTimeDays', '15'),
            ('PaymentDeadlineTime', '30'),
            ('ServiceFeeFactor', '0.15')
        `);
        console.log("✅ Seeded default SystemParameters");
    } else {
        console.log("ℹ️ SystemParameters already have data");
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

    const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM AdministrativeRegions`);
    if (rows[0].cnt == 0) {
        const sqlFile = path.join(__dirname, 'data/regions_data.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        await pool.query(sqlContent);
        console.log("✅ Seeded AdministrativeRegions from regions_data.sql");
    } else {
        console.log("ℹ️ AdministrativeRegions already have data");
    }
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

    const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM AdministrativeUnits`);
    if (rows[0].cnt == 0) {
        const sqlFile = path.join(__dirname, 'data/units_data.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        await pool.query(sqlContent);
        console.log("✅ Seeded AdministrativeUnits from units_data.sql");
    } else {
        console.log("ℹ️ AdministrativeUnits already have data");
    }
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

    const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM Provinces`);
    if (rows[0].cnt == 0) {
        const sqlFile = path.join(__dirname, 'data/provinces_data.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        await pool.query(sqlContent);
        console.log("✅ Seeded Provinces from provinces_data.sql");
    } else {
        console.log("ℹ️ Provinces already have data");
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

    const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM Districts`);
    if (rows[0].cnt == 0) {
        const sqlFile = path.join(__dirname, 'data/districts_data.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        await pool.query(sqlContent);
        console.log("✅ Seeded Districts from districts_data.sql");
    } else {
        console.log("ℹ️ Districts already have data");
    }
}

async function createUsersTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Users (
            UserID INT AUTO_INCREMENT PRIMARY KEY,
            FullName VARCHAR(255) NOT NULL,
            Email VARCHAR(255) NOT NULL,
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
            ResetToken VARCHAR(255),
            ResetTokenExpires DATETIME,
            Status ENUM('active','disabled','suspended','deleted') DEFAULT 'active',
            SuspendedUntil DATETIME NULL,
            UnpaidStrikeCount INT NOT NULL DEFAULT 0,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    const dbname = dbConfig.database;
    const triggerNames = ['trg_Insert_Users_Active_Email'];

    // Kiểm tra tồn tại trong INFORMATION_SCHEMA rồi DROP từng cái
    const [trgRows] = await pool.query(
        `SELECT TRIGGER_NAME 
        FROM INFORMATION_SCHEMA.TRIGGERS 
        WHERE TRIGGER_SCHEMA = ? 
            AND TRIGGER_NAME IN (?)`,
        [dbname, ...triggerNames]
    );

    for (const r of trgRows) {
        // schema-qualified DROP
        await pool.query(`DROP TRIGGER IF EXISTS \`${r.TRIGGER_NAME}\``);
    }

    // Trigger check tại cùng 1 thời điểm không có nhiều hơn 2 user !deleted với cùng email
    await pool.query(`
        CREATE TRIGGER \`${dbname}\`.\`trg_Insert_Users_Active_Email\`
        BEFORE INSERT ON \`${dbname}\`.\`Users\`
        FOR EACH ROW
        BEGIN
            DECLARE active_count INT;
            SELECT COUNT(*) INTO active_count
            FROM Users
            WHERE Email = NEW.Email AND Status <> 'deleted';
            IF active_count >= 2 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Không thể có nhiều hơn 2 người dùng active với cùng email.';
            END IF;
        END
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
            AccountIdentifier TEXT,
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
            is_deleted TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
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

async function createWishlistTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Wishlist (
            WishlistID INT AUTO_INCREMENT PRIMARY KEY,
            UserID INT NOT NULL,
            ProductID INT NOT NULL,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
            UNIQUE KEY unique_user_product (UserID, ProductID)
        );
    `);

    try {
        await pool.execute(`CREATE INDEX idx_Wishlist_UserID ON Wishlist(UserID)`);
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
            AuctionUID BIGINT UNSIGNED NOT NULL,
            ProductID INT,
            StayPeriodStart DATE,
            StayPeriodEnd DATE,
            StartTime TIMESTAMP NULL DEFAULT NULL,
            EndTime TIMESTAMP NULL DEFAULT NULL,
            MaxBidID INT UNSIGNED,
            StartPrice DECIMAL(10, 2),
            BidIncrement DECIMAL(10, 2),
            Status ENUM('active','ended','cancelled') DEFAULT 'active',
            EndReason ENUM('natural_end','buy_now','cancelled','admin_force') NULL,
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
        )
    `);

    try {
        await pool.execute(`CREATE UNIQUE INDEX idx_Auction_UID ON Auction(AuctionUID)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
    
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

async function createAuctionEventsTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS AuctionEvents (
        EventID BIGINT AUTO_INCREMENT PRIMARY KEY,
        AuctionID INT UNSIGNED NOT NULL,
        EventType ENUM('start','bid_placed','buy_now','ended','cancelled') NOT NULL,
        ActorUserID INT NULL,
        BookingID INT UNSIGNED NULL,
        Note VARCHAR(255) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_AuctionEvents_AuctionID (AuctionID),
        FOREIGN KEY (AuctionID) REFERENCES Auction(AuctionID),
        FOREIGN KEY (BookingID) REFERENCES Booking(BookingID),
        FOREIGN KEY (ActorUserID) REFERENCES Users(UserID)
        )
    `);

    try {
        await pool.execute(`CREATE INDEX idx_AuctionEvents_AuctionID ON AuctionEvents(AuctionID)`);
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
            StartDate DATE NOT NULL,
            EndDate DATE NOT NULL,
            Amount DECIMAL(9, 2),
            BidTime TIMESTAMP,
            FOREIGN KEY (AuctionID) REFERENCES Auction(AuctionID),
            FOREIGN KEY (UserID) REFERENCES Users(UserID)
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
        await pool.execute(`CREATE INDEX idx_Bids_AuctionIDBidTime ON Bids(AuctionID, BidTime)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }

    try {
        await pool.execute(`CREATE INDEX idx_Bids_AuctionIDStartDateEndDate ON Bids(AuctionID, StartDate, EndDate)`);
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
}

async function createBookingTable() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS Booking (
            BookingID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            BidID INT UNSIGNED DEFAULT NULL,
            UserID INT NOT NULL,
            ProductID INT NOT NULL,
            StartDate DATE NOT NULL,
            EndDate DATE NOT NULL,
            BookingStatus ENUM('pending','confirmed','cancelled','completed','expired') DEFAULT 'pending',
            UnitPrice DECIMAL(10, 2) DEFAULT 0.0,
            Amount DECIMAL(10, 2) DEFAULT 0.0,
            ServiceFee DECIMAL(10, 2) DEFAULT 0.0,
            PaymentMethodID INT DEFAULT NULL,
            PaidAt TIMESTAMP DEFAULT NULL,
            Source ENUM('direct','auction_win','auction_buy_now') NOT NULL DEFAULT 'direct',
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (BidID) REFERENCES Bids(BidID),
            FOREIGN KEY (UserID) REFERENCES Users(UserID),
            FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
            FOREIGN KEY (PaymentMethodID) REFERENCES PaymentMethods(MethodID)
        )
    `);

    const dbname = dbConfig.database;
    const triggerNames = ['trg_Insert_Booking_validate', 'trg_Update_Booking_validate', 'trg_Update_Booking_status_propagate'];

    // Kiểm tra tồn tại trong INFORMATION_SCHEMA rồi DROP từng cái
    const [trgRows] = await pool.query(
        `SELECT TRIGGER_NAME 
        FROM INFORMATION_SCHEMA.TRIGGERS 
        WHERE TRIGGER_SCHEMA = ? 
            AND TRIGGER_NAME IN (?, ?, ?)`,
        [dbname, ...triggerNames]
    );

    for (const r of trgRows) {
        // schema-qualified DROP
        await pool.query(`DROP TRIGGER IF EXISTS \`${r.TRIGGER_NAME}\``);
    }

    /* Trigger kiểm tra khi tạo Booking:
        ServiceFee = Amount * ServiceFeeFactor (lấy từ SystemParameters);
        StartDate < EndDate;
        Nếu có BidID thì:
            - kiểm tra: BidID = Auction.MaxBidID, ProductID = Auction.ProductID, UserID = Bid.UserID (của Bid có BidID là MaxBidID của Auction);
            - đặt: UnitPrice = Bid.Amount,
        Nếu không có BidID thì kiểm tra: UnitPrice = Product.Price;
    */
    const validateBody = `
        BEGIN
            DECLARE sf_factor DECIMAL(5,4);
            DECLARE v_nights INT;
            DECLARE bid_amount DECIMAL(10,2);
            DECLARE bid_user INT;
            DECLARE auction_product INT;
            DECLARE auction_max_bid INT;
            DECLARE v_price DECIMAL(10,2);

            IF NEW.StartDate >= NEW.EndDate THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'StartDate must be before EndDate';
            END IF;

            SET v_nights = DATEDIFF(NEW.EndDate, NEW.StartDate);

            SELECT CAST(ParamValue AS DECIMAL(5,4)) INTO sf_factor
            FROM SystemParameters WHERE ParamName='ServiceFeeFactor' LIMIT 1;
            IF sf_factor IS NULL THEN SET sf_factor = 0.15; END IF;

            IF NEW.BidID IS NOT NULL THEN
                SELECT A.ProductID, A.MaxBidID
                INTO auction_product, auction_max_bid
                FROM Auction A
                JOIN Bids B ON B.AuctionID = A.AuctionID
                WHERE B.BidID = NEW.BidID
                LIMIT 1;

                IF auction_product IS NULL THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bid not linked to any auction';
                END IF;

                IF NEW.BidID <> auction_max_bid THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BidID must be Auction.MaxBidID';
                END IF;

                SELECT B.Amount, B.UserID INTO bid_amount, bid_user
                FROM Bids B WHERE B.BidID = NEW.BidID LIMIT 1;

                IF NEW.UserID <> bid_user THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'UserID must match winning Bid.UserID';
                END IF;
                IF NEW.ProductID <> auction_product THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ProductID must match Auction.ProductID';
                END IF;

                SET NEW.UnitPrice = bid_amount;
            ELSE
                SELECT P.Price INTO v_price
                FROM Products P
                WHERE P.ProductID = NEW.ProductID
                LIMIT 1;

                IF v_price IS NULL OR v_price <= 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid ProductID or UnitPrice';
                END IF;

                SET NEW.UnitPrice = v_price;

                IF NEW.UnitPrice IS NULL OR NEW.UnitPrice <= 0 THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid ProductID or UnitPrice';
                END IF;
            END IF;

            SET NEW.Amount = NEW.UnitPrice * v_nights;
            IF NEW.Amount <= 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Amount must be positive';
            END IF;

            SET NEW.ServiceFee = NEW.Amount * sf_factor;
        END
    `;

    // ------ Trigger propagate BookingStatus=completed -> Calendar.status=booked ------
    await pool.query(`
        CREATE TRIGGER \`${dbname}\`.\`trg_Update_Booking_status_propagate\`
        AFTER UPDATE ON \`${dbname}\`.\`Booking\`
        FOR EACH ROW
        BEGIN
        -- Chỉ chạy khi trạng thái đổi sang 'completed'
        IF NEW.BookingStatus = 'completed' AND OLD.BookingStatus <> 'completed' THEN
            UPDATE \`${dbname}\`.\`Calendar\`
            SET 
            Status = 'booked',
            LockReason = NULL,
            HoldExpiresAt = NULL,
            AuctionID = NULL,
            UpdatedAt = NOW()
            WHERE BookingID = NEW.BookingID;
        END IF;
        END
    `);

    await pool.query(`
        CREATE TRIGGER \`${dbname}\`.\`trg_Insert_Booking_validate\`
        BEFORE INSERT ON \`${dbname}\`.\`Booking\`
        FOR EACH ROW
        ${validateBody}
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
    const triggerNames = ['trg_Insert_Calendar_validate', 'trg_Update_Calendar_validate', 'trg_Insert_Calendar_refcheck', 'trg_Update_Calendar_refcheck', 'trg_Update_Calendar_release_hold'];

    // Kiểm tra tồn tại trong INFORMATION_SCHEMA rồi DROP từng cái
    const [trgRows] = await pool.query(
        `SELECT TRIGGER_NAME 
        FROM INFORMATION_SCHEMA.TRIGGERS 
        WHERE TRIGGER_SCHEMA = ? 
            AND TRIGGER_NAME IN (?, ?, ?, ?, ?)`,
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

    await pool.query(`
        CREATE TRIGGER \`${dbname}\`.\`trg_Insert_Calendar_validate\`
        BEFORE INSERT ON \`${dbname}\`.\`Calendar\`
        FOR EACH ROW
        ${validateBody}
    `);
    
    await pool.query(`
        CREATE TRIGGER \`${dbname}\`.\`trg_Update_Calendar_validate\`
        BEFORE UPDATE ON \`${dbname}\`.\`Calendar\`
        FOR EACH ROW
        ${validateBody}
    `);
    
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

    await pool.query(`
        CREATE TRIGGER \`${dbname}\`.\`trg_Insert_Calendar_refcheck\`
        BEFORE INSERT ON \`${dbname}\`.\`Calendar\`
        FOR EACH ROW
        ${refcheckBody}
    `);

    await pool.query(`
        CREATE TRIGGER \`${dbname}\`.\`trg_Update_Calendar_refcheck\`
        BEFORE UPDATE ON \`${dbname}\`.\`Calendar\`
        FOR EACH ROW
        ${refcheckBody}
    `);

    await pool.query(`
        CREATE TRIGGER \`${dbname}\`.\`trg_Update_Calendar_release_hold\`
        AFTER UPDATE ON \`${dbname}\`.\`Calendar\`
        FOR EACH ROW
        BEGIN
            DECLARE v_remaining INT DEFAULT 0;
            DECLARE v_cur_status ENUM('pending','confirmed','cancelled','completed','expired');

            -- Chỉ xử lý khi: trước đó là 'reserved' và sau update thành 'available'
            IF OLD.Status = 'reserved' AND NEW.Status = 'available' THEN
                -- Chỉ quan tâm các hold do booking_hold và có BookingID
                IF OLD.LockReason = 'booking_hold' AND OLD.BookingID IS NOT NULL THEN
                    -- Còn ngày nào của BookingID này đang reserved/booked không?
                    SELECT COUNT(*) INTO v_remaining
                    FROM Calendar
                    WHERE BookingID = OLD.BookingID
                        AND Status IN ('reserved','booked');

                    -- Nếu không còn, và Booking vẫn đang pending thì chuyển expired
                    IF v_remaining = 0 THEN
                        SELECT BookingStatus INTO v_cur_status
                        FROM Booking
                        WHERE BookingID = OLD.BookingID
                        LIMIT 1;

                        IF v_cur_status = 'pending' THEN
                            UPDATE Booking
                                SET BookingStatus = 'expired',
                                    UpdatedAt = NOW()
                            WHERE BookingID = OLD.BookingID;
                        END IF;
                    END IF;
                END IF;
            END IF;
        END
    `);

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

// Trigger
async function dropUpdateRoomTypesTriggerIfExists() {
    await pool.query(`
        DROP TRIGGER IF EXISTS before_insert_products;
    `);
}

async function createUpdateRoomTypesTrigger() {
    await pool.query(`
        CREATE TRIGGER before_insert_products
        BEFORE INSERT ON Products
        FOR EACH ROW
        BEGIN
            DECLARE new_type INT DEFAULT 2; -- mặc định Căn hộ
            DECLARE pname VARCHAR(255);

            -- chuẩn hóa tên (lowercase)
            SET pname = LOWER(NEW.Name);

            -- check các keyword
            IF pname LIKE '%resort%' THEN
                SET new_type = 4; -- Resort
            ELSEIF pname LIKE '%studio%' THEN
                SET new_type = 6; -- Studio
            ELSEIF pname LIKE '%khách sạn%' OR pname LIKE '%khach san%' OR pname LIKE '%hotel%' THEN
                SET new_type = 1; -- Khách sạn
            ELSEIF pname LIKE '%biệt thự%' OR pname LIKE '%biet thu%' OR pname LIKE '%villa%' THEN
                SET new_type = 5; -- Biệt thự
            ELSEIF pname LIKE '%căn hộ%' OR pname LIKE '%can ho%' OR pname LIKE '%apartment%' THEN
                SET new_type = 2; -- Căn hộ
            ELSEIF pname LIKE '%nhà nghỉ%' OR pname LIKE '%nha nghi%' OR pname LIKE '%motel%' THEN
                SET new_type = 7; -- Nhà nghỉ
            ELSEIF pname LIKE '%nhà%' OR pname LIKE '%nha%' OR pname LIKE '%homestay%' THEN
                SET new_type = 3; -- Homestay
            END IF;

            -- chỉ gán RoomType nếu chưa được set khi insert
            IF NEW.RoomType IS NULL THEN
                SET NEW.RoomType = new_type;
            END IF;
        END;
    `);
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
                        Price = CASE WHEN p_Price > 0 THEN p_Price ELSE Price END,
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
                prov.FullName,
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
                disct.FullName,
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
                disct.FullName,
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
                FullName,
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
                FullName,
                'district' AS type,
                ProvinceCode AS provinceCode
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

async function dropPlaceBookingDraftProcedureIfExists() {
    await pool.query(`DROP PROCEDURE IF EXISTS PlaceBookingDraft;`);
}

async function createPlaceBookingDraftProcedure() {
    await pool.query(`
        CREATE PROCEDURE PlaceBookingDraft (
            IN  p_UserID INT,
            IN  p_ProductID INT,
            IN  p_Start DATE,
            IN  p_End DATE,
            OUT p_BookingID INT UNSIGNED,
            OUT p_HoldExpiresAt DATETIME
        )
        proc:BEGIN
            DECLARE v_now DATETIME;
            DECLARE v_conflicts INT DEFAULT 0;
            DECLARE v_nights INT;
            DECLARE v_reserved_rows INT;
            DECLARE v_day DATE;
            DECLARE v_hold_booking_time INT;

            -- Handler rollback nếu lỗi
            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                RESIGNAL;
            END;

            -- Validate ngày
            IF p_End <= p_Start THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='End>Start required';
            END IF;

            SET v_now = NOW();
            SELECT CAST(ParamValue AS UNSIGNED) INTO v_hold_booking_time FROM SystemParameters WHERE ParamName='PaymentDeadlineTime' LIMIT 1;

            SET v_nights = DATEDIFF(p_End, p_Start);
            SET p_HoldExpiresAt = v_now + INTERVAL v_hold_booking_time MINUTE;

            START TRANSACTION;

             /* 0) Bơm đủ ngày trong [p_Start, p_End)
                (pattern tương tự AddCalendarForRoom: chỉ chèn khi chưa tồn tại) */
            SET v_day = p_Start;
            day_loop: WHILE v_day < p_End DO
                INSERT IGNORE INTO Calendar(ProductID, Day, Status)
                VALUES (p_ProductID, v_day, 'available');
                SET v_day = v_day + INTERVAL 1 DAY;
            END WHILE;

            /* 1) KHÓA dải ngày cần giữ: khóa đúng các hàng của range */
            SELECT Day
            FROM Calendar FORCE INDEX(PRIMARY)
            WHERE ProductID = p_ProductID
            AND Day >= p_Start AND Day < p_End
            FOR UPDATE;

            /* 2) Dọn hold hết hạn trong dải đang khóa (tránh “blocked giả”) */
            UPDATE Calendar
            SET Status='available'
            WHERE ProductID = p_ProductID
            AND Status='reserved'
            AND HoldExpiresAt IS NOT NULL
            AND HoldExpiresAt < v_now;

            /* 3) Kiểm tra xung đột thực sự còn lại trong dải */
            SELECT COUNT(*) INTO v_conflicts
            FROM Calendar
            WHERE ProductID = p_ProductID
            AND Day >= p_Start AND Day < p_End
            AND (
                    Status IN ('booked','blocked')
                OR (Status='reserved' AND (HoldExpiresAt IS NULL OR HoldExpiresAt >= v_now))
            );

            IF v_conflicts > 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Date range not available';
            END IF;

            /* 4) Tạo Booking pending (trigger Booking sẽ tính UnitPrice/Amount/ServiceFee) */
            INSERT INTO Booking (
                UserID, ProductID, StartDate, EndDate,
                BookingStatus, UnitPrice, Amount, ServiceFee,
                PaymentMethodID, PaidAt, CreatedAt, UpdatedAt, BidID
            ) VALUES (
                p_UserID, p_ProductID, p_Start, p_End,
                'pending', NULL, NULL, NULL,
                NULL, NULL, v_now, v_now, NULL
            );
            SET p_BookingID = LAST_INSERT_ID();

            /* 5) Reserve dải ngày cho booking vừa tạo */
            UPDATE Calendar
            SET Status='reserved',
                LockReason='booking_hold',
                BookingID=p_BookingID,
                AuctionID=NULL,
                HoldExpiresAt=p_HoldExpiresAt
            WHERE ProductID = p_ProductID
            AND Day >= p_Start AND Day < p_End;

            SET v_reserved_rows = ROW_COUNT();
            IF v_reserved_rows <> v_nights THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Reserved days mismatch (race or data issue)';
            END IF;

            COMMIT;
        END;
    `);
}

async function dropCreateAuctionForStayProcedureIfExists() {
    await pool.query(`DROP PROCEDURE IF EXISTS CreateAuctionForStay;`);
}

async function createCreateAuctionForStayProcedure() {
    await pool.query(`
        CREATE PROCEDURE CreateAuctionForStay(
            IN p_AuctionUID BIGINT UNSIGNED,
            IN p_ProductID INT,
            IN p_Start DATE,
            IN p_End DATE,
            IN p_UserID INT,
            OUT p_AuctionID INT
        )
        BEGIN
            DECLARE v_now DATETIME; DECLARE v_price DECIMAL(10,2);
            DECLARE v_spf DECIMAL(6,4);
            DECLARE v_bif DECIMAL(6,4);
            DECLARE v_dur INT;
            DECLARE v_lead INT;
            DECLARE v_day DATE;

            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                RESIGNAL;
            END;

            IF p_End <= p_Start THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='End>Start required'; END IF;

            SET v_now = NOW();
            SELECT CAST(ParamValue AS DECIMAL(6,4)) INTO v_spf FROM SystemParameters WHERE ParamName='StartPriceFactor' LIMIT 1;
            SELECT CAST(ParamValue AS DECIMAL(6,4)) INTO v_bif FROM SystemParameters WHERE ParamName='BidIncrementFactor' LIMIT 1;
            SELECT CAST(ParamValue AS UNSIGNED) INTO v_dur FROM SystemParameters WHERE ParamName='AuctionDurationDays' LIMIT 1;
            SELECT CAST(ParamValue AS UNSIGNED) INTO v_lead FROM SystemParameters WHERE ParamName='BidLeadTimeDays' LIMIT 1;

            IF DATE(p_Start) < DATE(v_now + INTERVAL v_lead DAY) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Stay start too soon for auction';
            END IF;

            START TRANSACTION;

            -- Bơm ngày còn thiếu
            SET v_day = p_Start;
            WHILE v_day < p_End DO
                INSERT IGNORE INTO Calendar(ProductID, Day, Status) VALUES (p_ProductID, v_day, 'available');
                SET v_day = v_day + INTERVAL 1 DAY;
            END WHILE;

            -- Khóa range & kiểm tra xung đột
            SELECT Day FROM Calendar WHERE ProductID=p_ProductID AND Day>=p_Start AND Day<p_End FOR UPDATE;
            IF EXISTS(
                SELECT 1 FROM Calendar
                WHERE ProductID=p_ProductID AND Day>=p_Start AND Day<p_End
                AND Status IN ('reserved','booked','blocked')
            ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Date range not free to auction'; END IF;

            SELECT Price INTO v_price FROM Products WHERE ProductID=p_ProductID LIMIT 1;

            INSERT INTO Auction(AuctionUID, ProductID, StayPeriodStart, StayPeriodEnd, StartTime, EndTime,
                                StartPrice, BidIncrement, Status)
            VALUES(p_AuctionUID, p_ProductID, p_Start, p_End, v_now, v_now + INTERVAL v_dur DAY,
                ROUND(v_price * v_spf,2), ROUND(v_price * v_bif,2), 'active');
            SET p_AuctionID = LAST_INSERT_ID();

            -- Block lịch bởi đấu giá (đúng theo rule blocked(auction))
            UPDATE Calendar
            SET Status='blocked', LockReason='auction', AuctionID=p_AuctionID, BookingID=NULL, HoldExpiresAt=NULL
            WHERE ProductID=p_ProductID AND Day>=p_Start AND Day<p_End;

            INSERT INTO AuctionEvents(AuctionID, EventType, ActorUserID, Note) VALUES(p_AuctionID,'start', p_UserID, 'Auction created');

            COMMIT;
        END;
    `);
}

async function dropCreateAuctionAndInitialBidProcedureIfExists() {
    await pool.query(`DROP PROCEDURE IF EXISTS CreateAuctionAndInitialBid;`);
}

async function createCreateAuctionAndInitialBidProcedure() {
    await pool.query(`
        CREATE PROCEDURE CreateAuctionAndInitialBid(
            IN p_AuctionUID BIGINT UNSIGNED,
            IN p_ProductID INT,
            IN p_Start DATE,
            IN p_End DATE,
            IN p_UserID INT,
            OUT p_AuctionID INT,
            OUT p_BidID INT
        )
        BEGIN
            DECLARE v_now DATETIME;
            DECLARE v_price DECIMAL(10,2);
            DECLARE v_spf DECIMAL(6,4);
            DECLARE v_bif DECIMAL(6,4);
            DECLARE v_dur INT;
            DECLARE v_lead INT;
            DECLARE v_day DATE;
            DECLARE v_start_price DECIMAL(10,2);
            DECLARE v_bid_increment DECIMAL(10,2);

            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                RESIGNAL;
            END;

            SET p_AuctionID = NULL;
            SET p_BidID = NULL;

            IF p_End <= p_Start THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='End>Start required'; END IF;

            IF p_UserID IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='UserID required for initial bid';
            END IF;

            SET v_now = NOW();
            SELECT CAST(ParamValue AS DECIMAL(6,4)) INTO v_spf FROM SystemParameters WHERE ParamName='StartPriceFactor' LIMIT 1;
            SELECT CAST(ParamValue AS DECIMAL(6,4)) INTO v_bif FROM SystemParameters WHERE ParamName='BidIncrementFactor' LIMIT 1;
            SELECT CAST(ParamValue AS UNSIGNED) INTO v_dur FROM SystemParameters WHERE ParamName='AuctionDurationDays' LIMIT 1;
            SELECT CAST(ParamValue AS UNSIGNED) INTO v_lead FROM SystemParameters WHERE ParamName='BidLeadTimeDays' LIMIT 1;

            IF DATE(p_Start) < DATE(v_now + INTERVAL v_lead DAY) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Stay start too soon for auction';
            END IF;

            START TRANSACTION;

            -- Bơm ngày còn thiếu
            SET v_day = p_Start;
            WHILE v_day < p_End DO
                INSERT IGNORE INTO Calendar(ProductID, Day, Status) VALUES (p_ProductID, v_day, 'available');
                SET v_day = v_day + INTERVAL 1 DAY;
            END WHILE;

            -- Khóa range & kiểm tra xung đột
            SELECT Day FROM Calendar WHERE ProductID=p_ProductID AND Day>=p_Start AND Day<p_End FOR UPDATE;
            IF EXISTS(
                SELECT 1 FROM Calendar
                WHERE ProductID=p_ProductID AND Day>=p_Start AND Day<p_End
                AND Status IN ('reserved','booked','blocked')
            ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Date range not free to auction'; END IF;

            -- Giá và tham số
            SELECT Price INTO v_price FROM Products WHERE ProductID=p_ProductID LIMIT 1;
            IF v_price IS NULL THEN 
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Product not found';
            END IF;

            SET v_start_price = ROUND(v_price * v_spf, 2);
            SET v_bid_increment = ROUND(v_price * v_bif, 2);

            INSERT INTO Auction(AuctionUID, ProductID, StayPeriodStart, StayPeriodEnd, StartTime, EndTime,
                                StartPrice, BidIncrement, Status)
            VALUES(p_AuctionUID, p_ProductID, p_Start, p_End, v_now, v_now + INTERVAL v_dur DAY,
                ROUND(v_price * v_spf,2), ROUND(v_price * v_bif,2), 'active');
            SET p_AuctionID = LAST_INSERT_ID();

            -- Block lịch bởi đấu giá (đúng theo rule blocked(auction))
            UPDATE Calendar
            SET Status='blocked', LockReason='auction', AuctionID=p_AuctionID, BookingID=NULL, HoldExpiresAt=NULL
            WHERE ProductID=p_ProductID AND Day>=p_Start AND Day<p_End;

            INSERT INTO AuctionEvents(AuctionID, EventType, ActorUserID, Note) VALUES(p_AuctionID,'start', p_UserID, 'Auction created');

            -- Đặt bid đầu tiên = StartPrice
            INSERT INTO Bids(AuctionID, UserID, Amount, BidTime, StartDate, EndDate)
            VALUES(p_AuctionID, p_UserID, v_start_price, NOW(), p_Start, p_End);
            SET p_BidID = LAST_INSERT_ID();

            UPDATE Auction SET MaxBidID = p_BidID WHERE AuctionID = p_AuctionID;

            COMMIT;
        END;
    `);
}

async function dropPlaceBidProcedureIfExists() {
    await pool.query(`DROP PROCEDURE IF EXISTS PlaceBid;`);
}

async function createPlaceBidProcedure() {
    await pool.query(`
        CREATE PROCEDURE PlaceBid(
            IN p_AuctionID INT UNSIGNED,
            IN p_UserID INT,
            IN p_Amount DECIMAL(10,2),
            IN p_Start DATE,
            IN p_End DATE,
            OUT p_BidID INT UNSIGNED
        )
        BEGIN
            DECLARE v_status ENUM('active','ended','cancelled');
            DECLARE v_now DATETIME;
            DECLARE v_cur DECIMAL(10,2);
            DECLARE v_inc DECIMAL(10,2);
            DECLARE v_end TIMESTAMP;
            DECLARE v_sp_start DATE;
            DECLARE v_sp_end DATE;
            DECLARE v_prod INT;
            DECLARE v_lead INT;

            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                RESIGNAL;
            END;

            SET v_now = NOW();

            IF p_End <= p_Start THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='End>Start required'; END IF;

            SELECT CAST(ParamValue AS UNSIGNED) INTO v_lead FROM SystemParameters WHERE ParamName='BidLeadTimeDays' LIMIT 1;

            IF DATE(p_Start) < DATE(v_now + INTERVAL v_lead DAY) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Stay start too soon for auction';
            END IF;

            START TRANSACTION;

            -- 1) Khóa row phiên
            SELECT a.Status, b.Amount, a.BidIncrement, a.EndTime, a.StayPeriodStart, a.StayPeriodEnd, a.ProductID
            INTO v_status, v_cur, v_inc, v_end, v_sp_start, v_sp_end, v_prod
            FROM Auction a JOIN Bids b ON a.AuctionID=b.AuctionID AND a.MaxBidID=b.BidID
            WHERE a.AuctionID=p_AuctionID FOR UPDATE;

            IF v_status <> 'active' OR v_end IS NULL OR v_end <= v_now THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Auction not active';
            END IF;

            -- 2) Giá hợp lệ
            IF p_Amount < v_cur + v_inc THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Bid too low';
            END IF;

            -- 3) Nếu bid làm MỞ RỘNG phạm vi (trái/phải), phải khóa lịch phần mở rộng & kiểm tra xung đột
            -- expand left
            IF p_Start < v_sp_start THEN
                -- khóa + kiểm tra conflict cho [p_Start, v_sp_start)
                SELECT Day FROM Calendar
                WHERE ProductID=v_prod AND Day>=p_Start AND Day<v_sp_start FOR UPDATE;

                IF EXISTS(
                    SELECT 1 FROM Calendar
                    WHERE ProductID=v_prod AND Day>=p_Start AND Day<v_sp_start
                    AND (Status IN ('reserved','booked') OR (Status='blocked' AND (LockReason<>'auction' OR AuctionID<>p_AuctionID)))
                ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Range expansion conflicts (left)';
                END IF;

                -- block phần mở rộng
                UPDATE Calendar
                    SET Status='blocked', LockReason='auction', AuctionID=p_AuctionID,
                        BookingID=NULL, HoldExpiresAt=NULL
                WHERE ProductID=v_prod AND Day>=p_Start AND Day<v_sp_start;

                SET v_sp_start = p_Start;
            END IF;

            -- expand right
            IF p_End > v_sp_end THEN
                -- khóa + kiểm tra conflict cho [v_sp_end, p_End)
                SELECT Day FROM Calendar
                WHERE ProductID=v_prod AND Day>=v_sp_end AND Day<p_End FOR UPDATE;

                IF EXISTS(
                    SELECT 1 FROM Calendar
                    WHERE ProductID=v_prod AND Day>=v_sp_end AND Day<p_End
                    AND (Status IN ('reserved','booked') OR (Status='blocked' AND (LockReason<>'auction' OR AuctionID<>p_AuctionID)))
                ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Range expansion conflicts (right)';
                END IF;

                UPDATE Calendar
                    SET Status='blocked', LockReason='auction', AuctionID=p_AuctionID,
                        BookingID=NULL, HoldExpiresAt=NULL
                WHERE ProductID=v_prod AND Day>=v_sp_end AND Day<p_End;

                SET v_sp_end = p_End;
            END IF;

            -- 4) Cập nhật min/max phiên nếu thay đổi
            IF p_Start <> v_sp_start OR p_End <> v_sp_end THEN
            UPDATE Auction
                SET StayPeriodStart=v_sp_start, StayPeriodEnd=v_sp_end
            WHERE AuctionID=p_AuctionID;
            END IF;

            -- 5) Lưu bid (kèm ngày), cập nhật giá hiện tại & max bid
            INSERT INTO Bids(AuctionID, UserID, Amount, BidTime, StartDate, EndDate)
            VALUES(p_AuctionID, p_UserID, p_Amount, NOW(), p_Start, p_End);
            SET p_BidID = LAST_INSERT_ID();

            UPDATE Auction SET MaxBidID=p_BidID WHERE AuctionID=p_AuctionID;

            INSERT INTO AuctionEvents(AuctionID, EventType, ActorUserID, Note)
            VALUES(p_AuctionID, 'bid_placed', p_UserID,
                CONCAT('Bid range ', p_Start, ' .. ', p_End));

            COMMIT;
        END;
    `);
}

async function dropPlaceBookingBuyNowProcedureIfExists() {
    await pool.query(`DROP PROCEDURE IF EXISTS PlaceBookingBuyNow;`);
}

async function createPlaceBookingBuyNowProcedure() {
    await pool.query(`
        CREATE PROCEDURE PlaceBookingBuyNow(
            IN p_UserID INT,
            IN p_AuctionID INT UNSIGNED,
            IN p_Start DATE,
            IN p_End DATE,
            OUT p_BookingID INT UNSIGNED,
            OUT p_HoldExpiresAt DATETIME
        )
        BEGIN
            DECLARE v_now DATETIME;
            DECLARE v_prod_id INT;
            DECLARE v_sp_start DATE;
            DECLARE v_sp_end DATE;
            DECLARE v_hold_booking_time INT;

            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                RESIGNAL;
            END;
            
            IF p_End <= p_Start THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='End>Start required'; END IF;
            
            SET v_now = NOW();
            SELECT CAST(ParamValue AS UNSIGNED) INTO v_hold_booking_time FROM SystemParameters WHERE ParamName='PaymentDeadlineTime' LIMIT 1;

            SET p_HoldExpiresAt = v_now + INTERVAL v_hold_booking_time MINUTE;

            START TRANSACTION;

            -- 1) Lấy thông tin phiên và khóa
            SELECT ProductID, StayPeriodStart, StayPeriodEnd
            INTO v_prod_id, v_sp_start, v_sp_end
            FROM Auction
            WHERE AuctionID = p_AuctionID AND Status='active'
            FOR UPDATE;

            IF v_prod_id IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Auction not active';
            END IF;

            -- 1) Tìm phiên bao phủ subrange và khóa
            /*SELECT AuctionID, StayPeriodStart, StayPeriodEnd
            INTO v_auc_id, v_sp_start, v_sp_end
            FROM Auction
            WHERE ProductID=p_ProductID AND Status='active'
            AND p_Start >= StayPeriodStart AND p_End <= StayPeriodEnd
            FOR UPDATE;*/

            IF p_AuctionID IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='No covering auction for this stay';
            END IF;

            -- 2) Khóa & kiểm tra lịch subrange
            SELECT Day FROM Calendar
            WHERE ProductID = v_prod_id AND Day >= p_Start AND Day < p_End
            FOR UPDATE;

            IF EXISTS(SELECT 1 FROM Calendar
                    WHERE ProductID=v_prod_id AND Day>=p_Start AND Day<p_End
                        AND Status='booked') THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Already booked';
            END IF;

            -- 3) Tạo booking pending (source='auction_buy_now')
            INSERT INTO Booking(UserID, ProductID, StartDate, EndDate, BookingStatus, Source, CreatedAt, UpdatedAt)
            VALUES(p_UserID, v_prod_id, p_Start, p_End, 'pending', 'auction_buy_now', NOW(), NOW());
            SET p_BookingID = LAST_INSERT_ID();

            -- 4) Đổi subrange sang booked
            UPDATE Calendar
            SET Status='booked', LockReason=NULL, AuctionID=NULL, HoldExpiresAt=p_HoldExpiresAt, BookingID=p_BookingID
            WHERE ProductID=v_prod_id AND Day>=p_Start AND Day<p_End;

            -- 5) Trả phần còn lại về available
            UPDATE Calendar
            SET Status='available', LockReason=NULL, AuctionID=NULL, HoldExpiresAt=NULL, BookingID=NULL
            WHERE ProductID=v_prod_id AND Day>=v_sp_start AND Day<p_Start AND AuctionID=p_AuctionID;

            UPDATE Calendar
            SET Status='available', LockReason=NULL, AuctionID=NULL, HoldExpiresAt=NULL, BookingID=NULL
            WHERE ProductID=v_prod_id AND Day>=p_End AND Day<v_sp_end AND AuctionID=p_AuctionID;

            -- 6) Kết thúc phiên
            UPDATE Auction
            SET Status='ended', EndTime=NOW(), EndReason='buy_now'
            WHERE AuctionID=p_AuctionID;

            INSERT INTO AuctionEvents(AuctionID, EventType, ActorUserID, BookingID, Note)
            VALUES(p_AuctionID, 'buy_now', p_UserID, p_BookingID, 'Ended by buy-now (subrange)');

            COMMIT;
        END;
    `);
}

async function initSchema() {
    try {
        await testConnection();
        console.log('✅ Database connection established successfully!');
        
        console.log('\n📋 Creating tables...');

        await createSystemParametersTable();
        console.log('✅ SystemParameters table ready');

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

        await createWishlistTable();
        console.log('✅ Wishlist table ready');

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

        await createAuctionEventsTable();
        console.log('✅ AuctionEvents table ready');

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

        console.log('\n📋 Creating triggers...');

        await dropUpdateRoomTypesTriggerIfExists();
        await createUpdateRoomTypesTrigger();
        console.log('✅ UpdateRoomTypes trigger ready');

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

        await dropPlaceBookingDraftProcedureIfExists();
        await createPlaceBookingDraftProcedure();
        console.log('✅ PlaceBookingDraft procedure ready');

        await dropCreateAuctionForStayProcedureIfExists();
        await createCreateAuctionForStayProcedure();
        console.log('✅ CreateAuctionForStay procedure ready');

        await dropCreateAuctionAndInitialBidProcedureIfExists();
        await createCreateAuctionAndInitialBidProcedure();
        console.log('✅ CreateAuctionAndInitialBid procedure ready');

        await dropPlaceBidProcedureIfExists();
        await createPlaceBidProcedure();
        console.log('✅ PlaceBidProcedure procedure ready');

        await dropPlaceBookingBuyNowProcedureIfExists();
        await createPlaceBookingBuyNowProcedure();
        console.log('✅ PlaceBookingBuyNow procedure ready');

        console.log('\n🎉 Database schema initialization completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error during database schema initialization:', error);
        throw error;
    }
}

initSchema();

module.exports = pool;