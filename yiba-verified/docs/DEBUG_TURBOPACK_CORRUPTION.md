# Debug Prompt: Turbopack Cache Corruption Issue

## Problem
Turbopack is experiencing persistent cache corruption errors:
- `Persisting failed: Unable to write SST file 00004158.sst`
- `No such file or directory (os error 2)`
- `Failed to restore task data (corrupted database or bug)`
- Missing build manifest files in `.next/dev/server/app/`

## Investigation Steps

### 1. Check Current State
- [ ] Verify all cache directories are cleared: `.next`, `.turbo`, `node_modules/.cache`
- [ ] Check if multiple dev servers are running simultaneously
- [ ] Verify disk space is available
- [ ] Check file permissions on project directory

### 2. Identify Root Cause
- [ ] Is the dev server being interrupted (Ctrl+C) while building?
- [ ] Are there file system watchers or antivirus interfering?
- [ ] Is there a race condition with multiple processes?
- [ ] Check Next.js version compatibility with Turbopack

### 3. Check System Resources
- [ ] Verify available disk space: `df -h`
- [ ] Check inode usage: `df -i`
- [ ] Verify file system permissions on project directory
- [ ] Check if any processes are locking files

### 4. Test Solutions

#### Solution A: Disable Turbopack Persistent Caching (Current)
- Already implemented in `next.config.ts`
- Test if this resolves the issue

#### Solution B: Disable Turbopack Entirely (Use Webpack)
- Run: `npm run dev -- --webpack`
- Or use the script: `npm run dev:webpack`
- Test if Webpack build works without errors

#### Solution C: Clear All Caches More Aggressively
```bash
# Stop all Node processes
pkill -9 node

# Remove all cache directories
rm -rf .next .turbo node_modules/.cache .swc

# Clear npm cache
npm cache clean --force

# Reinstall dependencies (if needed)
rm -rf node_modules
npm install
```

#### Solution D: Check for File System Issues
- Verify the project directory is on a stable file system (not network drive, not corrupted)
- Check for symlinks that might cause issues
- Verify no special characters in file paths

#### Solution E: Update Next.js
- Check if there's a newer version that fixes Turbopack issues
- Consider downgrading if latest version is buggy

### 5. Debug Commands

```bash
# Check for running Next.js processes
ps aux | grep "next dev"

# Check disk space
df -h .

# Check file permissions
ls -la .next 2>/dev/null || echo "No .next directory"

# Find any remaining SST files
find . -name "*.sst" -type f 2>/dev/null

# Check Next.js version
npx next --version

# Try building with verbose output
npm run dev 2>&1 | tee build.log
```

### 6. Alternative Workarounds

#### Option 1: Use Webpack Instead
- Run: `npm run dev -- --webpack`
- Or use: `npm run dev:webpack` (already added to package.json)
- Use this for development until Turbopack is stable

#### Option 2: Increase Node Memory
- Add to `package.json`: `"dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"`

#### Option 3: Use Production Build for Testing
- Run `npm run build` then `npm run start` instead of `npm run dev`

### 7. Check for Known Issues
- [ ] Search Next.js GitHub issues for "Turbopack SST corruption"
- [ ] Check Next.js version release notes for known Turbopack bugs
- [ ] Verify Node.js version compatibility

### 8. File System Checks
```bash
# Check if directory is writable
touch .next/test-write && rm .next/test-write && echo "Writable" || echo "Not writable"

# Check for file system errors
fsck /dev/diskX  # (macOS - adjust disk identifier)

# Check inode usage
df -i .
```

### 9. Environment Variables
Check if any environment variables are affecting the build:
- `TURBO_TOKEN`
- `NEXT_TELEMETRY_DISABLED`
- `NODE_ENV`

### 10. Final Verification
After applying fixes:
- [ ] Restart dev server completely
- [ ] Verify no errors in console
- [ ] Test navigation (check for href undefined errors)
- [ ] Verify QCTO invites page loads
- [ ] Check that all routes work correctly

## Expected Outcome
After debugging:
- Dev server starts without Turbopack errors
- All pages load correctly
- No missing build manifest errors
- Navigation works without href undefined errors

## If Issue Persists
1. Document exact error messages and stack traces
2. Note Next.js version: `npx next --version`
3. Note Node.js version: `node --version`
4. Note operating system and version
5. Check Next.js GitHub issues and create new issue if needed
6. Consider temporarily using Webpack (`--webpack` or `npm run dev:webpack`) until fix is available
