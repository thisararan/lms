// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import NavbarComponent from './components/common/NavbarComponent';
import Footer from './components/common/Footer';
import CourseList from './components/course/CourseList';
import StudentLogin from './components/auth/StudentLogin';
import StudentRegister from './components/auth/StudentRegister';
import AdminLogin from './components/auth/AdminLogin';
import TeacherLogin from './components/auth/TeacherLogin';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App d-flex flex-column min-vh-100">
          <NavbarComponent />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={<CourseList />} />
              <Route path="/courses" element={<CourseList />} />
              <Route path="/student-login" element={<StudentLogin />} />
              <Route path="/student-register" element={<StudentRegister />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/teacher-login" element={<TeacherLogin />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;