-- Everbright Optical Database (Safe Version)
-- Generated with data retention and safe import handling.
-- Includes IF NOT EXISTS for table creation and safety checks for foreign keys.
-- Wrapped in a transaction for safe import (rollback on error).

START TRANSACTION;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 28, 2025 at 02:45 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `everbright_optical`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE IF NOT EXISTS `appointments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `patient_id` bigint(20) UNSIGNED NOT NULL,
  `optometrist_id` bigint(20) UNSIGNED NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `type` enum('eye_exam','contact_fitting','follow_up','consultation','emergency') NOT NULL,
  `status` enum('scheduled','confirmed','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `optometrist_id`, `appointment_date`, `start_time`, `end_time`, `type`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 8, 11, '2025-10-30', '09:00:00', '10:00:00', 'eye_exam', 'scheduled', 'Regular eye examination', '2025-10-27 05:15:58', '2025-10-27 05:15:58'),
(2, 8, 11, '2025-09-27', '14:00:00', '15:00:00', 'follow_up', 'completed', 'Follow-up examination', '2025-09-27 05:15:58', '2025-09-27 05:15:58'),
(3, 8, 11, '2025-08-28', '10:00:00', '11:00:00', 'consultation', 'completed', 'Initial consultation', '2025-08-28 05:15:58', '2025-08-28 05:15:58');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `auditable_type` varchar(255) NOT NULL,
  `auditable_id` bigint(20) UNSIGNED NOT NULL,
  `event` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_role` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `old_values` text DEFAULT NULL,
  `new_values` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `auditable_type`, `auditable_id`, `event`, `user_id`, `user_role`, `user_email`, `old_values`, `new_values`, `ip_address`, `user_agent`, `description`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 8, 'created', NULL, NULL, NULL, NULL, '{\"name\":\"Genesis\",\"email\":\"genesis@gmail.com\",\"password\":\"[FILTERED]\",\"role\":\"customer\",\"is_approved\":true,\"updated_at\":\"2025-10-24 00:16:09\",\"created_at\":\"2025-10-24 00:16:09\",\"id\":8}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'System created User \'Genesis\' (#8)', '2025-10-23 16:16:09', '2025-10-23 16:16:09'),
