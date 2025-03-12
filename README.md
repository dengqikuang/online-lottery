# 在线抽奖工具

一个简单易用的在线抽奖工具，支持Excel和CSV格式的参与者名单。

## 功能特点

- 支持上传 .xlsx 和 .csv 格式的参与者名单
- 提供Excel和CSV模板下载
- 自定义中奖人数
- 实时显示中奖结果
- 保存历史中奖记录
- 优雅的动画效果

## 在线使用

访问 GitHub Pages 部署的在线版本：[在线抽奖工具](https://[username].github.io/[repository])

## 本地使用

1. 克隆仓库：
```bash
git clone https://github.com/[username]/[repository].git
```

2. 进入项目目录：
```bash
cd [repository]
```

3. 使用任意HTTP服务器启动项目，例如：
```bash
python -m http.server 8000
```

4. 在浏览器中访问：`http://localhost:8000`

## 使用说明

1. 下载Excel或CSV模板文件
2. 按模板格式填写参与者名单
3. 上传填写好的名单文件
4. 设置本次抽奖的中奖人数
5. 点击"开始抽奖"按钮

## 技术栈

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- XLSX.js
- Animate.css
- Confetti.js

## License

MIT