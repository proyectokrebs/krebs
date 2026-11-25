# Krebs

Prototipo de aplicación web para el **seguimiento y acompañamiento de pacientes con
cáncer gástrico**. Pensado para integrarse más adelante con los sistemas de Keralty.

> **Krebs es una herramienta de apoyo. No diagnostica, no interpreta resultados ni
> reemplaza la consulta con su médico.** Usa únicamente datos sintéticos o
> anonimizados; nunca datos reales de pacientes.

## Arquitectura

- **Backend:** API REST en FastAPI sobre SQLite (`backend/`).
- **Frontend:** aplicación Next.js (App Router, TypeScript) en `frontend/`.
- La capa de datos depende solo de la interfaz `FuenteDatos`, de modo que SQLite se
  puede reemplazar por los sistemas de Keralty sin tocar los endpoints ni el
  frontend (ver `backend/app/datos/fuente_keralty.py`).

## Qué ofrece

1. **Historia clínica** (todos los roles) — datos del paciente, contexto clínico,
   síntomas tal como los reportó el paciente y línea de tiempo con hitos, reportes,
   resultados y citas.
2. **Síntomas** — el paciente agrega los síntomas que presenta.
3. **Resultados e imágenes** — el médico agrega resultados de exámenes e imágenes
   diagnósticas. El sistema genera además resultados sintéticos a partir de los
   exámenes/hitos ya realizados.
4. **Citas** — el call center asigna, reprograma y cancela citas (simulador de
   agenda).

### Roles y permisos (header `X-Rol`)

El acceso se controla por el header `X-Rol`. Las operaciones de escritura exigen el
rol correspondiente; si falta o no corresponde, la API responde **403**. La lectura
de la historia clínica está disponible para cualquier rol.

| Rol           | `X-Rol`       | Puede escribir                         |
| ------------- | ------------- | -------------------------------------- |
| Paciente      | `paciente`    | Síntomas y reportes                    |
| Médico        | `medico`      | Resultados de exámenes e imágenes      |
| Call center   | `call_center` | Asignar, reprogramar y cancelar citas  |

En el frontend el rol se elige en el **menú arriba a la izquierda**; el valor se
guarda y se envía en cada petición.

## Requisitos

- Python 3.10 o superior (para el backend).
- Node.js 18 o superior y `pnpm` (para el frontend).

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Importar el libro Excel a SQLite y generar resultados sintéticos.
# Recrea datos/krebs.db desde cero (idempotente).
python -m scripts.importar_excel

# Levantar la API (http://localhost:8000, docs en /docs).
uvicorn app.main:app --reload
```

### Datos

- **Libro Excel** sintético en
  `datos/Base sintetica - TPI Proyecto Krebs Cancer Gastrico.xlsx`.
- **Base SQLite** generada en `datos/krebs.db`.
- **Imágenes** (opcional): archivos JPG/PNG en `datos/imagenes/`. El médico puede
  registrar la referencia a una imagen desde el frontend; el archivo debe existir en
  esa carpeta para que se muestre.

La carpeta `datos/` no se versiona.

## Frontend

```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:3000
```

La URL de la API se configura con `NEXT_PUBLIC_API_URL` (por defecto
`http://localhost:8000/api`, ya definido en `frontend/.env.local`). El backend
permite CORS desde `http://localhost:3000`.

## Estructura del proyecto

```
backend/
  app/
    main.py            Aplicación FastAPI
    rutas.py           Endpoints (lectura y escritura con control de rol)
    roles.py           Control de acceso por header X-Rol (403)
    esquemas.py        Esquemas Pydantic de entrada/salida
    db.py              Esquema SQLite (pacientes, citas, resultados, …)
    datos/
      modelos.py       Dataclasses de dominio
      fuente.py        Interfaz abstracta FuenteDatos
      fuente_sqlite.py Implementación sobre SQLite
      fuente_keralty.py Stub de la integración con Keralty
  scripts/
    importar_excel.py  Importa el Excel y genera resultados sintéticos
frontend/
  app/
    layout.tsx         Layout con la barra y el menú de rol (arriba a la izq.)
    page.tsx           Selector de paciente y navegación de secciones
    vistas/            Historia, Síntomas, Resultados, Citas
  lib/
    api.ts             Cliente HTTP (envía X-Rol)
    roles.ts           Catálogo de roles y permisos
    RolContexto.tsx    Estado global del rol activo
    tipos.ts           Tipos compartidos con la API
datos/                 Datos de entrada y base SQLite (NO versionados)
```

## Integración futura con Keralty

Las rutas y el frontend dependen solo de la interfaz `FuenteDatos`. Para conectar los
sistemas de Keralty se completa `FuenteKeralty(FuenteDatos)` y se cambia la fuente
activa en `backend/app/rutas.py` (`obtener_fuente`). El resto no cambia.

## Privacidad

- La carpeta `datos/` está excluida del control de versiones (`.gitignore`).
- Use solo datos sintéticos o anonimizados. No suba datos reales de pacientes.
