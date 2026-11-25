# Krebs

Prototipo para el **seguimiento y acompañamiento de pacientes con cáncer gástrico**.
Pensado para integrarse más adelante con los sistemas de la EPS.

> **Krebs es una herramienta de apoyo. No diagnostica, no interpreta resultados ni
> reemplaza la consulta con su médico.** Usa únicamente datos sintéticos o
> anonimizados; nunca datos reales de pacientes.

## Arquitectura

Tres piezas sobre un mismo backend:

- **Backend** — API REST en FastAPI sobre SQLite (`backend/`).
- **App móvil del paciente** — React + Vite + Tailwind (`Figma/`). Onboarding,
  hub de herramientas y las funciones del paciente. Pensada para teléfono.
- **Panel de escritorio** — Next.js (App Router, TypeScript) en `frontend/`. Vista
  operativa para **médico** y **call center**. Pensado para PC.

La capa de datos del backend depende solo de la interfaz `FuenteDatos`, de modo que
SQLite se puede reemplazar por los sistemas de la EPS sin tocar los endpoints ni los
frontends (ver `backend/app/datos/fuente_keralty.py`).

```
App móvil (Figma, paciente)  ─┐
                              ├─►  Backend FastAPI  ─►  SQLite (datos sintéticos)
Panel web (frontend, médico/ ─┘
           call center)
```

## Roles y permisos (header `X-Rol`)

El acceso se controla con el header `X-Rol`. Las escrituras exigen el rol
correspondiente; si falta o no corresponde, la API responde **403**. La lectura de
la historia clínica está disponible para cualquier rol.

| Rol         | `X-Rol`       | Puede escribir                              | Dónde vive        |
| ----------- | ------------- | ------------------------------------------- | ----------------- |
| Paciente    | `paciente`    | Autorreporte de síntomas                    | App móvil         |
| Médico      | `medico`      | Resultados de exámenes, imágenes, reportes  | Panel de escritorio |
| Call center | `call_center` | Asignar, reprogramar y cancelar citas       | Panel de escritorio |

## Funcionalidades

### App móvil del paciente (`Figma/`)

- **Onboarding / autorización**: bienvenida, consentimientos (información de salud,
  personalización, notificaciones) y aceptación de términos.
- **Recorrido guiado** del hub de herramientas.
- **Mi proceso**: ruta de atención (vía clínica Colombia), gráficas de evolución
  (tumoral, marcador CEA, nutricional, hemoglobina) en vista mensual/semestral,
  línea de tiempo e historia clínica.
- **¿Cómó te sientes?**: autorreporte de síntomas con lista cerrada; al registrar,
  devuelve un semáforo de gestión (verde/ámbar/rojo) con mensaje de autocuidado.
- **Preguntas**: chatbot **simulado** (guion por palabras clave; la mascota cambia
  de expresión según la respuesta; deriva a "Solicitar cita" o "Llama 123").
- **Conecta**: grupos de apoyo y fundaciones de cáncer en Colombia (enlaces a sitios
  oficiales).
- El isotipo central de la barra inferior cambia según la sección abierta.

### Panel de escritorio (`frontend/`, médico / call center)

- **Historia clínica**: datos del paciente, contexto, ruta de atención (stepper),
  síntomas y línea de tiempo.
- **Evolución clínica**: gráfico de líneas + tabla de promedios mensuales de las 4
  series sintéticas.
- **Síntomas** (lectura), **Reportes médicos**, **Resultados e imágenes** (alta del
  médico).
- **Citas**: gestión del call center (asignar / reprogramar / cancelar).
- **Reportes de pacientes**: tablero de triaje del call center con **semáforo**
  (verde: autocuidado · ámbar: reevaluar 24 h · rojo: valoración presencial) y acción
  recomendada, ordenado por prioridad.
- Menú de rol arriba a la izquierda (solo médico y call center).

## Datos sintéticos

Todo proviene del libro Excel sintético y de generadores del backend (idempotentes):

- **Pacientes, contexto, reportes, síntomas, alertas, hitos** (del Excel).
- **Resultados de exámenes** generados a partir de los hitos ya realizados.
- **Mediciones de evolución** (serie diaria ene–jun por paciente: tumoral, CEA,
  nutricional, hemoglobina).
- **Citas** (se crean desde el panel del call center).

