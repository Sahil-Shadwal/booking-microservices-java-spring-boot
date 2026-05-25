import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8081'; // API Gateway
const KEYCLOAK_URL = 'http://localhost:8080'; // Keycloak

function App() {
  const [activeTab, setActiveTab] = useState('flights');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(localStorage.getItem('offlineMode') === 'true');

  // Business state
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Form states
  const [passengerForm, setPassengerForm] = useState({ name: '', passportNumber: '', passengerType: 0, age: 30 });
  const [bookingForm, setBookingForm] = useState({ passengerId: '', flightId: '', seatNumber: '', description: '' });
  const [flightForm, setFlightForm] = useState({ flightNumber: 'FL-' + Math.floor(1000 + Math.random() * 9000), aircraftId: '', departureAirportId: '', arriveAirportId: '', departureDate: new Date().toISOString().slice(0,16), arriveDate: new Date().toISOString().slice(0,16), durationMinutes: 120, status: 'Flying', price: 5000 });
  const [airportForm, setAirportForm] = useState({ name: '', code: '', address: '' });
  const [aircraftForm, setAircraftForm] = useState({ name: '', model: '', manufacturingYear: 2024 });
  const [seatForm, setSeatForm] = useState({ seatNumber: '', seatType: 'Window', seatClass: 'FirstClass', flightId: '' });

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('success');

  // Auto-refresh interval
  const refreshIntervalRef = useRef(null);

  // Headers helper
  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (!offlineMode && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const showFeedback = (msg, type = 'success') => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // 1. Authenticate with Keycloak (Direct Access Grant / Password flow)
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch(`${KEYCLOAK_URL}/realms/keycloak-realm/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'booking-client-credentials',
          client_secret: 'secret',
          username: username,
          password: password,
          scope: 'openid'
        })
      });

      if (!response.ok) {
        throw new Error('Authentication failed. Check your credentials or Keycloak server.');
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      setOfflineMode(false);
      localStorage.setItem('offlineMode', 'false');
      showFeedback('Successfully authenticated with Keycloak!');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    showFeedback('Logged out successfully.');
  };

  const enableOfflineMode = () => {
    setOfflineMode(true);
    localStorage.setItem('offlineMode', 'true');
    showFeedback('Offline / Demo mode enabled. JWT authentication will be bypassed.', 'success');
  };

  // 2. Load Core Data
  const loadFlights = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/flight/get-available-flights`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFlights(data);
      }
    } catch (err) {
      console.error('Error loading flights:', err);
    }
  };

  const loadPassengers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/passenger`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPassengers(data);
      }
    } catch (err) {
      console.error('Error loading passengers:', err);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/booking`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/notification`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/audit-log`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  };

  const loadSeats = async (flightId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/flight/get-available-seats/${flightId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAvailableSeats(data.seatsDtoList || []);
      }
    } catch (err) {
      console.error('Error loading seats:', err);
    }
  };

  // Core Data Dispatcher
  const refreshAllData = () => {
    if (offlineMode || token) {
      loadFlights();
      loadPassengers();
      loadBookings();
      loadNotifications();
      loadAuditLogs();
    }
  };

  useEffect(() => {
    refreshAllData();
    // Setup background polling for real-time Audit Logs & Notifications
    refreshIntervalRef.current = setInterval(refreshAllData, 10000);
    return () => clearInterval(refreshIntervalRef.current);
  }, [token, offlineMode]);

  // Form Handlers
  const handleRegisterPassenger = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/passenger`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(passengerForm)
      });
      if (res.ok) {
        showFeedback('Passenger registered successfully!');
        setPassengerForm({ name: '', passportNumber: '', passengerType: 0, age: 30 });
        loadPassengers();
      } else {
        throw new Error('Failed to register passenger');
      }
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.passengerId || !bookingForm.flightId || !bookingForm.seatNumber) {
      showFeedback('Please select a passenger, flight, and seat.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/booking`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bookingForm)
      });
      if (res.ok) {
        showFeedback('Booking created successfully! Confirmed seat reserved.');
        setBookingForm({ passengerId: '', flightId: '', seatNumber: '', description: '' });
        setSelectedFlight(null);
        refreshAllData();
      } else {
        throw new Error('Failed to create booking. Make sure the seat is available and passenger unique.');
      }
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCreateFlight = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/flight`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(flightForm)
      });
      if (res.ok) {
        showFeedback('Flight created successfully!');
        setFlightForm({ flightNumber: 'FL-' + Math.floor(1000 + Math.random() * 9000), aircraftId: '', departureAirportId: '', arriveAirportId: '', departureDate: new Date().toISOString().slice(0,16), arriveDate: new Date().toISOString().slice(0,16), durationMinutes: 120, status: 'Flying', price: 5000 });
        loadFlights();
      } else {
        throw new Error('Failed to create flight');
      }
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCreateAirport = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/flight/airport`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(airportForm)
      });
      if (res.ok) {
        showFeedback('Airport created successfully!');
        setAirportForm({ name: '', code: '', address: '' });
      } else {
        throw new Error('Failed to create airport');
      }
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCreateAircraft = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/flight/aircraft`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(aircraftForm)
      });
      if (res.ok) {
        showFeedback('Aircraft created successfully!');
        setAircraftForm({ name: '', model: '', manufacturingYear: 2024 });
      } else {
        throw new Error('Failed to create aircraft');
      }
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCreateSeat = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/flight/seat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(seatForm)
      });
      if (res.ok) {
        showFeedback('Seat created successfully!');
        setSeatForm({ seatNumber: '', seatType: 'Window', seatClass: 'FirstClass', flightId: '' });
        if (selectedFlight && selectedFlight.id === seatForm.flightId) {
          loadSeats(selectedFlight.id);
        }
      } else {
        throw new Error('Failed to create seat');
      }
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const selectFlightForBooking = (flight) => {
    setSelectedFlight(flight);
    setBookingForm(prev => ({ ...prev, flightId: flight.id, seatNumber: '' }));
    loadSeats(flight.id);
  };

  // Auth Screen if not logged in AND not in offlineMode
  if (!offlineMode && !token) {
    return (
      <div className="dashboard-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%', margin: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="brand-logo" style={{ margin: '0 auto 1rem', width: '3.5rem', height: '3.5rem', fontSize: '1.75rem' }}>E</div>
            <h2 style={{ color: '#f8fafc', fontWeight: 600 }}>Enterprise Booking Platform</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Distributed Microservices Architecture Dashboard</p>
          </div>

          {authError && (
            <div className="alert error">
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" className="glass-input" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="glass-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="glass-button" disabled={authLoading}>
              {authLoading ? 'Connecting...' : 'Secure Login via Keycloak'}
            </button>
          </form>

          <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#475569' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
          </div>

          <button onClick={enableOfflineMode} className="glass-button secondary" style={{ width: '100%' }}>
            Bypass OAuth (Offline/Demo Mode)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="brand-section">
          <div className="brand-logo">E</div>
          <div className="brand-title">
            <h1>Enterprise Booking Platform</h1>
            <p>Distributed Microservices Architecture Dashboard {offlineMode && <span style={{ color: '#fb7185', fontWeight: 600 }}>(DEMO MODE)</span>}</p>
          </div>
        </div>

        {/* Real-time Health Indicators */}
        <div className="indicators-section">
          <div className="indicator">
            <span className={`indicator-dot online`}></span>
            <span>Gateway (8081)</span>
          </div>
          <div className="indicator">
            <span className={`indicator-dot ${offlineMode ? 'offline' : 'online'}`}></span>
            <span>Keycloak (8080)</span>
          </div>
          <div className="indicator">
            <span className={`indicator-dot ${flights.length > 0 || passengers.length > 0 ? 'online' : 'offline'}`}></span>
            <span>Services (8082-8086)</span>
          </div>
          <div className="indicator" style={{ cursor: 'pointer' }} onClick={refreshAllData}>
            🔄 Refresh
          </div>
        </div>

        {/* User profile */}
        <div className="profile-section">
          <span className="profile-role">ADMIN</span>
          <span className="profile-name">{offlineMode ? 'Local Admin' : 'Keycloak User'}</span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.8rem', marginLeft: '0.5rem', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="dashboard-main">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className={`nav-item ${activeTab === 'flights' ? 'active' : ''}`} onClick={() => setActiveTab('flights')}>
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            <span>Flights & Seats</span>
          </div>
          <div className={`nav-item ${activeTab === 'passengers' ? 'active' : ''}`} onClick={() => setActiveTab('passengers')}>
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span>Passengers</span>
          </div>
          <div className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            <span>Bookings</span>
          </div>
          <div className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span>Notifications Log {notifications.length > 0 && <span style={{ background: '#6366f1', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.7rem', marginLeft: 'auto' }}>{notifications.length}</span>}</span>
          </div>
          <div className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            <span>Audit Logs {auditLogs.length > 0 && <span style={{ background: '#a855f7', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.7rem', marginLeft: 'auto' }}>{auditLogs.length}</span>}</span>
          </div>
        </aside>

        {/* Content Area */}
        <main className="dashboard-content">
          {statusMessage && (
            <div className={`alert ${statusType}`}>
              <svg className="nav-icon" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* TAB: Flights */}
          {activeTab === 'flights' && (
            <div>
              {/* Setup Core Data components */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* Add Airport & Aircraft */}
                <div className="glass-card" style={{ marginBottom: 0 }}>
                  <h3 className="card-title">Setup Infrastructure Components</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <form onSubmit={handleCreateAirport} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.75rem', fontWeight: 600 }}>Create Airport</h4>
                      <div className="form-grid">
                        <div className="form-group"><input placeholder="Name (e.g. Heathrow)" className="glass-input" value={airportForm.name} onChange={e => setAirportForm({...airportForm, name: e.target.value})} required /></div>
                        <div className="form-group"><input placeholder="Code (e.g. LHR)" className="glass-input" value={airportForm.code} onChange={e => setAirportForm({...airportForm, code: e.target.value})} required /></div>
                        <div className="form-group"><input placeholder="Address" className="glass-input" value={airportForm.address} onChange={e => setAirportForm({...airportForm, address: e.target.value})} required /></div>
                      </div>
                      <button type="submit" className="glass-button secondary" style={{ width: '100%', padding: '0.5rem' }}>Add Airport</button>
                    </form>

                    <form onSubmit={handleCreateAircraft}>
                      <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.75rem', fontWeight: 600 }}>Create Aircraft</h4>
                      <div className="form-grid">
                        <div className="form-group"><input placeholder="Name (e.g. Boeing)" className="glass-input" value={aircraftForm.name} onChange={e => setAircraftForm({...aircraftForm, name: e.target.value})} required /></div>
                        <div className="form-group"><input placeholder="Model (e.g. 777)" className="glass-input" value={aircraftForm.model} onChange={e => setAircraftForm({...aircraftForm, model: e.target.value})} required /></div>
                        <div className="form-group"><input type="number" placeholder="Year" className="glass-input" value={aircraftForm.manufacturingYear} onChange={e => setAircraftForm({...aircraftForm, manufacturingYear: parseInt(e.target.value)})} required /></div>
                      </div>
                      <button type="submit" className="glass-button secondary" style={{ width: '100%', padding: '0.5rem' }}>Add Aircraft</button>
                    </form>
                  </div>
                </div>

                {/* Add Flight & Seats */}
                <div className="glass-card" style={{ marginBottom: 0 }}>
                  <h3 className="card-title">Launch New Flight</h3>
                  <form onSubmit={handleCreateFlight} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-grid">
                      <div className="form-group"><label>Flight Number</label><input className="glass-input" value={flightForm.flightNumber} onChange={e => setFlightForm({...flightForm, flightNumber: e.target.value})} required /></div>
                      <div className="form-group"><label>Aircraft ID</label><input placeholder="UUID" className="glass-input" value={flightForm.aircraftId} onChange={e => setFlightForm({...flightForm, aircraftId: e.target.value})} required /></div>
                    </div>
                    <div className="form-grid">
                      <div className="form-group"><label>Departure Airport</label><input placeholder="Airport UUID" className="glass-input" value={flightForm.departureAirportId} onChange={e => setFlightForm({...flightForm, departureAirportId: e.target.value})} required /></div>
                      <div className="form-group"><label>Arrive Airport</label><input placeholder="Airport UUID" className="glass-input" value={flightForm.arriveAirportId} onChange={e => setFlightForm({...flightForm, arriveAirportId: e.target.value})} required /></div>
                    </div>
                    <div className="form-grid">
                      <div className="form-group"><label>Price ($)</label><input type="number" className="glass-input" value={flightForm.price} onChange={e => setFlightForm({...flightForm, price: parseFloat(e.target.value)})} required /></div>
                      <div className="form-group"><label>Duration (m)</label><input type="number" className="glass-input" value={flightForm.durationMinutes} onChange={e => setFlightForm({...flightForm, durationMinutes: parseInt(e.target.value)})} required /></div>
                    </div>
                    <button type="submit" className="glass-button" style={{ width: '100%' }}>Launch Flight</button>
                  </form>
                </div>
              </div>

              {/* Browse Flights */}
              <div className="glass-card">
                <h3 className="card-title">Available Flights</h3>
                {flights.length === 0 ? (
                  <div className="empty-state">No flights available. Click refresh or create a flight above.</div>
                ) : (
                  <div className="flight-grid">
                    {flights.map(flight => (
                      <div key={flight.id} className={`flight-card ${selectedFlight?.id === flight.id ? 'selected' : ''}`} onClick={() => selectFlightForBooking(flight)}>
                        <div className="flight-card-header">
                          <span className="flight-number">{flight.flightNumber}</span>
                          <span className="badge blue">{flight.status}</span>
                        </div>
                        <div className="flight-route">
                          <div className="route-point">
                            <h4>DEP</h4>
                            <p style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{flight.departureAirportId}</p>
                          </div>
                          <div className="route-connector"></div>
                          <div className="route-point" style={{ textAlign: 'right' }}>
                            <h4>ARR</h4>
                            <p style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{flight.arriveAirportId}</p>
                          </div>
                        </div>
                        <div className="flight-details-list">
                          <span>📅 Date: {new Date(flight.flightDate).toLocaleString()}</span>
                          <span>⏱ Duration: {flight.durationMinutes} minutes</span>
                        </div>
                        <span className="flight-price">${flight.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Seat Map for Selected Flight */}
                {selectedFlight && (
                  <div className="seat-selector-section">
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', textAlign: 'center' }}>
                      Configure/Reserve Seats for {selectedFlight.flightNumber}
                    </h4>

                    {/* Quick Add Seat form */}
                    <form onSubmit={handleCreateSeat} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <input placeholder="Seat (e.g. 12A)" className="glass-input" style={{ width: '130px', padding: '0.4rem 0.8rem' }} value={seatForm.seatNumber} onChange={e => setSeatForm({ ...seatForm, seatNumber: e.target.value, flightId: selectedFlight.id })} required />
                      <select className="glass-select" style={{ padding: '0.4rem 0.8rem' }} value={seatForm.seatType} onChange={e => setSeatForm({ ...seatForm, seatType: e.target.value })}>
                        <option value="Window">Window</option>
                        <option value="Aisle">Aisle</option>
                        <option value="Middle">Middle</option>
                      </select>
                      <select className="glass-select" style={{ padding: '0.4rem 0.8rem' }} value={seatForm.seatClass} onChange={e => setSeatForm({ ...seatForm, seatClass: e.target.value })}>
                        <option value="FirstClass">FirstClass</option>
                        <option value="Business">Business</option>
                        <option value="Economy">Economy</option>
                      </select>
                      <button type="submit" className="glass-button secondary" style={{ padding: '0.4rem 1rem' }}>Create Seat</button>
                    </form>

                    <div className="seats-grid">
                      {availableSeats.length === 0 ? (
                        <div style={{ gridColumn: 'span 4', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>No seats defined. Use the form above to add seats.</div>
                      ) : (
                        availableSeats.map(seat => (
                          <button
                            key={seat.id}
                            disabled={seat.isReserved}
                            className={`seat-btn ${bookingForm.seatNumber === seat.seatNumber ? 'selected' : ''}`}
                            onClick={() => setBookingForm(prev => ({ ...prev, seatNumber: seat.seatNumber }))}
                            title={`${seat.seatClass} - ${seat.seatType}`}
                          >
                            {seat.seatNumber}
                          </button>
                        ))
                      )}
                    </div>

                    <div className="seat-legend">
                      <div className="legend-item"><span className="legend-dot available"></span><span>Available</span></div>
                      <div className="legend-item"><span className="legend-dot selected"></span><span>Selected</span></div>
                      <div className="legend-item"><span className="legend-dot reserved"></span><span>Reserved</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Passengers */}
          {activeTab === 'passengers' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Form */}
                <div className="glass-card">
                  <h3 className="card-title">Register Passenger</h3>
                  <form onSubmit={handleRegisterPassenger} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input className="glass-input" value={passengerForm.name} onChange={e => setPassengerForm({...passengerForm, name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Passport Number</label>
                      <input className="glass-input" value={passengerForm.passportNumber} onChange={e => setPassengerForm({...passengerForm, passportNumber: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Age</label>
                      <input type="number" className="glass-input" value={passengerForm.age} onChange={e => setPassengerForm({...passengerForm, age: parseInt(e.target.value)})} required />
                    </div>
                    <div className="form-group">
                      <label>Passenger Type</label>
                      <select className="glass-select" value={passengerForm.passengerType} onChange={e => setPassengerForm({...passengerForm, passengerType: parseInt(e.target.value)})}>
                        <option value={0}>Male</option>
                        <option value={1}>Female</option>
                        <option value={2}>Baby</option>
                      </select>
                    </div>
                    <button type="submit" className="glass-button" style={{ marginTop: '1rem' }}>Register</button>
                  </form>
                </div>

                {/* List */}
                <div className="glass-card">
                  <h3 className="card-title">Registered Passengers</h3>
                  {passengers.length === 0 ? (
                    <div className="empty-state">No passengers registered.</div>
                  ) : (
                    <div className="table-container">
                      <table className="glass-table">
                        <thead>
                          <tr>
                            <th>Passenger ID / Name</th>
                            <th>Passport</th>
                            <th>Age</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {passengers.map(p => (
                            <tr key={p.id}>
                              <td>
                                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{p.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#475569' }}>{p.id}</div>
                              </td>
                              <td>{p.passportNumber}</td>
                              <td>{p.age}</td>
                              <td><span className="badge blue">{p.passengerType}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Bookings */}
          {activeTab === 'bookings' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Form */}
                <div className="glass-card">
                  <h3 className="card-title">Create Booking</h3>
                  <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Select Passenger</label>
                      <select className="glass-select" value={bookingForm.passengerId} onChange={e => setBookingForm({...bookingForm, passengerId: e.target.value})} required>
                        <option value="">-- Choose Passenger --</option>
                        {passengers.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.passportNumber})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Select Flight</label>
                      <select className="glass-select" value={bookingForm.flightId} onChange={e => {
                        const flight = flights.find(f => f.id === e.target.value);
                        if(flight) selectFlightForBooking(flight);
                      }} required>
                        <option value="">-- Choose Flight --</option>
                        {flights.map(f => (
                          <option key={f.id} value={f.id}>{f.flightNumber} (${f.price})</option>
                        ))}
                      </select>
                    </div>
                    {selectedFlight && (
                      <div className="form-group">
                        <label>Select Seat (from Flights & Seats tab)</label>
                        <input className="glass-input" readOnly value={bookingForm.seatNumber} placeholder="Click seat map in flights tab" required />
                      </div>
                    )}
                    <div className="form-group">
                      <label>Description</label>
                      <input className="glass-input" value={bookingForm.description} onChange={e => setBookingForm({...bookingForm, description: e.target.value})} placeholder="e.g. Business travel" />
                    </div>
                    <button type="submit" className="glass-button" style={{ marginTop: '1rem' }} disabled={!bookingForm.seatNumber}>
                      Confirm Booking & Reserve
                    </button>
                  </form>
                </div>

                {/* List */}
                <div className="glass-card">
                  <h3 className="card-title">Confirmed Bookings</h3>
                  {bookings.length === 0 ? (
                    <div className="empty-state">No bookings found.</div>
                  ) : (
                    <div className="table-container">
                      <table className="glass-table">
                        <thead>
                          <tr>
                            <th>Booking ID</th>
                            <th>Passenger Name</th>
                            <th>Flight</th>
                            <th>Seat</th>
                            <th>Price</th>
                            <th>Flight Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map(b => (
                            <tr key={b.id}>
                              <td>
                                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                                  {b.id}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#475569' }}>{b.description}</div>
                              </td>
                              <td style={{ color: '#e2e8f0', fontWeight: 500 }}>{b.passengerName}</td>
                              <td><span className="badge purple">{b.flightNumber}</span></td>
                              <td><span className="badge blue">{b.seatNumber}</span></td>
                              <td>${b.price}</td>
                              <td>{new Date(b.flightDate).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Notifications */}
          {activeTab === 'notifications' && (
            <div className="glass-card">
              <h3 className="card-title">
                <span className="badge green" style={{ marginRight: '0.5rem' }}>Microservice</span>
                Notification Dispatch History
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Subscribed to RabbitMQ Integration Event: <code>buildingblocks.contracts.booking.BookingCreated</code>. Log of passenger email/SMS dispatches.
              </p>

              <div className="logs-console">
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ margin: 'auto' }}>No notifications dispatched yet. Try creating a booking!</div>
                ) : (
                  [...notifications].reverse().map(n => (
                    <div key={n.id} className="log-entry">
                      <div className="log-entry-meta">
                        <span className="log-entry-time">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        <span className="log-entry-type" style={{ color: '#34d399' }}>SENT</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', margin: '0.25rem 0' }}>
                        ID: {n.id} | Booking: {n.bookingId} | Passenger: {n.passengerName} | Flight: {n.flightNumber} (Seat {n.seatNumber})
                      </div>
                      <div className="log-entry-message">
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: Audit */}
          {activeTab === 'audit' && (
            <div className="glass-card">
              <h3 className="card-title">
                <span className="badge purple" style={{ marginRight: '0.5rem' }}>Microservice</span>
                Decoupled Integration Audit Trail
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Audit microservice logging all domain events published to RabbitMQ topic exchange <code>booking-exchange</code>.
              </p>

              <div className="logs-console" style={{ background: '#05070c' }}>
                {auditLogs.length === 0 ? (
                  <div className="empty-state" style={{ margin: 'auto' }}>No audit logs recorded yet. Perform actions to trigger integration events.</div>
                ) : (
                  [...auditLogs].reverse().map(log => (
                    <div key={log.id} className="log-entry">
                      <div className="log-entry-meta">
                        <span className="log-entry-time">{new Date(log.occurredOn).toLocaleString()}</span>
                        <span className="log-entry-type" style={{ color: '#c084fc', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                          {log.eventType.split('.').pop()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#334155', margin: '0.15rem 0' }}>
                        LOG ID: {log.id} | EVENT ID: {log.eventId}
                      </div>
                      <div className="log-entry-payload" style={{ color: '#a7f3d0', fontSize: '0.8rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace' }}>
                        {log.payload}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
