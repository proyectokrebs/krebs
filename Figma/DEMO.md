# Krebs — Demo móvil (paciente) integrado con el backend

App React + Vite + Tailwind (export de Figma) conectada al backend FastAPI real.
Es la experiencia del **paciente**: onboarding/autorización, recorrido del hub y
las herramientas conectadas a datos reales.

## Arrancar

Backend (una terminal), escuchando en toda la red:

```fish
cd backend
source .venv/bin/activate.fish      # o: .venv/bin/uvicorn ...
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend (otra terminal):

```fish
cd Figma
PORT=8443 pnpm dev
```

- En la PC: http://localhost:8443
- En el celular (misma Wi-Fi): abrir `http://<IP-de-tu-PC>:8443`
  (Vite la imprime como "Network", hoy http://192.168.1.23:8443).

La app detecta sola la URL del backend: usa el **mismo host** desde el que se
abrió, puerto 8000. Si cambiás de red, no hay que reconfigurar nada; solo que el
backend corra en la misma PC. Para forzar otra URL: variable `VITE_API_URL`.

## Qué está conectado al backend real

- **Mi proceso**: datos clínicos, línea de tiempo y resultados (lectura).
- **¿Cómo te sientes?**: autorreporte de síntomas (lista cerrada → POST, queda
  como autorreporte del paciente).
- **Citas** (nav inferior): agenda real del paciente (lectura).

## Control temporal del demo

- **Selector de paciente** en el menú (hamburguesa) marcado `[TEMPORAL]`: elige
  qué paciente sintético representa "yo" en el demo.
