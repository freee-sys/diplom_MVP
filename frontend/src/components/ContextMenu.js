import React, { useEffect, useRef } from 'react';
import '../styles/ContextMenu.css';

const ContextMenu = ({ x, y, element, onEdit, onDelete, onClose, canEdit = true, canDelete = true }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleEdit = () => {
    if (!canEdit) return;
    onEdit(element);
    onClose();
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (window.confirm(`Delete "${element.name}"?`)) {
      onDelete(element.id);
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000
      }}
    >
      <div className="context-menu-header">
        <span className="element-name">{element.name}</span>
        <span className="element-type">{element.type}</span>
      </div>
      <hr className="context-menu-divider" />
      {canEdit && (
        <button className="context-menu-item edit" onClick={handleEdit}>
          <span className="label">Edit</span>
        </button>
      )}
      {canDelete && (
        <button className="context-menu-item delete" onClick={handleDelete}>
          <span className="label">Delete</span>
        </button>
      )}
      {!canEdit && !canDelete && (
        <div className="context-menu-item disabled">
          <span className="label">No actions available</span>
        </div>
      )}
    </div>
  );
};

export default ContextMenu;
