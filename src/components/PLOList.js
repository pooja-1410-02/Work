// PLOList.js

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './PLOList.css';
import PLOForm from './PLOForm'; // Ensure PLOForm component exists

const client = axios.create({
  baseURL: "http://localhost:8000",
});

const PLOList = ({ username, userDetails }) => {
  const [plos, setPLOs] = useState([]);
  const [editingPlo, setEditingPlo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch PLOs
  const fetchPLOs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/api/plo/');
      setPLOs(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching PLOs:', error);
      setError('Failed to fetch PLOs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPLOs();
  }, [fetchPLOs]);

  const handleEdit = (plo) => {
    setEditingPlo(plo);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await client.delete(`/api/api/plo/${id}/`);
      fetchPLOs();
    } catch (error) {
      console.error('Error deleting PLO:', error);
      setError('Failed to delete PLO.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (plo) => {
    const newPlo = { ...plo, id: null }; // Clear id for new item
    setEditingPlo(newPlo);
    setShowForm(true);
    setContextMenu(null);
  };

  const handleFormClose = () => {
    setEditingPlo(null);
    setShowForm(false);
  };

  const handleFormSave = () => {
    fetchPLOs();
    handleFormClose();
  };

  const handleContextMenu = (event, plo) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, plo });
  };

  const handleContextMenuClick = (action) => {
    if (action === 'copy') {
      handleCopy(contextMenu.plo);
    }
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu && !event.target.closest('.context-menu')) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  return (
    <div className="plo-list">
      {/* <h2>PLOs List</h2> */}
      {userDetails?.is_staff && (
        <button onClick={() => setShowForm(true)} disabled={loading}>Add PLO</button>
      )}
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {showForm && (
        <PLOForm
          plo={editingPlo}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            {userDetails?.is_staff && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {plos.length === 0 ? (
            <tr>
              <td colSpan={userDetails?.is_staff ? 2 : 1}>No PLOs available.</td>
            </tr>
          ) : (
            plos.map(plo => (
              <tr
                key={plo.id}
                onContextMenu={(e) => handleContextMenu(e, plo)}
              >
                <td>{plo.name}</td>
                {userDetails?.is_staff && (
                  <td>
                    <button onClick={() => handleEdit(plo)} disabled={loading}>Edit</button>
                    <button className="delete" onClick={() => handleDelete(plo.id)} disabled={loading}>Delete</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          {userDetails?.is_staff && (
            <button onClick={() => handleContextMenuClick('copy')} disabled={loading}>Copy</button>
          )}
        </div>
      )}
    </div>
  );
};

export default PLOList;
