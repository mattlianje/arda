import React, { useState } from 'react';

interface PhotoGridProps {
  album: string;
  photos: string[];
  onBack: () => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ album, photos, onBack }) => {
  const [zoomedPhotoIndex, setZoomedPhotoIndex] = useState<number | null>(null);

  const handleZoom = (index: number) => {
    setZoomedPhotoIndex(index);
  };

  const closeZoom = () => {
    setZoomedPhotoIndex(null);
  };

  const nextPhoto = () => {
    if (zoomedPhotoIndex !== null) {
      setZoomedPhotoIndex((prev) => (prev! + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (zoomedPhotoIndex !== null) {
      setZoomedPhotoIndex((prev) => (prev! - 1 + photos.length) % photos.length);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: '#6cace4',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'background-color 0.3s ease',
        }}
      >
        Back to Albums
      </button>

      <h2>{album} </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px',
        }}
      >
        {photos.map((photo, index) => (
          <div
            key={index}
            onClick={() => handleZoom(index)}
            style={{
              cursor: 'pointer',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <img
              src={photo} // Directly use the object URL created from blob
              alt={`Photo ${index + 1}`}
              style={{ width: '100%', height: '150px', objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>

      {zoomedPhotoIndex !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={closeZoom}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevPhoto();
            }}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '36px',
              cursor: 'pointer',
            }}
          >
            ‹
          </button>

          <img
            src={photos[zoomedPhotoIndex]}
            alt={`Photo ${zoomedPhotoIndex + 1}`}
            style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: '8px' }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextPhoto();
            }}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '36px',
              cursor: 'pointer',
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoGrid;
