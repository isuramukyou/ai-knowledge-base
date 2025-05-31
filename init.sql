-- Create database schema for AI Knowledge Base

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    full_description TEXT,
    cover_url TEXT,
    website_url TEXT,
    pricing TEXT,
    category_id INTEGER REFERENCES categories(id),
    author_id INTEGER REFERENCES users(id),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('russian', coalesce(full_description, '')), 'C')
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge items table
CREATE TABLE IF NOT EXISTS knowledge_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'link', 'video')),
    url TEXT,
    cover_url TEXT,
    category_id INTEGER REFERENCES categories(id),
    author_id INTEGER REFERENCES users(id),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('russian', coalesce(content, '')), 'C')
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Currencies table
CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(8) NOT NULL,
    name VARCHAR(32) NOT NULL,
    code VARCHAR(8) NOT NULL
);

-- Insert default categories only if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Языковые модели') THEN
    INSERT INTO categories (name, color) VALUES
      ('Языковые модели', '#3b82f6'),
      ('Генерация изображений', '#10b981'),
      ('Дизайн', '#f59e0b'),
      ('Программирование', '#8b5cf6'),
      ('Обучение', '#ef4444'),
      ('Аналитика', '#06b6d4');
  END IF;
END $$;

-- Insert currencies only if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'RUB') THEN
    INSERT INTO currencies (symbol, name, code) VALUES
      ('₽', 'Российский рубль', 'RUB');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'USD') THEN
    INSERT INTO currencies (symbol, name, code) VALUES
      ('$', 'Доллар США', 'USD');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'EUR') THEN
    INSERT INTO currencies (symbol, name, code) VALUES
      ('€', 'Евро', 'EUR');
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_category ON ai_models(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_author ON ai_models(author_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_created_at ON ai_models(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category ON knowledge_items(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_author ON knowledge_items(author_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_type ON knowledge_items(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_created_at ON knowledge_items(created_at DESC);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_ai_models_search ON ai_models USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_search ON knowledge_items USING GIN (search_vector);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_models_updated_at ON ai_models;
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_items_updated_at ON knowledge_items;
CREATE TRIGGER update_knowledge_items_updated_at BEFORE UPDATE ON knowledge_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing (optional)
-- This will only run if the tables are empty
DO $$
BEGIN
    -- Check if we have any users (excluding potential admin)
    IF NOT EXISTS (SELECT 1 FROM users WHERE is_admin = false) THEN
        -- Insert sample categories if they don't exist
        INSERT INTO categories (name, color) VALUES
        ('Тестовая категория', '#ff6b6b')
        ON CONFLICT DO NOTHING;
        
        -- Note: Sample users and content will be created when users first interact with the app
    END IF;
END $$;
