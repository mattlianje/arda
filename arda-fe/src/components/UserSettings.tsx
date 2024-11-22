import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/api';

interface UserSettingsProps {
  username: string | null;
}

const getAuthHeaders = () => {
  const token = document.cookie.split('token=')[1]?.split(';')[0];
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const UserSettings: React.FC<UserSettingsProps> = ({ username }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = () => {
    if (!username) {
      alert('No user logged in');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    fetch(`${API_BASE_URL}/users/password/${username}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to update password');
        return response.text();
      })
      .then(() => {
        alert('Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((error) => {
        console.error('Error changing password:', error);
        alert('Failed to change password');
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>User Settings</h2>
      <div style={{ marginTop: '20px' }}>
        <h3>Change Password</h3>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          style={{ padding: '10px', marginRight: '10px' }}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          style={{ padding: '10px', marginRight: '10px' }}
        />
        <button
          onClick={handlePasswordChange}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6cace4',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default UserSettings;
