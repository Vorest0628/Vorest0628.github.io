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
  console.log('🔐 重置管理员账号密码');
  console.log('='.repeat(50));
  
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
  
  console.log(`📋 重置配置:`);
  console.log(`   用户名: ${adminUsername}`);
  console.log(`   新密码: ${adminPassword}`);
  
  await connectDB();
  
  try {
    // 查找管理员账号
    const adminUser = await User.findOne({ username: adminUsername });
    
    if (!adminUser) {
      console.log(`❌ 未找到用户: ${adminUsername}`);
      console.log('💡 请先创建管理员账号');
      return;
    }
    
    console.log(`✅ 找到用户: ${adminUser.username} (${adminUser.email})`);
    console.log(`   当前角色: ${adminUser.role}`);
    console.log(`   当前状态: ${adminUser.isActive ? '激活' : '禁用'}`);
    
    // 生成新的密码哈希
    console.log('\n🔄 生成新密码哈希...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // 更新密码
    adminUser.password = hashedPassword;
    await adminUser.save();
    
    console.log('✅ 密码重置成功！');
    console.log(`   新密码哈希: ${hashedPassword.substring(0, 20)}...`);
    
    // 验证新密码
    console.log('\n🔐 验证新密码...');
    const isPasswordCorrect = await adminUser.comparePassword(adminPassword);
    console.log(`   密码验证: ${isPasswordCorrect ? '✅ 成功' : '❌ 失败'}`);
    
    if (isPasswordCorrect) {
      console.log('\n🎉 管理员账号密码重置完成！');
      console.log('📋 登录信息:');
      console.log(`   用户名: ${adminUsername}`);
      console.log(`   密码: ${adminPassword}`);
      console.log('\n⚠️ 安全提醒:');
      console.log('   1. 请立即使用新密码登录');
      console.log('   2. 登录后建议修改密码');
      console.log('   3. 生产环境请使用强密码');
    } else {
      console.log('❌ 密码验证失败，请检查配置');
    }
    
  } catch (error) {
    console.error('❌ 重置密码失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ 操作完成');
  }
}

// 运行重置
resetAdminPassword(); 