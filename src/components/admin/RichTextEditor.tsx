import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  ImagePlus,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from "lucide-react";
import clsx from "clsx";
import { useRef, useState, type ReactNode } from "react";
import { uploadContentImage, UploadError } from "@/lib/supabase/upload";
import { sanitizeHtml } from "@/lib/sanitize";

/**
 * A real WYSIWYG editor for posts.content_html (spec's blog rich-text
 * requirement), built on TipTap/ProseMirror rather than a hand-rolled
 * contentEditable toolbar — a from-scratch implementation of cursor/
 * selection handling is exactly the kind of "looks done, breaks on first
 * real use" risk this project avoids.
 *
 * Output is sanitized with the same DOMPurify allowlist the public site
 * uses to render it (src/lib/sanitize.ts) before ever reaching onChange —
 * fulfilling the blog migration's own comment that content_html must be
 * sanitized "before every insert/update", not just trusted because it came
 * from an authenticated staff member.
 */
export function RichTextEditor({
  value,
  onChange,
  minHeightClass = "min-h-[220px]",
}: {
  value: string;
  onChange: (html: string) => void;
  minHeightClass?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(sanitizeHtml(editor.getHTML())),
    editorProps: {
      attributes: {
        class:
          "prose-content max-w-none focus:outline-none text-sm leading-relaxed text-ink-light [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:text-ink [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:text-ink [&_a]:text-teal [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-teal [&_blockquote]:pl-4 [&_blockquote]:text-muted [&_img]:rounded-sm [&_p]:my-2",
      },
    },
  });

  if (!editor) return null;

  function setLink() {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function handleImagePick(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadContentImage("blog-images", file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      window.alert(err instanceof UploadError ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-[3px] border border-line">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-cream/50 p-2">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic">
          <Italic size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="Heading 2"
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="Heading 3"
        >
          <Heading3 size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bullet list">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numbered list">
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Quote">
          <Quote size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton active={editor.isActive("link")} onClick={setLink} label="Link">
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton active={false} disabled={uploading} onClick={() => fileInputRef.current?.click()} label="Insert image">
          <ImagePlus size={15} />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImagePick(file);
            e.target.value = "";
          }}
        />
        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton active={false} onClick={() => editor.chain().focus().undo().run()} label="Undo">
            <Undo size={15} />
          </ToolbarButton>
          <ToolbarButton active={false} onClick={() => editor.chain().focus().redo().run()} label="Redo">
            <Redo size={15} />
          </ToolbarButton>
        </div>
      </div>

      <div className={clsx("px-4 py-3", minHeightClass)}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  disabled,
  onClick,
  label,
}: {
  children: ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "rounded p-1.5 transition-colors disabled:opacity-50",
        active ? "bg-teal text-white" : "text-ink-light hover:bg-mist/50"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-line" />;
}
