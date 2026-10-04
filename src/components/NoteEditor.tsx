import { useEffect, useRef, useState } from "react";
import MarkdownIt from "markdown-it";
import { useNotes } from "../hooks/useNotes";
import { formatDateTime } from "../utils/formatDate";

const md = new MarkdownIt({ html: false, breaks: true, linkify: true });
const themeOptions = [
  {
    value: "default",
    label: "默认",
    swatch: "linear-gradient(135deg, #f6f7fb 0%, #dfe7ff 100%)",
    accent: "#4f46e5",
  },
  {
    value: "eye-care",
    label: "护眼",
    swatch: "linear-gradient(135deg, #eaf7df 0%, #d9f0c6 100%)",
    accent: "#3d7a43",
  },
  {
    value: "night",
    label: "夜间",
    swatch: "linear-gradient(135deg, #101827 0%, #1d4ed8 100%)",
    accent: "#93c5fd",
  },
] as const;
type ThemeMode = (typeof themeOptions)[number]["value"];

type NoteEditorProps = {
  state: ReturnType<typeof useNotes>["state"];
  actions: ReturnType<typeof useNotes>["actions"];
};

export function NoteEditor({ state, actions }: NoteEditorProps) {
  const { notes, selectedNotebookId, selectedNoteId } = state;
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "default";
    const savedTheme = window.localStorage.getItem("note-demo-theme");
    return themeOptions.some((option) => option.value === savedTheme)
      ? (savedTheme as ThemeMode)
      : "default";
  });
  const editorRef = useRef<HTMLDivElement>(null);

  const activeNote =
    selectedNotebookId && selectedNoteId
      ? notes.find(
          (n) => n.id === selectedNoteId && n.notebookId === selectedNotebookId,
        )
      : null;

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, [selectedNoteId]);

  useEffect(() => {
    setIsPreview(false);
    setIsFullscreen(false);
  }, [selectedNoteId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("note-demo-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === editorRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const target = editorRef.current;
    if (!target) return;

    if (isFullscreen) {
      try {
        await document.exitFullscreen();
      } finally {
        setIsFullscreen(false);
      }
      return;
    }

    try {
      await target.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      setIsFullscreen(false);
    }
  };

  if (!activeNote) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-gray-400">
        <p className="text-lg">选择或创建一篇笔记开始写作。</p>
        <p className="text-xs">你的笔记会保存在浏览器本地。</p>
      </div>
    );
  }

  const renderedMarkdown = md.render(activeNote.content || "");

  return (
    <div
      ref={editorRef}
      className={isFullscreen ? "fixed inset-0 z-50 flex flex-col" : "flex flex-1 flex-col min-h-0"}
      style={{
        background: "var(--editor-bg)",
        color: "var(--editor-text)",
      }}
    >
      <div
        className="flex h-[52px] items-center justify-between gap-3 border-b px-4 text-xs"
        style={{
          borderColor: "var(--panel-border)",
          color: "var(--muted-text)",
        }}
      >
        <span
          className="max-w-[40%] min-w-0 truncate font-medium"
          style={{ color: "var(--editor-text)" }}
          title={activeNote.title || "未命名笔记"}
        >
          {activeNote.title || "未命名笔记"}
        </span>
        <div className="flex min-w-[360px] items-center justify-end gap-2" style={{ flexShrink: 0 }}>
          <div
            className="flex items-center gap-1 rounded border px-1.5 py-1"
            style={{
              background: "var(--theme-panel-bg)",
              borderColor: "var(--theme-panel-border)",
            }}
          >
            {themeOptions.map((option) => {
              const selected = option.value === theme;
              const optionTextColor = option.value === "night" ? "#e5edf8" : "#1f2937";

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-label={`换肤: ${option.label}`}
                  onClick={() => setTheme(option.value)}
                  title={option.label}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-all"
                  style={{
                    background: option.swatch,
                    borderColor: selected ? option.accent : "transparent",
                    boxShadow: selected ? `0 0 0 2px ${option.accent}33` : "none",
                    color: optionTextColor,
                  }}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full border border-white/80"
                    style={{ background: option.accent }}
                    aria-hidden="true"
                  />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsPreview((p) => !p)}
            className="rounded border px-2 py-1 text-xs hover:opacity-90"
            style={{
              borderColor: "var(--panel-border)",
              color: "var(--editor-text)",
              background: "transparent",
            }}
          >
            {isPreview ? "编辑" : "预览"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded border px-2 py-1 text-xs hover:opacity-90"
            style={{
              borderColor: "var(--panel-border)",
              color: "var(--editor-text)",
              background: "transparent",
            }}
          >
            {isFullscreen ? "退出全屏" : "全屏"}
          </button>
          <span>{formatDateTime(activeNote.updatedAt)}</span>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-10 py-8">
          <input
            ref={titleRef}
            value={activeNote.title}
            onChange={(e) => actions.updateNote(activeNote.id, { title: e.target.value })}
            placeholder="标题"
            className="w-full border-0 bg-transparent text-4xl font-medium outline-none"
            style={{
              color: "var(--editor-text)",
              background: "transparent",
              caretColor: "var(--editor-text)",
            }}
          />

          {isPreview ? (
            <div
              className="markdown-preview mt-4 max-w-none flex-1 text-lg leading-relaxed"
              style={{ color: "var(--editor-text)" }}
              dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
            />
          ) : (
            <textarea
              value={activeNote.content}
              onChange={(e) =>
                actions.updateNote(activeNote.id, {
                  content: e.target.value,
                })
              }
              placeholder="写点什么..."
              className="mt-4 min-h-0 flex-1 resize-none border-0 bg-transparent text-lg leading-relaxed outline-none"
              style={{
                color: "var(--editor-text)",
                background: "transparent",
                caretColor: "var(--editor-text)",
              }}
            />
          )}
        </article>
      </div>
    </div>
  );
}
