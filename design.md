# Krebs — Diseño

## 1. Visión general

Krebs es una app Streamlit de una sola página con navegación lateral entre cuatro
pantallas. Los datos se leen desde `datos/` a través de una capa de acceso
(repositorio de datos) con una interfaz estable, de modo que las pantallas no sepan
si los datos vienen de archivos, SQLite o una API.

```
Navegador  ──►  Streamlit (app.py)
                     │
                     ├── Pantalla: Ficha del paciente
                     ├── Pantalla: Línea de tiempo
                     ├── Pantalla: Pendientes y recordatorios
                     └── Pantalla: Imágenes diagnósticas
                            │
                            ▼
                 Capa de datos (interfaz FuenteDatos)
                            │
                 ┌──────────┴───────────┐
                 ▼                      ▼
        FuenteArchivos            (futuro) FuenteAPI
        (CSV/Excel + imágenes)    (EPS Sanitas)
                 │
                 ▼
             carpeta datos/
```

## 2. Estructura de carpetas

```
krebs/
├── app.py                      # Punto de entrada; navegación y layout
├── requirements.txt
├── requirements.md
├── design.md
├── tasks.md
├── README.md                   # Instrucciones de ejecución
├── .gitignore
├── krebs/                      # Paquete de la aplicación
│   ├── __init__.py
│   ├── config.py               # Rutas, constantes, días de recordatorio
│   ├── datos/                  # Capa de acceso a datos (código)
│   │   ├── __init__.py
│   │   ├── fuente.py           # Interfaz abstracta FuenteDatos
│   │   ├── fuente_excel.py     # Implementación sobre el libro Excel
│   │   └── modelos.py          # Dataclasses del dominio
│   ├── pantallas/
│   │   ├── __init__.py
│   │   ├── ficha.py            # RF-2
│   │   ├── linea_tiempo.py     # RF-3
│   │   ├── pendientes.py       # RF-4
│   │   └── imagenes.py         # RF-5
│   └── utils/
│       ├── __init__.py
│       ├── formato.py          # Formato de fechas, textos, estilos
│       └── fechas.py           # Conversión serial Excel y proximidad
└── datos/                      # (NO versionada) datos de entrada
    ├── Base sintetica - TPI Proyecto Krebs Cancer Gastrico.xlsx
    ├── imagenes.csv            # (opcional) metadatos de imágenes
    └── imagenes/               # (opcional) archivos JPG/PNG
```

## 3. Modelo de datos (basado en el libro Excel real)

El libro `Base sintetica - TPI Proyecto Krebs Cancer Gastrico.xlsx` es la fuente de
datos. Contiene 12 hojas; la app usa las de datos y expone las de referencia cuando
hace falta. **Identificador común: `paciente_id`** (formato `KG-0001`).

> **Fechas:** varias columnas vienen como **número de serie de Excel** (p. ej.
> `45971`, o con decimales para fecha+hora como `46272.4166`). La capa de datos las
> convierte a fecha real con base 1899-12-30 (sistema de fechas 1900 de Excel).

### Hoja `Pacientes_sinteticos` (100 pacientes) → Ficha
`paciente_id`, `fecha_ingreso_ruta` (serial), `edad`, `sexo`,
`procedencia_macro`, `estadio_demo`, `fase_actual`,
`tratamiento_sistemico_actual`, `inmunoterapia_actual`, `cirugia_previa`,
`fecha_cirugia` (serial), `apoyo_cuidador`, `respondedor_habitual`,
`alfabetizacion_digital`, `canal_preferido`, `contexto_sede_demo`,
`naturaleza_dato`.

### Hoja `Contexto_clinico` → Ficha
`paciente_id`, `peso_basal_kg`, `peso_actual_kg`, `perdida_peso_pct_formula`,
`tratamiento_sistemico`, `inmunoterapia`, `fecha_cirugia`,
`actividad_funcional_demo`, `ingesta_demo`, `nota`.

### Hoja `Reportes_ePRO` (438 reportes) → Línea de tiempo
`reporte_id`, `paciente_id`, `fecha_hora` (serial con hora), `respondedor`,
`fase_contexto`, `entrada`, `temperatura_c`, `estado_vs_habitual`,
`comer_beber`, `actividad`, `sintoma_nuevo_empeora`, `texto_libre_demo`,
`canal_demo`, `naturaleza_dato`.

