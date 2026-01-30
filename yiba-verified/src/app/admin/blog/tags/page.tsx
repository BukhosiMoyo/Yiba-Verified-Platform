import { prisma } from "@/lib/prisma";
import { TagManager } from "@/components/admin/TagManager";

export const metadata = {
  title: "Tags",
};

async function getTags() {
  return prisma.blogTag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });
}

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground mt-1">
          Add tags to help users find related content
        </p>
      </div>

      <TagManager initialTags={tags} />
    </div>
  );
}
