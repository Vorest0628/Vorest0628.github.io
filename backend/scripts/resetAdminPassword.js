const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './setting.env' });

// 导入用户模型
const User = require('../models/User');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 已连接到MongoDB');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    process.exit(1);
  }
}

async function resetAdminPassword() {
  console.log('🔧 开始重置管理员密码...');
  
  try {
    // 查找管理员用户
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('❌ 未找到管理员用户，正在创建...');
      
      // 创建新的管理员用户
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      await newAdmin.save();
      console.log('✅ 已创建新的管理员用户');
      console.log('📧 用户名: admin');
      console.log('🔑 密码: admin123');
      console.log('📧 邮箱: admin@example.com');
      
    } else {
      console.log(`✅ 找到管理员用户: ${adminUser.username}`);
      
      // 重置密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      adminUser.password = hashedPassword;
      await adminUser.save();
      
      console.log('✅ 管理员密码已重置');
      console.log('📧 用户名:', adminUser.username);
      console.log('🔑 新密码: admin123');
      console.log('📧 邮箱:', adminUser.email);
    }
    
    console.log('\n🎉 重置完成！请使用新密码登录，然后立即修改密码。');
    
  } catch (error) {
    console.error('❌ 重置密码失败:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// 运行脚本
if (require.main === module) {
  connectDB().then(resetAdminPassword);
}

module.exports = { resetAdminPassword }; 