# 🚀 Быстрый старт

## За 5 минут до работающего приложения

### Windows

1. **Откройте PowerShell/CMD в папке проекта**
   ```bash
   cd "g:\puniversiti\diplom project"
   ```

2. **Запустите стартовый скрипт**
   ```bash
   start.bat
   ```

3. **Дождитесь открытия браузера** на `http://localhost:3000`

### macOS/Linux

1. **Откройте терминал в папке проекта**
   ```bash
   cd ~/path/to/diplom\ project
   ```

2. **Дайте права на выполнение и запустите**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

3. **Откройте браузер** на `http://localhost:3000`

## Ручной запуск (если скрипты не сработали)

### Терминал 1 - Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Терминал 2 - Frontend

```bash
cd frontend
npm install
npm start
```

## Проверка работы

- ✅ Frontend: http://localhost:3000
- ✅ Backend API: http://localhost:5000/api/elements
- ✅ API Health: http://localhost:5000/api/health

## Первые шаги

1. **Создайте сетевой элемент**
   - Нажмите "New Element" слева
   - Заполните форму
   - Нажмите "Create Element"

2. **Добавьте интерфейсы**
   - Выберите элемент из списка
   - Нажмите "Add Interface" справа
   - Заполните данные интерфейса
   - Нажмите "Add Interface"

3. **Редактируйте элемент**
   - Нажмите "Edit"
   - Измените параметры
   - Нажмите "Save Changes"

4. **Удалите интерфейс**
   - Найдите интерфейс в таблице
   - Нажмите ✕ кнопку

## Проблемы?

| Проблема | Решение |
|----------|---------|
| Port 5000 занят | Закройте другие приложения или используйте `netstat -ano \| findstr :5000` |
| npm не найден | Установите Node.js с https://nodejs.org |
| Python не найден | Убедитесь что Python в PATH |
| CORS ошибка | Перезагрузите браузер и оба сервера |

## Документация

- 📖 [README.md](README.md) - Подробное описание
- 📋 [DEPLOYMENT.md](DEPLOYMENT.md) - Развертывание
- 💻 [EXAMPLES.md](EXAMPLES.md) - Примеры API
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - Архитектура
- 📚 [API_DOCS.html](API_DOCS.html) - API документация (откройте в браузере)

## Структура проекта

```
diplom project/
├── backend/           ← Python Flask API
├── frontend/          ← React приложение
├── .vscode/           ← Конфиги VS Code
├── README.md          ← Основная документация
├── DEPLOYMENT.md      ← Инструкция развертывания
├── EXAMPLES.md        ← Примеры использования
├── ARCHITECTURE.md    ← Архитектура системы
├── API_DOCS.html      ← HTML документация API
├── start.bat          ← Стартовый скрипт (Windows)
└── start.sh           ← Стартовый скрипт (Unix)
```

## Что дальше?

После успешного запуска вы можете:

1. ✅ Создавать, редактировать и удалять сетевые элементы
2. ✅ Управлять интерфейсами в табличном формате
3. ✅ Использовать REST API для автоматизации
4. ✅ Интегрировать в другие системы

## Лицензия

MIT - вольно используйте в своих проектах

---

**Нужна помощь?** Обратитесь к документации или посмотрите примеры в EXAMPLES.md
