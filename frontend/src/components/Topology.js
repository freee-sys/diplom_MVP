import React, { useState, useCallback, useRef, useEffect } from 'react';
import ContextMenu from './ContextMenu';
import '../styles/Topology.css';

const STORAGE_KEY = 'topology_positions';
const NODE_WIDTH = 140;
const NODE_HEIGHT = 160;

const Topology = ({ elements, onEdit, onDelete, selectedElement, links = [], canEdit = true }) => {
  const canvasRef = useRef(null);
  const dragRef = useRef({ active: false, id: null, offsetX: 0, offsetY: 0, didDrag: false });

  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [positions, setPositions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (err) {
      return {};
    }
  });

  const getTypeIcon = (type) => {
    const icons = {
      Router: 'R',
      Switch: 'S',
      Firewall: 'F',
      Gateway: 'G',
      default: 'N'
    };
    return icons[type] || icons.default;
  };

  const clampToBounds = (x, y, canvas) => {
    if (!canvas) return { x, y };

    const rect = canvas.getBoundingClientRect();
    const minX = NODE_WIDTH / 2;
    const maxX = Math.max(minX, rect.width - NODE_WIDTH / 2);
    const minY = NODE_HEIGHT / 2;
    const maxY = Math.max(minY, rect.height - NODE_HEIGHT / 2);

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  };

  const getElementPosition = (index, total, canvas) => {
    if (!canvas) return { x: 100 + index * 30, y: 100 + index * 20 };

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const paddingX = NODE_WIDTH / 2;
    const paddingY = NODE_HEIGHT / 2;
    const usableWidth = Math.max(100, width - paddingX * 2);
    const usableHeight = Math.max(100, height - paddingY * 2);

    let pos;
    if (total === 1) {
      pos = { x: width / 2, y: height / 2 };
    } else if (total <= 4) {
      const cols = 2;
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cellWidth = usableWidth / cols;
      const cellHeight = usableHeight / 2;
      pos = {
        x: paddingX + cellWidth * col + cellWidth / 2,
        y: paddingY + cellHeight * row + cellHeight / 2
      };
    } else if (total <= 8) {
      const angle = (index / total) * 2 * Math.PI;
      const radius = Math.min(usableWidth, usableHeight) / 2.5;
      const centerX = width / 2;
      const centerY = height / 2;
      pos = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    } else {
      const angle = (index / total) * 4 * Math.PI;
      const radius = (index / total) * Math.min(usableWidth, usableHeight) / 2;
      const centerX = width / 2;
      const centerY = height / 2;
      pos = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    }

    return clampToBounds(pos.x, pos.y, canvas);
  };

  useEffect(() => {
    setPositions(prev => {
      const next = { ...prev };
      const canvas = canvasRef.current;

      elements.forEach((el, idx) => {
        if (!next[el.id]) {
          next[el.id] = getElementPosition(idx, elements.length, canvas);
        } else if (canvas) {
          next[el.id] = clampToBounds(next[el.id].x, next[el.id].y, canvas);
        }
      });

      Object.keys(next).forEach((id) => {
        if (!elements.find(el => el.id === id)) {
          delete next[id];
        }
      });

      return next;
    });
  }, [elements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch (err) {
      // ignore storage issues
    }
  }, [positions]);

  const handleContextMenu = useCallback((e, element) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      element
    });
  }, []);

  const handleElementClick = useCallback((element) => {
    if (dragRef.current.didDrag) {
      dragRef.current.didDrag = false;
      return;
    }
    onEdit(element);
  }, [onEdit]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleMouseDown = useCallback((e, element) => {
    if (e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    e.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    const current = positions[element.id] || { x: rect.width / 2, y: rect.height / 2 };

    dragRef.current = {
      active: true,
      id: element.id,
      offsetX: e.clientX - rect.left - current.x,
      offsetY: e.clientY - rect.top - current.y,
      didDrag: false
    };
  }, [positions]);

  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current.active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left - dragRef.current.offsetX;
    let y = e.clientY - rect.top - dragRef.current.offsetY;

    const clamped = clampToBounds(x, y, canvas);
    dragRef.current.didDrag = true;

    setPositions(prev => ({
      ...prev,
      [dragRef.current.id]: { x: clamped.x, y: clamped.y }
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.active) {
      dragRef.current.active = false;
    }
  }, []);

  const positionsMap = {};
  elements.forEach((el, idx) => {
    positionsMap[el.id] = positions[el.id] || getElementPosition(idx, elements.length, canvasRef.current);
  });

  return (
    <div className="topology-container">
      <div className="topology-header">
        <h2>Topology</h2>
        <p className="topology-info">
          Elements: <strong>{elements.length}</strong>
        </p>
      </div>

      <div
        id="topology-canvas"
        ref={canvasRef}
        className="topology-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {elements.length === 0 ? (
          <div className="topology-empty">
            <div className="empty-icon">T</div>
            <h3>No network elements</h3>
            <p>Create the first network element to show it on the topology.</p>
          </div>
        ) : (
          <>
            <svg className="topology-links-overlay" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {links.map(link => {
                const aPos = positionsMap[link.element_a_id];
                const bPos = positionsMap[link.element_b_id];
                if (!aPos || !bPos) return null;
                const stroke = link.level === 'L3' ? '#ff6b6b' : '#4a90e2';
                return (
                  <line
                    key={link.id}
                    x1={aPos.x}
                    y1={aPos.y}
                    x2={bPos.x}
                    y2={bPos.y}
                    stroke={stroke}
                    strokeWidth={3}
                    strokeOpacity={0.8}
                  />
                );
              })}
            </svg>

            {elements.map((element, index) => {
              const pos = positionsMap[element.id] || getElementPosition(index, elements.length, canvasRef.current);
              const isSelected = selectedElement?.id === element.id;
              const isHovered = hoveredElement?.id === element.id;

              return (
                <div
                  key={element.id}
                  className={`topology-element ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
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
                  onMouseDown={(e) => handleMouseDown(e, element)}
                >
                  <div className="element-circle">
                    <div className="element-icon">{getTypeIcon(element.type)}</div>
                  </div>
                  <div className="element-info">
                    <div className="element-name-topology">{element.name}</div>
                    <div className="element-type-topology">{element.type}</div>
                    <div className="element-interfaces-count">
                      Interfaces: {element.interfaces?.length || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="topology-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon">R</span>
            <span>Router</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">S</span>
            <span>Switch</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">F</span>
            <span>Firewall</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">G</span>
            <span>Gateway</span>
          </div>
        </div>
      </div>

      <div className="topology-tips">
        <p><strong>Tips:</strong> Drag elements to spread them out. Elements are constrained to the canvas.</p>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          element={contextMenu.element}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={closeContextMenu}
          canEdit={canEdit}
          canDelete={canEdit}
        />
      )}
    </div>
  );
};

export default Topology;
