import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import '../../styles/BookingPages.css';

const Earnings = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const perPage = 10;

    const fetchEarnings = async () => {
        try {
            setLoading(true);
            let params = `?period=${period}`;
            if (period === 'custom' && customStart && customEnd) {
                params += `&startDate=${customStart}&endDate=${customEnd}`;
            }
            const res = await api.get(`/vendor/earnings${params}`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEarnings(); }, [period, customStart, customEnd]);

    const handleExport = (type) => {
        setIsExporting(true);
        const token = localStorage.getItem('token');
        let url = `/api/vendor/earnings/export/${type}?period=${period}`;
        if (period === 'custom' && customStart && customEnd) {
            url += `&startDate=${customStart}&endDate=${customEnd}`;
        }
        window.open(`${process.env.REACT_APP_API_URL?.replace('/api', '')}${url}&token=${token}`, '_blank');
        setTimeout(() => setIsExporting(false), 2000);
    };

    const paginatedBookings = data?.perBooking?.slice((page - 1) * perPage, page * perPage) || [];
    const totalPages = Math.ceil((data?.perBooking?.length || 0) / perPage);

    return (
        <div className="earnings-container">
            <h1>Earnings Dashboard</h1>

            {loading ? (
                <div className="empty-state-card"><div className="emoji">⏳</div><h3>Loading earnings...</h3></div>
            ) : !data ? (
                <div className="empty-state-card"><div className="emoji">💰</div><h3>No earnings data</h3></div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="summary-cards">
                        <div className="summary-card">
                            <div className="card-label">Total Gross</div>
                            <div className="card-value gross">৳{data.summary.totalGross?.toLocaleString()}</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Commission Deducted</div>
                            <div className="card-value commission">-৳{data.summary.totalCommission?.toLocaleString()}</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Net Earnings</div>
                            <div className="card-value net">৳{data.summary.totalNet?.toLocaleString()}</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-label">Completed Bookings</div>
                            <div className="card-value bookings">{data.summary.totalBookings}</div>
                        </div>
                    </div>

                    {/* Filters + Export */}
                    <div className="filter-controls">
                        {['all', 'last30', 'monthly', 'custom'].map((p) => (
                            <button key={p} className={`filter-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                                {p === 'all' ? 'All Time' : p === 'last30' ? 'Last 30 Days' : p === 'monthly' ? 'This Month' : 'Custom Range'}
                            </button>
                        ))}
                        {period === 'custom' && (
                            <>
                                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ padding: '0.4rem', borderRadius: '8px', border: '2px solid #e2e8f0' }} />
                                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ padding: '0.4rem', borderRadius: '8px', border: '2px solid #e2e8f0' }} />
                            </>
                        )}
                        <div className="export-btns">
                            <button className="export-btn csv" disabled={isExporting} onClick={() => handleExport('csv')}>
                                {isExporting ? '⏳ Exporting...' : '📊 CSV'}
                            </button>
                            <button className="export-btn pdf" disabled={isExporting} onClick={() => handleExport('pdf')}>
                                {isExporting ? '⏳ Exporting...' : '📄 PDF'}
                            </button>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    {data.monthlyBreakdown?.length > 0 && (
                        <div className="chart-container">
                            <h2>📈 Revenue Trend</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.monthlyBreakdown}>
                                    <XAxis dataKey="month" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <Tooltip formatter={(v) => `৳${v.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="gross" name="Gross" fill="#667eea" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="net" name="Net" fill="#48bb78" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Per-Booking Table */}
                    {paginatedBookings.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="earnings-table">
                                <thead>
                                    <tr>
                                        <th>Booking ID</th>
                                        <th>Vehicle</th>
                                        <th>Trip Dates</th>
                                        <th>Gross</th>
                                        <th>Commission</th>
                                        <th>Net</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedBookings.map((b, i) => (
                                        <tr key={i}>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b.bookingId}</td>
                                            <td>{b.vehicleName}</td>
                                            <td>{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                                            <td>৳{b.gross?.toLocaleString()}</td>
                                            <td style={{ color: '#e53e3e' }}>-৳{b.commission?.toLocaleString()}</td>
                                            <td style={{ color: '#48bb78', fontWeight: 600 }}>৳{b.net?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                                    <button className="active">{page} / {totalPages}</button>
                                    <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Top Vehicles */}
                    {data.topVehicles?.length > 0 && (
                        <div className="chart-container" style={{ marginTop: '2rem' }}>
                            <h2>🏆 Top Performing Vehicles</h2>
                            {data.topVehicles.map((v, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <span><strong>#{i + 1}</strong> {v.name}</span>
                                    <span style={{ color: '#48bb78', fontWeight: 600 }}>৳{v.totalRevenue?.toLocaleString()} ({v.totalBookings} bookings)</span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Earnings;
