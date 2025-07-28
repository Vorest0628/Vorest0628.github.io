const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../setting.env' });

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

async function ensureAdminAccount() {
  console.log('🔍 检查默认管理员账号...');
  
  // 检查环境变量是否启用默认管理员
  const adminEnabled = process.env.DEFAULT_ADMIN_ENABLED === 'true';
  
  if (!adminEnabled) {
    console.log('⚠️ 默认管理员账号功能已禁用 (DEFAULT_ADMIN_ENABLED=false)');
    console.log('💡 如需启用，请设置环境变量: DEFAULT_ADMIN_ENABLED=true');
    return;
  }

  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';

  console.log(`📋 默认管理员配置:`);
  console.log(`   用户名: ${adminUsername}`);
  console.log(`   邮箱: ${adminEmail}`);
  console.log(`   密码: ${adminPassword}`);

  try {
    // 检查是否已存在管理员账号
    const existingAdmin = await User.findOne({
      $or: [
        { username: adminUsername },
        { email: adminEmail }
      ]
    });

    if (existingAdmin) {
      console.log('✅ 管理员账号已存在');
      
      // 检查是否需要更新密码
      const isPasswordCorrect = await bcrypt.compare(adminPassword, existingAdmin.password);
      
      if (!isPasswordCorrect) {
        console.log('🔄 更新管理员密码...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        
        existingAdmin.password = hashedPassword;
        await existingAdmin.save();
        console.log('✅ 管理员密码已更新');
      } else {
        console.log('✅ 管理员密码正确，无需更新');
      }
      
      console.log(`📊 管理员账号信息:`);
      console.log(`   ID: ${existingAdmin._id}`);
      console.log(`   用户名: ${existingAdmin.username}`);
      console.log(`   邮箱: ${existingAdmin.email}`);
      console.log(`   角色: ${existingAdmin.role}`);
      console.log(`   状态: ${existingAdmin.isActive ? '激活' : '禁用'}`);
      
    } else {
      console.log('🆕 创建默认管理员账号...');
      
      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // 创建管理员账号
      const adminUser = await User.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      console.log('✅ 默认管理员账号创建成功！');
      console.log(`📊 账号信息:`);
      console.log(`   ID: ${adminUser._id}`);
      console.log(`   用户名: ${adminUser.username}`);
      console.log(`   邮箱: ${adminUser.email}`);
      console.log(`   角色: ${adminUser.role}`);
      console.log(`   状态: ${adminUser.isActive ? '激活' : '禁用'}`);
      console.log('');
      console.log('🔐 请使用以下凭据登录:');
      console.log(`   用户名: ${adminUsername}`);
      console.log(`   密码: ${adminPassword}`);
      console.log('');
      console.log('⚠️ 安全提醒:');
      console.log('   1. 登录后请立即修改密码');
      console.log('   2. 建议禁用默认管理员功能 (设置 DEFAULT_ADMIN_ENABLED=false)');
      console.log('   3. 定期更换管理员密码');
    }
    
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error.message);
    
    if (error.code === 11000) {
      console.log('💡 提示: 用户名或邮箱已存在，请检查环境变量配置');
    }
  }
}

async function main() {
  console.log('🚀 检查默认管理员账号');
  console.log('='.repeat(50));
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ 请在环境变量中设置 MONGODB_URI');
    process.exit(1);
  }

  await connectDB();

  try {
    await ensureAdminAccount();
    
    console.log('='.repeat(50));
    console.log('✅ 管理员账号检查完成！');
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// 只在直接运行脚本时执行
if (require.main === module) {
  main();
}

module.exports = { ensureAdminAccount };