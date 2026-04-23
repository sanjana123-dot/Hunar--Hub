import React, { useState, useEffect } from 'react';
import api, { resolveMediaUrl } from '../services/api';
import { toast } from 'react-toastify';
import './ImageUpload.css';

const ImageUpload = ({ onUploadSuccess, currentImageUrl }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || null);

  // Sync preview when currentImageUrl changes (e.g. when editing a product)
  useEffect(() => {
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Remove Content-Type so axios/browser sets multipart/form-data with boundary (required for uploads)
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': undefined },
      });
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data.url);
      }
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload image');
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      {preview && (
        <div className="image-preview">
          <img src={resolveMediaUrl(preview)} alt="Preview" />
        </div>
      )}
      <label className="upload-label">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        <span className="upload-button">
          {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Upload Image'}
        </span>
      </label>
    </div>
  );
};

export default ImageUpload;
