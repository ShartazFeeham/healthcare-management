-- One schema per microservice (database-per-service).
CREATE DATABASE IF NOT EXISTS healthcare_accounts          CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS healthcare_patients          CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS healthcare_doctors           CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS healthcare_medicines         CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS healthcare_appointments      CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS healthcare_community         CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS healthcare_notifications     CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS healthcare_cdss              CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS healthcare_internationalization CHARACTER SET utf8mb4;
GRANT ALL PRIVILEGES ON `healthcare\_%`.* TO 'healthcare'@'%';
FLUSH PRIVILEGES;
