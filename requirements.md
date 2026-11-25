# Krebs — Requisitos

## 1. Propósito

Krebs es un prototipo de aplicación web para el seguimiento y acompañamiento de
pacientes con cáncer gástrico. Está pensado como una herramienta de apoyo para el
paciente y su familia, con una interfaz simple y legible, orientada a personas
mayores. A futuro se integrará con la app de EPS Sanitas.

**Krebs no diagnostica, no interpreta resultados ni reemplaza al médico tratante.**
Este mensaje debe ser visible en la aplicación.

## 2. Alcance del prototipo

### Dentro del alcance
- Aplicación web local ejecutable con `streamlit run app.py`, usable desde
  cualquier navegador (Windows, macOS, Linux, Android, iOS).
- Lectura de datos desde la carpeta `datos/`: el libro Excel sintético provisto
  (`Base sintetica - TPI Proyecto Krebs Cancer Gastrico.xlsx`) e imágenes JPG/PNG
  opcionales.
- Cuatro pantallas funcionales (ver sección 4).
- Datos exclusivamente sintéticos o anonimizados (la base provista ya lo es).
- Arquitectura modular que permita reemplazar la fuente de datos por una API.

### Fuera del alcance (por ahora)
- Autenticación, control de acceso y gestión de múltiples usuarios reales.
- Integración real con la API de EPS Sanitas (solo se deja el diseño preparado).
- Notificaciones push, SMS o correo. Los "recordatorios" son avisos dentro de la app.
- Edición o escritura de datos clínicos por parte del usuario.
- Cumplimiento regulatorio completo (habeas data, historia clínica). Se trata como
  consideración de diseño, no como entrega del prototipo.

## 3. Usuarios

- **Paciente** con cáncer gástrico, posiblemente persona mayor.
- **Cuidador o familiar** que apoya el seguimiento.

Ambos tienen el mismo rol en el prototipo: solo consultan información.

## 4. Requisitos funcionales

Formato: cada requisito tiene una historia de usuario y criterios de aceptación
en estilo EARS (Easy Approach to Requirements Syntax).

### RF-1 — Selección de paciente y carga de datos
**Historia:** Como usuario, quiero elegir un paciente de una lista para ver su
información, de modo que la app muestre solo los datos de esa persona.

- CUANDO la app inicia, el sistema DEBE leer los archivos de `datos/` y mostrar la
  lista de pacientes disponibles.
- CUANDO el usuario selecciona un paciente, el sistema DEBE cargar y mostrar los
  datos asociados a ese paciente en todas las pantallas.
- SI la carpeta `datos/` no existe o está vacía, ENTONCES el sistema DEBE mostrar un
  mensaje claro en español indicando cómo agregar datos, sin bloquear la app.
- SI un archivo tiene un formato o columnas inesperadas, ENTONCES el sistema DEBE
  mostrar un aviso comprensible y continuar con los datos que sí pueda leer.

### RF-2 — Ficha del paciente
**Historia:** Como usuario, quiero ver una ficha con los datos del paciente y su
estado clínico, para tener un resumen claro en un solo lugar.

- CUANDO hay un paciente seleccionado, el sistema DEBE mostrar datos del paciente
  (`Pacientes_sinteticos`: código, edad, sexo, estadio, fase, cirugía, cuidador).
- CUANDO existe contexto clínico (`Contexto_clinico`), el sistema DEBE mostrar peso
  basal, peso actual, porcentaje de pérdida de peso, actividad e ingesta.
- CUANDO existen síntomas reportados (`Sintomas_reportados`), el sistema DEBE
  listarlos con su módulo, intensidad, frecuencia y evolución.
- El sistema DEBE mostrar de forma visible el aviso de que Krebs no diagnostica ni
  reemplaza al médico.

### RF-3 — Línea de tiempo del seguimiento
**Historia:** Como usuario, quiero ver en orden cronológico los hitos y reportes,
para entender el recorrido del paciente.

