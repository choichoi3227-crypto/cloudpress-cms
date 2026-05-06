-- schema.sql
-- wp_posts 테이블 대응
CREATE TABLE wp_posts (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  post_author INTEGER,
  post_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  post_content TEXT,
  post_title TEXT,
  post_excerpt TEXT,
  post_status TEXT DEFAULT 'publish',
  comment_status TEXT DEFAULT 'open',
  post_name TEXT, -- slug
  post_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
  post_type TEXT DEFAULT 'post',
  post_mime_type TEXT
);

-- wp_options 테이블 대응 (설정값 저장)
CREATE TABLE wp_options (
  option_id INTEGER PRIMARY KEY AUTOINCREMENT,
  option_name TEXT UNIQUE,
  option_value TEXT,
  autoload TEXT DEFAULT 'yes'
);

-- 사용자 정보
CREATE TABLE wp_users (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  user_login TEXT UNIQUE,
  user_pass TEXT,
  user_email TEXT,
  display_name TEXT
);

-- 세션 복구 및 스왑을 위한 테이블
CREATE TABLE session_recovery (
  id TEXT PRIMARY KEY,
  state BLOB, -- 압축된 PHP 힙 상태
  last_url TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- VFS 설정 파일 동기화 (WP Rocket 등)
CREATE TABLE cp_vfs_configs (
  file_path TEXT PRIMARY KEY,
  content TEXT,
  last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 세션 스왑을 위한 테이블 (Memory Watchdog 사용)
CREATE TABLE session_swaps (
  id TEXT PRIMARY KEY,
  payload BLOB, -- 압축된 PHP 상태
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
