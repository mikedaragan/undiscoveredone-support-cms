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
  const [selectedBlock, setSelectedBlock] = React.useState(0);
  const [blockQuery, setBlockQuery] = React.useState('');
  const [menuPosition, setMenuPosition] = React.useState(null);
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
        if (
          event.key === '/' &&
          view.state.selection.empty &&
          view.state.selection.$from.parent.textContent === ''
        ) {
          event.preventDefault();
          setBlockQuery('');
          setSelectedBlock(0);
          setMenuPosition(null);
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
    function insert(event) {
      const rect = event?.detail?.anchorRect;
      setMenuPosition(
        rect ? { top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 312) } : null,
      );
      setShowBlocks(open => !open);
      setSelectedBlock(0);
      setBlockQuery('');
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

  // Insert a new block after the current top-level block instead of changing its type.
  const blocks = [
    { label: 'Paragraph', type: 'paragraph' },
    { label: 'Heading 2', type: 'heading', attrs: { level: 2 } },
    { label: 'Heading 3', type: 'heading', attrs: { level: 3 } },
    { label: 'Bullet list', type: 'bulletList' },
    { label: 'Numbered list', type: 'orderedList' },
    { label: 'Quote', type: 'blockquote' },
    { label: 'Code block', type: 'codeBlock' },
    { label: 'Divider', type: 'horizontalRule' },
  ];

  const matchingBlocks = blocks.filter(block =>
    block.label.toLowerCase().includes(blockQuery.toLowerCase()),
  );

  function insertBlock(block) {
    if (!editor || !block) return;
    const { state } = editor;
    // The toolbar inserter appends a new top-level block to the document.
    // Using the current selection here can insert at the top after focus moves to the menu.
    const insertAt = state.doc.content.size;
    const content =
      block.type === 'bulletList' || block.type === 'orderedList'
        ? { type: block.type, content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] }
        : block.type === 'blockquote'
        ? { type: 'blockquote', content: [{ type: 'paragraph' }] }
        : { type: block.type, ...(block.attrs ? { attrs: block.attrs } : {}) };
    editor
      .chain()
      .insertContentAt(insertAt, content)
      .focus(insertAt + 1)
      .run();
    setShowBlocks(false);
    setShowTools(false);
    setBlockQuery('');
  }

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
        <div
          role="dialog"
          aria-label="Insert block"
          style={{
            position: menuPosition ? 'fixed' : 'absolute',
            top: menuPosition?.top,
            left: menuPosition?.left,
            zIndex: 1000,
            background: '#fff',
            border: '1px solid #e8edef',
            borderRadius: 8,
            padding: 8,
            width: 300,
            maxWidth: 'calc(100vw - 24px)',
            boxShadow: '0 8px 24px #00000016',
          }}
        >
          <input
            autoFocus
            type="search"
            aria-label="Search blocks"
            placeholder="Search blocks..."
            value={blockQuery}
            onChange={event => {
              setBlockQuery(event.target.value);
              setSelectedBlock(0);
            }}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                setShowBlocks(false);
                editor?.chain().focus().run();
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedBlock(i => Math.min(i + 1, matchingBlocks.length - 1));
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedBlock(i => Math.max(i - 1, 0));
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                insertBlock(matchingBlocks[selectedBlock]);
              }
            }}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #dce4e8',
              borderRadius: 6,
              marginBottom: 6,
            }}
          />
          <div role="listbox" aria-label="Available blocks">
            {matchingBlocks.length === 0 && <div style={{ padding: 10 }}>No matching blocks</div>}
            {matchingBlocks.map((block, index) => (
              <button
                key={block.label}
                role="option"
                aria-selected={index === selectedBlock}
                type="button"
                onMouseDown={event => event.preventDefault()}
                onClick={() => insertBlock(block)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 10,
                  textAlign: 'left',
                  border: 0,
                  borderRadius: 6,
                  background: index === selectedBlock ? '#edf0fb' : 'white',
                  cursor: 'pointer',
                }}
              >
                {block.label}
              </button>
            ))}
          </div>
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
      <style>{`.uo-tiptap-document { min-height: 360px; outline: none; line-height: 1.75; font-size: 18px; color: #26383c; } .uo-tiptap-document > p:first-child:has(> br.ProseMirror-trailingBreak)::before { content: 'Type / to choose a block'; float: left; color: #9aa6a8; pointer-events: none; height: 0; } .uo-tiptap-document > p, .uo-tiptap-document > h2, .uo-tiptap-document > h3, .uo-tiptap-document > ul, .uo-tiptap-document > ol, .uo-tiptap-document > blockquote, .uo-tiptap-document > pre, .uo-tiptap-document > hr { position: relative; border: 1px solid transparent; border-radius: 5px; padding: 5px 8px; margin-left: -9px; margin-right: -9px; } .uo-tiptap-document > :hover { border-color: #e0e6f4; } .uo-tiptap-document > :focus-within { border-color: #5265a8; background: #f8f9fd; } .uo-tiptap-document h2 { font-size: 27px; font-weight: 650; margin: 22px 0 12px; } .uo-tiptap-document h3 { font-size: 22px; font-weight: 650; margin: 18px 0 10px; } .uo-tiptap-document ul { list-style: disc; padding-left: 28px; } .uo-tiptap-document ol { list-style: decimal; padding-left: 28px; } .uo-tiptap-document blockquote { border-left: 3px solid #00a896; padding-left: 16px; }`}</style>
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
