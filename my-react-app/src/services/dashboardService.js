// src/services/dashboardService.js

// Centralized dashboard service for fetching LMS data
export const dashboardService = {
  getDashboardData: async () => {
    try {
      // Load data from local storage with fallback to empty arrays/objects
      const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const courses = JSON.parse(localStorage.getItem('courses') || '[]');
      const notes = JSON.parse(localStorage.getItem('notes') || '[]');
      const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
      const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
      const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');

      // Calculate metrics
      const totalUsers = teachers.length + users.length + 1; // +1 for admin
      const totalStudents = users.filter(user => user.role === 'STUDENT').length;
      const totalTeachers = teachers.length;
      const totalCourses = courses.length;
      const totalNotes = notes.length;
      const totalAssignments = assignments.length;
      const totalSubmissions = submissions.length;
      const gradedSubmissions = submissions.filter(sub => sub.graded).length;
      const totalEnrollments = enrollments.length;
      const averageEnrollmentsPerCourse = totalCourses
        ? (totalEnrollments / totalCourses).toFixed(1)
        : 0;
      const submissionRate = totalAssignments
        ? ((totalSubmissions / totalAssignments) * 100).toFixed(1)
        : 0;
      const gradingCompletionRate = totalSubmissions
        ? ((gradedSubmissions / totalSubmissions) * 100).toFixed(1)
        : 0;

      // Return comprehensive dashboard data
      return {
        totalUsers,
        totalCourses,
        totalTeachers,
        totalStudents,
        totalAdmins: 1, // Assuming single admin for simplicity
        totalNotes,
        totalAssignments,
        totalSubmissions,
        totalEnrollments,
        gradedSubmissions,
        averageEnrollmentsPerCourse,
        submissionRate,
        gradingCompletionRate,
        users: [...teachers, ...users].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        ), // Sorted by creation date for recent users
        notes,
        lastUpdate: localStorage.getItem('dashboard_last_update') || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return fallback data to prevent dashboard crashes
      return {
        totalUsers: 0,
        totalCourses: 0,
        totalTeachers: 0,
        totalStudents: 0,
        totalAdmins: 1,
        totalNotes: 0,
        totalAssignments: 0,
        totalSubmissions: 0,
        totalEnrollments: 0,
        gradedSubmissions: 0,
        averageEnrollmentsPerCourse: 0,
        submissionRate: 0,
        gradingCompletionRate: 0,
        users: [],
        notes: [],
        lastUpdate: new Date().toISOString()
      };
    }
  },

  // Teacher-specific dashboard data
  getTeacherDashboardData: async (teacherId) => {
    try {
      const courses = JSON.parse(localStorage.getItem('courses') || '[]');
      const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
      const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
      const notes = JSON.parse(localStorage.getItem('notes') || '[]');
      const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');

      // Filter courses assigned to the teacher
      const teacherCourses = courses.filter(course => course.instructorId === teacherId);
      const courseIds = teacherCourses.map(c => c.id);

      // Calculate teacher-specific metrics
      const totalCourses = teacherCourses.length;
      const totalAssignments = assignments.filter(a => a.teacherId === teacherId).length;
      const totalSubmissions = submissions.filter(s => courseIds.includes(s.courseId)).length;
      const pendingSubmissions = submissions.filter(
        s => courseIds.includes(s.courseId) && !s.graded
      ).length;
      const totalNotes = notes.filter(n => n.authorId === teacherId).length;
      const totalStudents = enrollments.filter(e => courseIds.includes(e.courseId)).length;

      return {
        courses: teacherCourses,
        totalCourses,
        totalAssignments,
        totalSubmissions,
        pendingSubmissions,
        totalNotes,
        totalStudents,
        lastUpdate: localStorage.getItem('dashboard_last_update') || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching teacher dashboard data:', error);
      return {
        courses: [],
        totalCourses: 0,
        totalAssignments: 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        totalNotes: 0,
        totalStudents: 0,
        lastUpdate: new Date().toISOString()
      };
    }
  }
};

// Function to trigger dashboard refresh
export const triggerDashboardRefresh = () => {
  try {
    if (typeof window !== 'undefined') {
      const currentTime = new Date().toISOString();
      localStorage.setItem('dashboard_last_update', currentTime);
      window.dispatchEvent(new Event('dashboardRefresh'));
    }
  } catch (error) {
    console.error('Error triggering dashboard refresh:', error);
  }
};