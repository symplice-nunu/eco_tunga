USE ecotunga_db;

ALTER TABLE users
ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER password; 