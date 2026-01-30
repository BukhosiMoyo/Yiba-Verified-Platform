interface BlogAuthorProps {
  author: {
    first_name: string;
    last_name: string;
    image?: string | null;
  };
}

/**
 * BlogAuthor - Author attribution block for blog posts.
 */
export function BlogAuthor({ author }: BlogAuthorProps) {
  const fullName = `${author.first_name} ${author.last_name}`;
  const initials = `${author.first_name.charAt(0)}${author.last_name.charAt(0)}`;

  return (
    <div className="flex items-center gap-5 p-6 bg-gradient-to-br from-muted/60 to-muted/30 rounded-2xl border border-border/50">
      {/* Avatar */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
        {author.image ? (
          <img
            src={author.image}
            alt={fullName}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="text-xl font-semibold">{initials}</span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Written by
        </p>
        <p className="text-lg font-semibold text-foreground">{fullName}</p>
      </div>
    </div>
  );
}
