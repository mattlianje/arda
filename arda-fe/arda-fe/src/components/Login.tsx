import React, { useState } from 'react';
import ardaLogo from '../assets/arda.png';
import { API_BASE_URL } from '../utils/api';

interface LoginProps {
  onLogin: (username: string, role: 'admin' | 'user') => void;
}

interface SafeUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface LoginResponse {
  token: string;
  message: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!loginResponse.ok) {
        const error = await loginResponse.text();
        alert(error || 'Login failed');
        return;
      }

      const { token, message }: LoginResponse = await loginResponse.json();

      document.cookie = `token=${token}; path=/`;
      console.log('Login successful:', message);

      const userResponse = await fetch(`${API_BASE_URL}/users/user/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        const error = await userResponse.text();
        alert(error || 'Failed to get user details');
        return;
      }

      const userData: SafeUser = await userResponse.json();
      onLogin(userData.username, userData.isAdmin ? 'admin' : 'user');
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f0f0',
      }}
    >
      <div
        style={{
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
          width: '320px',
        }}
      >
        <img
          src={ardaLogo}
          alt="Arda Logo"
          style={{
            width: '130px',
            marginBottom: '10px',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
        <h2
          style={{
            marginTop: '5px',
            marginBottom: '20px',
            fontSize: '24px',
            color: '#333',
          }}
        >
          Arda
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          style={{
            padding: '12px',
            marginBottom: '15px',
            width: 'calc(100% - 24px)',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '16px',
            opacity: loading ? 0.7 : 1,
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          style={{
            padding: '12px',
            marginBottom: '20px',
            width: 'calc(100% - 24px)',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '16px',
            opacity: loading ? 0.7 : 1,
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: '10px 0',
            width: '30%',
            borderRadius: '6px',
            backgroundColor: '#6cace4',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            margin: '0 auto',
            display: 'block',
            opacity: loading ? 0.7 : 1,
            position: 'relative',
          }}
        >
          {loading ? <span style={{ opacity: 0.9 }}>Logging in...</span> : <span>Login</span>}
        </button>
      </div>
    </div>
  );
};

export default Login;
