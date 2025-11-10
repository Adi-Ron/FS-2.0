const mongoose = require('mongoose');
const connectDB = require('../config/db');

/**
 * Fix database indexes - remove old unique index on enrollmentNo
 * and ensure compound index is in place
 */
async function fixIndexes() {
  try {
    await connectDB();
    
    const Student = require('../models/Student');
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Drop old unique index on enrollmentNo if it exists
    try {
      await collection.dropIndex('enrollmentNo_1');
      console.log('✓ Dropped old enrollmentNo_1 index');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('✓ Old enrollmentNo_1 index does not exist (already removed)');
      } else {
        console.error('Error dropping index:', error);
      }
    }
    
    // Ensure compound index exists
    try {
      await Student.collection.createIndex(
        { enrollmentNo: 1, batch: 1, course: 1 },
        { unique: true, name: 'enrollmentNo_batch_course_1' }
      );
      console.log('✓ Created compound unique index on (enrollmentNo, batch, course)');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('✓ Compound index already exists');
      } else {
        console.error('Error creating index:', error);
      }
    }
    
    // Verify final indexes
    const finalIndexes = await collection.indexes();
    console.log('\nFinal indexes:', finalIndexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique
    })));
    
    console.log('\n✓ Index fix completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixIndexes();
}

module.exports = fixIndexes;

