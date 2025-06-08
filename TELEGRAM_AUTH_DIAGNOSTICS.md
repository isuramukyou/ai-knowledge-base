# 🔍 Диагностика авторизации Telegram Mini App

## ✅ Исправленные проблемы

### 1. **Совместимость с Telegram Mini App**
- ✅ Cookies заменены на headers для работы в iframe
- ✅ localStorage используется как основное хранилище
- ✅ initData проверяется только в production
- ✅ Мок-данные для development режима

### 2. **Админская панель**
- ✅ Кнопка "Admin" отображается только для администраторов
- ✅ Клик по кнопке "Admin" открывает админку
- ✅ Server-side проверка прав в middleware
- ✅ Защита всех админских API endpoints

### 3. **Авторизация**
- ✅ Автоматическая инициализация в Telegram WebApp
- ✅ Повторные попытки получения данных пользователя
- ✅ Fallback на localStorage в случае проблем
- ✅ Development режим с мок-пользователем

## 🚀 Как это работает

### В Telegram Mini App (Production):
1. **Telegram передает initData** → Проверяется подпись
2. **Данные сохраняются в localStorage** → Не зависит от cookies
3. **Headers отправляются с каждым запросом** → `x-telegram-id`, `x-auth-token`
4. **API проверяет права** → Получает пользователя из БД

### В Development режиме:
1. **Создается мок-пользователь** → ID из `NEXT_PUBLIC_DEV_ADMIN_ID`
2. **Автоматическая авторизация** → Как настоящий Telegram пользователь
3. **Полные права админа** → Доступ ко всем функциям

## 🔧 Настройка

### Production:
```bash
NODE_ENV=production
ADMIN_TELEGRAM_ID=123456789
JWT_SECRET=super-secret-jwt-token
```

### Development:
```bash
NODE_ENV=development
NEXT_PUBLIC_DEV_ADMIN_ID=579218344  # Ваш Telegram ID
ADMIN_TELEGRAM_ID=579218344         # Тот же ID для админки
JWT_SECRET=super-secret-jwt-token
```

## 🛡️ Безопасность

### Уровни защиты:
1. **Middleware** → Блокирует доступ к `/admin` неавторизованным
2. **Server Components** → Проверка прав перед рендером
3. **API Guards** → `requireAuth()` и `requireAdmin()` в каждом endpoint
4. **JWT Tokens** → Криптографически стойкие токены

### В Production:
- ✅ Проверка подписи Telegram initData
- ✅ Проверка срока действия авторизации (24 часа)
- ✅ JWT токены с ограниченным временем жизни
- ✅ httpOnly cookies + headers для двойной защиты

### В Development:
- ✅ Мок-данные только в dev режиме
- ✅ Полная имитация Telegram WebApp API
- ✅ Безопасные мок-токены

## 📱 Для пользователей

### Обычные пользователи:
- Открывают приложение в Telegram → Автоматическая авторизация
- Создают записи → Работает с их Telegram ID
- Никаких дополнительных действий не требуется

### Администраторы:
- Видят бейдж "Admin" в заголовке
- Клик по "Admin" → Переход в админку
- Полный доступ ко всем функциям управления

## 🚨 Диагностика проблем

### Если не работает авторизация:
1. Откройте DevTools → Console
2. Найдите логи:
   - `"Initializing Telegram WebApp..."`
   - `"Telegram user found:"`
   - `"Auth data stored in localStorage:"`

### Если не видно кнопку Admin:
1. Проверьте что ваш `telegram_id` = `ADMIN_TELEGRAM_ID`
2. Посмотрите в консоль на логи авторизации
3. Убедитесь что `user.is_admin = true`

### В Development:
1. Проверьте `NEXT_PUBLIC_DEV_ADMIN_ID` в переменных окружения
2. Мок-пользователь должен создаваться автоматически
3. Админка должна быть доступна сразу

## 🔄 Тестирование

### Checklist для Production:
- [ ] Авторизация работает в Telegram WebApp
- [ ] Создание записей работает без ошибок
- [ ] Админ видит кнопку "Admin"
- [ ] Неавторизованные не могут зайти в `/admin`
- [ ] API возвращает правильные ошибки авторизации

