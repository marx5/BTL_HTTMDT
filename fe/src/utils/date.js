export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeStamp = (timestamp) => {
  if (!timestamp) return '';
  
  // If timestamp is a number (unix timestamp in milliseconds)
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp) 
    : new Date(parseInt(timestamp));
    
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTimeDifference = (timestamp) => {
  if (!timestamp) return '';
  
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp) 
    : new Date(parseInt(timestamp));
    
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return 'vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} ngày trước`;
  if (diffSec < 31536000) return `${Math.floor(diffSec / 2592000)} tháng trước`;
  
  return `${Math.floor(diffSec / 31536000)} năm trước`;
};
