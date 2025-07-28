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

async function testAdminAccount() {
  console.log('🔍 测试管理员账号功能');
  console.log('='.repeat(50));
  
  // 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('DEFAULT_ADMIN_ENABLED:', process.env.DEFAULT_ADMIN_ENABLED);
  console.log('DEFAULT_ADMIN_USERNAME:', process.env.DEFAULT_ADMIN_USERNAME);
  console.log('DEFAULT_ADMIN_EMAIL:', process.env.DEFAULT_ADMIN_EMAIL);
  console.log('DEFAULT_ADMIN_PASSWORD:', process.env.DEFAULT_ADMIN_PASSWORD ? '***已设置***' : '未设置');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***已设置***' : '未设置');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI 未设置');
    return;
  }

  await connectDB();

  try {
    // 检查现有用户
    console.log('\n📊 现有用户列表:');
    const users = await User.find({}).select('username email role isActive');
    if (users.length === 0) {
      console.log('   ❌ 数据库中没有用户');
    } else {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.email}) - ${user.role} - ${user.isActive ? '激活' : '禁用'}`);
      });
    }

    // 检查管理员账号
    console.log('\n🔍 检查管理员账号:');
    const adminUsers = await User.find({ role: 'admin' });
    if (adminUsers.length === 0) {
      console.log('   ❌ 没有找到管理员账号');
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.username} (${admin.email}) - ${admin.isActive ? '激活' : '禁用'}`);
      });
    }

    // 测试创建管理员账号
    console.log('\n🆕 测试创建管理员账号:');
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';

    // 检查是否已存在
    const existingAdmin = await User.findOne({
      $or: [
        { username: adminUsername },
        { email: adminEmail }
      ]
    });

    if (existingAdmin) {
      console.log(`   ✅ 管理员账号已存在: ${existingAdmin.username}`);
      
      // 测试密码验证
      console.log('\n🔐 测试密码验证:');
      try {
        const isPasswordCorrect = await existingAdmin.comparePassword(adminPassword);
        console.log(`   使用环境变量密码验证: ${isPasswordCorrect ? '✅ 正确' : '❌ 错误'}`);
      } catch (error) {
        console.log(`   ❌ 密码验证失败: ${error.message}`);
      }
      
      // 测试直接bcrypt比较
      try {
        if (existingAdmin.password) {
          const directCompare = await bcrypt.compare(adminPassword, existingAdmin.password);
          console.log(`   直接bcrypt比较: ${directCompare ? '✅ 正确' : '❌ 错误'}`);
          console.log(`   当前密码哈希: ${existingAdmin.password.substring(0, 20)}...`);
        } else {
          console.log(`   ❌ 密码字段为空`);
        }
      } catch (error) {
        console.log(`   ❌ bcrypt比较失败: ${error.message}`);
      }
      
    } else {
      console.log(`   ❌ 管理员账号不存在: ${adminUsername}`);
      
      // 尝试创建
      console.log('\n🆕 尝试创建管理员账号:');
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        
        const newAdmin = await User.create({
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          isActive: true
        });
        
        console.log(`   ✅ 管理员账号创建成功: ${newAdmin.username}`);
        console.log(`   密码哈希: ${newAdmin.password.substring(0, 20)}...`);
        
      } catch (error) {
        console.error(`   ❌ 创建失败: ${error.message}`);
        if (error.code === 11000) {
          console.log('   💡 用户名或邮箱已存在');
        }
      }
    }

    // 测试登录流程
    console.log('\n🔐 测试登录流程:');
    const testUser = await User.findOne({ username: adminUsername }).select('+password');
    if (testUser) {
      console.log(`   找到用户: ${testUser.username}`);
      console.log(`   用户角色: ${testUser.role}`);
      console.log(`   用户状态: ${testUser.isActive ? '激活' : '禁用'}`);
      console.log(`   密码字段: ${testUser.password ? '存在' : '不存在'}`);
      
      if (testUser.password) {
        const loginTest = await testUser.comparePassword(adminPassword);
        console.log(`   密码验证: ${loginTest ? '✅ 成功' : '❌ 失败'}`);
      }
    } else {
      console.log(`   ❌ 未找到用户: ${adminUsername}`);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ 测试完成');
  }
}

// 运行测试
testAdminAccount(); 