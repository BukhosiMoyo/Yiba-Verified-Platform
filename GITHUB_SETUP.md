# Push this project to GitHub

Git is initialized and all files are staged. Follow these steps to push to GitHub.

## 1. Set your Git identity (if not already set)

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

## 2. Create the initial commit

```bash
cd "/Users/maxx/Projects/Yiba Verified"
git commit -m "Initial commit: Yiba Verified platform"
```

## 3. Create a new repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Choose a name (e.g. `yiba-verified`)
3. Leave **Initialize with README** unchecked (you already have one)
4. Create the repository

## 4. Add the remote and push

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

If you use SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

After this, use `git add`, `git commit`, and `git push` as usual.
