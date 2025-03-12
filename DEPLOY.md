# 部署指南

## 部署到GitHub Pages

1. 在GitHub上创建新仓库
   - 访问 https://github.com/new
   - 填写仓库名称（例如：online-lottery）
   - 选择公开（Public）
   - 不要初始化仓库（不要添加README、.gitignore等文件）
   - 点击"Create repository"

2. 初始化本地Git仓库并推送代码
   ```bash
   # 初始化Git仓库
   git init

   # 添加所有文件到暂存区
   git add .

   # 创建初始提交
   git commit -m "初始化提交"

   # 添加远程仓库（将URL替换为你的GitHub仓库地址）
   git remote add origin https://github.com/你的用户名/你的仓库名.git

   # 推送代码到main分支
   git push -u origin main
   ```

3. 配置GitHub Pages
   - 访问你的GitHub仓库
   - 点击"Settings"
   - 在左侧菜单中找到"Pages"
   - 在"Branch"部分，选择"Deploy from a branch"
   - 在下拉菜单中选择"main"，点击"Save"
   - 等待几分钟后，你的网站将会部署在：
     https://你的用户名.github.io/你的仓库名