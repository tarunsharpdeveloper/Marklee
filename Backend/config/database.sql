CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  otp VARCHAR(6),
  otp_expiry DATETIME,
  is_verified BOOLEAN DEFAULT FALSE,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


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


CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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


CREATE TABLE IF NOT EXISTS brief_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    input_field_name VARCHAR(100) NOT NULL,
    placeholder TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS ai_prompts_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


INSERT INTO ai_prompts_type (type) VALUES ('audience'), ('content');


CREATE TABLE IF NOT EXISTS ai_prompts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prompt_for_id INT NOT NULL, 
    prompt TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_for_id) REFERENCES ai_prompts_type(id) ON DELETE CASCADE
);  

-- Insert default AI prompts
INSERT INTO ai_prompts (prompt_for_id, prompt) VALUES 
(1, 'Based on the following brief, generate 2 distinct audience segments:

Brief Information:
Product/Service: {product}
Main Message: {message}
Special Features: {features}
Benefits: {benefits}
Beneficiaries: {beneficiaries}
Importance: {importance}
Additional Info: {additionalInfo}
Call to Action: {callToAction}

For each segment, provide:
1. Segment Name and Description
2. Detailed Audience Insights
3. Messaging Angle
4. Support Points (as bullet points)
5. Appropriate Tone of Voice
6. Detailed Persona Profile

Format the response as a valid JSON array where each object has the fields:
- segment
- insights
- messagingAngle
- supportPoints
- tone
- personaProfile

Make each field detailed but concise.'),

(2, 'Generate {assetType} based on the following brief and audience:

Brief:
Purpose: {purpose}
Main Message: {mainMessage}
Special Features: {specialFeatures}
Benefits: {benefits}
Call to Action: {callToAction}

Audience:
Segment: {segment}
Insights: {insights}
Messaging Angle: {messagingAngle}
Tone: {tone}

Requirements:
1. Content must be engaging and persuasive
2. Follow the specified tone of voice
3. Include the main message and support points
4. End with the call to action
5. Format appropriately for the asset type
6. Simple content, no more than 200 words and do not include any emojis');  

CREATE TABLE IF NOT EXISTS user_onboarding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
