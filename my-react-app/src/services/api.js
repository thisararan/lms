// src/services/api.js

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Token interceptor
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

// 401 handler - auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

/* ------------------------
   Helper Functions
------------------------- */

const generateId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const requestWithFallback = async (requestFn, fallbackFn, operation = 'operation') => {
  try {
    console.log(`Attempting ${operation} via API...`);
    const result = await requestFn();
    console.log(`${operation} successful via API`);
    return result;
  } catch (error) {
    console.warn(`API ${operation} failed:`, error.response?.status, error.message);
    console.log(`Falling back to localStorage for ${operation}`);
    return await fallbackFn();
  }
};

/* ------------------------
   LocalStorage Fallbacks for Submissions
------------------------- */

const saveSubmissionToLocalStorage = (assignmentId, content, file) => {
  return new Promise((resolve) => {
    try {
      const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const newSubmission = {
        id: generateId('submission'),
        assignmentId: Number(assignmentId),
        studentId: user.id,
        studentName: user.name || user.email,
        content: content || '',
        submittedAt: new Date().toISOString(),
        status: 'SUBMITTED',
        grade: null,
        feedback: null,
      };

      if (file) {
        const fileId = generateId('file');
        newSubmission.fileId = fileId;
        newSubmission.fileName = file.name;
        newSubmission.fileSize = file.size;
        newSubmission.fileType = file.type;

        const fileUrl = URL.createObjectURL(file);
        const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
        files[fileId] = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          content: fileUrl,
          uploadedAt: new Date().toISOString(),
        };
        localStorage.setItem('uploadedFiles', JSON.stringify(files));
      }

      submissions.push(newSubmission);
      localStorage.setItem('submissions', JSON.stringify(submissions));

      resolve({
        data: newSubmission,
        status: 200,
        statusText: 'OK',
      });
    } catch (error) {
      console.error('Error saving submission to localStorage:', error);
      resolve({
        data: null,
        status: 500,
        statusText: 'LocalStorage Error',
      });
    }
  });
};

const getSubmissionsByAssignmentFromLocalStorage = (assignmentId) => {
  return new Promise((resolve) => {
    try {
      const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
      const filteredSubmissions = submissions.filter(
        (s) => String(s.assignmentId) === String(assignmentId)
      );
      resolve({ data: filteredSubmissions, status: 200, statusText: 'OK' });
    } catch (error) {
      console.error('Error fetching submissions from localStorage:', error);
      resolve({ data: [], status: 500, statusText: 'LocalStorage Error' });
    }
  });
};

const gradeSubmissionInLocalStorage = (id, grade, feedback) => {
  return new Promise((resolve) => {
    try {
      const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
      const submissionIndex = submissions.findIndex((s) => String(s.id) === String(id));

      if (submissionIndex !== -1) {
        submissions[submissionIndex].grade = Number(grade);
        submissions[submissionIndex].feedback = feedback;
        submissions[submissionIndex].gradedAt = new Date().toISOString();
        submissions[submissionIndex].status = 'GRADED';

        localStorage.setItem('submissions', JSON.stringify(submissions));

        resolve({
          data: submissions[submissionIndex],
          status: 200,
          statusText: 'OK',
        });
      } else {
        resolve({
          data: null,
          status: 404,
          statusText: 'Submission not found in localStorage',
        });
      }
    } catch (error) {
      console.error('Error grading submission in localStorage:', error);
      resolve({ data: null, status: 500, statusText: 'LocalStorage Error' });
    }
  });
};

