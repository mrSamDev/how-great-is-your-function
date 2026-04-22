CREATE TABLE IF NOT EXISTS functions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'typescript',
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 0,
  breakdown TEXT NOT NULL DEFAULT '{}',
  ai_feedback TEXT NOT NULL DEFAULT '{}',
  author_id TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  function_id TEXT NOT NULL REFERENCES functions(id),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  parent_function_id TEXT NOT NULL REFERENCES functions(id),
  author_id TEXT,
  author_name TEXT,
  improved_code TEXT NOT NULL,
  title TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  breakdown TEXT NOT NULL DEFAULT '{}',
  ai_feedback TEXT NOT NULL DEFAULT '{}',
  score_delta INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  function_id TEXT NOT NULL REFERENCES functions(id),
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TEXT NOT NULL,
  UNIQUE(function_id, user_id)
);
