import React, { useState, useEffect } from 'react';
import './ForecastForm.css';

const BFS_CHOICES = [
    { value: 'Single', label: 'Single' },
    { value: 'Multi', label: 'Multi' }
];

const ASSIGNED_TO_CHOICES = [
    { value: 'COE', label: 'COE' },
    { value: 'ODC', label: 'ODC' },
    { value: 'TBD', label: 'TBD' }
];

const ForecastForm = ({ forecast, onClose, onSave, mode, items = [], plos = [] }) => {
    const [formData, setFormData] = useState({
        id: null,
        item_sid: '',  // Can be empty
        sid: '',
        clients: '',  // Default as empty string, will be converted to number if valid
        bfs: '',
        system_description: '',
        time_weeks: '',  // Default as empty string, can be null
        landscape: '',
        frontend: '',
        requester: '',
        parallel_processing: false,  // Default value for checkbox
        cw_request_plo: '',  // Default as empty string, will be converted to number if valid
        cw_delivered: '',  // Default as empty string
        comments: '',  // Default as empty string
        assigned_to: 'TBD'  // Default value for assigned_to
    });

    useEffect(() => {
        if (forecast) {
            setFormData({
                id: forecast.id || null,
                item_sid: forecast.item_sid || '',  // Allow null or empty string
                sid: forecast.sid || '',
                clients: forecast.clients !== null ? forecast.clients : '', // Handle null values
                bfs: forecast.bfs || '',
                system_description: forecast.system_description || '',
                time_weeks: forecast.time_weeks !== null ? forecast.time_weeks : '', // Handle null values
                landscape: forecast.landscape || '',
                frontend: forecast.frontend || '',
                requester: forecast.requester || '',
                parallel_processing: forecast.parallel_processing || false, // Handle boolean
                cw_request_plo: forecast.cw_request_plo !== null ? forecast.cw_request_plo : '', // Handle null values
                cw_delivered: forecast.cw_delivered !== null ? forecast.cw_delivered : '', // Handle null values
                comments: forecast.comments || '', // Handle empty comments
                assigned_to: forecast.assigned_to || 'TBD' // Ensure 'assigned_to' is set correctly
            });
        }
    }, [forecast, mode]); // Make sure formMode is in the dependency array       

    const handleChange = async (e) => {
        const { name, value, type, checked } = e.target;
        const updatedValue = type === 'checkbox' ? checked : value;
        // Fetch system details when item_sid changes
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

        // Update the form data for other fields
        setFormData((prevData) => ({
            ...prevData,
            [name]: updatedValue
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        // Ensure 'clients' is correctly handled and converted to a valid number
        let validClients = formData.clients !== '' ? Number(formData.clients) : null; // Null if blank
        
        // If the value of clients is not a valid number, we can assign it to null
        if (isNaN(validClients)) {
            validClients = null;
        }

        const formattedData = {
            ...formData,
            clients: validClients,  // Ensure clients is a valid number or null
            time_weeks: isNaN(formData.time_weeks) ? null : parseInt(formData.time_weeks, 10),  // Handle null for time_weeks
            cw_request_plo: isNaN(formData.cw_request_plo) ? null : parseInt(formData.cw_request_plo, 10),  // Handle null for cw_request_plo
            cw_delivered: formData.cw_delivered !== '' ? parseInt(formData.cw_delivered, 10) : null,  // Handle null for cw_delivered
        };
        onSave(formattedData);
    };

    return (
        <div className="forecast-form">
            <h2>{mode === 'edit' ? 'Edit Forecast' : 'New Forecast'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Referred System:</label>
                    <select name="item_sid" value={formData.item_sid} onChange={handleChange}>
                        <option value="">Select System</option>
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <option key={`${item.sid}-${index}`} value={item.sid}>{item.sid}</option>
                            ))
                        ) : (
                            <option value="" disabled>No systems available</option>
                        )}
                    </select>
                </div>
                <div className="form-group">
                    <label>SID:</label>
                    <input type="text" name="sid" value={formData.sid} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Clients:</label>
                    <input type="number" name="clients" value={formData.clients} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>BFS:</label>
                    <select name="bfs" value={formData.bfs} onChange={handleChange}>
                        <option value="">Select BFS</option>
                        {BFS_CHOICES.map(choice => (
                            <option key={choice.value} value={choice.value}>{choice.label}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>System Description:</label>
                    <textarea name="system_description" value={formData.system_description} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Time (Weeks):</label>
                    <input type="number" name="time_weeks" value={formData.time_weeks} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Landscape:</label>
                    <input type="text" name="landscape" value={formData.landscape} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Frontend:</label>
                    <input type="text" name="frontend" value={formData.frontend} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Requester:</label>
                    <select name="requester" value={formData.requester} onChange={handleChange}>
                        <option value="">Select PLO</option>
                        {plos.length > 0 ? (
                            plos.map((plo, index) => (
                                <option key={`${plo.id}-${index}`} value={plo.id}>{plo.name}</option>
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
                    <input type="number" name="cw_request_plo" value={formData.cw_request_plo} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>CW Delivered:</label>
                    <input type="number" name="cw_delivered" value={formData.cw_delivered} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Comments:</label>
                    <textarea name="comments" value={formData.comments} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Assigned To:</label>
                    <select name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
                        {ASSIGNED_TO_CHOICES.map(choice => (
                            <option key={choice.value} value={choice.value}>{choice.label}</option>
                        ))}
                    </select>
                </div>
                <button type="submit">Save</button>
                <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
            </form>
        </div>
    );
};

export default ForecastForm;