// Helper function for teacher submissions - FIXED VERSION
const getTeacherSubmissionsFromLocalStorage = () => {
  return new Promise((resolve) => {
    try {
      const allSubmissions = JSON.parse(localStorage.getItem('submissions') || '[]');
      const allAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      console.log('Teacher Dashboard Debug:');
      console.log('Total submissions:', allSubmissions.length);
      console.log('Total assignments:', allAssignments.length);
      console.log('Current teacher ID:', user.id);

      // Get teacher's assignment IDs (supports multiple possible teacher-id fields)
      const teacherAssignmentIds = new Set(
        allAssignments
          .filter((a) => {
            const isTeacherAssignment =
              String(a.teacherId) === String(user.id) ||
              String(a.createdBy?.id) === String(user.id) ||
              String(a.instructorId) === String(user.id);

            if (isTeacherAssignment) {
              console.log(`Found teacher assignment: ${a.title} (ID: ${a.id})`);
            }

            return isTeacherAssignment;
          })
          .map((a) => String(a.id))
      );

      console.log('Teacher assignment IDs:', Array.from(teacherAssignmentIds));

      // Filter submissions for teacher's assignments and attach assignment info
      const teacherSubmissions = allSubmissions
        .filter((sub) => {
          const belongsToTeacher = teacherAssignmentIds.has(String(sub.assignmentId));

          if (belongsToTeacher) {
            console.log(
              `Found submission for assignment ${sub.assignmentId} from student ${sub.studentName}`
            );
          }

          return belongsToTeacher;
        })
        .map((sub) => {
          const assignment = allAssignments.find(
            (a) => String(a.id) === String(sub.assignmentId)
          );
          return {
            ...sub,
            assignment: assignment
              ? {
                  id: assignment.id,
                  title: assignment.title,
                  courseId: assignment.courseId,
                  dueDate: assignment.dueDate,
                  maxPoints: assignment.maxPoints,
                }
              : null,
          };
        });

      console.log('Final teacher submissions count:', teacherSubmissions.length);

      resolve({ data: teacherSubmissions, status: 200, statusText: 'OK' });
    } catch (error) {
      console.error('Error getting teacher submissions from localStorage:', error);
      resolve({ data: [], status: 500, statusText: 'LocalStorage Error' });
    }
  });
};

/* ------------------------
   API SERVICE
------------------------- */

