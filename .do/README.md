# DigitalOcean App Platform Configuration

Этот каталог содержит конфигурацию для деплоя на DigitalOcean App Platform.

## Файлы

- `app.yaml` - основная конфигурация приложения для App Platform

## Перед первым деплоем

1. Отредактируйте `app.yaml` и замените:
   - `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` на имя вашего репозитория
   - При необходимости измените `region` (по умолчанию `fra` - Frankfurt)

2. Убедитесь, что все необходимые secrets настроены в DigitalOcean App Platform:
   - `AUTH_PASSWORD`
   - `APP_KEY`
   - `WEBHOOK_SECRET` (опционально)

## Структура конфигурации

### Backend Service

- **Тип:** Web Service (Node.js)
- **Директория:** `/backend`
- **Порт:** 3333
- **Миграции:** Автоматически применяются во время build (`prisma migrate deploy`)

### Frontend Static Site

- **Тип:** Static Site
- **Директория:** `/frontend`
- **Output:** `dist/`
- **API URL:** Настраивается через `VITE_API_URL` (использует `${backend.PUBLIC_URL}/api`)

### Database

- **Тип:** PostgreSQL 15
- **Настройка:** Автоматически создается и подключается к backend

## Альтернативная конфигурация (если нужен один домен)

Если вы хотите, чтобы frontend и backend были на одном домене с проксированием `/api` к backend, вам нужно будет использовать другой подход:

1. Использовать Web Service для frontend (serve static files через Node.js)
2. Или настроить routes вручную через веб-интерфейс DigitalOcean

Текущая конфигурация использует отдельные домены для frontend и backend, что проще в настройке.

## Проверка конфигурации

Перед деплоем проверьте синтаксис YAML:

```bash
# Используя Python (если установлен)
python -c "import yaml; yaml.safe_load(open('.do/app.yaml'))"

# Или используя онлайн YAML валидатор
```

## Дополнительная информация

См. [DIGITALOCEAN_DEPLOY.md](../DIGITALOCEAN_DEPLOY.md) для подробных инструкций по деплою.

