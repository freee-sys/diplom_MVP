# ✅ Архитектура структуры данных (КОРРЕКТНАЯ)

## Структура данных

### Иерархия (Правильная)

```
Virtual Network Element (СЭ)
├── id: UUID
├── name: string
├── type: string (Router, Switch, Firewall, etc.)
├── description: string
├── created_at: ISO datetime
├── updated_at: ISO datetime
└── interfaces: Array [
    ├── Interface 1
    │   ├── id: UUID
    │   ├── name: string (eth0, port1, etc.)
    │   ├── type: string (Ethernet, Serial, etc.)
    │   ├── ip_address: string
    │   ├── mac_address: string
    │   ├── status: string (up, down, disabled)
    │   ├── bandwidth: string (1000 Mbps, 1 Gbps, etc.)
    │   ├── level: string (L2, L3, L2/L3) [NEW in v1.2]
    │   ├── reverse_interface_id: UUID | null [NEW in v1.2]
    │   ├── reverse_element_id: UUID | null [NEW in v1.2]
    │   └── created_at: ISO datetime
    │
    ├── Interface 2
    │   ├── id: UUID
    │   ├── name: string
    │   ├── ...
    │   └── created_at: ISO datetime
    │
    └── Interface N
        ├── id: UUID
        ├── name: string
        ├── ...
        └── created_at: ISO datetime
]
```

## Хранение в памяти (Backend)

### Python app.py

```python
# Global storage
virtual_elements = {
    'element_uuid_1': {
        'id': 'element_uuid_1',
        'name': 'Router_1',
        'type': 'Router',
        'description': 'Main core router',
        'created_at': '2024-12-01T10:30:00Z',
        'updated_at': '2024-12-01T10:30:00Z',
        'interfaces': [
            {
                'id': 'interface_uuid_1',
                'name': 'eth0',
                'type': 'Ethernet',
                'ip_address': '192.168.1.1',
                'mac_address': '00:11:22:33:44:55',
                'status': 'up',
                'bandwidth': '1000',
                'level': 'L3',
                'reverse_interface_id': 'interface_uuid_2',
                'reverse_element_id': 'element_uuid_2',
                'created_at': '2024-12-01T10:30:00Z'
            },
            {
                'id': 'interface_uuid_3',
                'name': 'eth1',
                'type': 'Ethernet',
                'ip_address': '192.168.2.1',
                'mac_address': '00:11:22:33:44:56',
                'status': 'up',
                'bandwidth': '1000',
                'level': 'L2',
                'reverse_interface_id': None,
                'reverse_element_id': None,
                'created_at': '2024-12-01T10:30:00Z'
            }
        ]
    },
    'element_uuid_2': {
        'id': 'element_uuid_2',
        'name': 'Router_2',
        'type': 'Router',
        'description': 'Secondary router',
        'created_at': '2024-12-01T10:35:00Z',
        'updated_at': '2024-12-01T10:35:00Z',
        'interfaces': [
            {
                'id': 'interface_uuid_2',
                'name': 'eth0',
                'type': 'Ethernet',
                'ip_address': '192.168.2.1',
                'mac_address': '00:11:22:33:44:66',
                'status': 'up',
                'bandwidth': '1000',
                'level': 'L3',
                'reverse_interface_id': 'interface_uuid_1',
                'reverse_element_id': 'element_uuid_1',
                'created_at': '2024-12-01T10:35:00Z'
            }
        ]
    }
}
```

## API Endpoints

### GET /api/elements
Возвращает список всех элементов **с их интерфейсами внутри**:

```json
[
  {
    "id": "element_uuid_1",
    "name": "Router_1",
    "type": "Router",
    "description": "Main core router",
    "interfaces": [
      {
        "id": "interface_uuid_1",
        "name": "eth0",
        "type": "Ethernet",
        ...
      }
    ],
    "created_at": "2024-12-01T10:30:00Z",
    "updated_at": "2024-12-01T10:30:00Z"
  }
]
```

### GET /api/elements/<element_id>
Возвращает конкретный элемент **с его интерфейсами**:

```json
{
  "id": "element_uuid_1",
  "name": "Router_1",
  "type": "Router",
  "description": "Main core router",
  "interfaces": [
    {
      "id": "interface_uuid_1",
      "name": "eth0",
      ...
    }
  ],
  "created_at": "2024-12-01T10:30:00Z",
  "updated_at": "2024-12-01T10:30:00Z"
}
```

### GET /api/elements/<element_id>/interfaces
Возвращает только **интерфейсы конкретного элемента**:

```json
[
  {
    "id": "interface_uuid_1",
    "name": "eth0",
    "type": "Ethernet",
    "ip_address": "192.168.1.1",
    "mac_address": "00:11:22:33:44:55",
    "status": "up",
    "bandwidth": "1000",
    "level": "L3",
    "reverse_interface_id": "interface_uuid_2",
    "reverse_element_id": "element_uuid_2",
    "created_at": "2024-12-01T10:30:00Z"
  }
]
```

### POST /api/elements/<element_id>/interfaces
Создает интерфейс **для конкретного элемента**:

