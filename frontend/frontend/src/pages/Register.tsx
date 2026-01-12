import React, { useState, useContext, useEffect, ChangeEvent, FormEvent } from "react";
import { Form, Input, Button, notification, Space } from "antd";
import { Link } from "react-router-dom";
import { registerUser } from "../services/api";
import AuthContext from "../context/AuthContext";
import "./Register.css";

const Register: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  const { register } = useContext(AuthContext);
  
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
  
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
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

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
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

    if (password !== confirmPassword) {
      showNotification("Passwords do not match!", "error");
      return;
    }

    try {
      const userData = await registerUser({ name, email, password });
      alert("Registration successful!", "success");
     
      setName(""); // after successfully register the datafield will removed vanished
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
      register(userData);
      }, 300);
    } catch (error: any) {
      alert(error.message || "Registration failed. Please try again.", "error");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Create Your Account</h2>

        <Form onSubmitCapture={handleSubmit} layout="vertical">
          <Form.Item label="Full Name" required>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="Email Address"
            required
            validateStatus={emailError ? "error" : ""}
            help={emailError ? "Please enter a valid email address" : ""}
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            required
            validateStatus={passwordError ? "error" : ""}
            help={passwordError ? "Password must be at least 6 characters" : ""}
          >
            <Input.Password
              placeholder="Enter your password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              visibilityToggle
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            required
            validateStatus={password !== confirmPassword ? "error" : ""}
            help={password !== confirmPassword ? "Passwords do not match!" : ""}
          >
            <Input.Password
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              visibilityToggle
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Account
            </Button>
          </Form.Item>

          <Space direction="vertical" size={10}>
            <p>
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
          </Space>
        </Form>
      </div>
    </div>
  );
};

export default Register;
