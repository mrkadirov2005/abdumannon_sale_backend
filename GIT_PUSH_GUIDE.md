# Git Push Guide

## Step-by-Step Process

### 1. **Check Current Status**
```bash
git status
```
This shows what files have been changed, added, or deleted.

### 2. **Pull Latest Changes First** (Important!)
Since your branch is behind, you need to pull first:
```bash
git pull origin main
```
This updates your local branch with remote changes.

### 3. **Add All Changes**
```bash
# Add all changes (modified, deleted, and new files)
git add .

# OR add specific files
git add src/pages/Profile/
git add src/redux/slices/settings/
```

### 4. **Commit Your Changes**
```bash
git commit -m "Your commit message here"
```
Example messages:
- "Integrate shop settings into profile page"
- "Add superuser-only shop settings restriction"
- "Remove unnecessary settings panels"

### 5. **Push to Remote**
```bash
git push origin main
```

## Complete Workflow Example

```bash
# 1. Check status
git status

# 2. Pull latest changes
git pull origin main

# 3. Add all changes
git add .

# 4. Commit
git commit -m "Integrate shop settings into profile, restrict to superusers only"

# 5. Push
git push origin main
```

## If You Get Conflicts

If `git pull` shows conflicts:
1. Git will mark conflicted files
2. Open those files and resolve conflicts (look for `<<<<<<<`, `=======`, `>>>>>>>`)
3. After resolving, run:
   ```bash
   git add .
   git commit -m "Resolve merge conflicts"
   git push origin main
   ```

## Useful Commands

- `git status` - See what's changed
- `git diff` - See detailed changes
- `git log` - See commit history
- `git pull` - Get latest changes from remote
- `git push` - Send your changes to remote

