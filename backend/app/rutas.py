"""Endpoints de la API de Krebs."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app import config
from app.datos.fuente import FuenteDatos
from app.datos.fuente_sqlite import FuenteSQLite
from app.datos.modelos import (
    NuevaCita,
    NuevaImagen,
    NuevoReporte,
    NuevoResultado,
    NuevoSintoma,
    ReprogramarCita,
)
from app import triaje
from app.esquemas import (
    CancelarCitaIn,
    CitaOut,
    ContextoOut,
    EventoOut,
    ImagenOut,
    NuevaCitaIn,
    NuevaImagenIn,
    NuevoReporteIn,
    NuevoResultadoIn,
    NuevoSintomaIn,
    MedicionOut,
    NuevoReporteMedicoIn,
    PacienteDetalle,
    PacienteResumen,
    PendienteOut,
    ReporteDetalleOut,
    ReporteOut,
    ReporteSintomaOut,
    ReprogramarCitaIn,
    ResultadoOut,
    SintomaOut,
)
from app.fechas import dias_hasta, es_proximo
from app.roles import exigir_rol

router = APIRouter()


def obtener_fuente() -> FuenteDatos:
    """Fuente de datos activa. Cambiar aquí para usar FuenteKeralty en el futuro."""
    return FuenteSQLite()


def _verificar_paciente(fuente: FuenteDatos, paciente_id: str) -> None:
    if fuente.obtener_paciente(paciente_id) is None:
        raise HTTPException(status_code=404, detail="Paciente no encontrado.")


@router.get("/aviso-legal")
def aviso_legal() -> dict:
    return {"aviso": config.AVISO_LEGAL}


@router.get("/pacientes", response_model=list[PacienteResumen])
def listar_pacientes(fuente: FuenteDatos = Depends(obtener_fuente)):
    return [
        PacienteResumen(
            paciente_id=p.paciente_id, edad=p.edad, sexo=p.sexo, etiqueta=p.etiqueta
        )
        for p in fuente.listar_pacientes()
    ]


@router.get("/pacientes/{paciente_id}", response_model=PacienteDetalle)
def obtener_paciente(paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    paciente = fuente.obtener_paciente(paciente_id)
    if paciente is None:
        raise HTTPException(status_code=404, detail="Paciente no encontrado.")
    return PacienteDetalle(**paciente.__dict__)


@router.get("/pacientes/{paciente_id}/contexto", response_model=ContextoOut | None)
def obtener_contexto(paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    _verificar_paciente(fuente, paciente_id)
    ctx = fuente.obtener_contexto(paciente_id)
    if ctx is None:
        return None
    return ContextoOut(
        peso_basal_kg=ctx.peso_basal_kg, peso_actual_kg=ctx.peso_actual_kg,
        perdida_peso_pct=ctx.perdida_peso_pct,
        actividad_funcional=ctx.actividad_funcional, ingesta=ctx.ingesta,
    )


@router.get("/pacientes/{paciente_id}/sintomas", response_model=list[SintomaOut])
def listar_sintomas(paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    _verificar_paciente(fuente, paciente_id)
    return [
        SintomaOut(
            sintoma_id=s.sintoma_id, modulo=s.modulo, sintoma=s.sintoma,
            frecuencia=s.frecuencia, intensidad=s.intensidad,
            interferencia=s.interferencia, evolucion=s.evolucion,
        )
        for s in fuente.listar_sintomas(paciente_id)
    ]


@router.get("/pacientes/{paciente_id}/linea-tiempo", response_model=list[EventoOut])
def linea_tiempo(paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    _verificar_paciente(fuente, paciente_id)
    return [
        EventoOut(
            fecha=e.fecha, tipo=e.tipo, descripcion=e.descripcion,
            es_pasado=e.es_pasado, ref=e.ref,
        )
        for e in fuente.linea_de_tiempo(paciente_id)
        if e.fecha is not None
    ]


@router.get("/pacientes/{paciente_id}/pendientes", response_model=list[PendienteOut])
def pendientes(paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    _verificar_paciente(fuente, paciente_id)
    dias = config.DIAS_RECORDATORIO
    salida: list[PendienteOut] = []

    for h in fuente.listar_hitos(paciente_id):
        if h.esta_completado:
            continue
        salida.append(PendienteOut(
            tipo="Hito", titulo=h.hito,
            detalle=h.texto_visible or h.estado_visible or "",
            fecha=h.fecha, dias_restantes=dias_hasta(h.fecha),
            prioritario=es_proximo(h.fecha, dias),
        ))

    for a in fuente.listar_alertas(paciente_id):
        if not a.esta_abierta:
            continue
        salida.append(PendienteOut(
            tipo="Alerta", titulo=a.motivo_principal or "Seguimiento",
            detalle=f"En gestión por {a.destinatario or 'su equipo'} "
                    f"· estado: {a.estado_gestion}",
            fecha=a.fecha, dias_restantes=dias_hasta(a.fecha),
            prioritario=es_proximo(a.fecha, dias),
        ))

    return salida


@router.get("/pacientes/{paciente_id}/imagenes", response_model=list[ImagenOut])
def listar_imagenes(paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    _verificar_paciente(fuente, paciente_id)
    salida: list[ImagenOut] = []
    for img in fuente.listar_imagenes(paciente_id):
        disponible = (config.CARPETA_IMAGENES / img.archivo).is_file()
        salida.append(ImagenOut(
            archivo=img.archivo, fecha=img.fecha, etiqueta=img.etiqueta,
            disponible=disponible,
            url=f"/imagenes/{img.archivo}" if disponible else None,
        ))
    return salida


@router.get("/pacientes/{paciente_id}/resultados", response_model=list[ResultadoOut])
def listar_resultados(paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    _verificar_paciente(fuente, paciente_id)
    return [ResultadoOut(**r.__dict__) for r in fuente.listar_resultados(paciente_id)]


@router.get("/pacientes/{paciente_id}/citas", response_model=list[CitaOut])
def listar_citas(paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    _verificar_paciente(fuente, paciente_id)
    return [CitaOut(**c.__dict__) for c in fuente.listar_citas(paciente_id)]


@router.get("/pacientes/{paciente_id}/mediciones", response_model=list[MedicionOut])
def listar_mediciones(paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    """Serie de evolución (tumoral, CEA, nutricional, hemoglobina) para las
    gráficas de Mi proceso."""
    _verificar_paciente(fuente, paciente_id)
    return [MedicionOut(**m.__dict__) for m in fuente.listar_mediciones(paciente_id)]


@router.get(
    "/pacientes/{paciente_id}/reportes-medicos", response_model=list[ReporteOut]
)
def listar_reportes_medicos(
    paciente_id: str, fuente: FuenteDatos = Depends(obtener_fuente)
):
    _verificar_paciente(fuente, paciente_id)
    return [ReporteOut(**r.__dict__) for r in fuente.listar_reportes_medicos(paciente_id)]


@router.get("/reportes/{reporte_id}", response_model=ReporteDetalleOut)
def obtener_reporte(reporte_id: str, fuente: FuenteDatos = Depends(obtener_fuente)):
    """Un reporte con sus síntomas, para abrir un autorreporte desde la línea
    de tiempo."""
    reporte = fuente.obtener_reporte(reporte_id)
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado.")
    sintomas = fuente.sintomas_de_reporte(reporte_id)
    return ReporteDetalleOut(
        reporte=ReporteOut(**reporte.__dict__),
        sintomas=[
            SintomaOut(
                sintoma_id=s.sintoma_id, modulo=s.modulo, sintoma=s.sintoma,
                frecuencia=s.frecuencia, intensidad=s.intensidad,
                interferencia=s.interferencia, evolucion=s.evolucion,
            )
            for s in sintomas
        ],
    )


@router.get("/catalogo-sintomas", response_model=dict[str, list[str]])
def catalogo_sintomas(fuente: FuenteDatos = Depends(obtener_fuente)):
    """Síntomas conocidos agrupados por módulo, para el formulario del paciente."""
    return fuente.catalogo_sintomas()


@router.get(
    "/reportes-sintomas",
    response_model=list[ReporteSintomaOut],
    dependencies=[Depends(exigir_rol("call_center"))],
)
def tablero_reportes_sintomas(fuente: FuenteDatos = Depends(obtener_fuente)):
    """Síntomas de todos los pacientes, de más a menos urgente (call center).

    La prioridad es un orden de gestión, no una valoración médica.
    """
    filas: list[ReporteSintomaOut] = []
    for paciente, s in fuente.sintomas_de_todos():
        puntaje = triaje.puntaje(s.sintoma, s.intensidad)
        filas.append(ReporteSintomaOut(
            paciente_id=paciente.paciente_id, nombre=paciente.paciente_id,
            edad=paciente.edad, sintoma=s.sintoma, modulo=s.modulo,
            intensidad=s.intensidad, frecuencia=s.frecuencia,
            prioridad=triaje.etiqueta(puntaje), puntaje=puntaje,
        ))
    filas.sort(key=lambda r: r.puntaje, reverse=True)
    return filas


# ----- Escritura (con control de rol por header X-Rol) -----


@router.post(
    "/pacientes/{paciente_id}/reportes",
    response_model=ReporteOut,
    status_code=201,
    dependencies=[Depends(exigir_rol("paciente"))],
)
def crear_reporte(
    paciente_id: str,
    datos: NuevoReporteIn,
    fuente: FuenteDatos = Depends(obtener_fuente),
):
    try:
        reporte = fuente.crear_reporte(paciente_id, NuevoReporte(**datos.model_dump()))
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return ReporteOut(**reporte.__dict__)


@router.post(
    "/pacientes/{paciente_id}/sintomas",
    response_model=SintomaOut,
    status_code=201,
    dependencies=[Depends(exigir_rol("paciente"))],
)
def crear_sintoma(
    paciente_id: str,
    datos: NuevoSintomaIn,
    fuente: FuenteDatos = Depends(obtener_fuente),
):
    try:
        sintoma = fuente.crear_sintoma(paciente_id, NuevoSintoma(**datos.model_dump()))
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return SintomaOut(
        sintoma_id=sintoma.sintoma_id, modulo=sintoma.modulo, sintoma=sintoma.sintoma,
        frecuencia=sintoma.frecuencia, intensidad=sintoma.intensidad,
        interferencia=sintoma.interferencia, evolucion=sintoma.evolucion,
    )


@router.post(
    "/pacientes/{paciente_id}/reportes-medicos",
    response_model=ReporteOut,
    status_code=201,
    dependencies=[Depends(exigir_rol("medico"))],
)
def crear_reporte_medico(
    paciente_id: str,
    datos: NuevoReporteMedicoIn,
    fuente: FuenteDatos = Depends(obtener_fuente),
):
    cuerpo = NuevoReporte(respondedor="Médico", **datos.model_dump())
    try:
        reporte = fuente.crear_reporte_medico(paciente_id, cuerpo)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return ReporteOut(**reporte.__dict__)


@router.post(
    "/pacientes/{paciente_id}/resultados",
    response_model=ResultadoOut,
    status_code=201,
    dependencies=[Depends(exigir_rol("medico"))],
)
def crear_resultado(
    paciente_id: str,
    datos: NuevoResultadoIn,
    fuente: FuenteDatos = Depends(obtener_fuente),
):
    try:
        resultado = fuente.crear_resultado(
            paciente_id, NuevoResultado(**datos.model_dump())
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return ResultadoOut(**resultado.__dict__)


@router.post(
    "/pacientes/{paciente_id}/imagenes",
    response_model=ImagenOut,
    status_code=201,
    dependencies=[Depends(exigir_rol("medico"))],
)
def crear_imagen(
    paciente_id: str,
    datos: NuevaImagenIn,
    fuente: FuenteDatos = Depends(obtener_fuente),
):
    try:
        img = fuente.crear_imagen(paciente_id, NuevaImagen(**datos.model_dump()))
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    disponible = (config.CARPETA_IMAGENES / img.archivo).is_file()
    return ImagenOut(
        archivo=img.archivo, fecha=img.fecha, etiqueta=img.etiqueta,
        disponible=disponible,
        url=f"/imagenes/{img.archivo}" if disponible else None,
    )


@router.post(
    "/pacientes/{paciente_id}/citas",
    response_model=CitaOut,
    status_code=201,
    dependencies=[Depends(exigir_rol("call_center"))],
)
def crear_cita(
    paciente_id: str,
    datos: NuevaCitaIn,
    fuente: FuenteDatos = Depends(obtener_fuente),
):
    try:
        cita = fuente.crear_cita(paciente_id, NuevaCita(**datos.model_dump()))
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return CitaOut(**cita.__dict__)


@router.put(
    "/citas/{cita_id}/reprogramar",
    response_model=CitaOut,
    dependencies=[Depends(exigir_rol("call_center"))],
)
def reprogramar_cita(
    cita_id: str,
    datos: ReprogramarCitaIn,
    fuente: FuenteDatos = Depends(obtener_fuente),
):
    try:
        cita = fuente.reprogramar_cita(cita_id, ReprogramarCita(**datos.model_dump()))
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return CitaOut(**cita.__dict__)


@router.put(
    "/citas/{cita_id}/cancelar",
    response_model=CitaOut,
    dependencies=[Depends(exigir_rol("call_center"))],
)
def cancelar_cita(
    cita_id: str,
    datos: CancelarCitaIn,
    fuente: FuenteDatos = Depends(obtener_fuente),
):
    try:
        cita = fuente.cancelar_cita(cita_id, datos.nota)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return CitaOut(**cita.__dict__)
