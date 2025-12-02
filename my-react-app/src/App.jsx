import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import './components/common/Footer';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './styles/App.css';
import './styles/MoodleTheme.css';

// Import components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import MySubmissions from './components/student/MySubmissions';

// Auth components
import AdminLogin from './components/auth/AdminLogin';
import StudentLogin from './components/auth/StudentLogin';
import StudentRegister from './components/auth/StudentRegister';
import TeacherLogin from './components/auth/TeacherLogin';

// Management components
import CourseManagement from './components/admin/CourseManagement';
import TeacherManagement from './components/admin/TeacherManagement';
import StudentManagement from './components/admin/StudentManagement'; // ✅ Add this import
import NotesManagement from './components/management/NotesManagement';
import AssignmentManagement from './components/management/AssignmentManagement';

// Course components
import CourseList from './components/course/CourseList';
import CourseDetail from './components/course/CourseDetail';

// Profile and Settings
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App d-flex flex-column min-vh-100 w-100">
          <Navbar />
          <main className="flex-grow-1 w-100 d-flex flex-column">
            <div className="container-fluid px-0 flex-grow-1">
              <div className="container py-4">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/student-login" element={<StudentLogin />} />
                  <Route path="/student-register" element={<StudentRegister />} />
                  <Route path="/teacher-login" element={<TeacherLogin />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  
                  {/* Protected Student Routes */}
                  <Route path="/courses" element={
                    <ProtectedRoute requiredRole="STUDENT">
                      <div className="w-100">
                        <CourseList />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/courses/:id" element={
                    <ProtectedRoute requiredRole="STUDENT">
                      <div className="w-100">
                        <CourseDetail />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/notes" element={
                    <ProtectedRoute requiredRole="STUDENT">
                      <div className="w-100">
                        <NotesManagement />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <div className="w-100">
                        <Profile />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <div className="w-100">
                        <Settings />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/my-submissions" element={
                    <ProtectedRoute requiredRole="STUDENT">
                      <MySubmissions />
                    </ProtectedRoute>
                  } />

                  {/* Protected Teacher Routes */}
                  <Route path="/teacher/dashboard" element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <div className="w-100">
                        <TeacherDashboard />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/teacher/notes" element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <div className="w-100">
                        <NotesManagement />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/teacher/assignments" element={
                    <ProtectedRoute requiredRole="TEACHER">
                      <div className="w-100">
                        <AssignmentManagement />
                      </div>
                    </ProtectedRoute>
                  } />

                  {/* Protected Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <div className="w-100">
                        <AdminDashboard />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/courses" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <div className="w-100">
                        <CourseManagement />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/teachers" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <div className="w-100">
                        <TeacherManagement />
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/students" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <div className="w-100">
                        <StudentManagement />
                      </div>
                    </ProtectedRoute>
                  } />

                  {/* 404 Page */}
                  <Route path="*" element={
                    <div className="text-center py-5">
                      <h1>404 - Page Not Found</h1>
                      <p>The page you're looking for doesn't exist.</p>
                      <a href="/" className="btn btn-primary">Go Home</a>
                    </div>
                  } />
                </Routes>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;