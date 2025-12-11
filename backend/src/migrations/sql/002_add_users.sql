CREATE TYPE user_role AS ENUM ('admin', 'user');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- simplified from enum to avoid migration complexity if enum exists
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id to bookings to track who booked
ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Optional: Create a default admin user (password: admin123)
-- Hash generated via bcrypt.hashSync('admin123', 10) -> '$2b$10$YourHashHere' 
-- We will leave this for registration endpoint or manual insert to avoid hardcoding hash here without library access
