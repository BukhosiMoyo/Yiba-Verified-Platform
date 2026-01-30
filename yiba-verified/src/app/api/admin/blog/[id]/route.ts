import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["PLATFORM_ADMIN", "QCTO_ADMIN", "QCTO_SUPER_ADMIN"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/blog/[id] - Get a single post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { first_name: true, last_name: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/blog/[id] - Update a post
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      featuredImageAlt,
      metaTitle,
      metaDescription,
      status,
      readingTime,
      categoryIds,
      tagIds,
    } = body;

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check for duplicate slug (excluding current post)
    if (slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Determine if we should update publishedAt
    const wasPublished = existingPost.status === "PUBLISHED";
    const isPublishing = status === "PUBLISHED" && !wasPublished;

    // Update the post
    const post = await prisma.$transaction(async (tx) => {
      // Delete existing category and tag relations
      await tx.blogPostCategory.deleteMany({ where: { postId: id } });
      await tx.blogPostTag.deleteMany({ where: { postId: id } });

      // Update post with new data
      return tx.blogPost.update({
        where: { id },
        data: {
          title,
          slug,
          excerpt: excerpt || "",
          content,
          featuredImage,
          featuredImageAlt,
          metaTitle,
          metaDescription,
          status: status || existingPost.status,
          readingTime,
          publishedAt: isPublishing ? new Date() : existingPost.publishedAt,
          categories: categoryIds?.length
            ? {
                create: categoryIds.map((categoryId: string) => ({
                  categoryId,
                })),
              }
            : undefined,
          tags: tagIds?.length
            ? {
                create: tagIds.map((tagId: string) => ({
                  tagId,
                })),
              }
            : undefined,
        },
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
      });
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/[id] - Delete a post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete the post (cascade will handle relations)
    await prisma.$transaction(async (tx) => {
      await tx.blogPostCategory.deleteMany({ where: { postId: id } });
      await tx.blogPostTag.deleteMany({ where: { postId: id } });
      await tx.blogPost.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
