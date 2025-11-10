require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const subjectsRoutes = require('./routes/subjects');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const importRoutes = require('./routes/import');

const app = express();
// Ensure port is 5000 unless explicitly set in environment
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

connectDB();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/import', importRoutes);

app.get('/', (req, res) => res.send('Feedback backend running'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
