import React, { useEffect, useRef } from 'react';
import '../styles/ContextMenu.css';

const ContextMenu = ({ x, y, element, onEdit, onDelete, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    // Закрыть меню при клике вне его
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Закрыть меню при нажатии Escape
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
    onEdit(element);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить "${element.name}"?`)) {
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
      <button className="context-menu-item edit" onClick={handleEdit}>
        <span className="icon">✎</span>
        <span className="label">Редактировать</span>
      </button>
      <button className="context-menu-item delete" onClick={handleDelete}>
        <span className="icon">✕</span>
        <span className="label">Удалить</span>
      </button>
    </div>
  );
};

export default ContextMenu;
