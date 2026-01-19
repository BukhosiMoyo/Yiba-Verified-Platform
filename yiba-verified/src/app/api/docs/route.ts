import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/docs
 * 
 * Returns the OpenAPI specification as YAML (Swagger UI can parse YAML directly)
 */
export async function GET() {
  try {
    // Read the OpenAPI YAML file
    const openApiPath = path.join(process.cwd(), "docs", "09-API", "OPENAPI.yaml");
    const yamlContent = fs.readFileSync(openApiPath, "utf-8");

    // Return as text/yaml so Swagger UI can parse it
    return new NextResponse(yamlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to load API documentation",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
