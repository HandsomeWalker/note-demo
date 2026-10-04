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

type NoteListProps = {
  state: ReturnType<typeof useNotes>["state"];
  actions: ReturnType<typeof useNotes>["actions"];
};

function SortableNoteItem({
  note,
  isActive,
  onSelect,
  onDelete,
}: {
  note: ReturnType<typeof useNotes>["state"]["notes"][number];
  isActive: boolean;
  onSelect: () => void;
  onDelete: (event: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });

  return (
    <li
      ref={setNodeRef}
      className="group rounded-md"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <div
        onClick={onSelect}
        className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2"
        style={{
          background: isActive ? "var(--note-active)" : "transparent",
        }}
      >
        <button
          type="button"
          aria-label={`拖拽笔记 ${note.title || "未命名"}`}
          className="cursor-grab rounded px-1 text-xs active:cursor-grabbing"
          style={{ color: "var(--muted-text)" }}
          {...attributes}
          {...listeners}
        >
          ☰
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: "var(--note-text)" }}>
            {note.title || "未命名"}
          </p>
          <p className="line-clamp-3 text-xs" style={{ color: "var(--muted-text)" }}>
            {note.content || "暂无内容"}
          </p>
        </div>
        <button
          type="button"
          title="删除笔记"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className="invisible text-xs group-hover:visible"
          style={{ color: "var(--muted-text)" }}
        >
          🗑
        </button>
      </div>
    </li>
  );
}

export function NoteList({ state, actions }: NoteListProps) {
  const { notes, selectedNotebookId, selectedNoteId } = state;

  const currentNotes = selectedNotebookId
    ? notes.filter((n) => n.notebookId === selectedNotebookId)
    : [];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedNotebookId) return;
    actions.reorderNote(String(active.id), String(over.id), selectedNotebookId);
  }

  return (
    <div
      className="flex h-full w-72 shrink-0 flex-col border-r"
      style={{
        background: "var(--note-list-bg)",
        borderColor: "var(--panel-border)",
      }}
    >
      <div
        className="flex h-[52px] items-center justify-between border-b px-4 text-xs"
        style={{ borderColor: "var(--panel-border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--sidebar-text)" }}>
          {currentNotes.length === 0
            ? "暂无笔记"
            : `${currentNotes.length} 篇笔记`}
        </h2>
        <button
          type="button"
          onClick={() => actions.createNote()}
          className="rounded-md px-2 py-1 text-xs font-medium"
          style={{
            background: "var(--button-bg)",
            color: "var(--button-text)",
          }}
        >
          + 新建笔记
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {currentNotes.length === 0 ? (
          <p className="px-2 py-4 text-xs" style={{ color: "var(--muted-text)" }}>暂无笔记</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={currentNotes.map((note) => note.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1">
                {currentNotes.map((note) => {
                  const isActive = selectedNoteId === note.id;
                  return (
                    <SortableNoteItem
                      key={note.id}
                      note={note}
                      isActive={isActive}
                      onSelect={() => actions.selectNote(note.id)}
                      onDelete={(e) => {
                        e.stopPropagation();
                        if (confirm("确认删除这篇笔记吗？")) {
                          actions.deleteNote(note.id);
                        }
                      }}
                    />
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
