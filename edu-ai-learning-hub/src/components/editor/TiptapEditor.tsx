// src/components/editor/TiptapEditor.jsx
import React, { forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';

import MenuBar from './MenuBar';
// Bỏ import './TiptapStyles.css';

type TiptapEditorProps = {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onBlur?: () => void; // Thêm prop onBlur nếu cần xử lý sự kiện blur
};

const TiptapEditor = forwardRef<HTMLDivElement, TiptapEditorProps>(
  ({ initialContent = '', onContentChange, onBlur }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({}),
        Link.configure({
          openOnClick: true,
          autolink: true,
          linkOnPaste: true,
        }),
        Image.configure({
          inline: false,
          allowBase64: true,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        Highlight.configure({ multicolor: true }),
        TextStyle,
        Color,
        FontFamily,
      ],
      content: initialContent,
      onUpdate: ({ editor }) => {
        if (onContentChange) {
          onContentChange(editor.getHTML());
        }
      },
      editorProps: {
        attributes: {
          class:
            'focus:outline-none p-4 min-h-[250px] max-h-[500px] overflow-y-auto',
        },
      },
    });

    return (
      <div className='border border-gray-300 dark:border-gray-700 rounded-md shadow-sm'>
        <MenuBar editor={editor} />

        <div className='prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert max-w-none'>
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

// Thêm display name để dễ debug
TiptapEditor.displayName = 'TiptapEditor';

export default TiptapEditor;
