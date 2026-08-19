import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// 1. Base API එක හදමු
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor (Token එක Autoම Add කරන්න)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (401 Unauthorized -> Logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// 4. AUTH APIs
// ============================================
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// ============================================
// 5. COURSE APIs
// ============================================
export const courseAPI = {
  create: (data) => api.post('/courses', data),
  getAll: () => api.get('/courses'),
  getApproved: () => api.get('/courses/approved'),
  getEnrolled: (studentId) => api.get(`/courses/enrolled/student/${studentId}`),
  submit: (courseId) => api.post(`/courses/${courseId}/submit`),
  approve: (courseId) => api.post(`/courses/${courseId}/approve`),
  reject: (courseId, reason) => api.post(`/courses/${courseId}/reject?reason=${reason}`),
  enroll: (courseId, studentId) => api.post(`/courses/${courseId}/enroll/student/${studentId}`),
  getEnrollments: (courseId) => api.get(`/courses/${courseId}/enrollments`),
  getByLecturer: (lecturerId) => api.get(`/courses/lecturer/${lecturerId}`),
  getCoursesByLecturer: (lecturerId) => api.get(`/courses/lecturer/${lecturerId}`),
  getLecturerCourses: (lecturerId) => api.get(`/courses/lecturer/${lecturerId}`),
};



// ============================================
// 6. INSTITUTE APIs
// ============================================
export const instituteAPI = {
  create: (data) => api.post('/institutes', data),
  getAll: () => api.get('/institutes'),
  getById: (id) => api.get(`/institutes/${id}`),
  updateStatus: (id, status) => api.patch(`/institutes/${id}/status?status=${status}`),
  getPublic: () => api.get('/auth/institutes'),
};

// ============================================
// 7. MODULE APIs (NEW - get with lessons)
// ============================================
export const moduleAPI = {
  create: (data) => api.post('/modules', data),
  getByCourse: (courseId) => api.get(`/modules/course/${courseId}`),
  delete: (moduleId) => api.delete(`/modules/${moduleId}`),
};

// ============================================
// 8. LESSON APIs
// ============================================
export const lessonAPI = {
  create: (data) => api.post('/lessons', data),
  getByModule: (moduleId) => api.get(`/lessons/module/${moduleId}`),
  getPublished: (moduleId) => api.get(`/lessons/module/${moduleId}/published`),
};

// ============================================
// 9. ASSIGNMENT APIs (UPDATED)
// ============================================
export const assignmentAPI = {
  create: (data) => api.post('/assignments', data),
  getByCourse: (courseId) => api.get(`/assignments/course/${courseId}`),
  getById: (assignmentId) => api.get(`/assignments/${assignmentId}`), // 👈 NEW
  submit: (assignmentId, studentId, data) => 
    api.post(`/assignments/${assignmentId}/submit/student/${studentId}`, data),
  grade: (submissionId, lecturerId, data) => 
    api.post(`/assignments/submissions/${submissionId}/grade/lecturer/${lecturerId}`, data),
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
  getStudentSubmissions: (studentId) => api.get(`/assignments/student/${studentId}`),
};

// ============================================
// 10. QUIZ APIs (UPDATED)
// ============================================
export const quizAPI = {
  create: (data) => api.post('/quizzes', data),
  getByCourse: (courseId) => api.get(`/quizzes/course/${courseId}`),
  getById: (quizId) => api.get(`/quizzes/${quizId}`), // 👈 NEW
  getQuestions: (quizId) => api.get(`/quizzes/${quizId}/questions`), // 👈 NEW
  addQuestion: (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data),
  submit: (quizId, studentId, data) => 
    api.post(`/quizzes/${quizId}/submit/student/${studentId}`, data),
  getStudentResults: (studentId) => api.get(`/quizzes/student/${studentId}`),
  getAttemptResult: (attemptId) => api.get(`/quizzes/attempt/${attemptId}/result`), // 👈 NEW
};

// ============================================
// 11. PROGRESS APIs (NEW)
// ============================================
export const progressAPI = {
  completeLesson: (lessonId, studentId) => 
    api.post(`/progress/lesson/${lessonId}/complete/student/${studentId}`),
  getStudentProgress: (studentId, courseId) => 
    api.get(`/progress/student/${studentId}/course/${courseId}`),
  getLessonStatus: (studentId, lessonId) => 
    api.get(`/progress/student/${studentId}/lesson/${lessonId}`), // 👈 NEW
};

// ============================================
// 12. ATTENDANCE APIs
// ============================================
export const attendanceAPI = {
  mark: (courseId, date, lecturerId, data) => 
    api.post(`/attendance/mark?courseId=${courseId}&date=${date}&lecturerId=${lecturerId}`, data),
  getSummary: (studentId, courseId) => 
    api.get(`/attendance/summary/student/${studentId}/course/${courseId}`),
  getStudentAll: (studentId) => api.get(`/attendance/student/${studentId}`),
  getByCourseDate: (courseId, date) => 
    api.get(`/attendance/course/${courseId}/date/${date}`),
};

// ============================================
// 13. FEE APIs
// ============================================
export const feeAPI = {
  generate: (studentId, courseId, amount) => 
    api.post(`/fees/generate?studentId=${studentId}&courseId=${courseId}&amount=${amount}`),
  getStudentFees: (studentId) => api.get(`/fees/student/${studentId}`),
  getStudentCourseFee: (studentId, courseId) => 
    api.get(`/fees/student/${studentId}/course/${courseId}`),
  recordPayment: (feeId, amount, paidBy, method) => 
    api.post(`/fees/payment?feeId=${feeId}&amount=${amount}&paidBy=${paidBy}&method=${method}`),
  getPayments: (studentId) => api.get(`/fees/payments/student/${studentId}`),
};

// ============================================
// 14. NOTIFICATION APIs
// ============================================
export const notificationAPI = {
  getUserNotifications: (userId) => api.get(`/notifications/user/${userId}`),
  getUnread: (userId) => api.get(`/notifications/user/${userId}/unread`),
  getUnreadCount: (userId) => api.get(`/notifications/user/${userId}/unread/count`),
  markAsRead: (notificationId, userId) => 
    api.put(`/notifications/${notificationId}/read/user/${userId}`),
  delete: (notificationId, userId) => 
    api.delete(`/notifications/${notificationId}/user/${userId}`),
};

// ============================================
// 15. ANNOUNCEMENT APIs
// ============================================
export const announcementAPI = {
  create: (data) => api.post('/announcements', data),
  getInstitute: () => api.get('/announcements/institute'),
  getCourse: (courseId) => api.get(`/announcements/course/${courseId}`),
  getGlobal: () => api.get('/announcements/global'),
};

// ============================================
// 16. DASHBOARD APIs
// ============================================
export const dashboardAPI = {
  getStudent: (studentId) => api.get(`/dashboard/student/${studentId}`),
  getLecturer: (lecturerId) => api.get(`/dashboard/lecturer/${lecturerId}`),
  getInstitute: (instituteId) => api.get(`/dashboard/institute/${instituteId}`),
  getSystemAdmin: () => api.get('/dashboard/system-admin'),
  getParent: (parentId) => api.get(`/dashboard/parent/${parentId}`),
};

// ============================================
// 17. PARENT STUDENT APIs
// ============================================
export const parentStudentAPI = {
  getChildren: (parentId) => api.get(`/parent/children/${parentId}`),
  link: (parentId, studentId) => 
    api.post(`/parent/student?parentId=${parentId}&studentId=${studentId}`),
};

// ============================================
// 18. USER APIs
// ============================================
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
  getStudents: (instituteId) => {
    if (instituteId && instituteId !== 0) {
      return api.get(`/users/institute/${instituteId}/students`);
    }
    return api.get('/users/students');
  },
  getAllStudents: () => api.get('/users/students'),
  getLecturers: (instituteId) => api.get(`/users/institute/${instituteId}/lecturers`),
  approveUser: (userId) => api.put(`/users/${userId}/approve`),
  rejectUser: (userId) => api.put(`/users/${userId}/reject`),
  updateUserStatus: (userId, status) => api.put(`/users/${userId}/status?status=${status}`),
  getPendingUsers: () => api.get('/users/pending'),
  getPendingUsersByInstitute: (instituteId) => api.get(`/users/institute/${instituteId}/pending`),
};

// ============================================
// 19. AUDIT LOG APIs
// ============================================
export const auditLogAPI = {
  getAll: () => api.get('/audit-logs'),
  getByUser: (userId) => api.get(`/audit-logs/user/${userId}`),
  getByAction: (action) => api.get(`/audit-logs/action/${action}`),
};

// ============================================
// 20. ENROLLMENT APIs (NEW)
// ============================================
export const enrollmentAPI = {
  getByStudent: (studentId) => api.get(`/enrollments/student/${studentId}`),
  getByCourse: (courseId) => api.get(`/enrollments/course/${courseId}`),
  checkStatus: (studentId, courseId) => 
    api.get(`/enrollments/student/${studentId}/course/${courseId}`),
};

// ============================================
// 21. STUDENT APIs (NEW)
// ============================================
export const studentAPI = {
  getDashboard: (studentId) => api.get(`/students/${studentId}/dashboard`),
  getCourses: (studentId) => api.get(`/students/${studentId}/courses`),
};
