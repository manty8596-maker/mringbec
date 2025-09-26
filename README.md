# MR.ING API Server

Отдельный API сервер для MR.ING магазина.

## Деплой на Railway

1. Создайте аккаунт на [Railway.app](https://railway.app)
2. Подключите GitHub репозиторий
3. Выберите папку `api-server`
4. Добавьте переменные окружения:
   - `EMAIL_USER` - ваш Gmail
   - `EMAIL_PASS` - пароль приложения Gmail
   - `EMAIL_TO` - email для уведомлений

## Деплой на Render

1. Создайте аккаунт на [Render.com](https://render.com)
2. Создайте новый Web Service
3. Подключите GitHub репозиторий
4. Укажите:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `api-server`

## Локальный запуск

```bash
cd api-server
npm install
npm start
```

## API Endpoints

- `GET /` - информация о сервере
- `GET /healthz` - проверка здоровья
- `POST /submit-order` - отправка заказа
- `POST /api/submit-order` - отправка заказа (альтернативный путь)