(2, 'App\\Models\\User', 9, 'created', 1, 'admin', 'admin@everbright.com', NULL, '{\"name\":\"Dr. Samuel Prieto\",\"email\":\"samuel.prieto@everbright.com\",\"password\":\"[FILTERED]\",\"role\":\"optometrist\",\"branch_id\":null,\"is_approved\":true,\"updated_at\":\"2025-10-24 16:19:19\",\"created_at\":\"2025-10-24 16:19:19\",\"id\":9}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Admin User created User \'Dr. Samuel Prieto\' (#9)', '2025-10-24 08:19:19', '2025-10-24 08:19:19'),
(3, 'App\\Models\\User', 9, 'updated', 1, 'admin', 'admin@everbright.com', '{\"id\":9,\"name\":\"Dr. Samuel Prieto\",\"email\":\"samuel.prieto@everbright.com\",\"email_verified_at\":null,\"password\":\"[FILTERED]\",\"role\":\"optometrist\",\"branch_id\":null,\"is_approved\":true,\"is_protected\":0,\"remember_token\":null,\"created_at\":\"2025-10-24T16:19:19.000000Z\",\"updated_at\":\"2025-10-24T16:19:19.000000Z\",\"deleted_at\":null}', '{\"id\":9,\"name\":\"Dr. Samuel Prieto\",\"email\":\"samuel.prieto@everbright.com\",\"email_verified_at\":null,\"password\":\"[FILTERED]\",\"role\":\"optometrist\",\"branch_id\":6,\"is_approved\":true,\"is_protected\":0,\"remember_token\":null,\"created_at\":\"2025-10-24 16:19:19\",\"updated_at\":\"2025-10-24 16:46:21\",\"deleted_at\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Admin User updated User \'Dr. Samuel Prieto\' (#9)', '2025-10-24 08:46:21', '2025-10-24 08:46:21'),
(4, 'App\\Models\\User', 9, 'deleted', 1, 'admin', 'admin@everbright.com', '{\"id\":9,\"name\":\"Dr. Samuel Prieto\",\"email\":\"samuel.prieto@everbright.com\",\"email_verified_at\":null,\"password\":\"[FILTERED]\",\"role\":\"optometrist\",\"branch_id\":6,\"is_approved\":true,\"is_protected\":0,\"remember_token\":null,\"created_at\":\"2025-10-24T16:19:19.000000Z\",\"updated_at\":\"2025-10-24T16:46:21.000000Z\",\"deleted_at\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Admin User deleted User \'Dr. Samuel Prieto\' (#9)', '2025-10-24 08:57:25', '2025-10-24 08:57:25'),
(5, 'App\\Models\\User', 10, 'created', 1, 'admin', 'admin@everbright.com', NULL, '{\"name\":\"Dr. Samuel Prieto\",\"email\":\"samuel.prieto@everbright.com\",\"password\":\"[FILTERED]\",\"role\":\"optometrist\",\"branch_id\":3,\"is_approved\":true,\"updated_at\":\"2025-10-24 16:57:53\",\"created_at\":\"2025-10-24 16:57:53\",\"id\":10}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Admin User created User \'Dr. Samuel Prieto\' (#10)', '2025-10-24 08:57:53', '2025-10-24 08:57:53'),
(6, 'App\\Models\\User', 10, 'deleted', 1, 'admin', 'admin@everbright.com', '{\"id\":10,\"name\":\"Dr. Samuel Prieto\",\"email\":\"samuel.prieto@everbright.com\",\"email_verified_at\":null,\"password\":\"[FILTERED]\",\"role\":\"optometrist\",\"branch_id\":3,\"is_approved\":true,\"is_protected\":0,\"remember_token\":null,\"created_at\":\"2025-10-24T16:57:53.000000Z\",\"updated_at\":\"2025-10-24T16:57:53.000000Z\",\"deleted_at\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Admin User deleted User \'Dr. Samuel Prieto\' (#10)', '2025-10-24 09:14:23', '2025-10-24 09:14:23'),
(7, 'App\\Models\\User', 11, 'created', 1, 'admin', 'admin@everbright.com', NULL, '{\"name\":\"Dr. Samuel Prieto\",\"email\":\"samuel.prieto@everbright.com\",\"password\":\"[FILTERED]\",\"role\":\"optometrist\",\"branch_id\":3,\"is_approved\":true,\"updated_at\":\"2025-10-24 17:14:51\",\"created_at\":\"2025-10-24 17:14:51\",\"id\":11}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Admin User created User \'Dr. Samuel Prieto\' (#11)', '2025-10-24 09:14:51', '2025-10-24 09:14:51'),
(8, 'App\\Models\\User', 6, 'updated', 1, 'admin', 'admin@everbright.com', '{\"id\":6,\"name\":\"unitop_staf\",\"email\":\"unitop@gmail.com\",\"email_verified_at\":null,\"password\":\"[FILTERED]\",\"role\":\"staff\",\"branch_id\":3,\"is_approved\":true,\"is_protected\":0,\"remember_token\":null,\"created_at\":\"2025-10-23T20:19:12.000000Z\",\"updated_at\":\"2025-10-23T20:41:11.000000Z\",\"deleted_at\":null}', '{\"id\":6,\"name\":\"unitop_staff\",\"email\":\"unitop@gmail.com\",\"email_verified_at\":null,\"password\":\"[FILTERED]\",\"role\":\"staff\",\"branch_id\":3,\"is_approved\":true,\"is_protected\":0,\"remember_token\":null,\"created_at\":\"2025-10-23 20:19:12\",\"updated_at\":\"2025-10-26 12:04:22\",\"deleted_at\":null}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Admin User updated User \'unitop_staff\' (#6)', '2025-10-26 04:04:22', '2025-10-26 04:04:22'),
(9, 'App\\Models\\User', 12, 'created', 1, 'admin', 'admin@everbright.com', NULL, '{\"name\":\"Emerald_staff\",\"email\":\"emerald@gmail.com\",\"password\":\"[FILTERED]\",\"role\":\"staff\",\"branch_id\":6,\"is_approved\":true,\"updated_at\":\"2025-10-27 17:29:07\",\"created_at\":\"2025-10-27 17:29:07\",\"id\":12}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Admin User created User \'Emerald_staff\' (#12)', '2025-10-27 09:29:07', '2025-10-27 09:29:07'),
(10, 'App\\Models\\User', 12, 'deleted', 1, 'admin', 'admin@everbright.com', '{\"id\":12,\"name\":\"Emerald_staff\",\"email\":\"emerald@gmail.com\",\"email_verified_at\":null,\"password\":\"[FILTERED]\",\"role\":\"staff\",\"branch_id\":6,\"is_approved\":true,\"is_protected\":0,\"remember_token\":null,\"created_at\":\"2025-10-27T17:29:07.000000Z\",\"updated_at\":\"2025-10-27T17:29:07.000000Z\",\"deleted_at\":null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Admin User deleted User \'Emerald_staff\' (#12)', '2025-10-27 09:29:14', '2025-10-27 09:29:14');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE IF NOT EXISTS `branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `code`, `address`, `phone`, `email`, `is_active`, `created_at`, `updated_at`) VALUES
(3, 'UNITOP BRANCH', 'UNITOP', '2nd Floor Foodcourt Area, Balibago Sta. Rosa, Laguna', '0917 452 3861 ', 'unitop@gmail.com', 1, '2025-10-23 12:04:03', '2025-10-23 20:44:17'),
(4, 'NEWSTAR MALL', 'NEWSTAR', 'Ground floor Balibago Sta. Rosa Laguna', ' 0995 873 2014  ', 'newstar@gmail.com', 1, '2025-10-23 12:04:03', '2025-10-23 20:45:12'),
(5, 'GARNET STREET', 'GARNET', 'Garnet St. Corner Emerald, Balibago Sta. Rosa Laguna near Balibago Church', '0928 640 5793 ', 'garnet@gmail.com', 1, '2025-10-23 12:04:03', '2025-10-23 20:45:36'),
(6, 'EMERALD CIRCLE', 'EMERALD', 'Emerald Circle Building, Sta Cruz Manila', ' 0961 742 0859', 'emerald@gmail.com', 1, '2025-10-23 12:04:03', '2025-10-23 20:45:50');

-- --------------------------------------------------------

--
-- Table structure for table `branch_contacts`
--

CREATE TABLE IF NOT EXISTS `branch_contacts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `facebook_url` varchar(255) DEFAULT NULL,
  `instagram_url` varchar(255) DEFAULT NULL,
  `twitter_url` varchar(255) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `whatsapp_number` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `operating_hours` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branch_stock`
--

CREATE TABLE IF NOT EXISTS `branch_stock` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `reserved_quantity` int(11) NOT NULL DEFAULT 0,
  `price_override` decimal(10,2) DEFAULT NULL,
  `status` enum('In Stock','Low Stock','Out of Stock') NOT NULL DEFAULT 'In Stock',
  `expiry_date` date DEFAULT NULL,
  `min_stock_threshold` int(11) NOT NULL DEFAULT 5,
  `auto_restock_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `auto_restock_quantity` int(11) NOT NULL DEFAULT 10,
  `last_restock_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branch_stock`
