// ProcessorList.js

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './ProcessorList.css';
import ProcessorForm from './ProcessorForm'; // Ensure ProcessorForm component exists

const client = axios.create({
  baseURL: "http://localhost:8000",
});

const ProcessorList = ({ username, userDetails }) => {
  const [processors, setProcessors] = useState([]);
  const [editingProcessor, setEditingProcessor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProcessors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/api/api/processor/');
      setProcessors(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching processors:', error);
      setError('Failed to fetch processors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcessors();
  }, [fetchProcessors]);

  const handleEdit = (processor) => {
    setEditingProcessor(processor);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await client.delete(`/api/api/processor/${id}/`);
      fetchProcessors();
    } catch (error) {
      console.error('Error deleting processor:', error);
      setError('Failed to delete processor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (processor) => {
    const newProcessor = { ...processor, id: null }; // Clear id for new item
    setEditingProcessor(newProcessor);
    setShowForm(true);
    setContextMenu(null);
  };

  const handleFormClose = () => {
    setEditingProcessor(null);
    setShowForm(false);
  };

  const handleFormSave = () => {
    fetchProcessors();
    handleFormClose();
  };

  const handleContextMenu = (event, processor) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, processor });
  };

  const handleContextMenuClick = (action) => {
    if (action === 'copy') {
      handleCopy(contextMenu.processor);
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
    <div className="processor-list">
      {/* <h2>Processors List</h2> */}
      {userDetails?.is_staff && (
        <button onClick={() => setShowForm(true)} disabled={loading}>Add Processor</button>
      )}
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {showForm && (
        <ProcessorForm
          processor={editingProcessor}
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
          {processors.length === 0 ? (
            <tr>
              <td colSpan={userDetails?.is_staff ? 2 : 1}>No processors available.</td>
            </tr>
          ) : (
            processors.map(processor => (
              <tr
                key={processor.id}
                onContextMenu={(e) => handleContextMenu(e, processor)}
              >
                <td>{processor.name}</td>
                {userDetails?.is_staff && (
                  <td>
                    <button onClick={() => handleEdit(processor)} disabled={loading}>Edit</button>
                    <button className="delete" onClick={() => handleDelete(processor.id)} disabled={loading}>Delete</button>
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

export default ProcessorList;
