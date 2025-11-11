# Diario de Trading

Aplicación web full-stack (Node.js + Angular) para planificar, ejecutar y analizar operaciones de trading fomentando la mejora continua.

## Características principales

- **Backend Node.js (Express + Prisma)** con autenticación JWT, gestión de usuarios, cuentas, setups y etiquetas.
- Ciclo completo de operaciones: planificación, registro de eventos (ENTRY, ADD, REDUCE, MOVE_SL, MOVE_TP, EXIT, NOTE), cierre con cálculo de PnL, múltiplos de R y validación del plan.
- **Reportes** con métricas clave (win rate, R medio, expectativa, drawdown, curva de capital) y detección de desvíos frecuentes.
- **Políticas de riesgo por usuario** (riesgo por trade, pérdida diaria, consecutiva y tiempo máximo) y alertas.
- **Exportación CSV** de operaciones.
- **Frontend Angular SPA** con pantallas para login/signup, dashboard, listado filtrable de trades, planificación con cálculo R/R en vivo, detalle con timeline, gestión de catálogos (setups, etiquetas, cuentas) y reglas de riesgo.
- Preparado para despliegue en contenedores Docker.
- Pruebas unitarias (Vitest) para los cálculos críticos de R múltiplos y cumplimiento de plan.

## Requisitos

- Node.js 20+
- npm 9+
- (Opcional) Docker y Docker Compose v2

## Configuración rápida (modo desarrollo)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

La API quedará disponible en `http://localhost:4000`. El servidor recarga automáticamente con `ts-node-dev`.

### Frontend

```bash
cd frontend
npm install
npm start
```

Angular CLI servirá la SPA en `http://localhost:4200`. El proxy configurado (`proxy.conf.json`) reenvía las peticiones `/api` al backend local.

## Pruebas

```bash
cd backend
npm test
```

Ejecuta Vitest sobre los cálculos de múltiplos de R y verificación de cumplimiento del plan.

## Uso básico

1. Registrarse en `/signup` desde la interfaz web.
2. Configurar setups, etiquetas, cuentas y políticas de riesgo.
3. Planificar nuevas operaciones indicando símbolo, dirección, SL/TP, notas y estado emocional.
4. Registrar eventos durante la ejecución desde el detalle del trade.
5. Cerrar la operación para calcular PnL, múltiplos de R y validar el plan.
6. Revisar el dashboard para analizar métricas globales y desvíos recurrentes.
7. Exportar CSV desde `GET /export/trades.csv` cuando sea necesario.

## Contenedores

```bash
docker compose up --build
```

- Backend: http://localhost:4000
- Frontend: http://localhost:4200

El servicio de backend ejecuta automáticamente `prisma migrate deploy` y persiste la base de datos SQLite en un volumen Docker (`backend-data`).

## Endpoints destacados

- `POST /auth/signup` – Registro de usuarios.
- `POST /auth/login` – Inicio de sesión y emisión de JWT.
- `GET /auth/me` – Datos del usuario autenticado.
- `GET/POST/PUT/DELETE /setups` – Gestión de setups.
- `GET/POST/PUT/DELETE /tags` – Gestión de etiquetas.
- `GET/POST/DELETE /accounts` – Cuentas separadas por usuario.
- `PUT/GET /risk/policy` – Configuración de reglas de riesgo.
- `GET/POST/PUT/DELETE /trades` – Planificación y mantenimiento de trades.
- `POST /trades/{id}/events` – Registro de eventos de ejecución.
- `POST /trades/{id}/close` – Cierre de operaciones y cálculos.
- `GET /reports/overview` – Métricas agregadas y curva de capital.
- `GET /reports/deviations` – Resumen de desvíos más frecuentes.
- `GET /export/trades.csv` – Exportación de operaciones en CSV.

## Credenciales

No se incluyen credenciales predeterminadas. Utiliza `POST /auth/signup` o el formulario de registro para crear un usuario.
