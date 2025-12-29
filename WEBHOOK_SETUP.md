# Настройка автоматического деплоя через Webhook

## Описание

Сервер автоматически обновляется при push в Git репозиторий через webhook endpoint.

## Настройка на сервере

1. Установите `WEBHOOK_SECRET` в `.env` файле бэкенда:

```bash
ssh root@137.184.225.187
cd /var/www/panda-express-dashboard/backend
nano .env
```

Добавьте строку:
```
WEBHOOK_SECRET=your-super-secret-webhook-key-change-this
```

2. Убедитесь, что скрипт `deploy-webhook.sh` исполняемый:

```bash
chmod +x /var/www/panda-express-dashboard/deploy-webhook.sh
```

3. Перезапустите бэкенд:

```bash
pm2 restart panda-backend
```

## Настройка в GitHub

1. Перейдите в ваш репозиторий на GitHub
2. Settings → Webhooks → Add webhook
3. Заполните:
   - **Payload URL**: `http://137.184.225.187/api/deploy/webhook?secret=your-super-secret-webhook-key-change-this`
   - **Content type**: `application/json`
   - **Secret**: (оставьте пустым, секрет передается в URL)
   - **Which events**: выберите "Just the push event"
   - **Active**: ✓

4. Нажмите "Add webhook"

## Настройка в GitLab

1. Перейдите в ваш проект на GitLab
2. Settings → Webhooks
3. Заполните:
   - **URL**: `http://137.184.225.187/api/deploy/webhook?secret=your-super-secret-webhook-key-change-this`
   - **Trigger**: выберите "Push events"
   - **Secret token**: (оставьте пустым)

4. Нажмите "Add webhook"

## Альтернативный способ (через заголовок)

Вместо передачи секрета в URL, можно использовать заголовок `X-Webhook-Secret`:

**Payload URL**: `http://137.184.225.187/api/deploy/webhook`

В настройках webhook добавьте заголовок:
- **Name**: `X-Webhook-Secret`
- **Value**: `your-super-secret-webhook-key-change-this`

## Тестирование

Протестируйте webhook вручную:

```bash
curl -X POST http://137.184.225.187/api/deploy/webhook \
  -H "X-Webhook-Secret: your-super-secret-webhook-key-change-this" \
  -H "Content-Type: application/json"
```

Или через URL параметр:

```bash
curl -X POST "http://137.184.225.187/api/deploy/webhook?secret=your-super-secret-webhook-key-change-this" \
  -H "Content-Type: application/json"
```

## Что происходит при деплое

1. Git pull последних изменений
2. Установка зависимостей бэкенда
3. Сборка бэкенда (TypeScript → JavaScript)
4. Перезапуск PM2 процесса
5. Установка зависимостей фронтенда
6. Сборка фронтенда для production
7. Перезагрузка nginx

## Безопасность

⚠️ **Важно**: 
- Используйте сложный секретный ключ
- Не коммитьте `.env` файл с секретами
- Рассмотрите использование HTTPS для webhook (требует SSL сертификат)

## Логи

Проверить логи деплоя:

```bash
ssh root@137.184.225.187
pm2 logs panda-backend
```


