import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useNotes } from './hooks/useNotes';

afterEach(() => {
  cleanup();
});

describe('App notebook flow', () => {
  beforeEach(() => {
    localStorage.clear();
    window.confirm = vi.fn(() => true);
  });

  it('prefills an example markdown note when the app starts empty', () => {
    render(<App />);

    expect(screen.getByDisplayValue(/# Markdown 示例/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/语法展示与写作示例/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/任务列表/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\| 功能 \| 支持 \|/)).toBeInTheDocument();
  });

  it('does not reinsert the example markdown note after the user deletes it', () => {
    const { unmount } = render(<App />);

    fireEvent.click(screen.getAllByTitle('删除笔记')[0]);
    unmount();

    render(<App />);

    expect(screen.queryByDisplayValue(/# Markdown 示例/)).not.toBeInTheDocument();
    expect(screen.queryByText('Markdown 示例')).not.toBeInTheDocument();
  });

  it('adds the example note to an empty notebook on first launch', () => {
    const emptyNotebook = {
      id: 'nb-empty',
      title: '空笔记本',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('note-app.notebooks', JSON.stringify([emptyNotebook]));
    localStorage.setItem('note-app.notes', JSON.stringify([]));
    localStorage.removeItem('note-app.example-note-seeded');

    render(<App />);

    expect(screen.getByDisplayValue(/# Markdown 示例/)).toBeInTheDocument();
    expect(screen.getByText('Markdown 示例')).toBeInTheDocument();
  });

  it('repairs a stale example notebook that exists without the example note', () => {
    const staleExampleNotebook = {
      id: 'nb-stale',
      title: '示例笔记本',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('note-app.notebooks', JSON.stringify([staleExampleNotebook]));
    localStorage.setItem('note-app.notes', JSON.stringify([]));
    localStorage.setItem('note-app.example-note-seeded', 'true');

    render(<App />);

    expect(screen.getByDisplayValue(/# Markdown 示例/)).toBeInTheDocument();
    expect(screen.getByText('Markdown 示例')).toBeInTheDocument();
  });

  it('creates a new notebook and note from the sidebar workflow', () => {
    render(<App />);

    const notebookInput = screen.getByPlaceholderText('新建笔记本');
    fireEvent.change(notebookInput, { target: { value: 'Project A' } });
    fireEvent.blur(notebookInput);

    const newNoteButton = screen.getByRole('button', { name: /\+ 新建笔记/i });
    expect(newNoteButton).toBeEnabled();

    fireEvent.click(newNoteButton);

    expect(screen.getByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('未命名')).toBeInTheDocument();
    expect(screen.getAllByText(/篇笔记/).length).toBeGreaterThan(0);
  });

  it('creates a note inside the selected notebook', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /\+ 新建笔记/i }));

    expect(screen.getAllByText('2 篇笔记').length).toBeGreaterThan(0);
    expect(screen.getAllByText('未命名').length).toBeGreaterThan(0);
  });

  it('fills the note list column to the available height', () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /\+ 新建笔记/i }));

    const noteList = container.querySelector('.w-72.h-full');

    expect(noteList).not.toBeNull();
    expect(noteList).toHaveClass('h-full');
    expect(noteList?.querySelector('.min-h-0.flex-1.overflow-y-auto')).not.toBeNull();
  });

  it('fills the editor panel to the available height', () => {
    const { container } = render(<App />);

    const editor = container.querySelector('.flex.flex-1.flex-col.min-h-0');
    const textarea = screen.getByPlaceholderText('写点什么...');

    expect(editor).not.toBeNull();
    expect(editor).toHaveClass('flex-1');
    expect(textarea).toHaveClass('flex-1');
  });

  it('allows typing normally in the note body', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /\+ 新建笔记/i }));

    const body = screen.getByPlaceholderText('写点什么...');
    fireEvent.change(body, { target: { value: 'Hello world' } });

    expect(body).toHaveValue('Hello world');
  });

  it('renders markdown preview for the note body', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /\+ 新建笔记/i }));

    const body = screen.getByPlaceholderText('写点什么...');
    fireEvent.change(body, { target: { value: '# Hello\n\n**bold**' } });
    fireEvent.click(screen.getByRole('button', { name: '预览' }));

    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('toggles fullscreen mode for the note editor', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null,
    });
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /\+ 新建笔记/i }));

    fireEvent.click(screen.getByRole('button', { name: '全屏' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '退出全屏' })).toBeInTheDocument();
    });
    expect(requestFullscreen).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: document.documentElement,
    });

    fireEvent.click(screen.getByRole('button', { name: '退出全屏' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '全屏' })).toBeInTheDocument();
    });
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('switches to built-in theme presets', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /\+ 新建笔记/i }));

    fireEvent.click(screen.getByRole('button', { name: /换肤: 护眼/i }));
    expect(document.documentElement.dataset.theme).toBe('eye-care');

    fireEvent.click(screen.getByRole('button', { name: /换肤: 夜间/i }));
    expect(document.documentElement.dataset.theme).toBe('night');
  });

  it('keeps markdown preview readable and formatted', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /\+ 新建笔记/i }));

    const body = screen.getByPlaceholderText('写点什么...');
    fireEvent.change(body, { target: { value: '# Hello\n\n**bold**\n\n> quote' } });
    fireEvent.click(screen.getByRole('button', { name: '预览' }));

    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('quote')).toBeInTheDocument();
  });

  it('renames a notebook from the sidebar without duplicating it', () => {
    render(<App />);

    const notebookInput = screen.getByPlaceholderText('新建笔记本');
    fireEvent.change(notebookInput, { target: { value: 'Project A' } });
    fireEvent.blur(notebookInput);

    const renameButtons = screen.getAllByTitle('重命名');
    fireEvent.click(renameButtons[0]);

    const renameInput = screen.getByDisplayValue('Project A');
    fireEvent.change(renameInput, { target: { value: 'Project B' } });
    fireEvent.blur(renameInput);

    expect(screen.getByText('Project B')).toBeInTheDocument();
    expect(screen.queryByText('Project A')).not.toBeInTheDocument();
  });

  it('deletes a note from the current notebook', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /\+ 新建笔记/i }));
    fireEvent.click(screen.getAllByTitle('删除笔记')[0]);

    expect(screen.getAllByText('1 篇笔记').length).toBeGreaterThan(0);
  });

  it('switches notebooks without leaving the editor empty', () => {
    localStorage.setItem(
      'note-app.notebooks',
      JSON.stringify([
        { id: 'nb-1', title: 'A', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'nb-2', title: 'B', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
      ]),
    );
    localStorage.setItem(
      'note-app.notes',
      JSON.stringify([
        { id: 'note-1', notebookId: 'nb-1', title: 'Alpha', content: 'A', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'note-2', notebookId: 'nb-2', title: 'Beta', content: 'B', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
      ]),
    );

    render(<App />);

    const notebookButtons = screen.getAllByText(/^(A|B)$/);
    fireEvent.click(notebookButtons[1]);

    expect(screen.getByDisplayValue('Beta')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Alpha')).not.toBeInTheDocument();
  });

  it('keeps an empty notebook empty when selected', () => {
    localStorage.setItem(
      'note-app.notebooks',
      JSON.stringify([
        { id: 'nb-1', title: 'A', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'nb-2', title: 'B', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
      ]),
    );
    localStorage.setItem(
      'note-app.notes',
      JSON.stringify([
        { id: 'note-1', notebookId: 'nb-1', title: 'Alpha', content: 'A', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      ]),
    );

    render(<App />);

    fireEvent.click(screen.getByText('B'));

    expect(screen.getByText('暂无笔记')).toBeInTheDocument();
    expect(screen.getByText('选择或创建一篇笔记开始写作。')).toBeInTheDocument();
  });

  it('reorders notebooks and notes with drag actions', () => {
    localStorage.setItem(
      'note-app.notebooks',
      JSON.stringify([
        { id: 'nb-1', title: 'A', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'nb-2', title: 'B', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
      ]),
    );
    localStorage.setItem(
      'note-app.notes',
      JSON.stringify([
        { id: 'note-1', notebookId: 'nb-1', title: 'Alpha', content: 'A', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'note-2', notebookId: 'nb-1', title: 'Beta', content: 'B', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
        { id: 'note-3', notebookId: 'nb-2', title: 'Gamma', content: 'G', createdAt: '2024-01-03T00:00:00.000Z', updatedAt: '2024-01-03T00:00:00.000Z' },
      ]),
    );

    const { result } = renderHook(() => useNotes());

    act(() => {
      result.current.actions.reorderNotebook('nb-1', 'nb-2');
    });

    expect(result.current.state.notebooks.map((nb) => nb.id)).toEqual(['nb-2', 'nb-1']);

    act(() => {
      result.current.actions.reorderNote('note-1', 'note-2', 'nb-1');
    });

    expect(result.current.state.notes.filter((note) => note.notebookId === 'nb-1').map((note) => note.id)).toEqual(['note-2', 'note-1']);
  });
});
