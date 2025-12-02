import React, { useState } from 'react';
import { Form, Button, ProgressBar, Alert } from 'react-bootstrap';

const FileUpload = ({ onUploadSuccess, allowedTypes, maxSize, multiple = false }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // File validation function
  const validateFile = (file, allowedTypes, maxSize) => {
    const errors = [];

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (maxSize && file.size > maxSize) {
      errors.push(`File size too large. Maximum size: ${formatFileSize(maxSize)}`);
    }

    return errors;
  };

  // File size formatting function
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
      const fileErrors = validateFile(file, allowedTypes, maxSize);
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
      // Simulate upload progress
      const uploadPromises = files.map(async (file) => {
        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setProgress(i);
        }
        
        // Convert file to base64 for localStorage storage
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              content: event.target.result, // Base64 content
              file: file // Keep the actual file object
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(uploadPromises);
      const uploadedFiles = results.map(result => result);
      
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

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: '📕',
      doc: '📘',
      docx: '📘',
      txt: '📄',
      ppt: '📊',
      pptx: '📊',
      xls: '📊',
      xlsx: '📊',
      zip: '📦',
      rar: '📦',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎬',
      mp3: '🎵'
    };
    return iconMap[extension] || '📎';
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      
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
            <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
              <div className="d-flex align-items-center">
                <span className="me-2 fs-5">{getFileIcon(file.name)}</span>
                <div>
                  <div className="fw-medium">{file.name}</div>
                  <small className="text-muted">({formatFileSize(file.size)})</small>
                </div>
              </div>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                Remove
              </Button>
            </div>
          ))}
          
          <div className="d-flex gap-2 mt-3">
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Uploading...
                </>
              ) : (
                `Upload File${files.length > 1 ? 's' : ''}`
              )}
            </Button>
            
            <Button
              variant="outline-secondary"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small>Upload Progress</small>
            <small>{progress}%</small>
          </div>
          <ProgressBar now={progress} label={`${Math.round(progress)}%`} />
        </div>
      )}

      {files.length === 0 && !uploading && (
        <div className="mt-2">
          <small className="text-muted">
            No files selected. {multiple ? 'Select one or more files to upload.' : 'Select a file to upload.'}
          </small>
        </div>
      )}
    </div>
  );
};

export default FileUpload;