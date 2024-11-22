import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../utils/auth';
import { API_BASE_URL } from '../utils/api';

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

interface Photo {
  id: number;
  url: string;
}

interface AdminPanelProps {
  users: User[];
  albums: Album[];
  photos: Record<string, string[]>;
  setAlbums: React.Dispatch<React.SetStateAction<Album[]>>;
  setPhotos: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: string | null;
  isAdmin: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  albums,
  photos,
  setAlbums,
  setPhotos,
  setUsers,
  currentUser,
  isAdmin,
}) => {
  const [newUser, setNewUser] = useState('');
  const [newAlbum, setNewAlbum] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'albums' | 'photos'>('users');
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [availablePhotos, setAvailablePhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/users/users`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    })
      .then((response) => response.json())
      .then((data: User[]) => {
        setUsers(data);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
      });
  }, [setUsers]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/albums`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    })
      .then((response) => response.json())
      .then((data: Album[]) => {
        setAlbums(data);
      })
      .catch((error) => {
        console.error('Error fetching albums:', error);
      });
  }, [setAlbums]);

  useEffect(() => {
    if (activeTab === 'photos') {
      fetchAvailablePhotos();
    }
  }, [activeTab]);

  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  const handleAddUser = async () => {
    try {
      if (!newUser) {
        alert('Username is required');
        return;
      }

      if (users.find((u) => u.username === newUser)) {
        alert('Username already exists');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 0,
          username: newUser,
          passwordHash: 'password',
          isAdmin: newUserIsAdmin,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const createdUser = await response.json();
      setUsers((prevUsers) => [...prevUsers, createdUser]);
      setNewUser('');
      setNewUserIsAdmin(false);
      alert(`User ${createdUser.username} created successfully`);
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to create user');
    }
  };

  const handleDeleteUser = (userId: number) => {
    fetch(`${API_BASE_URL}/users/user/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to delete user');
        return response.text();
      })
      .then((message) => {
        console.log(message);
        setUsers(users.filter((u) => u.id !== userId));
      })
      .catch((error) => console.error('Error deleting user:', error));
  };

  const handleResetPassword = (user: string) => {
    if (isAdmin || user === currentUser) {
      fetch(`${API_BASE_URL}/users/password/${user}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'password' }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Failed to reset password');
          return response.text();
        })
        .then(() => {
          alert(`Password for ${user} has been reset to 'password'`);
        })
        .catch((error) => {
          console.error('Error resetting password:', error);
          alert('Failed to reset password');
        });
    } else {
      alert('You can only reset your own password.');
    }
  };

  const handleAddAlbum = () => {
    if (newAlbum && !albums.find((a) => a.name === newAlbum)) {
      fetch(`${API_BASE_URL}/albums/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${newAlbum}`,
      })
        .then((response) => response.json())
        .then((newAlbumData: Album) => {
          console.log('Album created:', newAlbumData);
          setAlbums([...albums, newAlbumData]);
          setPhotos({ ...photos, [newAlbumData.name]: [] });
          setNewAlbum('');
        })
        .catch((error) => console.error('Error creating album:', error));
    }
  };

  const handleRemoveAlbum = (album: Album) => {
    fetch(`${API_BASE_URL}/albums/delete/${album.id}`, {
      method: 'POST',
    })
      .then((response) => response.text())
      .then((message) => {
        console.log(message);
        const updatedAlbums = albums.filter((a) => a.id !== album.id);
        const updatedPhotos = { ...photos };
        delete updatedPhotos[album.name];
        setAlbums(updatedAlbums);
        setPhotos(updatedPhotos);
      })
      .catch((error) => console.error('Error deleting album:', error));
  };

  const fetchAvailablePhotos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/photos`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const photoIds = await response.text();
        const ids = photoIds
          .replace(/List\(|\)/g, '')
          .split(',')
          .map((id) => parseInt(id.trim(), 10));

        const photoDetails = await Promise.all(
          ids.map(async (id) => {
            const photoResponse = await fetch(`${API_BASE_URL}/photos/${id}`, {
              credentials: 'include',
              headers: getAuthHeaders(),
            });
            const blob = await photoResponse.blob();
            return {
              id,
              url: URL.createObjectURL(blob),
            };
          })
        );

        setAvailablePhotos(photoDetails);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const handlePhotoSelect = (photoId: number) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleAddPhotos = async (albumId: number) => {
    setShowPhotoSelector(true);
    setSelectedAlbumId(albumId);
    await fetchAvailablePhotos();
  };

  const handleLinkPhotos = async () => {
    if (!selectedAlbumId || selectedPhotoIds.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/albums/${selectedAlbumId}/photos/link`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `photoIds=${selectedPhotoIds.join(',')}`,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to link photos: ${errorText}`);
      }

      const result = await response.text();
      console.log('Photos linked successfully:', result);

      const album = albums.find((a) => a.id === selectedAlbumId);
      if (album) {
        const photosResponse = await fetch(`${API_BASE_URL}/albums/${album.name}/photos`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });

        if (!photosResponse.ok) {
          const errorText = await photosResponse.text();
          throw new Error(`Failed to fetch updated photos: ${errorText}`);
        }

        const photoIds = await photosResponse.text();
        setPhotos((prev) => ({
          ...prev,
          [album.name]: photoIds.split(',').filter((id) => id.trim() !== ''),
        }));
      }

      setSelectedPhotoIds([]);
      setShowPhotoSelector(false);
      setSelectedAlbumId(null);
    } catch (error) {
      console.error('Error in photo linking process:', error);
      alert(error instanceof Error ? error.message : 'Failed to link photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div
        style={{
          width: '200px',
          backgroundColor: '#2e2e2e',
          color: 'white',
          padding: '20px',
        }}
      >
        <h3>Settings</h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li
            style={{ marginBottom: '10px', cursor: 'pointer' }}
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </li>
          <li
            style={{ marginBottom: '10px', cursor: 'pointer' }}
            onClick={() => setActiveTab('albums')}
          >
            Manage Albums
          </li>
          <li
            style={{ marginBottom: '10px', cursor: 'pointer' }}
            onClick={() => setActiveTab('photos')}
          >
            Manage Photos
          </li>
        </ul>
      </div>

      <div style={{ padding: '20px', flex: 1, position: 'relative' }}>
        {activeTab === 'users' && (
          <div>
            <h2>User Management</h2>

            <table style={{ width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.isAdmin ? 'Admin' : 'User'}</td>
                    <td>
                      <button
                        onClick={() => handleResetPassword(user.username)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#6cace4',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: 'none',
                          marginRight: '10px',
                        }}
                      >
                        Reset Password
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#ff6666',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: 'none',
                          }}
                        >
                          Delete User
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isAdmin && (
              <div style={{ marginTop: '20px' }}>
                <input
                  type="text"
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                  placeholder="New User Name"
                  style={{ padding: '10px', marginRight: '10px' }}
                />
                <div
                  style={{
                    display: 'inline-block',
                    marginRight: '10px',
                    alignItems: 'center',
                  }}
                >
                  <label style={{ marginRight: '5px' }}>
                    <input
                      type="checkbox"
                      checked={newUserIsAdmin}
                      onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                      style={{ marginRight: '5px' }}
                    />
                    Admin User
                  </label>
                </div>
                <button
                  onClick={handleAddUser}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6cace4',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Add User
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'albums' && (
          <div>
            <h2>Album Management</h2>
            <table
              style={{
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '6px',
              }}
            >
              <thead>
                <tr>
                  <th>Album</th>
                  <th>Owner ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {albums.map((album) => (
                  <tr key={album.id}>
                    <td>{album.name}</td>
                    <td>{album.ownerId}</td>
                    <td>
                      <button
                        onClick={() => handleAddPhotos(album.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#6cace4',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: 'none',
                          marginRight: '10px',
                        }}
                      >
                        Link Photos
                      </button>
                      <button
                        onClick={() => handleRemoveAlbum(album)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ff6666',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: 'none',
                        }}
                      >
                        Remove Album
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '20px' }}>
              <input
                type="text"
                value={newAlbum}
                onChange={(e) => setNewAlbum(e.target.value)}
                placeholder="New Album Name"
                style={{ padding: '10px', marginRight: '10px' }}
              />
              <button
                onClick={handleAddAlbum}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6cace4',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Add Album
              </button>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            <h2>Photo Management</h2>

            <div style={{ marginBottom: '40px' }}>
              <h3>Upload New Photos</h3>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const files = Array.from(e.dataTransfer.files).filter((file) =>
                    file.type.startsWith('image/')
                  );

                  if (files.length === 0) {
                    alert('Please drop image files only');
                    return;
                  }

                  setIsLoading(true);

                  try {
                    const headers = getAuthHeaders();

                    await Promise.all(
                      files.map(async (file) => {
                        if (!file.type.startsWith('image/')) {
                          alert(`${file.name} is not a valid image file.`);
                          throw new Error(`${file.name} is not a valid image file.`);
                        }
                        const maxFileSize = 5 * 1024 * 1024;
                        if (file.size > maxFileSize) {
                          alert(`${file.name} is too large. Maximum size is 5MB.`);
                          throw new Error(`${file.name} is too large. Maximum size is 5MB.`);
                        }

                        const formData = new FormData();
                        formData.append('image', file);

                        const response = await fetch(`${API_BASE_URL}/photos/upload`, {
                          method: 'POST',
                          credentials: 'include',
                          headers: headers,
                          body: formData,
                        });

                        if (!response.ok) {
                          throw new Error(`Failed to upload ${file.name}`);
                        }
                      })
                    );

                    alert('Photos uploaded successfully!');
                    fetchAvailablePhotos();
                  } catch (error) {
                    console.error('Error uploading photos:', error);
                    alert('Failed to upload some photos. Please try again.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                style={{
                  border: '2px dashed #ccc',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#f9f9f9',
                  cursor: 'pointer',
                  position: 'relative',
                  minHeight: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLoading ? (
                  <div>Uploading...</div>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: '48px',
                        color: '#ccc',
                        marginBottom: '10px',
                      }}
                    >
                      ⬆️
                    </div>
                    <div style={{ fontSize: '18px', color: '#666' }}>Drag, Drop, Upload</div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#999',
                        marginTop: '10px',
                      }}
                    >
                      or
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);

                        if (files.length === 0) return;

                        setIsLoading(true);

                        try {
                          const { 'Content-Type': _, ...authHeaders } = getAuthHeaders();

                          await Promise.all(
                            files.map(async (file) => {
                              const formData = new FormData();
                              formData.append('image', file);

                              const response = await fetch(`${API_BASE_URL}/photos/upload`, {
                                method: 'POST',
                                headers: authHeaders,
                                body: formData,
                              });

                              if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Failed to upload ${file.name}: ${errorText}`);
                              }
                            })
                          );

                          alert('Photos uploaded successfully!');
                          fetchAvailablePhotos();
                          if (e.target) e.target.value = '';
                        } catch (error) {
                          console.error('Error uploading photos:', error);
                          alert(
                            error instanceof Error
                              ? error.message
                              : 'Failed to upload some photos. Please try again.'
                          );
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      style={{
                        marginTop: '20px',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                  </>
                )}
              </div>

              <h3>Existing Photos</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '20px',
                  marginTop: '20px',
                }}
              >
                {availablePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <img
                      src={photo.url}
                      alt={`Photo ${photo.id}`}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: 'white', fontSize: '14px' }}>ID: {photo.id}</span>
                      <button
                        onClick={async () => {
                          if (
                            window.confirm(
                              'Are you sure you want to delete this photo? This cannot be undone.'
                            )
                          ) {
                            try {
                              const response = await fetch(
                                `${API_BASE_URL}/photos/delete/${photo.id}`,
                                {
                                  method: 'POST',
                                  credentials: 'include',
                                  headers: getAuthHeaders(),
                                }
                              );

                              if (response.ok) {
                                setAvailablePhotos((prev) => prev.filter((p) => p.id !== photo.id));
                                alert('Photo deleted successfully');
                              } else {
                                const errorText = await response.text();
                                throw new Error(`Failed to delete photo: ${errorText}`);
                              }
                            } catch (error) {
                              console.error('Error deleting photo:', error);
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : 'Failed to delete photo. Please try again.'
                              );
                            }
                          }
                        }}
                        style={{
                          backgroundColor: '#ff6666',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showPhotoSelector && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                width: '80%',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              <h3>Select Photos to Link</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px',
                  padding: '16px',
                }}
              >
                {availablePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => handlePhotoSelect(photo.id)}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      border: selectedPhotoIds.includes(photo.id)
                        ? '3px solid #6cace4'
                        : '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '4px',
                    }}
                  >
                    <img
                      src={photo.url}
                      alt={`Photo ${photo.id}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button
                  onClick={() => setShowPhotoSelector(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ccc',
                    marginRight: '10px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkPhotos}
                  disabled={isLoading || selectedPhotoIds.length === 0}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6cace4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    opacity: isLoading || selectedPhotoIds.length === 0 ? 0.5 : 1,
                  }}
                >
                  {isLoading ? 'Linking...' : 'Link Selected Photos'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