export const apiService = {
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    registerStudent: (userData) => api.post('/auth/register', userData),
    registerTeacher: (userData) => api.post('/auth/register/teacher', userData),
    getCurrentUser: () => api.get('/auth/me'),
  },

  courses: {
    getAllCourses: () =>
      requestWithFallback(
        () => api.get('/courses'),
        () =>
          Promise.resolve({
            data: JSON.parse(localStorage.getItem('courses') || '[]'),
          }),
        'get courses'
      ),

    getCourse: (id) => api.get(`/courses/${id}`),

    createCourse: (courseData) => api.post('/courses', courseData),

    updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),

    deleteCourse: (id) => api.delete(`/courses/${id}`),

    getEnrollments: () =>
      requestWithFallback(
        () => api.get('/enrollments'),
        () =>
          Promise.resolve({
            data: JSON.parse(localStorage.getItem('enrollments') || '[]'),
          }),
        'get enrollments'
      ),

    enrollStudent: (courseId) => api.post(`/enrollments/${courseId}`),

    getEnrollmentsByCourse: (courseId) => api.get(`/enrollments/course/${courseId}`),

    getMyEnrollments: () => api.get('/enrollments/my'),
  },

  users: {
    getAllUsers: () =>
      requestWithFallback(
        () => api.get('/users'),
        () =>
          Promise.resolve({
            data: JSON.parse(localStorage.getItem('users') || '[]'),
          }),
        'get all users'
      ),

    getAllStudents: () =>
      requestWithFallback(
        () => api.get('/users/students'),
        () => {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const students = users.filter((user) => user.role === 'STUDENT');
          return Promise.resolve({ data: students });
        },
        'get all students'
      ),

    getAllStudentsWithPassword: () =>
      requestWithFallback(
        () => api.get('/users/students/with-password'),
        () => {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const students = users.filter((user) => user.role === 'STUDENT');
          const studentsWithPassword = students.map((student) => ({
            ...student,
            password: student.password || 'local-storage-password',
          }));
          return Promise.resolve({ data: studentsWithPassword });
        },
        'get all students with passwords'
      ),

    getStudentByIdWithPassword: (id) =>
      requestWithFallback(
        () => api.get(`/users/students/${id}/with-password`),
        () => {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const student = users.find(
            (user) => String(user.id) === String(id) && user.role === 'STUDENT'
          );
          if (student) {
            const studentWithPassword = {
              ...student,
              password: student.password || 'local-storage-password',
            };
            return Promise.resolve({ data: studentWithPassword });
          }
          return Promise.resolve({ data: null });
        },
        'get student by ID with password'
      ),

    getTeachers: () =>
      requestWithFallback(
        () => api.get('/users/teachers'),
        () => {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const teachers = users.filter((user) => user.role === 'TEACHER');
          return Promise.resolve({ data: teachers });
        },
        'get teachers'
      ),

    createTeacher: (teacherData) => api.post('/users/teachers', teacherData),

    createStudent: (studentData) => api.post('/users/students', studentData),

    updateStudent: (id, studentData) => api.put(`/users/students/${id}`, studentData),

    updateUser: (id, userData) => api.put(`/users/${id}`, userData),

    deleteUser: (id) => api.delete(`/users/${id}`),

    deleteStudent: (id) => api.delete(`/users/students/${id}`),

    getAdminDashboardStats: () => api.get('/users/dashboard/stats'),

    getUserById: (id) =>
      requestWithFallback(
        () => api.get(`/users/${id}`),
        () => {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const user = users.find((u) => String(u.id) === String(id));
          return Promise.resolve({ data: user || null });
        },
        'get user by ID'
      ),

    getUsersByRole: (role) =>
      requestWithFallback(
        () => api.get(`/users/role/${role}`),
        () => {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const roleUsers = users.filter((user) => user.role === role.toUpperCase());
          return Promise.resolve({ data: roleUsers });
        },
        'get users by role'
      ),

    updateUserStatus: (id, status) =>
      api.patch(`/users/${id}/status`, null, { params: { status } }),

    searchUsers: (query) =>
      requestWithFallback(
        () => api.get('/users/search', { params: { query } }),
        () => {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const filteredUsers = users.filter(
            (user) =>
              user.name?.toLowerCase().includes(query.toLowerCase()) ||
              user.email?.toLowerCase().includes(query.toLowerCase())
          );
          return Promise.resolve({ data: filteredUsers });
        },
        'search users'
      ),
  },

  assignments: {
    getAllAssignments: () =>
      requestWithFallback(
        () => api.get('/assignments'),
        () =>
          Promise.resolve({
            data: JSON.parse(localStorage.getItem('assignments') || '[]'),
          }),
        'get assignments'
      ),

    getAssignment: (id) =>
      requestWithFallback(
        () => api.get(`/assignments/${id}`),
        () => {
          const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
          const assignment = assignments.find((a) => String(a.id) === String(id));
          return Promise.resolve({ data: assignment || null });
        },
        'get assignment'
      ),

    getAssignmentsByCourse: (courseId) =>
      requestWithFallback(
        () => api.get(`/courses/${courseId}/assignments`),
        () => {
          const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
          const courseAssignments = assignments.filter(
            (a) => String(a.courseId) === String(courseId)
          );
          return Promise.resolve({ data: courseAssignments });
        },
        'get assignments by course'
      ),

    // FIXED: fallback saves assignment files to uploadedFiles
    createAssignment: async (assignmentData, file) => {
      const cleaned = assignmentData;
      return requestWithFallback(
        async () => {
          if (file) {
            const formData = new FormData();
            Object.entries(cleaned).forEach(([key, value]) => {
              formData.append(key, value);
            });
            formData.append('file', file);
            return await api.post('/assignments', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }
          return await api.post('/assignments', cleaned);
        },
        () => {
          const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
          const user = JSON.parse(localStorage.getItem('user') || '{}');

          const newAssignment = {
            id: generateId('assignment'),
            ...cleaned,
            teacherId: user.id,
            teacherName: user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'ACTIVE',
          };

          // Save attached file if exists
          if (file) {
            const fileId = generateId('file');
            const fileUrl = URL.createObjectURL(file);

            const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
            files[fileId] = {
              id: fileId,
              name: file.name,
              type: file.type,
              size: file.size,
              content: fileUrl,
              uploadedAt: new Date().toISOString(),
            };
            localStorage.setItem('uploadedFiles', JSON.stringify(files));

            newAssignment.fileId = fileId;
            newAssignment.fileName = file.name;
          }

          assignments.push(newAssignment);
          localStorage.setItem('assignments', JSON.stringify(assignments));

          return Promise.resolve({
            data: newAssignment,
            status: 200,
            statusText: 'OK',
          });
        },
        'create assignment'
      );
    },

    // FIXED: fallback updates fileId/fileName when new file attached
    updateAssignment: (id, assignmentData, file) => {
      const cleaned = assignmentData;
      return requestWithFallback(
        async () => {
          if (file) {
            const formData = new FormData();
            Object.entries(cleaned).forEach(([key, value]) => {
              formData.append(key, value);
            });
            formData.append('file', file);
            return await api.put(`/assignments/${id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }
          return await api.put(`/assignments/${id}`, cleaned);
        },
        () => {
          const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
          const assignmentIndex = assignments.findIndex(
            (a) => String(a.id) === String(id)
          );

          if (assignmentIndex !== -1) {
            assignments[assignmentIndex] = {
              ...assignments[assignmentIndex],
              ...cleaned,
              updatedAt: new Date().toISOString(),
            };

            if (file) {
              const fileId = generateId('file');
              const fileUrl = URL.createObjectURL(file);

              const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
              files[fileId] = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                content: fileUrl,
                uploadedAt: new Date().toISOString(),
              };
              localStorage.setItem('uploadedFiles', JSON.stringify(files));

              assignments[assignmentIndex].fileId = fileId;
              assignments[assignmentIndex].fileName = file.name;
            }

            localStorage.setItem('assignments', JSON.stringify(assignments));

            return Promise.resolve({
              data: assignments[assignmentIndex],
              status: 200,
              statusText: 'OK',
            });
          }

          return Promise.resolve({
            data: null,
            status: 404,
            statusText: 'Assignment not found',
          });
        },
        'update assignment'
      );
    },

    deleteAssignment: (id, courseId) => {
      return requestWithFallback(
        async () => {
          if (courseId) {
            return await api.delete(`/courses/${courseId}/assignments/${id}`);
          }
          return await api.delete(`/assignments/${id}`);
        },
        () => {
          const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
          const updatedAssignments = assignments.filter(
            (a) => String(a.id) !== String(id)
          );
          localStorage.setItem('assignments', JSON.stringify(updatedAssignments));

          return Promise.resolve({
            data: { message: 'Assignment deleted successfully' },
            status: 200,
            statusText: 'OK',
          });
        },
        'delete assignment'
      );
    },
  },

  notes: {
    getAllNotes: () =>
      requestWithFallback(
        () => api.get('/notes'),
        () =>
          Promise.resolve({
            data: JSON.parse(localStorage.getItem('notes') || '[]'),
          }),
        'get notes'
      ),

    getNote: (id) =>
      requestWithFallback(
        () => api.get(`/notes/${id}`),
        () => {
          const notes = JSON.parse(localStorage.getItem('notes') || '[]');
          const note = notes.find((n) => String(n.id) === String(id));
          return Promise.resolve({ data: note || null });
        },
        'get note'
      ),

    // FIXED: create note with file support in fallback
    createNote: async (noteData, file) => {
      return requestWithFallback(
        async () => {
          if (file) {
            const formData = new FormData();
            Object.entries(noteData).forEach(([key, value]) => {
              formData.append(key, value);
            });
            formData.append('file', file);
            return await api.post('/notes', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }
          return await api.post('/notes', noteData);
        },
        () => {
          const notes = JSON.parse(localStorage.getItem('notes') || '[]');
          const user = JSON.parse(localStorage.getItem('user') || '{}');

          const newNote = {
            id: generateId('note'),
            ...noteData,
            authorId: user.id,
            author: user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (file) {
            const fileId = generateId('file');
            const fileUrl = URL.createObjectURL(file);

            const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
            files[fileId] = {
              id: fileId,
              name: file.name,
              type: file.type,
              size: file.size,
              content: fileUrl,
              uploadedAt: new Date().toISOString(),
            };
            localStorage.setItem('uploadedFiles', JSON.stringify(files));

            newNote.fileId = fileId;
            newNote.fileName = file.name;
          }

          notes.push(newNote);
          localStorage.setItem('notes', JSON.stringify(notes));

          return Promise.resolve({
            data: newNote,
            status: 200,
            statusText: 'OK',
          });
        },
        'create note'
      );
    },

    // FIXED: update note with file support in fallback
    updateNote: (id, noteData, file) => {
      return requestWithFallback(
        async () => {
          if (file) {
            const formData = new FormData();
            Object.entries(noteData).forEach(([key, value]) => {
              formData.append(key, value);
            });
            formData.append('file', file);
            return await api.put(`/notes/${id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }
          return await api.put(`/notes/${id}`, noteData);
        },
        () => {
          const notes = JSON.parse(localStorage.getItem('notes') || '[]');
          const noteIndex = notes.findIndex((n) => String(n.id) === String(id));

          if (noteIndex !== -1) {
            notes[noteIndex] = {
              ...notes[noteIndex],
              ...noteData,
              updatedAt: new Date().toISOString(),
            };

            if (file) {
              const fileId = generateId('file');
              const fileUrl = URL.createObjectURL(file);

              const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
              files[fileId] = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                content: fileUrl,
                uploadedAt: new Date().toISOString(),
              };
              localStorage.setItem('uploadedFiles', JSON.stringify(files));

              notes[noteIndex].fileId = fileId;
              notes[noteIndex].fileName = file.name;
            }

            localStorage.setItem('notes', JSON.stringify(notes));

            return Promise.resolve({
              data: notes[noteIndex],
              status: 200,
              statusText: 'OK',
            });
          }

          return Promise.resolve({
            data: null,
            status: 404,
            statusText: 'Note not found',
          });
        },
        'update note'
      );
    },

    deleteNote: (id) => {
      return requestWithFallback(
        () => api.delete(`/notes/${id}`),
        () => {
          const notes = JSON.parse(localStorage.getItem('notes') || '[]');
          const updatedNotes = notes.filter((n) => String(n.id) !== String(id));
          localStorage.setItem('notes', JSON.stringify(updatedNotes));

          return Promise.resolve({
            data: { message: 'Note deleted successfully' },
            status: 200,
            statusText: 'OK',
          });
        },
        'delete note'
      );
    },
  },

  // SUBMISSIONS
  submissions: {
    submitAssignment: (assignmentId, content, file) => {
      const formData = new FormData();
      formData.append('content', content);
      if (file) formData.append('file', file);

      return requestWithFallback(
        () =>
          api.post(`/submissions/${assignmentId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }),
        () => saveSubmissionToLocalStorage(assignmentId, content, file),
        'submit assignment'
      );
    },

    getMySubmissions: () =>
      requestWithFallback(
        () => api.get('/submissions/my'),
        () => {
          const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const mySubs = submissions.filter(
            (s) => String(s.studentId) === String(user.id)
          );
          return Promise.resolve({ data: mySubs });
        },
        'get my submissions'
      ),

    getSubmissionsByAssignment: (assignmentId) =>
      requestWithFallback(
        () => api.get(`/submissions/assignment/${assignmentId}`),
        () => getSubmissionsByAssignmentFromLocalStorage(assignmentId),
        'get submissions by assignment'
      ),

    getTeacherSubmissions: () => {
      console.log('getTeacherSubmissions called');
      return requestWithFallback(
        () => api.get('/submissions/teacher'),
        () => getTeacherSubmissionsFromLocalStorage(),
        'get teacher submissions'
      );
    },

    gradeSubmission: (id, grade, feedback) =>
      requestWithFallback(
        () =>
          api.put(`/submissions/${id}/grade`, null, {
            params: { grade, feedback },
          }),
        () => gradeSubmissionInLocalStorage(id, grade, feedback),
        'grade submission'
      ),

    getSubmissionById: (id) => api.get(`/submissions/${id}`),
  },

  // TEACHER SECTION - uses submissions service (no circular dependency)
  teacher: {
    getAssignments: () =>
      requestWithFallback(
        () => api.get('/teacher/assignments'),
        () => {
          const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const teacherAssignments = assignments.filter(
            (a) => String(a.teacherId) === String(user.id)
          );
          return Promise.resolve({ data: teacherAssignments });
        },
        'get teacher assignments'
      ),

    getSubmissions: () => {
      console.log('teacher.getSubmissions called');
      return apiService.submissions.getTeacherSubmissions();
    },

    getNotes: () =>
      requestWithFallback(
        () => api.get('/teacher/notes'),
        () => {
          const notes = JSON.parse(localStorage.getItem('notes') || '[]');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const teacherNotes = notes.filter(
            (n) => String(n.authorId) === String(user.id)
          );
          return Promise.resolve({ data: teacherNotes });
        },
        'get teacher notes'
      ),
  },

  // File upload
  fileUpload: {
    upload: async (file) => {
      return requestWithFallback(
        async () => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return response;
        },
        async () => {
          const fileId = generateId('file');
          const fileUrl = URL.createObjectURL(file);
          const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
          files[fileId] = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: fileUrl,
            uploadedAt: new Date().toISOString(),
          };
          localStorage.setItem('uploadedFiles', JSON.stringify(files));
          return { data: { fileId, fileName: file.name, fileUrl } };
        },
        'upload file'
      );
    },
  },
};

export default apiService;