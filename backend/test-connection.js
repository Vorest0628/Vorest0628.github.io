const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://Henry:QnnhVROtHpXmTpRr@cluster0.27eleqn.mongodb.net/my_website?retryWrites=true&w=majority';

console.log('🔍 测试MongoDB连接...');
console.log('📍 连接字符串:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

const testConnection = async () => {
  try {
    console.log('🔗 尝试连接...');
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: true
    };
    
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ 连接成功！');
    
    // 测试数据库操作
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 数据库集合:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('🔒 连接已关闭');
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('🔍 错误类型:', error.name);
    console.error('🔍 错误代码:', error.code);
    
    if (error.message.includes('ETIMEDOUT')) {
      console.error('🔍 网络超时，可能是：');
      console.error('   - 防火墙阻止连接');
      console.error('   - 网络不稳定');
      console.error('   - MongoDB Atlas集群问题');
    }
  }
};

testConnection(); 