import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Badge,
  Spinner,
  Modal,
  ProgressBar,
} from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'available', 'enrolled', 'assignments', 'notes', 'submissions'
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    availableCourses: 0,
    assignmentsDue: 0,
    notesCount: 0,
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('01:36 PM +0530, Wednesday, November 12, 2025');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    id: '',
    assignmentId: '',
    studentId: '',
    file: null,
    fileName: '',
  });
  const [submissions, setSubmissions] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

  useEffect(() => {
    const initializeSampleData = () => {
      try {
        const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        if (existingCourses.length === 0) {
          const sampleCourses = [
            {
              id: '1',
              title: 'Introduction to Programming',
              teacherId: 'teacher1',
              teacherName: 'John Doe',
              status: 'active',
              createdAt: new Date().toISOString(),
              description:
                'Learn the fundamentals of programming with this beginner-friendly course.',
              category: 'Programming',
              level: 'BEGINNER',
              duration: '8 weeks',
              price: 'Free',
              students: 0,
              rating: 4.5,
            },
            {
              id: '2',
              title: 'Web Development Basics',
              teacherId: 'teacher2',
              teacherName: 'Jane Smith',
              status: 'active',
              createdAt: new Date().toISOString(),
              description: 'Build your first website with HTML, CSS and JavaScript.',
              category: 'Web Development',
              level: 'BEGINNER',
              duration: '10 weeks',
              price: '$49.99',
              students: 0,
              rating: 4.2,
            },
            {
              id: '3',
              title: 'Data Science Fundamentals',
              teacherId: 'teacher3',
              teacherName: 'Mike Johnson',
              status: 'active',
              createdAt: new Date().toISOString(),
              description:
                'Introduction to data analysis, visualization and machine learning.',
              category: 'Data Science',
              level: 'INTERMEDIATE',
              duration: '12 weeks',
              price: '$79.99',
              students: 0,
              rating: 4.7,
            },
          ];
          localStorage.setItem('courses', JSON.stringify(sampleCourses));
        }

        if (!localStorage.getItem('enrollments')) localStorage.setItem('enrollments', '[]');

        if (!localStorage.getItem('assignments')) {
          const sampleAssignments = [
            {
              id: 'assign-1',
              title: 'First Programming Exercise',
              courseId: '1',
              description:
                'Create a simple calculator program that can perform basic arithmetic operations.',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              maxPoints: 100,
              createdAt: new Date().toISOString(),
              fileId: null,
              fileName: '',
            },
            {
              id: 'assign-2',
              title: 'HTML/CSS Website',
              courseId: '2',
              description:
                'Build a responsive website using HTML and CSS with modern design principles.',
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              maxPoints: 100,
              createdAt: new Date().toISOString(),
              fileId: null,
              fileName: '',
            },
          ];
          localStorage.setItem('assignments', JSON.stringify(sampleAssignments));
        }

        if (!localStorage.getItem('notes')) {
          const sampleNotes = [
            {
              id: 'note-1',
              title: 'Programming Basics',
              content:
                'Programming is the process of creating a set of instructions that tell a computer how to perform a task...',
              courseId: '1',
              author: 'John Doe',
              visibility: 'COURSE',
              createdAt: new Date().toISOString(),
              fileId: null,
              fileName: '',
            },
            {
              id: 'note-2',
              title: 'Web Development Introduction',
              content:
                'Web development is the work involved in developing a website for the Internet...',
              courseId: '2',
              author: 'Jane Smith',
              visibility: 'COURSE',
              createdAt: new Date().toISOString(),
              fileId: null,
              fileName: '',
            },
          ];
          localStorage.setItem('notes', JSON.stringify(sampleNotes));
        }

        if (!localStorage.getItem('uploadedFiles')) localStorage.setItem('uploadedFiles', '{}');
        if (!localStorage.getItem('submissions')) localStorage.setItem('submissions', '[]');
        if (!localStorage.getItem('studentNotifications'))
          localStorage.setItem('studentNotifications', '{}');
      } catch (err) {
        console.error('Dashboard: Error initializing sample data:', err);
      }
    };
    initializeSampleData();
  }, []);

  const markContentAsViewed = useCallback(
    (contentId, contentType) => {
      if (!user || !user.id) return;

      try {
        const key = `${contentType}_${contentId}`;
        const existing = JSON.parse(localStorage.getItem('studentNotifications') || '{}');

        if (!existing[key]) {
          existing[key] = [];
        }

        const studentIdStr = String(user.id);
        if (!existing[key].includes(studentIdStr)) {
          existing[key].push(studentIdStr);
          localStorage.setItem('studentNotifications', JSON.stringify(existing));
        }
      } catch (err) {
        console.error('Error marking content as viewed:', err);
      }
    },
    [user]
  );

  const loadDashboardData = useCallback(
    async () => {
      try {
        if (!user) {
          setError('');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError('');

        // Load courses
        let courses = [];
        try {
          const response = await apiService.courses.getAllCourses();
          courses = response.data || [];
        } catch (apiError) {
          courses = JSON.parse(localStorage.getItem('courses') || '[]');
        }

        // Load enrollments
        let enrollmentsData = [];
        try {
          const response = await apiService.courses.getMyEnrollments();
          enrollmentsData = Array.isArray(response.data) ? response.data : [];
        } catch (apiError) {
          const localEnrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
          enrollmentsData = Array.isArray(localEnrollments) ? localEnrollments : [];
        }

        setEnrollments(enrollmentsData);

        // Get enrolled course IDs
        const enrolledIds = enrollmentsData
          .filter((e) => e && String(e.studentId) === String(user.id))
          .map((e) => String(e.courseId));

        setEnrolledCourseIds(enrolledIds);

        // Filter courses
        const userCourses = courses.filter(
          (course) => course && enrolledIds.includes(String(course.id))
        );
        const availableCoursesList = courses.filter(
          (course) =>
            course &&
            !enrolledIds.includes(String(course.id)) &&
            course.status !== 'archived' &&
            course.status !== 'inactive'
        );

        // Load assignments
        let allAssignments = [];
        try {
          const response = await apiService.assignments.getAllAssignments();
          allAssignments = response.data || [];
        } catch {
          allAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        }

        allAssignments = Array.isArray(allAssignments) ? allAssignments : [];

        const accessibleAssignments = allAssignments
          .filter((a) => {
            if (!a || !a.courseId) return false;
            return enrolledIds.includes(String(a.courseId));
          })
          .map((a) => ({
            ...a,
            fileUrl: a.fileId
              ? JSON.parse(localStorage.getItem('uploadedFiles') || '{}')[a.fileId]?.content
              : null,
            fileName: a.fileName || 'Download Attachment',
            courseName:
              courses.find((c) => c && String(c.id) === String(a.courseId))?.title ||
              'Unknown Course',
          }));

        // Load notes
        let allNotes = [];
        try {
          const response = await apiService.notes.getAllNotes();
          allNotes = response.data || [];
        } catch {
          allNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        }

        allNotes = Array.isArray(allNotes) ? allNotes : [];

        const accessibleNotes = allNotes
          .filter((note) => {
            if (!note) return false;

            if (note.visibility === 'ALL') return true;

            if (note.courseId) {
              return enrolledIds.includes(String(note.courseId));
            }

            return false;
          })
          .map((note) => ({
            ...note,
            fileUrl: note.fileId
              ? JSON.parse(localStorage.getItem('uploadedFiles') || '{}')[note.fileId]?.content
              : null,
            fileName: note.fileName || 'Download Attachment',
            courseName:
              courses.find((c) => c && String(c.id) === String(note.courseId))?.title ||
              'General Notes',
          }));

        // Apply course filter
        const filteredAssignments = selectedCourseId
          ? accessibleAssignments.filter((a) => String(a.courseId) === selectedCourseId)
          : accessibleAssignments;

        const filteredNotes = selectedCourseId
          ? accessibleNotes.filter((n) => String(n.courseId) === selectedCourseId)
          : accessibleNotes;

        // Upcoming assignments (next 7 days)
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcoming = filteredAssignments.filter((a) => {
          if (!a.dueDate) return false;
          try {
            const dueDate = new Date(a.dueDate);
            return dueDate >= today && dueDate <= nextWeek;
          } catch {
            return false;
          }
        });

        // Load submissions
        let allSubs = JSON.parse(localStorage.getItem('submissions') || '[]');
        allSubs = Array.isArray(allSubs) ? allSubs : [];
        const studentSubs = allSubs.filter(
          (sub) => sub && String(sub.studentId) === String(user.id)
        );

        // Update stats
        const newStats = {
          totalCourses: courses.length,
          enrolledCourses: userCourses.length,
          availableCourses: availableCoursesList.length,
          assignmentsDue: upcoming.length,
          notesCount: filteredNotes.length,
        };

        setStats(newStats);
        setRecentCourses(userCourses);
        setAvailableCourses(availableCoursesList);
        setUpcomingAssignments(filteredAssignments);
        setRecentNotes(filteredNotes);
        setSubmissions(studentSubs);
        setLastUpdate(
          new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        );
        setLoading(false);
      } catch (err) {
        console.error('Dashboard: Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    },
    [user, selectedCourseId]
  );

  useEffect(() => {
    if (user) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user, loadDashboardData]);

  const handleEnrollCourse = async (courseId) => {
    try {
      setLoading(true);

      try {
        const response = await apiService.courses.enrollStudent(courseId);
        if (response.data) {
          console.log('API enrollment successful:', response.data);
        }
      } catch (apiError) {
        console.log('API enrollment failed, using localStorage:', apiError);

        const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
        const existingEnrollment = Array.isArray(enrollments)
          ? enrollments.find(
              (e) =>
                e &&
                String(e.courseId) === String(courseId) &&
                String(e.studentId) === String(user.id)
            )
          : null;

        if (!existingEnrollment) {
          const newEnrollment = {
            id: `enroll-${Date.now()}`,
            courseId: courseId,
            studentId: user.id,
            studentName: user.name,
            enrolledAt: new Date().toISOString(),
            status: 'ACTIVE',
          };

          const updatedEnrollments = Array.isArray(enrollments)
            ? [...enrollments, newEnrollment]
            : [newEnrollment];
          localStorage.setItem('enrollments', JSON.stringify(updatedEnrollments));
        }
      }

      // Update course student count
      const courses = JSON.parse(localStorage.getItem('courses') || '[]');
      const courseIndex = courses.findIndex((c) => c && String(c.id) === String(courseId));
      if (courseIndex !== -1) {
        if (!courses[courseIndex].students) {
          courses[courseIndex].students = 0;
        }
        courses[courseIndex].students += 1;
        localStorage.setItem('courses', JSON.stringify(courses));
      }

      alert('🎉 Successfully enrolled in course!');
      await loadDashboardData();
    } catch (err) {
      console.error('Enrollment error:', err);
      setError('Failed to enroll in course: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: store file as Data URL in localStorage (not temporary blob)
  const handleFileUpload = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject('No file');
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) return reject('File too large');
      if (file.size === 0) return reject('Empty file');

      const reader = new FileReader();

      reader.onloadend = () => {
        try {
          const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const data = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: reader.result, // Data URL (base64)
            uploadedAt: new Date().toISOString(),
          };

          const existing = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
          existing[fileId] = data;
          localStorage.setItem('uploadedFiles', JSON.stringify(existing));

          resolve(fileId);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleDownloadFile = (fileId, name, assignmentCourseId) => {
    if (assignmentCourseId && !enrolledCourseIds.includes(String(assignmentCourseId))) {
      alert('You are not enrolled in the course for this content.');
      return;
    }

    const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
    const file = files[fileId];
    if (file?.content) {
      const a = document.createElement('a');
      a.href = file.content;
      a.download = file.name || name;
      a.click();
    } else {
      alert('File not found or inaccessible.');
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();

    if (!submissionForm.file) {
      alert('Please upload a file');
      return;
    }

    console.group('📤 Submitting Assignment');
    console.log('Assignment ID:', selectedAssignment?.id);
    console.log('Student ID:', user?.id);
    console.log('File:', submissionForm.file?.name);

    try {
      console.log('Uploading file...');
      const fileId = await handleFileUpload(submissionForm.file);
      console.log('✅ File uploaded, ID:', fileId);

      const newSubmission = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assignmentId: selectedAssignment.id,
        studentId: user.id,
        studentName: user.name,
        fileId: fileId,
        fileName: submissionForm.fileName,
        grade: null,
        graded: false,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        gradedAt: null,
        feedback: null,
      };

      console.log('📝 New submission object:', newSubmission);

      const existing = JSON.parse(localStorage.getItem('submissions') || '[]');
      const updatedSubmissions = [...existing, newSubmission];
      localStorage.setItem('submissions', JSON.stringify(updatedSubmissions));

      console.log('✅ Saved to localStorage');
      console.log('Total submissions now:', updatedSubmissions.length);

      try {
        console.log('Attempting API submission...');
        const apiResponse = await apiService.submissions.submitAssignment(
          selectedAssignment.id,
          'Submitted via LMS',
          submissionForm.file
        );
        console.log('✅ API submission successful:', apiResponse.data);
      } catch (apiError) {
        console.warn(
          '⚠️ API submission failed (but localStorage succeeded):',
          apiError.message
        );
      }

      setSubmissions((prev) => [...prev, newSubmission]);

      setShowSubmissionModal(false);
      setSubmissionForm({
        id: '',
        assignmentId: '',
        studentId: user.id,
        file: null,
        fileName: '',
      });
      setSelectedAssignment(null);

      alert('✅ Submission uploaded successfully!');
      console.log('✅ Submission complete');
      console.groupEnd();

      await loadDashboardData();
    } catch (err) {
      console.error('❌ Submission failed:', err);
      console.groupEnd();
      alert('Failed to submit: ' + err.message);
    }
  };

  const debugSubmissions = () => {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');

    console.log('=== SUBMISSION DEBUG ===');
    console.log('Total submissions:', submissions.length);
    console.log('Total assignments:', assignments.length);
    console.log('\nAll submissions:', submissions);
    console.log('\nAll assignments:', assignments);

    submissions.forEach((sub, i) => {
      const assignment = assignments.find((a) => String(a.id) === String(sub.assignmentId));
      console.log(`\nSubmission ${i + 1}:`, {
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentName: sub.studentName,
        assignmentTitle: assignment?.title || 'NOT FOUND',
        teacherId: assignment?.teacherId || 'NO TEACHER',
      });
    });

    console.log('=== END DEBUG ===');
  };

  const StatsCard = ({ value, label, variant = 'primary', icon = '📊' }) => (
    <Col md={3} className="mb-3">
      <Card className="text-center h-100 border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <span className="fs-2">{icon}</span>
            <Badge bg={variant} className="fs-6">
              {value}
            </Badge>
          </div>
          <h2 className={`text-${variant} mb-1`}>{value}</h2>
          <p className="text-muted mb-0">{label}</p>
        </Card.Body>
      </Card>
    </Col>
  );

  /* --------- NoteItem with Modal ---------- */
  const NoteItem = ({ note }) => {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
      markContentAsViewed(note.id, 'note');
    }, [note.id]);

    return (
      <>
        <Card className="h-100 border">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="mb-0">{note.title}</h6>
              <Badge bg={note.visibility === 'ALL' ? 'success' : 'primary'}>
                {note.visibility === 'ALL' ? 'Public' : 'Course Only'}
              </Badge>
            </div>
            <p className="text-muted small mb-2">
              <strong>Course:</strong> {note.courseName || 'General'}
            </p>
            <p className="text-muted small mb-2">
              <strong>By:</strong> {note.author || 'Unknown'} •{' '}
              {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown date'}
            </p>
            <p className="small mb-2" style={{ maxHeight: '60px', overflow: 'hidden' }}>
              {note.content?.substring(0, 150)}
              {note.content?.length > 150 ? '...' : ''}
            </p>
            <div className="d-flex flex-wrap gap-2 mt-3">
              {note.fileId && (
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => handleDownloadFile(note.fileId, note.fileName, note.courseId)}
                >
                  <i className="fas fa-download me-1"></i>Download
                </Button>
              )}
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => setShowModal(true)}
              >
                <i className="fas fa-eye me-1"></i>Read Full Note
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
          backdrop="static"
        >
          <Modal.Header closeButton className="bg-info text-white">
            <Modal.Title>
              <i className="fas fa-sticky-note me-2"></i>
              {note.title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-light">
            <div className="mb-3">
              <p className="mb-1">
                <strong>Course:</strong> {note.courseName || 'General'}
              </p>
              <p className="mb-1">
                <strong>Author:</strong> {note.author || 'Unknown'}
              </p>
              <p className="mb-1">
                <strong>Date:</strong>{' '}
                {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'Unknown'}
              </p>
              <p className="mb-1">
                <strong>Visibility:</strong>{' '}
                <Badge bg={note.visibility === 'ALL' ? 'success' : 'primary'}>
                  {note.visibility === 'ALL' ? 'All Students' : 'Course Only'}
                </Badge>
              </p>
            </div>

            <hr />

            <div
              className="p-3 bg-white rounded border"
              style={{ maxHeight: '400px', overflowY: 'auto' }}
            >
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {note.content || 'No content available.'}
              </p>
            </div>

            {note.fileId && (
              <div className="mt-3">
                <Button
                  variant="outline-secondary"
                  onClick={() => handleDownloadFile(note.fileId, note.fileName, note.courseId)}
                >
                  <i className="fas fa-download me-1"></i>
                  Download Attachment ({note.fileName || 'File'})
                </Button>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  };

  /* --------- AssignmentItem with Modal ---------- */
  const AssignmentItem = ({ assignment }) => {
    const [showModal, setShowModal] = useState(false);
    const studentSubmission = submissions.find(
      (s) => String(s.assignmentId) === String(assignment.id)
    );

    useEffect(() => {
      markContentAsViewed(assignment.id, 'assignment');
    }, [assignment.id]);

    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;

    return (
      <>
        <Card className="h-100 border">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="mb-0">{assignment.title}</h6>
              <Badge bg="warning" text="dark">
                {assignment.maxPoints || 100} pts
              </Badge>
            </div>
            <p className="text-muted small mb-2">
              <strong>Course:</strong> {assignment.courseName || 'Unknown Course'}
            </p>
            <p className="text-muted small mb-2">
              <strong>Due:</strong>{' '}
              {dueDate
                ? `${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'N/A'}
            </p>
            {assignment.description && (
              <p className="text-muted small mb-2">
                <strong>Description:</strong>{' '}
                {assignment.description.substring(0, 100)}
                {assignment.description.length > 100 ? '...' : ''}
              </p>
            )}
            <div className="d-flex flex-wrap gap-2 mt-3">
              {assignment.fileId && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() =>
                    handleDownloadFile(assignment.fileId, assignment.fileName, assignment.courseId)
                  }
                >
                  <i className="fas fa-download me-1"></i>Download File
                </Button>
              )}
              <Button
                variant={studentSubmission ? 'success' : 'primary'}
                size="sm"
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setSubmissionForm({
                    ...submissionForm,
                    assignmentId: assignment.id,
                    studentId: user.id,
                  });
                  setShowSubmissionModal(true);
                }}
                disabled={studentSubmission?.graded}
              >
                {studentSubmission ? '✓ Submitted' : 'Submit Answer'}
              </Button>
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => setShowModal(true)}
              >
                <i className="fas fa-info-circle me-1"></i>View Details
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
          backdrop="static"
        >
          <Modal.Header closeButton className="bg-warning text-dark">
            <Modal.Title>
              <i className="fas fa-tasks me-2"></i>
              {assignment.title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-light">
            <div className="mb-3">
              <p className="mb-1">
                <strong>Course:</strong> {assignment.courseName || 'Unknown Course'}
              </p>
              <p className="mb-1">
                <strong>Due Date:</strong>{' '}
                {dueDate ? dueDate.toLocaleString() : 'Not specified'}
              </p>
              <p className="mb-1">
                <strong>Max Points:</strong> {assignment.maxPoints || 100}
              </p>
            </div>

            <hr />

            <h6>Description</h6>
            <div
              className="p-3 bg-white rounded border mb-3"
              style={{ maxHeight: '300px', overflowY: 'auto' }}
            >
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {assignment.description || 'No description provided.'}
              </p>
            </div>

            {assignment.fileId && (
              <div className="mt-2">
                <Button
                  variant="outline-primary"
                  onClick={() =>
                    handleDownloadFile(assignment.fileId, assignment.fileName, assignment.courseId)
                  }
                >
                  <i className="fas fa-download me-1"></i>
                  Download Attachment ({assignment.fileName || 'File'})
                </Button>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  };

  const CourseItem = ({ course, showEnrollButton = false }) => (
    <div className="border-bottom pb-2 mb-2">
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1">
          <h6 className="mb-1">{course.title}</h6>
          <p className="text-muted small mb-2">
            {course.description?.substring(0, 100) || 'No description'}...
          </p>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <Badge bg="primary">{course.category || 'General'}</Badge>
            <Badge bg="secondary">{course.level || 'All Levels'}</Badge>
            {course.teacherName && <small className="text-muted">By {course.teacherName}</small>}
          </div>
        </div>
        {showEnrollButton && (
          <Button
            variant="success"
            size="sm"
            onClick={() => handleEnrollCourse(course.id)}
            className="ms-2"
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Enroll Now'}
          </Button>
        )}
      </div>
    </div>
  );

  const renderOverview = () => (
    <>
      <Row className="mb-4">
        <StatsCard
          value={stats.enrolledCourses}
          label="Enrolled Courses"
          variant="primary"
          icon="📚"
        />
        <StatsCard
          value={stats.availableCourses}
          label="Available Courses"
          variant="success"
          icon="🎯"
        />
        <StatsCard
          value={stats.assignmentsDue}
          label="Assignments Due"
          variant="warning"
          icon="📝"
        />
        <StatsCard
          value={stats.notesCount}
          label="Available Notes"
          variant="info"
          icon="📖"
        />
      </Row>

      <Row className="mb-4">
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-filter me-2"></i>Select Course
              </h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {recentCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-plus-circle me-2"></i>Available Courses
                </h5>
                <Badge bg="light" text="dark" className="fs-6">
                  {stats.availableCourses} New
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {availableCourses.length > 0 ? (
                <>
                  {availableCourses.slice(0, 3).map((course) => (
                    <CourseItem key={course.id} course={course} showEnrollButton={true} />
                  ))}
                  <div className="text-center mt-3">
                    <Button
                      variant="outline-success"
                      onClick={() => setActiveSection('available')}
                    >
                      View All Available Courses
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-book fa-3x mb-3 opacity-25"></i>
                  <h5>No New Courses Available</h5>
                  <p className="mb-0">
                    All current courses are enrolled or check back later for new courses.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-bookmark me-2"></i>My Enrolled Courses
                </h5>
                <Badge bg="primary" className="fs-6">
                  {stats.enrolledCourses}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {recentCourses.length > 0 ? (
                <>
                  {recentCourses.slice(0, 3).map((course) => (
                    <CourseItem key={course.id} course={course} showEnrollButton={false} />
                  ))}
                  <div className="text-center mt-3">
                    <Button
                      variant="outline-primary"
                      onClick={() => setActiveSection('enrolled')}
                    >
                      View All Enrolled Courses
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-graduation-cap fa-2x mb-3 opacity-25"></i>
                  <h6>Not Enrolled in Any Courses</h6>
                  <p className="small mb-0">
                    Enroll in courses from the available courses section to get started.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-tasks me-2"></i>Recent Assignments
                </h5>
                <Badge bg="dark" className="fs-6">
                  {upcomingAssignments.length} Total
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {upcomingAssignments.length > 0 ? (
                <>
                  <div className="row">
                    {upcomingAssignments.slice(0, 2).map((assignment) => (
                      <div key={assignment.id} className="col-12 mb-3">
                        <AssignmentItem assignment={assignment} />
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <Button
                      variant="outline-warning"
                      onClick={() => setActiveSection('assignments')}
                    >
                      View All Assignments
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-check-circle fa-2x mb-3 opacity-25"></i>
                  <h6>No Assignments Available</h6>
                  <p className="small mb-0">
                    Enroll in courses to see assignments from your teachers.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-info text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-book-open me-2"></i>Recent Notes
                </h5>
                <Badge bg="light" text="dark" className="fs-6">
                  {recentNotes.length} Total
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {recentNotes.length > 0 ? (
                <>
                  <div className="row">
                    {recentNotes.slice(0, 2).map((note) => (
                      <div key={note.id} className="col-12 mb-3">
                        <NoteItem note={note} />
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <Button variant="outline-info" onClick={() => setActiveSection('notes')}>
                      View All Notes
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-sticky-note fa-2x mb-3 opacity-25"></i>
                  <h6>No Notes Available</h6>
                  <p className="small mb-0">
                    Notes from your courses will appear here once teachers add them.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderAvailableCourses = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">
            <i className="fas fa-plus-circle me-2"></i>Available Courses
          </h5>
          <p className="mb-0 small">Browse and enroll in new courses</p>
        </div>
        <Badge bg="light" text="dark" className="fs-6">
          {stats.availableCourses} Total
        </Badge>
      </Card.Header>
      <Card.Body>
        {availableCourses.length > 0 ? (
          <>
            {availableCourses.map((course) => (
              <CourseItem key={course.id} course={course} showEnrollButton={true} />
            ))}
            <div className="text-center mt-4">
              <Button variant="outline-primary" onClick={() => setActiveSection('overview')}>
                <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-muted py-5">
            <i className="fas fa-book fa-3x mb-3 opacity-25"></i>
            <h5>No New Courses Available</h5>
            <p className="mb-0">
              All current courses are enrolled or check back later for new courses.
            </p>
            <Button
              variant="outline-primary"
              onClick={() => setActiveSection('overview')}
              className="mt-3"
            >
              <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderEnrolledCourses = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">
            <i className="fas fa-bookmark me-2"></i>My Enrolled Courses
          </h5>
          <p className="mb-0 small">Courses you are currently enrolled in</p>
        </div>
        <Badge bg="light" text="dark" className="fs-6">
          {stats.enrolledCourses} Total
        </Badge>
      </Card.Header>
      <Card.Body>
        {recentCourses.length > 0 ? (
          <>
            {recentCourses.map((course) => (
              <CourseItem key={course.id} course={course} showEnrollButton={false} />
            ))}
            <div className="text-center mt-4">
              <Button variant="outline-primary" onClick={() => setActiveSection('overview')}>
                <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-muted py-4">
            <i className="fas fa-graduation-cap fa-3x mb-3 opacity-25"></i>
            <h5>Not Enrolled in Any Courses</h5>
            <p className="mb-0">
              Enroll in courses from the available courses section to get started.
            </p>
            <Button
              variant="outline-primary"
              onClick={() => setActiveSection('overview')}
              className="mt-3"
            >
              <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderAssignments = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-warning text-dark d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">
            <i className="fas fa-tasks me-2"></i>All Course Assignments
          </h5>
          <p className="mb-0 small">Assignments from all your enrolled courses</p>
        </div>
        <Badge bg="dark" className="fs-6">
          {upcomingAssignments.length} Total
        </Badge>
      </Card.Header>
      <Card.Body>
        {upcomingAssignments.length > 0 ? (
          <>
            <div className="row">
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="col-md-6 mb-3">
                  <AssignmentItem assignment={assignment} />
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Button variant="outline-primary" onClick={() => setActiveSection('overview')}>
                <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-muted py-5">
            <i className="fas fa-check-circle fa-3x mb-3 opacity-25"></i>
            <h5>No Assignments Available</h5>
            <p className="mb-0">Enroll in courses to see assignments from your teachers.</p>
            <Button
              variant="outline-primary"
              onClick={() => setActiveSection('overview')}
              className="mt-3"
            >
              <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderNotes = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">
            <i className="fas fa-book-open me-2"></i>All Course Notes
          </h5>
          <p className="mb-0 small">Study materials and notes from your courses</p>
        </div>
        <Badge bg="light" text="dark" className="fs-6">
          {recentNotes.length} Total
        </Badge>
      </Card.Header>
      <Card.Body>
        {recentNotes.length > 0 ? (
          <>
            <div className="row">
              {recentNotes.map((note) => (
                <div key={note.id} className="col-md-6 mb-3">
                  <NoteItem note={note} />
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Button variant="outline-primary" onClick={() => setActiveSection('overview')}>
                <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-muted py-5">
            <i className="fas fa-sticky-note fa-3x mb-3 opacity-25"></i>
            <h5>No Notes Available</h5>
            <p className="mb-0">
              Notes from your courses will appear here once teachers add them.
            </p>
            <Button
              variant="outline-primary"
              onClick={() => setActiveSection('overview')}
              className="mt-3"
            >
              <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderSubmissions = () => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">
            <i className="fas fa-file-alt me-2"></i>Your Submissions & Grades
          </h5>
          <p className="mb-0 small">Track your assignment submissions and grades</p>
        </div>
        <Badge bg="light" text="dark" className="fs-6">
          {submissions.length} Total
        </Badge>
      </Card.Header>
      <Card.Body>
        {submissions.length > 0 ? (
          <>
            <div className="row">
              {submissions.map((sub) => {
                const assignment = upcomingAssignments.find(
                  (a) => String(a.id) === String(sub.assignmentId)
                );
                const maxPoints = assignment?.maxPoints || 100;
                const percentage = sub.grade
                  ? ((sub.grade / maxPoints) * 100).toFixed(1)
                  : null;

                return (
                  <div key={sub.id} className="col-md-6 mb-3">
                    <Card
                      className={`h-100 ${
                        sub.graded ? 'border-success' : 'border-warning'
                      }`}
                    >
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0">{assignment?.title || 'N/A'}</h6>
                          {sub.graded ? (
                            <Badge bg="success" className="fs-6">
                              ✓ Graded
                            </Badge>
                          ) : (
                            <Badge bg="warning" text="dark" className="fs-6">
                              ⏳ Pending Review
                            </Badge>
                          )}
                        </div>

                        <p className="text-muted small mb-2">
                          <strong>Course:</strong> {assignment?.courseName || 'Unknown'}
                        </p>

                        <p className="text-muted small mb-2">
                          <strong>Max Points:</strong> {maxPoints} points
                        </p>

                        <p className="text-muted small mb-2">
                          <strong>Submitted:</strong>{' '}
                          {new Date(sub.submittedAt).toLocaleDateString()} at{' '}
                          {new Date(sub.submittedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>

                        {sub.graded && sub.gradedAt && (
                          <p className="text-success small mb-2">
                            <strong>✓ Graded:</strong>{' '}
                            {new Date(sub.gradedAt).toLocaleDateString()} at{' '}
                            {new Date(sub.gradedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}

                        {sub.fileId && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mb-3 w-100"
                            onClick={() =>
                              handleDownloadFile(
                                sub.fileId,
                                sub.fileName,
                                assignment?.courseId
                              )
                            }
                          >
                            <i className="fas fa-download me-1"></i>View Your Submission
                          </Button>
                        )}

                        {sub.grade !== null && sub.grade !== undefined ? (
                          <div className="mt-3 p-3 bg-light rounded">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <strong>Your Grade:</strong>
                              <span
                                className={`fs-4 fw-bold ${
                                  percentage >= 90
                                    ? 'text-success'
                                    : percentage >= 75
                                    ? 'text-info'
                                    : percentage >= 60
                                    ? 'text-warning'
                                    : 'text-danger'
                                }`}
                              >
                                {sub.grade}/{maxPoints}
                              </span>
                            </div>

                            <div className="progress mb-2" style={{ height: '25px' }}>
                              <div
                                className={`progress-bar fw-bold ${
                                  percentage >= 90
                                    ? 'bg-success'
                                    : percentage >= 75
                                    ? 'bg-info'
                                    : percentage >= 60
                                    ? 'bg-warning'
                                    : 'bg-danger'
                                }`}
                                role="progressbar"
                                style={{ width: `${percentage}%` }}
                              >
                                {percentage}%
                              </div>
                            </div>

                            <div className="text-center mb-2">
                              {percentage >= 90 ? (
                                <Badge bg="success" className="px-3 py-2">
                                  🌟 Excellent!
                                </Badge>
                              ) : percentage >= 75 ? (
                                <Badge bg="info" className="px-3 py-2">
                                  👍 Good Job!
                                </Badge>
                              ) : percentage >= 60 ? (
                                <Badge bg="warning" text="dark" className="px-3 py-2">
                                  📚 Keep Going!
                                </Badge>
                              ) : (
                                <Badge bg="danger" className="px-3 py-2">
                                  💪 Need Improvement
                                </Badge>
                              )}
                            </div>

                            {sub.feedback && (
                              <Alert variant="info" className="mb-0 mt-2">
                                <strong>📝 Teacher's Feedback:</strong>
                                <p className="mb-0 mt-2">{sub.feedback}</p>
                              </Alert>
                            )}
                          </div>
                        ) : (
                          <Alert variant="warning" className="mb-0 mt-3">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-clock fa-2x me-3"></i>
                              <div>
                                <strong>Waiting for teacher to grade</strong>
                                <p className="mb-0 small">
                                  Your submission has been received. The teacher will review and
                                  grade it soon.
                                </p>
                              </div>
                            </div>
                          </Alert>
                        )}
                      </Card.Body>
                    </Card>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-4">
              <Button variant="outline-primary" onClick={() => setActiveSection('overview')}>
                <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-muted py-5">
            <i className="fas fa-file-alt fa-3x mb-3 opacity-25"></i>
            <h5>No Submissions Yet</h5>
            <p className="mb-0">
              Submit assignments to see your grades and feedback here.
            </p>
            <Button
              variant="outline-primary"
              onClick={() => setActiveSection('overview')}
              className="mt-3"
            >
              <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  const renderStudentDashboard = () => (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="text-primary mb-1">Student Dashboard</h1>
              <p className="text-muted mb-0">Welcome back, {user?.name}!</p>
              <small className="text-muted">Last updated: {lastUpdate}</small>
            </div>
            <Button variant="outline-primary" onClick={loadDashboardData} disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh
                </>
              )}
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>Notice</Alert.Heading>
          {error}
          {error.includes('403') && (
            <div>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={logout}
                className="mt-2"
              >
                Re-authenticate
              </Button>
            </div>
          )}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <Button
                  variant={activeSection === 'overview' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveSection('overview')}
                  className="px-4"
                >
                  <i className="fas fa-tachometer-alt me-2"></i>Dashboard Overview
                </Button>
                <Button
                  variant={activeSection === 'available' ? 'success' : 'outline-success'}
                  onClick={() => setActiveSection('available')}
                  className="px-4"
                >
                  <i className="fas fa-plus-circle me-2"></i>Available Courses
                </Button>
                <Button
                  variant={activeSection === 'enrolled' ? 'info' : 'outline-info'}
                  onClick={() => setActiveSection('enrolled')}
                  className="px-4"
                >
                  <i className="fas fa-bookmark me-2"></i>My Enrolled Courses
                </Button>
                <Button
                  variant={activeSection === 'assignments' ? 'warning' : 'outline-warning'}
                  onClick={() => setActiveSection('assignments')}
                  className="px-4"
                >
                  <i className="fas fa-tasks me-2"></i>All Course Assignments
                </Button>
                <Button
                  variant={activeSection === 'notes' ? 'secondary' : 'outline-secondary'}
                  onClick={() => setActiveSection('notes')}
                  className="px-4"
                >
                  <i className="fas fa-book-open me-2"></i>All Course Notes
                </Button>
                <Button
                  variant={activeSection === 'submissions' ? 'dark' : 'outline-dark'}
                  onClick={() => setActiveSection('submissions')}
                  className="px-4"
                >
                  <i className="fas fa-file-alt me-2"></i>Submissions & Grades
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          {activeSection === 'overview' && renderOverview()}
          {activeSection === 'available' && renderAvailableCourses()}
          {activeSection === 'enrolled' && renderEnrolledCourses()}
          {activeSection === 'assignments' && renderAssignments()}
          {activeSection === 'notes' && renderNotes()}
          {activeSection === 'submissions' && renderSubmissions()}
        </Col>
      </Row>
    </Container>
  );

  const renderSubmissionModal = () => (
    <Modal
      show={showSubmissionModal}
      onHide={() => {
        setShowSubmissionModal(false);
        setSelectedAssignment(null);
      }}
    >
      <Form onSubmit={handleSubmitAssignment}>
        <Modal.Header closeButton>
          <Modal.Title>Submit Assignment: {selectedAssignment?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Assignment Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={selectedAssignment?.description || ''}
              readOnly
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Upload Your Answer (PDF, Word, Text, Images, PowerPoint)</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file)
                  setSubmissionForm({
                    ...submissionForm,
                    file,
                    fileName: file.name,
                  });
              }}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx"
            />
            <Form.Text className="text-muted">Max 10MB</Form.Text>
            {submissionForm.fileName && (
              <div className="mt-2">
                <Badge bg="success" className="me-2">
                  📎 {submissionForm.fileName}
                </Badge>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() =>
                    setSubmissionForm({
                      ...submissionForm,
                      file: null,
                      fileName: '',
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowSubmissionModal(false);
              setSelectedAssignment(null);
            }}
          >
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );

  if (!user) {
    return (
      <Container
        fluid
        className="py-5 text-center"
        style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #007bff, #6610f2)' }}
      >
        <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-5">
                <h1 className="text-primary fw-bold mb-3">Welcome to the LMS Platform</h1>
                <p className="text-muted mb-4">
                  Please log in or register to access the dashboard.
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    href="/student-register"
                    className="px-4 py-2 fw-semibold"
                  >
                    🎓 Student Register
                  </Button>
                  <Button
                    variant="success"
                    size="lg"
                    href="/student-login"
                    className="px-4 py-2 fw-semibold"
                  >
                    🔑 Student Login
                  </Button>
                  <Button
                    variant="warning"
                    size="lg"
                    href="/teacher-login"
                    className="px-4 py-2 fw-semibold"
                  >
                    👨‍🏫 Teacher Login
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    href="/admin-login"
                    className="px-4 py-2 fw-semibold"
                  >
                    ⚙️ Admin Login
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <footer className="text-white mt-5">
          <p className="small mb-0">© {new Date().getFullYear()} LMS Platform | All Rights Reserved</p>
        </footer>
      </Container>
    );
  }

  if (user.role === 'STUDENT')
    return (
      <>
        {renderStudentDashboard()}
        {renderSubmissionModal()}
      </>
    );
  if (user.role === 'TEACHER') return <div>Teacher Dashboard (Implementation pending)</div>;
  if (user.role === 'ADMIN') return <div>Admin Dashboard (Implementation pending)</div>;

  return (
    <Container fluid className="py-5 text-center">
      <Alert variant="danger">Unknown user role. Please contact the administrator.</Alert>
    </Container>
  );
};

export default Dashboard;