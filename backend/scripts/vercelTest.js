const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 导入用户模型
const User = require('../models/User');

async function vercelTest() {
  console.log('🚀 Vercel环境测试');
  console.log('='.repeat(50));
  
  // 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VERCEL:', process.env.VERCEL);
  console.log('DEFAULT_ADMIN_ENABLED:', process.env.DEFAULT_ADMIN_ENABLED);
  console.log('DEFAULT_ADMIN_USERNAME:', process.env.DEFAULT_ADMIN_USERNAME);
  console.log('DEFAULT_ADMIN_EMAIL:', process.env.DEFAULT_ADMIN_EMAIL);
  console.log('DEFAULT_ADMIN_PASSWORD:', process.env.DEFAULT_ADMIN_PASSWORD ? '***已设置***' : '未设置');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***已设置***' : '未设置');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI 未设置');
    return;
  }
  
  try {
    // 连接数据库
    console.log('\n🔗 连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 数据库连接成功');
    
    // 检查管理员账号
    console.log('\n🔍 检查管理员账号...');
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
    
    const adminUser = await User.findOne({ username: adminUsername }).select('+password');
    
    if (!adminUser) {
      console.log(`❌ 未找到管理员账号: ${adminUsername}`);
      
      // 如果启用了默认管理员，尝试创建
      if (process.env.DEFAULT_ADMIN_ENABLED === 'true') {
        console.log('\n🆕 尝试创建管理员账号...');
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(adminPassword, salt);
          
          const newAdmin = await User.create({
            username: adminUsername,
            email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true
          });
          
          console.log('✅ 管理员账号创建成功！');
          console.log(`   用户名: ${newAdmin.username}`);
          console.log(`   邮箱: ${newAdmin.email}`);
          console.log(`   角色: ${newAdmin.role}`);
          
        } catch (error) {
          console.error('❌ 创建管理员账号失败:', error.message);
        }
      }
    } else {
      console.log(`✅ 找到管理员账号: ${adminUser.username}`);
      console.log(`   邮箱: ${adminUser.email}`);
      console.log(`   角色: ${adminUser.role}`);
      console.log(`   状态: ${adminUser.isActive ? '激活' : '禁用'}`);
      
      // 测试密码验证
      console.log('\n🔐 测试密码验证...');
      try {
        const isPasswordCorrect = await adminUser.comparePassword(adminPassword);
        console.log(`   密码验证: ${isPasswordCorrect ? '✅ 成功' : '❌ 失败'}`);
        
        if (!isPasswordCorrect) {
          console.log('\n🔄 密码验证失败，尝试重置密码...');
          const salt = await bcrypt.genSalt(10);
          const newHash = await bcrypt.hash(adminPassword, salt);
          
          adminUser.password = newHash;
          await adminUser.save();
          
          console.log('✅ 密码已重置');
          
          // 再次测试
          const newTest = await adminUser.comparePassword(adminPassword);
          console.log(`   重置后验证: ${newTest ? '✅ 成功' : '❌ 失败'}`);
        }
        
      } catch (error) {
        console.error('❌ 密码验证错误:', error.message);
      }
    }
    
    // 列出所有用户
    console.log('\n📊 所有用户列表:');
    const allUsers = await User.find({}).select('username email role isActive');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.email}) - ${user.role} - ${user.isActive ? '激活' : '禁用'}`);
    });
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Vercel环境测试完成');
  }
}

// 运行测试
vercelTest(); 