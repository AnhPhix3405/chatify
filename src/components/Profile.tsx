import React, { useState } from 'react';
import { User, Calendar, LogOut, X, Edit3, Check, X as XIcon, Camera } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { buildApiUrl } from '../config/api';
interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useChat();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleLogout = () => {
    logout();
    onClose(); // Close the modal after logout
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setEditedName(currentUser.display_name || currentUser.name);
  };

  const handleSaveName = async () => {
    // TODO: Implement API call to update display_name
    console.log('Updating display_name to:', editedName);
    await fetch(buildApiUrl(`/api/users/${currentUser.id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ display_name: editedName }),
    });
    alert("Update thành công");
    window.location.reload(); // Reload to reflect changes
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleAvatarUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploadingAvatar(true); // Bắt đầu loading

      const formData = new FormData();
      formData.append('avatar', file);
      
      try {
        const response = await fetch(buildApiUrl('/api/uploads/avatar'), {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        const imageUrl = data.url;
        
        console.log('Uploaded image URL:', imageUrl);
        await updateAvatar(imageUrl);
        alert("Cập nhật avatar thành công");
        window.location.reload(); // Reload to reflect changes
        return imageUrl;
      } catch (error) {
        console.error('Upload failed:', error);
        alert("Lỗi khi upload avatar");
      } finally {
        setIsUploadingAvatar(false); // Kết thúc loading
      }
    };
    
    input.click();
  };

  const updateAvatar = async (imageUrl: string) => {
    await fetch(buildApiUrl(`/api/users/${currentUser.id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatar_url: imageUrl }),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Profile
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4 group">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.display_name || currentUser.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-500" />
              </div>
            )}
            
            {/* Loading overlay */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  <span className="text-white text-xs">Loading...</span>
                </div>
              </div>
            )}
            
            {/* Upload button */}
            {!isUploadingAvatar && (
              <button
                onClick={handleAvatarUpload}
                className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            )}
            
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 ${
              currentUser.status === 'online' ? 'bg-green-500' : 
              currentUser.status === 'typing' ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
          </div>

          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center space-x-2">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="text-green-600 hover:text-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>{currentUser.display_name || currentUser.name}</span>
                <button
                  onClick={handleEditName}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {currentUser.status}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">#{currentUser.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {currentUser.status}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
