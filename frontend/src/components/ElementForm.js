import React, { useState } from 'react';
import './ElementForm.css';

function ElementForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Router',
    description: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Element name is required');
      return;
    }

    onSubmit(formData);
    setFormData({
      name: '',
      type: 'Router',
      description: ''
    });
  };

  return (
    <form className="element-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Element Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Router-1"
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="type">Type</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
        >
          <option>Router</option>
          <option>Switch</option>
          <option>Firewall</option>
          <option>Gateway</option>
          <option>Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional description"
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-success">
          Create Element
        </button>
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ElementForm;
