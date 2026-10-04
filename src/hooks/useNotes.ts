import { useCallback, useEffect, useState } from "react";
import type { Notebook, Note } from "../data/types";
import {
  clearExampleNoteDeleted,
  hasDeletedExampleNote,
  hasSeededExampleNote,
  loadNotebooks,
  loadNotes,
  markExampleNoteDeleted,
  markExampleNoteSeeded,
  saveNotebooks,
  saveNotes,
} from "../data/storage";

export interface NotebookState {
  notebooks: Notebook[];
  notes: Note[];
  selectedNotebookId: string | null;
  selectedNoteId: string | null;
}

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const sampleMarkdown = `# Markdown 示例

## 语法展示与写作示例

这是一个更完整的 Markdown 演示笔记，用来展示本应用支持的常见写作能力。

### 1. 列表与层级结构

- 一级列表项
- 继续展示列表内容
  - 嵌套列表项
  - 再嵌套一层
- 最后一个列表项

1. 第一步：整理思路
2. 第二步：编写内容
3. 第三步：检查排版

### 2. 任务列表

- [x] 支持标题和段落
- [x] 支持无序与有序列表
- [x] 支持代码块与表格
- [ ] 继续探索更多高级语法

### 3. 引用与强调

> 在 Markdown 中，引用块适合用来强调关键结论。

**加粗**、*斜体*、***强调组合*** 都可以直接使用。

### 4. 链接与图片

访问 [GitHub](https://github.com) 查看更多开源项目。

![示例图片](https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80)

### 5. 代码示例

\`\`\`ts
const message = "Hello, Markdown!";
console.log(message);

function greet(name: string) {
  return "Hi, " + name + "!";
}
\`\`\`

### 6. 表格示例

| 功能 | 支持 | 说明 |
| --- | --- | --- |
| 标题 | ✅ | H1 到 H6 |
| 列表 | ✅ | 无序和有序 |
| 代码块 | ✅ | fenced code |
| 表格 | ✅ | Markdown 表格 |
| 图片 | ✅ | 远程或本地图片 |

---

> 你可以在这里直接编辑，体验更完整的 Markdown 书写。`;

function createSampleNotebookAndNote(): { notebooks: Notebook[]; notes: Note[] } {
  const notebookId = uid("nb");
  const noteId = uid("note");
  const now = nowISO();

  return {
    notebooks: [{
      id: notebookId,
      title: "示例笔记本",
      createdAt: now,
      updatedAt: now,
    }],
    notes: [{
      id: noteId,
      notebookId,
      title: "Markdown 示例",
      content: sampleMarkdown,
      createdAt: now,
      updatedAt: now,
    }],
  };
}

