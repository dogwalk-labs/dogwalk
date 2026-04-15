-- 확장 기능
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

--------------------------------------------------
-- USERS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT,
    password_hash TEXT,
    nickname TEXT,
    provider TEXT NOT NULL DEFAULT 'local',

    created_at TIMESTAMPTZ DEFAULT now()
);

-- 이메일 중복 방지 (local 계정만)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_local
ON users (email)
WHERE provider = 'local';

--------------------------------------------------
-- PATHS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS paths (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    minutes INT NOT NULL,
    distance_m INT NOT NULL,
    duration_sec INT NOT NULL,

    geom geometry(LineString, 4326),
    meta JSONB,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paths_user_id ON paths(user_id);

--------------------------------------------------
-- FEEDBACK
--------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    path_id UUID NOT NULL REFERENCES paths(id) ON DELETE CASCADE,

    value INT NOT NULL CHECK (value IN (1, -1)),
    tags JSONB,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ⭐ 핵심: 같은 유저가 같은 경로 중복 평가 방지
CREATE UNIQUE INDEX IF NOT EXISTS uq_feedback_user_path
ON feedback (user_id, path_id);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_path_id ON feedback(path_id);