### Hoja `Sintomas_reportados` (785 síntomas) → Ficha / detalle de reporte
`sintoma_id`, `reporte_id`, `paciente_id`, `modulo`, `sintoma`,
`ctcae_termino`, `inicio_dias`, `frecuencia`, `intensidad`, `interferencia`,
`evolucion`, `metrica_demo`, `ctcae_grado_compatible_demo`,
`estado_confirmacion`, `bandera_prioridad_demo`, `naturaleza_dato`.

### Hoja `Alertas_gestion` (77 alertas) → Pendientes
`alerta_id`, `reporte_id`, `paciente_id`, `fecha_hora` (serial), `motivo_principal`,
`nivel_prioridad_demo`, `destinatario_funcional_demo`, `canal_demo`,
`estado_gestion` (Generada → entregada → reconocida → contacto → cierre),
`fecha_contacto` (serial), `fecha_cierre` (serial), `nota_validacion`.

### Hoja `Hitos_seguimiento` (300 hitos) → Línea de tiempo y Pendientes
`hito_id`, `paciente_id`, `hito`, `estado_visible_paciente` (Completado / pendiente),
`fecha_confirmada` (serial), `texto_visible_paciente`, `ventana_interna_demo_dias`,
`fecha_objetivo_interna_demo` (serial), `nota_ventana`.

### Hojas de referencia (no por paciente)
- `CTCAE_v6_referencia`: terminología y grados CTCAE (consulta de términos).
- `Catalogo_sintomas`: catálogo de síntomas y mapeo a CTCAE.
- `Diccionario`: definición de campos (se puede mostrar como ayuda).
- `Fuentes`: fuentes bibliográficas.
- `Resumen`: indicadores agregados de la base.

### Imágenes diagnósticas (RF-5)
El libro **no contiene imágenes**. Las imágenes son opcionales y se leen aparte
desde `datos/imagenes/`, descritas por `datos/imagenes.csv`
(`paciente_id`, `archivo`, `fecha`, `etiqueta`). Si no existen, la pantalla muestra
un aviso en español. Cuando EPS Sanitas aporte imágenes reales (anonimizadas), se
colocan ahí.

Los modelos de dominio (`krebs/datos/modelos.py`) son dataclasses que envuelven
estas filas, de modo que las pantallas trabajen con objetos (`Paciente`,
`ContextoClinico`, `Reporte`, `Sintoma`, `Alerta`, `Hito`, `Imagen`, `Evento`) y no
con nombres de columnas ni con el formato serial de fechas.

## 4. Capa de acceso a datos

### Interfaz `FuenteDatos` (fuente.py)
Clase base abstracta con métodos que devuelven objetos de dominio. Usa
`paciente_id` como identificador:

```python
class FuenteDatos(ABC):
    def listar_pacientes(self) -> list[Paciente]: ...
    def obtener_paciente(self, paciente_id: str) -> Paciente | None: ...
    def obtener_contexto(self, paciente_id: str) -> ContextoClinico | None: ...
    def listar_reportes(self, paciente_id: str) -> list[Reporte]: ...
    def listar_sintomas(self, paciente_id: str) -> list[Sintoma]: ...
    def listar_alertas(self, paciente_id: str) -> list[Alerta]: ...
    def listar_hitos(self, paciente_id: str) -> list[Hito]: ...
    def listar_imagenes(self, paciente_id: str) -> list[Imagen]: ...
    def linea_de_tiempo(self, paciente_id: str) -> list[Evento]: ...
```

`linea_de_tiempo` combina hitos (`Hitos_seguimiento`) y reportes (`Reportes_ePRO`)
en una lista ordenada de `Evento` (fecha, tipo, descripción, ¿pasado/futuro?).

