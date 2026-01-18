# Примеры использования API

## Примеры curl запросов

### 1. Создание сетевого элемента

```bash
curl -X POST http://localhost:5000/api/elements \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Core-Router",
    "type": "Router",
    "description": "Main core router in data center"
  }'
```

**Ответ:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Core-Router",
  "type": "Router",
  "description": "Main core router in data center",
  "interfaces": [],
  "created_at": "2024-01-18T10:00:00.000000",
  "updated_at": "2024-01-18T10:00:00.000000"
}
```

### 2. Получить все элементы

```bash
curl http://localhost:5000/api/elements
```

### 3. Получить конкретный элемент

```bash
curl http://localhost:5000/api/elements/550e8400-e29b-41d4-a716-446655440000
```

### 4. Обновить элемент

```bash
curl -X PUT http://localhost:5000/api/elements/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Core-Router-Updated",
    "type": "Router",
    "description": "Updated core router"
  }'
```

### 5. Добавить интерфейс к элементу

```bash
curl -X POST http://localhost:5000/api/elements/550e8400-e29b-41d4-a716-446655440000/interfaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GigabitEthernet0/0/1",
    "type": "Gigabit Ethernet",
    "ip_address": "192.168.1.1",
    "mac_address": "00:11:22:33:44:55",
    "status": "up",
    "bandwidth": "1Gbps"
  }'
```

### 6. Получить все интерфейсы элемента

```bash
curl http://localhost:5000/api/elements/550e8400-e29b-41d4-a716-446655440000/interfaces
```

### 7. Обновить интерфейс

```bash
curl -X PUT http://localhost:5000/api/elements/550e8400-e29b-41d4-a716-446655440000/interfaces/interface-id \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GigabitEthernet0/0/1",
    "type": "Gigabit Ethernet",
    "ip_address": "192.168.1.1",
    "mac_address": "00:11:22:33:44:55",
    "status": "down",
    "bandwidth": "1Gbps"
  }'
```

### 8. Удалить интерфейс

```bash
curl -X DELETE http://localhost:5000/api/elements/550e8400-e29b-41d4-a716-446655440000/interfaces/interface-id
```

### 9. Удалить элемент

```bash
curl -X DELETE http://localhost:5000/api/elements/550e8400-e29b-41d4-a716-446655440000
```

## Примеры JavaScript/Fetch

### Создание элемента

```javascript
const createElement = async () => {
  const response = await fetch('http://localhost:5000/api/elements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Switch-1',
      type: 'Switch',
      description: 'Access switch'
    })
  });
  const data = await response.json();
  console.log('Created element:', data);
};
```

### Получение элементов

```javascript
const getElements = async () => {
  const response = await fetch('http://localhost:5000/api/elements');
  const elements = await response.json();
  console.log('Elements:', elements);
};
```

### Добавление интерфейса

```javascript
const addInterface = async (elementId) => {
  const response = await fetch(
    `http://localhost:5000/api/elements/${elementId}/interfaces`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'FastEthernet0/0/1',
        type: 'Ethernet',
        ip_address: '10.0.0.1',
        mac_address: 'aa:bb:cc:dd:ee:ff',
        status: 'up',
        bandwidth: '100Mbps'
      })
    }
  );
  const data = await response.json();
  console.log('Created interface:', data);
};
```

## Примеры Python/Requests

```python
import requests
import json

BASE_URL = 'http://localhost:5000/api'

# Создание элемента
def create_element():
    data = {
        'name': 'Firewall-1',
        'type': 'Firewall',
        'description': 'Security firewall'
    }
    response = requests.post(f'{BASE_URL}/elements', json=data)
    return response.json()

# Получение всех элементов
def get_elements():
    response = requests.get(f'{BASE_URL}/elements')
    return response.json()

# Добавление интерфейса
def add_interface(element_id):
    data = {
        'name': 'eth0',
        'type': 'Ethernet',
        'ip_address': '192.168.100.1',
        'mac_address': '11:22:33:44:55:66',
        'status': 'up',
        'bandwidth': '1Gbps'
    }
    response = requests.post(
        f'{BASE_URL}/elements/{element_id}/interfaces',
        json=data
    )
    return response.json()

