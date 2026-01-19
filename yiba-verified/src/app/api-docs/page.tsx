"use client";

import { useEffect, useRef, useState } from "react";

export default function ApiDocsPage() {
  const swaggerContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const scriptsLoadedRef = useRef({ bundle: false, preset: false });

  useEffect(() => {
    // Add Swagger UI CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css";
    document.head.appendChild(link);

    // Load scripts dynamically
    const loadScript = (src: string, name: "bundle" | "preset"): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (name === "bundle" && (window as any).SwaggerUIBundle) {
          scriptsLoadedRef.current.bundle = true;
          resolve();
          return;
        }
        if (name === "preset" && (window as any).SwaggerUIStandalonePreset) {
          scriptsLoadedRef.current.preset = true;
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
          scriptsLoadedRef.current[name] = true;
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    const initializeSwagger = async () => {
      try {
        // Load bundle first
        await loadScript(
          "https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js",
          "bundle"
        );

        // Then load preset
        await loadScript(
          "https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js",
          "preset"
        );

        // Wait a tick to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Initialize Swagger UI
        if (
          swaggerContainerRef.current &&
          (window as any).SwaggerUIBundle &&
          (window as any).SwaggerUIStandalonePreset
        ) {
          // Clear container first
          swaggerContainerRef.current.innerHTML = "";

          const ui = (window as any).SwaggerUIBundle({
            url: "/api/docs",
            dom_id: "#swagger-ui",
            presets: [
              (window as any).SwaggerUIBundle.presets.apis,
              (window as any).SwaggerUIStandalonePreset,
            ],
            layout: "StandaloneLayout",
            deepLinking: true,
            filter: true,
            tryItOutEnabled: true,
          });

          (swaggerContainerRef.current as any).swaggerUI = ui;
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize Swagger UI:", error);
        if (swaggerContainerRef.current) {
          swaggerContainerRef.current.innerHTML = `
            <div class="p-6 text-center">
              <p class="text-red-600">Failed to load API documentation. Please refresh the page.</p>
              <p class="text-sm text-gray-500 mt-2">${error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          `;
        }
      }
    };

    initializeSwagger();

    return () => {
      // Cleanup: remove CSS link on unmount
      const existingLink = document.querySelector(
        'link[href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css"]'
      );
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Interactive API documentation with Swagger UI
        </p>
      </div>

      {/* Loading state */}
      {!isInitialized && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading API documentation...</div>
        </div>
      )}

      {/* Swagger UI Container */}
      <div
        id="swagger-ui"
        ref={swaggerContainerRef}
        className="swagger-ui-container min-h-[600px]"
      />
    </div>
  );
}
