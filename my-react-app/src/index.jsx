import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

// CSS Imports
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './styles/App.css';
import './styles/MoodleTheme.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);