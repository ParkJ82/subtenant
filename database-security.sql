-- Database Security Recommendations for SubTenants
-- Run these commands to enhance database security

-- 1. Create a dedicated user with limited privileges (instead of using root)
-- CREATE USER 'subtenant_app'@'%' IDENTIFIED BY 'strong_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON subtenant.* TO 'subtenant_app'@'%';
-- FLUSH PRIVILEGES;

-- 2. Enable SSL/TLS for database connections (configure in MySQL)
-- ALTER USER 'subtenant_dev'@'%' REQUIRE SSL;

-- 3. Create views to limit data exposure
CREATE OR REPLACE VIEW v_public_tenants AS
SELECT
    t.tenantID,
    t.isListed,
    t.companyName,
    t.availableFrom,
    t.availableTo,
    a.name,
    a.bio
FROM Tenant t
INNER JOIN Account a ON t.accountID = a.accountID
WHERE t.isListed = TRUE;

CREATE OR REPLACE VIEW v_public_rooms AS
SELECT
    r.roomID,
    r.monthlyRent,
    r.availableFrom,
    r.availableTo,
    r.description,
    r.isListed,
    p.propertyName,
    p.propertyType,
    p.address,
    p.city,
    p.state,
    a.name AS subleasorName
FROM RoomInfo r
INNER JOIN SuiteInfo s ON r.suiteID = s.suiteID
INNER JOIN Property p ON s.propertyID = p.propertyID
INNER JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
INNER JOIN Account a ON sub.accountID = a.accountID
WHERE r.isListed = TRUE;

-- 4. Add indexes for frequently queried columns
CREATE INDEX idx_tenant_isListed ON Tenant(isListed);
CREATE INDEX idx_tenant_availableFrom ON Tenant(availableFrom);
CREATE INDEX idx_tenant_availableTo ON Tenant(availableTo);
CREATE INDEX idx_room_isListed ON RoomInfo(isListed);
CREATE INDEX idx_room_monthlyRent ON RoomInfo(monthlyRent);
CREATE INDEX idx_room_availableFrom ON RoomInfo(availableFrom);
CREATE INDEX idx_room_availableTo ON RoomInfo(availableTo);
CREATE INDEX idx_account_email ON Account(email);
CREATE INDEX idx_application_status ON Application(status);
CREATE INDEX idx_application_tenantID ON Application(tenantID);
CREATE INDEX idx_application_roomID ON Application(roomID);

-- 5. Create stored procedures for common operations (prevents SQL injection)
DELIMITER //

CREATE PROCEDURE sp_create_tenant(
    IN p_accountID INT,
    IN p_companyName VARCHAR(100),
    IN p_availableFrom DATE,
    IN p_availableTo DATE
)
BEGIN
    INSERT INTO Tenant (accountID, isListed, companyName, availableFrom, availableTo)
    VALUES (p_accountID, FALSE, p_companyName, p_availableFrom, p_availableTo);
    SELECT LAST_INSERT_ID() AS tenantID;
END //

CREATE PROCEDURE sp_create_room(
    IN p_suiteID INT,
    IN p_subleasorID INT,
    IN p_monthlyRent DECIMAL(10,2),
    IN p_availableFrom DATE,
    IN p_availableTo DATE,
    IN p_description TEXT
)
BEGIN
    INSERT INTO RoomInfo (suiteID, subleasorID, monthlyRent, availableFrom, availableTo, description)
    VALUES (p_suiteID, p_subleasorID, p_monthlyRent, p_availableFrom, p_availableTo, p_description);
    SELECT LAST_INSERT_ID() AS roomID;
END //

CREATE PROCEDURE sp_get_user_listings(IN p_accountID INT)
BEGIN
    SELECT
        'tenant' AS type,
        t.tenantID AS id,
        t.companyName AS title,
        t.availableFrom,
        t.availableTo,
        t.isListed
    FROM Tenant t
    WHERE t.accountID = p_accountID
    UNION ALL
    SELECT
        'room' AS type,
        r.roomID AS id,
        p.propertyName AS title,
        r.availableFrom,
        r.availableTo,
        r.isListed
    FROM RoomInfo r
    INNER JOIN SuiteInfo s ON r.suiteID = s.suiteID
    INNER JOIN Property p ON s.propertyID = p.propertyID
    INNER JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
    WHERE sub.accountID = p_accountID;
END //

-- 5b. Create a function to count incoming applications for a subleasor
CREATE FUNCTION count_incoming_applications_by_subleasor(p_subleasor_id INT) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE incoming_count INT;
    SELECT COUNT(a.applicationID) INTO incoming_count
    FROM Application a
    INNER JOIN RoomInfo r ON a.roomID = r.roomID
    INNER JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
    WHERE sub.subleasorID = p_subleasor_id AND a.status = 'pending';
    RETURN COALESCE(incoming_count, 0);
END //

DELIMITER ;

-- 6. Add triggers for data integrity
DELIMITER //

CREATE TRIGGER tr_tenant_before_insert
BEFORE INSERT ON Tenant
FOR EACH ROW
BEGIN
    -- Ensure isListed defaults to FALSE
    IF NEW.isListed IS NULL THEN
        SET NEW.isListed = FALSE;
    END IF;
END //

CREATE TRIGGER tr_room_before_insert
BEFORE INSERT ON RoomInfo
FOR EACH ROW
BEGIN
    -- Ensure isListed defaults to TRUE
    IF NEW.isListed IS NULL THEN
        SET NEW.isListed = TRUE;
    END IF;
END //

CREATE TRIGGER tr_application_before_insert
BEFORE INSERT ON Application
FOR EACH ROW
BEGIN
    -- Set default status
    IF NEW.status IS NULL THEN
        SET NEW.status = 'pending';
    END IF;
END //

-- Trigger to automatically delist a room when an application is accepted
CREATE TRIGGER after_application_accepted
AFTER UPDATE ON Application
FOR EACH ROW
BEGIN
    -- When an application is accepted, mark the room as no longer listed
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        UPDATE RoomInfo SET isListed = FALSE WHERE roomID = NEW.roomID;
    END IF;
END //

DELIMITER ;

-- 7. Add check constraints for data validation
ALTER TABLE Account
ADD CONSTRAINT chk_account_email CHECK (email LIKE '%@%.%');

ALTER TABLE RoomInfo
ADD CONSTRAINT chk_room_rent CHECK (monthlyRent > 0);

ALTER TABLE SuiteInfo
ADD CONSTRAINT chk_suite_rooms CHECK (totalRooms > 0 OR totalRooms IS NULL);

ALTER TABLE SuiteInfo
ADD CONSTRAINT chk_suite_bathrooms CHECK (totalBathrooms > 0 OR totalBathrooms IS NULL);

-- 8. Enable query logging for audit (development only)
-- SET GLOBAL general_log = 'ON';
-- SET GLOBAL log_output = 'TABLE';

-- 9. Configure connection limits
-- SET GLOBAL max_connections = 100;
-- SET GLOBAL max_user_connections = 25;

-- 10. Regular maintenance commands (run periodically)
-- ANALYZE TABLE Account, Tenant, RoomInfo, Application, Contract;
-- OPTIMIZE TABLE Account, Tenant, RoomInfo, Application, Contract;
