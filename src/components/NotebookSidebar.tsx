import { useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNotes } from "../hooks/useNotes";

type NotebookSidebarProps = {
  state: ReturnType<typeof useNotes>["state"];
  actions: ReturnType<typeof useNotes>["actions"];
};

function SortableNotebookItem({
  notebook,
  isSelected,
  isRenaming,
  renameDraft,
  onSelect,
  onRenameStart,
  onRenameInput,
  onRenameCommit,
  onDelete,
}: {
  notebook: ReturnType<typeof useNotes>["state"]["notebooks"][number];
  isSelected: boolean;
  isRenaming: boolean;
  renameDraft: string;
  onSelect: () => void;
  onRenameStart: () => void;
  onRenameInput: (value: string) => void;
  onRenameCommit: () => void;
  onDelete: (event: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: notebook.id,
  });

  return (
    <li
      ref={setNodeRef}
      onClick={onSelect}
      className="group rounded-md"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : 1,
      }}
    >
      <div
        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
        style={{
          background: isSelected ? "var(--note-active)" : "transparent",
          color: isSelected ? "var(--note-text)" : "var(--sidebar-text)",
        }}
      >
        <button
          type="button"
          aria-label={`拖拽笔记本 ${notebook.title}`}
          className="cursor-grab rounded px-1 text-xs active:cursor-grabbing"
          style={{ color: "var(--muted-text)" }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          {...attributes}
          {...listeners}
        >
          ☰
        </button>
        <span aria-hidden style={{ color: "var(--muted-text)" }}>📁</span>
        {isRenaming ? (
          <input
            autoFocus
            value={renameDraft}
            onChange={(e) => onRenameInput(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onRenameCommit();
              }
              if (e.key === "Escape") {
                onRenameInput("");
              }
            }}
            onBlur={onRenameCommit}
            className="flex-1 rounded border px-1 py-0.5 text-sm outline-none"
            style={{
              background: "var(--panel-bg)",
              borderColor: "var(--panel-border)",
              color: "var(--app-text)",
            }}
          />
        ) : (
          <span className="flex-1 truncate" title={notebook.title}>
            {notebook.title}
          </span>
        )}
        {!isRenaming && (
          <button
            type="button"
            title="重命名"
            onClick={(e) => {
              e.stopPropagation();
              onRenameStart();
            }}
            className="invisible group-hover:visible"
            style={{ color: "var(--muted-text)" }}
          >
            ✎
          </button>
        )}
        <button
          type="button"
          title="删除"
          onClick={onDelete}
          className="invisible group-hover:visible"
          style={{ color: "var(--muted-text)" }}
        >
          🗑
        </button>
      </div>
    </li>
  );
}

export function NotebookSidebar({ state, actions }: NotebookSidebarProps) {
  const { notebooks, selectedNotebookId } = state;
  const [newTitle, setNewTitle] = useState("");
  const [renamingNotebookId, setRenamingNotebookId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleCreateNotebook() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    actions.createNotebook(trimmed);
    setNewTitle("");
  }

  function handleRenameNotebook(notebookId: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) {
      setRenamingNotebookId(null);
      setRenameDraft("");
      return;
    }
    actions.updateNotebook(notebookId, trimmed);
    setRenamingNotebookId(null);
    setRenameDraft("");
  }

  function handleDeleteNotebook(notebookId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm("确认删除这个笔记本及其中的所有笔记吗？")) {
      actions.deleteNotebook(notebookId);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    actions.reorderNotebook(String(active.id), String(over.id));
  }

  return (
    <aside
      className="flex w-64 shrink-0 flex-col border-r"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--panel-border)",
        color: "var(--sidebar-text)",
      }}
    >
      <div className="p-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreateNotebook();
            }
          }}
          onBlur={handleCreateNotebook}
          placeholder="新建笔记本"
          className="w-full rounded-md border px-2 py-1.5 text-sm"
          style={{
            background: "var(--panel-bg)",
            borderColor: "var(--panel-border)",
            color: "var(--app-text)",
          }}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {notebooks.length === 0 ? (
          <p className="px-2 py-4 text-xs" style={{ color: "var(--muted-text)" }}>暂无笔记本</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={notebooks.map((nb) => nb.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1">
                {notebooks.map((nb) => {
                  const isRenaming = renamingNotebookId === nb.id;

                  return (
                    <SortableNotebookItem
                      key={nb.id}
                      notebook={nb}
                      isSelected={selectedNotebookId === nb.id}
                      isRenaming={isRenaming}
                      renameDraft={renameDraft}
                      onSelect={() => actions.selectNotebook(nb.id)}
                      onRenameStart={() => {
                        setRenamingNotebookId(nb.id);
                        setRenameDraft(nb.title);
                      }}
                      onRenameInput={(value) => setRenameDraft(value)}
                      onRenameCommit={() => handleRenameNotebook(nb.id, renameDraft)}
                      onDelete={(e) => handleDeleteNotebook(nb.id, e)}
                    />
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </aside>
  );
}
