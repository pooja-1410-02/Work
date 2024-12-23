import axios from 'axios';

const client = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true
});

export const logout = async () => {
  const authToken = localStorage.getItem('authToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!authToken || !refreshToken) {
    throw new Error("No tokens found");
  }
  
  try {
    await client.post("/api/logout/", { refresh_token: refreshToken }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  } catch (error) {
    throw new Error("Logout failed");
  }
};
