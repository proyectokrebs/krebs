# Krebs — Plan de tareas

Las tareas están ordenadas para construir de abajo hacia arriba: primero datos y
utilidades, luego pantallas, al final integración y documentación. Cada tarea
referencia los requisitos (RF) que satisface.

## 1. Preparación del proyecto
- [ ] 1.1 Crear estructura de paquetes (`krebs/`, subpaquetes, `__init__.py`).
- [ ] 1.2 Crear `.gitignore` que excluya `datos/`, `__pycache__/`, entornos virtuales.
- [ ] 1.3 Crear `krebs/config.py` con rutas de `datos/` y `DIAS_RECORDATORIO = 7`.
  _(RF-1, RF-4)_

## 2. Datos
- [ ] 2.1 Copiar el libro `Base sintetica - TPI Proyecto Krebs Cancer Gastrico.xlsx`
  a `datos/` (la base ya es sintética; no se versiona).
- [ ] 2.2 (Opcional) Crear `datos/imagenes.csv` e imágenes JPG/PNG de ejemplo en
  `datos/imagenes/` para la pantalla de imágenes.
- [ ] 2.3 Verificar que los hitos incluyan estados pasados/futuros y pendientes.
  _(RF-1 … RF-5)_

## 3. Modelos y capa de datos
- [ ] 3.1 Definir dataclasses en `krebs/datos/modelos.py` (Paciente, ContextoClinico,
  Reporte, Sintoma, Alerta, Hito, Imagen, Evento).
- [ ] 3.2 Definir la interfaz abstracta `FuenteDatos` en `fuente.py`
  (identificador `paciente_id`).
- [ ] 3.3 Implementar `FuenteExcel` (lectura por hoja con pandas/openpyxl, conversión
  de seriales de Excel, filtrado por `paciente_id`, tolerancia a hojas/columnas
  faltantes).
- [ ] 3.4 Implementar `linea_de_tiempo` combinando `Hitos_seguimiento` y
  `Reportes_ePRO`.
- [ ] 3.5 Añadir caché con `@st.cache_data`.
  _(RF-1, RF-3)_

## 4. Utilidades
- [ ] 4.1 `utils/fechas.py`: `serial_excel_a_fecha`, `dias_hasta`, `es_proximo`,
  `es_pasado`.
- [ ] 4.2 `utils/formato.py`: formateo de fechas en español, CSS de accesibilidad,
  textos de estado.
  _(RF-2 … RF-5, usabilidad)_

## 5. Pantallas
- [ ] 5.1 `pantallas/ficha.py`: datos del paciente, contexto clínico y síntomas
  reportados. _(RF-2)_
- [ ] 5.2 `pantallas/linea_tiempo.py`: gráfico Plotly + lista cronológica de hitos y
  reportes, distinción pasado/futuro. _(RF-3)_
- [ ] 5.3 `pantallas/pendientes.py`: hitos pendientes y alertas abiertas ordenados por
  proximidad con recordatorios resaltados; mensaje cuando no hay pendientes. _(RF-4)_
- [ ] 5.4 `pantallas/imagenes.py`: galería JPG/PNG con fecha y etiqueta; aviso si no
  hay imágenes o falta el archivo. _(RF-5)_

## 6. Integración (app.py)
- [ ] 6.1 `app.py`: `set_page_config`, selección de implementación de `FuenteDatos`.
- [ ] 6.2 Barra lateral: selector de paciente y menú de pantallas. _(RF-1)_
- [ ] 6.3 Banner con el aviso "no diagnostica ni reemplaza al médico" visible en
  todas las pantallas.
- [ ] 6.4 Pantalla de bienvenida cuando `datos/` está vacía, con instrucciones. _(RF-1)_
- [ ] 6.5 Aplicar CSS de accesibilidad (fuente grande, contraste).

## 7. Verificación
- [ ] 7.1 Ejecutar `streamlit run app.py` y revisar las cuatro pantallas con datos
  sintéticos.
- [ ] 7.2 Probar casos borde: `datos/` sin el libro, imagen faltante, sin pendientes,
  seriales de fecha mal formados.
- [ ] 7.3 Revisión manual de legibilidad (tamaños, contraste, español claro).

## 8. Documentación y cierre
- [ ] 8.1 Escribir `requirements.txt` (streamlit, pandas, plotly, openpyxl).
- [ ] 8.2 Escribir `README.md` con instalación y `streamlit run app.py`.
- [ ] 8.3 Confirmar que `datos/` no se versiona y que no hay datos reales.

---

### Nota sobre fuente de datos futura
La tarea de integración con la API de EPS Sanitas (crear `FuenteAPI` con la misma
interfaz `FuenteDatos`) queda documentada en `design.md` pero fuera del alcance de
este prototipo.
