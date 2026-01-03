# Деплой на DigitalOcean App Platform

Этот проект настроен для деплоя на DigitalOcean App Platform как монорепозиторий с двумя компонентами:
- **Backend** - Web Service (AdonisJS API)
- **Frontend** - Static Site (React/Vite)

## Структура проекта

```
/
├── backend/          # Backend API (AdonisJS, TypeScript, Prisma)
├── frontend/         # Frontend App (React, Vite, TypeScript)
└── .do/
    └── app.yaml      # DigitalOcean App Platform конфигурация
```

## Предварительные требования

1. Аккаунт на DigitalOcean
2. GitHub репозиторий с проектом
3. Доступ к DigitalOcean App Platform

## Подготовка к деплою

### 1. Обновление конфигурации

Отредактируйте `.do/app.yaml` и замените следующие значения:

```yaml
github:
  repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
  branch: main
```

### 2. Переменные окружения (Secrets)

В DigitalOcean App Platform нужно будет настроить следующие secrets для backend service:

- `DATABASE_URL` - автоматически создается при создании PostgreSQL базы данных
- `AUTH_PASSWORD` - пароль для аутентификации в приложении
- `APP_KEY` - секретный ключ для AdonisJS (минимум 32 символа, используйте случайную строку)
- `WEBHOOK_SECRET` - секрет для webhook endpoints (опционально)

**Важно:** `DATABASE_URL` будет автоматически настроен через `${db.DATABASE_URL}`, но остальные secrets нужно добавить вручную в панели управления App Platform.

## Деплой через DigitalOcean Console

### Шаг 1: Создание приложения

1. Зайдите в [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Нажмите "Create App"
3. Выберите ваш GitHub репозиторий
4. Выберите ветку (обычно `main`)

### Шаг 2: Загрузка конфигурации

1. DigitalOcean автоматически обнаружит файл `.do/app.yaml`
2. Или выберите "Edit Spec" и вставьте содержимое `.do/app.yaml`

### Шаг 3: Настройка Secrets

В разделе "Settings" → "App-Level Environment Variables" добавьте:

- `AUTH_PASSWORD` - ваш пароль для аутентификации
- `APP_KEY` - сгенерируйте случайную строку (минимум 32 символа)
- `WEBHOOK_SECRET` - опционально, для webhook endpoints

### Шаг 4: Создание базы данных

База данных PostgreSQL будет автоматически создана согласно конфигурации в `app.yaml`. 

**Примечание:** Если вы хотите использовать существующую базу данных, измените конфигурацию:

```yaml
databases:
  - name: db
    engine: PG
    production: true
    version: "15"
```

### Шаг 5: Деплой

1. Нажмите "Create Resources" или "Deploy"
2. Дождитесь завершения деплоя всех компонентов

## Деплой через CLI

### Установка doctl

```bash
# macOS
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-1.94.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

### Авторизация

```bash
doctl auth init
```

### Создание приложения

```bash
doctl apps create --spec .do/app.yaml
```

### Обновление приложения

```bash
# Получите ID приложения
doctl apps list

# Обновите приложение
doctl apps update <APP_ID> --spec .do/app.yaml
```

## Настройка после деплоя

### Получение URL компонентов

После деплоя вы получите URL для каждого компонента:
- Frontend: `https://your-frontend-name.ondigitalocean.app`
- Backend: `https://your-backend-name.ondigitalocean.app`

### Настройка CORS (если нужно)

Если frontend и backend на разных доменах, убедитесь что CORS настроен правильно в backend. В текущей конфигурации CORS разрешает все источники (`*`).

### Проверка работы

1. Откройте frontend URL в браузере
2. Проверьте, что аутентификация работает
3. Проверьте API endpoints через backend URL

## Мониторинг и логи

### Просмотр логов

```bash
# Логи backend
doctl apps logs <APP_ID> --component backend --type run

# Логи frontend build
doctl apps logs <APP_ID> --component frontend --type build
```

Или используйте веб-интерфейс DigitalOcean для просмотра логов.

### Health Checks

Backend настроен с health check на `/api/auth/verify`. App Platform будет автоматически проверять состояние сервиса.

## Обновление приложения

### Автоматический деплой

Согласно конфигурации, автоматический деплой включен при push в ветку `main`:

```yaml
deploy_on_push: true
```

### Ручной деплой

Вы можете запустить деплой вручную через веб-интерфейс DigitalOcean или CLI:

```bash
doctl apps create-deployment <APP_ID>
```

## Структура компонентов

### Backend Service

- **Source Directory:** `/backend`
- **Build Command:** `npm ci && npx prisma migrate deploy && npm run build`
- **Run Command:** `npm start`
- **Port:** 3333
- **Health Check:** `/api/auth/verify`

### Frontend Static Site

- **Source Directory:** `/frontend`
- **Build Command:** `npm ci && npm run build`
- **Output Directory:** `dist`
- **API URL:** Настраивается через переменную окружения `VITE_API_URL`

## Миграции базы данных

Миграции Prisma выполняются автоматически во время build процесса backend:

```yaml
build_command: npm ci && npx prisma migrate deploy && npm run build
```

Это означает, что все pending миграции будут применены при каждом деплое.

**Важно:** Убедитесь, что все миграции протестированы локально перед деплоем.

## Переменные окружения

### Backend (Runtime)

- `NODE_ENV=production`
- `PORT=3333`
- `HOST=0.0.0.0`
- `DATABASE_URL` - из базы данных
- `AUTH_PASSWORD` - секрет
- `APP_KEY` - секрет
- `WEBHOOK_SECRET` - секрет
- `LOG_LEVEL=info`

### Frontend (Build Time)

- `VITE_API_URL` - автоматически устанавливается на `${backend.PUBLIC_URL}/api`

**Примечание:** Если переменная `${backend.PUBLIC_URL}` не работает во время сборки frontend (это может произойти при первом деплое), вы можете:
1. Оставить `VITE_API_URL` пустым или не задавать - тогда будет использоваться относительный путь `/api`
2. Указать полный URL backend вручную после первого деплоя
3. Использовать routes в App Platform для проксирования (требует дополнительной настройки)

## Troubleshooting

### Backend не запускается

1. Проверьте логи: `doctl apps logs <APP_ID> --component backend`
2. Убедитесь, что все secrets настроены
3. Проверьте, что DATABASE_URL правильный
4. Убедитесь, что миграции применены успешно

### Frontend не может подключиться к API

1. Проверьте, что `VITE_API_URL` правильно настроен
2. Проверьте CORS настройки в backend
3. Проверьте, что backend service работает и доступен

### Ошибки миграций

1. Проверьте логи build процесса
2. Убедитесь, что база данных доступна
3. Проверьте, что все миграции в репозитории актуальны

## Масштабирование

Для масштабирования измените конфигурацию в `app.yaml`:

```yaml
services:
  - name: backend
    instance_count: 2  # Увеличьте количество инстансов
    instance_size_slug: basic-xs  # Увеличьте размер инстанса
```

Или используйте веб-интерфейс DigitalOcean для изменения масштаба.

## Стоимость

Примерная стоимость на DigitalOcean App Platform:
- Backend Service (basic-xxs): ~$5/месяц
- Frontend Static Site: бесплатно (или ~$3/месяц для кастомного домена)
- PostgreSQL Database (basic): ~$15/месяц

**Итого:** ~$20-23/месяц для базовой конфигурации

## Полезные ссылки

- [DigitalOcean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [doctl CLI Documentation](https://docs.digitalocean.com/reference/doctl/)

