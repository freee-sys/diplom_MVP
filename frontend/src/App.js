import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import ElementList from './components/ElementList';
import ElementDetails from './components/ElementDetails';
import Topology from './components/Topology';
import ElementEditor from './components/ElementEditor';

function App() {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
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

  const handleCreateElement = async (elementData) => {
    try {
      // ElementEditor уже создал элемент с интерфейсами и отправил полный объект
      // Просто добавляем в список и обновляем
      setElements([...elements, elementData]);
      setShowEditor(false);
      setSelectedElement(elementData);
      setError(null);
    } catch (err) {
      setError('Failed to create element: ' + err.message);
      console.error(err);
    }
  };

  const handleUpdateElement = async (elementData) => {
    try {
      // ElementEditor уже обновил элемент и интерфейсы и отправил полный объект
      setElements(elements.map(el => el.id === editingElement.id ? elementData : el));
      setSelectedElement(elementData);
      setEditingElement(null);
      setShowEditor(false);
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
                  onClick={() => {
                    setEditingElement(null);
                    setShowEditor(true);
                  }}
                >
                  + New Element
                </button>
              </div>

              {loading ? (
                <div className="loading">Loading elements...</div>
              ) : (
                <ElementList 
                  elements={elements}
                  selectedElement={selectedElement}
                  onSelect={handleSelectElement}
                  onDelete={handleDeleteElement}
                  onEdit={(element) => {
                    setSelectedElement(element);
                    setEditingElement(element);
                    setShowEditor(true);
                  }}
                />
              )}
            </div>

            <div className="right-panel">
              {selectedElement ? (
                <ElementDetails 
                  element={selectedElement}
                  onUpdate={(data) => handleUpdateElement(data)}
                  onDelete={handleDeleteElement}
                  onEdit={(element) => {
                    setEditingElement(element);
                    setShowEditor(true);
                  }}
                />
              ) : (
                <div className="no-selection">
                  <p>Select a network element to view and manage its interfaces</p>
                </div>
              )}
            </div>

            {/* Element Editor Modal */}
            {showEditor && (
              <ElementEditor 
                element={editingElement}
                isCreating={!editingElement}
                onSave={(savedElement) => {
                  if (editingElement) {
                    handleUpdateElement(savedElement);
                  } else {
                    handleCreateElement(savedElement);
                  }
                }}
                onCancel={() => {
                  setShowEditor(false);
                  setEditingElement(null);
                }}
              />
            )}
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
