import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import ElementList from './components/ElementList';
import ElementForm from './components/ElementForm';
import ElementDetails from './components/ElementDetails';
import Topology from './components/Topology';

function App() {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingElement, setEditingElement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('elements');

  const API_URL = 'http://localhost:5000/api';

  // Fetch elements on mount
  useEffect(() => {
    fetchElements();
  }, []);

  const fetchElements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/elements`);
      setElements(response.data);
    } catch (err) {
      setError('Failed to fetch elements: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElement = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/elements`, data);
      setElements([...elements, response.data]);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create element: ' + err.message);
      console.error(err);
    }
  };

  const handleUpdateElement = async (elementId, data) => {
    try {
      const response = await axios.put(`${API_URL}/elements/${elementId}`, data);
      setElements(elements.map(el => el.id === elementId ? response.data : el));
      if (selectedElement?.id === elementId) {
        setSelectedElement(response.data);
      }
      setEditingElement(null);
      setError(null);
    } catch (err) {
      setError('Failed to update element: ' + err.message);
      console.error(err);
    }
  };

  const handleDeleteElement = async (elementId) => {
    if (window.confirm('Are you sure you want to delete this element?')) {
      try {
        await axios.delete(`${API_URL}/elements/${elementId}`);
        setElements(elements.filter(el => el.id !== elementId));
        if (selectedElement?.id === elementId) {
          setSelectedElement(null);
        }
        setError(null);
      } catch (err) {
        setError('Failed to delete element: ' + err.message);
        console.error(err);
      }
    }
  };

  const handleSelectElement = async (element) => {
    setSelectedElement(element);
    setEditingElement(null);
  };

  const handleEditElementFromTopology = (element) => {
    setSelectedElement(element);
    setEditingElement(element);
    setActiveTab('elements');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📡 Virtual Network Element Manager</h1>
        <p>Manage virtual network elements and their interfaces</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Навигационные вкладки */}
      <div className="app-tabs">
        <button 
          className={`tab-button ${activeTab === 'elements' ? 'active' : ''}`}
          onClick={() => setActiveTab('elements')}
        >
          📋 Elements
        </button>
        <button 
          className={`tab-button ${activeTab === 'topology' ? 'active' : ''}`}
          onClick={() => setActiveTab('topology')}
        >
          📡 Topology
        </button>
      </div>

      <div className="app-container">
        {/* Tab: Elements Management */}
        {activeTab === 'elements' && (
          <>
            <div className="left-panel">
              <div className="panel-header">
                <h2>Network Elements</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? '✕ Cancel' : '+ New Element'}
                </button>
              </div>

              {showForm && (
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
                />
              )}
            </div>

            <div className="right-panel">
              {selectedElement ? (
                <ElementDetails 
                  element={selectedElement}
                  onUpdate={handleUpdateElement}
                  onDelete={handleDeleteElement}
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

        {/* Tab: Topology View */}
        {activeTab === 'topology' && (
          <div className="topology-wrapper">
            <Topology 
              elements={elements}
              onEdit={handleEditElementFromTopology}
              onDelete={handleDeleteElement}
              selectedElement={selectedElement}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
