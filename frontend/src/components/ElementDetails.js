import React, { useState } from 'react';
import InterfaceTable from './InterfaceTable';
import './ElementDetails.css';

function ElementDetails({
  element,
  onUpdate,
  onDelete,
  isEditing,
  onEditToggle,
  onEditCancel,
  elements = [],
  links = [],
  onCreateLink,
  onDeleteLink,
  refreshElements,
  authConfig,
  canWriteElements = true,
  canReadLinks = true,
  canWriteLinks = true
}) {
  const [editData, setEditData] = useState(element);
  const [editError, setEditError] = useState('');
  const [linkForm, setLinkForm] = useState({ localInterfaceId: '', neighborElementId: '', neighborInterfaceId: '', level: 'L2' });
  const [linkError, setLinkError] = useState('');
  const [openInterfaceForm, setOpenInterfaceForm] = useState(false);

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
        {canWriteElements && (
          <button
            className="btn btn-primary btn-small"
            onClick={() => setOpenInterfaceForm(true)}
          >
            Add Interface
          </button>
        )}
        {canWriteElements && (
          <button
            className="btn btn-secondary btn-small"
            onClick={isEditing ? handleCancelEdit : onEditToggle}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>

      {isEditing && canWriteElements ? (
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

      <InterfaceTable
        element={element}
        refreshElements={refreshElements}
        openAddInterface={openInterfaceForm}
        onCloseAddForm={() => setOpenInterfaceForm(false)}
        authConfig={authConfig}
        canWrite={canWriteElements}
      />

      {isEditing && canReadLinks && (
        <div className="links-management">
          <h3>Links</h3>
          {linkError && <div className="form-error">{linkError}</div>}

          <div className="form-group">
            <label>Local Interface</label>
            <select
              value={linkForm.localInterfaceId}
              onChange={(e) => setLinkForm(prev => ({ ...prev, localInterfaceId: e.target.value }))}
              disabled={!canWriteLinks}
            >
              <option value="">-- select --</option>
              {element.interfaces.map(iface => (
                <option key={iface.id} value={iface.id}>{iface.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Neighbor Element</label>
            <select
              value={linkForm.neighborElementId}
              onChange={(e) => {
                setLinkForm(prev => ({ ...prev, neighborElementId: e.target.value, neighborInterfaceId: '' }));
                setLinkError('');
              }}
              disabled={!canWriteLinks}
            >
              <option value="">-- select --</option>
              {elements.filter(el => el.id !== element.id).map(el => (
                <option key={el.id} value={el.id}>{el.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Neighbor Interface</label>
            <select
              value={linkForm.neighborInterfaceId}
              onChange={(e) => setLinkForm(prev => ({ ...prev, neighborInterfaceId: e.target.value }))}
              disabled={!canWriteLinks}
            >
              <option value="">-- select --</option>
              {(() => {
                const neighbor = elements.find(el => el.id === linkForm.neighborElementId);
                if (!neighbor) return null;
                return neighbor.interfaces.map(iface => (
                  <option key={iface.id} value={iface.id}>{iface.name}</option>
                ));
              })()}
            </select>
          </div>

          <div className="form-group">
            <label>Link Level</label>
            <select
              value={linkForm.level}
              onChange={(e) => setLinkForm(prev => ({ ...prev, level: e.target.value }))}
              disabled={!canWriteLinks}
            >
              <option value="L2">L2</option>
              <option value="L3">L3</option>
            </select>
          </div>

          {canWriteLinks && (
            <div className="edit-actions">
              <button
                className="btn btn-success"
                onClick={() => {
                  if (!linkForm.neighborElementId || !linkForm.neighborInterfaceId) {
                    setLinkError('Please choose neighbor element and interface');
                    return;
                  }
                  if (!linkForm.localInterfaceId) {
                    setLinkError('Please choose a local interface');
                    return;
                  }
                  const payload = {
                    element_a_id: element.id,
                    interface_a_id: linkForm.localInterfaceId,
                    element_b_id: linkForm.neighborElementId,
                    interface_b_id: linkForm.neighborInterfaceId,
                    level: linkForm.level
                  };
                  onCreateLink && onCreateLink(payload);
                  setLinkForm({ localInterfaceId: '', neighborElementId: '', neighborInterfaceId: '', level: 'L2' });
                }}
              >
                Add Link
              </button>
            </div>
          )}

          <div className="existing-links">
            <h4>Existing Links</h4>
            <ul>
              {links.filter(l => l.element_a_id === element.id || l.element_b_id === element.id).map(l => {
                const otherElementId = l.element_a_id === element.id ? l.element_b_id : l.element_a_id;
                const otherInterfaceId = l.element_a_id === element.id ? l.interface_b_id : l.interface_a_id;
                const otherEl = elements.find(el => el.id === otherElementId);
                const iface = otherEl?.interfaces.find(i => i.id === otherInterfaceId);
                return (
                  <li key={l.id}>
                    {otherEl ? `${otherEl.name}` : otherElementId} - {iface ? iface.name : otherInterfaceId} ({l.level})
                    {canWriteLinks && (
                      <button className="btn btn-danger btn-small" onClick={() => onDeleteLink && onDeleteLink(l.id)}>Delete</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ElementDetails;
