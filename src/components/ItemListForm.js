import React, { useState, useEffect } from 'react';
import './ItemListForm.css';

const ItemListForm = ({ item, onClose, onSave, plos, processors, mode }) => {
    const [formData, setFormData] = useState({
        sid: '',
        description: '',
        requested_date: '',
        flavour: '',
        estimated_clients: '',
        delivered_clients: '',
        bfs: '',
        t_shirt_size: '',
        system_type: '', // Allow null
        hardware: '',
        setup: '',
        plo: null,
        processor1: null,
        processor2: null,
        status: '',
        landscape: '',
        expected_delivery: '',
        revised_delivery_date: null, // Allow null
        delivery_date: '',
        delivery_delay_reason: '',
        servicenow: '',
        comments: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (mode === 'edit' || mode === 'copy') {
            setFormData(item);
        }
    }, [item, mode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value === '' ? null : value // Convert empty string to null
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const emptyFields = validateFormData();
        if (emptyFields.length > 0) {
            setError(`Please fill in the following fields: ${emptyFields.join(', ')}`);
            return;
        }
        await onSave(formData);
    };
    
    const validateFormData = () => {
        return Object.entries(formData)
            .filter(([key, value]) => 
                (key !== 'processor2' && key !== 'revised_delivery_date') && (value === null || value === '')
            )
            .map(([key]) => key);
    };

    return (
        <div className="item-list-form">
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <h2>{mode === 'edit' ? 'Edit Item' : mode === 'copy' ? 'Copy Item' : 'Add Item'}</h2>

                <label>
                    Requested Date: <span className="required">*</span>
                    <input type="date" name="requested_date" value={formData.requested_date} onChange={handleChange} required />
                </label>
                <label>
                    Flavour: <span className="required">*</span>
                    <select name="flavour" value={formData.flavour} onChange={handleChange} required>
                        <option value="">Select Flavour</option>
                        <option value="S/4H Private">S/4H Private</option>
                        <option value="S/4H Public">S/4H Public</option>
                        <option value="S/4 Cloud">S/4 Cloud</option>
                        <option value="S/4H OP">S/4H OP</option>
                    </select>
                </label>
                <label>
                    SID: <span className="required">*</span>
                    <input type="text" name="sid" value={formData.sid} onChange={handleChange} readOnly={mode === 'edit'} required />
                </label>
                <label>
                    Estimated Clients: <span className="required">*</span>
                    <input type="number" name="estimated_clients" value={formData.estimated_clients} onChange={handleChange} required />
                </label>
                <label>
                    Delivered Clients:
                    <input type="number" name="delivered_clients" value={formData.delivered_clients} onChange={handleChange} />
                </label>
                <label>
                    BFS: <span className="required">*</span>
                    <select name="bfs" value={formData.bfs} onChange={handleChange} required>
                        <option value="">Select BFS</option>
                        <option value="Single">Single</option>
                        <option value="Multi">Multi</option>
                    </select>
                </label>
                <label>
                    T-Shirt Size: <span className="required">*</span>
                    <select name="t_shirt_size" value={formData.t_shirt_size} onChange={handleChange} required>
                        <option value="">Select Size</option>
                        <option value="Large">Large</option>
                        <option value="Medium">Medium</option>
                        <option value="Small">Small</option>
                    </select>
                </label>
                <label>
                    System Type:
                    <input type="text" name="system_type" value={formData.system_type} onChange={handleChange} />
                </label>
                <label>
                    Hardware: <span className="required">*</span>
                    <select name="hardware" value={formData.hardware} onChange={handleChange} required>
                        <option value="">Select Hardware</option>
                        <option value="GCP">GCP</option>
                        <option value="Azure">Azure</option>
                    </select>
                </label>
                <label>
                    Setup: <span className="required">*</span>
                    <input type="text" name="setup" value={formData.setup} onChange={handleChange} required />
                </label>
                <label>
                    PLO: <span className="required">*</span>
                    <select name="plo" value={formData.plo} onChange={handleChange} required>
                        <option value="">Select PLO</option>
                        {plos.map(plo => (
                            <option key={plo.id} value={plo.id}>{plo.name}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Processor 1: <span className="required">*</span>
                    <select name="processor1" value={formData.processor1} onChange={handleChange} required>
                        <option value="">Select Processor</option>
                        {processors.map(processor => (
                            <option key={processor.id} value={processor.id}>{processor.name}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Processor 2:
                    <select name="processor2" value={formData.processor2} onChange={handleChange}>
                        <option value="">Select Processor</option>
                        {processors.map(processor => (
                            <option key={processor.id} value={processor.id}>{processor.name}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Status: <span className="required">*</span>
                    <select name="status" value={formData.status} onChange={handleChange} required>
                        <option value="">Select Status</option>
                        <option value="Reviewing eCS">Reviewing eCS</option>
                        <option value="Backup from source">Backup from source</option>
                        <option value="OAT Simulation">OAT Simulation</option>
                        <option value="Server Provisioning">Server Provisioning</option>
                        <option value="DB Installation">DB Installation</option>
                        <option value="Installation">Installation</option>
                        <option value="Post Installation">Post Installation</option>
                        <option value="Client 000 Customization">Client 000 Customization</option>
                        <option value="with SLC for TMS">with SLC for TMS</option>
                        <option value="Back from SLC">Back from SLC</option>
                        <option value="Higher client customization">Higher client customization</option>
                        <option value="Quality Checks">Quality Checks</option>
                        <option value="Handedover to PLO">Handedover to PLO</option>
                        <option value="REBUILD">REBUILD</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </label>
                <label>
                    Landscape: <span className="required">*</span>
                    <input type="text" name="landscape" value={formData.landscape} onChange={handleChange} required />
                </label>
                <label>
                    Description: <span className="required">*</span>
                    <textarea name="description" value={formData.description} onChange={handleChange} required />
                </label>
                <label>
                    Expected Delivery: <span className="required">*</span>
                    <input type="date" name="expected_delivery" value={formData.expected_delivery} onChange={handleChange} required />
                </label>
                <label>
                    Revised Delivery Date:
                    <input 
                        type="date" 
                        name="revised_delivery_date" 
                        value={formData.revised_delivery_date || ''} // Allow it to be null or empty
                        onChange={handleChange} 
                    />
                </label>
                <label>
                    Delivery Date:
                    <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} />
                </label>
                <label>
                    Delivery Delay Reason:
                    <input type="text" name="delivery_delay_reason" value={formData.delivery_delay_reason} onChange={handleChange} />
                </label>
                <label>
                    ServiceNow:
                    <input type="text" name="servicenow" value={formData.servicenow} onChange={handleChange} />
                </label>
                <label>
                    Comments:
                    <textarea name="comments" value={formData.comments} onChange={handleChange} />
                </label>
                <button type="submit">{mode === 'edit' ? 'Update' : 'Save'}</button>
                <button type="button" onClick={onClose}>Cancel</button>
            </form>
        </div>
    );
};

export default ItemListForm;
