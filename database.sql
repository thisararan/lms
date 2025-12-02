-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: lms_database
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attachmentName` varchar(255) DEFAULT NULL,
  `attachmentSize` bigint DEFAULT NULL,
  `attachmentUrl` varchar(255) DEFAULT NULL,
  `createdAt` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `dueDate` datetime(6) NOT NULL,
  `maxPoints` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `updatedAt` datetime(6) DEFAULT NULL,
  `course_id` bigint NOT NULL,
  `teacher_id` bigint NOT NULL,
  `attachmentType` varchar(255) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_size` bigint DEFAULT NULL,
  `attachment_type` varchar(255) DEFAULT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `due_date` datetime(6) DEFAULT NULL,
  `max_points` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK6p1m72jobsvmrrn4bpj4168mg` (`course_id`),
  KEY `FK67msc7a52b0l2pttoq5bhm6bk` (`teacher_id`),
  KEY `FKotqcl7qkgnihgxa6x71is49i3` (`created_by`),
  CONSTRAINT `FK67msc7a52b0l2pttoq5bhm6bk` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK6p1m72jobsvmrrn4bpj4168mg` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `FKotqcl7qkgnihgxa6x71is49i3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,NULL,NULL,NULL,'2025-11-08 07:18:47.090152','','2025-11-29 18:30:00.000000',100,'assignment01','2025-11-08 07:18:47.090152',10,28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(255) NOT NULL,
  `level` enum('BEGINNER','INTERMEDIATE','ADVANCED') NOT NULL DEFAULT 'BEGINNER',
  `instructor_id` bigint NOT NULL,
  `duration` varchar(255) NOT NULL,
  `students` int DEFAULT '0',
  `rating` double DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `price` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_instructor` (`instructor_id`),
  KEY `idx_category` (`category`),
  KEY `idx_level` (`level`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'Introduction to Programming','Learn the basics of programming with Python. Perfect for beginners with no prior experience.','Programming','BEGINNER',2,'8 weeks',151,4.5,NULL,'Free','2025-10-29 09:12:23','2025-11-11 06:44:33'),(2,'Web Development Fundamentals','Master HTML, CSS, and JavaScript to build modern, responsive websites.','Web Development','BEGINNER',2,'10 weeks',201,4.7,NULL,'Free','2025-10-29 09:12:23','2025-11-11 09:54:06'),(3,'Advanced Java Programming','Deep dive into Java programming concepts, design patterns, and enterprise development.','Programming','ADVANCED',2,'12 weeks',77,4.8,NULL,'$99','2025-10-29 09:12:23','2025-11-14 01:18:44'),(4,'Data Science Essentials','Learn data analysis, visualization, and machine learning with Python and R.','Data Science','INTERMEDIATE',2,'14 weeks',120,4.9,NULL,'$149','2025-10-29 09:12:23','2025-10-29 09:12:23'),(5,'Mobile App Development with React Native','Build cross-platform mobile applications using React Native and JavaScript.','Mobile Development','INTERMEDIATE',2,'10 weeks',90,4.6,NULL,'$79','2025-10-29 09:12:23','2025-10-29 09:12:23'),(6,'Database Management Systems','Comprehensive course on SQL, database design, and management with MySQL and PostgreSQL.','Database','BEGINNER',11,'8 weeks',181,4.4,NULL,'Free','2025-10-29 09:12:23','2025-11-11 15:31:34'),(7,'thi','mmm','Arts','INTERMEDIATE',1,'4 to 8',0,0,NULL,'1000','2025-10-30 09:59:57','2025-11-01 03:27:29'),(8,'Software Engineering','Software Engineering computer science','Programming','ADVANCED',23,'242 weeks',0,0,NULL,'Free','2025-10-30 10:26:14','2025-11-08 03:05:45'),(9,'Data Structure and Algorithms','Data Structure and Algorithms','Programming','BEGINNER',1,'242 weeks',0,0,NULL,'1000','2025-11-01 03:43:28','2025-11-01 03:43:28'),(10,'software engineer and cs','software engineer and cyber security','Programming','BEGINNER',28,'242 weeks',0,0,NULL,'Free','2025-11-07 18:12:00','2025-11-07 18:12:00'),(11,'mobile application development','developing mobile application','Programming','BEGINNER',28,'242 weeks',0,0,NULL,'Free','2025-11-08 03:04:48','2025-11-08 03:04:48'),(12,'object oriented programming','object oriented programming OOP','Programming','BEGINNER',33,'242 weeks',2,0,NULL,'Free','2025-11-08 04:14:20','2025-11-14 05:18:04'),(13,'Information technology','Information technology','Programming','BEGINNER',36,'242 weeks',0,0,NULL,'Free','2025-11-18 17:07:59','2025-11-18 17:07:59'),(14,'Research Methodology','Research Methodology','Programming','BEGINNER',45,'242 weeks',0,0,NULL,'Free','2025-12-01 14:03:36','2025-12-01 14:03:36');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollments`
--

DROP TABLE IF EXISTS `enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completed` bit(1) DEFAULT NULL,
  `enrolled_at` datetime(6) DEFAULT NULL,
  `progress` int DEFAULT NULL,
  `course_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKi0g6mfijtuh199nj653nva6j5` (`student_id`,`course_id`),
  KEY `FKho8mcicp4196ebpltdn9wl6co` (`course_id`),
  CONSTRAINT `FK2lha5vwilci2yi3vu5akusx4a` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKho8mcicp4196ebpltdn9wl6co` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollments`
--

LOCK TABLES `enrollments` WRITE;
/*!40000 ALTER TABLE `enrollments` DISABLE KEYS */;
INSERT INTO `enrollments` VALUES (1,_binary '\0',NULL,0,1,37),(2,_binary '\0',NULL,0,3,37),(3,_binary '\0',NULL,0,12,29),(4,_binary '\0',NULL,0,2,29),(5,_binary '\0',NULL,0,6,37),(6,_binary '\0',NULL,0,3,38),(7,_binary '\0',NULL,0,12,38);
/*!40000 ALTER TABLE `enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_size` bigint DEFAULT NULL,
  `attachment_type` varchar(255) DEFAULT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `visibility` varchar(255) NOT NULL,
  `author_id` bigint NOT NULL,
  `course_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKeequ6tj8iu98mxv7jr0nrb98n` (`author_id`),
  KEY `FKdn1o768ox9voi78asnp5mp4mw` (`course_id`),
  CONSTRAINT `FKdn1o768ox9voi78asnp5mp4mw` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `FKeequ6tj8iu98mxv7jr0nrb98n` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_materials`
