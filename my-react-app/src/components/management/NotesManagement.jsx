import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge, Alert, Modal, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const NotesManagement = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '', title: '', content: '', courseId: '', visibility: 'ALL', file: null, fileName: ''
  });
  const [courses, setCourses] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadNotes();
    loadCourses();
  }, []);

  const loadNotes = () => {
    const storedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (user?.role === 'TEACHER') {
      const teacherNotes = storedNotes.filter(note => note.authorId === user.id);
      setNotes(teacherNotes);
    } else {
      const studentNotes = storedNotes.filter(note =>
        note.visibility === 'ALL' ||
        (user?.enrolledCourses?.some(course => course.id === parseInt(note.courseId)))
      );
      setNotes(studentNotes);
    }
  };

  const loadCourses = () => {
    if (user?.role === 'TEACHER') {
      const storedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
      const teacherCourses = storedCourses.filter(course => course.instructorId === user.id);
      setCourses(teacherCourses);
    }
  };

  const handleFileUpload = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject('No file selected');

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) return reject('File too large (max 10MB)');
      if (file.size === 0) return reject('Empty file');

      setIsUploading(true);
      setUploadProgress(0);

      const reader = new FileReader();
      reader.onload = (event) => {
        const interval = setInterval(() => {
          setUploadProgress(p => {
            if (p >= 100) {
              clearInterval(interval);
              const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const data = { id: fileId, name: file.name, content: event.target.result };

              const existing = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
              existing[fileId] = data;
              localStorage.setItem('uploadedFiles', JSON.stringify(existing));

              setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                resolve(fileId);
              }, 600);
              return 100;
            }
            return p + 15;
          });
        }, 200);
      };
      reader.onerror = () => reject('File reading failed');
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      let fileId = formData.fileId || null;
      if (formData.file) {
        fileId = await handleFileUpload(formData.file);
      }

      const newNote = {
        id: formData.id || Date.now(),
        title: formData.title,
        content: formData.content,
        courseId: formData.courseId,
        visibility: formData.visibility,
        fileId,
        attachmentName: formData.fileName,
        author: user.name,
        authorId: user.id,
        createdAt: formData.id ? notes.find(n => n.id === formData.id)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const storedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
      if (formData.id) {
        const index = storedNotes.findIndex(n => n.id === formData.id);
        storedNotes[index] = newNote;
      } else {
        storedNotes.push(newNote);
      }
      localStorage.setItem('notes', JSON.stringify(storedNotes));

      setNotes(prev => {
        const newList = [...prev];
        const index = newList.findIndex(n => n.id === formData.id);
        if (index !== -1) newList[index] = newNote;
        else newList.push(newNote);
        return newList;
      });
      setShowModal(false);
      setShowEditModal(false);
      setFormData({ id: '', title: '', content: '', courseId: '', visibility: 'ALL', file: null, fileName: '' });
      setSuccess(formData.id ? 'Note updated successfully!' : 'Note created successfully!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed: ' + err);
    }
  };

  const deleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const storedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
      const updatedNotes = storedNotes.filter(note => note.id !== noteId);
      localStorage.setItem('notes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
      setSuccess('Note deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const downloadAttachment = (note) => {
    if (note.fileId) {
      const files = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
      const file = files[note.fileId];
      if (file?.content) {
        const a = document.createElement('a');
        a.href = file.content;
        a.download = note.attachmentName || 'download';
        a.click();
      }
    }
  };

  const handleEditNote = (note) => {
    setFormData({ ...note, file: null, fileName: note.fileId ? note.fileName : '' });
    setShowEditModal(true);
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === parseInt(courseId));
    return course ? course.title : 'General';
  };

  return (
    <Container className="my-5 pt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                {user?.role === 'TEACHER' ? 'Manage Notes' : 'Course Notes'}
              </h2>
              <p className="text-muted">
                {user?.role === 'TEACHER'
                  ? 'Create and manage notes for your courses'
                  : 'View notes from your enrolled courses'
                }
              </p>
            </div>
            {user?.role === 'TEACHER' && (
              <Button variant="primary" className="moodle-btn-primary" onClick={() => setShowModal(true)}>
                <i className="bi bi-plus-circle me-2"></i>
                Add New Note
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {success && <Alert variant="success" className="alert-success">{success}</Alert>}
      {error && <Alert variant="danger" className="alert-danger">{error}</Alert>}

      {/* Notes List */}
      <Row>
        <Col lg={user?.role === 'TEACHER' ? 10 : 8} className="mx-auto">
          {notes.length > 0 ? (
            <ListGroup variant="flush">
              {notes.map((note) => (
                <ListGroup.Item key={note.id} className="px-0 mb-3">
                  <Card className="moodle-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h5 className="mb-1">{note.title}</h5>
                          <div className="mb-2">
                            <Badge bg="secondary" className="me-2">
                              {getCourseName(note.courseId)}
                            </Badge>
                            <Badge bg={note.visibility === 'ALL' ? 'success' : 'info'}>
                              {note.visibility === 'ALL' ? 'All Students' : 'Course Only'}
                            </Badge>
                          </div>
                        </div>
                        {user?.role === 'TEACHER' && (
                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="moodle-btn-primary me-2"
                              onClick={() => handleEditNote(note)}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="moodle-btn-danger"
                              onClick={() => deleteNote(note.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        )}
                      </div>

                      <p className="text-muted mb-3">{note.content}</p>

                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          By {note.author} • {new Date(note.createdAt).toLocaleDateString()}
                        </small>

                        <div className="d-flex gap-2">
                          {note.fileId && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="moodle-btn-primary"
                              onClick={() => downloadAttachment(note)}
                            >
                              <i className="bi bi-download me-1"></i>
                              Download {note.attachmentName}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Card className="text-center py-5 moodle-card">
              <Card.Body>
                <i className="bi bi-journal-text text-muted" style={{ fontSize: '3rem' }}></i>
                <h5 className="text-muted mt-3">
                  {user?.role === 'TEACHER' ? 'No Notes Created' : 'No Notes Available'}
                </h5>
                <p className="text-muted">
                  {user?.role === 'TEACHER'
                    ? 'Start creating notes for your students.'
                    : 'No notes have been posted for your enrolled courses yet.'
                  }
                </p>
                {user?.role === 'TEACHER' && (
                  <Button variant="primary" className="moodle-btn-primary" onClick={() => setShowModal(true)}>
                    Create Your First Note
                  </Button>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Add Note Modal (Teachers only) */}
      {user?.role === 'TEACHER' && (
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{formData.id ? 'Edit' : 'Add'} Note</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Title *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Enter note title"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Course</Form.Label>
                    <Form.Select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    >
                      <option value="">General (All Courses)</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Content *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  placeholder="Enter note content..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Visibility</Form.Label>
                <Form.Select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                >
                  <option value="ALL">All Students</option>
                  <option value="COURSE">Course Students Only</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Attachment (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setFormData({ ...formData, file, fileName: file.name });
                  }}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx"
                />
                <Form.Text className="text-muted">
                  Supported formats: PDF, Word, Text, Images, PowerPoint (Max 10MB)
                </Form.Text>
                {formData.fileName && (
                  <div className="mt-2">
                    <Badge bg="success" className="me-2">
                      📎 {formData.fileName}
                    </Badge>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setFormData({ ...formData, file: null, fileName: '' })}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </Form.Group>
              {isUploading && <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" className="moodle-btn" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="moodle-btn-primary" disabled={isUploading}>
                {formData.id ? 'Update' : 'Create'} Note
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* Edit Note Modal (Teachers only) */}
      {user?.role === 'TEACHER' && (
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Note</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Title *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Enter note title"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Course</Form.Label>
                    <Form.Select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    >
                      <option value="">General (All Courses)</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Content *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  placeholder="Enter note content..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Visibility</Form.Label>
                <Form.Select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                >
                  <option value="ALL">All Students</option>
                  <option value="COURSE">Course Students Only</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Attachment (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setFormData({ ...formData, file, fileName: file.name });
                  }}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx"
                />
                <Form.Text className="text-muted">
                  Supported formats: PDF, Word, Text, Images, PowerPoint (Max 10MB)
                </Form.Text>
                {formData.fileName && (
                  <div className="mt-2">
                    <Badge bg="success" className="me-2">
                      📎 {formData.fileName}
                    </Badge>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setFormData({ ...formData, file: null, fileName: '' })}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </Form.Group>
              {isUploading && <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" className="moodle-btn" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="moodle-btn-primary" disabled={isUploading}>
                Update Note
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Container>
  );
};

export default NotesManagement;