El triaje y la ruta de atención son **orden de gestión / contexto**, no una
valoración médica: Krebs no diagnostica.

## Requisitos

- Python 3.10+ (backend).
- Node.js 18+ y `pnpm` (ambos frontends).

## Puesta en marcha

### 1. Backend (siempre primero)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Importar el Excel y generar los datos sintéticos (recrea datos/krebs.db).
python -m scripts.importar_excel

# Escuchar en toda la red (para que el celular alcance la API).
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

API en `http://localhost:8000` · documentación en `/docs`.

### 2. App móvil del paciente

```bash
cd Figma
pnpm install
PORT=8443 pnpm dev
```

- En la PC: `http://localhost:8443`
- En el celular (misma Wi-Fi): `http://<IP-de-tu-PC>:8443` (Vite imprime la IP como
  "Network").

La app detecta sola la URL del backend: usa el mismo host desde el que se abre,
puerto 8000. No hace falta reconfigurar al cambiar de red; solo que el backend corra
en la misma PC. Para forzar otra URL: variable `VITE_API_URL`. Ver `Figma/DEMO.md`.

### 3. Panel de escritorio (médico / call center)

```bash
cd frontend
pnpm install
pnpm dev                                # http://localhost:3000
```

La URL de la API se configura con `NEXT_PUBLIC_API_URL` (por defecto
`http://localhost:8000/api`, en `frontend/.env.local`).

### Red local y firewall

Para abrir la app desde el celular en la misma Wi-Fi, el backend debe escuchar en
`0.0.0.0` y el firewall de la PC permitir los puertos 8000 y 8443. El CORS del
backend ya acepta orígenes de red local (localhost, `192.168.x.x`, `10.x.x.x`,
`172.16–31.x.x`).

## Estructura del proyecto

```
backend/
  app/
    main.py            Aplicación FastAPI (CORS de red local)
    rutas.py           Endpoints (lectura y escritura con control de rol)
    roles.py           Control de acceso por header X-Rol (403)
    triaje.py          Prioridad y semáforo de gestión de síntomas
    ruta.py            Ubicación del paciente en la vía clínica (Colombia)
    esquemas.py        Esquemas Pydantic de entrada/salida
    db.py              Esquema SQLite (pacientes, citas, resultados, mediciones, …)
    datos/
      modelos.py       Dataclasses de dominio
      fuente.py        Interfaz abstracta FuenteDatos
      fuente_sqlite.py Implementación sobre SQLite
      fuente_keralty.py Stub de la integración futura
  scripts/
    importar_excel.py  Importa el Excel y genera datos sintéticos
Figma/                 App móvil del paciente (React + Vite + Tailwind)
  src/
    App.tsx            Onboarding, recorrido y hub
    vistas/            MiProceso, Evolucion, ComoTeSientes, Chatbot, Conecta, Citas
    lib/               api.ts, types.ts
  public/krebs/        Logos, animación de carga y PDF de términos
  DEMO.md              Instrucciones del demo móvil
frontend/              Panel de escritorio (Next.js)
  app/
    layout.tsx         Barra superior y menú de rol
    page.tsx           Selector de paciente y navegación de secciones
    vistas/            Historia, Evolucion, Sintomas, ReportesMedicos,
                       Resultados, Citas, Triaje
  lib/                 api.ts, roles.ts, RolContexto.tsx, tipos.ts
datos/                 Datos de entrada y base SQLite (NO versionados)
Documentacion/         Papers de referencia (ePRO, vía clínica Colombia)
Mockups/ Logos/        Material de diseño
```

## Fundamento

El modelo se apoya en literatura de **ePRO** (electronic patient-reported outcomes)
para monitoreo remoto de síntomas con triaje, y en la **vía clínico-administrativa de
cáncer gástrico en Colombia** (ProPacífico) para la ruta de atención. Ver
`Documentacion/`.

## Integración futura con la EPS

Las rutas y los frontends dependen solo de la interfaz `FuenteDatos`. Para conectar
los sistemas reales se completa `FuenteKeralty(FuenteDatos)` y se cambia la fuente
activa en `backend/app/rutas.py` (`obtener_fuente`). El resto no cambia.

## Privacidad

- La carpeta `datos/` está excluida del control de versiones (`.gitignore`).
- Use solo datos sintéticos o anonimizados. No suba datos reales de pacientes.