- CUANDO hay un paciente seleccionado, el sistema DEBE mostrar una línea de tiempo
  que combine hitos (`Hitos_seguimiento`) y reportes ePRO (`Reportes_ePRO`),
  ordenados por fecha.
- CADA evento DEBE indicar fecha, tipo y una descripción breve (texto visible al
  paciente cuando exista).
- El sistema DEBE distinguir visualmente eventos pasados y futuros.

### RF-4 — Pendientes y recordatorios
**Historia:** Como usuario, quiero ver los hitos pendientes y las alertas abiertas
con un recordatorio, para no olvidar compromisos próximos.

- CUANDO hay un paciente seleccionado, el sistema DEBE listar los hitos con
  `estado_visible_paciente` distinto de "Completado" y las alertas
  (`Alertas_gestion`) con gestión abierta, ordenados por proximidad.
- CUANDO un pendiente ocurre dentro de los próximos N días (configurable, por
  defecto 7), el sistema DEBE resaltarlo como recordatorio prioritario.
- SI no hay pendientes, ENTONCES el sistema DEBE mostrar un mensaje tranquilizador
  en español.

### RF-5 — Visualización de imágenes diagnósticas
**Historia:** Como usuario, quiero ver las imágenes diagnósticas (JPG/PNG) del
paciente, para acompañarlas con el resto de la información.

- CUANDO existen imágenes asociadas al paciente, el sistema DEBE mostrarlas con su
  fecha y una etiqueta/descripción.
- El sistema DEBE soportar los formatos JPG y PNG.
- SI una imagen referenciada no existe en disco, ENTONCES el sistema DEBE avisarlo
  sin interrumpir la pantalla.
- El sistema DEBE recordar que las imágenes son solo de visualización y que su
  interpretación corresponde al médico.

## 5. Requisitos no funcionales

### Usabilidad (prioritario)
- Interfaz en español, lenguaje sencillo, sin tecnicismos innecesarios.
- Tipografía grande, buen contraste, botones y controles amplios.
- Navegación clara entre las cuatro pantallas.

### Portabilidad
- Debe funcionar en cualquier navegador moderno en los sistemas indicados.
- Dependencias mínimas: `streamlit`, `pandas`, `plotly`, `openpyxl`.

### Mantenibilidad
- Código modular: carga de datos, cada pantalla y utilidades en módulos separados.
- La fuente de datos se accede por una interfaz única para poder cambiarla por una
  API sin tocar las pantallas.

### Privacidad y seguridad
- Solo datos sintéticos o anonimizados.
- La carpeta `datos/` y las imágenes NO se suben al repositorio (`.gitignore`).
- Ningún dato real de paciente debe entrar al código ni al control de versiones.

### Rendimiento
- Prototipo liviano; carga de datos con caché de Streamlit para respuesta rápida.

## 6. Supuestos

- La fuente de datos es el libro Excel sintético provisto, con las hojas
  `Pacientes_sinteticos`, `Contexto_clinico`, `Reportes_ePRO`,
  `Sintomas_reportados`, `Alertas_gestion` e `Hitos_seguimiento` (más hojas de
  referencia). Ver `design.md` §3 para el esquema real.
- Un paciente se identifica por `paciente_id` (formato `KG-0001`), presente en todas
  las hojas por paciente.
- Varias fechas vienen como **número de serie de Excel** (base 1899-12-30) y la app
  las convierte a fecha legible.
- El libro no incluye imágenes; las imágenes son opcionales y se colocan en
  `datos/imagenes/` descritas por `datos/imagenes.csv`.
- El prototipo corre localmente; no hay despliegue en servidor en esta etapa.

## 7. Criterios de aceptación globales

- La app arranca con `streamlit run app.py` tras instalar `requirements.txt`.
- Con el libro Excel sintético en `datos/`, las cuatro pantallas muestran contenido.
- El aviso de "no diagnostica ni reemplaza al médico" es visible.
- Cambiar la fuente de datos requiere modificar un solo módulo (`fuente_excel.py` →
  otra implementación de `FuenteDatos`).
