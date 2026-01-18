# 🏗️ Архитектура Топологии

## 📐 Структура компонентов с Topology

```
App.js (главный компонент с вкладками)
│
├─── activeTab state
│    ├── 'elements' (по умолчанию)
│    └── 'topology'
│
├─ Вкладка 1: Elements Management
│   │
│   ├─ ElementList.js
│   │  └── Список всех СЭ
│   │
│   ├─ ElementForm.js
│   │  └── Форма создания нового СЭ
│   │
│   └─ ElementDetails.js
│      ├── Информация о выбранном СЭ
│      └── InterfaceTable.js
│          └── Таблица интерфейсов (CRUD)
│
└─ Вкладка 2: Topology View (новое!)
   │
   └─ Topology.js
      ├── Визуализация элементов
      ├── Автоматическое расположение
      ├── Обработка событий (click, contextmenu)
      └── ContextMenu.js
          ├── Редактировать
          └── Удалить
```

## 🔄 Поток данных

```
User Interface (Frontend)
│
├─ Elements Tab
│  │
│  ├─ Create Element
│  │  └─ API POST /elements
│  │     └─ Backend creates element
│  │        └─ Return element with ID
│  │           └─ Add to state
│  │
│  ├─ Update Element
│  │  └─ API PUT /elements/{id}
│  │     └─ Backend updates element
│  │        └─ Update in state
│  │
│  └─ Delete Element
│     └─ API DELETE /elements/{id}
│        └─ Backend deletes
│           └─ Remove from state
│
└─ Topology Tab (новое!)
   │
   ├─ Display Elements
   │  └─ Read from state
   │     └─ Calculate positions
   │        └─ Render circles
   │
   ├─ Left Click (Edit)
   │  └─ switchTab('elements')
   │     └─ setSelectedElement
   │        └─ setEditingElement
   │           └─ Render in Elements tab
   │
   └─ Right Click (Context Menu)
      ├─ Show ContextMenu
      │  ├─ Edit → same as left click
      │  └─ Delete → API DELETE
      │     └─ Update state
      │        └─ Close menu
      │
      └─ Click outside
         └─ Close menu
```

## 💾 Модель данных

### Element Object
```javascript
{
  id: "uuid-string",
  name: "Router-1",
  type: "Router",           // Router, Switch, Firewall, Gateway
  description: "Main router",
  interfaces: [
    {
      id: "uuid-string",
      name: "eth0",
      type: "Ethernet",
      ip_address: "192.168.1.1",
      mac_address: "00:1A:2B:3C:4D:5E",
      status: "up",         // up, down, disabled
      bandwidth: "1Gbps",
      created_at: "2024-01-18T10:30:00"
    },
    // ... more interfaces
  ],
  created_at: "2024-01-18T10:00:00",
  updated_at: "2024-01-18T10:30:00"
}
```

## 🎨 Компонент Topology.js

### Props
```javascript
{
  elements,           // Array of elements
  onEdit,            // (element) => void
  onDelete,          // (elementId) => void
  selectedElement    // Selected element or null
}
```

### State
```javascript
contextMenu: {
  x: number,
  y: number,
  element: Element
} | null

hoveredElement: Element | null
```

### Функции
```javascript
getTypeIcon(type)          // Возвращает emoji по типу
getElementPosition(index, total) // Вычисляет x,y позицию
handleContextMenu(e, element)  // Правый клик
handleElementClick(element)    // Левый клик
closeContextMenu()            // Закрыть меню
handleCanvasClick()           // Клик вне элемента
```

### Размещение алгоритм
```
if (total === 1)
  → центр экрана

else if (total <= 4)
  → сетка 2x2
    
else if (total <= 8)
  → круговое расположение
    angle = (index / total) * 2π
    radius = min(width, height) / 2.5

else (9+)
  → спиральное расположение
    angle = (index / total) * 4π
    radius = (index / total) * min(width, height) / 2
```

## 📊 Компонент ContextMenu.js

### Props
```javascript
{
  x: number,              // X координата меню
  y: number,              // Y координата меню
  element: Element,       // Элемент на который кликнули
  onEdit: (element) => void,   // Callback редактирования
  onDelete: (elementId) => void, // Callback удаления
  onClose: () => void     // Callback закрытия меню
}
```