--

DROP TABLE IF EXISTS `study_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_materials` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `course_id` bigint DEFAULT NULL,
  `teacher_id` bigint DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `study_materials_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `study_materials_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_materials`
--

LOCK TABLES `study_materials` WRITE;
/*!40000 ALTER TABLE `study_materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `study_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submissions`
--

DROP TABLE IF EXISTS `submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_size` bigint DEFAULT NULL,
  `attachment_type` varchar(255) DEFAULT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `content` text,
  `feedback` varchar(255) DEFAULT NULL,
  `grade` int DEFAULT NULL,
  `graded` bit(1) DEFAULT NULL,
  `graded_at` datetime(6) DEFAULT NULL,
  `submitted_at` datetime(6) DEFAULT NULL,
  `assignment_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKrirbb44savy2g7nws0hoxs949` (`assignment_id`),
  KEY `FK3p6y8mnhpwusdgqrdl4hcl72m` (`student_id`),
  CONSTRAINT `FK3p6y8mnhpwusdgqrdl4hcl72m` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKrirbb44savy2g7nws0hoxs949` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submissions`
--

LOCK TABLES `submissions` WRITE;
/*!40000 ALTER TABLE `submissions` DISABLE KEYS */;
INSERT INTO `submissions` VALUES (1,'thisara_assignment01.pdf',524288,'application/pdf','/uploads/1735680000000_sample.pdf','Submitted by Thisara - Full solution with explanation',NULL,NULL,_binary '\0',NULL,'2025-11-25 10:30:00.000000',1,29),(2,'chamon_assignment01.zip',2097152,'application/zip','/uploads/1735680000001_sample.zip','Chamon - Assignment with code and screenshots',NULL,NULL,_binary '\0',NULL,'2025-11-26 14:20:00.000000',1,37),(3,'thilak_assignment01.docx',887234,'application/vnd.openxmlformats-officedocument.wordprocessingml.document','/uploads/1735680000002_sample.docx','Thilak - Complete submission with documentation',NULL,NULL,_binary '\0',NULL,'2025-11-27 09:15:00.000000',1,38);
/*!40000 ALTER TABLE `submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('STUDENT','TEACHER','ADMIN') NOT NULL DEFAULT 'STUDENT',
  `student_id` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `course_id` bigint DEFAULT NULL,
  `temp_password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `UK_6dotkott2kjsp8vw4d0m25fb7` (`email`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `UK_qh3otyipv2k9hqte4a1abcyhq` (`student_id`),
  UNIQUE KEY `UKqh3otyipv2k9hqte4a1abcyhq` (`student_id`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_course_id` (`course_id`),
  CONSTRAINT `fk_user_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System Administrator','admin@lms.com','$2b$10$u.6tDp7VzDLzj1WCiH5muOmMrfPb1AsaLsiUy7hd4nY2aGnRViBAG','ADMIN',NULL,NULL,NULL,NULL,'ACTIVE','2025-10-29 09:11:39','2025-10-29 13:37:09',NULL,NULL),(2,'John Smith','teacher0@lms.com','$2b$10$Rxq6ywPEx9y6CfrMhF/T/.PFKeb6g7oPmyfbXDTf1VFWVfDII33Gi','TEACHER',NULL,'Web Development Fundamentals','M.Sc. in Mathematics','123-456-7891','ACTIVE','2025-10-29 09:11:52','2025-11-07 11:23:15',NULL,NULL),(3,'Alice Johnson','student@lms.com','$2a$10$cUyLJlFzDd91OIbOEvn9Guj5DqXrbcUD1a.TKmeugRC4IEU0Z3Wli','STUDENT','STU001',NULL,NULL,'','ACTIVE','2025-10-29 09:12:03','2025-11-26 08:31:42',NULL,'111111'),(4,'Bob Wilson','bob@lms.com','$2a$10$ABCDE1234567890ABCDEFO.ExampleHashedPassword4','STUDENT','STU002',NULL,NULL,NULL,'ACTIVE','2025-10-29 09:12:08','2025-11-26 14:31:15',NULL,'default123'),(5,'Carol Davis','carol@lms.com','$2a$10$ABCDE1234567890ABCDEFO.ExampleHashedPassword5','STUDENT','STU003',NULL,NULL,NULL,'ACTIVE','2025-10-29 09:12:08','2025-11-26 14:31:15',NULL,'default123'),(6,'David Brown','david@lms.com','$2a$10$EcNsy4zI1xvBsGPdETXcru/767nuAXPUgQDJhHM2AnCgFcH6Hp0vq','STUDENT','STU004',NULL,NULL,'','ACTIVE','2025-10-29 09:12:08','2025-11-26 09:47:09',NULL,'111112'),(7,'John Doe','john.doe@example.com','$2a$10$gThS5woY3MyXdYRyg4PD4uPlj65VMn7fzsdMT0a9MtNNW2WXbFCNW','STUDENT','STU2025001',NULL,NULL,NULL,'ACTIVE','2025-10-29 07:43:36','2025-11-26 14:31:15',NULL,'default123'),(8,'thisara ayya','thisararandika01@gmail.com','$2a$10$dIaAHxHaZNCWLraJ8DKNAutGTkm69XjVq6poZQRuipg/lUt3niwse','STUDENT','12123',NULL,NULL,NULL,'ACTIVE','2025-10-29 07:53:56','2025-11-26 14:31:15',NULL,'default123'),(9,'musfir','musfir@gmail.com','$2a$10$ygAEH/Lqn.po3LvAPPuZAea2gMASXxVNg6rkg6w1tLevkGbBUwI8S','STUDENT','11124',NULL,NULL,NULL,'ACTIVE','2025-10-29 08:12:59','2025-11-26 14:31:15',NULL,'default123'),(11,'Teacher02','teacher02@lms.com','$2a$10$do3wrOwWn/hQNN2.ND7SKekM0zoxQ.zosyosk./t8bjW.8O/8wg3q','TEACHER',NULL,'Data Science Essentials','SE','0776662662','ACTIVE','2025-10-30 10:30:05','2025-10-30 10:40:41',NULL,NULL),(12,'Teacher03','teacher03@lms.com','$2a$10$/npw9tTB9hW3.PhOjtYMyeGkHmmiCm82hqPH/v5rw8nIEkbQ1TFcS','TEACHER',NULL,'Database Management Systems','SE','0776662663','ACTIVE','2025-10-30 10:31:19','2025-11-13 08:50:15',NULL,NULL),(14,'teacher05','teacher05@lms.com','$2a$10$0vnN6IaOEJSVjSmGNjrIhuhI.CeUJ6cwa6earZDutcAis/5RO91pq','TEACHER',NULL,'Web Development Fundamentals','M.Sc. in Mathematics','0786710320','ACTIVE','2025-10-31 01:45:37','2025-11-01 04:12:26',NULL,NULL),(15,'Teacher06','teacher06@lms.com','$2a$10$10lM0o/MsscSjPoXwgf/lu5Uchq0TyIymUSz3B16VQxxXwWQLT9bS','TEACHER',NULL,'Advanced Java Programming','M.Sc. in Science','0786710321','ACTIVE','2025-10-31 02:01:09','2025-10-31 02:01:09',NULL,NULL),(16,'Teacher07','teacher07@lms.com','$2a$10$0BSD1lodcScBhfU.kJbeMOOV36f.Z02pmLPegpNUCrLWNKw60z7uy','TEACHER',NULL,'Data Structure and Algorithms','M.Sc. in Mathematics','0776006363','ACTIVE','2025-11-01 04:15:09','2025-11-07 13:27:32',NULL,NULL),(17,'randika','student07@lms.com','$2a$10$o9yCGEgyLPnnnDtkoxC5m.QmvfnGAF/dBAVUMSpauj/e2WUTACQLy','STUDENT','0007',NULL,NULL,NULL,'ACTIVE','2025-11-06 10:54:14','2025-11-26 14:31:15',NULL,'default123'),(18,'Dr. Mathematics','math.teacher@lms.com','$2a$10$ZqW3h83ixxl3Tjvg1ytWfO/xCPX6yuqj1re65Pbu8VKbGN8GswHDm','TEACHER',NULL,'Mathematics','PhD in Mathematics','123-456-7891','ACTIVE','2025-11-06 12:43:00','2025-11-06 12:43:00',NULL,NULL),(20,'Bob Wilson','bob.wilson@student.com','$2a$10$aDBHlZdYKbPVugcxxcu5NO7t1NNyTHNW8JyzPIaT2c81iCnH0U30W','STUDENT','STU1762453160916',NULL,NULL,NULL,'ACTIVE','2025-11-06 12:49:21','2025-11-26 14:31:15',NULL,'default123'),(21,'Carol Davis','carol.davis@student.com','$2a$10$WrRY0/LC3UAEwpzcmd8BLO0dKU1o/W6V7JXApM6BjQHegsW3pP0wm','STUDENT','STU1762453161181',NULL,NULL,NULL,'ACTIVE','2025-11-06 12:49:21','2025-11-26 14:31:15',NULL,'default123'),(22,'Prof. Robert Brown','science.teacher@lms.com','$2a$10$wGgLsguRkKlXJFIctbzRV.l8Gs82ZPLdx0ewWCF2CKshGsPQuoWmS','TEACHER',NULL,'Science','M.Sc. in Physics','555-987-6543','ACTIVE','2025-11-07 03:12:38','2025-11-07 03:12:38',NULL,NULL),(23,'teacher00','teacher00@lms.com','$2a$10$UiYdxRWDGwYzjfG0TqTH/.iVJ09KLu5j2lSQrdJgXwxoVgZNu5DIy','TEACHER',NULL,'Data Structure and Algorithms','M.Sc. in Mathematics','0776662667','ACTIVE','2025-11-07 05:58:29','2025-11-07 05:58:29',NULL,NULL),(24,'bishar','kgbishar@lms.com','$2a$10$Nq0u6I/8Vl.UbTkVAL932.cR9WUhzR5e8zSzUQ24NiVSLum52yhV2','STUDENT','11473',NULL,NULL,NULL,'ACTIVE','2025-11-07 06:32:09','2025-11-26 14:31:15',NULL,'default123'),(25,'John Smith','teacher@lms.com','$2a$10$OqbmxjchdCSx7i9EGIFlBetyECyZnyg8gjUNqqNBNLY6NIkEj.Xz2','TEACHER',NULL,'Mathematics','M.Sc. in Mathematics','123-456-7890','ACTIVE','2025-11-07 06:57:51','2025-11-07 06:57:51',NULL,NULL),(26,'janitha kumara','teacher001@lms.com','$2a$10$3Sk.mfUg2Mpd7e7VWVPfT.lZb9S1iauMo6ZNj5y1cicZb2A1k3VYC','TEACHER',NULL,'Advanced Java Programming','M.Sc. in Science','0776662661','ACTIVE','2025-11-07 08:56:23','2025-11-07 08:56:23',NULL,NULL),(27,'John Doe','john.doe@school.com','$2a$10$WvTQXwUwWiroH19OScQSG.ZTWGZw.t.Y4PL.xgs.x8Z3MW/EndRCe','TEACHER',NULL,'Mathematics','B.Sc in Mathematics','+94771234567','ACTIVE','2025-11-07 12:37:15','2025-11-07 12:37:15',NULL,NULL),(28,'thisara teacher','thisara@lms.com','$2a$10$wO.Q5JFMY5lHV0W5J2wjSOMojJN5pJOqncIR7PXASepY2pY1tDqby','TEACHER',NULL,'Advanced Java Programming','M.Sc. in Science','0776662000','ACTIVE','2025-11-07 13:24:15','2025-11-07 13:24:15',NULL,NULL),(29,'Thisara','thisara11@lms.com','$2a$10$98VzqeeCNgTs1FFShWWBcu5gKSFMS.CyQVNhEiobCoR8a23seFKlu','STUDENT','0011',NULL,NULL,NULL,'ACTIVE','2025-11-07 13:46:07','2025-11-26 14:31:15',NULL,'default123'),(30,'randika teacher','randika@lms.com','$2a$10$IjvtcAFZWGlBJdiONJMPmeosQ3OIWtRDKkqZmNm06/3vHX8XzvsTC','TEACHER',NULL,'Advanced Java Programming','M.Sc. in Mathematics','0776662001','ACTIVE','2025-11-07 16:19:30','2025-11-07 16:19:30',NULL,NULL),(31,'thanura teacher','thanura@lms.com','$2a$10$99eayA7voeb.QdhLc6TM1.6SrwW8b6rSkp1jUJNjW7xKUoWnfGkj6','TEACHER',NULL,'Software Engineering','M.Sc. in Mathematics','0786710328','ACTIVE','2025-11-07 18:09:33','2025-11-07 18:09:33',NULL,NULL),(32,'uvindu teacher','uvindu@lms.com','$2a$10$6cGpmqidBKknfSUUgQvzpO7/2GbA00eEKdiHsHaxRPAXbfneX4KO.','TEACHER',NULL,'mobile application development','M.Sc. in IT','0776662690','ACTIVE','2025-11-08 03:07:34','2025-11-08 03:07:34',NULL,NULL),(33,'ravi','ravi@lms.com','$2a$10$KK0wKt6BGaE7QiFjPx6NiOB3Mdc3UIneh1erIObHRazRojKmrNpzm','TEACHER',NULL,'software engineer and cs','M.Sc. in Mathematics','0776006307','ACTIVE','2025-11-08 03:43:22','2025-11-08 03:43:22',NULL,NULL),(34,'lakshitha','lakshitha@lms.com','$2a$10$dMZ95ob.KmExx5620y0MIeP/NaV1DU5qFPiNJRwhL3ZIMYKpZ0X2C','TEACHER',NULL,'Advanced Java Programming','M.Sc. in IT','0719977919','ACTIVE','2025-11-08 04:15:36','2025-11-08 05:48:11',NULL,NULL),(35,'raveenaa','raveenst@lms.com','$2a$10$2YQD/Pd7dm5ISvU3jxafIOoYNPAHv8Z2EG.fbgsnTny6Gd47UwDbq','STUDENT','0012',NULL,NULL,NULL,'ACTIVE','2025-11-09 10:05:33','2025-11-26 14:31:15',NULL,'default123'),(36,'chamon','chamon@lms.com','$2a$10$HZFtWR.w4Afq/uGgtfCBUeuahsNZSG0ZqAtay/SU20dnoHLh1kHR6','TEACHER',NULL,'object oriented programming','M.Sc. in Science','0771234567','ACTIVE','2025-11-09 14:10:22','2025-11-09 14:10:22',NULL,NULL),(37,'chamonst','chamonst@lms.com','$2a$10$4sotIAuGnmiDWAAdjoZCBu9pFLOt7rx8uNiH7BnaVvQb4d5Yb7qI.','STUDENT','0014',NULL,NULL,NULL,'ACTIVE','2025-11-09 14:11:59','2025-11-26 14:31:15',NULL,'default123'),(38,'thilak','thilak@lms.com','$2a$10$H.6I0Zidm7TVw.iwfGKVfuJYBKg1ac8zoEiVe33I/xz.UC1DDRfc6','STUDENT','14627',NULL,NULL,'','ACTIVE','2025-11-14 01:17:48','2025-11-26 08:30:09',NULL,'111111'),(39,'chamod','chamod@lms.com','$2a$10$KxVfhDoB8RLznDXkrteGlew.vh2pQ.iYB5SRIkCqd1JaMk8xJxWyy','STUDENT','0075',NULL,'','','ACTIVE','2025-11-18 13:15:13','2025-11-26 14:31:15',NULL,'default123'),(40,'chamika','chamika@lms.com','$2a$10$/OCCGNE4dhKFscyqyoqVCu/tcz6gNp0okUYcG/n.mE6QD6amYwCLK','STUDENT','0019',NULL,'','','ACTIVE','2025-11-18 14:01:14','2025-11-26 14:31:15',NULL,'default123'),(41,'aaa','aaa@lms.com','$2a$10$m7pu9kAdq/tvAQiCTB7Iu.8O3Niwpa4gO0g7aGcDIg5LBXc0IShP2','TEACHER',NULL,'object oriented programming','M.Sc. in Mathematics','011111111','ACTIVE','2025-11-18 16:26:45','2025-11-18 16:26:45',NULL,NULL),(42,'thushara','thushara@lms.com','$2a$10$sO82Wg7P6rRXYrITI3K4a.8W2VP.tsT9Na1Btfe0zDoHCJN8DrRoa','STUDENT','0020',NULL,'','','ACTIVE','2025-11-26 08:40:55','2025-11-26 14:31:15',NULL,'default123'),(43,'chamara','chamara@lms.com','$2a$10$7sSqY1FQkColSh1XtlkejOTJ05ByMhwK2fU8O6b4dYazMZ6JRVtCW','STUDENT','0022',NULL,'','','ACTIVE','2025-11-26 09:04:02','2025-11-26 09:04:02',NULL,NULL),(44,'anura','anura@lms.com','$2a$10$cZ8k.fVnCsvnuD5USncKmuqc9V15b.MWfVXClKFcSEv3oJzNpsTmS','STUDENT','0100',NULL,'','0776000004','ACTIVE','2025-12-01 13:59:52','2025-12-01 13:59:52',NULL,NULL),(45,'kumara','kumara@lms.com','$2a$10$BsISgf.3hoDMBcngP4IU1e5OP4JG.jTcuRnObqU3.JC6pUDYyal2y','TEACHER',NULL,'Research Methodology','M.Sc. in Mathematics','0776000005','ACTIVE','2025-12-01 14:02:56','2025-12-01 14:03:58',NULL,'111111'),(46,'kasun','kasun@lms.com','$2a$10$3h6If4Tu.llEnh8scQ4WkOYzPyYMTYA7O5KhDVV/1SJUIky1OdOcO','STUDENT','0099',NULL,NULL,'0776662665','ACTIVE','2025-12-02 00:25:55','2025-12-02 00:25:55',NULL,'111111');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-02 11:30:48
