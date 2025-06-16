CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  otp VARCHAR(6),
  otp_expiry DATETIME,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- if not exists role column in user table, add it
-- Check if 'role' column exists, and add it only if it doesn't
SET @column_exists := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'role'
);

-- Prepare and execute ALTER TABLE statement only if column doesn't exist
SET @sql := IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN role ENUM(\'admin\', \'user\') NOT NULL DEFAULT \'user\'', 
  'SELECT "Column already exists, skipping ALTER TABLE";'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


add admin user and password is 123456 if not exists
INSERT INTO users (name, email, password, role ,is_verified) VALUES ('Admin', 'admin@gmail.com', '$2a$10$rysdja9AWpDGGW1aMW.9FecY9SKLXk8zeLpMWMgvCW8YqCvY4xd0y', 'admin', true);

CREATE TABLE IF NOT EXISTS user_metadata (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  organization_type ENUM('Business', 'Non-profit', 'Personal Brand') NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  support_type VARCHAR(100) NOT NULL,
  product_description TEXT NOT NULL,
  business_model ENUM('Value-add', 'Volume-based', 'Mission-driven') NOT NULL,
  revenue_model ENUM('Accounts', 'Subscriptions', 'Services', 'Other') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
); 

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create briefs table
CREATE TABLE IF NOT EXISTS briefs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    main_message TEXT NOT NULL,
    special_features TEXT,
    beneficiaries TEXT,
    benefits TEXT,
    call_to_action TEXT,
    importance TEXT,
    additional_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create audiences table
CREATE TABLE IF NOT EXISTS audiences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brief_id INT NOT NULL,
    segment TEXT NOT NULL,
    insights TEXT,
    messaging_angle TEXT,
    support_points TEXT,
    tone VARCHAR(255),
    persona_profile TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE CASCADE
);

-- Create generated_content table
CREATE TABLE IF NOT EXISTS generated_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brief_id INT NOT NULL,
    audience_id INT,
    asset_type VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE CASCADE,
    FOREIGN KEY (audience_id) REFERENCES audiences(id) ON DELETE SET NULL
); 

-- create a table for brief questions
CREATE TABLE IF NOT EXISTS brief_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL,
    ai_key VARCHAR(100) NOT NULL,
    input_field_name VARCHAR(100) NOT NULL,
    placeholder TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
