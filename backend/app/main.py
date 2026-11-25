"""Aplicación FastAPI de Krebs.

Ejecutar desde la carpeta backend/ con:

    uvicorn app.main:app --reload

Krebs es una herramienta de apoyo. No diagnostica ni reemplaza al médico.
Usa solo datos sintéticos o anonimizados.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import config
from app.rutas import router

app = FastAPI(
    title="Krebs API",
    version="0.2.0",
    description=(
        "API de seguimiento y acompañamiento de pacientes con cáncer gástrico. "
        "Krebs no diagnostica ni reemplaza al médico. Datos sintéticos."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ORIGENES_CORS,
    # Para el demo en red local: acepta localhost y cualquier IP privada
    # (192.168.x.x, 10.x.x.x, 172.16-31.x.x) en cualquier puerto. Así el
    # celular puede consumir la API sin reconfigurar al cambiar de red.
    allow_origin_regex=(
        r"https?://(localhost|127\.0\.0\.1|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?"
    ),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir imágenes diagnósticas si la carpeta existe.
if config.CARPETA_IMAGENES.is_dir():
    app.mount(
        "/imagenes",
        StaticFiles(directory=str(config.CARPETA_IMAGENES)),
        name="imagenes",
    )


@app.get("/salud")
def salud() -> dict:
    return {"estado": "ok"}


app.include_router(router, prefix="/api")
