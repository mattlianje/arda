import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../utils/auth';
import { API_BASE_URL } from '../utils/api';

interface Album {
  id: number;
  name: string;
  ownerId: number;
}

interface AlbumListProps {
  onAlbumClick: (album: string, photos: string[]) => void;
}

const AlbumList: React.FC<AlbumListProps> = ({ onAlbumClick }) => {
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/albums`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    })
      .then((response) => response.json())
      .then((fetchedAlbums: Album[]) => {
        setAlbums(fetchedAlbums);
      })
      .catch((error) => {
        console.error('Error fetching albums:', error);
      });
  }, []);

  const handleAlbumClick = (album: Album | 'All Photos') => {
    if (album === 'All Photos') {
      fetch(`${API_BASE_URL}/photos`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      })
        .then((response) => response.text())
        .then((text) => {
          const photoIds = text
            .replace(/List\(|\)/g, '')
            .split(',')
            .map((id) => parseInt(id.trim(), 10));

          const photoPromises = photoIds.map((id) =>
            fetch(`${API_BASE_URL}/photos/${id}`, {
              credentials: 'include',
              headers: getAuthHeaders(),
            })
              .then((res) => res.blob())
              .then((blob) => URL.createObjectURL(blob))
          );

          Promise.all(photoPromises)
            .then((photoUrls) => {
              onAlbumClick('All Photos', photoUrls);
            })
            .catch((error) => {
              console.error('Error fetching photos:', error);
            });
        })
        .catch((error) => {
          console.error('Error fetching all photo IDs:', error);
        });
    } else {
      fetch(`${API_BASE_URL}/albums/${album.name}/photos`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      })
        .then((response) => response.text())
        .then((text) => {
          const photoIds = text
            .replace(/List\(|\)/g, '')
            .split(',')
            .filter((id) => id.trim() !== '')
            .map((id) => parseInt(id.trim(), 10));

          const photoPromises = photoIds.map((id) =>
            fetch(`${API_BASE_URL}/photos/${id}`, {
              credentials: 'include',
              headers: getAuthHeaders(),
            })
              .then((res) => res.blob())
              .then((blob) => URL.createObjectURL(blob))
          );

          Promise.all(photoPromises)
            .then((photoUrls) => {
              onAlbumClick(album.name, photoUrls);
            })
            .catch((error) => {
              console.error('Error fetching album photos:', error);
            });
        })
        .catch((error) => {
          console.error(`Error fetching photos for album ${album.name}:`, error);
        });
    }
  };

  const handleFetchError = (error: any) => {
    if (error.status === 403) {
      console.error('Unauthorized access');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Your Albums</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '20px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div
          onClick={() => handleAlbumClick('All Photos')}
          style={{
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          All Photos
        </div>
        {albums.map((album) => (
          <div
            key={album.id}
            onClick={() => handleAlbumClick(album)}
            style={{
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            {album.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumList;
