import React, { useState, useEffect } from 'react';
import './PeakPlanning.css';

const PeakPlanning = () => {
    const [currentHalf, setCurrentHalf] = useState(1);
    const [months, setMonths] = useState([]);
    const [systems, setSystems] = useState([]);
    const [peakWeeks, setPeakWeeks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState(2023);
    const [events, setEvents] = useState({});
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ weeks: [], eventName: '' });

    useEffect(() => {
        const fetchSystems = async () => {
            setLoading(true);
            try {
                // Fetch forecast data
                const forecastResponse = await fetch('http://127.0.0.1:8000/api/api/forecast');
                const forecastData = await forecastResponse.json();
            
                // Fetch systems data
                const systemsResponse = await fetch('http://127.0.0.1:8000/api/api/item/');
                const systemsData = await systemsResponse.json();
            
                // Filter and map data to include system details
                const filteredSystems = systemsData.filter(system =>
                    forecastData.some(forecast => forecast.item_sid === system.sid)
                );
    
                const systemsWithForecast = forecastData.map(forecast => {
                    const matchingSystem = filteredSystems.find(system => system.sid === forecast.item_sid);
                    return {
                        ...forecast,
                        systemDetails: matchingSystem // Include system details if found
                    };
                });
    
                setSystems(systemsWithForecast);
    
            } catch (error) {
                setError('Error fetching systems or forecast data');
                console.error('Error fetching systems or forecast data:', error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchSystems();
    }, [selectedYear]);       

    // Update months when the current half changes
    useEffect(() => {
        const monthNames = currentHalf === 1
            ? ['January', 'February', 'March', 'April', 'May', 'June']
            : ['July', 'August', 'September', 'October', 'November', 'December'];

        setMonths(monthNames);
    }, [currentHalf]);

    // Retrieve peak weeks from localStorage if they exist
    useEffect(() => {
        const storedPeakWeeks = localStorage.getItem(`peakWeeks_${selectedYear}`);
        if (storedPeakWeeks) {
            setPeakWeeks(JSON.parse(storedPeakWeeks));
        }
    }, [selectedYear]);

    // Handle manual selection of peak weeks
    const handleManualPeakSelection = (selected) => {
        setPeakWeeks(selected);
        // Save selected peak weeks to localStorage
        localStorage.setItem(`peakWeeks_${selectedYear}`, JSON.stringify(selected));
    };

    // Handle adding new event
    const handleAddEvent = () => {
        if (newEvent.weeks.length > 0 && newEvent.eventName) {
            newEvent.weeks.forEach(week => {
                setEvents(prevEvents => ({
                    ...prevEvents,
                    [week]: newEvent.eventName,
                }));
            });

            setIsEventFormOpen(false); 
            setNewEvent({ weeks: [], eventName: '' }); 
        }
    };

    const renderWeeksHeader = () => {
        const weekHeaders = [];
        const startWeek = currentHalf === 1 ? 1 : 27;
    
        // Add extra header for SID column on the left
        weekHeaders.push(<th key="sid-header">SID</th>);
    
        for (let weekIndex = 0; weekIndex < 26; weekIndex++) {
            const weekNumber = startWeek + weekIndex;
            weekHeaders.push(
                <th key={`cw-${weekNumber}`}>CW{weekNumber.toString().padStart(2, '0')}</th>
            );
        }
    
        return <tr>{weekHeaders}</tr>;
    };    

    // Render the peak weeks row
    const renderPeakWeeksRow = () => {
        const peakRowCells = [];
        const startWeek = currentHalf === 1 ? 1 : 27;

        for (let weekIndex = 0; weekIndex < 26; weekIndex++) {
            const weekNumber = startWeek + weekIndex;

            if (peakWeeks.includes(weekNumber)) {
                peakRowCells.push(
                    <td key={`peak-${weekNumber}`} className='peak-week'>
                        Peak CW{weekNumber}
                    </td>
                );
            } else {
                peakRowCells.push(<td key={`normal-${weekNumber}`} className='regular-week' />);
            }
        }

        return <tr>{peakRowCells}</tr>;
    };

    // Render the event row showing events for each CW
    const renderEventRow = () => {
        const eventRowCells = [];
        const startWeek = currentHalf === 1 ? 1 : 27;

        for (let weekIndex = 0; weekIndex < 26; weekIndex++) {
            const weekNumber = startWeek + weekIndex;

            const event = events[weekNumber];
            eventRowCells.push(
                <td key={`event-${weekNumber}`} className="event">
                    {event ? event : ''}
                </td>
            );
        }

        return <tr>{eventRowCells}</tr>;
    };

    const renderRows = () => {
        const renderedSids = new Set();
        
        return systems.map((forecast, index) => {
            const sid = forecast.sid;
            const system = forecast.systemDetails;
    
            // Ensure systemDetails exists before accessing requested_date
            if (!system) {
                return null; // If no system details are found, skip rendering this row
            }
    
            // Calculate start and end weeks for the system
            const { startCW, endCW } = getMonthAndCW(system.requested_date, system.delivery_date);
    
            // Prepare to render cells for weeks
            const rowCells = [];
            let count = 0;
    
            const startWeek = currentHalf === 1 ? 1 : 27;
            const endWeek = currentHalf === 1 ? 26 : 52;
    
            // Render the forecast sid to the left of CWs
            rowCells.push(
                <td key={`sid-${sid}`} rowSpan={1} className="sid-cell" title={`SID: ${sid}`}>
                    {sid}
                </td>
            );
    
            // Loop over the weeks, checking if they fall within the system's requested delivery window
            for (let weekIndex = 0; weekIndex < 26; weekIndex++) {
                const weekNumber = startWeek + weekIndex;
                const isInRange = startCW <= weekNumber && weekNumber <= endCW;
    
                if (isInRange) {
                    count++; // Continue counting weeks in the range
                } else {
                    // Render the row cell when the range ends
                    if (count > 0) {
                        rowCells.push(
                            <td key={`sid-${sid}-week-${weekIndex}`} colSpan={count} className="sid-cell" title={`SID: ${sid}`}>
                                {sid}
                            </td>
                        );
                        count = 0; // Reset the count for the next group of weeks
                    } else {
                        rowCells.push(
                            <td key={`empty-${weekIndex}`} className="empty-cell" />
                        );
                    }
                }
            }
    
            // If there's any remaining count, render it
            if (count > 0) {
                rowCells.push(
                    <td key={`sid-${sid}-last`} colSpan={count} className="sid-cell" title={`SID: ${sid}`}>
                        {sid}
                    </td>
                );
            }
    
            // Only render the row if there are cells to display
            return rowCells.length > 0 ? (
                <tr key={`row-${sid}-${index}`}>
                    {rowCells}
                </tr>
            ) : null;
        });
    };    
    

    const getCWFromDate = (date) => {
        const startOfYear = new Date(new Date(date).getFullYear(), 0, 1);
        const days = Math.floor((new Date(date) - startOfYear) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    };

    const getMonthAndCW = (requestedDate, deliveryDate) => {
        const requestedCW = getCWFromDate(requestedDate);
        const deliveryCW = getCWFromDate(deliveryDate);
        return { startCW: requestedCW, endCW: deliveryCW };
    };

    return (
        <div className="peak-planning-container">
            <h2>Planning {selectedYear}</h2>

            <div className="year-filter-container">
                <label htmlFor="year-select">Select Year:</label>
                <select
                    id="year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    <option value={2023}>2023</option>
                    <option value={2025}>2025</option>
                </select>
            </div>

            <div className="button-container">
                <button onClick={() => setCurrentHalf(1)}>First Half</button>
                <button onClick={() => setCurrentHalf(2)}>Second Half</button>
            </div>

            <div className="peak-week-selection">
                <label>Select Peak Weeks:</label>
                <select
                    multiple
                    value={peakWeeks}
                    onChange={(e) => handleManualPeakSelection(Array.from(e.target.selectedOptions, option => parseInt(option.value)))}
                >
                    {Array.from({ length: 26 }, (_, index) => index + 1).map((week) => (
                        <option key={week} value={week}>
                            CW{week.toString().padStart(2, '0')}
                        </option>
                    ))}
                </select>
            </div>

            <button onClick={() => setIsEventFormOpen(true)}>Add Event</button>

            {isEventFormOpen && (
                <div className="event-form">
                    <label>Enter Event for Selected CWs:</label>
                    <select
                        multiple
                        value={newEvent.weeks}
                        onChange={(e) => setNewEvent({ ...newEvent, weeks: Array.from(e.target.selectedOptions, option => parseInt(option.value)) })}
                    >
                        {Array.from({ length: 26 }, (_, index) => index + 1).map((week) => (
                            <option key={week} value={week}>
                                CW{week.toString().padStart(2, '0')}
                            </option>
                        ))}
                    </select>

                    <label>Event Name:</label>
                    <input
                        type="text"
                        value={newEvent.eventName}
                        onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                    />

                    <button onClick={handleAddEvent}>Add Event</button>
                    <button onClick={() => setIsEventFormOpen(false)}>Cancel</button>
                </div>
            )}

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h3>{selectedYear}</h3>
            <table>
                <thead>
                    {renderWeeksHeader()}
                    {renderPeakWeeksRow()}
                    {renderEventRow()}
                </thead>
                <tbody>
                    {renderRows()}
                </tbody>
            </table>
        </div>
    );
};

export default PeakPlanning;
