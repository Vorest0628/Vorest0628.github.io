const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 导入用户模型
const User = require('../models/User');

async function debugVercelLogin() {
  console.log('🔍 Vercel登录问题调试');
  console.log('='.repeat(50));
  
  // 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('DEFAULT_ADMIN_ENABLED:', process.env.DEFAULT_ADMIN_ENABLED);
  console.log('DEFAULT_ADMIN_USERNAME:', process.env.DEFAULT_ADMIN_USERNAME);
  console.log('DEFAULT_ADMIN_EMAIL:', process.env.DEFAULT_ADMIN_EMAIL);
  console.log('DEFAULT_ADMIN_PASSWORD:', process.env.DEFAULT_ADMIN_PASSWORD ? '***已设置***' : '未设置');
  
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
    
    // 获取环境变量中的管理员信息
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
    
    console.log(`\n🔍 查找管理员账号: ${adminUsername}`);
    
    // 查找用户（包含密码字段）
    const adminUser = await User.findOne({ username: adminUsername }).select('+password');
    
    if (!adminUser) {
      console.log(`❌ 未找到用户: ${adminUsername}`);
      
      // 尝试通过邮箱查找
      console.log(`\n🔍 尝试通过邮箱查找: ${adminEmail}`);
      const emailUser = await User.findOne({ email: adminEmail }).select('+password');
      
      if (!emailUser) {
        console.log(`❌ 也未找到邮箱用户: ${adminEmail}`);
        
        // 列出所有用户
        console.log('\n📊 数据库中的所有用户:');
        const allUsers = await User.find({}).select('username email role isActive');
        if (allUsers.length === 0) {
          console.log('   ❌ 数据库中没有用户');
        } else {
          allUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username} (${user.email}) - ${user.role} - ${user.isActive ? '激活' : '禁用'}`);
          });
        }
        
        // 如果启用了默认管理员，尝试创建
        if (process.env.DEFAULT_ADMIN_ENABLED === 'true') {
          console.log('\n🆕 尝试创建管理员账号...');
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
            
            console.log('✅ 管理员账号创建成功！');
            console.log(`   用户名: ${newAdmin.username}`);
            console.log(`   邮箱: ${newAdmin.email}`);
            console.log(`   角色: ${newAdmin.role}`);
            console.log(`   密码哈希: ${newAdmin.password.substring(0, 20)}...`);
            
            // 测试密码验证
            const testResult = await newAdmin.comparePassword(adminPassword);
            console.log(`   密码验证测试: ${testResult ? '✅ 成功' : '❌ 失败'}`);
            
          } catch (error) {
            console.error('❌ 创建管理员账号失败:', error.message);
            if (error.code === 11000) {
              console.log('💡 用户名或邮箱已存在，请检查数据库');
            }
          }
        }
      } else {
        console.log(`✅ 找到邮箱用户: ${emailUser.username}`);
        console.log(`   邮箱: ${emailUser.email}`);
        console.log(`   角色: ${emailUser.role}`);
        console.log(`   状态: ${emailUser.isActive ? '激活' : '禁用'}`);
        
        // 测试密码验证
        console.log('\n🔐 测试密码验证...');
        try {
          const isPasswordCorrect = await emailUser.comparePassword(adminPassword);
          console.log(`   密码验证: ${isPasswordCorrect ? '✅ 成功' : '❌ 失败'}`);
          
          if (!isPasswordCorrect) {
            console.log('\n🔄 密码验证失败，尝试重置密码...');
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(adminPassword, salt);
            
            emailUser.password = newHash;
            await emailUser.save();
            
            console.log('✅ 密码已重置');
            
            // 再次测试
            const newTest = await emailUser.comparePassword(adminPassword);
            console.log(`   重置后验证: ${newTest ? '✅ 成功' : '❌ 失败'}`);
          }
          
        } catch (error) {
          console.error('❌ 密码验证错误:', error.message);
        }
      }
    } else {
      console.log(`✅ 找到用户: ${adminUser.username}`);
      console.log(`   邮箱: ${adminUser.email}`);
      console.log(`   角色: ${adminUser.role}`);
      console.log(`   状态: ${adminUser.isActive ? '激活' : '禁用'}`);
      console.log(`   密码哈希: ${adminUser.password.substring(0, 20)}...`);
      
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
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ 调试完成');
  }
}

// 运行调试
debugVercelLogin(); 