# Использование
if __name__ == '__main__':
    # Создаем элемент
    element = create_element()
    print(f"Created element: {element['name']} (ID: {element['id']})")
    
    # Добавляем интерфейсы
    interface = add_interface(element['id'])
    print(f"Added interface: {interface['name']}")
    
    # Получаем все элементы
    all_elements = get_elements()
    print(f"Total elements: {len(all_elements)}")
```

## Полный рабочий сценарий

### Создание инфраструктуры через API

```python
import requests
import json

BASE_URL = 'http://localhost:5000/api'

# 1. Создание сетевых элементов
elements = [
    {
        'name': 'Core-Router',
        'type': 'Router',
        'description': 'Main core router'
    },
    {
        'name': 'Access-Switch',
        'type': 'Switch',
        'description': 'Access layer switch'
    },
    {
        'name': 'Perimeter-Firewall',
        'type': 'Firewall',
        'description': 'Perimeter security firewall'
    }
]

created_elements = []
for elem in elements:
    response = requests.post(f'{BASE_URL}/elements', json=elem)
    created_elements.append(response.json())
    print(f"✓ Created: {elem['name']}")

# 2. Добавление интерфейсов к элементам
interfaces_data = {
    0: [  # Core-Router interfaces
        {
            'name': 'GigabitEthernet0/0/0',
            'type': 'Gigabit Ethernet',
            'ip_address': '192.168.1.1',
            'mac_address': '00:00:00:00:00:01',
            'status': 'up',
            'bandwidth': '1Gbps'
        },
        {
            'name': 'GigabitEthernet0/0/1',
            'type': 'Gigabit Ethernet',
            'ip_address': '192.168.2.1',
            'mac_address': '00:00:00:00:00:02',
            'status': 'up',
            'bandwidth': '1Gbps'
        }
    ],
    1: [  # Access-Switch interfaces
        {
            'name': 'FastEthernet0/1',
            'type': 'Ethernet',
            'ip_address': '10.0.0.1',
            'mac_address': '00:11:22:33:44:01',
            'status': 'up',
            'bandwidth': '100Mbps'
        }
    ],
    2: [  # Firewall interfaces
        {
            'name': 'eth0',
            'type': 'Ethernet',
            'ip_address': '203.0.113.1',
            'mac_address': 'aa:bb:cc:dd:ee:ff',
            'status': 'up',
            'bandwidth': '1Gbps'
        }
    ]
}

for elem_idx, interfaces in interfaces_data.items():
    elem_id = created_elements[elem_idx]['id']
    elem_name = created_elements[elem_idx]['name']
    
    for iface in interfaces:
        response = requests.post(
            f'{BASE_URL}/elements/{elem_id}/interfaces',
            json=iface
        )
        print(f"  ✓ Added interface: {iface['name']} to {elem_name}")

# 3. Проверка созданной инфраструктуры
print("\n📊 Created Infrastructure:")
all_elements = requests.get(f'{BASE_URL}/elements').json()
for elem in all_elements:
    print(f"\n{elem['name']} ({elem['type']})")
    print(f"  Description: {elem['description']}")
    print(f"  Interfaces: {len(elem['interfaces'])}")
    for iface in elem['interfaces']:
        print(f"    - {iface['name']}: {iface['ip_address']} ({iface['status']})")
```

## Тестирование с Postman

1. Импортируйте следующую коллекцию в Postman
2. Установите переменную окружения: `base_url = http://localhost:5000/api`

```json
{
  "info": {
    "name": "Virtual Network Element API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Elements",
      "item": [
        {
          "name": "Get All Elements",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/elements"
          }
        },
        {
          "name": "Create Element",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/elements",
            "body": {
              "mode": "raw",
              "raw": "{\"name\": \"Router-1\", \"type\": \"Router\"}"
            }
          }
        }
      ]
    }
  ]
}
```

## Полезные ссылки

- API Documentation: [API_DOCS.html](API_DOCS.html)
- Deployment Guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- Main README: [README.md](README.md)
- Backend README: [backend/README.md](backend/README.md)
