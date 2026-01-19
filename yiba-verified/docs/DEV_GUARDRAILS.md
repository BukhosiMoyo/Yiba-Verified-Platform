# Development Guardrails

This document outlines the project structure, conventions, and common pitfalls to avoid when working on this codebase.

## Project Structure

- **Code Root**: `src/` directory
- **TypeScript Alias**: `@/*` maps to `./src/*`
- **UI Components**: All shadcn/ui components live in `src/components/ui/`

## Import Alias Rules

### ✅ CORRECT Usage

```typescript
// ✅ Correct: Use @/ prefix (maps to src/)
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";
```

### ❌ INCORRECT Usage

```typescript
// ❌ WRONG: Never use @/src/ (resolves to src/src/...)
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
```

**Why?** The alias `@/*` already maps to `./src/*`, so using `@/src/` would resolve to `src/src/...`, causing module resolution errors.

## TypeScript Configuration

The project uses `tsconfig.json` with:
- `baseUrl: "."`
- `paths: { "@/*": ["./src/*"] }`

**Never modify these settings** unless you understand the full implications. If you need to add new aliases, ensure they follow the same pattern.

## UI Components (shadcn/ui)

### Component Location
All UI primitives must be in `src/components/ui/`:
- `button.tsx`
- `card.tsx`
- `table.tsx`
- `sheet.tsx`
- `scroll-area.tsx`
- `input.tsx`
- `label.tsx`
- `badge.tsx`
- `separator.tsx`
- etc.

### Adding New Components
1. Use shadcn/ui CLI: `npx shadcn@latest add [component-name]`
2. Or manually create in `src/components/ui/` following shadcn patterns
3. Always use `@/lib/utils` for the `cn()` utility
4. Use `"use client"` directive only when required (e.g., Sheet, ScrollArea)

### Component Dependencies
Required packages (already in `package.json`):
- `class-variance-authority` - for variant props
- `clsx` - for conditional classes
- `tailwind-merge` - for merging Tailwind classes
- `@radix-ui/*` packages - for accessible primitives

## Common Errors & Fixes

### Error: "Cannot find module '@/src/lib/utils'"

**Cause**: Using `@/src/` instead of `@/`

**Fix**: Replace `@/src/` with `@/` in all imports
```bash
# Search for all occurrences
grep -r "@/src/" src/

# Fix each file manually or use find/replace
```

### Error: "Module not found: Can't resolve '@/components/ui/button'"

**Cause**: Missing shadcn/ui component

**Fix**: 
1. Check if component exists in `src/components/ui/button.tsx`
2. If missing, add it: `npx shadcn@latest add button`
3. Or create manually following shadcn patterns

### Error: "Cannot find module 'class-variance-authority'"

**Cause**: Missing dependency

**Fix**: Install the package
```bash
npm install class-variance-authority clsx tailwind-merge
```

### Error: "Cannot find module '@radix-ui/react-*'"

**Cause**: Missing Radix UI dependency

**Fix**: Install the specific Radix package
```bash
npm install @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-scroll-area @radix-ui/react-slot
```

### Error: Build fails with "Module resolution" errors

**Checklist**:
1. ✅ Verify `tsconfig.json` has correct `baseUrl` and `paths`
2. ✅ Ensure no `@/src/` imports exist (use `@/` instead)
3. ✅ Verify all imported components exist in `src/components/ui/`
4. ✅ Run `npm install` to ensure all dependencies are installed
5. ✅ Clear `.next` cache: `rm -rf .next` and rebuild

## Best Practices

1. **Always use `@/` alias** for imports from `src/`
2. **Never use `@/src/`** - it's redundant and breaks resolution
3. **Keep UI components in `src/components/ui/`** - don't create them elsewhere
4. **Use relative imports** only for files in the same directory or immediate parent
5. **Run `npm run dev`** after making changes to catch errors early
6. **Check build output** - Next.js will show module resolution errors clearly

## Verification Commands

```bash
# Check for incorrect @/src/ imports
grep -r "@/src/" src/ middleware.ts

# Verify all UI components exist
ls -la src/components/ui/

# Check TypeScript config
cat tsconfig.json | grep -A 2 "paths"

# Verify dependencies
npm list class-variance-authority clsx tailwind-merge
```

## Quick Reference

| Import Type | Example | Resolves To |
|------------|---------|-------------|
| Alias (correct) | `@/lib/utils` | `src/lib/utils` |
| Alias (wrong) | `@/src/lib/utils` | `src/src/lib/utils` ❌ |
| Relative | `./utils` | Same directory |
| Relative parent | `../components/Button` | Parent directory |

---

**Last Updated**: After fixing alias issues and setting up shadcn/ui foundation
**Maintainer**: Lead Engineer
