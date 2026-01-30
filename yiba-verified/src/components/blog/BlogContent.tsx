interface BlogContentProps {
  content: string;
}

/**
 * BlogContent - Renders blog post HTML content with prose styling.
 * Styles are defined in globals.css under .blog-content
 */
export function BlogContent({ content }: BlogContentProps) {
  return (
    <div className="blog-content">
      <div 
        className="prose prose-lg dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
