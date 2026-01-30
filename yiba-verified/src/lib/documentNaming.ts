/**
 * Document naming suggestion service
 * Suggests proper filenames for documents based on section, qualification, and document type
 */

export interface DocumentNamingContext {
  documentType: string;
  sectionName: string;
  sectionNumber: number;
  qualificationTitle?: string;
  saqaId?: string;
  curriculumCode?: string;
}

/**
 * Suggest a filename for a document based on context
 */
export function suggestDocumentName(context: DocumentNamingContext): string {
  const { documentType, sectionName, sectionNumber, qualificationTitle, saqaId, curriculumCode } = context;
  
  // Clean document type for filename
  const cleanDocType = documentType
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .toUpperCase();
  
  // Get section abbreviation
  const sectionAbbr = `S${sectionNumber}`;
  
  // Build filename parts
  const parts: string[] = [];
  
  // Add qualification identifier if available
  if (saqaId) {
    parts.push(`SAQA${saqaId.replace(/[^a-zA-Z0-9]/g, "")}`);
  } else if (curriculumCode) {
    parts.push(curriculumCode.replace(/[^a-zA-Z0-9]/g, "_"));
  }
  
  // Add section
  parts.push(sectionAbbr);
  
  // Add document type
  parts.push(cleanDocType);
  
  // Add timestamp for uniqueness (optional - can be removed if not needed)
  // const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
  // parts.push(timestamp);
  
  // Join and ensure it's not too long
  let filename = parts.join("_");
  
  // Limit length (max 100 chars before extension)
  if (filename.length > 100) {
    filename = filename.substring(0, 100);
  }
  
  return filename;
}

/**
 * Check if a filename matches the suggested pattern
 */
export function isFilenameSimilar(userFilename: string, suggestedFilename: string): boolean {
  // Remove extensions and compare
  const userBase = userFilename.replace(/\.[^/.]+$/, "").toUpperCase();
  const suggestedBase = suggestedFilename.replace(/\.[^/.]+$/, "").toUpperCase();
  
  // Check if they share significant parts
  const userParts = userBase.split(/[_\-\s]+/);
  const suggestedParts = suggestedBase.split(/[_\-\s]+/);
  
  // If more than 50% of parts match, consider them similar
  const matchingParts = userParts.filter((part) => 
    suggestedParts.some((sPart) => sPart.includes(part) || part.includes(sPart))
  );
  
  return matchingParts.length / Math.max(userParts.length, suggestedParts.length) > 0.5;
}

/**
 * Format document type for display
 */
export function formatDocumentType(documentType: string): string {
  return documentType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