--

INSERT INTO `branch_stock` (`id`, `product_id`, `branch_id`, `stock_quantity`, `reserved_quantity`, `price_override`, `status`, `expiry_date`, `min_stock_threshold`, `auto_restock_enabled`, `auto_restock_quantity`, `last_restock_date`, `created_at`, `updated_at`) VALUES
(17, 20, 3, 10, 0, NULL, 'In Stock', NULL, 5, 0, 10, NULL, '2025-10-24 08:16:14', '2025-10-24 08:16:14'),
(18, 20, 4, 10, 0, NULL, 'In Stock', NULL, 5, 0, 10, NULL, '2025-10-24 08:16:18', '2025-10-24 08:16:18'),
(19, 20, 5, 10, 0, NULL, 'In Stock', NULL, 5, 0, 10, NULL, '2025-10-24 08:16:19', '2025-10-24 08:16:19'),
(20, 20, 6, 10, 0, NULL, 'In Stock', NULL, 5, 0, 10, NULL, '2025-10-24 08:16:21', '2025-10-24 08:16:21'),
(21, 19, 3, 10, 0, NULL, 'In Stock', NULL, 5, 0, 10, NULL, '2025-10-26 21:56:54', '2025-10-26 21:56:54'),
(22, 19, 4, 10, 0, NULL, 'In Stock', NULL, 5, 0, 10, NULL, '2025-10-26 21:56:55', '2025-10-26 21:56:55'),
(23, 19, 5, 10, 0, NULL, 'In Stock', NULL, 5, 0, 10, NULL, '2025-10-26 21:56:57', '2025-10-26 21:56:57'),
(24, 19, 6, 10, 0, NULL, 'In Stock', NULL, 5, 0, 10, NULL, '2025-10-26 21:56:58', '2025-10-26 21:56:58');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE IF NOT EXISTS `feedback` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `appointment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `rating` int(11) NOT NULL COMMENT 'Rating from 1 to 5',
  `comment` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `manufacturers`
--

CREATE TABLE IF NOT EXISTS `manufacturers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `product_line` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_09_20_141341_create_branches_table', 2),
(5, '2025_09_29_021435_create_notifications_table', 3),
(6, '2025_10_23_205456_create_manufacturers_table', 4),
(7, '2025_10_23_210242_create_product_categories_table', 5),
(8, '2024_01_15_000000_create_schedule_change_requests_table', 6),
(9, '2025_10_23_223142_add_primary_image_to_products_table', 7),
(10, '2024_01_20_000000_create_branch_contacts_table', 8),
(11, '2024_10_11_000001_create_audit_logs_table', 8),
(12, '2024_10_11_000002_add_soft_deletes_to_critical_tables', 8),
(13, '2025_01_09_000001_create_receipts_table', 8),
(14, '2025_01_15_000000_create_transactions_table', 8),
(15, '2025_10_23_230554_add_secondary_image_to_products_table', 9),
(16, '2025_10_24_091124_add_image_order_to_products_table', 10),
(17, '2025_09_20_141349_create_branch_stock_table', 11),
(18, '2025_09_21_000000_add_enhanced_inventory_columns_to_branch_stock', 12),
(19, '2025_10_05_202006_add_price_override_and_status_to_branch_stock_table', 13),
(20, '2025_10_24_113426_create_product_variants_table', 14),
(21, '2025_10_24_170038_create_optometrist_branches_table', 15),
(22, '2025_10_24_171055_remove_is_primary_from_optometrist_branches_table', 16),
(23, '2025_09_28_080000_create_schedules_table', 17),
(24, '2025_09_01_000000_create_appointments_table', 18),
(25, '2025_09_13_100240_create_prescriptions_table', 19),
(26, '2025_09_29_030924_update_prescriptions_table_add_missing_columns', 20),
(27, '2025_09_30_170815_fix_prescription_eye_data', 21),
(28, '2025_10_24_180152_add_soft_deletes_to_prescriptions_table', 22),
(29, '2025_09_30_211259_create_feedback_table', 23),
(30, '2025_10_10_105809_create_receipt_items_table', 24),
(31, '2025_10_24_185859_add_days_of_week_to_schedules_table', 25),
(32, '2025_10_24_191536_create_optometrist_rotations_table', 26);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('customer','staff','optometrist','admin') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('unread','read') NOT NULL DEFAULT 'unread',
  `type` varchar(255) DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `role`, `title`, `message`, `status`, `type`, `data`, `read_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'admin', 'New User Signup', 'New user Genesis (genesis@gmail.com) has requested customer access', 'unread', 'user_signup', '{\"new_user_id\":8,\"new_user_name\":\"Genesis\",\"new_user_email\":\"genesis@gmail.com\",\"requested_role\":\"customer\"}', NULL, '2025-10-23 16:16:09', '2025-10-23 16:16:09');

-- --------------------------------------------------------

--
-- Table structure for table `optometrist_branches`
--

CREATE TABLE IF NOT EXISTS `optometrist_branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `optometrist_branches`
--

