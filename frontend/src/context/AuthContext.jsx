import { useCallback, useState } from 'react';
import { AuthContext } from './AuthContext.js';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(
    localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null
  );

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('userInfo');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
