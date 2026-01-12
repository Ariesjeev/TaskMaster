//console.log("Hello World!")


import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
  role?: string;
  isActive?: boolean;
  
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      localStorage.removeItem("user"); 
    }
  }, []);

  const login = (userData: User): void => {
    setUser(userData);
    try {
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving user to localStorage:", error);
    }
  };

  const logout = (): void => {
    setUser(null);
    try {
      localStorage.removeItem("user");
      navigate("/");
    } catch (error) {
      console.error("Error removing user from localStorage:", error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
