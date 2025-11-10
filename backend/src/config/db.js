const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/feedback_system';
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('\n⚠️  Please ensure MongoDB is running:');
    console.error('   1. Open PowerShell as Administrator');
    console.error('   2. Run: Start-Service -Name MongoDB');
    console.error('   OR start manually: mongod --dbpath "C:\\data\\db"');
    console.error('\n   Alternatively, set MONGODB_URI environment variable for MongoDB Atlas\n');
    // Don't exit - let the server start but API calls will fail until MongoDB is connected
    // process.exit(1);
  }
};

module.exports = connectDB;
