-- DB-WEB/init.sql

-- הגדרת קידוד תווים
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- יצירת הטבלה
CREATE TABLE IF NOT EXISTS `user_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `field1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field2` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field3` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- הכנסת נתוני דוגמה (לא חובה)
INSERT INTO `user_data` (`field1`, `field2`, `field3`) VALUES
('דוגמה 1', 'ערך לדוגמה', 'בדיקה'),
('דוגמה 2', 'ערך נוסף', 'טקסט לדוגמה');

SET FOREIGN_KEY_CHECKS = 1;