"""Conexión y esquema de la base de datos SQLite."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from app import config

# DDL del esquema. Las fechas se guardan como texto ISO (AAAA-MM-DD) o NULL.
ESQUEMA = """
CREATE TABLE IF NOT EXISTS pacientes (
    paciente_id           TEXT PRIMARY KEY,
    edad                  INTEGER,
    sexo                  TEXT,
    procedencia           TEXT,
    estadio               TEXT,
    fase_actual           TEXT,
    tratamiento_sistemico TEXT,
    inmunoterapia         TEXT,
    cirugia_previa        TEXT,
    fecha_cirugia         TEXT,
    apoyo_cuidador        TEXT,
    canal_preferido       TEXT
);

CREATE TABLE IF NOT EXISTS contexto_clinico (
    paciente_id         TEXT PRIMARY KEY REFERENCES pacientes(paciente_id),
    peso_basal_kg       REAL,
    peso_actual_kg      REAL,
    perdida_peso_pct    REAL,
    actividad_funcional TEXT,
    ingesta             TEXT
);

CREATE TABLE IF NOT EXISTS reportes (
    reporte_id            TEXT PRIMARY KEY,
    paciente_id           TEXT REFERENCES pacientes(paciente_id),
    fecha                 TEXT,
    respondedor           TEXT,
    fase_contexto         TEXT,
    entrada               TEXT,
    estado_vs_habitual    TEXT,
    comer_beber           TEXT,
    actividad             TEXT,
    sintoma_nuevo_empeora TEXT
);

CREATE TABLE IF NOT EXISTS sintomas (
    sintoma_id    TEXT PRIMARY KEY,
    reporte_id    TEXT,
    paciente_id   TEXT REFERENCES pacientes(paciente_id),
    modulo        TEXT,
    sintoma       TEXT,
    frecuencia    TEXT,
    intensidad    TEXT,
    interferencia TEXT,
    evolucion     TEXT
);

CREATE TABLE IF NOT EXISTS alertas (
    alerta_id        TEXT PRIMARY KEY,
    paciente_id      TEXT REFERENCES pacientes(paciente_id),
    fecha            TEXT,
    motivo_principal TEXT,
    destinatario     TEXT,
    estado_gestion   TEXT
);

CREATE TABLE IF NOT EXISTS hitos (
    hito_id        TEXT PRIMARY KEY,
    paciente_id    TEXT REFERENCES pacientes(paciente_id),
    hito           TEXT,
    estado_visible TEXT,
    fecha          TEXT,
    texto_visible  TEXT
);

CREATE TABLE IF NOT EXISTS imagenes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id TEXT REFERENCES pacientes(paciente_id),
    archivo     TEXT,
    fecha       TEXT,
    etiqueta    TEXT
);

-- Resultados de exámenes. Un resultado puede originarse en un hito-examen
-- (hito_id) o registrarse manualmente por el médico. Krebs no interpreta:
-- guarda el texto del resultado tal como lo registra el equipo clínico.
CREATE TABLE IF NOT EXISTS resultados (
    resultado_id TEXT PRIMARY KEY,
    paciente_id  TEXT REFERENCES pacientes(paciente_id),
    hito_id      TEXT,
    examen       TEXT,
    fecha        TEXT,
    resultado    TEXT,
    observacion  TEXT,
    registrado_por TEXT
);

-- Mediciones de evolución (serie temporal sintética) para las gráficas de
-- "Mi proceso": evolución tumoral, marcador CEA, evolución nutricional y
-- hemoglobina. Una fila por paciente, métrica y fecha. Krebs no interpreta:
-- solo grafica lo que el equipo clínico registraría.
CREATE TABLE IF NOT EXISTS mediciones (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id TEXT REFERENCES pacientes(paciente_id),
    metrica     TEXT,     -- tumoral | cea | nutricional | hemoglobina
    fecha       TEXT,     -- AAAA-MM-DD
    valor       REAL,
    unidad      TEXT
);

-- Citas del simulador de agenda. Estados: programada, cancelada, reprogramada,
-- atendida. Una reprogramación conserva la cita y actualiza fecha/hora y estado.
CREATE TABLE IF NOT EXISTS citas (
    cita_id      TEXT PRIMARY KEY,
    paciente_id  TEXT REFERENCES pacientes(paciente_id),
    motivo       TEXT,
    profesional  TEXT,
    fecha        TEXT,
    hora         TEXT,
    estado       TEXT,
    nota         TEXT,
    creada_en    TEXT,
    actualizada_en TEXT
);

CREATE INDEX IF NOT EXISTS idx_reportes_paciente ON reportes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sintomas_paciente ON sintomas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_paciente  ON alertas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_hitos_paciente    ON hitos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_resultados_paciente ON resultados(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_paciente    ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_mediciones_paciente ON mediciones(paciente_id, metrica);
"""


def conectar(ruta: Path | None = None) -> sqlite3.Connection:
    """Abre una conexión SQLite con filas accesibles por nombre de columna."""
    destino = Path(ruta) if ruta else config.ARCHIVO_SQLITE
    destino.parent.mkdir(parents=True, exist_ok=True)
    conexion = sqlite3.connect(destino)
    conexion.row_factory = sqlite3.Row
    conexion.execute("PRAGMA foreign_keys = ON")
    return conexion


def crear_esquema(conexion: sqlite3.Connection) -> None:
    conexion.executescript(ESQUEMA)
    conexion.commit()
