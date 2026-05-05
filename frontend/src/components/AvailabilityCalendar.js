import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import '../styles/ReviewComponents.css';

const AvailabilityCalendar = ({ vehicleId, bookedDateRanges = [], onDateRangeSelect }) => {
    const now = new Date();
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [dateStatusMap, setDateStatusMap] = useState({});
    const [selectedStart, setSelectedStart] = useState(null);
    const [selectedEnd, setSelectedEnd] = useState(null);
    const [hoverDate, setHoverDate] = useState(null);

    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const fetchAvailability = useCallback(async () => {
        try {
            const res = await api.get(`/vehicles/${vehicleId}/availability?month=${monthStr}`);
            setDateStatusMap(res.data.dates || {});
        } catch (err) {
            console.error('Failed to fetch availability:', err);
        }
    }, [vehicleId, monthStr]);

    useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

    // Socket.io: listen for real-time availability updates
    useEffect(() => {
        const socketUrl = process.env.REACT_APP_API_URL
            ? process.env.REACT_APP_API_URL.replace('/api', '')
            : 'http://localhost:5000';
        const socket = io(socketUrl);

        socket.emit('join_vehicle_room', { vehicleId });

        socket.on('availability_updated', () => {
            fetchAvailability();
        });

        return () => {
            socket.off('availability_updated');
            socket.disconnect();
        };
    }, [vehicleId, fetchAvailability]);

    const goToPrev = () => {
        if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear((y) => y - 1); }
        else setCurrentMonth((m) => m - 1);
    };

    const goToNext = () => {
        if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear((y) => y + 1); }
        else setCurrentMonth((m) => m + 1);
    };

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toLocalDate = (dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const toDateStr = (dateObj) => (
        `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
    );

    const enumerateDateStrings = (startStr, endStr) => {
        const dates = [];
        const start = toLocalDate(startStr);
        const end = toLocalDate(endStr);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(toDateStr(d));
        }

        return dates;
    };

    const handleDayClick = (dateStr) => {
        const status = dateStatusMap[dateStr];
        if (status === 'booked' || status === 'pending') return;

        const clickedDate = toLocalDate(dateStr);
        if (clickedDate < today) return;

        if (!selectedStart || (selectedStart && selectedEnd)) {
            setSelectedStart(dateStr);
            setSelectedEnd(null);
            setHoverDate(null);
        } else {
            if (dateStr < selectedStart) {
                setSelectedStart(dateStr);
                setSelectedEnd(null);
                setHoverDate(null);
                return;
            }

            // Check if any booked/pending dates are in range
            let hasConflict = false;
            for (const ds of enumerateDateStrings(selectedStart, dateStr)) {
                if (dateStatusMap[ds] === 'booked' || dateStatusMap[ds] === 'pending') {
                    hasConflict = true;
                    break;
                }
            }

            if (hasConflict) {
                setSelectedStart(dateStr);
                setSelectedEnd(null);
                setHoverDate(null);
                return;
            }

            setSelectedEnd(dateStr);
            setHoverDate(null);
            if (onDateRangeSelect) onDateRangeSelect(selectedStart, dateStr);
        }
    };

    const handleDayHover = (dateStr) => {
        if (!selectedStart || selectedEnd) return;
        if (dateStr < selectedStart) {
            setHoverDate(null);
            return;
        }
        setHoverDate(dateStr);
    };

    const getDayClass = (dateStr) => {
        const d = toLocalDate(dateStr);
        if (d < today) return 'past';

        const status = dateStatusMap[dateStr];
        if (status === 'booked') return 'booked';
        if (status === 'pending') return 'pending';

        if (dateStr === selectedStart || dateStr === selectedEnd) return 'selected';

        const activeRangeEnd = selectedEnd || hoverDate;
        if (selectedStart && activeRangeEnd && dateStr > selectedStart && dateStr < activeRangeEnd) {
            return 'in-range';
        }

        return 'available';
    };

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={goToPrev}>← Prev</button>
                <h3>{monthName}</h3>
                <button className="calendar-nav-btn" onClick={goToNext}>Next →</button>
            </div>

            <div className="calendar-grid">
                {dayLabels.map((d) => <div key={d} className="calendar-day-label">{d}</div>)}
                {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} className="calendar-day empty" />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const cls = getDayClass(dateStr);
                    return (
                        <div
                            key={dateStr}
                            className={`calendar-day ${cls}`}
                            onClick={() => handleDayClick(dateStr)}
                            onMouseEnter={() => handleDayHover(dateStr)}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            <div className="calendar-legend">
                <div className="legend-item"><div className="legend-dot available" /><span>Available</span></div>
                <div className="legend-item"><div className="legend-dot booked" /><span>Booked</span></div>
                <div className="legend-item"><div className="legend-dot pending" /><span>Pending</span></div>
                <div className="legend-item"><div className="legend-dot selected" /><span>Selected</span></div>
            </div>

            {selectedStart && (
                <p style={{ fontSize: '0.85rem', color: '#667eea', marginTop: '0.75rem', fontWeight: 600 }}>
                    Selected: {selectedStart}{selectedEnd ? ` → ${selectedEnd}` : ' (select end date)'}
                </p>
            )}
        </div>
    );
};

export default AvailabilityCalendar;
