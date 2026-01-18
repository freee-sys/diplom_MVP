# Архитектура приложения

## Обзор системы

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser                              │
│              (http://localhost:3000)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
    ┌────▼─────────┐        ┌────────▼──────┐
    │   React UI   │        │   React UI    │
    │ Components   │        │  State Mgmt   │
    └────┬─────────┘        └────────┬──────┘
         │                           │
         └──────────────┬────────────┘
                        │
         ┌──────────────▼──────────────┐
         │    Axios HTTP Client        │
         │  (http://localhost:5000)    │
         └──────────────┬──────────────┘
                        │ HTTP/REST
    ┌───────────────────▼───────────────────┐
    │        Flask REST API Server          │
    │      (http://localhost:5000)          │
    ├───────────────────────────────────────┤
    │  • Route Handlers                     │
    │  • Business Logic                     │
    │  • Data Validation                    │
    └───────────────────┬───────────────────┘
                        │
         ┌──────────────▼──────────────┐
         │   In-Memory Data Store      │
         │  (Dictionary Storage)       │
         │                             │
         │  Virtual Elements:          │
         │    • id, name, type         │
         │    • interfaces[]           │
         │    • metadata               │
         └─────────────────────────────┘
```

## Компоненты системы

### Frontend (React)

#### Иерархия компонентов

```
App
├── Header
├── ErrorMessage
├── LeftPanel
│   ├── ElementForm (условно)
│   └── ElementList
│       └── ElementItem (x n)
└── RightPanel
    └── ElementDetails
        └── InterfaceTable
            ├── InterfaceForm (условно)
            └── Table (rows)
```

#### Компоненты

| Компонент | Ответственность |
|-----------|-----------------|
| **App.js** | Главный контейнер, управление состоянием, API вызовы |
| **ElementList.js** | Отображение списка СЭ |
| **ElementForm.js** | Форма создания нового СЭ |
| **ElementDetails.js** | Деталей СЭ, редактирование параметров |
| **InterfaceTable.js** | Таблица интерфейсов с inline редактированием |

#### Поток данных

```
User Interaction
    ↓
Component Event Handler
    ↓
API Call (axios)
    ↓
Backend Process
    ↓
JSON Response
    ↓
Update State
    ↓
Re-render Component
    ↓
Display Update
```

### Backend (Python Flask)

#### Структура приложения

```python
app.py
├── Flask App Initialization
│   ├── CORS Configuration
│   └── In-memory Storage
│
├── Network Elements Routes
│   ├── GET /api/elements          → get_elements()
│   ├── POST /api/elements         → create_element()
│   ├── GET /api/elements/<id>     → get_element()
│   ├── PUT /api/elements/<id>     → update_element()
│   └── DELETE /api/elements/<id>  → delete_element()
│
├── Interface Routes
│   ├── GET /api/elements/<id>/interfaces
│   ├── POST /api/elements/<id>/interfaces
│   ├── PUT /api/elements/<id>/interfaces/<ifid>
│   └── DELETE /api/elements/<id>/interfaces/<ifid>
│
└── Health Check
    └── GET /api/health
```

#### Структура данных

```python
virtual_elements = {
    "uuid-1": {
        "id": "uuid-1",
        "name": "Router-1",
        "type": "Router",
        "description": "Main router",
        "interfaces": [
            {
                "id": "iface-uuid-1",
                "name": "eth0",
                "type": "Ethernet",
                "ip_address": "192.168.1.1",
                "mac_address": "00:1A:2B:3C:4D:5E",
                "status": "up",
                "bandwidth": "1Gbps",
                "created_at": "2024-01-18T..."
            }
        ],
        "created_at": "2024-01-18T...",
        "updated_at": "2024-01-18T..."
    }
}
```

## Взаимодействие компонентов

### Сценарий: Создание сетевого элемента

```
1. User inputs data in ElementForm
   └─→ 2. Click "Create Element"
        └─→ 3. Form Validation
             └─→ 4. API POST /api/elements
                  └─→ 5. Flask receives request
                       └─→ 6. Validate data
                            └─→ 7. Create UUID
                                 └─→ 8. Store in virtual_elements
                                      └─→ 9. Return JSON response
                                           └─→ 10. Axios receives response
                                                └─→ 11. Update App state
                                                     └─→ 12. Re-render ElementList
                                                          └─→ 13. New element visible
```

### Сценарий: Добавление интерфейса

```
1. User clicks "Add Interface"
   └─→ 2. InterfaceForm appears
        └─→ 3. User fills form fields
             └─→ 4. Click "Add Interface"
                  └─→ 5. Form Validation
                       └─→ 6. API POST /api/elements/{id}/interfaces
                            └─→ 7. Flask receives request
                                 └─→ 8. Find element by ID
                                      └─→ 9. Validate interface data
                                           └─→ 10. Create interface object
                                                └─→ 11. Add to element.interfaces[]
                                                     └─→ 12. Return JSON response
                                                          └─→ 13. InterfaceTable updates
                                                               └─→ 14. New row appears
```

## Технологический стек

### Frontend
- **React 18.2.0** - UI библиотека
- **Axios 1.6.0** - HTTP клиент
- **CSS3** - Стилизация

### Backend
- **Python 3.8+** - Язык программирования
- **Flask 3.0.0** - Web фреймворк
- **Flask-CORS 4.0.0** - Cross-Origin запросы

### Data Storage
- **In-Memory** - Текущая итерация (теряется при перезагрузке)
- **Рекомендуется**: PostgreSQL, MongoDB для продакшена

## API Соглашения

### Request Format
```json
{
  "name": "string",
  "type": "string",
  "description": "string",
  ...
}
```

### Response Format
```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601",
  ...
}
```

### Error Format
```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes
| Code | Использование |
|------|----------------|
| 200 | OK - Success |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid data |
| 404 | Not Found - Resource not exists |
| 500 | Server Error |

## Паттерны проектирования

### Frontend
- **Component-based Architecture** - Переиспользуемые компоненты
- **Lifting State Up** - Управление состоянием в Parent component
- **Conditional Rendering** - Показ/скрытие элементов
- **Form Handling** - Управление формами с useState

### Backend
- **REST API** - Стандартные HTTP методы
- **Separation of Concerns** - Разделение логики по функциям
- **Error Handling** - Обработка ошибок с JSON ответами
- **CORS** - Кросс-доменные запросы

## Масштабируемость

### Текущие ограничения
- ⚠️ In-memory storage - данные теряются при перезагрузке
- ⚠️ Нет аутентификации - все пользователи имеют полный доступ
- ⚠️ Нет валидации - минимальная проверка данных

### Рекомендации для масштабирования
1. **Database Integration**
   - PostgreSQL для ACID транзакций
   - MongoDB для гибкого схема

2. **Authentication & Authorization**
   - JWT токены
   - Role-based access control

3. **API Improvements**
   - Pagination для больших datasets
   - Filtering и sorting
   - API versioning

4. **Frontend Optimization**
   - Code splitting
   - Lazy loading
   - State management (Redux/Context)

5. **Deployment**
   - Docker контейнеризация
   - Kubernetes orchestration
   - CI/CD pipeline

## Безопасность

### Текущая конфигурация
- ✅ CORS enabled для localhost:3000
- ⚠️ Нет HTTPS
- ⚠️ Нет Rate Limiting
- ⚠️ Нет Input Sanitization

### Рекомендации для продакшена
1. Включить HTTPS/TLS
2. Добавить Rate Limiting
3. Валидировать все входные данные
4. Использовать параметризованные запросы
5. Добавить логирование и мониторинг
6. Регулярные security audits

## Диаграмма последовательности

### Создание элемента

```
User           Browser          React App        Axios          Flask
 │               │                │                │              │
 │─Click Submit──│                │                │              │
 │               │                │                │              │
 │               │───Validate─────│                │              │
 │               │                │                │              │
 │               │────POST────────│                │              │
 │               │                │────POST────────│              │
 │               │                │                │───Request───│
 │               │                │                │              │
 │               │                │                │    Process   │
 │               │                │                │              │
 │               │                │                │    Store     │
 │               │                │                │              │
 │               │                │────Response────│              │
 │               │                │                │    200 OK    │
 │               │                │────Success─────│              │
 │               │                │                │              │
 │               │─Refresh List───│                │              │
 │               │                │──GET /api──────│              │
 │               │                │                │────Request──│
 │               │                │                │              │
 │               │                │                │────Array────│
 │               │                │                │              │
 │               │────Update UI───│                │              │
 │               │                │                │              │
 │◀─Show Result──│                │                │              │
```

## Производительность

### Оптимизации (текущие)
- ✅ Async/await для API запросов
- ✅ Минимальный re-render через conditional logic
- ✅ CSS классы вместо inline styles

### Рекомендуемые оптимизации
- React.memo для компонентов
- useCallback для обработчиков
- useMemo для дорогих вычислений
- Lazy loading для больших списков
- Pagination на frontend/backend

## Документация

- 📄 [README.md](README.md) - Общая информация
- 📄 [DEPLOYMENT.md](DEPLOYMENT.md) - Инструкция развертывания
- 📄 [EXAMPLES.md](EXAMPLES.md) - Примеры использования API
- 📄 [API_DOCS.html](API_DOCS.html) - Документация API
- 📄 [backend/README.md](backend/README.md) - Backend информация
- 📄 [ARCHITECTURE.md](ARCHITECTURE.md) - Эта документация
