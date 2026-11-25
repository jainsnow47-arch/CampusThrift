-- Campus Thrift (ReLoop) Database Schema
CREATE DATABASE IF NOT EXISTS reloop_db;
USE reloop_db;

-- 1. Historical Transactions Table (for Data-Driven Pricing Engine)
CREATE TABLE IF NOT EXISTS historical_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemName VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  `condition` VARCHAR(50) NOT NULL,
  ageInMonths INT NOT NULL,
  originalPrice DECIMAL(10, 2) NOT NULL,
  soldPrice DECIMAL(10, 2) NOT NULL,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_condition (`condition`),
  INDEX idx_age (ageInMonths)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Pseudonymous Campus Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  handle VARCHAR(64) NOT NULL UNIQUE,
  avatarEmoji VARCHAR(16) NOT NULL,
  campusTag VARCHAR(100) DEFAULT 'Campus Student',
  internalEmail VARCHAR(150) NULL,
  isVerified BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_handle (handle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Unified Marketplace Listings Table (SELL, SWAP, BORROW, RENT)
CREATE TABLE IF NOT EXISTS listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sellerId INT NULL,
  itemName VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  `condition` VARCHAR(50) NOT NULL,
  ageInMonths INT NOT NULL DEFAULT 0,
  originalPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
  suggestedPrice DECIMAL(10, 2) NULL,
  sellingPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
  askingPrice DECIMAL(10, 2) NULL,
  minimumAcceptablePrice DECIMAL(10, 2) NULL,
  isNegotiable BOOLEAN NOT NULL DEFAULT TRUE,
  transactionType ENUM('SELL', 'SWAP', 'BORROW', 'RENT') NOT NULL DEFAULT 'SELL',
  availabilityStatus VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  swapWantedItems TEXT NULL,
  swapWantedCategories VARCHAR(255) NULL,
  swapMultipleAllowed BOOLEAN NOT NULL DEFAULT FALSE,
  borrowMinDays INT NULL,
  borrowMaxDays INT NULL,
  rentPricePerDay DECIMAL(10, 2) NULL,
  rentMinDays INT NULL,
  rentMaxDays INT NULL,
  refundableDeposit DECIMAL(10, 2) NULL,
  collectionLocation VARCHAR(255) NULL,
  specialConditions TEXT NULL,
  availableFrom DATE NULL,
  availableUntil DATE NULL,
  description TEXT,
  sellerName VARCHAR(100) DEFAULT 'Campus Senior',
  contactInfo VARCHAR(150) DEFAULT 'senior@campus.edu',
  imageUrl VARCHAR(500) NULL,
  status VARCHAR(50) DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_list_category (category),
  INDEX idx_list_price (sellingPrice),
  INDEX idx_list_status (status),
  INDEX idx_list_tx_type (transactionType),
  INDEX idx_list_availability (availabilityStatus),
  INDEX idx_list_seller (sellerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Student Wanted Requests Table
CREATE TABLE IF NOT EXISTS wanted_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requesterId INT NULL,
  itemName VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  maxBudget DECIMAL(10, 2) NOT NULL,
  description TEXT,
  requestedBy VARCHAR(100) DEFAULT 'Campus Junior',
  contactInfo VARCHAR(150) DEFAULT 'junior@campus.edu',
  status VARCHAR(50) DEFAULT 'open',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wanted_category (category),
  INDEX idx_wanted_status (status),
  INDEX idx_wanted_requester (requesterId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