```json
{
  "name": "eth0",
  "type": "Ethernet",
  "ip_address": "192.168.1.1",
  "mac_address": "00:11:22:33:44:55",
  "status": "up",
  "bandwidth": "1000",
  "level": "L3",
  "reverse_interface_id": "interface_uuid_2",
  "reverse_element_id": "element_uuid_2"
}
```

## Frontend структура

### React компоненты

```
App.js
├── ElementList.js (Левая панель)
│   └── Список всех элементов
│       └── При клике → выбрать элемент
│
└── ElementDetails.js (Правая панель, показывается когда элемент выбран)
    ├── Информация об элементе
    │   └── Кнопки Edit, Delete
    │
    └── InterfaceTable.js
        ├── Таблица интерфейсов этого элемента
        │   └── Кнопки Add, Edit, Delete для каждого интерфейса
        │
        └── InterfaceForm
            ├── Поля для редактирования/создания интерфейса
            │   ├── name, type, ip_address, mac_address
            │   ├── status, bandwidth
            │   ├── level (НОВОЕ - L2/L3/L2/L3)
            │   └── reverse_interface_id (НОВОЕ - dropdown меню)
            └── Кнопки Save, Cancel
```

### State в компонентах

#### App.js
```javascript
const [selectedElement, setSelectedElement] = useState(null);
const [elements, setElements] = useState([]);
```

#### ElementDetails.js
```javascript
const [editData, setEditData] = useState(element);
const [isEditing, setIsEditing] = useState(false);
```

#### InterfaceTable.js
```javascript
const [interfaces, setInterfaces] = useState(element.interfaces || []);
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState(null);
const [availableInterfaces, setAvailableInterfaces] = useState([]);
const [formData, setFormData] = useState({
  name: '',
  type: 'Ethernet',
  ip_address: '',
  mac_address: '',
  status: 'up',
  bandwidth: '',
  level: 'L2',
  reverse_interface_id: '',
  reverse_element_id: ''
});
```

## Поток данных при создании соединения

```
1. Пользователь открывает ElementDetails элемента #1
   ↓
2. Видит InterfaceTable с его интерфейсами
   ↓
3. Нажимает "Edit" у интерфейса
   ↓
4. Форма загружает availableInterfaces:
   GET /api/available-interfaces?element_id=element_1
   ↓
5. Backend возвращает интерфейсы из других элементов:
   [
     {element_id: 'element_2', element_name: 'Router_2', interface_id: 'iface_2', interface_name: 'eth0'},
     {element_id: 'element_3', element_name: 'Switch_1', interface_id: 'iface_3', interface_name: 'port1'}
   ]
   ↓
6. Пользователь выбирает интерфейс из dropdown
   ↓
7. handleReverseInterfaceChange() заполняет:
   - formData.reverse_interface_id = 'iface_2'
   - formData.reverse_element_id = 'element_2'
   ↓
8. Пользователь нажимает "Update Interface"
   ↓
9. PUT /api/elements/element_1/interfaces/iface_1 с новыми данными
   ↓
10. Backend обновляет интерфейс элемента #1
    virtual_elements['element_1']['interfaces'][0].reverse_interface_id = 'iface_2'
    virtual_elements['element_1']['interfaces'][0].reverse_element_id = 'element_2'
   ↓
11. Frontend получает обновленный интерфейс
   ↓
12. fetchConnections() загружает все соединения:
    GET /api/connections
   ↓
13. Backend возвращает соединение:
    {
      from_element_id: 'element_1',
      from_interface_id: 'iface_1',
      to_element_id: 'element_2',
      to_interface_id: 'iface_2',
      level: 'L3'
    }
   ↓
14. Topology.js рисует SVG линию между элементами
   ↓
15. Пользователь видит цветную линию на топологии!
```

## Проверка: Интерфейсы являются частью элемента?

✅ **ДА! Полностью верно**

**Доказательства:**

1. **Backend (app.py, строка 40):**
   ```python
   element = {
       'id': element_id,
       'name': data['name'],
       'interfaces': [],  # ← Интерфейсы внутри элемента!
   }
   ```

2. **Backend (app.py, строка 101):**
   ```python
   # Endpoint для интерфейсов конкретного элемента
   @app.route('/api/elements/<element_id>/interfaces', methods=['GET'])
   def get_interfaces(element_id):
       element = virtual_elements.get(element_id)
       return jsonify(element['interfaces']), 200
   ```

3. **Frontend (InterfaceTable.js, строка 6):**
   ```javascript
   function InterfaceTable({ element }) {
       const [interfaces, setInterfaces] = useState(element.interfaces || []);
       // ↑ Берет интерфейсы из элемента!
   }
   ```

4. **Frontend (ElementDetails.js, строка 86):**
   ```javascript
   <InterfaceTable element={element} />
   // ↑ Передает элемент вместе с его интерфейсами
   ```

## Заключение

Архитектура **полностью корректна**:

✅ Интерфейсы являются частью каждого СЭ  
✅ У каждого СЭ собственные интерфейсы  
✅ Интерфейсы не отдельные, а вложены в элемент  
✅ API endpoints следуют иерархии: `/elements/<id>/interfaces`  
✅ Frontend компоненты правильно отражают эту структуру  

Все работает правильно! 🎉
