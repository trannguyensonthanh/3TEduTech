// src/components/editor/MenuBar.tsx
// Icon của trình soạn thảo
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikeIcon,
  LinkIcon,
  ListOrderedIcon,
  ListBulletIcon,
} from './Icons';

/**
 * Thanh công cụ của trình soạn thảo.
 *
 * Bản trước tự viết thang xám riêng (`bg-gray-100`, `dark:bg-gray-800`…) nên
 * thanh này lệch tông với mọi thanh công cụ khác trong ứng dụng. Nay dùng token
 * chung, và chế độ tối tự đúng mà không cần biến thể `dark:`.
 */
/* Màu của NỘI DUNG văn bản, không phải màu giao diện: giá trị được ghi thẳng
   vào tài liệu người dùng soạn nên bắt buộc là màu tuyệt đối, không thể là token. */
const HIGHLIGHT_COLOR = '#FFF3A3';
const DEFAULT_TEXT_COLOR = '#000000';

const MenuBarButton = ({ onClick, isActive, title, disabled, children }) => (
  <button
    type="button" // Quan trọng để không submit form nếu editor nằm trong form
    onClick={onClick}
    className={`rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
      isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    title={title}
    aria-pressed={isActive}
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
    className="mx-1 h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    const url = window.prompt('Địa chỉ liên kết (URL)', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Địa chỉ ảnh (URL)');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-md border-b border-border bg-muted/40 p-2">
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Chữ đậm"
        disabled={false}
      >
        <BoldIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Chữ nghiêng"
        disabled={false}
      >
        <ItalicIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Gạch chân"
        disabled={false}
      >
        <UnderlineIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Gạch ngang"
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
        title="Cấp tiêu đề"
      >
        <option value="0">Đoạn văn</option>
        <option value="1">Tiêu đề 1</option>
        <option value="2">Tiêu đề 2</option>
        <option value="3">Tiêu đề 3</option>
      </MenuBarSelect>

      <MenuBarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Danh sách dấu chấm"
        disabled={false}
      >
        <ListBulletIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Danh sách đánh số"
        disabled={false}
      >
        <ListOrderedIcon />
      </MenuBarButton>

      <MenuBarButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        title="Chèn liên kết"
        disabled={false}
      >
        <LinkIcon />
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        title="Bỏ liên kết"
        isActive={false}
      >
        Bỏ liên kết
      </MenuBarButton>

      <MenuBarButton
        onClick={addImage}
        title="Chèn ảnh"
        disabled={false}
        isActive={false}
      >
        Ảnh
      </MenuBarButton>

      {/* Căn lề */}
      <MenuBarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Căn trái"
        disabled={false}
      >
        Trái
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Căn giữa"
        disabled={false}
      >
        Giữa
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Căn phải"
        disabled={false}
      >
        Phải
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Căn đều hai bên"
        disabled={false}
      >
        Đều
      </MenuBarButton>

      <MenuBarButton
        onClick={() =>
          editor.chain().focus().toggleHighlight({ color: HIGHLIGHT_COLOR }).run()
        }
        isActive={editor.isActive('highlight', { color: HIGHLIGHT_COLOR })}
        title="Tô nền chữ"
        disabled={false}
      >
        Tô nền
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
        value={editor.getAttributes('textStyle').color || DEFAULT_TEXT_COLOR}
        title="Màu chữ"
        aria-label="Màu chữ"
        className="mx-1 h-8 w-8 cursor-pointer rounded-md border border-border bg-transparent p-0" // bg-transparent để không che màu của input color
      />
      <MenuBarSelect
        onChange={(e) =>
          e.target.value
            ? editor.chain().focus().setFontFamily(e.target.value).run()
            : editor.chain().focus().unsetFontFamily().run()
        }
        value={editor.getAttributes('textStyle').fontFamily || ''}
        title="Phông chữ"
      >
        <option value="">Mặc định</option>
        <option value="Inter">Inter</option>
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana">Verdana</option>
      </MenuBarSelect>

      <MenuBarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Hoàn tác"
        isActive={false}
      >
        Hoàn tác
      </MenuBarButton>
      <MenuBarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Làm lại"
        isActive={false}
      >
        Làm lại
      </MenuBarButton>
    </div>
  );
};

export default MenuBar;
