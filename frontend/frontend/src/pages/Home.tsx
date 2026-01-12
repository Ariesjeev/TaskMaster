{/*

import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6 relative overflow-hidden bg-cover bg-center"
      style={{
        //backgroundImage: 
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
      
        
        <h1 className="text-5xl font-bold mb-6 text-gray-800">
          Welcome to Our <br/>
          <span className="text-blue-600">TaskMaster</span>
        </h1>
        
        <p className="text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stay organized and enhance productivity with our efficient task. Achieve focus, structure, and peace of mind with our intuitive task management To-Do platform.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Link
            to="/login"
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Get Started</span>
          </Link>
          
          <Link
            to="/register"
            className="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.0/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Create Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
*/}


 
import React, { useState, useEffect } from "react";
//import './App.css';
import './Home.css';
import { Link } from "react-router-dom";

import { 
  UserPlus
} from "lucide-react";

const Home: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="home-container">
      <div className={`home-content ${isVisible ? 'visible' : 'hidden'}`}>
        <h1 className="home-title">
          Welcome to <p></p> <span className="highlight">TaskMaster</span>
        </h1>

        <p className="home-subtitle">
          Stay organized and enhance productivity with our efficient task management system. 
          Achieve <strong>focus</strong>, <strong>structure</strong>, and <strong>peace of mind</strong> with our intuitive platform.
        </p>

        <div className="home-buttons">
          <button>
            <Link to="/login" className="home-button">
              <UserPlus className="icon" />
              <span>Get Started</span>
            </Link>
          </button>

          <button>
            <Link to="/register" className="home-button">
              <UserPlus className="icon" />
              <span>Create Account</span>
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
