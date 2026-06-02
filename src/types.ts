// 写作辅助工具 - 共享类型定义
// 与 SQLite schema 保持一致，对应 SPEC §1

/** 来源标记：AI建议 / 已采纳 / 手改 */
export type SourceMark = "ai_suggestion" | "accepted" | "manual";

/** 伏笔兑现状态 */
export type ForeshadowingStatus = "resolved" | "dangling";

/** 资料类型 */
export type ReferenceType = "setting" | "tech" | "history" | "real_event";

/** 资料来源 */
export type ReferenceSource = "manual" | "ai" | "f3_search";

/** 作品 */
export interface Project {
  id: string;
  title: string;
  synopsis: string;
  protagonist_id: string | null;
  created_at: string;
  updated_at: string;
}

/** 大纲（卷/篇级） */
export interface Outline {
  id: string;
  project_id: string;
  parent_id: string | null;
  sort_order: number;
  title: string;
  content: string;
  source_mark: SourceMark;
  created_at: string;
  updated_at: string;
}

/** 细纲（章/段落级） */
export interface Section {
  id: string;
  project_id: string;
  outline_id: string;
  parent_id: string | null;
  sort_order: number;
  title: string;
  content: string;
  foreshadowing_text: string;
  source_mark: SourceMark;
  created_at: string;
  updated_at: string;
}

/** 节拍（最小单元） */
export interface Beat {
  id: string;
  project_id: string;
  section_id: string;
  sort_order: number;
  title: string;
  content: string;
  real_date_start: string | null;
  real_date_end: string | null;
  foreshadowing_text: string;
  foreshadowing_target_id: string | null;
  foreshadowing_status: ForeshadowingStatus;
  obsolete_mark: number;
  source_mark: SourceMark;
  created_at: string;
  updated_at: string;
}

/** 人物 */
export interface Character {
  id: string;
  project_id: string;
  name: string;
  birth_date: string | null;
  age_override: number | null;
  strength: string;
  weakness: string;
  occupation: string;
  work_unit: string;
  position: string;
  home_address: string;
  daily_area: string;
  /** JSON 数组字符串 */
  hobbies: string;
  catchphrase: string;
  habits: string;
  /** JSON 数组字符串 */
  tags: string;
  appearance_idol: string;
  /** JSON 数组字符串 */
  appearance_features: string;
  motivation: string;
  biography: string;
  created_at: string;
  updated_at: string;
}

/** 人物关系 */
export interface Relationship {
  id: string;
  project_id: string;
  character_a_id: string;
  character_b_id: string;
  relation_type: string;
  conflict: string;
  change_point: string | null;
  created_at: string;
  updated_at: string;
}

/** 资料条目 */
export interface Reference {
  id: string;
  project_id: string;
  ref_type: ReferenceType;
  title: string;
  content: string;
  source: ReferenceSource;
  linked_object_type: string | null;
  linked_object_id: string | null;
  created_at: string;
  updated_at: string;
}

/** 树节点（用于 react-arborist） */
export interface TreeNodeData {
  id: string;
  name: string;
  type: "outline" | "section" | "beat";
  children?: TreeNodeData[];
  source_mark: SourceMark;
  sort_order: number;
  /** 被拖拽时引用原始数据 */
  outline?: Outline;
  section?: Section;
  beat?: Beat;
}