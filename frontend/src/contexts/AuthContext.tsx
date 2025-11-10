import React, { createContext, useContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';

interface StudentData {
  enrollmentNo: string;
  name: string;
  course: string;
  currentSemester: number | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  role: 'student' | 'admin' | null;
  studentData: StudentData | null;
  login: (token: string, studentData?: StudentData) => void;
  logout: () => void;
  updateStudentData: (data: StudentData) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  role: null,
  studentData: null,
  login: () => {},
  logout: () => {},
  updateStudentData: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState<'student' | 'admin' | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedStudentData = localStorage.getItem('studentData');
    
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser(decoded);
        setRole(decoded.role);
        setIsAuthenticated(true);
        
        if (storedStudentData) {
          setStudentData(JSON.parse(storedStudentData));
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('studentData');
      }
    }
  }, []);

  const login = (token: string, newStudentData?: StudentData) => {
    localStorage.setItem('token', token);
    if (newStudentData) {
      localStorage.setItem('studentData', JSON.stringify(newStudentData));
      setStudentData(newStudentData);
    }
    const decoded: any = jwtDecode(token);
    setUser(decoded);
    setRole(decoded.role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('studentData');
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setStudentData(null);
  };

  const updateStudentData = (data: StudentData) => {
    localStorage.setItem('studentData', JSON.stringify(data));
    setStudentData(data);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        role, 
        studentData,
        login, 
        logout,
        updateStudentData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;