// src/components/editor/MenuBar.jsx
import React from 'react';
// Import icons của bạn như cũ
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikeIcon,
  LinkIcon,
  ListOrderedIcon,
  ListBulletIcon,
} from './Icons';

const MenuBarButton = ({ onClick, isActive, title, disabled, children }) => (
  <button
    type="button" // Quan trọng để không submit form nếu editor nằm trong form
    onClick={onClick}
    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
      isActive ? 'bg-gray-200 dark:bg-gray-700' : ''
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    title={title}
    disabled={disabled}
  >
    {children}
  </button>
);

const MenuBarSelect = ({ onChange, value, title, children }) => (
  <select
    onChange={onChange}
    value={value}
    title={title}
    className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mx-1"
  >
    {children}
  </select>
);

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 rounded-t-md">
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
        disabled={false}
      >
        <BoldIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
        disabled={false}
      >
        <ItalicIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
        disabled={false}
      >
        <UnderlineIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
        disabled={false}
      >
        <StrikeIcon />
      </MenuBarButton>

      <MenuBarSelect
        onChange={(e) =>
          editor
            .chain()
            .focus()
            .toggleHeading({ level: parseInt(e.target.value) })
            .run()
        }
        value={
          editor.isActive('heading', { level: 1 })
            ? 1
            : editor.isActive('heading', { level: 2 })
            ? 2
            : editor.isActive('heading', { level: 3 })
            ? 3
            : 0
        }
        title="Heading"
      >
        <option value="0">Paragraph</option>
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
      </MenuBarSelect>

      <MenuBarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
        disabled={false}
      >
        <ListBulletIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
        disabled={false}
      >
        <ListOrderedIcon />
      </MenuBarButton>

      <MenuBarButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        title="Set Link"
        disabled={false}
      >
        <LinkIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        title="Unset Link"
        isActive={false}
      >
        Unlink
      </MenuBarButton>

      <MenuBarButton
        onClick={addImage}
        title="Add Image"
        disabled={false}
        isActive={false}
      >
        Image
      </MenuBarButton>

      {/* Text Align */}
      <MenuBarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
        disabled={false}
      >
        Left
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
        disabled={false}
      >
        Center
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
        disabled={false}
      >
        Right
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Align Justify"
        disabled={false}
      >
        Justify
      </MenuBarButton>

      <MenuBarButton
        onClick={() =>
          editor.chain().focus().toggleHighlight({ color: '#FFF3A3' }).run()
        }
        isActive={editor.isActive('highlight', { color: '#FFF3A3' })}
        title="Highlight"
        disabled={false}
      >
        Highlight
      </MenuBarButton>
      <input
        type="color"
        onInput={(event) =>
          editor
            .chain()
            .focus()
            .setColor((event.target as HTMLInputElement).value)
            .run()
        }
        value={editor.getAttributes('textStyle').color || '#000000'}
        title="Text Color"
        className="w-8 h-8 p-0 border-none rounded cursor-pointer mx-1 bg-transparent" // bg-transparent để không che màu của input color
      />
      <MenuBarSelect
        onChange={(e) =>
          e.target.value
            ? editor.chain().focus().setFontFamily(e.target.value).run()
            : editor.chain().focus().unsetFontFamily().run()
        }
        value={editor.getAttributes('textStyle').fontFamily || ''}
        title="Font Family"
      >
        <option value="">Default</option>
        <option value="Inter">Inter</option>
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana">Verdana</option>
      </MenuBarSelect>

      <MenuBarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
        isActive={false}
      >
        Undo
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
        isActive={false}
      >
        Redo
      </MenuBarButton>
    </div>
  );
};

export default MenuBar;