### `FuenteExcel` (fuente_excel.py)
- Lee el libro `.xlsx` desde `datos/` con pandas (`openpyxl`), una hoja por entidad.
- Convierte los **seriales de Excel** a fecha con `utils/fechas.py` (base 1899-12-30).
- Filtra por `paciente_id` y envuelve cada fila en su dataclass de dominio.
- Tolera hojas o columnas faltantes: devuelve listas vacías y registra un aviso,
  sin romper la pantalla.
- Se cachea con `@st.cache_data` para no releer el libro en cada interacción.
- Las imágenes se leen aparte desde `datos/imagenes.csv` + `datos/imagenes/`.

### Futuro `FuenteAPI`
Misma interfaz, implementada contra la API de EPS Sanitas. Las pantallas no cambian;
`app.py` elige la implementación. Esto cumple el requisito de reemplazo de fuente.

## 5. Pantallas

Cada módulo de `krebs/pantallas/` expone `render(fuente, paciente_id)` y solo usa la
interfaz `FuenteDatos`.

- **Ficha (RF-2):** datos del paciente (`Pacientes_sinteticos`: edad, sexo, estadio,
  fase, cirugía, cuidador) y contexto clínico (`Contexto_clinico`: peso basal/actual,
  % de pérdida de peso, actividad, ingesta). Los síntomas reportados
  (`Sintomas_reportados`) se muestran **solo como lo registró el paciente**, sin
  grados CTCAE, sin banderas de prioridad ni cualquier dato que parezca una
  valoración clínica: Krebs no interpreta. Encabezado con el aviso legal.
- **Línea de tiempo (RF-3):** lista cronológica en texto que combina hitos
  (`Hitos_seguimiento`) y reportes ePRO (`Reportes_ePRO`), ordenados por fecha, con
  marca visual de pasado/próximo y el texto visible al paciente.
- **Pendientes (RF-4):** hitos con `estado_visible_paciente` distinto de "Completado"
  y alertas con `estado_gestion` abierto, ordenados por proximidad; destaque para los
  próximos `DIAS_RECORDATORIO` (config, por defecto 7). Mensaje tranquilizador si no
  hay pendientes.
- **Imágenes (RF-5):** galería de JPG/PNG (desde `datos/imagenes/`) con fecha y
  etiqueta; aviso si no hay imágenes o si falta un archivo referenciado.

## 6. Navegación y layout (app.py)

- `st.set_page_config` con título "Krebs" y layout ancho.
- Barra lateral: selector de paciente (`st.selectbox`) y menú de pantallas
  (`st.radio` o `st.sidebar`).
- Banner superior fijo con el aviso: *"Krebs es una herramienta de apoyo. No
  diagnostica ni reemplaza la consulta con su médico."*
- Estilo para legibilidad: tamaño de fuente mayor y buen contraste vía CSS mínimo.

## 7. Utilidades

- `utils/fechas.py`: `dias_hasta(fecha)`, `es_proximo(fecha, dias)`,
  `es_pasado(fecha)`.
- `utils/formato.py`: formateo de fechas a español legible, textos de estado,
  inyección de CSS de accesibilidad.

## 8. Manejo de errores

- Datos ausentes o malformados: avisos con `st.warning`/`st.info`, nunca excepciones
  sin controlar que rompan la página.
- Imagen faltante: mensaje junto a su entrada.
- `datos/` vacía: pantalla de bienvenida con instrucciones y botón/nota para generar
  datos sintéticos.

## 9. Privacidad

- `.gitignore` excluye `datos/` (el libro Excel y las imágenes).
- El libro provisto ya es **sintético** (`naturaleza_dato = Sintético`); no hay datos
  reales de pacientes y `paciente_id` es un identificador artificial no reversible.
- No se escriben datos de entrada en logs.

## 10. Decisiones de diseño

- **Streamlit** por rapidez de prototipado y portabilidad en navegador.
- **Excel primero, otras fuentes opcionales:** la base sintética es un libro `.xlsx`;
  SQLite o una API se añaden como otra `FuenteDatos` sin cambiar pantallas.
- **Dataclasses de dominio** para desacoplar pantallas del esquema físico y del
  formato serial de fechas de Excel.
- **Conversión central de fechas** en `utils/fechas.py` (seriales Excel → `date`).
- **Caché de Streamlit** para rendimiento con relecturas mínimas.
