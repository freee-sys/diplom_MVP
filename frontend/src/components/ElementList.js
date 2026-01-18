import React from 'react';
import './ElementList.css';

function ElementList({ elements, selectedElement, onSelect, onDelete }) {
  return (
    <div className="element-list">
      {elements.length === 0 ? (
        <div className="empty-state">
          <p>No network elements yet</p>
          <p className="hint">Create a new element to get started</p>
        </div>
      ) : (
        <ul>
          {elements.map(element => (
            <li 
              key={element.id}
              className={`element-item ${selectedElement?.id === element.id ? 'active' : ''}`}
            >
              <div className="element-content" onClick={() => onSelect(element)}>
                <div className="element-name">{element.name}</div>
                <div className="element-meta">
                  <span className="element-type">{element.type}</span>
                  <span className="element-interfaces">
                    {element.interfaces?.length || 0} interfaces
                  </span>
                </div>
              </div>
              <button
                className="btn-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(element.id);
                }}
                title="Delete element"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ElementList;
