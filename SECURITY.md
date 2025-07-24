# 🔒 安全部署指南

本文档提供了部署前必须执行的安全检查清单，确保没有敏感信息泄露。

## 📋 部署前安全检查清单

### ✅ 环境配置安全
- [ ] 确保 `setting.env` 文件已添加到 `.gitignore`
- [ ] 创建了 `setting.env.example` 模板文件
- [ ] 所有敏感配置都通过环境变量传递
- [ ] 生产环境使用强密码和密钥（JWT_SECRET至少32字符）

### ✅ 代码安全检查
- [ ] 移除所有硬编码的敏感信息（API密钥、密码等）
- [ ] 移除硬编码的本地开发URL（localhost:3000等）
- [ ] 条件化或移除调试日志（console.log等）
- [ ] 检查代码中无测试数据包含真实敏感信息

### ✅ Git安全
- [ ] 敏感文件未被提交到版本控制
- [ ] `.gitignore` 文件配置正确
- [ ] 提交历史中无敏感信息

### ✅ 部署配置
- [ ] 配置正确的CORS域名
- [ ] 使用HTTPS连接
- [ ] 数据库连接使用安全凭据
- [ ] API密钥存储在环境变量中

## 🔧 环境变量配置

### 后端环境变量 (必需)
```env
# 数据库连接
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# JWT配置
JWT_SECRET=your-secure-32-character-jwt-secret
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3000
NODE_ENV=production

# 文件上传
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=52428800

# CORS配置
CORS_ORIGIN=https://yourdomain.com
```

### 前端环境变量 (必需)
```env
# API配置
VITE_APP_API_URL=https://your-backend-api.com/api

# 应用配置
VITE_APP_TITLE=Your Website Title
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

## 🚨 常见安全风险

### 1. 环境文件泄露
**风险**: `.env` 文件被提交到Git仓库
**解决**: 使用 `.gitignore` 排除，只提交 `.env.example`

### 2. 硬编码敏感信息
**风险**: API密钥、数据库密码写在代码中
**解决**: 全部使用环境变量

### 3. 调试信息泄露
**风险**: 生产环境显示调试日志
**解决**: 使用条件判断 `if (import.meta.env.DEV)`

### 4. CORS配置错误
**风险**: 允许所有域名访问
**解决**: 明确指定允许的域名

## 🛠️ 安全检查工具

### 检查敏感文件
```bash
# 检查是否有敏感文件被跟踪
git ls-files | grep -E "\.(env|key|pem|p12)$"

# 检查提交历史中的敏感信息
git log --all --full-history -- "*.env"
```

### 检查硬编码信息
```bash
# 检查代码中的硬编码URL
grep -r "localhost:3000" src/
grep -r "127.0.0.1" src/

# 检查可能的API密钥
grep -rE "(api_key|apikey|secret|password)" src/
```

### 检查调试信息
```bash
# 检查console.log语句
grep -r "console\." src/

# 检查alert语句
grep -r "alert(" src/
```

## 📝 部署后验证

### 1. 功能测试
- [ ] 网站正常加载
- [ ] API调用成功
- [ ] 用户认证功能正常
- [ ] 文件上传/下载功能正常

### 2. 安全测试
- [ ] 检查网络请求无敏感信息
- [ ] F12开发者工具无敏感日志
- [ ] 查看源代码无硬编码密钥
- [ ] HTTPS连接正常

### 3. 性能测试
- [ ] 页面加载速度正常
- [ ] 图片资源加载正常
- [ ] API响应时间合理

## 🆘 安全事件响应

如果发现敏感信息泄露：

1. **立即停止服务**
2. **更换所有相关密钥**
3. **清理Git历史** (如果敏感信息已提交)
4. **分析影响范围**
5. **采取补救措施**

## 📞 联系方式

如有安全问题或疑虑，请联系：
- 开发者邮箱: your-email@example.com
- 安全报告: security@your-domain.com

---

⚠️ **重要提醒**: 定期更新依赖包，修复已知安全漏洞。 