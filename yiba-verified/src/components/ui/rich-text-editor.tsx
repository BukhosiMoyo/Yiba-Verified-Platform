"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  Heading2,
  Heading3,
  Quote,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
}

function Toolbar({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:", editor.getAttributes("link").href || "https://");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const setImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL:", "https://");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50/80 px-2 py-1.5 rounded-t-lg",
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
        <Link2 className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton onClick={setImage} title="Insert image">
        <ImageIcon className="h-4 w-4" strokeWidth={2} />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-200/80",
        active && "bg-primary/10 text-primary"
      )}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  );
}

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Image.configure({ inline: false }),
  Link.configure({ openOnClick: false, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } }),
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your message…",
  disabled = false,
  minHeight = "180px",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "focus:outline-none px-4 py-3 min-w-0 text-sm text-gray-800 " +
          "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 " +
          "[&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 " +
          "[&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-2 " +
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2",
      },
    },
  }, []);

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white overflow-hidden",
        disabled && "opacity-70",
        className
      )}
    >
      <Toolbar editor={editor} disabled={disabled} />
      <div style={{ minHeight }} className="overflow-y-auto max-h-[320px] relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
