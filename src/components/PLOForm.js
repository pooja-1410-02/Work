import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PLOForm = ({ plo, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (plo) {
      setName(plo.name || '');
      setIsEditing(!!plo.id);
    }
  }, [plo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Update existing PLO
        await axios.put(`http://localhost:8000/api/api/plo/${plo.id}/`, { name });
      } else {
        // Create new PLO
        await axios.post('http://localhost:8000/api/api/plo/', { name });
      }
      onSave(); // Notify parent about the save
      onClose(); // Close the form
    } catch (error) {
      console.error('Error saving PLO:', error);
    }
  };

  return (
    <div className="plo-form">
      {/* <h1>{isEditing ? 'Edit PLO' : 'Create PLO'}</h1> */}
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <button type="submit">{isEditing ? 'Update' : 'Submit'}</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default PLOForm;
