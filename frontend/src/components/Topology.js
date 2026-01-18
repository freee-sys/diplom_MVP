import React, { useState, useCallback } from 'react';
import ContextMenu from './ContextMenu';
import '../styles/Topology.css';

const Topology = ({ elements, onEdit, onDelete, selectedElement }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);

  // Функция для получения иконки типа элемента
  const getTypeIcon = (type) => {
    const icons = {
      'Router': '🔀',
      'Switch': '⚡',
      'Firewall': '🔒',
      'Gateway': '🚪',
      'default': '📦'
    };
    return icons[type] || icons['default'];
  };

  // Функция для получения позиции элемента на топологии
  const getElementPosition = (index, total) => {
    const canvas = document.getElementById('topology-canvas');
    if (!canvas) return { x: 100, y: 100 };

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 60;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    // Расстояние между элементами
    if (total === 1) {
      return { x: width / 2, y: height / 2 };
    } else if (total <= 4) {
      // Расположить в сетке 2x2
      const cols = 2;
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cellWidth = usableWidth / cols;
      const cellHeight = usableHeight / 2;
      return {
        x: padding + cellWidth * col + cellWidth / 2,
        y: padding + cellHeight * row + cellHeight / 2
      };
    } else if (total <= 8) {
      // Расположить по кругу
      const angle = (index / total) * 2 * Math.PI;
      const radius = Math.min(usableWidth, usableHeight) / 2.5;
      const centerX = width / 2;
      const centerY = height / 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    } else {
      // Спиральное расположение для большого количества элементов
      const angle = (index / total) * 4 * Math.PI;
      const radius = (index / total) * Math.min(usableWidth, usableHeight) / 2;
      const centerX = width / 2;
      const centerY = height / 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    }
  };

  // Обработчик правого клика
  const handleContextMenu = useCallback((e, element) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      element
    });
  }, []);

  // Обработчик клика на элемент
  const handleElementClick = useCallback((element) => {
    onEdit(element);
  }, [onEdit]);

  // Закрытие контекстного меню
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Обработчик клика на пустое место
  const handleCanvasClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className="topology-container">
      <div className="topology-header">
        <h2>📡 Топология сети</h2>
        <p className="topology-info">
          Всего элементов: <strong>{elements.length}</strong>
        </p>
      </div>

      <div
        id="topology-canvas"
        className="topology-canvas"
        onClick={handleCanvasClick}
      >
        {elements.length === 0 ? (
          <div className="topology-empty">
            <div className="empty-icon">📡</div>
            <h3>Нет сетевых элементов</h3>
            <p>Создайте первый сетевой элемент для отображения на топологии</p>
          </div>
        ) : (
          elements.map((element, index) => {
            const pos = getElementPosition(index, elements.length);
            const isSelected = selectedElement?.id === element.id;
            const isHovered = hoveredElement?.id === element.id;

            return (
              <div
                key={element.id}
                className={`topology-element ${isSelected ? 'selected' : ''} ${
                  isHovered ? 'hovered' : ''
                }`}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleElementClick(element)}
                onContextMenu={(e) => handleContextMenu(e, element)}
                onMouseEnter={() => setHoveredElement(element)}
                onMouseLeave={() => setHoveredElement(null)}
              >
                <div className="element-circle">
                  <div className="element-icon">{getTypeIcon(element.type)}</div>
                </div>
                <div className="element-info">
                  <div className="element-name-topology">{element.name}</div>
                  <div className="element-type-topology">{element.type}</div>
                  <div className="element-interfaces-count">
                    🔌 {element.interfaces?.length || 0} интерфейсов
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Легенда */}
      <div className="topology-legend">
        <h4>Легенда</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon">🔀</span>
            <span>Router</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">⚡</span>
            <span>Switch</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🔒</span>
            <span>Firewall</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🚪</span>
            <span>Gateway</span>
          </div>
        </div>
      </div>

      {/* Советы по управлению */}
      <div className="topology-tips">
        <p>💡 <strong>Советы:</strong> Нажмите на элемент для редактирования или нажмите правой кнопкой для меню</p>
      </div>

      {/* Контекстное меню */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          element={contextMenu.element}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default Topology;
