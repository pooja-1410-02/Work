import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import './Dashboard.css';

const Dashboard = () => {
    const [items, setItems] = useState([]);
    const [processors, setProcessors] = useState([]);
    const [metrics, setMetrics] = useState({
        itemsByYear: {},
        avgEstimatedClientsByYear: {},
        systemsByProcessorAndMonth: {},
        deliveredEstimatedClientsBySID: {},
        completedOnTimeByYear: {},
        completedSIDsByYear: {},
    });
    const [processorIdToName, setProcessorIdToName] = useState({});
    const [activeYear, setActiveYear] = useState('');
    const [activeMonth, setActiveMonth] = useState('');
    const [activeSID, setActiveSID] = useState('');
    const [activeStatus, setActiveStatus] = useState('');

    const getYearFromDate = (dateString) => {
        if (!dateString) return null;
        return Number(dateString.split('-')[0]);
    };

    const calculateMetrics = useCallback(() => {
        if (!items.length || !processors.length) return;

        const filteredItems = activeYear
            ? items.filter(item => getYearFromDate(item.delivery_date) === Number(activeYear))
            : items;

        const itemsByYear = filteredItems.reduce((acc, item) => {
            const year = getYearFromDate(item.delivery_date);
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {});

        const avgEstimatedClientsByYear = filteredItems.reduce((acc, item) => {
            const year = getYearFromDate(item.delivery_date);
            if (!acc[year]) acc[year] = { totalClients: 0, count: 0 };
            acc[year].totalClients += parseInt(item.estimated_clients, 10) || 0;
            acc[year].count += 1;
            return acc;
        }, {});

        for (const year in avgEstimatedClientsByYear) {
            avgEstimatedClientsByYear[year] = avgEstimatedClientsByYear[year].totalClients / avgEstimatedClientsByYear[year].count;
        }

        const filterSystemsByProcessorAndMonth = (itemsData, month, sid, status) => {
            return itemsData
                .filter(item => {
                    const itemYear = getYearFromDate(item.delivery_date);
                    return (!month || item.delivery_date.split('-')[1] === month) &&
                           (!sid || item.sid === sid) &&
                           (!status || item.status === status) &&
                           (!activeYear || itemYear === Number(activeYear));
                })
                .reduce((acc, item) => {
                    const processorIds = [item.processor1, item.processor2];
                    processorIds.forEach(id => {
                        if (id) {
                            if (!acc[id]) acc[id] = { count: 0, sids: [] };
                            acc[id].count += 1;
                            if (!acc[id].sids.includes(item.sid)) {
                                acc[id].sids.push(item.sid);
                            }
                        }
                    });
                    
                    return acc;
                }, {});
        };

        const systemsByProcessorAndMonth = filterSystemsByProcessorAndMonth(filteredItems, activeMonth, activeSID, activeStatus);

        const deliveredEstimatedClientsBySID = filteredItems.reduce((acc, item) => {
            const sid = item.sid;
            const estimatedClients = parseInt(item.estimated_clients, 10) || 0;
            const deliveredClients = parseInt(item.delivered_clients, 10) || 0;

            if (!acc[sid]) acc[sid] = { estimated: 0, delivered: 0 };
            acc[sid].estimated += estimatedClients;
            acc[sid].delivered += deliveredClients;

            return acc;
        }, {});

        const completedOnTimeByYear = filteredItems.reduce((acc, item) => {
            const year = getYearFromDate(item.delivery_date);
            if (item.expected_delivery === item.delivery_date) {
                acc[year] = (acc[year] || 0) + 1;
            }
            return acc;
        }, {});

        const completedSIDsByYear = {};
        filteredItems.forEach(item => {
            const year = getYearFromDate(item.delivery_date);
            if (item.expected_delivery === item.delivery_date) {
                if (!completedSIDsByYear[year]) {
                    completedSIDsByYear[year] = [];
                }
                completedSIDsByYear[year].push(item.sid);
            }
        });

        setMetrics({
            itemsByYear,
            avgEstimatedClientsByYear,
            systemsByProcessorAndMonth,
            deliveredEstimatedClientsBySID,
            completedOnTimeByYear,
            completedSIDsByYear,
        });

        // Debugging output
        // console.log('Metrics calculated:', metrics);
    }, [items, processors, activeYear, activeMonth, activeSID, activeStatus]);

    const fetchData = useCallback(async () => {
        try {
            const [itemsResponse, processorsResponse] = await Promise.all([
                axios.get('http://localhost:8000/api/api/item/'),
                axios.get('http://localhost:8000/api/api/processor/'),
            ]);

            setItems(itemsResponse.data);
            setProcessors(processorsResponse.data);

            const idToNameMap = processorsResponse.data.reduce((map, processor) => {
                map[processor.id] = processor.name;
                return map;
            }, {});
            setProcessorIdToName(idToNameMap);
        } catch (error) {
            console.error('Error fetching items or processors', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        calculateMetrics();
    }, [items, processors, activeYear, activeMonth, activeSID, activeStatus, calculateMetrics]);

    const handleYearChange = (event) => setActiveYear(event.target.value);
    const handleMonthChange = (event) => setActiveMonth(event.target.value);
    const handleSIDChange = (event) => setActiveSID(event.target.value);
    const handleStatusChange = (event) => setActiveStatus(event.target.value);

    const getFilteredSystemsData = () => {
        const filteredData = metrics.systemsByProcessorAndMonth;
        const labels = Object.keys(filteredData).map(id => processorIdToName[id] || id);
        const values = Object.values(filteredData).map(data => data.count || 0);

        // Debugging output
        // console.log('Filtered systems data:', filteredData);

        return {
            labels,
            datasets: [{
                label: 'Systems by Processor',
                data: values,
                backgroundColor: 'rgba(75,192,192,0.2)',
                borderColor: 'rgba(75,192,192,1)',
                borderWidth: 2,
            }],
        };
    };

    const getDeliveredEstimatedClientsBySIDData = () => {
        const data = metrics.deliveredEstimatedClientsBySID;
        const labels = Object.keys(data);
        const values = labels.map(sid => {
            const { estimated, delivered } = data[sid] || {};
            return estimated > 0 ? Math.abs(((delivered - estimated) / estimated) * 100) : null;
        });

        return {
            labels,
            datasets: [{
                label: 'Percentage Change between Delivered and Estimated Clients',
                data: values,
                backgroundColor: 'rgba(75,192,192,0.2)',
                borderColor: 'rgba(75,192,192,1)',
                borderWidth: 2,
            }],
        };
    };

    const getCompletedOnTimeByYearData = () => {
        const data = metrics.completedOnTimeByYear;
        const labels = Object.keys(data);
        const values = Object.values(data);

        return {
            labels,
            datasets: [{
                label: 'Completed on Time Systems',
                data: values,
                backgroundColor: 'rgba(255,206,86,0.2)',
                borderColor: 'rgba(255,206,86,1)',
                borderWidth: 2,
            }],
        };
    };

    const chartOptionsForCompletedOnTime = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        const year = tooltipItem.label;
                        const count = metrics.completedOnTimeByYear[year] || 0;
                        const completedSIDs = metrics.completedSIDsByYear[year] || [];
                        return [
                            `Year: ${year}`,
                            `Completed Count: ${count}`,
                            `SIDs: ${completedSIDs.length ? completedSIDs.join(', ') : 'None'}`,
                        ];
                    },
                },
            },
        },
        scales: {
            x: { title: { display: true, text: 'Year' } },
            y: { title: { display: true, text: 'Completed Systems Count' } },
        },
    };

    const chartOptionsForDeliveredEstimated = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        const sid = tooltipItem.label;
                        const { estimated = 0, delivered = 0 } = metrics.deliveredEstimatedClientsBySID[sid] || {};
                        return [
                            `SID: ${sid}`,
                            `Estimated Clients: ${estimated}`,
                            `Delivered Clients: ${delivered}`,
                        ];
                    },
                },
            },
        },
        scales: {
            x: { title: { display: true, text: 'SID' } },
            y: { title: { display: true, text: 'Percentage Change' } },
        },
    };

    const chartOptionsForSystemsByProcessor = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        const processorIndex = tooltipItem.dataIndex; // Get index of the hovered item
                        const processorId = Object.keys(metrics.systemsByProcessorAndMonth)[processorIndex]; // Get the processor ID using index
                        const { count = 0, sids = [] } = metrics.systemsByProcessorAndMonth[processorId] || {};
                        // console.log('Tooltip data for processor:', { processorId, count, sids }); // Debugging output
                        return [
                            `Processor: ${processorId}`,
                            `Count: ${count}`,
                            `SIDs: ${sids.length ? sids.join(', ') : 'None'}`,
                        ];
                    },
                },
            },
        },
        scales: {
            x: { title: { display: true, text: 'Processor' } },
            y: { title: { display: true, text: 'System Count' } },
        },
    };

    const uniqueYears = [...new Set(items.map(item => getYearFromDate(item.delivery_date)))].sort((a, b) => b - a);
    const uniqueMonths = [...new Set(items.map(item => item.delivery_date.split('-')[1]))].sort();
    const uniqueSIDs = [...new Set(items.map(item => item.sid))].sort();
    const uniqueStatuses = [...new Set(items.map(item => item.status))].sort();

    return (
        <div className="dashboard">
            <div className="filter-container">
                <div className="filter">
                    <div>
                        <label htmlFor="year-select">Select Year:</label>
                        <select
                            id="year-select"
                            value={activeYear || ''}
                            onChange={handleYearChange}
                        >
                            <option value="">Years</option>
                            {uniqueYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="month-select">Select Month:</label>
                        <select
                            id="month-select"
                            value={activeMonth || ''}
                            onChange={handleMonthChange}
                        >
                            <option value="">Months</option>
                            {uniqueMonths.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sid-select">Select SID:</label>
                        <select
                            id="sid-select"
                            value={activeSID || ''}
                            onChange={handleSIDChange}
                        >
                            <option value="">SID</option>
                            {uniqueSIDs.map(sid => (
                                <option key={sid} value={sid}>{sid}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status-select">Select Status:</label>
                        <select
                            id="status-select"
                            value={activeStatus || ''}
                            onChange={handleStatusChange}
                        >
                            <option value="">Status</option>
                            {uniqueStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className="chart-row">
                <div className="chart-container">
                    <h3>Systems Build based on year</h3>
                    <div className="chart">
                        <Bar data={getCompletedOnTimeByYearData()} options={chartOptionsForCompletedOnTime} />
                    </div>
                </div>
                <div className="chart-container">
                    <h3>Percentage difference between Estimated And Delivered Clients based on SID</h3>
                    <div className="chart">
                        <Bar data={getDeliveredEstimatedClientsBySIDData()} options={chartOptionsForDeliveredEstimated} />
                    </div>
                </div>
            </div>
            <div className="chart-row">
                <div className="chart-container">
                    <h3>Systems Build by Processors</h3>
                    <div className="chart">
                        <Bar data={getFilteredSystemsData()} options={chartOptionsForSystemsByProcessor} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
