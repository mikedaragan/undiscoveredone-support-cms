import React from 'react';
import PropTypes from 'prop-types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Markdown } from '@tiptap/markdown';

const baseExtensions = [
  StarterKit,
  Link.configure({ openOnClick: false, autolink: true }),
  Markdown,
];

function Command({ editor, label, action, active }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active || false}
      disabled={!editor}
      onMouseDown={event => event.preventDefault()}
      onClick={() => action(editor)}
      style={{
        border: 0,
        borderRadius: 6,
        padding: '8px 11px',
        cursor: 'pointer',
        background: active ? '#e0f5f1' : 'transparent',
        color: '#263a3c',
        fontWeight: 650,
      }}
    >
      {label}
    </button>
  );
}

export default function SupportTiptapControl({ value, onChange, forID, className }) {
  const [showTools, setShowTools] = React.useState(false);
  const [showBlocks, setShowBlocks] = React.useState(false);
  const editor = useEditor({
    extensions: baseExtensions,
    content: value || '',
    contentType: 'markdown',
    onUpdate: ({ editor: current }) => onChange(current.getMarkdown()),
    editorProps: {
      attributes: {
        id: forID,
        class: 'uo-tiptap-document',
        'data-placeholder': 'Type / to choose a block',
        'aria-label': 'Article body',
        style: 'outline:none;min-height:420px;line-height:1.75;font-size:17px;color:#26383c;',
      },
      handleKeyDown: (view, event) => {
        if (event.key === '/' && view.state.selection.empty && view.state.selection.$from.parent.textContent === '') {
          event.preventDefault();
          setShowBlocks(true);
          return true;
        }
        if (event.key === 'Escape') setShowBlocks(false);
        return false;
      },
    },
  });

  React.useEffect(() => {
    if (!editor) return undefined;
    function insert() {
      setShowTools(open => !open);
    }
    function undo() {
      editor.chain().focus().undo().run();
    }
    function redo() {
      editor.chain().focus().redo().run();
    }
    window.addEventListener('uo-support-toggle-insert', insert);
    window.addEventListener('uo-support-undo', undo);
    window.addEventListener('uo-support-redo', redo);
    return () => {
      window.removeEventListener('uo-support-toggle-insert', insert);
      window.removeEventListener('uo-support-undo', undo);
      window.removeEventListener('uo-support-redo', redo);
    };
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;
    const next = value || '';
    if (!editor.isFocused && editor.getMarkdown() !== next) {
      editor.commands.setContent(next, { contentType: 'markdown', emitUpdate: false });
    }
  }, [editor, value]);

  const blocks = [
    { label: 'Paragraph', run: e => e.chain().focus().setParagraph().run() },
    { label: 'Heading 2', run: e => e.chain().focus().setHeading({ level: 2 }).run() },
    { label: 'Heading 3', run: e => e.chain().focus().setHeading({ level: 3 }).run() },
    { label: 'Bullet list', run: e => e.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', run: e => e.chain().focus().toggleOrderedList().run() },
    { label: 'Quote', run: e => e.chain().focus().toggleBlockquote().run() },
    { label: 'Code block', run: e => e.chain().focus().toggleCodeBlock().run() },
    { label: 'Divider', run: e => e.chain().focus().setHorizontalRule().run() },
  ];

  function link(current) {
    const previous = current.getAttributes('link').href || '';
    const url = window.prompt('Link URL', previous);
    if (url === null) return;
    if (!url.trim()) current.chain().focus().unsetLink().run();
    else if (/^https?:\/\//i.test(url) || url.startsWith('/')) {
      current.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      window.alert('Enter an http(s) URL or a relative path starting with /.');
    }
  }

  return (
    <div className={className} style={{ background: '#fff', minWidth: 0 }}>
      {showBlocks && (
        <div role="menu" aria-label="Insert block" style={{ border: '1px solid #e8edef', borderRadius: 8, padding: 8, maxWidth: 280, boxShadow: '0 8px 24px #00000016' }}>
          {blocks.map(block => (
            <button key={block.label} role="menuitem" type="button" onMouseDown={event => event.preventDefault()}
              onClick={() => { block.run(editor); setShowBlocks(false); }}
              style={{ display: 'block', width: '100%', padding: 10, textAlign: 'left', border: 0, background: 'white', cursor: 'pointer' }}>
              {block.label}
            </button>
          ))}
        </div>
      )}
      {showTools && (
        <div
          role="toolbar"
          aria-label="Article formatting"
          style={{
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap',
            padding: 9,
            border: '1px solid #e8edef',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <Command
            editor={editor}
            label="Paragraph"
            action={e => e.chain().focus().setParagraph().run()}
          />
          <Command
            editor={editor}
            label="H2"
            action={e => e.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive('heading', { level: 2 })}
          />
          <Command
            editor={editor}
            label="H3"
            action={e => e.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor?.isActive('heading', { level: 3 })}
          />
          <Command
            editor={editor}
            label="Bold"
            action={e => e.chain().focus().toggleBold().run()}
            active={editor?.isActive('bold')}
          />
          <Command
            editor={editor}
            label="Italic"
            action={e => e.chain().focus().toggleItalic().run()}
            active={editor?.isActive('italic')}
          />
          <Command
            editor={editor}
            label="List"
            action={e => e.chain().focus().toggleBulletList().run()}
            active={editor?.isActive('bulletList')}
          />
          <Command
            editor={editor}
            label="Numbered"
            action={e => e.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive('orderedList')}
          />
          <Command
            editor={editor}
            label="Quote"
            action={e => e.chain().focus().toggleBlockquote().run()}
            active={editor?.isActive('blockquote')}
          />
          <Command editor={editor} label="Link" action={link} active={editor?.isActive('link')} />
          <Command editor={editor} label="Undo" action={e => e.chain().focus().undo().run()} />
          <Command editor={editor} label="Redo" action={e => e.chain().focus().redo().run()} />
        </div>
      )}
      <style>{`.uo-tiptap-document { min-height: 360px; outline: none; line-height: 1.75; font-size: 18px; color: #26383c; } .uo-tiptap-document > p:first-child:has(> br.ProseMirror-trailingBreak)::before { content: 'Type / to choose a block'; float: left; color: #9aa6a8; pointer-events: none; height: 0; } .uo-tiptap-document h2 { font-size: 27px; font-weight: 650; margin: 22px 0 12px; } .uo-tiptap-document h3 { font-size: 22px; font-weight: 650; margin: 18px 0 10px; } .uo-tiptap-document ul { list-style: disc; padding-left: 28px; } .uo-tiptap-document ol { list-style: decimal; padding-left: 28px; } .uo-tiptap-document blockquote { border-left: 3px solid #00a896; padding-left: 16px; }`}</style>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '8px 0 32px' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

SupportTiptapControl.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string,
  className: PropTypes.string,
};