### Жизненный цикл
```
1. Монтирование
   └─ Добавить listeners для:
      ├─ mousedown (закрыть при клике вне)
      └─ keydown (закрыть при Escape)

2. Отображение
   └─ Позиционировать по x,y координатам

3. Взаимодействие
   ├─ Клик на Редактировать
   │  └─ Вызвать onEdit(element)
   │     └─ Вызвать onClose()
   │
   └─ Клик на Удалить
      └─ Показать confirm()
         └─ Если да → вызвать onDelete(element.id)
            └─ Вызвать onClose()

4. Размонтирование
   └─ Удалить listeners
```

## 🎭 События пользователя

### Левый клик на элемент
```
mousedown event on .topology-element
│
├─ stopPropagation (не закрыть меню)
├─ handleElementClick(element)
│  └─ onEdit(element)
│     └─ App переключается на Elements tab
│        └─ Элемент открывается для редактирования
│
└─ setHoveredElement(null)
```

### Правый клик на элемент
```
contextmenu event on .topology-element
│
├─ preventDefault (не показывать браузерное меню)
├─ stopPropagation
├─ handleContextMenu(e, element)
│  └─ setContextMenu({x, y, element})
│     └─ Отобразить ContextMenu компонент
│
└─ Дальше зависит от выбора пользователя в меню
```

### Клик вне элемента/меню
```
mousedown event on document
│
├─ Если не на ContextMenu
│  └─ closeContextMenu()
│     └─ setContextMenu(null)
│
└─ Canvas получает клик
   └─ handleCanvasClick()
      └─ closeContextMenu() (если открыто)
```

## 🎨 CSS Иерархия

### Topology.css
```
.topology-container
├── .topology-header
│   ├── h2
│   └── .topology-info
│
├── .topology-canvas
│   ├── .topology-empty (если нет элементов)
│   │   ├── .empty-icon
│   │   ├── h3
│   │   └── p
│   │
│   └── .topology-element (для каждого элемента)
│       ├── .element-circle
│       │   └── .element-icon
│       │
│       └── .element-info
│           ├── .element-name-topology
│           ├── .element-type-topology
│           └── .element-interfaces-count
│
├── .topology-legend
│   ├── h4
│   └── .legend-items
│       └── .legend-item (x4)
│           ├── .legend-icon
│           └── span
│
└── .topology-tips
    └── p
```

### ContextMenu.css
```
.context-menu
├── .context-menu-header
│   ├── .element-name
│   └── .element-type
│
├── .context-menu-divider
│
└── .context-menu-item (x2)
    ├── .icon
    └── .label
```

## 📱 Адаптивность

### Desktop (> 1200px)
```
Topology Canvas: full screen
Elements positioned: optimal spacing
```

### Tablet (768px - 1200px)
```
Topology Canvas: slightly smaller
Elements compact: reduced spacing
```

### Mobile (< 768px)
```
Topology Canvas: reduced height
Elements: may overlap
Requires careful positioning
```

## 🚀 Производительность

### Оптимизации
```
1. Позиции вычисляются один раз
   └─ getElementPosition вызывается для каждого элемента
      │
      └─ В идеале: мемоизировать результаты
      
2. Hover эффекты через CSS
   └─ transform: scale() (60fps)
      └─ Не блокирует основной поток
      
3. Условный рендер
   └─ ContextMenu отрендеривается только когда открыт
      └─ Экономит ресурсы
      
4. Event delegation
   └─ Один listener на document вместо на каждый элемент
```

### Масштабируемость
```
+ 10 элементов: плавно
+ 30 элементов: плавно
+ 50+ элементов: может быть медленнее
```

## 🔌 Интеграция с API

### REST Endpoints используемые

#### Получение элементов
```
GET /api/elements
Response: [{ Element }, ...]
```

#### Редактирование элемента
```
PUT /api/elements/{id}
Body: { name, type, description }
Response: { Element }
```

#### Удаление элемента
```
DELETE /api/elements/{id}
Response: 204 No Content
```

## 🔄 Стейт-менеджмент

### App.js state
```javascript
const [elements, setElements]               // Все элементы
const [selectedElement, setSelectedElement] // Выбранный (может быть null)
const [editingElement, setEditingElement]  // Редактируется (может быть null)
const [activeTab, setActiveTab]            // 'elements' или 'topology'
const [loading, setLoading]                // Загруска данных
const [error, setError]                    // Ошибка
```

### Topology.js state
```javascript
const [contextMenu, setContextMenu]    // Меню или null
const [hoveredElement, setHoveredElement] // Элемент под мышкой или null
```

---

**Версия документации:** 1.0  
**Обновлено:** 18 Января 2026
