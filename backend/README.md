# Virtual Network Element Management - Backend

Python Flask REST API для управления виртуальными сетевыми элементами.

## Установка

```bash
pip install -r requirements.txt
```

## Запуск

```bash
python app.py
```

API будет доступен по адресу: `http://localhost:5000`

## API Endpoints

### Network Elements (Сетевые элементы)

- `GET /api/elements` - Получить все элементы
- `POST /api/elements` - Создать новый элемент
- `GET /api/elements/<id>` - Получить элемент по ID
- `PUT /api/elements/<id>` - Обновить элемент
- `DELETE /api/elements/<id>` - Удалить элемент

### Interfaces (Интерфейсы)

- `GET /api/elements/<element_id>/interfaces` - Получить все интерфейсы элемента
- `POST /api/elements/<element_id>/interfaces` - Создать новый интерфейс
- `PUT /api/elements/<element_id>/interfaces/<interface_id>` - Обновить интерфейс
- `DELETE /api/elements/<element_id>/interfaces/<interface_id>` - Удалить интерфейс

## Пример использования

### Создание элемента
```bash
curl -X POST http://localhost:5000/api/elements \
  -H "Content-Type: application/json" \
  -d '{"name": "Router-1", "type": "Router"}'
```

### Добавление интерфейса
```bash
curl -X POST http://localhost:5000/api/elements/{element_id}/interfaces \
  -H "Content-Type: application/json" \
  -d '{"name": "eth0", "type": "Ethernet", "ip_address": "192.168.1.1"}'
```
