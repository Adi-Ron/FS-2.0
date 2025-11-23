import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // For FormData, let axios/browser handle Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export const subjects = {
  getAll: () => api.get('/api/subjects'),
  getByYear: (year: number) => api.get(`/api/subjects/year/${year}`),
  getBySemester: (semester: number) => api.get(`/api/subjects/semester/${semester}`),
};

export const faculty = {
  getAll: () => api.get('/api/subjects/faculty'),
  getBySubject: (subjectId: string) => api.get(`/api/subjects/subject/${subjectId}`),
};

export const auth = {
  studentLogin: (data: { enrollmentNo: string; password: string }) =>
    api.post('/api/auth/student-login', data),
  adminLogin: (data: { username: string; password: string }) =>
    api.post('/api/auth/admin-login', data),
};

export const student = {
  updateSemester: (semester: number) => 
    api.put('/api/student/update-semester', { semester }),
  getDetails: () => 
    api.get('/api/student/details'),
  getAvailableSemesters: () =>
    api.get('/api/student/available-semesters'),
  importStudents: () =>
    api.post('/api/auth/import-students'),
};

export const feedback = {
  submit: (data: any) => api.post('/api/feedback', data),
  completeSemester: (semester: number) => api.post('/api/feedback/complete-semester', { semester }),
  getFacultyFeedback: (facultyId: string, subjectId?: string) => api.get(`/api/feedback/faculty/${facultyId}`, { params: { subjectId } }),
  getStudentFeedback: (studentId: string, semester?: string) => api.get(`/api/feedback/student/${studentId}`, { params: { semester } }),
  getConsolidatedReport: (params?: { subjectId?: string; facultyId?: string }) => api.get('/api/feedback/consolidated', { params }),
};

export const admin = {
  importData: (type: 'students' | 'faculties-subjects', formData: FormData) => {
    return api.post(`/api/import/${type}`, formData);
  },
  getSheetNames: (formData: FormData) => {
    return api.post('/api/import/sheets', formData);
  },
  getFaculties: (params: { batch: number; course: string; semester?: number }) =>
    api.get('/api/admin/faculties', { params }),
  getFacultyReport: (params: { batch: number; course: string; semester?: number; facultyId?: string }) => 
    api.get('/api/admin/faculty-report', { params }),
  getFacultyBatchReport: (params: { course: string; semester?: number }) =>
    api.get('/api/admin/faculty-batch-report', { params }),
  getStudentReport: (params: { batch: number; course: string }) => 
    api.get('/api/admin/student-report', { params }),
  getGeneralFeedbackReport: (params: { batch: number; course: string }) =>
    api.get('/api/admin/general-feedback-report', { params }),
};

export default api;