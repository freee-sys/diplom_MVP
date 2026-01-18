# Инструкция по развертыванию

## Предварительные требования

- **Python 3.8 или выше**
- **Node.js 14 или выше** 
- **npm или yarn**
- **Git** (опционально)

## Шаг 1: Установка зависимостей Backend

```bash
# Откройте терминал в папке backend
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt
```

## Шаг 2: Запуск Backend сервера

```bash
# В папке backend (с активированным виртуальным окружением)
python app.py
```

Вывод должен быть:
```
 * Serving Flask app 'app'
 * Running on http://0.0.0.0:5000
```

✅ Backend готов к использованию на `http://localhost:5000`

## Шаг 3: Установка зависимостей Frontend (в новом терминале)

```bash
# Откройте новый терминал в папке frontend
cd frontend

# Установка зависимостей
npm install
# или если у вас есть yarn
yarn install
```

## Шаг 4: Запуск Frontend приложения

```bash
# В папке frontend
npm start
# или
yarn start
```

Браузер автоматически откроет приложение на `http://localhost:3000`

## Автоматический запуск (Windows)

Просто запустите файл `start.bat`:
```bash
double-click start.bat
```

## Автоматический запуск (macOS/Linux)

```bash
chmod +x start.sh
./start.sh
```

## Проверка работы

### 1. Health Check

```bash
curl http://localhost:5000/api/health
```

Ожидаемый результат:
```json
{"status": "healthy"}
```

### 2. Получить все элементы

```bash
curl http://localhost:5000/api/elements
```

Ожидаемый результат (пустой список):
```json
[]
```

### 3. Создать новый элемент

```bash
curl -X POST http://localhost:5000/api/elements \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test-Router",
    "type": "Router",
    "description": "Test element"
  }'
```

## Структура проекта

```
virtual-network-element-app/
├── backend/
│   ├── app.py                 # Основное Flask приложение
│   ├── requirements.txt       # Зависимости Python
│   ├── .env                   # Переменные окружения
│   └── README.md             # Backend документация
├── frontend/
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   ├── App.js           # Главный компонент
│   │   ├── App.css          # Стили
│   │   └── index.js         # Точка входа
│   ├── public/              # Статические файлы
│   ├── package.json         # Зависимости Node.js
│   └── .env                 # Переменные окружения
├── .vscode/
│   ├── launch.json          # Конфиг для отладки
│   └── tasks.json           # Задачи для VS Code
├── README.md                # Главная документация
├── API_DOCS.html            # Документация API
├── start.bat                # Автозапуск (Windows)
├── start.sh                 # Автозапуск (macOS/Linux)
└── .gitignore              # Git конфигурация
```

## Общие проблемы и решения

### Проблема: "Port 5000 is already in use"

**Решение:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Проблема: "Module not found" при запуске backend

**Решение:**
1. Убедитесь, что виртуальное окружение активировано
2. Переустановите зависимости: `pip install -r requirements.txt`

### Проблема: "npm: command not found"

**Решение:**
1. Установите Node.js с https://nodejs.org/
2. Перезагрузите терминал

### Проблема: CORS ошибка

**Решение:**
Backend уже настроен с CORS. Убедитесь, что:
1. Backend работает на `http://localhost:5000`
2. Frontend работает на `http://localhost:3000`

## Дополнительные команды

### Frontend

```bash
# Сборка для продакшена
npm run build

# Запуск тестов
npm test

# Очистка node_modules
npm cache clean --force
rm -rf node_modules
npm install
```

### Backend

```bash
# Установка с requirements.txt
pip install -r requirements.txt

# Добавление новой зависимости
pip install package_name
pip freeze > requirements.txt

# Создание виртуального окружения
python -m venv venv

# Удаление виртуального окружения
rm -rf venv  # macOS/Linux
rmdir /s venv  # Windows
```

## Следующие шаги

После успешного развертывания:

1. ✅ Откройте `http://localhost:3000` в браузере
2. ✅ Создайте новый сетевой элемент через UI
3. ✅ Добавьте интерфейсы к элементу
4. ✅ Проверьте все CRUD операции
5. 📚 Изучите код для понимания архитектуры

## Контакт / Поддержка

При возникновении вопросов обратитесь к документации в:
- `README.md` - Общая информация
- `API_DOCS.html` - Документация API
- `backend/README.md` - Backend информация
- `.vscode/` - Конфиги для отладки
