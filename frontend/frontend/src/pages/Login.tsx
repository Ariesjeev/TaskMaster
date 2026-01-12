import React, { useState, useContext, ChangeEvent, FormEvent } from "react";
import { Input, Button, Form, notification, Space } from "antd";
import AuthContext from "../context/AuthContext";
import { loginUser } from "../services/api";
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { login } = useContext(AuthContext);

  const [emailError, setEmailError] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<boolean>(false);

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string): boolean => password.length >= 6;

  const showNotification = (message: string, type: "success" | "error"): void => {
    notification[type]({
      message,
      duration: 2,
    });
  };

  const handleEmail = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError(true);
      if (value.length > 5) {
        showNotification("Please enter a valid email address", "error");
      }
    } else {
      setEmailError(false);
    }
  };

  const handlePassword = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setPassword(value);
    if (value && !validatePassword(value)) {
      setPasswordError(true);
      if (value.length > 2) {
        showNotification("Password must be at least 6 characters", "error");
      }
    } else {
      setPasswordError(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateEmail(email)) {
      showNotification("Please enter a valid email address", "error");
      return;
    }

    if (!validatePassword(password)) {
      showNotification("Password must be at least 6 characters", "error");
      return;
    }

    try {
      const userData = await loginUser({ email, password });
      showNotification("Login successful!", "success");
      setTimeout(() => {
        login(userData);
      }, 300);
    } catch (error: any) {
      showNotification(error.message || "Login failed. Please try again.", "error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Sign In</h2>
        <p className="login-subtitle">Welcome back! Please sign in to your account.</p>

        <Form onSubmitCapture={handleSubmit} layout="vertical" className="login-form">
        
          <Form.Item
            label="Email Address"
            validateStatus={emailError ? "error" : ""}
            help={emailError ? "Please enter a valid email address" : ""}
            required
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmail}
            />
          </Form.Item>

         
          <Form.Item
            label="Password"
            validateStatus={passwordError ? "error" : ""}
            help={passwordError ? "Password must be at least 6 characters" : ""}
            required
          >
            <Input.Password
              placeholder="Enter your password"
              value={password}
              onChange={handlePassword}
            />
          </Form.Item>

        
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Space direction="vertical" size={10}>
          <div className="register-link">
            Don't have an account? <a href="/register">Sign up</a>
          </div>
        </Space>
      </div>
    </div>
  );
};

export default Login;
