import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ForecastForm from './ForecastForm';
import './Forecast.css';

const Forecast = ({ username, userDetails }) => {
    const [forecasts, setForecasts] = useState([]);
    const [editingForecast, setEditingForecast] = useState(null);
    const [formMode, setFormMode] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedForecasts, setExpandedForecasts] = useState(new Set());
    const [items, setItems] = useState([]);
    const [plos, setPlos] = useState([]);

    const isAdmin = userDetails?.is_staff;

    const fetchData = useCallback(async (url, setData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(url);
            setData(response.data);
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
            setError('Failed to fetch data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData('http://localhost:8000/api/api/forecast/', setForecasts);
        fetchData('http://localhost:8000/api/api/item/', setItems);
        fetchData('http://localhost:8000/api/api/plo/', setPlos);
    }, [fetchData]);

    const handleEdit = (forecast) => {
        setEditingForecast(forecast);
        setFormMode('edit');
        setShowForm(true);
    };

    const handleAddNew = () => {
        setEditingForecast(null);
        setFormMode('add');
        setShowForm(true);
    };

    const handleFormClose = () => {
        setEditingForecast(null);
        setShowForm(false);
    };

    const handleFormSave = async (forecastToSave) => {
        setLoading(true);
        try {
            const requiredFields = [
                'sid', 'clients', 'bfs', 'system_description',
                'time_weeks', 'landscape', 'frontend', 
                'requester', 'cw_request_plo', 'item_sid'
            ];
            const missingFields = requiredFields.filter(field => !forecastToSave[field]);

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            let response;
            if (formMode === 'add') {
                response = await axios.post('http://localhost:8000/api/api/forecast/', forecastToSave);
                setForecasts(prev => [...prev, response.data]);
            } else if (formMode === 'edit') {
                response = await axios.put(`http://localhost:8000/api/api/forecast/${forecastToSave.id}/`, forecastToSave);
                setForecasts(prev => prev.map(forecast => (forecast.id === response.data.id ? response.data : forecast)));
            }
            handleFormClose();
        } catch (error) {
            setError(error.response ? `Failed to save forecast: ${error.response.data.detail || error.response.data}` : 'Failed to save forecast.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`http://localhost:8000/api/api/forecast/${id}/`);
            setForecasts(prev => prev.filter(forecast => forecast.id !== id));
        } catch (error) {
            setError('Failed to delete forecast. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedForecasts(prev => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const renderTableHeaders = () => (
        <>
            <th>SID</th>
            {expandedForecasts.size > 0 && (
                <>
                    <th>Clients</th>
                    <th>BFS</th>
                    <th>System Description</th>
                    <th>Time (weeks)</th>
                    <th>Landscape</th>
                    <th>Frontend</th>
                    <th>Requester</th>
                    <th>Parallel Processing</th>
                    <th>CW Request PLO</th>
                    <th>CW Delivered</th>
                    <th>Comments</th>
                    <th>Referred System</th>
                </>
            )}
            {isAdmin && <th>Actions</th>}
        </>
    );

    return (
        <div className="forecast">
            {error && <p className="error">{error}</p>}
            {isAdmin && (
                <button onClick={handleAddNew} disabled={loading} aria-label="Add New Forecast">
                    Add Forecast
                </button>
            )}
            {loading && <p>Loading...</p>}
            {showForm && (
                <ForecastForm
                    forecast={editingForecast}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                    mode={formMode}
                    items={items}
                    plos={plos}
                />
            )}
            <table>
                <thead>
                    <tr>{renderTableHeaders()}</tr>
                </thead>
                <tbody>
                    {forecasts.length === 0 ? (
                        <tr>
                            <td colSpan={isAdmin ? 14 : 13}>No forecasts available.</td>
                        </tr>
                    ) : (
                        forecasts.map(forecast => {
                            const correspondingItem = items.find(item => item.id === forecast.item_id);
                            return (
                                <React.Fragment key={forecast.id}>
                                    <tr>
                                        <td onClick={() => toggleExpand(forecast.id)} style={{ cursor: 'pointer' }}>
                                            {forecast.sid}
                                            <span style={{ marginLeft: '8px' }}>
                                                {expandedForecasts.has(forecast.id) ? '▼' : '►'}
                                            </span>
                                        </td>
                                        {expandedForecasts.has(forecast.id) && (
                                            <>
                                                <td>{forecast.clients}</td>
                                                <td>{forecast.bfs}</td>
                                                <td>{forecast.system_description}</td>
                                                <td>{forecast.time_weeks}</td>
                                                <td>{forecast.landscape}</td>
                                                <td>{forecast.frontend}</td>
                                                <td>{forecast.requester_name}</td>
                                                <td>{forecast.parallel_processing ? 'Yes' : 'No'}</td>
                                                <td>{forecast.cw_request_plo}</td>
                                                <td>{forecast.cw_delivered}</td>
                                                <td>{forecast.comments}</td>
                                                <td>{correspondingItem ? correspondingItem.sid : 'N/A'}</td>
                                            </>
                                        )}
                                        {isAdmin && (
                                            <td>
                                                <button onClick={() => handleEdit(forecast)} disabled={loading} aria-label="Edit Forecast">
                                                    Edit
                                                </button>
                                                <button
                                                    className="delete"
                                                    onClick={() => handleDelete(forecast.id)}
                                                    disabled={loading}
                                                    aria-label="Delete Forecast"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                </React.Fragment>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Forecast;