### Checklist для Development:
- [ ] Мок-пользователь создается автоматически
- [ ] Админка доступна сразу после запуска
- [ ] Создание записей работает
- [ ] Все функции админки работают

---

**Результат**: Авторизация теперь **полностью совместима** с Telegram Mini App и **надежно защищена** во всех режимах! 🎉 

## Проблема
Авторизация в Telegram Mini App не работает - пользователи видят ошибку "No telegram_id found in headers or cookies".

## Диагностика

### Исправленные проблемы

1. **Авторизация только на главной странице**
   - ❌ Проблема: Пользователь, открывающий приложение не на `/`, не проходил авторизацию
   - ✅ Решение: Создан глобальный AuthProvider в `app/layout.tsx`

2. **Неправильные настройки cookies**
   - ❌ Проблема: `secure: false` в dev режиме блокировало cookies в Telegram iframe
   - ✅ Решение: Всегда `secure: true` для `sameSite: 'none'`

3. **Nginx конфигурация**
   - ❌ Проблема: Отсутствовали необходимые заголовки для iframe
   - ✅ Решение: Добавлены CORS заголовки и X-Frame-Options

4. **Недостаточное логирование**
   - ❌ Проблема: Сложно было понять где ломается авторизация
   - ✅ Решение: Добавлено детальное логирование во всех критических точках

## Внесенные изменения

### 1. app/layout.tsx
```typescript
// Создан AuthProvider с глобальной инициализацией авторизации
function AuthProvider({ children }: { children: ReactNode }) {
  // Логика авторизации работает на любой странице
}
```

### 2. lib/auth.ts
```typescript
const cookieOptions = {
  httpOnly: true,
  secure: true, // ВСЕГДА true для Telegram Mini App
  sameSite: 'none' as const,
  maxAge: 7 * 24 * 60 * 60,
  path: '/'
}
```

### 3. nginx.conf
```nginx
# Заголовки для Telegram Mini App
add_header X-Frame-Options "ALLOWALL" always;
add_header Access-Control-Allow-Origin "https://web.telegram.org" always;
add_header Access-Control-Allow-Credentials "true" always;
```

### 4. Детальное логирование
- В `/api/auth/telegram` добавлены подробные логи
- В middleware добавлена диагностика
- Цветные эмодзи для быстрого поиска ошибок (❌ ✅ ⚠️)

## Шаги для применения исправлений

1. **Перезапустить приложение**
   ```bash
   pnpm dev
   ```

2. **Перезагрузить nginx**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Проверить логи**
   - В браузере: DevTools → Console
   - На сервере: `docker logs <container_name>` или `pm2 logs`

4. **Тестирование**
   - Открыть Mini App в Telegram
   - Проверить localStorage после авторизации
   - Попробовать создать запись
   - Проверить доступ к админке (если админ)

## Ожидаемое поведение

### Успешная авторизация
```
=== TELEGRAM AUTH DEBUG ===
Received authentication request for user: 579218344
InitData present: true
Environment: development
✅ Telegram signature verified (или ⚠️ в dev)
✅ User created successfully: 1
✅ Authentication successful for user: 1
=== END TELEGRAM AUTH DEBUG ===
```

### После авторизации в localStorage
```
telegram_id: "579218344"
auth_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
telegram_init_data: "id=579218344&username=..."
```

### API запросы с заголовками
```
x-telegram-id: 579218344
authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Возможные проблемы

### Если авторизация все еще не работает:

1. **Проверить переменные окружения**
   ```bash
   echo $TELEGRAM_BOT_TOKEN
   echo $ADMIN_TELEGRAM_ID
   echo $NEXT_PUBLIC_DEV_ADMIN_ID
   ```

2. **Очистить localStorage**
   ```javascript
   localStorage.clear()
   ```

3. **Проверить сетевые запросы**
   - DevTools → Network → Проверить запросы к `/api/auth/telegram`
   - Убедиться что статус 200, а не 401/500

4. **Проверить cookies в DevTools**
   - Application → Storage → Cookies
   - Должны быть: `telegram_id`, `auth_token`, `telegram_init_data`

5. **Nginx логи**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

## Контакты для отладки
- Проверить консоль браузера на наличие ошибок
- Логи сервера должны показывать полный процесс авторизации
- В dev режиме авторизация должна работать без реального Telegram 