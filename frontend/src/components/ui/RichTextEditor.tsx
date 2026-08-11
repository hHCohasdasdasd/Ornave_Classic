import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import './RichTextEditor.css';

interface RichTextEditorProps {
  /** HTML string — same shape TipTap reads and writes. */
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    type="button"
    className={`rte-toolbar__btn${active ? ' rte-toolbar__btn--active' : ''}`}
    onMouseDown={(e) => e.preventDefault()} // keep focus/selection in the editor, not the button
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);

const Toolbar: React.FC<{ editor: Editor }> = ({ editor }) => (
  <div className="rte-toolbar">
    <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
      <strong>B</strong>
    </ToolbarButton>
    <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
      <em>I</em>
    </ToolbarButton>
    <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
      <span style={{ textDecoration: 'underline' }}>U</span>
    </ToolbarButton>
    <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
      <span style={{ textDecoration: 'line-through' }}>S</span>
    </ToolbarButton>

    <span className="rte-toolbar__divider" />

    <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
      H1
    </ToolbarButton>
    <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
      H2
    </ToolbarButton>
    <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
      H3
    </ToolbarButton>

    <span className="rte-toolbar__divider" />

    <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
      ☰
    </ToolbarButton>
    <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
      1.
    </ToolbarButton>
    <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
      "
    </ToolbarButton>
    <ToolbarButton title="Code" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
      {'</>'}
    </ToolbarButton>

    <span className="rte-toolbar__divider" />

    <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>↺</ToolbarButton>
    <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>↻</ToolbarButton>
  </div>
);

/**
 * A Word-style rich text editor for note content — bold/italic/underline,
 * headings, lists, quotes — instead of a plain textarea. Built on TipTap
 * (headless, so the toolbar is fully custom-styled to match the app rather
 * than a bundled stock UI) and stores/loads HTML.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: placeholder || 'Write something…' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="rte">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="rte-content" />
    </div>
  );
};
