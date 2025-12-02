import React, { useState } from 'react';
import { Form, Button, ProgressBar, Alert } from 'react-bootstrap';

const FileUpload = ({ onUploadSuccess, allowedTypes, maxSize, multiple = false }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    const errors = [];

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed`);
    }

    if (maxSize && file.size > maxSize) {
      errors.push(`File too large (max ${formatFileSize(maxSize)})`);
    }

    return errors;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setError('');
    
    const validFiles = [];
    const errors = [];

    selectedFiles.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${fileErrors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('; '));
    }

    setFiles(multiple ? validFiles : validFiles.slice(0, 1));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const uploadPromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const interval = setInterval(() => {
              setProgress(p => {
                if (p >= 100) {
                  clearInterval(interval);
                  resolve({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content: e.target.result
                  });
                  return 100;
                }
                return p + 15;
              });
            }, 200);
          };
          reader.readAsDataURL(file);
        });
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      if (onUploadSuccess) {
        onUploadSuccess(multiple ? uploadedFiles : uploadedFiles[0]);
      }
      
      setFiles([]);
      setError('');
    } catch (error) {
      setError('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      {error && <Alert variant="danger" className="alert-danger">{error}</Alert>}
      
      <Form.Group>
        <Form.Label>Choose File(s)</Form.Label>
        <Form.Control
          type="file"
          multiple={multiple}
          onChange={handleFileChange}
          disabled={uploading}
          accept={allowedTypes?.join(',')}
        />
        <Form.Text className="text-muted">
          {allowedTypes && `Allowed types: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`}
          {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
        </Form.Text>
      </Form.Group>

      {files.length > 0 && (
        <div className="mt-3">
          <h6>Selected Files:</h6>
          {files.map((file, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded moodle-card">
              <div>
                <strong>{file.name}</strong>
                <small className="text-muted ms-2">({formatFileSize(file.size)})</small>
              </div>
              <Button
                variant="outline-danger"
                size="sm"
                className="moodle-btn-danger"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                Remove
              </Button>
            </div>
          ))}
          
          <Button
            variant="primary"
            className="moodle-btn-primary mt-2"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      )}

      {uploading && (
        <div className="mt-3">
          <ProgressBar now={progress} label={`${Math.round(progress)}%`} />
        </div>
      )}
    </div>
  );
};

export default FileUpload;