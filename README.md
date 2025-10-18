# Bolt-Pass

A simple, local password manager built with Node.js and MySQL.

## Features
- Secure password storage with AES-256 encryption
- User authentication (Register/Login)
- Manage password entries (Create, Edit, Delete)
- Clean and responsive interface

## Setup

1. Requirements:
   - Node.js (v16+)
   - MySQL Server

2. Database Setup:
```cmd
mysql -u root -p < db-init.sql
```

3. Configuration:
   - Copy `.env.example` to `.env`
   - Set your database credentials and secrets

4. Run the App:
```cmd
npm install
npm start
```

5. Access at: http://localhost:3000

## Note
This is a learning project. For security, never share your `.env` file and ensure proper environment setup before use.

## Development
Run with hot-reload: `npm run dev`
-- Creates the Bolt-Coin database and required tables for Bolt-Pass
-- Run (Windows cmd): mysql -u root -p < db-init.sql

CREATE DATABASE IF NOT EXISTS `Bolt-Coin` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `Bolt-Coin`;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  password_encrypted TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: create a demo account via the API (recommended) or insert a user here by providing a bcrypt hash for the password.
-- Example (do not run):
-- INSERT INTO users (username, password_hash) VALUES ('demo', '$2b$10$...');

