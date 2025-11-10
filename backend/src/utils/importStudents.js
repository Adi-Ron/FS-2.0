const xlsx = require('xlsx');
const path = require('path');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

async function importStudentsFromExcel() {
    try {
        const workbook = xlsx.readFile(path.join(__dirname, '../../DATA/studentlist.xlsx'));
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        for (const row of data) {
            const enrollmentNo = row['ENROLLMENT NO'].toString();
            const defaultPassword = enrollmentNo; // Using enrollment number as default password

            // Check if student already exists
            const existingStudent = await Student.findOne({ enrollmentNo });
            if (!existingStudent) {
                // Hash the password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(defaultPassword, salt);

                // Create new student
                await Student.create({
                    enrollmentNo,
                    password: hashedPassword,
                    name: row['STUDENT NAME'],
                    course: row['NOT'], // 'NOT' column contains the program/course
                    currentSemester: null // This will be set when student first logs in
                });
            }
        }
        console.log('Students imported successfully');
    } catch (error) {
        console.error('Error importing students:', error);
    }
}

module.exports = importStudentsFromExcel;