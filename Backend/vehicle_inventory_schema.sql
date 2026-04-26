DROP DATABASE IF EXISTS VehicleInventoryDB;
CREATE DATABASE VehicleInventoryDB;
USE VehicleInventoryDB;

CREATE TABLE Location (
  Location_ID INT AUTO_INCREMENT PRIMARY KEY,
  location_name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(80) NOT NULL,
  state VARCHAR(80) NOT NULL,
  postal_code VARCHAR(20),
  phone VARCHAR(20)
);

CREATE TABLE Customer (
  Customer_ID INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address VARCHAR(255),
  Location_ID INT,
  CONSTRAINT chk_customer_email CHECK (email LIKE '%@%.%'),
  CONSTRAINT fk_customer_location
    FOREIGN KEY (Location_ID) REFERENCES Location(Location_ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE Supplier (
  Supplier_ID INT AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(120) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(120) UNIQUE,
  phone VARCHAR(20),
  Location_ID INT,
  CONSTRAINT fk_supplier_location
    FOREIGN KEY (Location_ID) REFERENCES Location(Location_ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE `Role` (
  Role_ID INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255)
);

CREATE TABLE `User` (
  User_ID INT AUTO_INCREMENT PRIMARY KEY,
  Role_ID INT NOT NULL,
  Location_ID INT,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20),
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  CONSTRAINT fk_user_role
    FOREIGN KEY (Role_ID) REFERENCES `Role`(Role_ID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_user_location
    FOREIGN KEY (Location_ID) REFERENCES Location(Location_ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE Auth (
  auth_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_user
    FOREIGN KEY (employee_id) REFERENCES `User`(User_ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE Login_Log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  auth_id INT,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  status VARCHAR(20),
  CONSTRAINT fk_login_log_auth
    FOREIGN KEY (auth_id) REFERENCES Auth(auth_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE Car (
  Car_ID INT AUTO_INCREMENT PRIMARY KEY,
  Supplier_ID INT,
  vin VARCHAR(30) NOT NULL UNIQUE,
  make VARCHAR(60) NOT NULL,
  model VARCHAR(60) NOT NULL,
  `year` INT NOT NULL,
  color VARCHAR(40),
  fuel_type VARCHAR(40),
  transmission VARCHAR(40),
  mileage INT DEFAULT 0,
  price DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Available',
  CONSTRAINT chk_car_price CHECK (price > 0),
  CONSTRAINT chk_car_year CHECK (`year` >= 2000),
  CONSTRAINT chk_car_status CHECK (status IN ('Available','Sold','Maintenance')),
  CONSTRAINT fk_car_supplier
    FOREIGN KEY (Supplier_ID) REFERENCES Supplier(Supplier_ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE Inventory (
  Inventory_ID INT AUTO_INCREMENT PRIMARY KEY,
  Car_ID INT NOT NULL,
  Location_ID INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 1,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_inventory_quantity CHECK (quantity >= 0),
  CONSTRAINT fk_inventory_car
    FOREIGN KEY (Car_ID) REFERENCES Car(Car_ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_inventory_location
    FOREIGN KEY (Location_ID) REFERENCES Location(Location_ID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT uq_inventory_car_location UNIQUE (Car_ID, Location_ID)
);

CREATE TABLE Sales (
  Sale_ID INT AUTO_INCREMENT PRIMARY KEY,
  Car_ID INT NOT NULL,
  Customer_ID INT NOT NULL,
  User_ID INT NOT NULL,
  sale_date DATE NOT NULL,
  sale_price DECIMAL(12,2) NOT NULL,
  notes VARCHAR(255),
  CONSTRAINT chk_sales_sale_price CHECK (sale_price > 0),
  CONSTRAINT fk_sales_car
    FOREIGN KEY (Car_ID) REFERENCES Car(Car_ID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_sales_customer
    FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_sales_user
    FOREIGN KEY (User_ID) REFERENCES `User`(User_ID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE Payment (
  Payment_ID INT AUTO_INCREMENT PRIMARY KEY,
  Sale_ID INT NOT NULL,
  Customer_ID INT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  transaction_reference VARCHAR(80) UNIQUE,
  CONSTRAINT chk_payment_amount CHECK (amount > 0),
  CONSTRAINT chk_payment_status CHECK (status IN ('Pending','Completed','Failed')),
  CONSTRAINT fk_payment_sale
    FOREIGN KEY (Sale_ID) REFERENCES Sales(Sale_ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_payment_customer
    FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE Service_Center (
  Service_Center_ID INT AUTO_INCREMENT PRIMARY KEY,
  Location_ID INT NOT NULL,
  center_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(120),
  manager_name VARCHAR(100),
  CONSTRAINT fk_service_center_location
    FOREIGN KEY (Location_ID) REFERENCES Location(Location_ID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE Service_Record (
  Service_Record_ID INT AUTO_INCREMENT PRIMARY KEY,
  Car_ID INT NOT NULL,
  Customer_ID INT,
  Service_Center_ID INT NOT NULL,
  service_date DATE NOT NULL,
  service_type VARCHAR(80) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'Completed',
  CONSTRAINT chk_service_record_total_cost CHECK (total_cost >= 0),
  CONSTRAINT fk_service_record_car
    FOREIGN KEY (Car_ID) REFERENCES Car(Car_ID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_service_record_customer
    FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_service_record_center
    FOREIGN KEY (Service_Center_ID) REFERENCES Service_Center(Service_Center_ID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE Service_Details (
  Service_Detail_ID INT AUTO_INCREMENT PRIMARY KEY,
  Service_Record_ID INT NOT NULL,
  part_name VARCHAR(100),
  service_description VARCHAR(255) NOT NULL,
  labor_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT chk_service_details_labor_hours CHECK (labor_hours >= 0),
  CONSTRAINT chk_service_details_cost CHECK (cost >= 0),
  CONSTRAINT fk_service_details_record
    FOREIGN KEY (Service_Record_ID) REFERENCES Service_Record(Service_Record_ID)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

DELIMITER //

CREATE TRIGGER trg_service_record_date_insert
BEFORE INSERT ON Service_Record
FOR EACH ROW
BEGIN
  IF NEW.service_date > CURRENT_DATE THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'service_date cannot be later than CURRENT_DATE';
  END IF;
END//

CREATE TRIGGER trg_service_record_date_update
BEFORE UPDATE ON Service_Record
FOR EACH ROW
BEGIN
  IF NEW.service_date > CURRENT_DATE THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'service_date cannot be later than CURRENT_DATE';
  END IF;
END//

CREATE TRIGGER update_car_status
AFTER INSERT ON Sales
FOR EACH ROW
BEGIN
  UPDATE Car
  SET status = 'Sold'
  WHERE Car_ID = NEW.Car_ID;
END//

CREATE TRIGGER check_payment_amount
BEFORE INSERT ON Payment
FOR EACH ROW
BEGIN
  IF NEW.amount < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Payment amount cannot be negative';
  END IF;
END//

CREATE TRIGGER reduce_inventory
AFTER INSERT ON Sales
FOR EACH ROW
BEGIN
  UPDATE Inventory
  SET quantity = quantity - 1
  WHERE Car_ID = NEW.Car_ID
    AND quantity > 0;
END//

DELIMITER ;

CREATE VIEW Car_View AS
SELECT
  Car_ID AS car_id,
  model,
  make AS brand,
  price,
  status
FROM Car;

CREATE VIEW Sales_Summary AS
SELECT
  Sale_ID AS sale_id,
  Customer_ID AS customer_id,
  sale_price,
  sale_date
FROM Sales;

CREATE VIEW Service_View AS
SELECT
  Service_Record_ID AS service_id,
  Car_ID AS car_id,
  total_cost
FROM Service_Record;

DELIMITER $$

CREATE PROCEDURE GetAllCustomers()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_customer_id INT;
  DECLARE v_customer_name VARCHAR(130);

  DECLARE customer_cursor CURSOR FOR
    SELECT
      Customer_ID,
      CONCAT(first_name, ' ', last_name) AS customer_name
    FROM Customer;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  CREATE TEMPORARY TABLE IF NOT EXISTS Temp_Customers (
    customer_id INT,
    name VARCHAR(130)
  );

  TRUNCATE TABLE Temp_Customers;

  OPEN customer_cursor;

  customer_loop: LOOP
    FETCH customer_cursor INTO v_customer_id, v_customer_name;

    IF done THEN
      LEAVE customer_loop;
    END IF;

    INSERT INTO Temp_Customers (customer_id, name)
    VALUES (v_customer_id, v_customer_name);
  END LOOP;

  CLOSE customer_cursor;

  SELECT customer_id, name
  FROM Temp_Customers;

  DROP TEMPORARY TABLE Temp_Customers;
END$$

CREATE PROCEDURE GetTotalSales()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_sale_price DECIMAL(12,2);
  DECLARE v_total_sales DECIMAL(12,2) DEFAULT 0;

  DECLARE sales_cursor CURSOR FOR
    SELECT sale_price
    FROM Sales;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN sales_cursor;

  sales_loop: LOOP
    FETCH sales_cursor INTO v_sale_price;

    IF done THEN
      LEAVE sales_loop;
    END IF;

    SET v_total_sales = v_total_sales + v_sale_price;
  END LOOP;

  CLOSE sales_cursor;

  SELECT v_total_sales AS total_sales;
END$$

CREATE PROCEDURE GetHighestSalePrice()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_sale_price DECIMAL(12,2);
  DECLARE v_highest_sale_price DECIMAL(12,2) DEFAULT 0;

  DECLARE sales_cursor CURSOR FOR
    SELECT sale_price
    FROM Sales;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN sales_cursor;

  sales_loop: LOOP
    FETCH sales_cursor INTO v_sale_price;

    IF done THEN
      LEAVE sales_loop;
    END IF;

    IF v_sale_price > v_highest_sale_price THEN
      SET v_highest_sale_price = v_sale_price;
    END IF;
  END LOOP;

  CLOSE sales_cursor;

  SELECT v_highest_sale_price AS highest_sale_price;
END$$

DELIMITER ;

INSERT INTO Location (location_name, address, city, state, postal_code, phone) VALUES
('Downtown Showroom', '100 Main Street', 'Bengaluru', 'Karnataka', '560001', '080-40001001'),
('North Warehouse', '25 Industrial Road', 'Delhi', 'Delhi', '110001', '011-45002002'),
('West Service Hub', '88 Service Lane', 'Mumbai', 'Maharashtra', '400001', '022-46003003');

INSERT INTO Customer (first_name, last_name, email, phone, address, Location_ID) VALUES
('Aarav', 'Mehta', 'aarav.mehta@example.com', '9876543210', '12 Park Avenue', 1),
('Nisha', 'Rao', 'nisha.rao@example.com', '9876501234', '45 Lake View Road', 2),
('Kabir', 'Sharma', 'kabir.sharma@example.com', '9876512345', '78 Green Street', 3);

INSERT INTO Supplier (supplier_name, contact_person, email, phone, Location_ID) VALUES
('Prime Auto Distributors', 'Rohan Kapoor', 'sales@primeauto.example.com', '9000011111', 1),
('Elite Motors Supply', 'Meera Iyer', 'contact@elitemotors.example.com', '9000022222', 2),
('Urban EV Wholesale', 'Dev Nair', 'orders@urbanev.example.com', '9000033333', 3);

INSERT INTO `Role` (role_name, description) VALUES
('Admin', 'Full system access'),
('Sales Manager', 'Handles vehicle sales and customer deals'),
('Service Advisor', 'Manages vehicle service records');

INSERT INTO `User` (Role_ID, Location_ID, first_name, last_name, email, phone, username, password_hash, status) VALUES
(1, 1, 'Shreya', 'Sen', 'shreya.sen@example.com', '9888811111', 'shreya.admin', 'hashed_password_001', 'Active'),
(2, 1, 'Vikram', 'Patel', 'vikram.patel@example.com', '9888822222', 'vikram.sales', 'hashed_password_002', 'Active'),
(3, 3, 'Isha', 'Menon', 'isha.menon@example.com', '9888833333', 'isha.service', 'hashed_password_003', 'Active');

INSERT INTO Auth (employee_id, username, password_hash, is_active) VALUES
(1, 'admin', 'admin123', TRUE),
(2, 'sales', 'sales123', TRUE);

INSERT INTO Login_Log (auth_id, ip_address, status) VALUES
(1, '127.0.0.1', 'Completed'),
(2, '127.0.0.1', 'Completed');

INSERT INTO Car (Supplier_ID, vin, make, model, `year`, color, fuel_type, transmission, mileage, price, status) VALUES
(1, 'VIN202400000000001', 'Toyota', 'Fortuner', 2024, 'White', 'Diesel', 'Automatic', 1200, 4250000.00, 'Available'),
(2, 'VIN202300000000002', 'Hyundai', 'Creta', 2023, 'Black', 'Petrol', 'Manual', 8500, 1550000.00, 'Sold'),
(3, 'VIN202500000000003', 'Tata', 'Nexon EV', 2025, 'Blue', 'Electric', 'Automatic', 500, 1799000.00, 'Maintenance');

INSERT INTO Inventory (Car_ID, Location_ID, quantity, reorder_level) VALUES
(1, 1, 4, 1),
(2, 2, 0, 1),
(3, 3, 2, 1);

INSERT INTO Sales (Car_ID, Customer_ID, User_ID, sale_date, sale_price, notes) VALUES
(2, 1, 2, '2026-03-10', 1500000.00, 'Corporate discount applied'),
(1, 2, 2, '2026-04-05', 4200000.00, 'Insurance package included'),
(3, 3, 2, '2026-04-18', 1760000.00, 'EV charger bundle included');

INSERT INTO Payment (Sale_ID, Customer_ID, payment_date, amount, payment_method, status, transaction_reference) VALUES
(1, 1, '2026-03-10', 1500000.00, 'Bank Transfer', 'Completed', 'TXN-SALE-001'),
(2, 2, '2026-04-05', 1000000.00, 'UPI', 'Pending', 'TXN-SALE-002'),
(3, 3, '2026-04-18', 1760000.00, 'Credit Card', 'Completed', 'TXN-SALE-003');

INSERT INTO Service_Center (Location_ID, center_name, phone, email, manager_name) VALUES
(3, 'West Service Hub Workshop', '022-46003100', 'service.west@example.com', 'Isha Menon'),
(1, 'Downtown Quick Service', '080-40001100', 'service.downtown@example.com', 'Arjun Bhat'),
(2, 'North Fleet Care', '011-45002100', 'service.north@example.com', 'Neha Gupta');

INSERT INTO Service_Record (Car_ID, Customer_ID, Service_Center_ID, service_date, service_type, total_cost, status) VALUES
(2, 1, 1, '2026-03-20', 'First inspection', 8500.00, 'Completed'),
(3, 3, 1, '2026-04-19', 'Battery diagnostics', 12000.00, 'Completed'),
(1, 2, 2, '2026-04-10', 'Pre-delivery check', 0.00, 'Completed');

INSERT INTO Service_Details (Service_Record_ID, part_name, service_description, labor_hours, cost) VALUES
(1, 'Oil Filter', 'Engine oil and filter replacement', 1.50, 8500.00),
(2, 'Battery Module', 'EV battery health scan and calibration', 2.00, 12000.00),
(3, NULL, 'Exterior inspection and software check', 1.00, 0.00);
