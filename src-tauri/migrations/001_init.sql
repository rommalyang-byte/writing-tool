-- 写作辅助工具 - 数据库初始化 v1
-- 对应 SPEC §1 数据模型

-- 1. 作品表
CREATE TABLE IF NOT EXISTS project (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '未命名作品',
  synopsis TEXT NOT NULL DEFAULT '',
  protagonist_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. 大纲表（卷/篇级）
CREATE TABLE IF NOT EXISTS outline (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES outline(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  source_mark TEXT NOT NULL DEFAULT 'manual' CHECK (source_mark IN ('ai_suggestion', 'accepted', 'manual')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. 细纲表（章/段落级）
CREATE TABLE IF NOT EXISTS section (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  outline_id TEXT NOT NULL REFERENCES outline(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES section(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  foreshadowing_text TEXT NOT NULL DEFAULT '',
  source_mark TEXT NOT NULL DEFAULT 'manual' CHECK (source_mark IN ('ai_suggestion', 'accepted', 'manual')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. 节拍表（最小单元）
CREATE TABLE IF NOT EXISTS beat (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES section(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  real_date_start TEXT,
  real_date_end TEXT,
  foreshadowing_text TEXT NOT NULL DEFAULT '',
  foreshadowing_target_id TEXT REFERENCES beat(id) ON DELETE SET NULL,
  foreshadowing_status TEXT NOT NULL DEFAULT 'dangling' CHECK (foreshadowing_status IN ('resolved', 'dangling')),
  obsolete_mark INTEGER NOT NULL DEFAULT 0,
  source_mark TEXT NOT NULL DEFAULT 'manual' CHECK (source_mark IN ('ai_suggestion', 'accepted', 'manual')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. 人物表
CREATE TABLE IF NOT EXISTS character (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  birth_date TEXT,
  age_override INTEGER,
  strength TEXT NOT NULL DEFAULT '',
  weakness TEXT NOT NULL DEFAULT '',
  occupation TEXT NOT NULL DEFAULT '',
  work_unit TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  home_address TEXT NOT NULL DEFAULT '',
  daily_area TEXT NOT NULL DEFAULT '',
  hobbies TEXT NOT NULL DEFAULT '[]',
  catchphrase TEXT NOT NULL DEFAULT '',
  habits TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  appearance_idol TEXT NOT NULL DEFAULT '',
  appearance_features TEXT NOT NULL DEFAULT '[]',
  motivation TEXT NOT NULL DEFAULT '',
  biography TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. 人物关系表（以主角为中心的边）
CREATE TABLE IF NOT EXISTS relationship (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  character_a_id TEXT NOT NULL REFERENCES character(id) ON DELETE CASCADE,
  character_b_id TEXT NOT NULL REFERENCES character(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT '',
  conflict TEXT NOT NULL DEFAULT '',
  change_point TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. 资料条目表
CREATE TABLE IF NOT EXISTS reference (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  ref_type TEXT NOT NULL DEFAULT 'setting' CHECK (ref_type IN ('setting', 'tech', 'history', 'real_event')),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'f3_search')),
  linked_object_type TEXT,
  linked_object_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 索引：加速常用查询
CREATE INDEX IF NOT EXISTS idx_outline_project ON outline(project_id);
CREATE INDEX IF NOT EXISTS idx_outline_parent ON outline(parent_id);
CREATE INDEX IF NOT EXISTS idx_section_outline ON section(outline_id);
CREATE INDEX IF NOT EXISTS idx_section_parent ON section(parent_id);
CREATE INDEX IF NOT EXISTS idx_beat_section ON beat(section_id);
CREATE INDEX IF NOT EXISTS idx_character_project ON character(project_id);
CREATE INDEX IF NOT EXISTS idx_relationship_project ON relationship(project_id);
CREATE INDEX IF NOT EXISTS idx_reference_project ON reference(project_id);
CREATE INDEX IF NOT EXISTS idx_beat_foreshadowing ON beat(foreshadowing_target_id);