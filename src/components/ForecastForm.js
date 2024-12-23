import React, { useState, useEffect } from 'react';
import './ForecastForm.css';

const BFS_CHOICES = [
    { value: 'Single', label: 'Single' },
    { value: 'Multi', label: 'Multi' }
];

const ForecastForm = ({ forecast, onClose, onSave, mode, items = [], plos = [] }) => {
    const [formData, setFormData] = useState({
        id: null,
        item_sid: '',  // Changed from item to item_sid
        sid: '',
        clients: '',
        bfs: '',
        system_description: '',
        time_weeks: '',
        landscape: '',
        frontend: '',
        requester: '',
        parallel_processing: false,
        cw_request_plo: '',
        cw_delivered: '',
        comments: ''
    });

    useEffect(() => {
        if (forecast) {
            setFormData({
                id: forecast.id || null,
                item_sid: forecast.item_sid || '',  // Updated to reflect item_sid
                sid: forecast.sid || '',
                clients: forecast.clients || '',
                bfs: forecast.bfs || '',
                system_description: forecast.system_description || '',
                time_weeks: forecast.time_weeks || '',
                landscape: forecast.landscape || '',
                frontend: forecast.frontend || '',
                requester: forecast.requester ? forecast.requester.id : '',
                parallel_processing: forecast.parallel_processing || false,
                cw_request_plo: forecast.cw_request_plo || '',
                cw_delivered: forecast.cw_delivered || '',
                comments: forecast.comments || ''
            });
        }
    }, [forecast]);

    const handleChange = async (e) => {
        const { name, value, type, checked } = e.target;
        const updatedValue = type === 'checkbox' ? checked : value;

        if (name === 'item_sid') {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/api/item/${value}`);
                const systemDetails = await response.json();
                
                if (systemDetails) {
                    const { requested_date, delivery_date } = systemDetails;

                    const requestedDate = new Date(requested_date);
                    const deliveryDate = new Date(delivery_date);
                    const monthDiff = Math.abs(deliveryDate.getMonth() - requestedDate.getMonth() +
                        (12 * (deliveryDate.getFullYear() - requestedDate.getFullYear())));
                    
                    // Convert months to weeks (assuming 4 weeks in a month)
                    const weeks = monthDiff * 4;

                    setFormData((prevData) => ({
                        ...prevData,
                        item_sid: value,
                        time_weeks: weeks // Update time_weeks automatically
                    }));
                }
            } catch (error) {
                console.error('Error fetching system details:', error);
            }
        }

        setFormData((prevData) => ({
            ...prevData,
            [name]: updatedValue
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formattedData = {
            ...formData,
            clients: parseInt(formData.clients, 10),
            time_weeks: parseInt(formData.time_weeks, 10),
            cw_request_plo: parseInt(formData.cw_request_plo, 10),
            cw_delivered: formData.cw_delivered ? parseInt(formData.cw_delivered, 10) : null,
            item_sid: formData.item_sid  // Send item_sid directly
        };

        console.log('Submitting formattedData:', formattedData);
        onSave(formattedData);
    };

    return (
        <div className="forecast-form">
            <h2>{mode === 'edit' ? 'Edit Forecast' : 'New Forecast'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Referred System:</label>
                    <select name="item_sid" value={formData.item_sid} onChange={handleChange} required>
                        <option value="">Select System</option>
                        {items.length > 0 ? (
                            items.map(item => (
                                <option key={item.sid} value={item.sid}>{item.sid}</option>
                            ))
                        ) : (
                            <option value="" disabled>No systems available</option>
                        )}
                    </select>
                </div>
                <div className="form-group">
                    <label>SID:</label>
                    <input type="text" name="sid" value={formData.sid} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Clients:</label>
                    <input type="number" name="clients" value={formData.clients} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>BFS:</label>
                    <select name="bfs" value={formData.bfs} onChange={handleChange} required>
                        <option value="">Select BFS</option>
                        {BFS_CHOICES.map(choice => (
                            <option key={choice.value} value={choice.value}>{choice.label}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>System Description:</label>
                    <textarea name="system_description" value={formData.system_description} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Time (Weeks):</label>
                    <input type="number" name="time_weeks" value={formData.time_weeks} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Landscape:</label>
                    <input type="text" name="landscape" value={formData.landscape} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Frontend:</label>
                    <input type="text" name="frontend" value={formData.frontend} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Requester:</label>
                    <select name="requester" value={formData.requester} onChange={handleChange} required>
                        <option value="">Select PLO</option>
                        {plos.length > 0 ? (
                            plos.map(plo => (
                                <option key={plo.id} value={plo.id}>{plo.name}</option>
                            ))
                        ) : (
                            <option value="" disabled>No PLOs available</option>
                        )}
                    </select>
                </div>
                <div className="form-group">
                    <label>Parallel Processing:</label>
                    <input type="checkbox" name="parallel_processing" checked={formData.parallel_processing} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>CW Request PLO:</label>
                    <input type="number" name="cw_request_plo" value={formData.cw_request_plo} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>CW Delivered:</label>
                    <input type="number" name="cw_delivered" value={formData.cw_delivered} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Comments:</label>
                    <textarea name="comments" value={formData.comments} onChange={handleChange} />
                </div>
                <button type="submit">Save</button>
                <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
            </form>
        </div>
    );
};

export default ForecastForm;