export function useNotes() {
  const initialData = (() => {
    const storedNotebooks = loadNotebooks();
    const storedNotes = loadNotes();

    if (storedNotes.length > 0) {
      return {
        notebooks: storedNotebooks,
        notes: storedNotes,
      };
    }

    const exampleWasDeleted = hasDeletedExampleNote();
    const shouldSeedExample = !hasSeededExampleNote() && !exampleWasDeleted;

    if (shouldSeedExample) {
      const seeded = createSampleNotebookAndNote();
      clearExampleNoteDeleted();
      markExampleNoteSeeded();

      if (storedNotebooks.length > 0) {
        const firstNotebookId = storedNotebooks[0].id;
        return {
          notebooks: storedNotebooks,
          notes: [{
            ...seeded.notes[0],
            notebookId: firstNotebookId,
            title: "Markdown 示例",
          }],
        };
      }

      return seeded;
    }

    if (storedNotebooks.length > 0 && hasSeededExampleNote() && !exampleWasDeleted) {
      const sampleNotebook = storedNotebooks.find((nb) => nb.title === "示例笔记本");
      if (sampleNotebook) {
        const seededNote = createSampleNotebookAndNote().notes[0];
        return {
          notebooks: storedNotebooks,
          notes: [{ ...seededNote, notebookId: sampleNotebook.id }],
        };
      }
    }

    return { notebooks: storedNotebooks, notes: storedNotes };
  })();

  const [notebooks, setNotebooks] = useState<Notebook[]>(initialData.notebooks);
  const [notes, setNotes] = useState<Note[]>(initialData.notes);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Persist to localStorage whenever data changes.
  useEffect(() => {
    saveNotebooks(notebooks);
  }, [notebooks]);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    if (!selectedNotebookId && notebooks.length > 0) {
      setSelectedNotebookId(notebooks[0].id);
    }
  }, [notebooks, selectedNotebookId]);

  useEffect(() => {
    if (!notes.length) {
      setSelectedNoteId(null);
      return;
    }

    if (selectedNotebookId) {
      const currentNoteInNotebook = notes.find(
        (note) => note.id === selectedNoteId && note.notebookId === selectedNotebookId,
      );

      if (currentNoteInNotebook) {
        return;
      }

      const firstNoteInSelectedNotebook = notes.find(
        (note) => note.notebookId === selectedNotebookId,
      );

      if (firstNoteInSelectedNotebook) {
        setSelectedNoteId(firstNoteInSelectedNotebook.id);
        return;
      }

      setSelectedNoteId(null);
      return;
    }

    if (!selectedNoteId) {
      const firstNote = notes[0];
      if (firstNote) {
        setSelectedNoteId(firstNote.id);
        setSelectedNotebookId(firstNote.notebookId);
      }
    }
  }, [notes, selectedNotebookId, selectedNoteId]);

  const createNotebook = useCallback((title: string): Notebook => {
    const nb: Notebook = {
      id: uid("nb"),
      title,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    setNotebooks((prev) => [nb, ...prev]);
    setSelectedNotebookId(nb.id);
    setSelectedNoteId(null);
    return nb;
  }, []);

  const updateNotebook = useCallback(
    (id: string, title: string) => {
      setNotebooks((prev) =>
        prev.map((nb) =>
          nb.id === id ? { ...nb, title, updatedAt: nowISO() } : nb,
        ),
      );
    },
    [],
  );

  const deleteNotebook = useCallback((id: string) => {
    setNotebooks((prev) => prev.filter((nb) => nb.id !== id));
    setNotes((prev) => prev.filter((n) => n.notebookId !== id));
    setSelectedNotebookId((prev) => (prev === id ? null : prev));
    setSelectedNoteId(null);
  }, []);

  const createNote = useCallback((): Note | null => {
    let notebookId = selectedNotebookId;

    if (!notebookId) {
      const defaultNotebook = createNotebook("未命名笔记本");
      notebookId = defaultNotebook.id;
    }

    const note: Note = {
      id: uid("note"),
      notebookId,
      title: "",
      content: "",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    setNotes((prev) => [note, ...prev]);
    setSelectedNoteId(note.id);
    return note;
  }, [createNotebook, selectedNotebookId]);

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, "title" | "content">>) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, ...patch, updatedAt: nowISO() }
            : n,
        ),
      );
    },
    [],
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const noteToDelete = prev.find((n) => n.id === id);
      if (
        noteToDelete &&
        noteToDelete.title === "Markdown 示例" &&
        noteToDelete.content.includes("# Markdown 示例")
      ) {
        markExampleNoteDeleted();
      }

      return prev.filter((n) => n.id !== id);
    });
    setSelectedNoteId(null);
  }, []);

  const selectNotebook = useCallback((id: string | null) => {
    if (!id) {
      setSelectedNotebookId(null);
      setSelectedNoteId(null);
      return;
    }

    const nextNote = notes.find((note) => note.notebookId === id);
    setSelectedNotebookId(id);
    setSelectedNoteId(nextNote?.id ?? null);
  }, [notes]);

  const selectNote = useCallback((id: string) => {
    setSelectedNoteId(id);
  }, []);

  const reorderNotebook = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;

    setNotebooks((prev) => {
      const oldIndex = prev.findIndex((nb) => nb.id === activeId);
      const newIndex = prev.findIndex((nb) => nb.id === overId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return prev;
      }

      return prev.map((nb) => ({ ...nb, updatedAt: nowISO() }));
    });

    setNotebooks((prev) => {
      const oldIndex = prev.findIndex((nb) => nb.id === activeId);
      const newIndex = prev.findIndex((nb) => nb.id === overId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return prev;
      }

      const reordered = [...prev];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      return reordered;
    });
  }, []);

  const reorderNote = useCallback(
    (activeId: string, overId: string, notebookId: string) => {
      if (activeId === overId) return;

      setNotes((prev) => {
        const notebookNotes = prev.filter((note) => note.notebookId === notebookId);
        const oldIndex = notebookNotes.findIndex((note) => note.id === activeId);
        const newIndex = notebookNotes.findIndex((note) => note.id === overId);

        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
          return prev;
        }

        const reorderedNotebookNotes = [...notebookNotes];
        const [moved] = reorderedNotebookNotes.splice(oldIndex, 1);
        reorderedNotebookNotes.splice(newIndex, 0, moved);

        const otherNotes = prev.filter((note) => note.notebookId !== notebookId);
        return [...otherNotes, ...reorderedNotebookNotes].map((note) => ({
          ...note,
          updatedAt: nowISO(),
        }));
      });
    },
    [],
  );

  return {
    state: {
      notebooks,
      notes,
      selectedNotebookId,
      selectedNoteId,
    },
    actions: {
      createNotebook,
      updateNotebook,
      deleteNotebook,
      createNote,
      updateNote,
      deleteNote,
      selectNotebook,
      selectNote,
      reorderNotebook,
      reorderNote,
    },
  };
}
