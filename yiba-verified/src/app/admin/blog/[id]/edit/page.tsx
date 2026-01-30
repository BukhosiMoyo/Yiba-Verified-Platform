import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogPostEditor } from "@/components/admin/BlogPostEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { title: true },
  });

  return {
    title: post ? `Edit: ${post.title}` : "Edit Post",
  };
}

async function getData(id: string) {
  const [post, categories, tags] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
        tags: { select: { tagId: true } },
      },
    }),
    prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.blogTag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return { post, categories, tags };
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  const { post, categories, tags } = await getData(id);

  if (!post) {
    notFound();
  }

  // Transform post data for the editor
  const postData = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featuredImage: post.featuredImage,
    featuredImageAlt: post.featuredImageAlt,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    status: post.status,
    readingTime: post.readingTime,
    categoryIds: post.categories.map((c) => c.categoryId),
    tagIds: post.tags.map((t) => t.tagId),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
        <p className="text-muted-foreground mt-1">
          Make changes to your blog post
        </p>
      </div>

      <BlogPostEditor
        categories={categories}
        tags={tags}
        mode="edit"
        initialData={postData}
      />
    </div>
  );
}
