import React, { useState } from 'react';
import InterfaceTable from './InterfaceTable';
import './ElementDetails.css';

function ElementDetails({ 
  element, 
  onUpdate, 
  onDelete,
  isEditing,
  onEditToggle,
  onEditCancel
}) {
  const [editData, setEditData] = useState(element);
  const [editError, setEditError] = useState('');

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
    setEditError('');
  };

  const handleSaveEdit = () => {
    if (!editData.name.trim()) {
      setEditError('Element name is required');
      return;
    }
    onUpdate(element.id, {
      name: editData.name,
      type: editData.type,
      description: editData.description
    });
  };

  const handleCancelEdit = () => {
    setEditData(element);
    setEditError('');
    onEditCancel();
  };

  return (
    <div className="element-details">
      <div className="details-header">
        <h2>Element Details</h2>
        <button 
          className="btn btn-primary btn-small"
          onClick={isEditing ? handleCancelEdit : onEditToggle}
        >
          {isEditing ? '✕ Cancel' : '✎ Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="edit-form">
          {editError && <div className="form-error">{editError}</div>}
          
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              name="type"
              value={editData.type}
              onChange={handleEditChange}
            >
              <option>Router</option>
              <option>Switch</option>
              <option>Firewall</option>
              <option>Gateway</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={editData.description}
              onChange={handleEditChange}
              rows="3"
            />
          </div>

          <div className="edit-actions">
            <button 
              className="btn btn-success"
              onClick={handleSaveEdit}
            >
              Save Changes
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm('Delete this element and all its interfaces?')) {
                  onDelete(element.id);
                }
              }}
            >
              Delete Element
            </button>
          </div>
        </div>
      ) : (
        <div className="details-view">
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{element.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Type:</span>
            <span className="detail-value detail-type">{element.type}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Description:</span>
            <span className="detail-value">{element.description || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Created:</span>
            <span className="detail-value">{new Date(element.created_at).toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Updated:</span>
            <span className="detail-value">{new Date(element.updated_at).toLocaleString()}</span>
          </div>
        </div>
      )}

      <InterfaceTable element={element} />
    </div>
  );
}

export default ElementDetails;
