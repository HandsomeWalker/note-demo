import { NotebookSidebar } from "./components/NotebookSidebar";
import { NoteList } from "./components/NoteList";
import { NoteEditor } from "./components/NoteEditor";
import { useNotes } from "./hooks/useNotes";

export default function App() {
  const { state, actions } = useNotes();

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: "var(--app-bg)", color: "var(--app-text)" }}
    >
      <NotebookSidebar state={state} actions={actions} />
      <div className="flex min-h-0 flex-1 flex-col min-w-0">
        <div className="flex min-h-0 flex-1">
          <NoteList state={state} actions={actions} />
          <NoteEditor state={state} actions={actions} />
        </div>
      </div>
    </div>
  );
}
