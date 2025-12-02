import React from 'react';
import { Button, Badge } from 'react-bootstrap';

const FileDownload = ({ file, onDownload, showSize = true }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const handleDownload = () => {
    if (file.content) {
      const a = document.createElement('a');
      a.href = file.content;
      a.download = file.name;
      a.click();
    }
    if (onDownload) onDownload(file);
  };

  return (
    <div className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 moodle-card">
      <div className="d-flex align-items-center">
        <span className="me-2 fs-5">{getFileIcon(file.name)}</span>
        <div>
          <div className="fw-medium">{file.name}</div>
          {showSize && (
            <small className="text-muted">
              {formatFileSize(file.size)} • {new Date(file.uploadedAt || Date.now()).toLocaleDateString()}
            </small>
          )}
        </div>
      </div>
      <Button
        variant="outline-primary"
        size="sm"
        className="moodle-btn-primary"
        onClick={handleDownload}
      >
        <i className="bi bi-download me-1"></i>
        Download
      </Button>
    </div>
  );
};

export default FileDownload;