import { prisma } from "@/lib/prisma";
import { BlogPostEditor } from "@/components/admin/BlogPostEditor";

export const metadata = {
  title: "New Post",
};

async function getData() {
  const [categories, tags] = await Promise.all([
    prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.blogTag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return { categories, tags };
}

export default async function NewBlogPostPage() {
  const { categories, tags } = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Post</h1>
        <p className="text-muted-foreground mt-1">
          Create a new blog post
        </p>
      </div>

      <BlogPostEditor
        categories={categories}
        tags={tags}
        mode="create"
      />
    </div>
  );
}
