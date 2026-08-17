import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentCourses from './pages/StudentCourses';
import CourseDetails from './pages/CourseDetails';
import StudentAssignments from './pages/StudentAssignments';

// 👇 Student Pages
import QuizAttempt from './pages/student/QuizAttempt';
import StudentQuizzes from './pages/student/StudentQuizzes';
import StudentResults from './pages/student/StudentResults';

// 👇 Lecturer Pages
import LecturerGrading from './pages/lecturer/LecturerGrading';
import LecturerQuizzes from './pages/lecturer/LecturerQuizzes';
import LecturerCreateCourse from './pages/lecturer/LecturerCreateCourse';
import LecturerCourses from './pages/lecturer/LecturerCourses';


// 👇 NEW: Admin Pages (Institute Admin)
import AdminStudents from './pages/admin/AdminStudents';
import AdminLecturers from './pages/admin/AdminLecturers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminReports from './pages/admin/AdminReports';

// -------- Protected Route Component --------
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* -------- Public Routes -------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* -------- Protected Routes -------- */}

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Courses */}
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <StudentCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute>
                <StudentCourses />
              </ProtectedRoute>
            }
          />

          {/* Course Details */}
          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            }
          />

          {/* Student Assignments */}
          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <StudentAssignments />
              </ProtectedRoute>
            }
          />

          {/* Student Quizzes */}
          <Route
            path="/student/quizzes"
            element={
              <ProtectedRoute>
                <StudentQuizzes />
              </ProtectedRoute>
            }
          />

          {/* Student Quiz Attempt */}
          <Route
            path="/student/quiz/:quizId"
            element={
              <ProtectedRoute>
                <QuizAttempt />
              </ProtectedRoute>
            }
          />

          {/* Student Results */}
          <Route
            path="/student/results"
            element={
              <ProtectedRoute>
                <StudentResults />
              </ProtectedRoute>
            }
          />

          {/* Lecturer Grading */}
          <Route
            path="/lecturer/grading"
            element={
              <ProtectedRoute>
                <LecturerGrading />
              </ProtectedRoute>
            }
          />

          {/* Lecturer Quizzes */}
          <Route
            path="/lecturer/quizzes"
            element={
              <ProtectedRoute>
                <LecturerQuizzes />
              </ProtectedRoute>
            }
          />

          {/* 👇 NEW: Admin Routes (Institute Admin) */}
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute>
                <AdminStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lecturers"
            element={
              <ProtectedRoute>
                <AdminLecturers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute>
                <AdminCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          {/* Lecturer Create Course */}
          <Route 
            path="/lecturer/create-course" 
            element={
              <ProtectedRoute>
                <LecturerCreateCourse />
              </ProtectedRoute>
            } 
          />

          {/* Lecturer Courses List */}
          <Route 
            path="/lecturer/courses" 
            element={
              <ProtectedRoute>
                <LecturerCourses />
              </ProtectedRoute>
            } 
          />


          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;