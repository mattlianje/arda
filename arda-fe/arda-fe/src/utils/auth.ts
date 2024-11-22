export const getAuthHeaders = () => {
  const token = document.cookie.split('token=')[1]?.split(';')[0];
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};
