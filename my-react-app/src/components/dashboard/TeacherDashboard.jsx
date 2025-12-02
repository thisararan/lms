import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

// Validation helper function
const validateAssignmentForm = (form) => {
  const errors = [];
  
  if (!form.title || form.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!form.description || form.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!form.courseId) {
    errors.push('Course is required');
  }
  
  if (!form.dueDate) {
    errors.push('Due date is required');
  } else {
    const dueDate = new Date(form.dueDate);
    const now = new Date();
    if (dueDate < now) {
      errors.push('Due date must be in the future');
    }
  }
  
  if (!form.maxPoints || form.maxPoints < 1 || form.maxPoints > 1000) {
    errors.push('Max points must be between 1 and 1000');
  }
  
  if (form.file && form.file.size > 10 * 1024 * 1024) {
    errors.push('File size must be less than 10MB');
  }
  
  return errors;
};

const TeacherDashboard = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState({
    teacher: {},
    courses: [],
    coursesCount: 0,
    studentsCount: 0,
    message: 'Loading your dashboard...'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [lastUpdate, setLastUpdate] = useState('01:55 PM +0530, Thursday, November 13, 2025');
  const [refreshCount, setRefreshCount] = useState(0);
  const [dataSource, setDataSource] = useState('API');
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [showViewAssignmentModal, setShowViewAssignmentModal] = useState(false);
  const [showViewNoteModal, setShowViewNoteModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAssignmentSubmissionsModal, setShowAssignmentSubmissionsModal] = useState(false);

  const [assignmentForm, setAssignmentForm] = useState({
    id: '', title: '', description: '', dueDate: '', maxPoints: 100, courseId: '', file: null, fileName: ''
  });

  const [noteForm, setNoteForm] = useState({
    id: '', title: '', content: '', courseId: '', file: null, fileName: '', visibility: 'COURSE'
  });

  const [gradeForm, setGradeForm] = useState({
    submissionId: '',
    grade: '',
    feedback: '',
    maxPoints: 100
  });

  const [viewAssignment, setViewAssignment] = useState(null);
  const [viewNote, setViewNote] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [studentNotifications, setStudentNotifications] = useState({});

  // Helper to get default course name
  const getDefaultCourseName = () => {
    return user?.subject || 'Unknown Course';
  };

  // Check if note belongs to current teacher
  const isMyNote = (note) => {
    return String(note.authorId) === String(user.id);
  };

  const calculateStudentCount = async (courses) => {
    if (!courses.length) return 0;

    try {
      const res = await apiService.courses.getEnrollments();
      const enrollments = res.data || [];

      return courses.reduce((total, course) => {
        return total + enrollments.filter(e => e.courseId === course.id).length;
      }, 0);
    } catch {
      const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
      return courses.reduce((total, course) => {
        return total + enrollments.filter(e => e.courseId === course.id).length;
      }, 0);
    }
  };

  /* ------------------------------
     FIXED DATA LOADING FUNCTIONS
  -------------------------------*/

  // Load teacher courses FIRST
  const loadTeacherCourses = async () => {
    try {
      console.log('🔄 Loading teacher courses...');
      let allCourses = [];

      try {
        const res = await apiService.courses.getAllCourses();
        allCourses = res.data || [];
        console.log('✅ Loaded courses from API:', allCourses.length);
      } catch (e) {
        console.warn('⚠️ API failed, using localStorage');
        allCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        console.log('📦 Loaded courses from localStorage:', allCourses.length);
      }

      const teacherSubject = user.subject?.trim();
      let assignedCourses = [];

      // First try: Match by subject name
      if (teacherSubject) {
        assignedCourses = allCourses.filter(course =>
          course.title?.trim() === teacherSubject
        );
        console.log(`Found ${assignedCourses.length} courses matching subject: ${teacherSubject}`);
      }

      // Second try: Match by teacher ID / name
      if (assignedCourses.length === 0) {
        assignedCourses = allCourses.filter(course =>
          String(course.teacherId) === String(user.id) ||
          String(course.teacher) === String(user.id) ||
          course.teacherName === user.name
        );
        console.log(`Found ${assignedCourses.length} courses by teacher ID/name`);
      }

      const studentsCount = await calculateStudentCount(assignedCourses);

      setDashboardData(prev => ({
        ...prev,
        courses: assignedCourses,
        coursesCount: assignedCourses.length,
        studentsCount,
        message: assignedCourses.length > 0
          ? `You are teaching: ${assignedCourses.map(c => c.title).join(', ')}`
          : 'No courses assigned. Contact admin.'
      }));

      console.log('✅ Courses loaded successfully:', assignedCourses);
      return assignedCourses;
      
    } catch (err) {
      console.error('❌ Error loading courses:', err);
      setDashboardData(prev => ({
        ...prev,
        courses: [],
        coursesCount: 0,
        studentsCount: 0,
        message: 'Error loading courses.'
      }));
      return [];
    }
  };

  // Load assignments using courses list
  const loadAssignments = async (courses) => {
    try {
      console.log('🔄 Loading assignments...');
      console.log('Courses available:', courses.length);
      
      let assigns = [];
      
      // Try localStorage FIRST
      try {
        assigns = JSON.parse(localStorage.getItem('assignments') || '[]');
        console.log('📦 Loaded from localStorage:', assigns.length, 'assignments');
      } catch (localErr) {
        console.error('localStorage error:', localErr);
      }

      // Try API as backup if nothing in local
      if (assigns.length === 0) {
        try {
          const res = await apiService.assignments.getAllAssignments();
          assigns = res.data || [];
          console.log('✅ Loaded from API:', assigns.length, 'assignments');
        } catch (apiErr) {
          console.warn('⚠️ API failed:', apiErr.message);
        }
      }
      
      const courseIds = courses.map(c => c.id);
      console.log('Teacher course IDs:', courseIds);

      // Filter assignments for this teacher
      const filteredAssignments = assigns.filter(a => {
        const isTeacherAssignment = (
          String(a.teacherId) === String(user.id) || 
          String(a.createdBy?.id) === String(user.id) ||
          String(a.instructorId) === String(user.id) ||
          courseIds.includes(String(a.courseId))
        );
        
        if (isTeacherAssignment) {
          console.log(`✅ Assignment "${a.title}" belongs to teacher`);
        }
        
        return isTeacherAssignment;
      });

      // Add course names to assignments
      const assignmentsWithCourses = filteredAssignments.map(assignment => {
        const course = courses.find(c => String(c.id) === String(assignment.courseId));
        return {
          ...assignment,
          courseName: course?.title || user.subject || 'Unknown Course'
        };
      });

      console.log('📊 Final assignments:', assignmentsWithCourses.length);
      setAssignments(assignmentsWithCourses);
      
    } catch (err) {
      console.error('❌ Error loading assignments:', err);
      setAssignments([]);
    }
  };

  // Load submissions filtered by teacher's courses/assignments
  const loadSubmissions = async (courses) => {
    try {
      console.log('🔄 Loading submissions...');
      console.log('Courses available:', courses.length);
      
      // Use localStorage for submissions
      const allSubmissions = JSON.parse(localStorage.getItem('submissions') || '[]');
      const allAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
      
      console.log('📦 Total submissions in system:', allSubmissions.length);
      console.log('📦 Total assignments in system:', allAssignments.length);

      const courseIds = courses.map(c => c.id);

      // Get teacher's assignment IDs
      const teacherAssignmentIds = new Set(
        allAssignments
          .filter(a => {
            const isTeacherAssignment = (
              String(a.teacherId) === String(user.id) ||
              String(a.createdBy?.id) === String(user.id) ||
              courseIds.includes(String(a.courseId))
            );
            
            if (isTeacherAssignment) {
              console.log(`✅ Teacher assignment: ${a.title} (ID: ${a.id})`);
            }
            
            return isTeacherAssignment;
          })
          .map(a => String(a.id))
      );

      console.log('Teacher assignment IDs:', Array.from(teacherAssignmentIds));

      // Filter submissions for teacher's assignments + attach assignment info
      const teacherSubmissions = allSubmissions
        .filter(sub => {
          const belongsToTeacher = teacherAssignmentIds.has(String(sub.assignmentId));
          
          if (belongsToTeacher) {
            console.log(`✅ Submission from ${sub.studentName} for assignment ${sub.assignmentId}`);
          }
          
          return belongsToTeacher;
        })
        .map(sub => {
          const assignment = allAssignments.find(a => String(a.id) === String(sub.assignmentId));
          return {
            ...sub,
            assignment: assignment ? {
              id: assignment.id,
              title: assignment.title,
              courseId: assignment.courseId,
              courseName: assignment.courseName || courses.find(c => String(c.id) === String(assignment.courseId))?.title,
              dueDate: assignment.dueDate,
              maxPoints: assignment.maxPoints
            } : null
          };
        });

      console.log('📊 Final teacher submissions:', teacherSubmissions.length);
      setSubmissions(teacherSubmissions);
      
    } catch (err) {
      console.error('❌ Error loading submissions:', err);
      setSubmissions([]);
    }
  };

  // Load notes for this teacher (localStorage)
  const loadNotes = async () => {
    try {
      console.log('🔄 Loading notes...');
      
      const allNotes = JSON.parse(localStorage.getItem('notes') || '[]');
      console.log('📦 Total notes in system:', allNotes.length);

      const teacherNotes = allNotes.filter(note => 
        String(note.authorId) === String(user.id)
      );

      console.log('📊 Teacher notes:', teacherNotes.length);
      setNotes(teacherNotes);
      
    } catch (err) {
      console.error('❌ Error loading notes:', err);
      setNotes([]);
    }
  };

  // Load student notifications
  const loadStudentNotifications = async () => {
    try {
      const notifications = JSON.parse(localStorage.getItem('studentNotifications') || '{}');
      setStudentNotifications(notifications);
    } catch (err) {
      console.error('Error loading student notifications:', err);
      setStudentNotifications({});
    }
  };

  // Main dashboard load
  const loadTeacherDashboard = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      console.log('🚀 Starting dashboard load...');
      console.log('Current user:', user);

      const courses = await loadTeacherCourses();
      
      if (courses.length === 0) {
        console.warn('⚠️ No courses found for teacher');
      }

      await Promise.all([
        loadAssignments(courses),
        loadSubmissions(courses),
        loadNotes(),
        loadStudentNotifications()
      ]);

      setLastUpdate(new Date().toLocaleString('en-US', { 
        timeZone: 'Asia/Kolkata', 
        hour12: true, 
        timeStyle: 'short', 
        dateStyle: 'full' 
      }));
      setRefreshCount(prev => prev + 1);
      setDataSource('localStorage + API');
      
      console.log('✅ Dashboard load complete');
      
    } catch (err) {
      console.error('❌ Dashboard load failed:', err);
      setError('Failed to load dashboard data. Please refresh.');
      setDataSource('Error');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------
     EFFECTS
  -------------------------------*/

  useEffect(() => {
    if (user && user.role === 'TEACHER') {
      console.log('🎯 Teacher user detected, loading dashboard...');
      loadTeacherDashboard();
      
      const interval = setInterval(loadTeacherDashboard, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (dashboardData.courses.length > 0 && assignments.length > 0) {
      setAssignments(prev => prev.map(a => ({
        ...a,
        courseName: dashboardData.courses.find(c => String(c.id) === String(a.courseId))?.title || getDefaultCourseName()
      })));
    }
  }, [dashboardData.courses, assignments.length]);

  /* ------------------------------
     OTHER HELPERS & HANDLERS
  -------------------------------*/

  const getStudentsWhoViewed = (contentId, contentType) => {
    const key = `${contentType}_${contentId}`;
    return studentNotifications[key] || [];
  };

  const getEnrolledStudents = (courseId) => {
    try {
      const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
      const courseEnrollments = enrollments.filter(e => String(e.courseId) === String(courseId));
      
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const students = allUsers.filter(u => 
        u.role === 'STUDENT' && 
        courseEnrollments.some(e => String(e.studentId) === String(u.id))
      );
      
      return students;
    } catch {
      return [];
    }
  };

  // ✅ NEW: Student submission file download helper (Teacher side)
  const handleDownloadSubmissionFile = (submission) => {
    try {
      if (!submission.fileId) {
        alert('No file attached to this submission.');
        return;
      }

      const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
      const file = files[submission.fileId];

      if (!file || !file.content) {
        alert('File not found. This may be an old submission created before the latest update.');
        return;
      }

      const link = document.createElement('a');
      link.href = file.content; // Data URL (base64)
      link.download = file.name || submission.fileName || `submission-${submission.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading submission file:', err);
      alert('Failed to download file');
    }
  };

  const renderAssignmentNotificationBadge = (assignment) => {
    const enrolledStudents = getEnrolledStudents(assignment.courseId);
    const viewedStudents = getStudentsWhoViewed(assignment.id, 'assignment');
    const viewCount = viewedStudents.length;
    const totalCount = enrolledStudents.length;

    if (totalCount === 0) return <Badge bg="secondary" className="ms-2">No Students</Badge>;

    return (
      <Badge bg={viewCount === totalCount ? 'success' : 'warning'} className="ms-2">
        👁️ {viewCount}/{totalCount}
      </Badge>
    );
  };

  const renderNoteNotificationBadge = (note) => {
    if (!note.courseId) return null;
    
    const enrolledStudents = getEnrolledStudents(note.courseId);
    const viewedStudents = getStudentsWhoViewed(note.id, 'note');
    const viewCount = viewedStudents.length;
    const totalCount = enrolledStudents.length;

    if (totalCount === 0) return <Badge bg="secondary" className="ms-2">No Students</Badge>;

    return (
      <Badge bg={viewCount === totalCount ? 'success' : 'warning'} className="ms-2">
        👁️ {viewCount}/{totalCount}
      </Badge>
    );
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      submissionId: submission.id,
      grade: submission.grade || '',
      feedback: submission.feedback || '',
      maxPoints: submission.assignment?.maxPoints || 100
    });
    setShowGradeModal(true);
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;

    try {
      const gradeData = {
        grade: parseInt(gradeForm.grade),
        feedback: gradeForm.feedback,
        graded: true,
        gradedAt: new Date().toISOString()
      };

      const allSubmissions = JSON.parse(localStorage.getItem('submissions') || '[]');
      const updatedSubmissions = allSubmissions.map(sub => 
        String(sub.id) === String(selectedSubmission.id) 
          ? { ...sub, ...gradeData }
          : sub
      );
      
      localStorage.setItem('submissions', JSON.stringify(updatedSubmissions));

      setSubmissions(prev => prev.map(sub => 
        String(sub.id) === String(selectedSubmission.id) 
          ? { ...sub, ...gradeData }
          : sub
      ));

      if (selectedAssignmentForSubmissions) {
        setAssignmentSubmissions(prev => prev.map(sub =>
          String(sub.id) === String(selectedSubmission.id)
            ? { ...sub, ...gradeData }
            : sub
        ));
      }

      setShowGradeModal(false);
      setSelectedSubmission(null);
      setGradeForm({ submissionId: '', grade: '', feedback: '', maxPoints: 100 });
      
      alert('Grade submitted successfully!');
    } catch (err) {
      console.error('Error submitting grade:', err);
      alert('Failed to submit grade');
    }
  };

  const handleViewAssignmentSubmissions = (assignment) => {
    setSelectedAssignmentForSubmissions(assignment);
    
    const assignmentSubs = submissions.filter(sub => 
      String(sub.assignmentId) === String(assignment.id)
    );
    
    setAssignmentSubmissions(assignmentSubs);
    setShowAssignmentSubmissionsModal(true);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    console.group('📝 Creating/Updating Assignment');
    
    if (!assignmentForm.courseId) {
      alert('Please select a course');
      console.groupEnd();
      return;
    }

    try {
      const isEdit = Boolean(assignmentForm.id);
      console.log('Mode:', isEdit ? 'EDIT' : 'CREATE');
      
      const validationErrors = validateAssignmentForm(assignmentForm);
      if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n• ' + validationErrors.join('\n• '));
        console.groupEnd();
        return;
      }
      
      const assignmentData = {
        title: assignmentForm.title.trim(),
        description: assignmentForm.description.trim(),
        courseId: parseInt(assignmentForm.courseId),
        dueDate: assignmentForm.dueDate,
        maxPoints: parseInt(assignmentForm.maxPoints) || 100
      };

      console.log('📋 Assignment Data:', assignmentData);
      console.log('📎 File:', assignmentForm.file);

      let response;
      if (isEdit) {
        console.log('🔄 Calling UPDATE API...');
        response = await apiService.assignments.updateAssignment(
          assignmentForm.id,
          assignmentData,
          assignmentForm.file
        );
      } else {
        console.log('➕ Calling CREATE API...');
        response = await apiService.assignments.createAssignment(
          assignmentData,
          assignmentForm.file
        );
      }

      console.log('✅ API Response:', response);

      const savedAssignment = response.data;
      
      const courseName = dashboardData.courses.find(c => 
        String(c.id) === String(savedAssignment.courseId)
      )?.title || 'Unknown Course';

      setAssignments(prev => {
        const updatedAssignment = {
          ...savedAssignment,
          courseName: courseName
        };

        if (isEdit) {
          return prev.map(a => 
            String(a.id) === String(savedAssignment.id) ? updatedAssignment : a
          );
        } else {
          const alreadyExists = prev.some(a => 
            String(a.id) === String(savedAssignment.id)
          );
          
          if (alreadyExists) {
            console.log('⚠️ Assignment already exists in state, updating instead of adding');
            return prev.map(a => 
              String(a.id) === String(savedAssignment.id) ? updatedAssignment : a
            );
          } else {
            console.log('➕ Adding new assignment to state');
            return [...prev, updatedAssignment];
          }
        }
      });

      setShowAssignmentModal(false);
      setShowEditAssignmentModal(false);
      
      setAssignmentForm({ 
        id: '', 
        title: '', 
        description: '', 
        dueDate: '', 
        maxPoints: 100, 
        courseId: '', 
        file: null, 
        fileName: '' 
      });
      
      alert(isEdit ? 'Assignment updated successfully!' : 'Assignment created successfully!');
      console.log('✅ Success!');
      console.groupEnd();
      
    } catch (err) {
      console.error('❌ Error saving assignment:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      console.groupEnd();
      
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      
      if (err.response?.status === 400) {
        alert('Invalid data provided. Please check all fields and try again.');
      } else if (err.response?.status === 404) {
        alert('Server endpoint not found. Assignment saved locally.');
      } else if (err.response?.status === 500) {
        alert('Server error. Assignment saved locally.');
      } else {
        alert('Failed to save assignment: ' + errorMessage);
      }
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      const noteData = {
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        courseId: noteForm.courseId ? parseInt(noteForm.courseId) : null,
        visibility: noteForm.visibility
      };

      let response;
      if (noteForm.id) {
        response = await apiService.notes.updateNote(noteForm.id, noteData, noteForm.file);
      } else {
        response = await apiService.notes.createNote(noteData, noteForm.file);
      }

      const savedNote = response.data;
      
      setNotes(prev => {
        if (noteForm.id) {
          return prev.map(n => 
            String(n.id) === String(savedNote.id) ? savedNote : n
          );
        } else {
          const alreadyExists = prev.some(n => 
            String(n.id) === String(savedNote.id)
          );
          
          if (alreadyExists) {
            console.log('⚠️ Note already exists in state, updating instead of adding');
            return prev.map(n => 
              String(n.id) === String(savedNote.id) ? savedNote : n
            );
          } else {
            console.log('➕ Adding new note to state');
            return [...prev, savedNote];
          }
        }
      });

      setShowNoteModal(false);
      setShowEditNoteModal(false);
      setNoteForm({ 
        id: '', 
        title: '', 
        content: '', 
        courseId: '', 
        file: null, 
        fileName: '', 
        visibility: 'COURSE' 
      });
      
      alert(noteForm.id ? 'Note updated successfully!' : 'Note created successfully!');
      
    } catch (err) {
      console.error('Error saving note:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      alert('Failed to save note: ' + errorMessage);
    }
  };

  const handleEditAssignment = (assignment) => {
    setAssignmentForm({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.split('.')[0],
      maxPoints: assignment.maxPoints,
      courseId: assignment.courseId,
      file: null,
      fileName: assignment.fileName || ''
    });
    setShowEditAssignmentModal(true);
  };

  const handleEditNote = (note) => {
    if (!isMyNote(note)) {
      alert('You can only edit your own notes.');
      return;
    }
    
    setNoteForm({
      id: note.id,
      title: note.title,
      content: note.content,
      courseId: note.courseId,
      file: null,
      fileName: note.fileName || '',
      visibility: note.visibility || 'COURSE'
    });
    setShowEditNoteModal(true);
  };

  const handleViewAssignment = (assignment) => {
    setViewAssignment(assignment);
    setShowViewAssignmentModal(true);
  };

  const handleViewNote = (note) => {
    setViewNote(note);
    setShowViewNoteModal(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const assignment = assignments.find(a => String(a.id) === String(assignmentId));
      await apiService.assignments.deleteAssignment(assignmentId, assignment?.courseId);
      
      setAssignments(prev => prev.filter(a => String(a.id) !== String(assignmentId)));
      
      alert('Assignment deleted successfully!');
    } catch (err) {
      console.error('Error deleting assignment:', err);
      alert('Failed to delete assignment');
    }
  };

  const handleDeleteNote = async (noteId) => {
    const note = notes.find(n => String(n.id) === String(noteId));
    
    if (!isMyNote(note)) {
      alert('You can only delete your own notes.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await apiService.notes.deleteNote(noteId);
      
      setNotes(prev => prev.filter(n => String(n.id) !== String(noteId)));
      
      alert('Note deleted successfully!');
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'PENDING');

  const generateAssignmentKey = (assignment, index) => {
    if (assignment.id && assignment.id !== '') {
      return `assignment-${assignment.id}`;
    } else if (assignment.title && assignment.title !== '') {
      return `assignment-${assignment.title}-${index}`;
    } else {
      return `assignment-${index}-${Date.now()}`;
    }
  };

  const generateNoteKey = (note, index) => {
    if (note.id && note.id !== '') {
      return `note-${note.id}`;
    } else if (note.title && note.title !== '') {
      return `note-${note.title}-${index}`;
    } else {
      return `note-${index}-${Date.now()}`;
    }
  };

  const generateCourseKey = (course, index) => {
    if (course.id && course.id !== '') {
      return `course-${course.id}`;
    } else if (course.title && course.title !== '') {
      return `course-${course.title}-${index}`;
    } else {
      return `course-${index}-${Date.now()}`;
    }
  };

  if (loading && refreshCount === 0) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading dashboard...</p>
      </Container>
    );
  }

  /* ------------------------------
     RENDER
  -------------------------------*/

  return (
    <Container className="my-5">
      <h2 className="mb-4">Teacher Dashboard</h2>
      
      {error && <Alert variant="warning">{error}</Alert>}
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3>{dashboardData.coursesCount}</h3>
              <p>Courses Teaching</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3>{dashboardData.studentsCount}</h3>
              <p>Total Students</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3>{pendingSubmissions.length}</h3>
              <p>Pending Reviews</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h5>My Courses</h5>
        </Card.Header>
        <Card.Body>
          {dashboardData.courses.length === 0 ? (
            <Alert variant="info">{dashboardData.message}</Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.courses.map((course, index) => (
                  <tr key={generateCourseKey(course, index)}>
                    <td>{course.title}</td>
                    <td>{getEnrolledStudents(course.id).length}</td>
                    <td>
                      <Button size="sm" variant="primary">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Row className="mb-3">
        <Col>
          <Button onClick={() => setShowAssignmentModal(true)}>Create Assignment</Button>
          <Button onClick={() => setShowNoteModal(true)} className="ms-2">Create Note</Button>
        </Col>
      </Row>

      {/* Assignments Section */}
      <Card className="mb-4">
        <Card.Header>
          <h5>My Assignments</h5>
        </Card.Header>
        <Card.Body>
          {assignments.length === 0 ? (
            <Alert variant="info">No assignments created yet.</Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Due Date</th>
                  <th>Max Points</th>
                  <th>Views</th>
                  <th>Submissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment, index) => {
                  const assignmentSubs = submissions.filter(sub => 
                    String(sub.assignmentId) === String(assignment.id)
                  );
                  const gradedSubs = assignmentSubs.filter(sub => sub.graded);
                  
                  return (
                    <tr key={generateAssignmentKey(assignment, index)}>
                      <td>
                        <strong>{assignment.title}</strong>
                        {assignment.fileId && (
                          <Badge bg="secondary" className="ms-2">📎</Badge>
                        )}
                      </td>
                      <td>{assignment.courseName}</td>
                      <td>{new Date(assignment.dueDate).toLocaleString()}</td>
                      <td>{assignment.maxPoints}</td>
                      <td>{renderAssignmentNotificationBadge(assignment)}</td>
                      <td>
                        <Badge bg={assignmentSubs.length > 0 ? 'primary' : 'secondary'}>
                          {gradedSubs.length}/{assignmentSubs.length} Graded
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            size="sm" 
                            variant="info" 
                            onClick={() => handleViewAssignment(assignment)}
                            title="View Assignment Details"
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleViewAssignmentSubmissions(assignment)}
                            title="View Student Submissions"
                          >
                            📥 Submissions ({assignmentSubs.length})
                          </Button>
                          <Button 
                            size="sm" 
                            variant="warning" 
                            onClick={() => handleEditAssignment(assignment)}
                            title="Edit Assignment"
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger" 
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            title="Delete Assignment"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Notes Section */}
      <Card className="mb-4">
        <Card.Header className="bg-info text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="fas fa-sticky-note me-2"></i>My Notes</h5>
            <div>
              <Badge bg="light" text="dark" className="fs-6 me-3">{notes.length} Total</Badge>
              <Button 
                size="sm" 
                variant="light" 
                onClick={() => setShowNoteModal(true)}
              >
                <i className="fas fa-plus me-1"></i>Create Note
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {notes.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="fas fa-sticky-note fa-3x mb-3 opacity-25"></i>
              <h5>No Notes Created Yet</h5>
              <p className="mb-0">Create notes to share with your students.</p>
            </div>
          ) : (
            <div className="row">
              {notes.map((note, index) => (
                <div key={generateNoteKey(note, index)} className="col-md-6 mb-3">
                  <Card className={`h-100 ${note.visibility === 'ALL' ? 'border-success' : 'border-primary'}`}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">{note.title}</h6>
                        <Badge bg={note.visibility === 'ALL' ? 'success' : 'primary'}>
                          {note.visibility === 'ALL' ? '🌍 All' : '📚 Course'}
                        </Badge>
                      </div>
                      
                      <p className="text-muted small mb-2">
                        <strong>Course:</strong> {note.courseId ? dashboardData.courses.find(c => c.id === note.courseId)?.title : 'All Courses'}
                      </p>
                      
                      <p className="text-muted small mb-2">
                        <strong>Created:</strong> {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                      
                      <div className="mb-3">
                        <p className="small text-muted mb-1">
                          {note.content?.substring(0, 100)}{note.content?.length > 100 ? '...' : ''}
                        </p>
                      </div>

                      <div className="mb-3">
                        {renderNoteNotificationBadge(note)}
                      </div>

                      {note.fileId && (
                        <div className="mb-3">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
                              const file = files[note.fileId];
                              if (file?.content) {
                                window.open(file.content, '_blank');
                              }
                            }}
                          >
                            <i className="fas fa-download me-1"></i>Download Attachment
                          </Button>
                        </div>
                      )}

                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-info"
                          className="flex-fill"
                          onClick={() => handleViewNote(note)}
                        >
                          <i className="fas fa-eye me-1"></i>View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-warning"
                          className="flex-fill"
                          onClick={() => handleEditNote(note)}
                          title="Edit this note"
                        >
                          <i className="fas fa-edit me-1"></i>Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="flex-fill"
                          onClick={() => handleDeleteNote(note.id)}
                          title="Delete this note"
                        >
                          <i className="fas fa-trash me-1"></i>Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Student Submissions Section */}
      <Card className="mb-4">
        <Card.Header className="bg-success text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="fas fa-file-upload me-2"></i>Student Submissions</h5>
            <Badge bg="light" text="dark" className="fs-6">{submissions.length} Total</Badge>
          </div>
        </Card.Header>
        <Card.Body>
          {submissions.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="fas fa-file-upload fa-3x mb-3 opacity-25"></i>
              <h5>No Submissions Yet</h5>
              <p className="mb-0">Student submissions for your assignments will appear here.</p>
            </div>
          ) : (
            <div className="row">
              {submissions.map((submission, index) => {
                const assignment = submission.assignment;
                const courseName = assignment?.courseName || dashboardData.courses.find(c => String(c.id) === String(assignment?.courseId))?.title || 'Unknown Course';
                const percentage = submission.grade ? ((submission.grade / (assignment?.maxPoints || 100)) * 100).toFixed(1) : null;
                
                return (
                  <div key={`submission-${submission.id || index}`} className="col-md-6 mb-3">
                    <Card className={`h-100 ${submission.graded ? 'border-success' : 'border-warning'}`}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0">{assignment?.title || 'N/A'}</h6>
                          {submission.graded ? (
                            <Badge bg="success" className="fs-6">
                              ✓ Graded
                            </Badge>
                          ) : (
                            <Badge bg="warning" text="dark" className="fs-6">
                              ⏳ Pending
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted small mb-2">
                          <strong>Student:</strong> {submission.studentName || 'Unknown Student'}
                        </p>
                        
                        <p className="text-muted small mb-2">
                          <strong>Course:</strong> {courseName}
                        </p>
                        
                        <p className="text-muted small mb-2">
                          <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        
                        {submission.fileId && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mb-3 w-100"
                            onClick={() => handleDownloadSubmissionFile(submission)}
                          >
                            <i className="fas fa-download me-1"></i>View Submission File
                          </Button>
                        )}
                        
                        {submission.grade !== null && submission.grade !== undefined ? (
                          <div className="mt-3 p-3 bg-light rounded">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <strong>Grade:</strong>
                              <span className={`fs-4 fw-bold ${
                                percentage >= 90 ? 'text-success' :
                                percentage >= 75 ? 'text-info' :
                                percentage >= 60 ? 'text-warning' :
                                'text-danger'
                              }`}>
                                {submission.grade}/{assignment?.maxPoints || 100}
                              </span>
                            </div>
                            
                            <div className="progress mb-2" style={{height: '20px'}}>
                              <div 
                                className={`progress-bar fw-bold ${
                                  percentage >= 90 ? 'bg-success' : 
                                  percentage >= 75 ? 'bg-info' : 
                                  percentage >= 60 ? 'bg-warning' : 
                                  'bg-danger'
                                }`}
                                role="progressbar" 
                                style={{width: `${percentage}%`}}
                                aria-valuenow={percentage} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                {percentage}%
                              </div>
                            </div>

                            <div className="text-center mb-2">
                              {percentage >= 90 ? (
                                <Badge bg="success" className="px-2 py-1">🌟 Excellent</Badge>
                              ) : percentage >= 75 ? (
                                <Badge bg="info" className="px-2 py-1">👍 Good</Badge>
                              ) : percentage >= 60 ? (
                                <Badge bg="warning" text="dark" className="px-2 py-1">📚 Average</Badge>
                              ) : (
                                <Badge bg="danger" className="px-2 py-1">💪 Needs Work</Badge>
                              )}
                            </div>
                            
                            {submission.feedback && (
                              <Alert variant="info" className="mb-0 mt-2">
                                <strong>📝 Your Feedback:</strong>
                                <p className="mb-0 mt-1 small">{submission.feedback}</p>
                              </Alert>
                            )}
                          </div>
                        ) : (
                          <Alert variant="warning" className="mb-0 mt-3">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-clock fa-lg me-3"></i>
                              <div>
                                <strong>Awaiting Grading</strong>
                                <p className="mb-0 small">This submission hasn't been graded yet.</p>
                              </div>
                            </div>
                          </Alert>
                        )}
                        
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant={submission.graded ? "outline-primary" : "primary"}
                            className="w-100"
                            onClick={() => handleGradeSubmission(submission)}
                          >
                            <i className="fas fa-edit me-1"></i>
                            {submission.graded ? 'Update Grade' : 'Grade Now'}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Assignment Creation Modal */}
      <Modal show={showAssignmentModal} onHide={() => setShowAssignmentModal(false)} size="lg">
        <Form onSubmit={handleCreateAssignment}>
          <Modal.Header closeButton>
            <Modal.Title>Create Assignment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control 
                value={assignmentForm.title} 
                onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} 
                required 
                placeholder="Enter assignment title"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Course *</Form.Label>
              <Form.Select 
                value={assignmentForm.courseId} 
                onChange={e => setAssignmentForm({...assignmentForm, courseId: e.target.value})} 
                required
              >
                <option value="">Select a course</option>
                {dashboardData.courses.map((course, index) => (
                  <option key={`course-option-${course.id || index}`} value={course.id}>{course.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Due Date *</Form.Label>
              <Form.Control 
                type="datetime-local" 
                value={assignmentForm.dueDate} 
                onChange={e => {
                  const value = e.target.value;
                  setAssignmentForm({...assignmentForm, dueDate: value});
                }} 
                required 
                min={new Date().toISOString().slice(0, 16)}
              />
              <Form.Text className="text-muted">
                Format: YYYY-MM-DDTHH:mm (e.g., 2025-11-20T10:00)
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={assignmentForm.description} 
                onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} 
                required
                placeholder="Enter assignment description"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Max Points</Form.Label>
              <Form.Control 
                type="number" 
                value={assignmentForm.maxPoints} 
                onChange={e => setAssignmentForm({...assignmentForm, maxPoints: e.target.value})} 
                min="1" 
                max="1000" 
                placeholder="100"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>File (Optional)</Form.Label>
              <Form.Control 
                type="file" 
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) setAssignmentForm({...assignmentForm, file, fileName: file.name});
                }} 
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx" 
              />
              {assignmentForm.fileName && (
                <div className="mt-2">
                  <Badge bg="success" className="me-2">📎 {assignmentForm.fileName}</Badge>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => setAssignmentForm({ ...assignmentForm, file: null, fileName: '' })}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Note Creation Modal */}
      <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} size="lg">
        <Form onSubmit={handleCreateNote}>
          <Modal.Header closeButton>
            <Modal.Title>Create Note</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control 
                value={noteForm.title} 
                onChange={e => setNoteForm({...noteForm, title: e.target.value})} 
                required 
                placeholder="Enter note title"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Select 
                value={noteForm.courseId} 
                onChange={e => setNoteForm({...noteForm, courseId: e.target.value})}
              >
                <option value="">All Courses (General Note)</option>
                {dashboardData.courses.map((course, index) => (
                  <option key={`course-option-${course.id || index}`} value={course.id}>{course.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Visibility</Form.Label>
              <Form.Select 
                value={noteForm.visibility} 
                onChange={e => setNoteForm({...noteForm, visibility: e.target.value})}
              >
                <option value="COURSE">Course Only</option>
                <option value="ALL">All Students</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Content *</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5} 
                value={noteForm.content} 
                onChange={e => setNoteForm({...noteForm, content: e.target.value})} 
                required
                placeholder="Enter note content"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>File (Optional)</Form.Label>
              <Form.Control 
                type="file" 
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) setNoteForm({...noteForm, file, fileName: file.name});
                }} 
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx" 
              />
              {noteForm.fileName && (
                <div className="mt-2">
                  <Badge bg="success" className="me-2">📎 {noteForm.fileName}</Badge>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => setNoteForm({ ...noteForm, file: null, fileName: '' })}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal show={showEditAssignmentModal} onHide={() => setShowEditAssignmentModal(false)} size="lg">
        <Form onSubmit={handleCreateAssignment}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Assignment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control 
                value={assignmentForm.title} 
                onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} 
                required 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Course *</Form.Label>
              <Form.Select 
                value={assignmentForm.courseId} 
                onChange={e => setAssignmentForm({...assignmentForm, courseId: e.target.value})} 
                required
              >
                <option value="">Select a course</option>
                {dashboardData.courses.map((course, index) => (
                  <option key={`course-option-${course.id || index}`} value={course.id}>{course.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Due Date *</Form.Label>
              <Form.Control 
                type="datetime-local" 
                value={assignmentForm.dueDate} 
                onChange={e => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} 
                required 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={assignmentForm.description} 
                onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} 
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Max Points</Form.Label>
              <Form.Control 
                type="number" 
                value={assignmentForm.maxPoints} 
                onChange={e => setAssignmentForm({...assignmentForm, maxPoints: e.target.value})} 
                min="1" 
                max="1000" 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>File (Optional)</Form.Label>
              <Form.Control 
                type="file" 
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) setAssignmentForm({...assignmentForm, file, fileName: file.name});
                }} 
              />
              {assignmentForm.fileName && (
                <div className="mt-2">
                  <Badge bg="success" className="me-2">📎 {assignmentForm.fileName}</Badge>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => setAssignmentForm({ ...assignmentForm, file: null, fileName: '' })}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditAssignmentModal(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Note Modal */}
      <Modal show={showEditNoteModal} onHide={() => setShowEditNoteModal(false)} size="lg">
        <Form onSubmit={handleCreateNote}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Note</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control 
                value={noteForm.title} 
                onChange={e => setNoteForm({...noteForm, title: e.target.value})} 
                required 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Select 
                value={noteForm.courseId} 
                onChange={e => setNoteForm({...noteForm, courseId: e.target.value})}
              >
                <option value="">All Courses (General Note)</option>
                {dashboardData.courses.map((course, index) => (
                  <option key={`course-option-${course.id || index}`} value={course.id}>{course.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Visibility</Form.Label>
              <Form.Select 
                value={noteForm.visibility} 
                onChange={e => setNoteForm({...noteForm, visibility: e.target.value})}
              >
                <option value="COURSE">Course Only</option>
                <option value="ALL">All Students</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Content *</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5} 
                value={noteForm.content} 
                onChange={e => setNoteForm({...noteForm, content: e.target.value})} 
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>File (Optional)</Form.Label>
              <Form.Control 
                type="file" 
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) setNoteForm({...noteForm, file, fileName: file.name});
                }} 
              />
              {noteForm.fileName && (
                <div className="mt-2">
                  <Badge bg="success" className="me-2">📎 {noteForm.fileName}</Badge>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => setNoteForm({ ...noteForm, file: null, fileName: '' })}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditNoteModal(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Grade Submission Modal */}
      <Modal show={showGradeModal} onHide={() => setShowGradeModal(false)}>
        <Form onSubmit={handleSubmitGrade}>
          <Modal.Header closeButton>
            <Modal.Title>Grade Submission</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedSubmission && (
              <div>
                <p><strong>Assignment:</strong> {selectedSubmission.assignment?.title}</p>
                <p><strong>Student:</strong> {selectedSubmission.studentName}</p>
                <p><strong>Max Points:</strong> {selectedSubmission.assignment?.maxPoints || 100}</p>
                
                <Form.Group className="mb-3">
                  <Form.Label>Grade *</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={gradeForm.grade} 
                    onChange={e => setGradeForm({...gradeForm, grade: e.target.value})} 
                    min="0" 
                    max={selectedSubmission.assignment?.maxPoints || 100}
                    required
                    placeholder={`Enter grade (0-${selectedSubmission.assignment?.maxPoints || 100})`}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Feedback (Optional)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={gradeForm.feedback} 
                    onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})} 
                    placeholder="Enter feedback for the student"
                  />
                </Form.Group>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGradeModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Grade</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Assignment Submissions Modal */}
      <Modal show={showAssignmentSubmissionsModal} onHide={() => setShowAssignmentSubmissionsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Student Submissions - {selectedAssignmentForSubmissions?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignmentForSubmissions && (
            <div>
              <div className="mb-4 p-3 bg-light rounded">
                <h6>Assignment Details</h6>
                <p><strong>Course:</strong> {selectedAssignmentForSubmissions.courseName}</p>
                <p><strong>Due Date:</strong> {new Date(selectedAssignmentForSubmissions.dueDate).toLocaleString()}</p>
                <p><strong>Max Points:</strong> {selectedAssignmentForSubmissions.maxPoints}</p>
                <p><strong>Description:</strong> {selectedAssignmentForSubmissions.description}</p>
              </div>

              <h6>Student Submissions ({assignmentSubmissions.length})</h6>
              
              {assignmentSubmissions.length === 0 ? (
                <Alert variant="info">
                  No submissions yet for this assignment.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Submitted Date</th>
                      <th>File</th>
                      <th>Grade</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentSubmissions.map((submission, index) => (
                      <tr key={`assignment-sub-${submission.id || index}`}>
                        <td>{submission.studentName || 'Unknown Student'}</td>
                        <td>
                          <small>{new Date(submission.submittedAt).toLocaleDateString()}</small>
                          <br />
                          <small className="text-muted">{new Date(submission.submittedAt).toLocaleTimeString()}</small>
                        </td>
                        <td>
                          {submission.fileId ? (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-decoration-underline"
                              onClick={() => handleDownloadSubmissionFile(submission)}
                            >
                              📎 {submission.fileName || 'Download'}
                            </Button>
                          ) : (
                            <span className="text-muted small">No File</span>
                          )}
                        </td>
                        <td>
                          {submission.grade !== null && submission.grade !== undefined ? (
                            <Badge bg="success" className="fs-6">
                              {submission.grade}/{selectedAssignmentForSubmissions.maxPoints}
                            </Badge>
                          ) : (
                            <Badge bg="secondary">Not Graded</Badge>
                          )}
                        </td>
                        <td>
                          {submission.graded ? (
                            <Badge bg="success">✓ Graded</Badge>
                          ) : (
                            <Badge bg="warning" text="dark">⏳ Pending</Badge>
                          )}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant={submission.graded ? "outline-primary" : "primary"}
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setGradeForm({
                                submissionId: submission.id,
                                grade: submission.grade || '',
                                feedback: submission.feedback || '',
                                maxPoints: selectedAssignmentForSubmissions.maxPoints || 100
                              });
                              setShowGradeModal(true);
                            }}
                          >
                            {submission.graded ? 'Update Grade' : 'Grade Now'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignmentSubmissionsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Assignment Modal */}
      <Modal show={showViewAssignmentModal} onHide={() => setShowViewAssignmentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assignment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewAssignment && (
            <div>
              <h5>{viewAssignment.title}</h5>
              <p><strong>Course:</strong> {viewAssignment.courseName}</p>
              <p><strong>Due Date:</strong> {new Date(viewAssignment.dueDate).toLocaleString()}</p>
              <p><strong>Max Points:</strong> {viewAssignment.maxPoints}</p>
              <p><strong>Description:</strong></p>
              <p>{viewAssignment.description}</p>
              {viewAssignment.fileId && (
                <p>
                  <strong>Attachment:</strong>{' '}
                  <Button 
                    variant="link" 
                    onClick={() => {
                      const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
                      const file = files[viewAssignment.fileId];
                      if (file?.content) {
                        window.open(file.content, '_blank');
                      }
                    }}
                  >
                    Download File
                  </Button>
                </p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewAssignmentModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* View Note Modal */}
      <Modal show={showViewNoteModal} onHide={() => setShowViewNoteModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Note Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewNote && (
            <div>
              <h5>{viewNote.title}</h5>
              <p><strong>Course:</strong> {viewNote.courseId ? dashboardData.courses.find(c => c.id === viewNote.courseId)?.title : 'All Courses'}</p>
              <p><strong>Visibility:</strong> <Badge bg={viewNote.visibility === 'ALL' ? 'success' : 'primary'}>{viewNote.visibility === 'ALL' ? 'All Students' : 'Course Only'}</Badge></p>
              <p><strong>Author:</strong> {viewNote.author || 'Unknown'}</p>
              <p><strong>Created:</strong> {viewNote.createdAt ? new Date(viewNote.createdAt).toLocaleString() : 'Unknown'}</p>
              <p><strong>Content:</strong></p>
              <div className="border p-3 bg-light rounded">
                {viewNote.content}
              </div>
              {viewNote.fileId && (
                <p className="mt-3">
                  <strong>Attachment:</strong>{' '}
                  <Button 
                    variant="link" 
                    onClick={() => {
                      const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
                      const file = files[viewNote.fileId];
                      if (file?.content) {
                        window.open(file.content, '_blank');
                      }
                    }}
                  >
                    📎 {viewNote.fileName || 'Download File'}
                  </Button>
                </p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewNoteModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <div className="text-muted small mt-4">
        Last updated: {lastUpdate} | Data source: {dataSource} | Refresh count: {refreshCount}
      </div>
    </Container>
  );
};

export default TeacherDashboard;