const xlsx = require('xlsx');
const path = require('path');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const bcrypt = require('bcryptjs');

/**
 * Get list of sheets from Excel file
 * @param {string} filePath - Path to Excel file
 * @returns {Array} Array of sheet names
 */
function getSheetNames(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    return workbook.SheetNames;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

/**
 * Extract batch and course from sheet name
 * @param {string} sheetName - Name of the sheet
 * @returns {Object} { batch, course } or null if cannot be determined
 */
function extractBatchAndCourseFromSheetName(sheetName) {
  // Patterns: "2023-CSE", "2023-AIML", "ASET_2024 batch", "M.tech 2024 batch"
  const patterns = [
    { regex: /(\d{4})[-_](\w+)/i, batchIndex: 1, courseIndex: 2 }, // "2023-CSE", "2023-AIML"
    { regex: /(\d{4})/i, batchIndex: 1 }, // "ASET_2024 batch" - extract year
  ];
  
  for (const pattern of patterns) {
    const match = sheetName.match(pattern.regex);
    if (match) {
      const batch = parseInt(match[pattern.batchIndex]);
      let course = null;
      
      if (pattern.courseIndex && match[pattern.courseIndex]) {
        course = match[pattern.courseIndex].toUpperCase();
      } else if (sheetName.toLowerCase().includes('m.tech') || sheetName.toLowerCase().includes('mtech')) {
        course = 'M.TECH (CSE)';
      } else if (sheetName.toLowerCase().includes('aiml')) {
        course = 'AIML';
      } else if (sheetName.toLowerCase().includes('cse')) {
        course = 'CSE';
      } else if (sheetName.toLowerCase().includes('ece')) {
        course = 'ECE';
      }
      
      if (batch && course) {
        return { batch, course };
      } else if (batch) {
        return { batch, course: null };
      }
    }
  }
  
  return null;
}

/**
 * Import students from Excel file
 * @param {string} filePath - Path to Excel file
 * @param {number} batch - Batch year (e.g., 2023, 2024)
 * @param {string} course - Course name (e.g., 'CSE', 'ECE')
 * @param {string} sheetName - Optional sheet name, if not provided uses first sheet
 * @returns {Object} Import result with stats
 */
async function importStudents(filePath, batch, course, sheetName = null) {
  try {
    const workbook = xlsx.readFile(filePath);
    const targetSheetName = sheetName || workbook.SheetNames[0];
    
    if (!workbook.SheetNames.includes(targetSheetName)) {
      return {
        success: false,
        error: `Sheet "${targetSheetName}" not found in Excel file`
      };
    }
    
    const worksheet = workbook.Sheets[targetSheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Helper function to find case-insensitive key
    const findKey = (obj, targetKey) => {
      return Object.keys(obj).find(key => {
        const normalizedKey = key.toLowerCase().trim();
        const normalizedTarget = targetKey.toLowerCase().trim();
        return normalizedKey === normalizedTarget || 
               normalizedKey.includes(normalizedTarget) || 
               normalizedKey.includes(normalizedTarget) || 
               normalizedTarget.includes(normalizedKey);
      });
    };

    // Helper function to safely get value
    const getValue = (row, key) => {
      const foundKey = findKey(row, key);
      return foundKey ? (row[foundKey] ? row[foundKey].toString().trim() : '') : '';
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Skip completely empty rows
      if (Object.values(row).every(value => !value || value.toString().trim() === '')) {
        console.log(`Skipping empty row ${i + 1}`);
        continue;
      }
      
      // Skip header rows - look for common header indicators
      const rowValues = Object.values(row).join(' ').toLowerCase();
      if (rowValues.includes('course title') || rowValues.includes('subject name') || 
          rowValues.includes('faculty name') || rowValues.includes('semester')) {
        console.log(`Skipping header row ${i + 1}: ${rowValues}`);
        continue;
      }
      
      console.log(`Processing row ${i + 1}:`, JSON.stringify(row, null, 2));
      
      try {
        // Try multiple variations of enrollment number column names
        // Support both American (ENROLLMENT) and British (ENROLMENT) spellings
        let enrollmentNo = getValue(row, 'ENROLLMENT NO') || 
                          getValue(row, 'ENROLMENT NO') ||
                          getValue(row, 'ENROLMENT NUMBER') ||
                          getValue(row, 'ENROLLMENT NUMBER') || 
                          getValue(row, 'ENROLLMENT') ||
                          getValue(row, 'ENROLMENT') ||
                          getValue(row, 'ENROLLMENTNO') ||
                          getValue(row, 'ENROLMENTNO');
        if (!enrollmentNo) {
          skipped++;
          continue;
        }

        // Try multiple variations of student name column names
        let name = getValue(row, 'STUDENT NAME') || 
                  getValue(row, 'STUDENT') ||
                  getValue(row, 'NAME') || 
                  getValue(row, 'STUDENTNAME');
        if (!name) {
          errors++;
          continue;
        }

        // IMPORTANT: Use the batch and course specified by admin during upload
        // Do NOT extract from Excel file - admin-specified values are authoritative
        const finalBatch = Number(batch);
        const finalCourse = course.toUpperCase().trim();

        // Check if student exists with same enrollment, batch, and course
        const existingStudent = await Student.findOne({ 
          enrollmentNo, 
          batch: finalBatch, 
          course: finalCourse
        });

        if (existingStudent) {
          // Update existing student
          existingStudent.name = name;
          await existingStudent.save();
          updated++;
        } else {
          // Check if student exists with same enrollment but different batch/course
          // This handles the case where old unique index might still exist
          const duplicateCheck = await Student.findOne({ enrollmentNo });
          
          if (duplicateCheck && (duplicateCheck.batch !== finalBatch || duplicateCheck.course !== finalCourse)) {
            // Student exists in different batch/course - create new entry (allowed with compound index)
            const defaultPassword = enrollmentNo;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(defaultPassword, salt);
            
            await Student.create({
              enrollmentNo,
              password: hashedPassword,
              name,
              course: finalCourse,
              batch: finalBatch,
              currentSemester: null
            });
            imported++;
            console.log(`Created student: ${enrollmentNo} - ${name} (Batch: ${finalBatch}, Course: ${finalCourse})`);
          } else {
            // Create new student
            const defaultPassword = enrollmentNo;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(defaultPassword, salt);
            
            try {
              await Student.create({
                enrollmentNo,
                password: hashedPassword,
                name,
                course: finalCourse,
                batch: finalBatch,
                currentSemester: null
              });
              imported++;
              console.log(`Created student: ${enrollmentNo} - ${name} (Batch: ${finalBatch}, Course: ${finalCourse})`);
            } catch (createError) {
              // Handle duplicate key error - might be from old index
              if (createError.code === 11000) {
                // Try to update instead
                const existing = await Student.findOne({ enrollmentNo });
                if (existing) {
                  existing.name = name;
                  existing.batch = finalBatch;
                  existing.course = finalCourse;
                  await existing.save();
                  updated++;
                  console.log(`Updated student: ${enrollmentNo} - ${name} (Batch: ${finalBatch}, Course: ${finalCourse})`);
                } else {
                  errors++;
                }
              } else {
                throw createError;
              }
            }
          }
        }
      } catch (error) {
        // Only log non-duplicate errors to avoid spam
        if (error.code !== 11000) {
          console.error(`Error processing student row:`, error.message);
        }
        errors++;
      }
    }

    return {
      success: true,
      imported,
      updated,
      skipped,
      errors,
      total: data.length
    };
  } catch (error) {
    console.error('Error importing students:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Import faculties and subjects from Excel file
 * Format: Each row represents one subject with multiple faculty columns
 * @param {string} filePath - Path to Excel file
 * @param {number} batch - Batch year (e.g., 2023, 2024)
 * @param {string} course - Course name (e.g., 'CSE', 'ECE')
 * @param {string} sheetName - Optional sheet name, if not provided uses first sheet
 * @returns {Object} Import result with stats
 */
async function importFacultiesAndSubjects(filePath, batch, course, sheetName = null) {
  try {
    const workbook = xlsx.readFile(filePath);
    const targetSheetName = sheetName || workbook.SheetNames[0];
    
    if (!workbook.SheetNames.includes(targetSheetName)) {
      return {
        success: false,
        error: `Sheet "${targetSheetName}" not found in Excel file`
      };
    }
    
    const worksheet = workbook.Sheets[targetSheetName];
    // Read Excel data with all columns
    let data = xlsx.utils.sheet_to_json(worksheet, { 
      defval: '', // Default value for empty cells
      raw: false, // Convert all values to strings
      blankrows: false, // Skip blank rows
      header: 1 // Read as array to preserve all columns
    });
    
    console.log('Raw Excel data loaded, total rows:', data.length);

    let facultiesCreated = 0;
    let subjectsCreated = 0;
    let errors = 0;
    let currentSemester = null;
    let currentSectionBatch = null;

    // Helper function to check if a row is a section header (e.g., "1st Sem 2024")
    const isSectionHeader = (row) => {
      if (!row || row.length === 0) return null;
      const firstCell = row[0] ? row[0].toString().trim() : '';
      const match = firstCell.match(/(\d+)(?:st|nd|rd|th)?\s*sem(?:ester)?\s*(\d{4})?/i);
      if (match) {
        return {
          semester: match[1],
          batch: match[2] ? parseInt(match[2]) : null
        };
      }
      return null;
    };

    // Helper function to check if a row is a column header
    const isColumnHeader = (row) => {
      if (!row || row.length === 0) return false;
      const rowStr = row.join(' ').toUpperCase();
      return rowStr.includes('COURSE CODE') || rowStr.includes('COURSE TITLE') || rowStr.includes('FACULTY');
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      if (!row || row.length === 0) continue;
      
      // Check if this is a section header
      const sectionInfo = isSectionHeader(row);
      if (sectionInfo) {
        currentSemester = sectionInfo.semester;
        if (sectionInfo.batch) {
          currentSectionBatch = sectionInfo.batch;
        }
        console.log(`Detected section: Semester ${currentSemester}${sectionInfo.batch ? ', Batch ' + sectionInfo.batch : ''}`);
        continue;
      }
      
      // Check if this is a column header row
      if (isColumnHeader(row)) {
        console.log('Detected column header row, skipping');
        continue;
      }
      
      // Skip rows that don't have enough data
      if (row.filter(cell => cell && cell.toString().trim() !== '').length < 3) {
        continue;
      }
      
      try {
        // Extract data from row (based on the Excel format in the image)
        // Columns: SL.NO, COURSE CODE, COURSE TITLE, Semester, FACULTY (multiple columns)
        const slNo = row[0] ? row[0].toString().trim() : '';
        const subjectCode = row[1] ? row[1].toString().trim() : '';
        const subjectName = row[2] ? row[2].toString().trim() : '';
        const semesterFromRow = row[3] ? row[3].toString().trim() : '';
        
        // Skip if no subject code or name
        if (!subjectCode || !subjectName) {
          continue;
        }
        
        // Determine the semester for this subject
        let semester = semesterFromRow || currentSemester;
        
        if (!semester) {
          console.warn(`Row ${i + 1}: No semester found for subject ${subjectCode}, skipping`);
          errors++;
          continue;
        }
        
        // Extract all faculty names from columns 4 onwards (index 4, 5, 6, ...)
        const facultyNames = [];
        for (let j = 4; j < row.length; j++) {
          const facultyName = row[j] ? row[j].toString().trim() : '';
          if (facultyName && 
              !facultyName.toLowerCase().includes('faculty') && 
              !facultyName.toLowerCase().includes('semester')) {
            // Remove common prefixes like "Dr.", "Mr.", "Ms." for duplicate detection
            const cleanName = facultyName.replace(/^(Dr\.|Mr\.|Ms\.|Prof\.)\s*/gi, '').trim();
            
            // Only add if not already in the list (case-insensitive check)
            if (!facultyNames.some(name => 
              name.replace(/^(Dr\.|Mr\.|Ms\.|Prof\.)\s*/gi, '').toLowerCase() === cleanName.toLowerCase()
            )) {
              facultyNames.push(facultyName);
            }
          }
        }
        
        if (facultyNames.length === 0) {
          console.warn(`Row ${i + 1}: No faculty found for subject ${subjectCode} - ${subjectName}`);
        }
        
        const finalBatch = Number(batch);
        const finalCourse = course.toUpperCase().trim();
        
        console.log(`Processing: ${subjectCode} - ${subjectName} | Semester: ${semester} | Faculties: ${facultyNames.length}`);
        
        // Find or create subject for this specific semester
        // Important: Each subject-semester combination is a separate entry
        // This allows different faculties for the same subject in different semesters
        let subject = await Subject.findOne({
          code: subjectCode,
          batch: finalBatch,
          course: finalCourse,
          semesterOptions: [semester.toString()] // Match exact semester
        });
        
        if (!subject) {
          // Check if subject exists with a different semester
          const existingSubject = await Subject.findOne({
            code: subjectCode,
            batch: finalBatch,
            course: finalCourse
          });
          
          if (existingSubject && !existingSubject.semesterOptions.includes(semester.toString())) {
            // Subject exists for different semester - create new entry for this semester
            subject = await Subject.create({
              code: subjectCode,
              name: subjectName,
              batch: finalBatch,
              course: finalCourse,
              semesterOptions: [semester.toString()],
              faculties: []
            });
            subjectsCreated++;
            console.log(`Created subject: ${subjectCode} - ${subjectName} (Semester ${semester}) - separate from other semesters`);
          } else if (!existingSubject) {
            // Brand new subject
            subject = await Subject.create({
              code: subjectCode,
              name: subjectName,
              batch: finalBatch,
              course: finalCourse,
              semesterOptions: [semester.toString()],
              faculties: []
            });
            subjectsCreated++;
            console.log(`Created subject: ${subjectCode} - ${subjectName} (Semester ${semester})`);
          } else {
            // Subject already exists for this exact semester - use it
            subject = existingSubject;
            console.log(`Using existing subject ${subjectCode} for semester ${semester}`);
          }
        } else {
          // Subject exists for this exact semester - clear faculties to avoid mixing
          subject.faculties = [];
          subject.name = subjectName; // Update name in case it changed
          await subject.save();
          console.log(`Found existing subject ${subjectCode} for semester ${semester}, cleared faculties for fresh import`);
        }
        
        // Process each faculty
        for (const facultyName of facultyNames) {
          if (!facultyName) continue;
          
          // Try to find existing faculty by name
          let faculty = await Faculty.findOne({ 
            name: { $regex: new RegExp(`^${facultyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          });
          
          if (!faculty) {
            // Generate email from faculty name
            const emailName = facultyName
              .toLowerCase()
              .replace(/^(dr\.|mr\.|ms\.|prof\.)\s*/gi, '')
              .replace(/\s+/g, '.')
              .replace(/[^a-z0-9.]/g, '');
            const generatedEmail = `${emailName}@college.edu`;
            
            // Check if email already exists
            const existingByEmail = await Faculty.findOne({ email: generatedEmail });
            
            if (existingByEmail) {
              faculty = existingByEmail;
              console.log(`Found existing faculty by email: ${facultyName}`);
            } else {
              // Create new faculty
              faculty = await Faculty.create({
                name: facultyName,
                email: generatedEmail,
                department: finalCourse,
                batches: [finalBatch],
                subjects: []
              });
              facultiesCreated++;
              console.log(`Created faculty: ${facultyName}`);
            }
          } else {
            // Update batches if needed
            if (!faculty.batches.includes(finalBatch)) {
              faculty.batches.push(finalBatch);
              await faculty.save();
            }
          }
          
          // Link faculty to subject
          if (!subject.faculties.some(f => f.equals(faculty._id))) {
            subject.faculties.push(faculty._id);
            await subject.save();
          }
          
          // Link subject to faculty
          if (!faculty.subjects.some(s => s.equals(subject._id))) {
            faculty.subjects.push(subject._id);
            await faculty.save();
          }
        }
        
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error.message);
        errors++;
      }
    }
    
    return {
      success: true,
      message: `Successfully imported ${subjectsCreated} subjects and ${facultiesCreated} faculties`,
      facultiesCreated,
      subjectsCreated,
      errors,
      total: data.length,
      batch: Number(batch),
      course: course.toUpperCase(),
      sheetName: targetSheetName
    };
    
  } catch (error) {
    console.error('Error importing faculties and subjects:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  importStudents,
  importFacultiesAndSubjects,
  getSheetNames,
  extractBatchAndCourseFromSheetName
};

