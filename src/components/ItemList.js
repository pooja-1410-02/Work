import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ItemListForm from './ItemListForm'; // Ensure this path is correct
import './ItemList.css';

const ItemList = ({ username, userDetails }) => {
    const [items, setItems] = useState([]);
    const [plos, setPlos] = useState([]);
    const [processors, setProcessors] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [formMode, setFormMode] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [activeYear, setActiveYear] = useState(null);
    const [activeFlavour, setActiveFlavour] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isAdmin = userDetails?.is_staff;

    // Function to remove duplicates based on SID
    const removeDuplicates = (items) => {
        const uniqueItems = [];
        const seen = new Set();
        items.forEach(item => {
            if (!seen.has(item.sid)) {
                seen.add(item.sid);
                uniqueItems.push(item);
            }
        });
        return uniqueItems;
    };

    // Fetch data from APIs
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [itemsResponse, plosResponse, processorsResponse] = await Promise.all([
                axios.get('http://localhost:8000/api/api/item/'),
                axios.get('http://localhost:8000/api/api/plo/'),
                axios.get('http://localhost:8000/api/api/processor/')
            ]);

            const uniqueItems = removeDuplicates(itemsResponse.data);
            setItems(uniqueItems);
            setPlos(plosResponse.data);
            setProcessors(processorsResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate unique years and flavours from items
    const uniqueYears = [...new Set(items.map(item => item.requested_date.split('-')[0]))].sort((a, b) => b - a);
    const uniqueFlavours = [...new Set(items.map(item => item.flavour))].sort();

    // Filter items by the selected year and flavour
    const filteredItems = items.filter(item => {
        const matchesYear = activeYear === null || item.requested_date.startsWith(activeYear);
        const matchesFlavour = !activeFlavour || item.flavour === activeFlavour;
        return matchesYear && matchesFlavour;
    });

    // Helper functions to get names from IDs
    const getPloNameById = (id) => {
        const plo = plos.find(plo => plo.id === id);
        return plo ? plo.name : 'Unknown PLO';
    };

    const getProcessorNameById = (id) => {
        const processor = processors.find(processor => processor.id === id);
        return processor ? processor.name : 'Unknown Processor';
    };

    // Determine row class based on status
    const getRowClassByStatus = (status) => {
        if (status === 'Handed over to PLO' || status === 'Handedover to PLO') {
            return 'row-green';
        } else if (status === 'REBUILD' || status === 'Cancelled') {
            return 'row-red';
        }
        return 'row-orange';
    };

    // Handle editing an item
    const handleEdit = (item) => {
        setEditingItem(item);
        setFormMode('edit');
        setShowForm(true);
    };

    // Handle adding a new item
    const handleAddNew = () => {
        setEditingItem(null);
        setFormMode('add');
        setShowForm(true);
    };

    // Handle copying an item
    const handleCopy = (item) => {
        const newItem = { ...item, sid: null };
        setEditingItem(newItem);
        setFormMode('copy');
        setShowForm(true);
    };

    // Close the form
    const handleFormClose = () => {
        setEditingItem(null);
        setShowForm(false);
    };

    // Save or update item
    const handleFormSave = async (itemToSave) => {
        try {
            let response;
            if (formMode === 'add') {
                response = await axios.post('http://localhost:8000/api/api/item/', itemToSave);
                setItems(prevItems => [...prevItems, response.data]);
            } else if (formMode === 'edit') {
                response = await axios.put(`http://localhost:8000/api/api/item/${itemToSave.sid}/`, itemToSave);
                setItems(prevItems => prevItems.map(item => (item.sid === response.data.sid ? response.data : item)));
            } else if (formMode === 'copy') {
                response = await axios.post('http://localhost:8000/api/api/item/', itemToSave);
                setItems(prevItems => [...prevItems, response.data]);
            }

            handleFormClose(); // Close the form after saving
            
            // Check if the status has changed
            if (editingItem && response.data.status !== editingItem.status) {
                try {
                    const emailResponse = await axios.post('http://localhost:8000/api/api/send-email/', {
                        sid: response.data.sid,
                        status: response.data.status,
                        itemDetails: response.data
                    });
                    console.log('Email sent response:', emailResponse.data);
                } catch (emailError) {
                    console.error('Error sending email:', emailError.response ? emailError.response.data : emailError.message);
                }
            }
        } catch (error) {
            console.error('Error saving item:', error.response ? error.response.data : error.message);
            setError('Failed to save item.');
        }
    };

    // Handle deleting an item
    const handleDelete = async (sid) => {
        try {
            setLoading(true);
            await axios.delete(`http://localhost:8000/api/api/item/${sid}/`);
            setItems(items.filter(item => item.sid !== sid));
        } catch (error) {
            console.error('Error deleting item:', error);
            setError('Failed to delete item.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="item-list">
            {error && <p className="error">{error}</p>}
            <div className="filter">
                <label htmlFor="year-select">Select Year:</label>
                <select
                    id="year-select"
                    value={activeYear || ''}
                    onChange={(e) => {
                        const selectedYear = e.target.value || null;
                        setActiveYear(selectedYear);
                    }}
                >
                    <option value="">Years</option>
                    {uniqueYears.map(year => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>
            <div className="filter">
                <label htmlFor="flavour-select">Select Flavour:</label>
                <select
                    id="flavour-select"
                    value={activeFlavour}
                    onChange={(e) => setActiveFlavour(e.target.value)}
                >
                    <option value="">All Flavours</option>
                    {uniqueFlavours.map(flavour => (
                        <option key={flavour} value={flavour}>
                            {flavour}
                        </option>
                    ))}
                </select>
            </div>
            {isAdmin && (
                <button onClick={handleAddNew} disabled={loading}>Add Item</button>
            )}
            {loading && <p>Loading...</p>}
            {showForm && (
                <ItemListForm
                    item={editingItem}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                    plos={plos}
                    processors={processors}
                    mode={formMode}
                />
            )}
            <table>
                <thead>
                    <tr>
                        {[
                            'Requested Date', 'Flavour', 'SID', 'Estimated Clients', 'Delivered Clients', 'BFS',
                            'T-Shirt Size', 'System Type', 'Hardware', 'Setup', 'PLO', 'Processor1', 'Processor2',
                            'Status', 'Landscape', 'Description', 'Expected Delivery', 'Revised Delivery Date',
                            'Delivery Date', 'Delivery Delay Reason', 'ServiceNow', 'Comments'
                        ].map(header => (
                            <th key={header}>{header}</th>
                        ))}
                        {isAdmin && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.length === 0 ? (
                        <tr>
                            <td colSpan={isAdmin ? 22 : 21}>No items available.</td>
                        </tr>
                    ) : (
                        filteredItems.map(item => (
                            <tr key={item.sid} className={getRowClassByStatus(item.status)}>
                                {[
                                    'requested_date', 'flavour', 'sid', 'estimated_clients', 'delivered_clients', 'bfs',
                                    't_shirt_size', 'system_type', 'hardware', 'setup', 'plo', 'processor1', 'processor2',
                                    'status', 'landscape', 'description', 'expected_delivery', 'revised_delivery_date',
                                    'delivery_date', 'delivery_delay_reason', 'servicenow', 'comments'
                                ].map(field => (
                                    <td key={field} className={item[field] ? 'filled' : 'empty'}>
                                        {field === 'plo' ? getPloNameById(item[field]) : 
                                         field === 'processor1' ? getProcessorNameById(item[field]) : 
                                         field === 'processor2' ? getProcessorNameById(item[field]) : 
                                         item[field] || ''}
                                    </td>
                                ))}
                                {isAdmin && (
                                    <td>
                                        <button onClick={() => handleEdit(item)} disabled={loading}>Edit</button>
                                        <button onClick={() => handleCopy(item)} disabled={loading}>Copy</button>
                                        <button className="delete" onClick={() => handleDelete(item.sid)} disabled={loading}>Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ItemList;
