# 🌿 EcoSpatial 3D

> **Real-time 3D моніторинг якості повітря** — геопросторова платформа для відстеження даних екологічних датчиків по Києву у тривимірному просторі.

<div align="center">

![3D Buildings View](docs/screenshots/3d_buildings.png)

</div>

---

## ✨ Можливості

- 📡 **Live WebSocket** — дані з датчиків оновлюються в реальному часі
- 🏙️ **3D будівлі** — векторні PBF тайли від MapTiler, рендер через DeckGL `MVTLayer`
- 📊 **5 метрик**: PM2.5, PM10, CO₂, Температура, Вологість
- 🎨 **3 теми карти**: Нічна (CartoDB Dark), Денна (CartoDB Light), Супутник (ESRI)
- 📈 **3D ColumnLayer** — висота стовпця = рівень забруднення, колір = ступінь небезпеки
- 🖥️ **Pitch 45°** — повноцінний 3D ефект з нахилом камери

---

## 🖼️ Скриншоти

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/3d_buildings.png" alt="3D будівлі + датчики (Ніч)" />
      <br /><sub><b>3D будівлі + датчики якості повітря · Нічна тема</b></sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/satellite_view.png" alt="Супутниковий вигляд" />
      <br /><sub><b>Супутниковий вигляд (ESRI) · 3D будівлі увімкнено</b></sub>
    </td>
  </tr>
</table>

---

## 🏗️ Архітектура

```
EcoSpatial-3D/
├── api/                    # NestJS backend — REST API + WebSocket gateway
│   ├── src/
│   │   ├── sensors/        # CRUD датчиків, геолокація
│   │   ├── live-data/      # WebSocket gateway (Socket.io)
│   │   ├── generator/      # Симулятор даних (Cron scheduler)
│   │   └── prisma/         # Prisma ORM сервіс
│   └── prisma/
│       └── schema.prisma   # Схема БД (PostgreSQL + PostGIS)
│
└── frontend/               # React + Vite + DeckGL
    └── src/
        ├── components/
        │   ├── Map3D.tsx           # Головна 3D карта
        │   └── LayerSwitcher.tsx   # Перемикач шарів/теми
        └── store/
            └── useSensorStore.ts   # Zustand store + Socket.io клієнт
```

---

## 🛠️ Стек технологій

### Backend — `api/`

| Технологія | Версія | Призначення |
|---|---|---|
| **NestJS** | 11 | Node.js framework, модульна архітектура |
| **Prisma** | 7 | ORM, міграції, type-safe запити |
| **PostgreSQL + PostGIS** | 15 + 3.3 | Реляційна БД з геопросторовими розширеннями |
| **Socket.io** | 4 | WebSocket gateway для Live Data |
| **Redis** | 7 | Кешування, pub/sub для WebSocket |
| **@nestjs/schedule** | 6 | Cron-задачі для генератора даних |

### Frontend — `frontend/`

| Технологія | Версія | Призначення |
|---|---|---|
| **React** | 19 | UI framework |
| **Vite** | 8 | Bundler + dev server |
| **TypeScript** | 6 | Type safety |
| **DeckGL** | 9.3 | WebGL 3D рендеринг шарів |
| **MVTLayer** (`@deck.gl/geo-layers`) | 9.3 | Нативний рендер PBF векторних тайлів |
| **ColumnLayer** (`@deck.gl/layers`) | 9.3 | 3D стовпці датчиків |
| **MapLibre GL JS** | 6 | Рендер базових карт (растер) |
| **react-map-gl** | 8 | React обгортка для MapLibre |
| **Zustand** | 5 | Глобальний state (метрики, тема, WebSocket) |
| **Socket.io-client** | 4 | Підключення до WebSocket gateway |

### Infrastructure — `docker-compose.yml`

| Сервіс | Image | Порт |
|---|---|---|
| **PostgreSQL + PostGIS** | `postgis/postgis:15-3.3` | `5432` |
| **Redis** | `redis:7-alpine` | `6379` |
| **PgAdmin** | `dpage/pgadmin4` | `5050` |

