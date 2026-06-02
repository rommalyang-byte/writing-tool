// 大纲-细纲-节拍 看板视图
// 细纲为列、节拍为卡片，支持拖拽移动节拍
import { useEffect, useState } from "react";
import { useOutlineStore } from "@/store/outlineStore";
import type { Section, Beat } from "@/types";

interface KanbanCol {
  section: Section;
  outlineTitle: string;
  beats: Beat[];
}

export function OutlineKanbanView() {
  const {
    outlines,
    sections,
    beats,
    projectId,
    loadSections,
    loadBeats,
    moveBeat,
    addBeat,
    deleteBeat,
  } = useOutlineStore();

  const [columns, setColumns] = useState<KanbanCol[]>([]);
  const [dragBeat, setDragBeat] = useState<Beat | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // 构建看板数据：所有细纲 → 列，节拍 → 卡片
  useEffect(() => {
    async function build() {
      if (!projectId || outlines.length === 0) {
        setColumns([]);
        return;
      }

      const cols: KanbanCol[] = [];

      for (const o of outlines) {
        let secs = sections.get(o.id);
        if (!secs) secs = await loadSections(o.id);

        for (const s of secs) {
          let bts = beats.get(s.id);
          if (!bts) bts = await loadBeats(s.id);

          cols.push({
            section: s,
            outlineTitle: o.title || "(未命名大纲)",
            beats: bts,
          });
        }
      }

      setColumns(cols);
    }
    build();
  }, [outlines, sections, beats, projectId, loadSections, loadBeats]);

  async function handleAddBeat(sectionId: string) {
    const title = prompt("输入节拍标题：");
    if (title) await addBeat(sectionId, title.trim());
  }

  async function handleDeleteBeat(beatId: string) {
    if (!confirm("确定删除此节拍？")) return;
    await deleteBeat(beatId);
  }

  // 节拍拖拽到目标列
  async function handleDropBeat(targetSectionId: string) {
    if (!dragBeat) return;
    if (dragBeat.section_id === targetSectionId) {
      // 同列：不需要动
      setDragBeat(null);
      setDragOverCol(null);
      return;
    }

    await moveBeat(dragBeat.id, targetSectionId);
    setDragBeat(null);
    setDragOverCol(null);
  }

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>📋 看板视图</h3>

      {columns.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-secondary)", padding: 20, textAlign: "center" }}>
            暂无数据。请先在树形视图中创建大纲和细纲。
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 16,
            minHeight: 400,
          }}
        >
          {columns.map((col) => (
            <KanbanColumn
              key={col.section.id}
              col={col}
              dragOverCol={dragOverCol}
              onDragOver={setDragOverCol}
              onDropBeat={handleDropBeat}
              onAddBeat={handleAddBeat}
              onDeleteBeat={handleDeleteBeat}
              onDragBeat={setDragBeat}
              dragBeat={dragBeat}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 看板列 */
function KanbanColumn({
  col,
  dragOverCol,
  onDragOver,
  onDropBeat,
  onAddBeat,
  onDeleteBeat,
  onDragBeat,
  dragBeat,
}: {
  col: KanbanCol;
  dragOverCol: string | null;
  onDragOver: (id: string | null) => void;
  onDropBeat: (sectionId: string) => void;
  onAddBeat: (sectionId: string) => void;
  onDeleteBeat: (beatId: string) => void;
  onDragBeat: (beat: Beat | null) => void;
  dragBeat: Beat | null;
}) {
  const isOver = dragOverCol === col.section.id;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(col.section.id); }}
      onDragLeave={() => onDragOver(null)}
      onDrop={(e) => { e.preventDefault(); onDropBeat(col.section.id); }}
      style={{
        minWidth: 220,
        maxWidth: 280,
        flex: "0 0 auto",
        background: isOver ? "rgba(233,69,96,0.1)" : "var(--bg-secondary)",
        border: isOver ? "2px dashed var(--accent)" : "1px solid var(--border)",
        borderRadius: 8,
        padding: 10,
        transition: "background 0.15s, border 0.15s",
      }}
    >
      {/* 列头 */}
      <div style={{ marginBottom: 8, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          {col.outlineTitle}
        </div>
        <div style={{ fontWeight: 600, color: "#7fc9e0", fontSize: 14, marginTop: 2 }}>
          {col.section.title || "(未命名细纲)"}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
          {col.beats.length} 个节拍
        </div>
      </div>

      {/* 节拍卡片 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {col.beats.map((beat) => (
          <BeatCard
            key={beat.id}
            beat={beat}
            onDragStart={() => onDragBeat(beat)}
            onDelete={() => onDeleteBeat(beat.id)}
            isDragging={dragBeat?.id === beat.id}
          />
        ))}

        {/* 添加节拍按钮 */}
        <button
          className="btn-secondary btn-small"
          onClick={() => onAddBeat(col.section.id)}
          style={{ marginTop: 4 }}
        >
          + 添加节拍
        </button>
      </div>
    </div>
  );
}

/** 节拍卡片 */
function BeatCard({
  beat,
  onDragStart,
  onDelete,
  isDragging,
}: {
  beat: Beat;
  onDragStart: () => void;
  onDelete: () => void;
  isDragging: boolean;
}) {
  const sourceMarkLabel = () => {
    if (beat.source_mark === "ai_suggestion") return "🤖";
    if (beat.source_mark === "accepted") return "✅";
    return null;
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        background: isDragging ? "rgba(233,69,96,0.3)" : "var(--bg-primary)",
        border: beat.obsolete_mark ? "1px solid var(--danger)" : "1px solid var(--border)",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ color: "#c0c0c0", flex: 1 }}>
          {sourceMarkLabel()} {beat.title || "(未命名)"}
        </span>
        <button
          className="btn-danger btn-small"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ padding: "1px 5px", fontSize: 10 }}
        >
          ✕
        </button>
      </div>

      {beat.content && (
        <div style={{ color: "var(--text-secondary)", fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
          {beat.content.slice(0, 80)}{beat.content.length > 80 ? "..." : ""}
        </div>
      )}

      {beat.obsolete_mark > 0 && (
        <div style={{ marginTop: 4 }}>
          <span className="mark-obsolete">⚠ 已过时</span>
        </div>
      )}

      {beat.real_date_start && (
        <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
          📅 {beat.real_date_start}
        </div>
      )}
    </div>
  );
}