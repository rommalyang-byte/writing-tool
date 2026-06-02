// 大纲-细纲-节拍 树形视图
// 手写递归展开树 + 同级拖拽排序
import { useEffect, useState } from "react";
import { useOutlineStore } from "@/store/outlineStore";
import type { Outline, Section, Beat } from "@/types";

interface TreeNode {
  type: "outline" | "section" | "beat";
  id: string;
  name: string;
  source_mark: string;
  children: TreeNode[];
  outline?: Outline;
  section?: Section;
  beat?: Beat;
}

export function OutlineTreeView() {
  const {
    outlines,
    sections,
    beats,
    projectId,
    addOutline,
    addSection,
    addBeat,
    deleteOutline,
    deleteSection,
    deleteBeat,
    moveSection,
    moveBeat,
    loadSections,
    loadBeats,
    reorderOutlines,
    reorderSections,
    reorderBeats,
  } = useOutlineStore();

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [dragItem, setDragItem] = useState<{ id: string; type: string; parentId: string | null; index: number } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // 构建树数据
  useEffect(() => {
    async function build() {
      if (!projectId || outlines.length === 0) {
        setTree([]);
        return;
      }

      const nodes: TreeNode[] = [];
      for (const o of outlines) {
        let secs = sections.get(o.id);
        if (!secs) secs = await loadSections(o.id);

        const secNodes: TreeNode[] = [];
        for (const s of secs) {
          let bts = beats.get(s.id);
          if (!bts) bts = await loadBeats(s.id);

          secNodes.push({
            type: "section",
            id: s.id,
            name: s.title || "(未命名细纲)",
            source_mark: s.source_mark,
            children: bts.map((b: Beat) => ({
              type: "beat" as const,
              id: b.id,
              name: b.title || "(未命名节拍)",
              source_mark: b.source_mark,
              children: [],
              beat: b,
            })),
            section: s,
          });
        }

        nodes.push({
          type: "outline",
          id: o.id,
          name: o.title || "(未命名大纲)",
          source_mark: o.source_mark,
          children: secNodes,
          outline: o,
        });
      }

      setTree(nodes);
    }
    build();
  }, [outlines, sections, beats, projectId, loadSections, loadBeats]);

  async function handleAddOutline() {
    const title = prompt("输入大纲标题：");
    if (title) await addOutline(title.trim());
  }

  async function handleAddChild(parentId: string, type: "section" | "beat") {
    const title = prompt(type === "section" ? "输入细纲标题：" : "输入节拍标题：");
    if (!title) return;
    if (type === "section") await addSection(parentId, title.trim());
    else await addBeat(parentId, title.trim());
  }

  async function handleDelete(node: TreeNode) {
    const labels = { outline: "大纲", section: "细纲", beat: "节拍" };
    if (!confirm(`删除${labels[node.type]}「${node.name}」？子节点将级联删除。`)) return;
    if (node.type === "outline") await deleteOutline(node.id);
    else if (node.type === "section") await deleteSection(node.id);
    else await deleteBeat(node.id);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 拖拽开始
  function handleDragStart(nodeId: string, nodeType: string, parentId: string | null, index: number) {
    setDragItem({ id: nodeId, type: nodeType, parentId, index });
  }

  // 拖拽放置（同级排序）
  async function handleDrop(targetId: string, targetType: string, targetParentId: string | null, _targetIndex: number) {
    if (!dragItem || dragItem.id === targetId) return;
    if (dragItem.type !== targetType) return; // 只能同类型互换
    if (dragItem.parentId !== targetParentId) {
      // 跨级移动
      if (dragItem.type === "section" && targetParentId) {
        await moveSection(dragItem.id, targetParentId);
      } else if (dragItem.type === "beat" && targetParentId) {
        await moveBeat(dragItem.id, targetParentId);
      }
      setDragItem(null);
      return;
    }

    // 同级排序：计算新的 sort_order
    const allNodeIds = getSiblingIds(tree, dragItem.parentId, dragItem.type);
    const draggedIdx = allNodeIds.indexOf(dragItem.id);
    const targetIdx = allNodeIds.indexOf(targetId);
    if (draggedIdx === -1 || targetIdx === -1) { setDragItem(null); return; }

    const reordered = [...allNodeIds];
    reordered.splice(draggedIdx, 1);
    const insertAt = draggedIdx < targetIdx ? targetIdx : targetIdx;
    reordered.splice(insertAt, 0, dragItem.id);

    const items = reordered.map((id, i) => ({ id, sort_order: i }));
    if (dragItem.type === "outline") await reorderOutlines(items);
    else if (dragItem.type === "section") await reorderSections(items);
    else await reorderBeats(items);

    setDragItem(null);
  }

  function getSiblingIds(nodes: TreeNode[], parentId: string | null, type: string): string[] {
    if (!parentId) return nodes.filter((n) => n.type === type).map((n) => n.id);
    const parent = findNodeById(nodes, parentId);
    if (!parent) return [];
    return parent.children.filter((n) => n.type === type).map((n) => n.id);
  }

  function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
    for (const n of nodes) {
      if (n.id === id) return n;
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
    return null;
  }

  const sourceMarkLabel = (mark: string) => {
    if (mark === "ai_suggestion") return <span className="mark-ai">[AI建议]</span>;
    if (mark === "accepted") return <span className="mark-accepted">[已采纳]</span>;
    return null;
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3>🌳 大纲-细纲-节拍</h3>
        <button className="btn-primary btn-small" onClick={handleAddOutline}>+ 新增大纲</button>
      </div>

      {tree.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", padding: 20, textAlign: "center" }}>
          暂无大纲，点击「+ 新增大纲」开始。
        </p>
      ) : (
        <div style={{ paddingLeft: 4 }}>
          {tree.map((node, idx) => (
            <TreeNodeRender
              key={node.id}
              node={node}
              depth={0}
              parentId={null}
              index={idx}
              expanded={expanded}
              dragItem={dragItem}
              dragOver={dragOver}
              onToggle={toggleExpand}
              onAddChild={handleAddChild}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={setDragOver}
              onDrop={handleDrop}
              sourceMarkLabel={sourceMarkLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 递归树节点组件
function TreeNodeRender({
  node,
  depth,
  parentId,
  index,
  expanded,
  dragItem,
  dragOver,
  onToggle,
  onAddChild,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  sourceMarkLabel,
}: {
  node: TreeNode;
  depth: number;
  parentId: string | null;
  index: number;
  expanded: Set<string>;
  dragItem: { id: string; type: string } | null;
  dragOver: string | null;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string, type: "section" | "beat") => void;
  onDelete: (node: TreeNode) => void;
  onDragStart: (id: string, type: string, parentId: string | null, idx: number) => void;
  onDragOver: (id: string | null) => void;
  onDrop: (id: string, type: string, parentId: string | null, idx: number) => void;
  sourceMarkLabel: (mark: string) => React.ReactNode;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const isDragging = dragItem?.id === node.id;
  const isOver = dragOver === node.id;

  const colors = {
    outline: "#e0c97f",
    section: "#7fc9e0",
    beat: "#c0c0c0",
  };

  return (
    <div style={{ userSelect: "none" }}>
      <div
        draggable
        onDragStart={() => onDragStart(node.id, node.type, parentId, index)}
        onDragOver={(e) => { e.preventDefault(); onDragOver(node.id); }}
        onDragLeave={() => onDragOver(null)}
        onDrop={(e) => { e.preventDefault(); onDrop(node.id, node.type, parentId, index); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          marginLeft: depth * 20,
          borderRadius: 4,
          background: isOver ? "var(--bg-card)" : isDragging ? "rgba(233,69,96,0.2)" : "transparent",
          border: isOver ? "1px dashed var(--accent)" : "1px solid transparent",
          opacity: isDragging ? 0.5 : 1,
          cursor: "grab",
          transition: "background 0.15s",
        }}
      >
        {/* 展开/折叠按钮 */}
        <span
          onClick={(e) => { e.stopPropagation(); if (hasChildren || node.type !== "beat") onToggle(node.id); }}
          style={{ cursor: "pointer", width: 16, textAlign: "center", fontSize: 12, flexShrink: 0 }}
        >
          {node.type === "beat" ? "·" : isExpanded ? "▼" : "▶"}
        </span>

        {/* 类型图标 */}
        <span style={{ fontSize: 14 }}>
          {node.type === "outline" ? "📁" : node.type === "section" ? "📄" : "📌"}
        </span>

        {/* 名称 */}
        <span style={{ color: colors[node.type], fontWeight: node.type === "outline" ? 600 : 400, flex: 1 }}>
          {node.name}
        </span>

        {/* 来源标记 */}
        {sourceMarkLabel(node.source_mark)}

        {/* 操作按钮组 */}
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {node.type !== "beat" && (
            <button
              className="btn-secondary btn-small"
              onClick={(e) => { e.stopPropagation(); onAddChild(node.id, node.type === "outline" ? "section" : "beat"); }}
              title={node.type === "outline" ? "添加细纲" : "添加节拍"}
            >
              +子
            </button>
          )}
          <button
            className="btn-danger btn-small"
            onClick={(e) => { e.stopPropagation(); onDelete(node); }}
            title="删除"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 递归渲染子节点 */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNodeRender
              key={child.id}
              node={child}
              depth={depth + 1}
              parentId={node.id}
              index={idx}
              expanded={expanded}
              dragItem={dragItem}
              dragOver={dragOver}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              sourceMarkLabel={sourceMarkLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}