### Зовнішні API

| Сервіс | Призначення |
|---|---|
| **MapTiler** (vector tiles) | 3D будівлі — PBF тайли OpenMapTiles v3 |
| **CartoDB** (raster tiles) | Базові карти Dark / Light (безкоштовно, без ключа) |
| **ESRI ArcGIS** (raster tiles) | Супутниковий шар (безкоштовно, без ключа) |

---

## 🚀 Запуск

### 1. Вимоги

- [Node.js](https://nodejs.org/) ≥ 20
- [Bun](https://bun.sh/) ≥ 1.3
- [Docker + Docker Compose](https://www.docker.com/)
- [MapTiler API Key](https://cloud.maptiler.com/) — безкоштовний акаунт (100k tiles/місяць)

---

### 2. Інфраструктура (PostgreSQL + Redis)

```bash
# В корені проекту EcoSpatial-3D/
docker compose up -d
```

Перевірте що сервіси запущені:
```bash
docker compose ps
```

---

### 3. Backend (NestJS API)

```bash
cd api/
```

Створіть файл `api/.env`:
```env
DATABASE_URL="postgresql://eco_user:eco_password@localhost:5432/ecospatial?schema=public"
```

Встановіть залежності та запустіть міграції:
```bash
bun install
bunx prisma migrate deploy
bunx prisma db seed    # Заповнення початковими даними датчиків
```

Запуск у dev режимі (з hot-reload):
```bash
bun run start:dev
```

API буде доступне на: **http://localhost:3000**

---

### 4. Frontend (React + Vite)

```bash
cd frontend/
```

Створіть файл `frontend/.env`:
```env
VITE_MAPTILER_KEY=ваш_maptiler_api_ключ
```

> 💡 Отримайте безкоштовний ключ на [cloud.maptiler.com](https://cloud.maptiler.com/) — 100 000 tile requests/місяць безкоштовно.

Встановіть залежності та запустіть:
```bash
bun install
bun run dev
```

Відкрийте в браузері: **http://localhost:5173**

---

### 5. (Опціонально) PgAdmin

PgAdmin для перегляду геоданих доступний на **http://localhost:5050**

```
Email:    admin@ecospatial.com
Password: admin
```

---

## 🗺️ Керування картою

| Дія | Результат |
|---|---|
| Прокрутка колесом миші | Зум карти |
| Утримання лівої кнопки + перетягування | Переміщення камери |
| Утримання правої кнопки + перетягування | Обертання / зміна pitch |
| Наведення на стовпець датчика | Тултип з усіма метриками |
| **Аналітичний шар** (лівий панель) | Перемикання активної метрики |
| **Ніч / День / Супутник** (правий панель) | Зміна базової карти |
| **3D Будівлі** (перемикач) | Вмикає/вимикає 3D будівлі з PBF тайлів |

> 📍 **3D будівлі видно при зумі ≥ 13.** За замовчуванням карта відкривається з zoom=14 над центром Києва.

---

## 🔌 WebSocket Events

| Event | Напрямок | Опис |
|---|---|---|
| `connection` | client → server | Підключення клієнта |
| `latest-measurements` | server → client | Broadcast останніх показників усіх датчиків |

Дані оновлюються кожні **5 секунд** через Cron-генератор.

---

## 📁 Змінні середовища

### `api/.env`
```env
DATABASE_URL="postgresql://eco_user:eco_password@localhost:5432/ecospatial?schema=public"
```

### `frontend/.env`
```env
VITE_MAPTILER_KEY=your_maptiler_api_key
```

---

## 📄 Ліцензія

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0)

Цей проект ліцензовано за умовами ліцензії **PolyForm Noncommercial 1.0.0**. 

Ви можете вільно використовувати, змінювати та поширювати цей продукт у **некомерційних** цілях (наприклад, для навчання, досліджень або власних потреб). **Комерційне використання заборонено**. Детальніше дивіться у файлі [LICENSE](LICENSE.md).

Для комерційного використання зв'яжіться з автором.

Copyright © 2026 Farizov Maxim
