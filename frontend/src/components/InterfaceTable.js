import React, { useState } from 'react';
import axios from 'axios';
import './InterfaceTable.css';

function InterfaceTable({ element }) {
  const [interfaces, setInterfaces] = useState(element.interfaces || []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Ethernet',
    ip_address: '',
    mac_address: '',
    status: 'up',
    bandwidth: ''
  });
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:5000/api';

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Ethernet',
      ip_address: '',
      mac_address: '',
      status: 'up',
      bandwidth: ''
    });
    setEditingId(null);
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
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
      bandwidth: iface.bandwidth
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

  return (
    <div className="interface-table">
      <div className="table-header">
        <h3>Interfaces ({interfaces.length})</h3>
        <button 
          className="btn btn-primary btn-small"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add Interface'}
        </button>
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
