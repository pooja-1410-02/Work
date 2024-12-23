import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

const ProcessorForm = ({ processor, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  // const navigate = useNavigate();

  useEffect(() => {
    if (processor) {
      setName(processor.name || '');
      setIsEditing(!!processor.id);
    }
  }, [processor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Edit existing processor
        await axios.put(`http://localhost:8000/api/api/processor/${processor.id}/`, { name });
      } else {
        // Create new processor
        await axios.post('http://localhost:8000/api/api/processor/', { name });
      }
      onSave(); // Notify parent component about the save
      onClose(); // Close the form
    } catch (error) {
      console.error('Error saving processor:', error);
    }
  };

  return (
    <div className="processor-form">
      {/* <h1>{isEditing ? 'Edit Processor' : 'Create Processor'}</h1> */}
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

export default ProcessorForm;
