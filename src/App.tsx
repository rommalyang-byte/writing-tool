// 写作助手 - 主应用入口
import { useState, useEffect } from "react";
import type { Project } from "@/types";
import * as db from "@/lib/db";
import { useOutlineStore } from "@/store/outlineStore";
import { OutlineTreeView } from "@/features/outline/OutlineTreeView";
import { OutlineKanbanView } from "@/features/outline/OutlineKanbanView";

type View = "outline-tree" | "outline-kanban";

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>("outline-tree");
  const [navTab, setNavTab] = useState<"outline" | "characters" | "references" | "settings">("outline");
  const [newTitle, setNewTitle] = useState("");

  const setProject = useOutlineStore((s) => s.setProject);
  const projectId = useOutlineStore((s) => s.projectId);

  // 初始化：尝试加载已有项目
  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const db_ = await db.getDb();
      const rows = await db_.select<Project[]>("SELECT * FROM project ORDER BY created_at DESC");
      setProjects(rows);
      if (rows.length > 0) {
        setCurrentProjectId(rows[0].id);
      }
    } catch {
      // 数据库暂未就绪，无项目
    }
  }

  async function handleCreateProject() {
    if (!newTitle.trim()) return;
    const id = await db.createProject(newTitle.trim(), "");
    setNewTitle("");
    setCurrentProjectId(id);
    await loadProjects();
  }

  async function handleOpenProject(id: string) {
    setCurrentProjectId(id);
    await setProject(id);
  }

  // 加载选中项目的数据
  useEffect(() => {
    if (currentProjectId && currentProjectId !== projectId) {
      setProject(currentProjectId);
    }
  }, [currentProjectId, projectId, setProject]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 左侧导航 */}
      <nav style={{
        width: 200,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
        gap: 4,
      }}>
        <div style={{ padding: "0 16px", marginBottom: 12 }}>
          <h2 style={{ color: "var(--accent)", fontSize: 18 }}>📝 写作助手</h2>
        </div>

        {/* 项目选择 */}
        <div style={{ padding: "0 16px", marginBottom: 8 }}>
          <select
            value={currentProjectId ?? ""}
            onChange={(e) => handleOpenProject(e.target.value)}
            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            <option value="">选择作品</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* 新建项目 */}
        <div style={{ padding: "0 16px", marginBottom: 16, display: "flex", gap: 4 }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="新建作品..."
            onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            style={{ flex: 1 }}
          />
          <button className="btn-primary btn-small" onClick={handleCreateProject}>+</button>
        </div>

        {/* 导航标签 */}
        <NavItem active={navTab === "outline"} onClick={() => setNavTab("outline")} icon="📋" label="大纲-细纲-节拍" />
        <NavItem active={navTab === "characters"} onClick={() => setNavTab("characters")} icon="👤" label="人物表" />
        <NavItem active={navTab === "references"} onClick={() => setNavTab("references")} icon="📚" label="资料库" />
        <NavItem active={navTab === "settings"} onClick={() => setNavTab("settings")} icon="⚙️" label="设置" />
      </nav>

      {/* 右侧内容区 */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* 顶部工具栏 */}
        <Toolbar currentView={currentView} onViewChange={setCurrentView} />

        {/* 内容区 */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {!projectId ? (
            <div className="card" style={{ textAlign: "center", padding: 60, margin: "40px auto", maxWidth: 400 }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
                👈 请先选择一个作品，或创建新作品
              </p>
            </div>
          ) : navTab === "outline" ? (
            currentView === "outline-tree" ? <OutlineTreeView /> : <OutlineKanbanView />
          ) : navTab === "characters" ? (
            <div className="card">
              <h3>👤 人物表</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>
                此功能将在后续版本中实现。当前 MVP 阶段先搭建大纲-细纲-节拍核心流程。
              </p>
            </div>
          ) : navTab === "references" ? (
            <div className="card">
              <h3>📚 资料库</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>
                此功能将在后续版本中实现。
              </p>
            </div>
          ) : (
            <div className="card">
              <h3>⚙️ 设置</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>
                模型配置与 API Key 管理
              </p>
              <SettingsPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/** 导航项组件 */
function NavItem({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        border: "none",
        borderRadius: 0,
        background: active ? "var(--bg-card)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        cursor: "pointer",
        textAlign: "left",
        fontSize: 14,
        transition: "all 0.15s",
        borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

/** 顶部工具栏 */
function Toolbar({ currentView, onViewChange }: {
  currentView: View;
  onViewChange: (v: View) => void;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 16px",
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ color: "var(--text-secondary)", fontSize: 12, marginRight: 8 }}>视图:</span>
      <button
        className={currentView === "outline-tree" ? "btn-primary btn-small" : "btn-secondary btn-small"}
        onClick={() => onViewChange("outline-tree")}
      >
        🌳 树形
      </button>
      <button
        className={currentView === "outline-kanban" ? "btn-primary btn-small" : "btn-secondary btn-small"}
        onClick={() => onViewChange("outline-kanban")}
      >
        📋 看板
      </button>
    </div>
  );
}

/** 设置面板（ModelProvider 配置） */
function SettingsPanel() {
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  // 应用启动时从本地 store 读取已保存的配置
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { Store } = await import("@tauri-apps/plugin-store");
      const store = await Store.load("settings.json");
      const savedBaseUrl = await store.get<string>("baseUrl");
      const savedModel = await store.get<string>("model");
      const savedApiKey = await store.get<string>("apiKey");
      if (savedBaseUrl) setBaseUrl(savedBaseUrl);
      if (savedModel) setModel(savedModel);
      if (savedApiKey) setApiKey(savedApiKey);
    } catch {
      // store 文件不存在或读取失败，使用默认值
    }
  }

  async function handleSave() {
    try {
      const { Store } = await import("@tauri-apps/plugin-store");
      const store = await Store.load("settings.json");
      await store.set("baseUrl", baseUrl);
      await store.set("model", model);
      await store.set("apiKey", apiKey);
      await store.save();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("保存配置失败:", e);
      alert("保存配置失败，请重试");
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ marginBottom: 8 }}>OpenAI 兼容 API</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            style={{ width: "100%", marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ width: "100%", marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>API Key（本地加密存储）</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{ width: "100%", marginTop: 4 }}
          />
        </div>
        <div>
          <button className="btn-primary" onClick={handleSave}>
            {saved ? "✅ 已保存" : "保存配置"}
          </button>
          <span style={{ marginLeft: 12, fontSize: 12, color: "var(--text-secondary)" }}>
            ⚠ Key 仅存本地，不上传
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;