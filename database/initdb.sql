

-- Character encoding settings
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create table
CREATE TABLE IF NOT EXISTS `user_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `field1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field2` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field3` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional)
INSERT INTO `user_data` (`field1`, `field2`, `field3`) VALUES
('Example 1', 'Sample value', 'Test'),
('Example 2', 'Additional value', 'Sample text');

SET FOREIGN_KEY_CHECKS = 1;
-- Users table for authentication
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci UNIQUE NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;