INSERT INTO `optometrist_branches` (`id`, `user_id`, `branch_id`, `created_at`, `updated_at`) VALUES
(28, 11, 3, '2025-10-24 09:14:51', '2025-10-24 09:14:51'),
(29, 11, 5, '2025-10-24 09:14:51', '2025-10-24 09:14:51'),
(30, 11, 4, '2025-10-24 09:14:51', '2025-10-24 09:14:51'),
(31, 11, 6, '2025-10-24 09:14:51', '2025-10-24 09:14:51');

-- --------------------------------------------------------

--
-- Table structure for table `optometrist_rotations`
--

CREATE TABLE IF NOT EXISTS `optometrist_rotations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `optometrist_id` bigint(20) UNSIGNED NOT NULL,
  `rotation_schedule` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`rotation_schedule`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `optometrist_rotations`
--

INSERT INTO `optometrist_rotations` (`id`, `optometrist_id`, `rotation_schedule`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 11, '[{\"day\":1,\"branch_id\":3,\"start_time\":\"09:00\",\"end_time\":\"17:00\"},{\"day\":2,\"branch_id\":3,\"start_time\":\"09:00\",\"end_time\":\"17:00\"},{\"day\":3,\"branch_id\":4,\"start_time\":\"09:00\",\"end_time\":\"17:00\"},{\"day\":4,\"branch_id\":5,\"start_time\":\"09:00\",\"end_time\":\"17:00\"},{\"day\":5,\"branch_id\":5,\"start_time\":\"09:00\",\"end_time\":\"17:00\"},{\"day\":6,\"branch_id\":5,\"start_time\":\"09:00\",\"end_time\":\"17:00\"},{\"day\":7,\"branch_id\":6,\"start_time\":\"09:00\",\"end_time\":\"17:00\"}]', 1, 1, 1, '2025-10-24 11:28:06', '2025-10-24 11:57:52');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(41, 'App\\Models\\User', 1, 'auth_token', '8a7580c95073240aad217768ab352a9e7af2c22fc12c31f193cd80a605f713c5', '[\"*\"]', '2025-10-27 13:48:45', '2025-10-28 09:11:32', '2025-10-27 09:11:32', '2025-10-27 13:48:45'),
(43, 'App\\Models\\User', 11, 'auth_token', 'e91963a272382d732e9d84be48cbaf1279c7957fec1b53d647035b555ba5be8e', '[\"*\"]', '2025-10-27 13:01:20', '2025-10-28 12:41:07', '2025-10-27 12:41:07', '2025-10-27 13:01:20'),
(44, 'App\\Models\\User', 6, 'auth_token', '6a4190e567e5b2f7cda0703b7b73111a7d1a9ed05e6433464aefddfa66846e2e', '[\"*\"]', '2025-10-27 13:40:04', '2025-10-28 12:43:25', '2025-10-27 12:43:25', '2025-10-27 13:40:04'),
(45, 'App\\Models\\User', 8, 'auth_token', '658ced184e0da1da37edefc0593ea781c0180c2f5c2e8817e5f52cc70603a4c9', '[\"*\"]', '2025-10-27 13:16:34', '2025-10-28 12:43:39', '2025-10-27 12:43:39', '2025-10-27 13:16:34');

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE IF NOT EXISTS `prescriptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `patient_id` bigint(20) UNSIGNED NOT NULL,
  `optometrist_id` bigint(20) UNSIGNED NOT NULL,
  `appointment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` enum('glasses','contact_lenses','sunglasses','progressive','bifocal') NOT NULL,
  `prescription_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`prescription_data`)),
  `issue_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `prescription_number` varchar(255) DEFAULT NULL,
  `right_eye` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`right_eye`)),
  `left_eye` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`left_eye`)),
  `vision_acuity` varchar(255) DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `lens_type` varchar(255) DEFAULT NULL,
  `coating` varchar(255) DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `follow_up_notes` text DEFAULT NULL,
  `status` enum('active','expired','cancelled') NOT NULL DEFAULT 'active',
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `prescriptions`
--

