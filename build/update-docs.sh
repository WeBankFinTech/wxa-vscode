# Prepare
cd docs
rm -rf .vuepress/dist

# Build
npx vuepress build

# Publish to GitHub Pages
cd .vuepress/dist
git init
git add -A
git commit -m '[vuepress] update docs'
git push -f git@github.com:wxajs/wxa-vscode.git master:gh-pages

# Cleanup
cd ../..
rm -rf .vuepress/dist
