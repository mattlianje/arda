import React, { useState } from 'react';
import Login from './components/Login';
import AlbumList from './components/AlbumList';
import PhotoGrid from './components/PhotoGrid';
import AdminPanel from './components/AdminPanel';
import UserSettings from './components/UserSettings';

interface User {
  id: number;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
}

interface Album {
  id: number;
  name: string;
  ownerId: number;
}

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [users, setUsers] = useState<User[]>([
    { id: 1, username: 'user1', passwordHash: 'hash1', isAdmin: false },
    { id: 2, username: 'user2', passwordHash: 'hash2', isAdmin: false },
  ]);

  const [albums, setAlbums] = useState<Album[]>([
    { id: 1, name: 'Vacation', ownerId: 1 },
    { id: 2, name: 'Family', ownerId: 1 },
    { id: 3, name: 'Friends', ownerId: 1 },
  ]);

  const [photos, setPhotos] = useState<Record<string, string[]>>({});

  const handleLogin = (username: string, role: 'admin' | 'user') => {
    setIsLoggedIn(true);
    setRole(role);
    setUsername(username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setSelectedAlbum(null);
    setShowSettings(false);
  };

  const handleAlbumClick = (album: string, albumPhotos: string[]) => {
    setSelectedAlbum(album);
    setPhotos((prevPhotos) => ({
      ...prevPhotos,
      [album]: albumPhotos,
    }));
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div>
      {isLoggedIn && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            padding: '10px',
            backgroundColor: '#f0f0f0',
            width: '100%',
            textAlign: 'right',
            zIndex: 100,
          }}
        >
          <span style={{ marginRight: '20px' }}>
            Welcome, {role === 'admin' ? 'Admin' : username}
          </span>
          <button
            onClick={toggleSettings}
            style={{
              backgroundColor: '#6cace4',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginRight: '10px',
            }}
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ff6666',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Logout
          </button>
        </div>
      )}

      <div style={{ marginTop: '60px' }}>
        {!isLoggedIn ? (
          <Login onLogin={handleLogin} />
        ) : showSettings ? (
          role === 'admin' && username ? (
            <div>
              <AdminPanel
                users={users}
                albums={albums}
                photos={photos}
                setAlbums={setAlbums}
                setPhotos={setPhotos}
                setUsers={setUsers}
                currentUser={username}
                isAdmin={role === 'admin'}
              />
              <UserSettings username={username} />
            </div>
          ) : (
            <UserSettings username={username} />
          )
        ) : selectedAlbum ? (
          <PhotoGrid
            album={selectedAlbum}
            photos={photos[selectedAlbum] || []}
            onBack={handleBackToAlbums}
          />
        ) : (
          <AlbumList onAlbumClick={handleAlbumClick} />
        )}
      </div>
    </div>
  );
};

export default App;
