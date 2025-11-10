const PDFDocument = require('pdfkit');

const generateFeedbackPDF = (feedback) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(16).text('Student Feedback Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Student Name: ${feedback.studentName || (feedback.student && feedback.student.name) || ''}`);
      doc.text(`Enrollment: ${feedback.enrollment}`);
      doc.text(`Year: ${feedback.year || ''}`);
      doc.text(`Semester: ${feedback.semester || ''}`);
      doc.text(`Subject: ${feedback.subjectName || (feedback.subject && feedback.subject.name) || ''}`);
      doc.text(`Faculty: ${feedback.facultyName || (feedback.faculty && feedback.faculty.name) || ''}`);
      doc.moveDown();

      // Questions and answers
      doc.fontSize(12).text('Responses:', { underline: true });
      doc.moveDown(0.5);

      if (feedback.notApplicable) {
        doc.text('Marked as Not Applicable by student');
      } else if (feedback.answers && feedback.answers.length) {
        feedback.answers.forEach((a, i) => {
          doc.text(`${i + 1}. ${a.question} — ${a.rating}`);
          doc.moveDown(0.2);
        });
      } else {
        doc.text('No answers provided');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateFeedbackPDF };
