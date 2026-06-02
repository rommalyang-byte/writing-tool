// 数据库工具层 - 封装 Tauri SQL 插件调用
import Database from "@tauri-apps/plugin-sql";
import type {
  Outline,
  Section,
  Beat,
} from "@/types";

let dbInstance: Database | null = null;

/** 获取数据库单例 */
export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:writing-tool.db");
  }
  return dbInstance;
}

// ===================== 作品 Project =====================

export async function createProject(
  title: string,
  synopsis: string,
  protagId: string | null = null,
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO project (id, title, synopsis, protagonist_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, title, synopsis, protagId, now, now],
  );
  return id;
}

// ===================== 大纲 Outline =====================

export async function createOutline(
  projectId: string,
  title: string,
  content: string = "",
  parentId: string | null = null,
  sortOrder: number = 0,
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO outline (id, project_id, parent_id, sort_order, title, content, source_mark, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'manual', $7, $8)`,
    [id, projectId, parentId, sortOrder, title, content, now, now],
  );
  return id;
}

export async function getOutlinesByProject(projectId: string): Promise<Outline[]> {
  const db = await getDb();
  return db.select<Outline[]>(
    "SELECT * FROM outline WHERE project_id = $1 ORDER BY sort_order",
    [projectId],
  );
}

export async function updateOutline(
  id: string,
  updates: Partial<Pick<Outline, "title" | "content" | "sort_order" | "parent_id" | "source_mark">>,
): Promise<void> {
  const db = await getDb();
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${camelToSnake(key)} = $${idx}`);
    params.push(value);
    idx++;
  }
  params.push(new Date().toISOString());
  params.push(id);
  await db.execute(
    `UPDATE outline SET ${setClauses.join(", ")}, updated_at = $${idx++} WHERE id = $${idx}`,
    params,
  );
}

export async function deleteOutline(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM outline WHERE id = $1", [id]);
}

// ===================== 细纲 Section =====================

export async function getSectionsByOutline(outlineId: string): Promise<Section[]> {
  const db = await getDb();
  return db.select<Section[]>(
    "SELECT * FROM section WHERE outline_id = $1 ORDER BY sort_order",
    [outlineId],
  );
}

export async function createSection(
  projectId: string,
  outlineId: string,
  title: string,
  content: string = "",
  parentId: string | null = null,
  sortOrder: number = 0,
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO section (id, project_id, outline_id, parent_id, sort_order, title, content, foreshadowing_text, source_mark, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, '', 'manual', $8, $9)`,
    [id, projectId, outlineId, parentId, sortOrder, title, content, now, now],
  );
  return id;
}

export async function updateSection(
  id: string,
  updates: Partial<Pick<Section, "title" | "content" | "sort_order" | "parent_id" | "outline_id" | "source_mark">>,
): Promise<void> {
  const db = await getDb();
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${camelToSnake(key)} = $${idx}`);
    params.push(value);
    idx++;
  }
  params.push(new Date().toISOString());
  params.push(id);
  await db.execute(
    `UPDATE section SET ${setClauses.join(", ")}, updated_at = $${idx++} WHERE id = $${idx}`,
    params,
  );
}

export async function deleteSection(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM section WHERE id = $1", [id]);
}

// ===================== 节拍 Beat =====================

export async function getBeatsBySection(sectionId: string): Promise<Beat[]> {
  const db = await getDb();
  return db.select<Beat[]>(
    "SELECT * FROM beat WHERE section_id = $1 ORDER BY sort_order",
    [sectionId],
  );
}

export async function createBeat(
  projectId: string,
  sectionId: string,
  title: string,
  content: string = "",
  sortOrder: number = 0,
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO beat (id, project_id, section_id, sort_order, title, content, source_mark, foreshadowing_text, foreshadowing_status, obsolete_mark, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'manual', '', 'dangling', 0, $7, $8)`,
    [id, projectId, sectionId, sortOrder, title, content, now, now],
  );
  return id;
}

export async function updateBeat(
  id: string,
  updates: Partial<Pick<Beat, "title" | "content" | "sort_order" | "section_id" | "source_mark" | "obsolete_mark">>,
): Promise<void> {
  const db = await getDb();
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${camelToSnake(key)} = $${idx}`);
    params.push(value);
    idx++;
  }
  params.push(new Date().toISOString());
  params.push(id);
  await db.execute(
    `UPDATE beat SET ${setClauses.join(", ")}, updated_at = $${idx++} WHERE id = $${idx}`,
    params,
  );
}

export async function deleteBeat(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM beat WHERE id = $1", [id]);
}

// ===================== 批量更新排序 =====================

export async function batchUpdateSortOrder(
  table: "outline" | "section" | "beat",
  items: { id: string; sort_order: number }[],
): Promise<void> {
  const db = await getDb();
  for (const item of items) {
    await db.execute(
      `UPDATE ${table} SET sort_order = $1, updated_at = $2 WHERE id = $3`,
      [item.sort_order, new Date().toISOString(), item.id],
    );
  }
}

// ===================== 工具 =====================

/** camelCase 转 snake_case（简单版） */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** 关闭数据库连接 */
export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}