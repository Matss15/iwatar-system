CREATE DATABASE IF NOT EXISTS iwatar_system;
USE iwatar_system;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS scan_logs;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS report_settings;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admins;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  google_email VARCHAR(190) UNIQUE,
  google_id VARCHAR(255) UNIQUE,
  otp_secret VARCHAR(64),
  otp_enabled TINYINT(1) NOT NULL DEFAULT 0,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lrn VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  section VARCHAR(100),
  grade_level VARCHAR(50),
  photo VARCHAR(255) DEFAULT '/images/student-placeholder.svg',
  fingerprint_id VARCHAR(100) UNIQUE,
  guardian_name VARCHAR(120),
  contact_number VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  announcement_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day_name VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject VARCHAR(120) NOT NULL,
  teacher VARCHAR(120),
  room VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scan_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  scan_type ENUM('fingerprint', 'temperature', 'manual') NOT NULL,
  temperature_c DECIMAL(4,1),
  status ENUM('present', 'normal', 'flagged', 'failed') NOT NULL DEFAULT 'present',
  message VARCHAR(255),
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_scan_logs_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE SET NULL
);

CREATE TABLE report_settings (
  id INT PRIMARY KEY,
  recipients TEXT,
  auto_enabled TINYINT(1) NOT NULL DEFAULT 0,
  send_time CHAR(5) NOT NULL DEFAULT '17:00',
  last_auto_sent_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO admins (username, password_hash, full_name, role) VALUES
('admin', 'admin123', 'System Administrator', 'Admin');

INSERT INTO students (lrn, first_name, last_name, section, grade_level, photo, fingerprint_id, guardian_name, contact_number, address) VALUES
('123456789012', 'Juan', 'Dela Cruz', 'Aguinaldo', 'Grade 10', '/images/student-placeholder.svg', 'FP-001', 'Maria Dela Cruz', '09171234567', 'Barangay Centro, Sample City'),
('987654321098', 'Ana', 'Santos', 'Bonifacio', 'Grade 10', '/images/student-placeholder.svg', 'FP-002', 'Jose Santos', '09176543210', 'Barangay Mabini, Sample City');

INSERT INTO announcements (title, body, announcement_date, is_active) VALUES
('Flag Ceremony', 'All students must proceed to the covered court before 7:30 AM.', CURDATE(), 1),
('Library Reminder', 'Return borrowed books at the library counter today.', CURDATE(), 1);

INSERT INTO schedules (day_name, start_time, end_time, subject, teacher, room) VALUES
(DAYNAME(CURDATE()), '07:30:00', '08:30:00', 'Mathematics', 'Ms. Reyes', 'Room 201'),
(DAYNAME(CURDATE()), '08:30:00', '09:30:00', 'Science', 'Mr. Garcia', 'Room 202'),
(DAYNAME(CURDATE()), '10:00:00', '11:00:00', 'English', 'Ms. Lim', 'Room 203');

INSERT INTO scan_logs (student_id, scan_type, temperature_c, status, message) VALUES
(1, 'fingerprint', 36.6, 'present', 'Fingerprint verified'),
(1, 'temperature', 36.6, 'normal', 'Temperature normal'),
(2, 'fingerprint', 37.8, 'flagged', 'Temperature requires attention');

INSERT INTO report_settings (id, recipients, auto_enabled, send_time) VALUES
(1, '', 0, '17:00');
