import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InterfaceTable.css';

function InterfaceTable({ element }) {
  const [interfaces, setInterfaces] = useState(element.interfaces || []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [availableInterfaces, setAvailableInterfaces] = useState([]);
  const [formData, setFormData] = useState({
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
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:5000/api';

  // Update interfaces when element changes
  useEffect(() => {
    setInterfaces(element.interfaces || []);
  }, [element.id, element.interfaces]);

  // Fetch available interfaces when form is shown
  useEffect(() => {
    if (showForm) {
      fetchAvailableInterfaces();
    }
  }, [showForm]);

  const fetchAvailableInterfaces = async () => {
    try {
      const response = await axios.get(`${API_URL}/available-interfaces`, {
        params: {
          element_id: element.id,
          interface_id: editingId || ''
        }
      });
      setAvailableInterfaces(response.data);
    } catch (err) {
      console.error('Failed to fetch available interfaces:', err);
    }
  };

  const resetForm = () => {
    setFormData({
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
    setEditingId(null);
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Apply masks for IP and MAC addresses
    if (name === 'ip_address') {
      processedValue = maskIPAddress(value);
    } else if (name === 'mac_address') {
      processedValue = maskMACAddress(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    setError('');
  };

  const handleReverseInterfaceChange = (e) => {
    const selectedId = e.target.value;
    const selected = availableInterfaces.find(iface => iface.interface_id === selectedId);
    
    if (selected) {
      setFormData(prev => ({
        ...prev,
        reverse_interface_id: selectedId,
        reverse_element_id: selected.element_id
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        reverse_interface_id: '',
        reverse_element_id: ''
      }));
    }
  };

  const handleAddInterface = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Interface name is required');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/elements/${element.id}/interfaces`,
        formData
      );
      setInterfaces([...interfaces, response.data]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError('Failed to add interface: ' + err.message);
    }
  };

  const handleEditInterface = (iface) => {
    setEditingId(iface.id);
    setFormData({
      name: iface.name,
      type: iface.type,
      ip_address: iface.ip_address,
      mac_address: iface.mac_address,
      status: iface.status,
      bandwidth: iface.bandwidth,
      level: iface.level || 'L2',
      reverse_interface_id: iface.reverse_interface_id || '',
      reverse_element_id: iface.reverse_element_id || ''
    });
    setShowForm(true);
  };

  const handleUpdateInterface = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Interface name is required');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/elements/${element.id}/interfaces/${editingId}`,
        formData
      );
      setInterfaces(interfaces.map(i => i.id === editingId ? response.data : i));
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError('Failed to update interface: ' + err.message);
    }
  };

  const handleDeleteInterface = async (interfaceId) => {
    if (window.confirm('Delete this interface?')) {
      try {
        await axios.delete(
          `${API_URL}/elements/${element.id}/interfaces/${interfaceId}`
        );
        setInterfaces(interfaces.filter(i => i.id !== interfaceId));
      } catch (err) {
        setError('Failed to delete interface: ' + err.message);
      }
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

  return (
    <div className="interface-table">
      <div className="table-header">
        <h3>Interfaces ({interfaces.length})</h3>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="interface-form" onSubmit={editingId ? handleUpdateInterface : handleAddInterface}>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g., eth0"
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
              >
                <option>Ethernet</option>
                <option>Gigabit Ethernet</option>
                <option>Serial</option>
                <option>Loopback</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
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
                value={formData.ip_address}
                onChange={handleFormChange}
                placeholder="e.g., 192.168.1.1"
              />
            </div>

            <div className="form-group">
              <label>MAC Address</label>
              <input
                type="text"
                name="mac_address"
                value={formData.mac_address}
                onChange={handleFormChange}
                placeholder="e.g., 00:1A:2B:3C:4D:5E"
              />
            </div>

            <div className="form-group">
              <label>Bandwidth</label>
              <input
                type="text"
                name="bandwidth"
                value={formData.bandwidth}
                onChange={handleFormChange}
                placeholder="e.g., 1Gbps"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Connection Level 🔗</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleFormChange}
              >
                <option value="L2">L2 (Data Link)</option>
                <option value="L3">L3 (Network)</option>
                <option value="L2/L3">L2/L3 (Both)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Connect to Interface</label>
              <select
                name="reverse_interface_id"
                value={formData.reverse_interface_id}
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
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              {editingId ? 'Update' : 'Add'} Interface
            </button>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {interfaces.length === 0 ? (
        <div className="empty-table">
          <p>No interfaces yet. Add one to get started.</p>
        </div>
      ) : (
        <table className="table">
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
  );
}

export default InterfaceTable;
