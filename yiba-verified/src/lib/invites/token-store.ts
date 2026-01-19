// Token Store
// Temporarily stores raw tokens for invite link generation
// In production, use Redis or encrypted database storage

interface TokenEntry {
  tokenHash: string;
  rawToken: string;
  expiresAt: Date;
}

// In-memory store (for development)
// In production, use Redis or encrypted database
const tokenStore = new Map<string, TokenEntry>();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = new Date();
  for (const [hash, entry] of tokenStore.entries()) {
    if (entry.expiresAt < now) {
      tokenStore.delete(hash);
    }
  }
}, 10 * 60 * 1000);

/**
 * Store a raw token temporarily
 */
export function storeToken(tokenHash: string, rawToken: string, ttlHours: number = 168): void {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);
  
  tokenStore.set(tokenHash, {
    tokenHash,
    rawToken,
    expiresAt,
  });
}

/**
 * Get raw token by hash
 */
export function getRawToken(tokenHash: string): string | null {
  const entry = tokenStore.get(tokenHash);
  if (!entry) {
    return null;
  }
  
  if (entry.expiresAt < new Date()) {
    tokenStore.delete(tokenHash);
    return null;
  }
  
  return entry.rawToken;
}

/**
 * Delete a token entry
 */
export function deleteToken(tokenHash: string): void {
  tokenStore.delete(tokenHash);
}
