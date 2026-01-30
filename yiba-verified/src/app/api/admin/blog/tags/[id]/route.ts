import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["PLATFORM_ADMIN", "QCTO_ADMIN", "QCTO_SUPER_ADMIN"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/blog/tags/[id] - Update a tag
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, slug } = body;

    // Check if tag exists
    const existing = await prisma.blogTag.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check for duplicate slug (excluding current tag)
    if (slug !== existing.slug) {
      const slugExists = await prisma.blogTag.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "A tag with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const tag = await prisma.blogTag.update({
      where: { id },
      data: { name, slug },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/tags/[id] - Delete a tag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if tag exists
    const tag = await prisma.blogTag.findUnique({
      where: { id },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Delete tag relations first, then the tag
    await prisma.$transaction(async (tx) => {
      await tx.blogPostTag.deleteMany({ where: { tagId: id } });
      await tx.blogTag.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
