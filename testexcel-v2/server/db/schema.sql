-- TestExcel contact/service-request form: MySQL schema (Hostinger managed MySQL).
-- Run once via hPanel's phpMyAdmin (or `mysql -u ... -p ... < schema.sql`).

CREATE TABLE IF NOT EXISTS contact_submissions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  request_ref      CHAR(36)     NOT NULL,                         -- client-generated idempotency key, blocks duplicate inserts from double-click/retry
  full_name        VARCHAR(200) NOT NULL,
  company          VARCHAR(200) NULL,
  email            VARCHAR(320) NOT NULL,
  role             VARCHAR(200) NULL,
  service_interest VARCHAR(120) NULL,
  message          TEXT         NOT NULL,
  source_page      VARCHAR(500) NULL,
  status           ENUM('New', 'Contacted', 'In Progress', 'Closed') NOT NULL DEFAULT 'New',
  submitted_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_request_ref (request_ref),
  INDEX idx_submitted_at (submitted_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- No RLS equivalent exists in plain MySQL — access control here is enforced by
-- the Node API being the ONLY thing that ever connects to this database. The
-- MySQL user the API authenticates as should be scoped to INSERT + SELECT on
-- this table only (SELECT is needed so the API itself can look up leads for
-- an eventual admin view; the browser never talks to MySQL directly, so this
-- MySQL user's credentials are never shipped anywhere near the frontend).
