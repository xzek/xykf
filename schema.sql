-- 客户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tg_topic_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    sender TEXT, 
    content TEXT,
    is_read INTEGER DEFAULT 0, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表（存储后台账号密码）
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 初始化默认管理员账号密码 (admin / 123456)
INSERT OR IGNORE INTO config (key, value) VALUES ('admin_username', 'admin');
INSERT OR IGNORE INTO config (key, value) VALUES ('admin_password', '123456');
