import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './App.css';
import ElementList from './components/ElementList';
import ElementForm from './components/ElementForm';
import ElementDetails from './components/ElementDetails';
import Topology from './components/Topology';
import AccessControl from './components/AccessControl';

function App() {
  const API_URL = 'http://localhost:5000/api';

  const [token, setToken] = useState(localStorage.getItem('access_token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin');

  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [links, setLinks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingElement, setEditingElement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('elements');

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [roles, setRoles] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [users, setUsers] = useState([]);
  const [accessLoading, setAccessLoading] = useState(false);

  const hasPermission = (code, list = permissions) => {
    const perms = list || [];
    return perms.includes('*') || perms.includes(code);
  };

  const canReadElements = useMemo(() => hasPermission('elements.read'), [permissions]);
  const canWriteElements = useMemo(() => hasPermission('elements.write'), [permissions]);
  const canReadLinks = useMemo(() => hasPermission('links.read'), [permissions]);
  const canWriteLinks = useMemo(() => hasPermission('links.write'), [permissions]);
  const canReadTopology = useMemo(() => hasPermission('topology.read'), [permissions]);
  const canReadAudit = useMemo(() => hasPermission('audit.read'), [permissions]);
  const canReadRoles = useMemo(() => hasPermission('roles.read'), [permissions]);
  const canWriteRoles = useMemo(() => hasPermission('roles.write'), [permissions]);
  const canReadUsers = useMemo(() => hasPermission('users.read'), [permissions]);
  const canWriteUsers = useMemo(() => hasPermission('users.write'), [permissions]);
  const canViewTopology = canReadTopology && canReadElements && canReadLinks;

  const authConfig = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  useEffect(() => {
    if (token) {
      bootstrapAuthenticated();
    }
  }, [token]);

  const bootstrapAuthenticated = async () => {
    try {
      const me = await axios.get(`${API_URL}/auth/me`, authConfig);
      setCurrentUser(me.data.user);
      const perms = me.data.permissions || [];
      setPermissions(perms);

      if (hasPermission('elements.read', perms)) {
        await fetchElements();
      }
      if (hasPermission('links.read', perms)) {
        await fetchLinks();
      }
      if (hasPermission('audit.read', perms)) {
        await fetchAuditLogs();
      }
    } catch (err) {
      localStorage.removeItem('access_token');
      setToken('');
      setCurrentUser(null);
      setPermissions([]);
      setError('Session expired. Please login again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: loginUsername,
        password: loginPassword
      });
      localStorage.setItem('access_token', response.data.access_token);
      setToken(response.data.access_token);
      setCurrentUser(response.data.user);
      setPermissions(response.data.permissions || []);
      setActiveTab('elements');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken('');
    setCurrentUser(null);
    setPermissions([]);
    setElements([]);
    setLinks([]);
    setAuditLogs([]);
    setSelectedElement(null);
    setSelectedLog(null);
    setShowForm(false);
    setEditingElement(null);
  };

  const fetchLinks = async () => {
    try {
      const resp = await axios.get(`${API_URL}/links`, authConfig);
      setLinks(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch links');
    }
  };

  const fetchElements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/elements`, authConfig);
      const nextElements = response.data || [];
      setElements(nextElements);
      if (selectedElement) {
        const updatedSelected = nextElements.find(el => el.id === selectedElement.id);
        setSelectedElement(updatedSelected || null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch elements');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    const response = await axios.get(`${API_URL}/permissions`, authConfig);
    setPermissionsList(response.data || []);
  };

  const fetchRoles = async () => {
    const response = await axios.get(`${API_URL}/roles`, authConfig);
    setRoles(response.data || []);
  };

  const fetchUsers = async () => {
    const response = await axios.get(`${API_URL}/users`, authConfig);
    setUsers(response.data || []);
  };

  const loadAccessData = async () => {
    setAccessLoading(true);
    try {
      if (canReadRoles) {
        await Promise.all([fetchPermissions(), fetchRoles()]);
      }
      if (canReadUsers) {
        await fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load access data');
    } finally {
      setAccessLoading(false);
    }
  };

  const handleCreateRole = async (payload) => {
    try {
      await axios.post(`${API_URL}/roles`, payload, authConfig);
      await fetchRoles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create role');
    }
  };

  const handleUpdateRole = async (roleId, payload) => {
    try {
      await axios.put(`${API_URL}/roles/${roleId}`, payload, authConfig);
      await fetchRoles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await axios.delete(`${API_URL}/roles/${roleId}`, authConfig);
      await fetchRoles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete role');
    }
  };

  const handleCreateUser = async (payload) => {
    try {
      await axios.post(`${API_URL}/users`, payload, authConfig);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (userId, payload) => {
    try {
      await axios.put(`${API_URL}/users/${userId}`, payload, authConfig);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${API_URL}/users/${userId}`, authConfig);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const fetchAuditLogs = async () => {
    if (!canReadAudit) return;

    setAuditLoading(true);
    try {
      const response = await axios.get(`${API_URL}/audit-logs?limit=200`, authConfig);
      setAuditLogs(response.data.items || []);
      if (!selectedLog && response.data.items?.length > 0) {
        setSelectedLog(response.data.items[0]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleCreateElement = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/elements`, data, authConfig);
      setElements([...elements, response.data]);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create element');
    }
  };

  const handleUpdateElement = async (elementId, data) => {
    try {
      const response = await axios.put(`${API_URL}/elements/${elementId}`, data, authConfig);
      setElements(elements.map(el => el.id === elementId ? response.data : el));
      if (selectedElement?.id === elementId) {
        setSelectedElement(response.data);
      }
      setEditingElement(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update element');
    }
  };

  const handleDeleteElement = async (elementId) => {
    if (window.confirm('Are you sure you want to delete this element?')) {
      try {
        await axios.delete(`${API_URL}/elements/${elementId}`, authConfig);
        setElements(elements.filter(el => el.id !== elementId));
        setLinks(links.filter(l => l.element_a_id !== elementId && l.element_b_id !== elementId));
        if (selectedElement?.id === elementId) {
          setSelectedElement(null);
        }
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete element');
      }
    }
  };

  const handleCreateLink = async (data) => {
    try {
      const resp = await axios.post(`${API_URL}/links`, data, authConfig);
      setLinks([...links, resp.data]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create link');
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await axios.delete(`${API_URL}/links/${linkId}`, authConfig);
      setLinks(links.filter(l => l.id !== linkId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete link');
    }
  };

  const handleSelectElement = async (element) => {
    setSelectedElement(element);
    setEditingElement(null);
  };

  const handleEditElementFromTopology = (element) => {
    setSelectedElement(element);
    if (canWriteElements) {
      setEditingElement(element);
    } else {
      setEditingElement(null);
    }
    setActiveTab('elements');
  };

  if (!token) {
    return (
      <div className="app auth-screen">
        <div className="login-card">
          <h1>Virtual Network Element Manager</h1>
          <p>Authentication is required</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              placeholder="Username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Virtual Network Element Manager</h1>
        <p>
          User: <strong>{currentUser?.username || '-'}</strong>
          <button className="btn btn-secondary btn-small logout-btn" onClick={handleLogout}>Logout</button>
        </p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="app-tabs">
        {canReadElements && (
          <button
            className={`tab-button ${activeTab === 'elements' ? 'active' : ''}`}
            onClick={() => setActiveTab('elements')}
          >
            Elements
          </button>
        )}
        {canViewTopology && (
          <button
            className={`tab-button ${activeTab === 'topology' ? 'active' : ''}`}
            onClick={() => setActiveTab('topology')}
          >
            Topology
          </button>
        )}
        {canReadAudit && (
          <button
            className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('logs');
              fetchAuditLogs();
            }}
          >
            Audit Logs
          </button>
        )}
        {(canReadRoles || canReadUsers) && (
          <button
            className={`tab-button ${activeTab === 'access' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('access');
              loadAccessData();
            }}
          >
            Access
          </button>
        )}
      </div>

      <div className="app-container">
        {activeTab === 'elements' && canReadElements && (
          <>
            <div className="left-panel">
              <div className="panel-header">
                <h2>Network Elements</h2>
                {canWriteElements && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                  >
                    {showForm ? 'Cancel' : '+ New Element'}
                  </button>
                )}
              </div>

              {showForm && canWriteElements && (
                <ElementForm
                  onSubmit={handleCreateElement}
                  onCancel={() => setShowForm(false)}
                />
              )}

              {loading ? (
                <div className="loading">Loading elements...</div>
              ) : (
                <ElementList
                  elements={elements}
                  selectedElement={selectedElement}
                  onSelect={handleSelectElement}
                  onDelete={handleDeleteElement}
                  canWrite={canWriteElements}
                />
              )}
            </div>

            <div className="right-panel">
              {selectedElement ? (
                <ElementDetails
                  element={selectedElement}
                  onUpdate={handleUpdateElement}
                  onDelete={handleDeleteElement}
                  elements={elements}
                  links={links}
                  onCreateLink={handleCreateLink}
                  onDeleteLink={handleDeleteLink}
                  refreshElements={fetchElements}
                  authConfig={authConfig}
                  canWriteElements={canWriteElements}
                  canReadLinks={canReadLinks}
                  canWriteLinks={canWriteLinks}
                  isEditing={editingElement?.id === selectedElement.id}
                  onEditToggle={() => setEditingElement(selectedElement)}
                  onEditCancel={() => setEditingElement(null)}
                />
              ) : (
                <div className="no-selection">
                  <p>Select a network element to view and manage its interfaces</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'topology' && canViewTopology && (
          <div className="topology-wrapper">
            <Topology
              elements={elements}
              onEdit={handleEditElementFromTopology}
              onDelete={handleDeleteElement}
              links={links}
              selectedElement={selectedElement}
              canEdit={canWriteElements}
            />
          </div>
        )}

        {activeTab === 'logs' && canReadAudit && (
          <div className="logs-layout">
            <div className="logs-list">
              <div className="panel-header">
                <h2>Audit Events</h2>
                <button className="btn btn-primary btn-small" onClick={fetchAuditLogs}>Refresh</button>
              </div>
              {auditLoading ? (
                <div className="loading">Loading logs...</div>
              ) : (
                <div className="log-items">
                  {auditLogs.map((log) => (
                    <button
                      key={log.id}
                      className={`log-item ${selectedLog?.id === log.id ? 'selected' : ''}`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div><strong>{log.method}</strong> {log.path}</div>
                      <div>{log.username || 'anonymous'} | {log.status_code}</div>
                      <div>{new Date(log.created_at).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="logs-details">
              {selectedLog ? (
                <>
                  <h2>Event #{selectedLog.id}</h2>
                  <p><strong>User:</strong> {selectedLog.username || 'anonymous'}</p>
                  <p><strong>IP:</strong> {selectedLog.ip_address || '-'}</p>
                  <p><strong>Endpoint:</strong> {selectedLog.method} {selectedLog.path}</p>
                  <p><strong>Status:</strong> {selectedLog.status_code}</p>
                  <p><strong>Time:</strong> {new Date(selectedLog.created_at).toLocaleString()}</p>
                  <h3>Request Body</h3>
                  <pre className="log-body">{selectedLog.request_body || '-'}</pre>
                </>
              ) : (
                <div className="no-selection">
                  <p>Select a log entry</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'access' && (canReadRoles || canReadUsers) && (
          <div className="access-wrapper">
            <AccessControl
              roles={roles}
              users={users}
              permissions={permissionsList}
              loading={accessLoading}
              canReadRoles={canReadRoles}
              canWriteRoles={canWriteRoles}
              canReadUsers={canReadUsers}
              canWriteUsers={canWriteUsers}
              onCreateRole={handleCreateRole}
              onUpdateRole={handleUpdateRole}
              onDeleteRole={handleDeleteRole}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
