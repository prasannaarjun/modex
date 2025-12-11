CREATE TABLE IF NOT EXISTS shows (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS show_inventory (
  show_id INTEGER PRIMARY KEY REFERENCES shows(id),
  total_seats INTEGER NOT NULL,
  reserved_seats INTEGER NOT NULL DEFAULT 0,
  confirmed_seats INTEGER NOT NULL DEFAULT 0
);

CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  show_id INTEGER NOT NULL REFERENCES shows(id),
  status VARCHAR(50) NOT NULL, -- Use string for simplicity or enum if prefer strictness
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_seats (
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  seat_number VARCHAR(10) NOT NULL,
  PRIMARY KEY (booking_id, seat_number)
);

-- Index for expiration worker
CREATE INDEX IF NOT EXISTS idx_bookings_status_expires_at ON bookings(status, expires_at);
