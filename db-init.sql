-- Create database `bolt-coin` and required tables for Bolt-Pass Password Manager
-- Note: database name contains a hyphen; in SQL you must quote it with backticks: `bolt-coin`
-- Run from cmd.exe with: mysql -u <user> -p < db-init.sql

CREATE DATABASE IF NOT EXISTS `bolt-coin` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `bolt-coin`;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password entries table (for storing saved passwords)
CREATE TABLE IF NOT EXISTS password_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,                    -- Site/Service name (e.g. "Gmail", "Facebook")
  website_url VARCHAR(500),                       -- Website URL (e.g. "https://gmail.com")
  email VARCHAR(255),                             -- Email/username for the account
  username VARCHAR(255),                          -- Alternative username field
  password_encrypted TEXT NOT NULL,               -- Encrypted password
  notes TEXT,                                     -- Additional notes
  category VARCHAR(100) DEFAULT 'General',       -- Category (e.g. "Social Media", "Banking", "Work")
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_category (user_id, category),
  INDEX idx_user_title (user_id, title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: Create a categories table for predefined categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT 'lock',
  color VARCHAR(20) DEFAULT '#60a5fa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default categories
INSERT IGNORE INTO categories (name, icon, color) VALUES
('General', 'lock', '#60a5fa'),
('Social Media', 'users', '#f59e0b'),
('Banking', 'credit-card', '#10b981'),
('Email', 'mail', '#8b5cf6'),
('Work', 'briefcase', '#ef4444'),
('Shopping', 'shopping-cart', '#f97316'),
('Entertainment', 'play', '#ec4899');
