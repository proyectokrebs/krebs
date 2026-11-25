"""Configuración del backend: rutas y constantes."""

from __future__ import annotations

import os
from pathlib import Path

# backend/app/config.py -> raíz del repo
RAIZ = Path(__file__).resolve().parent.parent.parent

CARPETA_DATOS = RAIZ / "datos"
ARCHIVO_EXCEL = CARPETA_DATOS / "Base sintetica - TPI Proyecto Krebs Cancer Gastrico.xlsx"
ARCHIVO_SQLITE = CARPETA_DATOS / "krebs.db"

CARPETA_IMAGENES = CARPETA_DATOS / "imagenes"

# Nombres de las hojas del libro (usadas por el script de importación).
HOJA_PACIENTES = "Pacientes_sinteticos"
HOJA_CONTEXTO = "Contexto_clinico"
HOJA_REPORTES = "Reportes_ePRO"
HOJA_SINTOMAS = "Sintomas_reportados"
HOJA_ALERTAS = "Alertas_gestion"
HOJA_HITOS = "Hitos_seguimiento"

# Días dentro de los cuales un pendiente se resalta como recordatorio.
DIAS_RECORDATORIO = 7

# Orígenes permitidos para CORS (el frontend Next.js).
ORIGENES_CORS = os.getenv(
    "KREBS_CORS_ORIGINS", "http://localhost:3000"
).split(",")

AVISO_LEGAL = (
    "Krebs es una herramienta de apoyo y acompañamiento. "
    "No diagnostica, no interpreta resultados ni reemplaza la consulta con su médico. "
    "Ante cualquier duda o síntoma, comuníquese con su equipo de salud."
)
