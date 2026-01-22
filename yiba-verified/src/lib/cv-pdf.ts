/**
 * CV PDF generation for Student Profile.
 * Runs in the browser only; do not call from API routes without a server-side PDF approach.
 */

const FILENAME_BAD = /[\\/:*?"<>|]/g;

/**
 * Sanitises a string for use in a filename: replaces invalid chars and trims length.
 */
export function sanitizeForFilename(value: string, maxLength = 120): string {
  const s = value.replace(FILENAME_BAD, "-").replace(/\s+/g, " ").trim();
  return s.length > maxLength ? s.slice(0, maxLength) : s;
}

export interface GenerateCvPdfOptions {
  /** jsPDF format, e.g. 'a4'. */
  format?: "a4" | "letter";
  /** Margin in mm. */
  margin?: number;
  /** Filename (without path). Will be sanitised; .pdf is not required, we append it. */
  filename: string;
}

/**
 * Generates a PDF from an HTMLElement and triggers a download.
 * Uses html2pdf.js (html2canvas + jsPDF). Must run in the browser.
 *
 * html2canvas often returns empty/blank output when the element is off-screen
 * (e.g. position: fixed; left: -9999px). We clone the node, position the clone
 * in the viewport, capture from it, then remove it so the capture succeeds.
 */
export async function generateCvPdf(
  element: HTMLElement | null,
  options: GenerateCvPdfOptions
): Promise<void> {
  if (!element || typeof window === "undefined") return;

  // Clone and place in viewport so html2canvas can capture (it blanks off-screen elements)
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = "fixed";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.zIndex = "99999";
  clone.style.width = element.style.width || "210mm";
  clone.style.maxWidth = "210mm";
  clone.style.visibility = "visible";
  clone.style.background = "#fefdfb";
  document.body.appendChild(clone);

  // Allow one paint so layout is computed before capture
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const html2pdf = (await import("html2pdf.js")).default;
  const base = sanitizeForFilename(options.filename);
  const filename = base.endsWith(".pdf") ? base : `${base}.pdf`;

  const opt = {
    margin: options.margin ?? 10,
    filename,
    image: { type: "jpeg" as const, quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      scrollX: 0,
      scrollY: 0,
      // html2canvas cannot parse oklab/oklch (e.g. from Tailwind 4). Override all color-related
      // and color-containing properties in the clone so getComputedStyle returns only hex/rgb.
      onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
        const hex = { text: "#1c1917", border: "#e7e5e4", bg: "#fefdfb" };
        const style = clonedDoc.createElement("style");
        style.textContent = `*::before,*::after{color:${hex.text}!important;background-color:transparent!important;border-color:${hex.border}!important;box-shadow:none!important;text-shadow:none!important;background-image:none!important;}`;
        clonedDoc.head?.appendChild(style);

        function forceHexColors(el: HTMLElement, isRoot: boolean) {
          if (el.nodeType !== 1) return;
          const bg = isRoot ? hex.bg : "transparent";
          el.style.setProperty("color", hex.text, "important");
          el.style.setProperty("background-color", bg, "important");
          el.style.setProperty("background", bg, "important");
          el.style.setProperty("background-image", "none", "important");
          el.style.setProperty("border-color", hex.border, "important");
          el.style.setProperty("border-top-color", hex.border, "important");
          el.style.setProperty("border-right-color", hex.border, "important");
          el.style.setProperty("border-bottom-color", hex.border, "important");
          el.style.setProperty("border-left-color", hex.border, "important");
          el.style.setProperty("outline-color", hex.border, "important");
          el.style.setProperty("text-decoration-color", hex.text, "important");
          el.style.setProperty("-webkit-text-stroke-color", hex.border, "important");
          el.style.setProperty("box-shadow", "none", "important");
          el.style.setProperty("text-shadow", "none", "important");
          for (let i = 0; i < el.children.length; i++)
            forceHexColors(el.children[i] as HTMLElement, false);
        }
        forceHexColors(clonedElement, true);
      },
    },
    jsPDF: {
      unit: "mm" as const,
      format: options.format ?? "a4",
      orientation: "portrait" as const,
    },
    pagebreak: { mode: ["avoid-all", "css", "legacy"], before: ".html2pdf__page-break" },
  };

  try {
    await html2pdf().set(opt).from(clone).save();
  } finally {
    clone.remove();
  }
}
