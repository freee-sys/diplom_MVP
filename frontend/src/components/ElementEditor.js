import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ElementEditor.css';

function ElementEditor({ element, onSave, onCancel, isCreating = false }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Router',
    description: ''
  });
  const [interfaces, setInterfaces] = useState([]);
  const [showInterfaceForm, setShowInterfaceForm] = useState(false);
  const [editingInterfaceId, setEditingInterfaceId] = useState(null);
  const [interfaceForm, setInterfaceForm] = useState({
    name: '',
    type: 'Ethernet',
    ip_address: '',
    mac_address: '',
    status: 'up',
    bandwidth: '',
    level: 'L2',
    reverse_interface_id: '',
    reverse_element_id: ''
  });
  const [availableInterfaces, setAvailableInterfaces] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  // Initialize form with element data if editing
  useEffect(() => {
    if (element && !isCreating) {
      setFormData({
        name: element.name,
        type: element.type,
        description: element.description
      });
      setInterfaces(element.interfaces || []);
    }
  }, [element, isCreating]);

  // Fetch available interfaces when interface form is shown
  useEffect(() => {
    if (showInterfaceForm && (element || isCreating)) {
      fetchAvailableInterfaces();
    }
  }, [showInterfaceForm, element]);

  const fetchAvailableInterfaces = async () => {
    try {
      const elementId = element?.id || 'new'; // Use 'new' for creating element
      const response = await axios.get(`${API_URL}/available-interfaces`, {
        params: {
          element_id: elementId,
          interface_id: editingInterfaceId || ''
        }
      });
      setAvailableInterfaces(response.data);
    } catch (err) {
      console.error('Failed to fetch available interfaces:', err);
    }
  };

  // IP Address mask function (XXX.XXX.XXX.XXX)
  const maskIPAddress = (value) => {
    // Remove non-digits and dots
    let cleaned = value.replace(/[^\d.]/g, '');
    
    // Split by dot
    let parts = cleaned.split('.');
    
    // Limit to 4 parts
    if (parts.length > 4) {
      parts = parts.slice(0, 4);
    }
    
    // Validate each part (0-255)
    parts = parts.map(part => {
      if (part === '') return part;
      const num = parseInt(part, 10);
      if (isNaN(num)) return '';
      if (num > 255) return '255';
      return num.toString();
    });
    
    return parts.join('.');
  };

  // MAC Address mask function (XX:XX:XX:XX:XX:XX)
  const maskMACAddress = (value) => {
    // Remove non-hex and colons
    let cleaned = value.replace(/[^\da-fA-F:]/g, '').toUpperCase();
    
    // Remove existing colons
    let hex = cleaned.replace(/:/g, '');
    
    // Limit to 12 hex characters
    if (hex.length > 12) {
      hex = hex.slice(0, 12);
    }
    
    // Add colons every 2 characters
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      if (result.length > 0) result += ':';
      result += hex.substring(i, i + 2);
    }
    
    return result;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleInterfaceFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Apply masks for IP and MAC addresses
    if (name === 'ip_address') {
      processedValue = maskIPAddress(value);
    } else if (name === 'mac_address') {
      processedValue = maskMACAddress(value);
    }

    setInterfaceForm(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleReverseInterfaceChange = (e) => {
    const interfaceId = e.target.value;
    
    if (!interfaceId) {
      setInterfaceForm(prev => ({
        ...prev,
        reverse_interface_id: '',
        reverse_element_id: ''
      }));
      return;
    }

    // Find the selected interface to get its element ID
    const selectedInterface = availableInterfaces.find(iface => iface.interface_id === interfaceId);
    if (selectedInterface) {
      setInterfaceForm(prev => ({
        ...prev,
        reverse_interface_id: interfaceId,
        reverse_element_id: selectedInterface.element_id
      }));
    }
  };

  const resetInterfaceForm = () => {
    setInterfaceForm({
      name: '',
      type: 'Ethernet',
      ip_address: '',
      mac_address: '',
      status: 'up',
      bandwidth: '',
      level: 'L2',
      reverse_interface_id: '',
      reverse_element_id: ''
    });
    setEditingInterfaceId(null);
  };

  const handleAddOrUpdateInterface = () => {
    if (!interfaceForm.name.trim()) {
      setError('Interface name is required');
      return;
    }

    if (editingInterfaceId) {
      // Update existing interface
      const updatedInterfaces = interfaces.map(iface =>
        iface.id === editingInterfaceId
          ? { ...iface, ...interfaceForm }
          : iface
      );
      setInterfaces(updatedInterfaces);
    } else {
      // Add new interface
      const newInterface = {
        id: `interface_${Date.now()}`, // Temporary ID, will be replaced by backend
        ...interfaceForm,
        created_at: new Date().toISOString()
      };
      setInterfaces([...interfaces, newInterface]);
    }

    setShowInterfaceForm(false);
    resetInterfaceForm();
    setError('');
  };

  const handleEditInterface = (iface) => {
    setInterfaceForm(iface);
    setEditingInterfaceId(iface.id);
    setShowInterfaceForm(true);
  };

  const handleDeleteInterface = (interfaceId) => {
    if (window.confirm('Are you sure you want to delete this interface?')) {
      setInterfaces(interfaces.filter(iface => iface.id !== interfaceId));
    }
  };

  const handleSaveElement = async () => {
    if (!formData.name.trim()) {
      setError('Element name is required');
      return;
    }

    setLoading(true);
    try {
      let savedElement;

      if (isCreating) {
        // Create new element
        const response = await axios.post(`${API_URL}/elements`, formData);
        savedElement = response.data;

        // Add interfaces for the new element
        for (const iface of interfaces) {
          await axios.post(`${API_URL}/elements/${savedElement.id}/interfaces`, {
            name: iface.name,
            type: iface.type,
            ip_address: iface.ip_address,
            mac_address: iface.mac_address,
            status: iface.status,
            bandwidth: iface.bandwidth,
            level: iface.level,
            reverse_interface_id: iface.reverse_interface_id,
            reverse_element_id: iface.reverse_element_id
          });
        }
      } else {
        // Update existing element
        const response = await axios.put(`${API_URL}/elements/${element.id}`, formData);
        savedElement = response.data;

        // Update/add interfaces
        for (const iface of interfaces) {
          if (iface.id.startsWith('interface_')) {
            // New interface (created in UI)
            await axios.post(`${API_URL}/elements/${element.id}/interfaces`, {
              name: iface.name,
              type: iface.type,
              ip_address: iface.ip_address,
              mac_address: iface.mac_address,
              status: iface.status,
              bandwidth: iface.bandwidth,
              level: iface.level,
              reverse_interface_id: iface.reverse_interface_id,
              reverse_element_id: iface.reverse_element_id
            });
          } else {
            // Existing interface (update)
            await axios.put(`${API_URL}/elements/${element.id}/interfaces/${iface.id}`, {
              name: iface.name,
              type: iface.type,
              ip_address: iface.ip_address,
              mac_address: iface.mac_address,
              status: iface.status,
              bandwidth: iface.bandwidth,
              level: iface.level,
              reverse_interface_id: iface.reverse_interface_id,
              reverse_element_id: iface.reverse_element_id
            });
          }
        }

        // Delete removed interfaces
        if (element.interfaces) {
          const deletedInterfaces = element.interfaces.filter(
            oldIface => !interfaces.find(newIface => newIface.id === oldIface.id)
          );
          for (const iface of deletedInterfaces) {
            await axios.delete(`${API_URL}/elements/${element.id}/interfaces/${iface.id}`);
          }
        }
      }

      // Fetch updated element with all data
      const finalResponse = await axios.get(`${API_URL}/elements/${isCreating ? savedElement.id : element.id}`);
      onSave(finalResponse.data);
    } catch (err) {
      setError('Failed to save element: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionInfo = (iface) => {
    if (!iface.reverse_element_id || !iface.reverse_interface_id) {
      return <span style={{ color: '#95a5a6' }}>Not connected</span>;
    }

    const connectionClass = iface.level === 'L2' ? 'connection-l2' :
      iface.level === 'L3' ? 'connection-l3' : 'connection-l2-l3';

    return (
      <span className={connectionClass}>
        {iface.level} Connected
      </span>
    );
  };

  return (
    <div className="element-editor">
      <div className="editor-overlay" onClick={onCancel}></div>

      <div className="editor-modal">
        <div className="editor-header">
          <h2>{isCreating ? '➕ Create New Element' : '✏️ Edit Element'}</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="editor-content">
          {/* Element Information Section */}
          <div className="section">
            <h3>Element Information</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g., Router_1, Switch_Main"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                >
                  <option value="Router">Router</option>
                  <option value="Switch">Switch</option>
                  <option value="Firewall">Firewall</option>
                  <option value="Gateway">Gateway</option>
                  <option value="Server">Server</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="e.g., Main core router"
                />
              </div>
            </div>
          </div>

          {/* Interfaces Section */}
          <div className="section">
            <div className="section-header">
              <h3>Interfaces ({interfaces.length})</h3>
              <button
                className="btn btn-primary btn-small"
                onClick={() => {
                  setShowInterfaceForm(!showInterfaceForm);
                  if (showInterfaceForm) resetInterfaceForm();
                }}
              >
                {showInterfaceForm ? '✕ Cancel' : '+ Add Interface'}
              </button>
            </div>

            {showInterfaceForm && (
              <div className="interface-form">
                <h4>{editingInterfaceId ? '✏️ Edit Interface' : '➕ New Interface'}</h4>

                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={interfaceForm.name}
                    onChange={handleInterfaceFormChange}
                    placeholder="e.g., eth0, port1"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      name="type"
                      value={interfaceForm.type}
                      onChange={handleInterfaceFormChange}
                    >
                      <option value="Ethernet">Ethernet</option>
                      <option value="Gigabit Ethernet">Gigabit Ethernet</option>
                      <option value="Serial">Serial</option>
                      <option value="Loopback">Loopback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={interfaceForm.status}
                      onChange={handleInterfaceFormChange}
                    >
                      <option value="up">Up</option>
                      <option value="down">Down</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>IP Address</label>
                    <input
                      type="text"
                      name="ip_address"
                      value={interfaceForm.ip_address}
                      onChange={handleInterfaceFormChange}
                      placeholder="e.g., 192.168.1.1"
                    />
                  </div>

                  <div className="form-group">
                    <label>MAC Address</label>
                    <input
                      type="text"
                      name="mac_address"
                      value={interfaceForm.mac_address}
                      onChange={handleInterfaceFormChange}
                      placeholder="e.g., 00:11:22:33:44:55"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Bandwidth</label>
                    <input
                      type="text"
                      name="bandwidth"
                      value={interfaceForm.bandwidth}
                      onChange={handleInterfaceFormChange}
                      placeholder="e.g., 1000 Mbps"
                    />
                  </div>

                  <div className="form-group">
                    <label>Connection Level 🔗</label>
                    <select
                      name="level"
                      value={interfaceForm.level}
                      onChange={handleInterfaceFormChange}
                    >
                      <option value="L2">L2 (Data Link)</option>
                      <option value="L3">L3 (Network)</option>
                      <option value="L2/L3">L2/L3 (Both)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Connect to Interface</label>
                  <select
                    name="reverse_interface_id"
                    value={interfaceForm.reverse_interface_id}
                    onChange={handleReverseInterfaceChange}
                  >
                    <option value="">-- No Connection --</option>
                    {availableInterfaces.map(iface => (
                      <option key={iface.interface_id} value={iface.interface_id}>
                        {iface.element_name} → {iface.interface_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-success"
                    onClick={handleAddOrUpdateInterface}
                  >
                    {editingInterfaceId ? 'Update Interface' : 'Add Interface'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowInterfaceForm(false);
                      resetInterfaceForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {interfaces.length === 0 ? (
              <div className="empty-interfaces">
                <p>No interfaces yet. Add one to get started.</p>
              </div>
            ) : (
              <table className="interfaces-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>IP Address</th>
                    <th>MAC Address</th>
                    <th>Status</th>
                    <th>Bandwidth</th>
                    <th>Connection</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interfaces.map(iface => (
                    <tr key={iface.id}>
                      <td className="name">{iface.name}</td>
                      <td>{iface.type}</td>
                      <td>{iface.ip_address || '-'}</td>
                      <td className="mac">{iface.mac_address || '-'}</td>
                      <td>
                        <span className={`status status-${iface.status}`}>
                          {iface.status}
                        </span>
                      </td>
                      <td>{iface.bandwidth || '-'}</td>
                      <td className="connection">
                        {getConnectionInfo(iface)}
                      </td>
                      <td className="actions">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditInterface(iface)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteInterface(iface.id)}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="editor-footer">
          <button
            className="btn btn-success btn-large"
            onClick={handleSaveElement}
            disabled={loading}
          >
            {loading ? '⏳ Saving...' : '✅ Save Element'}
          </button>
          <button
            className="btn btn-secondary btn-large"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ElementEditor;
