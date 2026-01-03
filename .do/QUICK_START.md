# Быстрый старт - DigitalOcean App Platform

Если при создании приложения через веб-интерфейс вы видите ошибку "No components detected", это нормально для монорепозитория. Используйте один из способов ниже:

## Способ 1: CLI (Рекомендуется) ⭐

Самый простой способ - использовать командную строку:

```bash
# 1. Установите doctl (если еще не установлен)
# macOS:
brew install doctl

# 2. Авторизуйтесь
doctl auth init

# 3. Создайте приложение из app.yaml
doctl apps create --spec .do/app.yaml
```

После этого приложение будет создано со всеми компонентами из конфигурации.

## Способ 2: Веб-интерфейс (Если CLI не подходит)

1. Перейдите в [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Нажмите "Create App"
3. Выберите "GitHub" как источник
4. Подключите репозиторий `olegkuftyrev/1020`
5. **Пропустите** автоматическое обнаружение (если видите "No components detected" - это нормально)
6. Нажмите на кнопку **"Edit Spec"** или **"Edit YAML"** (обычно справа вверху)
7. Скопируйте содержимое файла `.do/app.yaml` и вставьте в редактор
8. Нажмите "Save"
9. Перейдите в "Settings" → "App-Level Environment Variables" и добавьте secrets:
   - `AUTH_PASSWORD` (type: SECRET)
   - `APP_KEY` (type: SECRET, минимум 32 символа)
   - `WEBHOOK_SECRET` (type: SECRET, опционально)
10. Нажмите "Create Resources" или "Deploy"

## Важно

После создания приложения через CLI или веб-интерфейс, не забудьте:
1. Добавить secrets в Settings
2. Дождаться завершения первого деплоя

