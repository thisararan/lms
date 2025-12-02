import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');

      if (token && user) {
        setAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
        });
      } else {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    }
  };

  const login = async (loginData) => {
    try {
      console.log('🔐 Attempting login with:', loginData);
      
      const response = await apiService.auth.login({
        email: loginData.email,
        password: loginData.password
      });

      console.log('✅ Login response:', response);

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      // Handle different response formats
      let token, user;

      if (response.data.data && response.data.data.token) {
        // New format: { success: true, message: "...", data: { token, user } }
        token = response.data.data.token;
        user = response.data.data.user;
      } else if (response.data.token) {
        // Old format: { token, user }
        token = response.data.token;
        user = response.data.user;
      } else {
        throw new Error('Invalid response format: Missing token');
      }

      if (!token) {
        throw new Error('No authentication token received');
      }

      // Ensure user object has required fields
      const enrichedUser = {
        id: user?.id || Date.now(),
        name: user?.name || loginData.email.split('@')[0],
        email: user?.email || loginData.email,
        role: user?.role || 'STUDENT',
        studentId: user?.studentId || '',
        phone: user?.phone || '',
        qualification: user?.qualification || '',
        status: user?.status || 'ACTIVE',
        ...user
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(enrichedUser));

      setAuthState({
        isAuthenticated: true,
        user: enrichedUser,
        token: token,
        loading: false,
      });

      return { success: true, user: enrichedUser };

    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        const { status, data } = error.response;
        console.error('📡 Error response:', { status, data });
        
        if (data) {
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.message) {
            errorMessage = data.message.replace(/Login failed:\s*/g, '');
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.data?.message) {
            errorMessage = data.data.message;
          }
        }
        
        if (status === 400 || status === 401) {
          if (errorMessage.toLowerCase().includes('bad credentials') || 
              errorMessage.toLowerCase().includes('invalid email or password')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
          } else {
            errorMessage = errorMessage || 'Invalid login information';
          }
        } else if (status === 404) {
          errorMessage = 'Account not found. Please check your email or register.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const studentLogin = async (loginData) => {
    try {
      console.log('🎓 Student login attempt:', loginData);
      
      const result = await login(loginData);
      
      if (!result.success) {
        return result;
      }
      
      // Check if user has student role
      if (result.user.role && result.user.role !== 'STUDENT') {
        logout();
        return { 
          success: false, 
          error: 'Access denied: Please use the Teacher/Admin login page.' 
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ Student login error:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred during login' 
      };
    }
  };

  const teacherLogin = async (loginData) => {
    try {
      console.log('👨‍🏫 Teacher login attempt:', loginData);
      
      const result = await login(loginData);
      
      if (!result.success) {
        return result;
      }
      
      if (result.user.role !== 'TEACHER' && result.user.role !== 'ADMIN') {
        logout();
        return { 
          success: false, 
          error: 'Access denied: Teacher or Admin credentials required.' 
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ Teacher login error:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred during login' 
      };
    }
  };

  const adminLogin = async (loginData) => {
    try {
      console.log('👑 Admin login attempt:', loginData);
      
      const result = await login(loginData);
      
      if (!result.success) {
        return result;
      }

      if (result.user.role !== 'ADMIN') {
        logout();
        return { 
          success: false, 
          error: 'Access denied: Admin credentials required.' 
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Admin login error:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred during login' 
      };
    }
  };

  const studentRegister = async (registerData) => {
    try {
      console.log('🎓 Student registration attempt:', registerData);
      
      // Prepare registration data
      const registrationData = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        studentId: registerData.studentId || `ST${Date.now()}`,
        phone: registerData.phone || '',
        qualification: registerData.qualification || '',
        role: 'STUDENT'
      };

      console.log('📤 Sending registration data:', registrationData);

      // Try multiple registration endpoints
      const registerAttempts = [
        () => apiService.auth.registerStudent(registrationData),
        () => apiService.auth.register(registrationData),
        () => apiService.post('/api/auth/register/student', registrationData),
        () => apiService.post('/api/auth/register', registrationData)
      ];

      let response = null;
      let lastError = null;

      for (const attempt of registerAttempts) {
        try {
          console.log('🔄 Trying registration endpoint...');
          response = await attempt();
          console.log('✅ Registration response:', response);
          
          if (response && (response.data || response.status === 200)) {
            console.log('🎉 Registration successful!');
            break;
          }
        } catch (error) {
          console.log('❌ Registration attempt failed:', error.response?.status, error.response?.data);
          lastError = error;
        }
      }

      if (!response) {
        throw lastError || new Error('All registration endpoints failed');
      }
      
      return { 
        success: true, 
        message: 'Registration successful! Please login with your credentials.',
        data: response.data 
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Registration failed';
      
      if (error.response) {
        const { status, data } = error.response;
        console.error('📡 Error details:', { status, data });
        
        if (status === 400) {
          if (data && data.message) {
            errorMessage = data.message;
          } else {
            errorMessage = 'Invalid registration data. Please check all fields.';
          }
        } else if (status === 409) {
          errorMessage = 'An account with this email already exists.';
        } else if (status === 404) {
          errorMessage = 'Registration service unavailable. Please try again later.';
        } else if (status === 500) {
          errorMessage = 'Server error during registration. Please try again.';
        } else {
          errorMessage = data?.message || `Registration failed with status ${status}`;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      errorMessage = errorMessage.replace(/Registration failed:\s*/g, '');
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    });
  };

  const value = {
    ...authState,
    login,
    studentLogin,
    teacherLogin,
    adminLogin,
    studentRegister,
    logout,
    isStudent: () => authState.user?.role === 'STUDENT',
    isTeacher: () => authState.user?.role === 'TEACHER',
    isAdmin: () => authState.user?.role === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {!authState.loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;