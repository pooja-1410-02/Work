import React, { useState, useEffect } from 'react';
import './PeakPlanning.css';

const PeakPlanning = () => {
    const [currentHalf, setCurrentHalf] = useState(1); // First Half by default
    const [months, setMonths] = useState([]);
    const [systems, setSystems] = useState([]); // Systems data
    const [peakWeeks, setPeakWeeks] = useState([]); // Selected peak weeks
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState(2023); // Default year

    // Fetch systems data
    useEffect(() => {
        const fetchSystems = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://127.0.0.1:8000/api/api/item/');
                const data = await response.json();
                setSystems(data);
            } catch (error) {
                setError('Error fetching systems');
                console.error('Error fetching systems:', error);
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

    const renderHeader = () => (
        <tr>
            {months.map((month, index) => (
                <th key={index} colSpan="4">{month}</th>
            ))}
        </tr>
    );

    const renderWeeksHeader = () => {
        const weekHeaders = [];
        const startWeek = currentHalf === 1 ? 1 : 27;

        for (let weekIndex = 0; weekIndex < 26; weekIndex++) {
            const weekNumber = startWeek + weekIndex;
            weekHeaders.push(
                <th key={`cw-${weekNumber}`}>CW{weekNumber.toString().padStart(2, '0')}</th>
            );
        }

        return <tr>{weekHeaders}</tr>;
    };

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

    const renderRows = () => {
        const renderedSids = new Set();
        const filteredSystems = systems.filter(system => {
            const reqDate = new Date(system.requested_date);
            const systemYear = reqDate.getFullYear();
    
            // Check if the system's year matches the selected year
            if (systemYear !== selectedYear || system.flavour !== "S/4H OP") {
                return false;
            }
    
            // Now check for the first or second half of the year based on the requested CW (calendar week)
            const startCW = getCWFromDate(system.requested_date);
            const endCW = getCWFromDate(system.delivery_date);
            if (currentHalf === 1) {
                return startCW <= 26 && endCW <= 26; // Only allow systems that fall within the first half
            } else {
                return startCW >= 27 && endCW >= 27; // Only allow systems that fall within the second half
            }
        });
    
        return filteredSystems.map((system, index) => {
            const sid = system.sid;
    
            if (renderedSids.has(sid)) return null;
            renderedSids.add(sid);
    
            const { startCW, endCW } = getMonthAndCW(system.requested_date, system.delivery_date);
            const rowCells = [];
            let count = 0;
    
            const startWeek = currentHalf === 1 ? 1 : 27; // Start at CW1 for first half, CW27 for second half
            const endWeek = currentHalf === 1 ? 26 : 52; // End at CW26 for first half, CW52 for second half
    
            // Loop through the weeks and create row cells
            for (let weekIndex = 0; weekIndex < 26; weekIndex++) {
                const weekNumber = startWeek + weekIndex;
                const isInRange = startCW <= weekNumber && weekNumber <= endCW && weekNumber >= startWeek && weekNumber <= endWeek;
    
                if (isInRange) {
                    count++;
                } else {
                    if (count > 0) {
                        rowCells.push(
                            <td key={`sid-${sid}-week-${weekIndex}`} colSpan={count} className="sid-cell" title={`SID: ${sid}`} >
                                {sid}
                            </td>
                        );
                        count = 0;
                    } else {
                        rowCells.push(
                            <td key={`empty-${weekIndex}`} className="empty-cell" />
                        );
                    }
                }
            }
    
            if (count > 0) {
                rowCells.push(
                    <td key={`sid-${sid}-last`} colSpan={count} className="sid-cell" title={`SID: ${sid}`} >
                        {sid}
                    </td>
                );
            }
    
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

            {/* Filter Button for Year */}
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

            {/* Half Year Selection */}
            <div className="button-container">
                <button onClick={() => setCurrentHalf(1)}>First Half</button>
                <button onClick={() => setCurrentHalf(2)}>Second Half</button>
            </div>

            {/* Manual Mode for Peak Week Selection */}
            <div className="manual-peak-selection">
                <label>Select Peak Weeks:</label>
                <select
                    multiple
                    value={peakWeeks}
                    onChange={(e) => handleManualPeakSelection(Array.from(e.target.selectedOptions, option => parseInt(option.value)))}
                >
                    {Array.from({ length: 26 }, (_, index) => index + 1).map(week => (
                        <option key={week} value={week}>
                            CW{week.toString().padStart(2, '0')}
                        </option>
                    ))}
                </select>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h3>{selectedYear}</h3>
            <table>
                <thead>
                    {renderHeader()}
                    {renderWeeksHeader()}
                    {renderPeakWeeksRow()}
                </thead>
                <tbody>
                    {renderRows()}
                </tbody>
            </table>
        </div>
    );
};

export default PeakPlanning;
