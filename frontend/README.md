# Feedback System

A comprehensive feedback management system for educational institutions. This application allows students to provide feedback on faculty and courses, and enables administrators to import student data, manage faculty assignments, and generate reports.

## Project Structure

- **Frontend**: React-based TypeScript application for student and admin interfaces
- **Backend**: Node.js/Express server with MongoDB database
- **Data**: Sample data files and imports

## Prerequisites

Before running this project, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB Community Edition
- npm or yarn package manager

## Installation & Setup

### 1. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 2. Database Setup

#### Option A: Restore from Backup (Recommended)

If you have the MongoDB backup file `feedback_system_backup.archive`, restore it using:

```bash
mongorestore --archive=feedback_system_backup.archive --gzip
```

This command will:
- Extract the compressed archive
- Restore all collections to your MongoDB instance
- Preserve indexes and data integrity

#### Option B: Manual Setup

If you don't have a backup, you can import data manually:

1. Start MongoDB service
2. Run the import scripts in the backend:
   ```bash
   cd backend
   node tools/importStudents.js
   # Then import faculties and subjects via the admin dashboard
   ```

### 3. Running the Application

#### Start MongoDB
```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or run MongoDB directly
mongod
```

#### Start Backend Server
```bash
cd backend
npm start
```
The backend server will run on `http://localhost:5000` (or configured port)

#### Start Frontend Development Server
```bash
cd frontend
npm start
```
The frontend will open at `http://localhost:3000`

### 4. Access the Application

- **Student Portal**: `http://localhost:3000`
- **Admin Dashboard**: `http://localhost:3000/admin`

#### Default Admin Credentials
Use the credentials configured during setup (check backend configuration)

#### Student Login
- **Enrollment No**: Use any student enrollment number from the imported data
- **Password**: Default password is the enrollment number itself

## Available Scripts

### Frontend Scripts

In the frontend directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Key Features

### Student Features
- Student login with enrollment number
- View available subjects and faculty members
- Submit feedback for courses and faculty
- Track feedback completion status by semester
- General feedback option for overall experience

### Admin Features
- Admin dashboard with complete control
- Import student data from Excel files
- Import faculty and subject information
- View import results and statistics
- Generate consolidated feedback reports
- Manage system settings

## Database Backup & Restore

### Creating a Backup
To create a backup of your MongoDB data:
```bash
mongodump --archive=feedback_system_backup.archive --gzip
```

### Restoring from Backup
To restore from the provided backup file:
```bash
mongorestore --archive=feedback_system_backup.archive --gzip
```

**Options:**
- `--archive=filename`: Specifies the backup file path
- `--gzip`: Indicates the archive is compressed with gzip

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running (`net start MongoDB` on Windows)
- Check the connection string in `backend/src/config/db.js`
- Verify MongoDB is listening on the correct port (default: 27017)

### Import Failures
- Ensure Excel files have the required columns
- Check the admin dashboard for detailed error messages
- Verify batch year and course name format

### Frontend Port Already in Use
```bash
# Kill the process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm start
```

## Support & Documentation
For more information on Create React App, visit the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
