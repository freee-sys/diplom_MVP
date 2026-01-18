import React from 'react';
import InterfaceTable from './InterfaceTable';
import './ElementDetails.css';

function ElementDetails({ 
  element, 
  onUpdate, 
  onDelete,
  onEdit
}) {

  return (
    <div className="element-details">
      <div className="details-header">
        <h2>Element Details</h2>
        <div className="header-actions">
          <button 
            className="btn btn-primary btn-small"
            onClick={() => onEdit(element)}
          >
            ✎ Edit Element & Interfaces
          </button>
          <button 
            className="btn btn-danger btn-small"
            onClick={() => {
              if (window.confirm('Delete this element and all its interfaces?')) {
                onDelete(element.id);
              }
            }}
          >
            ✕ Delete
          </button>
        </div>
      </div>

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

      <InterfaceTable element={element} />
    </div>
  );
}

export default ElementDetails;
