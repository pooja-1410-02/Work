import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import './ProfilePage.css';

const ProfilePage = ({ username, userDetails }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newUsername: '',
    newEmail: '',
    newPassword: '',
    isStaff: userDetails ? userDetails.is_staff : false 
  });
  const [option, setOption] = useState('');
  const [users, setUsers] = useState([]); 
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const authToken = localStorage.getItem('authToken');
      try {
        const response = await axios.get('/api/users/', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        setUsers(response.data);
      } catch (error) {
        toast.error('Failed to fetch users.');
      }
    };

    if (userDetails && (userDetails.is_superuser || userDetails.username === 'admin')) {
      fetchUsers();
    }
  }, [userDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleOptionChange = (e) => {
    setOption(e.target.value);
    if (e.target.value !== 'Update Staff Status') {
      setSelectedUser('');
    }
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const authToken = localStorage.getItem('authToken');

    if (option === 'Update Staff Status') {
      if (!selectedUser) {
        toast.error('Please select a user.');
        return;
      }

      try {
        await axios.post('/api/update_staff_status/', {
          username: selectedUser,
          is_staff: true 
        }, {
          headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
        });
        toast.success('User staff status updated successfully');
      } catch (error) {
        toast.error(error.response ? error.response.data.error : 'Update failed');
      }
      return;
    }

    if (!formData.oldPassword && option !== 'Change Password') {
      toast.error('Old password is required.');
      return;
    }

    let requestData = { username, oldPassword: formData.oldPassword };

    if (option === 'Change Username') {
      requestData.newUsername = formData.newUsername;
    } else if (option === 'Change Email') {
      requestData.newEmail = formData.newEmail;
    } else if (option === 'Change Password') {
      requestData.newPassword = formData.newPassword;
    }

    try {
      await axios.post('/api/update_user/', requestData, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
      });
      toast.success('User details updated successfully');
    } catch (error) {
      toast.error(error.response ? error.response.data.error : 'Update failed');
    }
  };

  return (
    <div className="profile-container">
      <p>Logged in as: {username}</p>
      {userDetails && <p>Staff Status: {userDetails.is_staff ? 'Yes' : 'No'}</p>}

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Select an action:</legend>
          {['Change Username', 'Change Email', 'Change Password', 'Delete User'].map(action => (
            <label key={action}>
              <input
                type="radio"
                value={action}
                checked={option === action}
                onChange={handleOptionChange}
              />
              {action}
            </label>
          ))}
          {userDetails && (userDetails.is_superuser || userDetails.username === 'admin') && (
            <label>
              <input
                type="radio"
                value="Update Staff Status"
                checked={option === 'Update Staff Status'}
                onChange={handleOptionChange}
              />
              Update Staff Status
            </label>
          )}
        </fieldset>

        {option === 'Update Staff Status' && (
          <div>
            <select value={selectedUser} onChange={handleUserChange} className="user-select">
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user.username} value={user.username}>
                  {user.username} (Staff: {user.is_staff ? 'Yes' : 'No'})
                </option>
              ))}
            </select>
          </div>
        )}

        <input
          type="password"
          placeholder={option === 'Change Password' ? 'Old Password' : 'Password'}
          name="oldPassword"
          value={formData.oldPassword}
          onChange={handleInputChange}
          required={option !== 'Change Password' && option !== 'Delete User'}
        />

        {option === 'Change Username' && (
          <input
            type="text"
            placeholder="New Username"
            name="newUsername"
            value={formData.newUsername}
            onChange={handleInputChange}
          />
        )}

        {option === 'Change Email' && (
          <input
            type="email"
            placeholder="New Email"
            name="newEmail"
            value={formData.newEmail}
            onChange={handleInputChange}
          />
        )}

        {option === 'Change Password' && (
          <input
            type="password"
            placeholder="New Password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
          />
        )}

        <button type="submit" disabled={!option}>
          {option === 'Delete User' ? 'Delete User' : 'Update Details'}
        </button>
      </form>

      <ToastContainer />
    </div>
  );
};

export default ProfilePage;
