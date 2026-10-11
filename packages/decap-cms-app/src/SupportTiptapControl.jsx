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
        border: 0, borderRadius: 6, padding: '8px 11px', cursor: 'pointer',
        background: active ? '#e0f5f1' : 'transparent', color: '#263a3c',
        fontWeight: 650,
      }}
    >
      {label}
    </button>
  );
}

export default function SupportTiptapControl({ value, onChange, forID, className }) {
  const editor = useEditor({
    extensions: baseExtensions,
    content: value || '',
    contentType: 'markdown',
    editorProps: {
      attributes: {
        id: forID,
        class: 'uo-tiptap-document',
        'aria-label': 'Article body',
        style: 'outline:none;min-height:420px;line-height:1.75;font-size:17px;color:#26383c;',
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getMarkdown()),
  });

  React.useEffect(() => {
    if (!editor) return;
    const next = value || '';
    if (editor.getMarkdown() !== next) {
      editor.commands.setContent(next, { contentType: 'markdown', emitUpdate: false });
    }
  }, [editor, value]);

  const link = current => {
    const previous = current.getAttributes('link').href || '';
    const url = window.prompt('Link URL', previous);
    if (url === null) return;
    if (!url.trim()) current.chain().focus().unsetLink().run();
    else if (/^https?:\/\//i.test(url) || url.startsWith('/')) {
      current.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      window.alert('Enter an http(s) URL or a relative path starting with /.');
    }
  };

  return (
    <div className={className} style={{ border: '1px solid #e1e7ea', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      <div role="toolbar" aria-label="Article formatting" style={{ display: 'flex', gap: 3, flexWrap: 'wrap', padding: 9, borderBottom: '1px solid #e8edef' }}>
        <Command editor={editor} label="Paragraph" action={e => e.chain().focus().setParagraph().run()} />
        <Command editor={editor} label="H2" action={e => e.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} />
        <Command editor={editor} label="H3" action={e => e.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} />
        <Command editor={editor} label="Bold" action={e => e.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} />
        <Command editor={editor} label="Italic" action={e => e.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} />
        <Command editor={editor} label="List" action={e => e.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} />
        <Command editor={editor} label="Numbered" action={e => e.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} />
        <Command editor={editor} label="Quote" action={e => e.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} />
        <Command editor={editor} label="Link" action={link} active={editor?.isActive('link')} />
        <Command editor={editor} label="Undo" action={e => e.chain().focus().undo().run()} />
        <Command editor={editor} label="Redo" action={e => e.chain().focus().redo().run()} />
      </div>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '26px clamp(16px,4vw,42px)' }}>
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