INSERT INTO `prescriptions` (`id`, `patient_id`, `optometrist_id`, `appointment_id`, `type`, `prescription_data`, `issue_date`, `expiry_date`, `notes`, `created_at`, `updated_at`, `branch_id`, `prescription_number`, `right_eye`, `left_eye`, `vision_acuity`, `additional_notes`, `recommendations`, `lens_type`, `coating`, `follow_up_date`, `follow_up_notes`, `status`, `deleted_at`) VALUES
(1, 8, 11, 2, 'glasses', '{\"prescription_number\":\"RX202510270001\",\"right_eye\":{\"sphere\":-2,\"cylinder\":-0.5,\"axis\":180,\"add\":0},\"left_eye\":{\"sphere\":-2.25,\"cylinder\":-0.75,\"axis\":175,\"add\":0},\"vision_acuity\":\"20\\/20\",\"lens_type\":\"Single Vision\",\"coating\":\"Anti-reflective\",\"additional_notes\":\"Mild myopia with astigmatism\",\"recommendations\":\"Wear glasses for distance vision\"}', '2025-09-27', '2027-10-27', 'First prescription for eyeglasses', '2025-09-27 05:15:58', '2025-09-27 05:15:58', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', NULL),
(2, 8, 11, 3, 'contact_lenses', '{\"prescription_number\":\"RX202510270002\",\"right_eye\":{\"sphere\":-2,\"cylinder\":0,\"axis\":0,\"base_curve\":8.6,\"diameter\":14.2},\"left_eye\":{\"sphere\":-2.25,\"cylinder\":0,\"axis\":0,\"base_curve\":8.6,\"diameter\":14.2},\"vision_acuity\":\"20\\/20\",\"replacement_schedule\":\"monthly\",\"additional_notes\":\"Contact lens prescription\",\"recommendations\":\"Monthly replacement lenses\"}', '2025-08-28', '2026-10-27', 'Contact lens fitting completed', '2025-08-28 05:15:58', '2025-08-28 05:15:58', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'active', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE IF NOT EXISTS `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_paths` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_paths`)),
  `image_order` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of image paths in display order' CHECK (json_valid(`image_order`)),
  `primary_image` varchar(255) DEFAULT NULL,
  `secondary_image` varchar(255) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `approval_status` varchar(255) NOT NULL DEFAULT 'approved',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `image_paths`, `image_order`, `primary_image`, `secondary_image`, `stock_quantity`, `is_active`, `category_id`, `created_by`, `approval_status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(17, 'Frame 1', NULL, 500.00, '[\"products\\/f562Mb5d208vKE1LW3LdWq8I5UOx12SkMhwvnTgD.jpg\",\"products\\/tLyGk0ajJad1mmJSQ4cqkh5pF4yhON2C3Hoq87IN.jpg\",\"products\\/E0W5SAQOXo1pwlBcdUOtOefQdGvPykW10sZhuk2i.jpg\"]', '[\"products\\/f562Mb5d208vKE1LW3LdWq8I5UOx12SkMhwvnTgD.jpg\",\"products\\/tLyGk0ajJad1mmJSQ4cqkh5pF4yhON2C3Hoq87IN.jpg\",\"products\\/E0W5SAQOXo1pwlBcdUOtOefQdGvPykW10sZhuk2i.jpg\"]', 'products/f562Mb5d208vKE1LW3LdWq8I5UOx12SkMhwvnTgD.jpg', NULL, 0, 1, 1, 1, 'approved', '2025-10-24 03:23:18', '2025-10-24 03:23:18', NULL),
(18, 'Frame 2', NULL, 500.00, '[\"products\\/k4CXEg0LLxVNYZjnP2uyfEXE7L6VvrL0P35zWpHA.jpg\",\"products\\/8vsnqY8RJ2a19Sjlmj3pN4uZQEMHVyXbCqKsOJIk.jpg\",\"products\\/uSctPTuEuMqHweSH541L6Ra7jiBZyV60HR6nW1lc.jpg\"]', '[\"products\\/k4CXEg0LLxVNYZjnP2uyfEXE7L6VvrL0P35zWpHA.jpg\",\"products\\/8vsnqY8RJ2a19Sjlmj3pN4uZQEMHVyXbCqKsOJIk.jpg\",\"products\\/uSctPTuEuMqHweSH541L6Ra7jiBZyV60HR6nW1lc.jpg\"]', 'products/k4CXEg0LLxVNYZjnP2uyfEXE7L6VvrL0P35zWpHA.jpg', NULL, 0, 1, NULL, 1, 'approved', '2025-10-24 03:23:58', '2025-10-24 03:23:58', NULL),
(19, 'Frame 3', NULL, 500.00, '[\"products\\/rTbvFcfxfCwwtFnXMHaAoWA2O8KydWpEpaxmG8pY.jpg\",\"products\\/dSaWtm14yEaRHHA2DDuS3krml8AN93U4KZEdjp1u.jpg\",\"products\\/kZVVtig2Vi72svMJKL3TCAQrAZP3anTpGCYu44CH.jpg\"]', '[\"products\\/rTbvFcfxfCwwtFnXMHaAoWA2O8KydWpEpaxmG8pY.jpg\",\"products\\/dSaWtm14yEaRHHA2DDuS3krml8AN93U4KZEdjp1u.jpg\",\"products\\/kZVVtig2Vi72svMJKL3TCAQrAZP3anTpGCYu44CH.jpg\"]', 'products/rTbvFcfxfCwwtFnXMHaAoWA2O8KydWpEpaxmG8pY.jpg', NULL, 40, 1, 1, 1, 'approved', '2025-10-24 03:25:44', '2025-10-26 21:56:59', NULL),
(20, 'Sunglasses 1', 'DARKLEY', 350.00, '[\"products\\/z4dDXeyBpXRSPyKrV1P5mHtuxriAsh9DbNZzSOg8.jpg\",\"products\\/w7kke7c2itJzVN0rGGS6ghfoynJo9e7JuhBsxZOW.jpg\",\"products\\/7VPYjKQu81TEodzx66BOREr8mMrAEcymgnErPD8a.jpg\"]', '[\"products\\/z4dDXeyBpXRSPyKrV1P5mHtuxriAsh9DbNZzSOg8.jpg\",\"products\\/w7kke7c2itJzVN0rGGS6ghfoynJo9e7JuhBsxZOW.jpg\",\"products\\/7VPYjKQu81TEodzx66BOREr8mMrAEcymgnErPD8a.jpg\"]', 'products/z4dDXeyBpXRSPyKrV1P5mHtuxriAsh9DbNZzSOg8.jpg', NULL, 40, 1, 3, 1, 'approved', '2025-10-24 03:27:54', '2025-10-24 08:16:21', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_categories`
--

CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_categories`
--

INSERT INTO `product_categories` (`id`, `name`, `slug`, `description`, `image`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Frames', 'frames', 'Eyeglass frames for vision correction', NULL, 1, 1, NULL, NULL),
(2, 'Contact Lenses', 'contact-lenses', 'Daily, weekly, and monthly contact lenses', NULL, 1, 2, NULL, NULL),
(3, 'Sunglasses', 'sunglasses', 'Prescription and non-prescription sunglasses', NULL, 1, 3, NULL, NULL),
(4, 'Eye Care', 'eye-care', 'Eye drops, cleaning solutions, and care products', NULL, 1, 4, NULL, NULL),
(5, 'Other Products', 'other-products', 'Other optical and eye care products', NULL, 1, 5, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE IF NOT EXISTS `receipts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `receipt_number` varchar(255) NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `appointment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reservation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL DEFAULT 'cash',
  `payment_status` varchar(255) NOT NULL DEFAULT 'paid',
  `notes` text DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receipt_items`
--

CREATE TABLE IF NOT EXISTS `receipt_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `receipt_id` bigint(20) UNSIGNED NOT NULL,
  `description` varchar(255) NOT NULL,
  `qty` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE IF NOT EXISTS `schedules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `staff_id` bigint(20) UNSIGNED NOT NULL,
  `staff_role` varchar(255) NOT NULL DEFAULT 'optometrist',
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `day_of_week` int(11) NOT NULL,
  `days_of_week` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`days_of_week`)),
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`id`, `staff_id`, `staff_role`, `branch_id`, `day_of_week`, `days_of_week`, `start_time`, `end_time`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(6, 6, 'staff', 3, 1, '[1,2,3,4,5,6]', '09:00:00', '17:00:00', 1, 1, 1, '2025-10-24 11:58:25', '2025-10-24 11:58:25'),
(7, 6, 'staff', 3, 2, '[1,2,3,4,5,6]', '09:00:00', '17:00:00', 1, 1, 1, '2025-10-24 11:58:25', '2025-10-24 11:58:25'),
(8, 6, 'staff', 3, 3, '[1,2,3,4,5,6]', '09:00:00', '17:00:00', 1, 1, 1, '2025-10-24 11:58:25', '2025-10-24 11:58:25'),
(9, 6, 'staff', 3, 4, '[1,2,3,4,5,6]', '09:00:00', '17:00:00', 1, 1, 1, '2025-10-24 11:58:25', '2025-10-24 11:58:25'),
(10, 6, 'staff', 3, 5, '[1,2,3,4,5,6]', '09:00:00', '17:00:00', 1, 1, 1, '2025-10-24 11:58:25', '2025-10-24 11:58:25'),
(11, 6, 'staff', 3, 6, '[1,2,3,4,5,6]', '09:00:00', '17:00:00', 1, 1, 1, '2025-10-24 11:58:25', '2025-10-24 11:58:25');

-- --------------------------------------------------------

--
-- Table structure for table `schedule_change_requests`
--

CREATE TABLE IF NOT EXISTS `schedule_change_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `staff_id` bigint(20) UNSIGNED NOT NULL,
  `staff_role` varchar(255) NOT NULL DEFAULT 'optometrist',
  `day_of_week` int(11) NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `requested_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_code` varchar(255) NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `appointment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reservation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('Pending','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  `payment_method` enum('Cash','Credit Card','Debit Card','Online Payment') NOT NULL DEFAULT 'Cash',
  `notes` text DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'customer',
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0,
  `is_protected` tinyint(1) NOT NULL DEFAULT 0,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `branch_id`, `is_approved`, `is_protected`, `remember_token`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Admin User', 'admin@everbright.com', NULL, '$2y$12$sYoiYNqeorfEZKSIU9Wax.ue9vFBvkmCQnSl6wS7OfyweyePyRef6', 'admin', NULL, 1, 1, NULL, '2025-10-23 09:46:04', '2025-10-23 10:44:14', NULL),
(6, 'unitop_staff', 'unitop@gmail.com', NULL, '$2y$12$/aLAipUGVaKAPe0LQCyQHefCH3PO9uTtN1lEQT0vcKzct9a7nn8F6', 'staff', 3, 1, 0, NULL, '2025-10-23 12:19:12', '2025-10-26 04:04:22', NULL),
(8, 'Genesis', 'genesis@gmail.com', NULL, '$2y$12$GCNxrCjWMjAwwPRR8LbjzuXoFVw1uiekbx599AEsQGpMesCZjArWe', 'customer', NULL, 1, 0, NULL, '2025-10-23 16:16:09', '2025-10-23 16:16:09', NULL),
(11, 'Dr. Samuel Prieto', 'samuel.prieto@everbright.com', NULL, '$2y$12$eiN89dssc/gJ8gYDhUXk4OTDwBG61QFNmppoPRFLmSVQwoNV1SHPu', 'optometrist', 3, 1, 0, NULL, '2025-10-24 09:14:51', '2025-10-24 09:14:51', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointments_appointment_date_start_time_index` (`appointment_date`,`start_time`),
  ADD KEY `appointments_patient_id_appointment_date_index` (`patient_id`,`appointment_date`),
  ADD KEY `appointments_optometrist_id_appointment_date_index` (`optometrist_id`,`appointment_date`),
  ADD KEY `appointments_status_index` (`status`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_auditable_type_auditable_id_index` (`auditable_type`,`auditable_id`),
  ADD KEY `audit_logs_user_id_created_at_index` (`user_id`,`created_at`),
  ADD KEY `audit_logs_event_created_at_index` (`event`,`created_at`),
  ADD KEY `audit_logs_created_at_index` (`created_at`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branches_code_unique` (`code`);

--
-- Indexes for table `branch_contacts`
--
ALTER TABLE `branch_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `branch_contacts_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `branch_stock`
--
ALTER TABLE `branch_stock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branch_stock_product_id_branch_id_unique` (`product_id`,`branch_id`),
  ADD KEY `branch_stock_branch_id_stock_quantity_index` (`branch_id`,`stock_quantity`),
  ADD KEY `branch_stock_product_id_stock_quantity_index` (`product_id`,`stock_quantity`),
  ADD KEY `branch_stock_expiry_date_index` (`expiry_date`),
  ADD KEY `branch_stock_min_stock_threshold_index` (`min_stock_threshold`),
  ADD KEY `branch_stock_auto_restock_enabled_index` (`auto_restock_enabled`),
  ADD KEY `branch_stock_status_index` (`status`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `feedback_customer_id_appointment_id_unique` (`customer_id`,`appointment_id`),
  ADD KEY `feedback_customer_id_created_at_index` (`customer_id`,`created_at`),
  ADD KEY `feedback_branch_id_created_at_index` (`branch_id`,`created_at`),
  ADD KEY `feedback_rating_index` (`rating`),
  ADD KEY `feedback_appointment_id_index` (`appointment_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `manufacturers`
--
ALTER TABLE `manufacturers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_status_index` (`user_id`,`status`),
  ADD KEY `notifications_role_status_index` (`role`,`status`),
  ADD KEY `notifications_created_at_index` (`created_at`),
  ADD KEY `notifications_role_index` (`role`),
  ADD KEY `notifications_status_index` (`status`);

--
-- Indexes for table `optometrist_branches`
--
ALTER TABLE `optometrist_branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `optometrist_branches_user_id_branch_id_unique` (`user_id`,`branch_id`),
  ADD KEY `optometrist_branches_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `optometrist_rotations`
--
ALTER TABLE `optometrist_rotations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `optometrist_rotations_created_by_foreign` (`created_by`),
  ADD KEY `optometrist_rotations_updated_by_foreign` (`updated_by`),
  ADD KEY `optometrist_rotations_optometrist_id_is_active_index` (`optometrist_id`,`is_active`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `prescriptions_prescription_number_unique` (`prescription_number`),
  ADD KEY `prescriptions_appointment_id_foreign` (`appointment_id`),
  ADD KEY `prescriptions_optometrist_id_issue_date_index` (`optometrist_id`,`issue_date`),
  ADD KEY `prescriptions_expiry_date_index` (`expiry_date`),
  ADD KEY `prescriptions_patient_id_index` (`patient_id`),
  ADD KEY `prescriptions_branch_id_foreign` (`branch_id`),
  ADD KEY `prescriptions_patient_id_status_index` (`patient_id`,`status`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_created_by_foreign` (`created_by`);

--
-- Indexes for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_categories_slug_unique` (`slug`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipts_receipt_number_unique` (`receipt_number`),
  ADD KEY `receipts_customer_id_foreign` (`customer_id`);

--
-- Indexes for table `receipt_items`
--
ALTER TABLE `receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `receipt_items_receipt_id_foreign` (`receipt_id`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `schedules_staff_id_branch_id_day_of_week_unique` (`staff_id`,`branch_id`,`day_of_week`),
  ADD KEY `schedules_branch_id_foreign` (`branch_id`),
  ADD KEY `schedules_day_of_week_is_active_index` (`day_of_week`,`is_active`),
  ADD KEY `schedules_staff_id_is_active_index` (`staff_id`,`is_active`),
  ADD KEY `schedules_created_by_foreign` (`created_by`),
  ADD KEY `schedules_updated_by_foreign` (`updated_by`);

--
-- Indexes for table `schedule_change_requests`
--
ALTER TABLE `schedule_change_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `schedule_change_requests_staff_id_foreign` (`staff_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transactions_transaction_code_unique` (`transaction_code`),
  ADD KEY `transactions_customer_id_status_index` (`customer_id`,`status`),
  ADD KEY `transactions_branch_id_status_index` (`branch_id`,`status`),
  ADD KEY `transactions_status_created_at_index` (`status`,`created_at`),
  ADD KEY `transactions_transaction_code_index` (`transaction_code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `branch_contacts`
--
ALTER TABLE `branch_contacts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branch_stock`
--
ALTER TABLE `branch_stock`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `manufacturers`
--
ALTER TABLE `manufacturers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `optometrist_branches`
--
ALTER TABLE `optometrist_branches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `optometrist_rotations`
--
ALTER TABLE `optometrist_rotations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `prescriptions`
--
ALTER TABLE `prescriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `product_categories`
--
ALTER TABLE `product_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `receipt_items`
--
ALTER TABLE `receipt_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `schedule_change_requests`
--
ALTER TABLE `schedule_change_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_optometrist_id_foreign` FOREIGN KEY (`optometrist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_patient_id_foreign` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `branch_contacts`
--
ALTER TABLE `branch_contacts`
  ADD CONSTRAINT `branch_contacts_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `branch_stock`
--
ALTER TABLE `branch_stock`
  ADD CONSTRAINT `branch_stock_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `branch_stock_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `feedback_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `optometrist_branches`
--
ALTER TABLE `optometrist_branches`
  ADD CONSTRAINT `optometrist_branches_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `optometrist_branches_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `optometrist_rotations`
--
ALTER TABLE `optometrist_rotations`
  ADD CONSTRAINT `optometrist_rotations_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `optometrist_rotations_optometrist_id_foreign` FOREIGN KEY (`optometrist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `optometrist_rotations_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD CONSTRAINT `prescriptions_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `prescriptions_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `prescriptions_optometrist_id_foreign` FOREIGN KEY (`optometrist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `prescriptions_patient_id_foreign` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `receipts`
--
ALTER TABLE `receipts`
  ADD CONSTRAINT `receipts_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `receipt_items`
--
ALTER TABLE `receipt_items`
  ADD CONSTRAINT `receipt_items_receipt_id_foreign` FOREIGN KEY (`receipt_id`) REFERENCES `receipts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `schedules_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `schedules_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `schedules_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `schedule_change_requests`
--
ALTER TABLE `schedule_change_requests`
  ADD CONSTRAINT `schedule_change_requests_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;



/*
  Safe addition of foreign keys (only if not already existing).
  These statements use information_schema to avoid duplicate FK errors.
*/
DELIMITER $$

CREATE PROCEDURE AddForeignKeyIfNotExists()
BEGIN
  -- Appointments
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_appointments_patient') THEN
    ALTER TABLE `appointments` ADD CONSTRAINT `fk_appointments_patient` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`);
  END IF;

  -- Feedback
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_feedback_customer') THEN
    ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`);
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_feedback_branch') THEN
    ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`);
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_feedback_appointment') THEN
    ALTER TABLE `feedback` ADD CONSTRAINT `fk_feedback_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`);
  END IF;

  -- Notifications
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_notifications_user') THEN
    ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`);
  END IF;

  -- Personal Access Tokens
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_personal_access_tokens_user') THEN
    ALTER TABLE `personal_access_tokens` ADD CONSTRAINT `fk_personal_access_tokens_user` FOREIGN KEY (`tokenable_id`) REFERENCES `users`(`id`);
  END IF;

  -- Prescriptions
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_prescriptions_patient') THEN
    ALTER TABLE `prescriptions` ADD CONSTRAINT `fk_prescriptions_patient` FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`);
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_prescriptions_optometrist') THEN
    ALTER TABLE `prescriptions` ADD CONSTRAINT `fk_prescriptions_optometrist` FOREIGN KEY (`optometrist_id`) REFERENCES `users`(`id`);
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_prescriptions_branch') THEN
    ALTER TABLE `prescriptions` ADD CONSTRAINT `fk_prescriptions_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`);
  END IF;

  -- Receipts
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_receipts_customer') THEN
    ALTER TABLE `receipts` ADD CONSTRAINT `fk_receipts_customer` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`);
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_receipts_branch') THEN
    ALTER TABLE `receipts` ADD CONSTRAINT `fk_receipts_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`);
  END IF;

  -- Receipt Items
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_receipt_items_receipt') THEN
    ALTER TABLE `receipt_items` ADD CONSTRAINT `fk_receipt_items_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `receipts`(`id`);
  END IF;

  -- Transactions
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_transactions_customer') THEN
    ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_customer` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`);
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_transactions_branch') THEN
    ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`);
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_transactions_appointment') THEN
    ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`);
  END IF;

  -- Optometrist Branches
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_optometrist_branches_user') THEN
    ALTER TABLE `optometrist_branches` ADD CONSTRAINT `fk_optometrist_branches_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`);
  END IF;

  -- Optometrist Rotations
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_optometrist_rotations_created_by') THEN
    ALTER TABLE `optometrist_rotations` ADD CONSTRAINT `fk_optometrist_rotations_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`);
  END IF;
  IF NOT EXISTS (SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'fk_optometrist_rotations_updated_by') THEN
    ALTER TABLE `optometrist_rotations` ADD CONSTRAINT `fk_optometrist_rotations_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`);
  END IF;

END$$

DELIMITER ;

CALL AddForeignKeyIfNotExists();
DROP PROCEDURE AddForeignKeyIfNotExists;


COMMIT;

/* End of Safe Import Script */
