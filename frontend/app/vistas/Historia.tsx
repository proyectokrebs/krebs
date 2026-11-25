"use client";

import { useEffect, useState } from "react";
import {
  obtenerPaciente,
  obtenerContexto,
  lineaTiempo,
  listarSintomas,
} from "@/lib/api";
import { Contexto, Evento, PacienteDetalle, Rol, Sintoma } from "@/lib/tipos";

// Historia clínica: visible para todos los roles (solo lectura).
export default function Historia({
  pacienteId,
  rol,
}: {
  pacienteId: string;
  rol: Rol;
}) {
  const [detalle, setDetalle] = useState<PacienteDetalle | null>(null);
  const [contexto, setContexto] = useState<Contexto | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [sintomas, setSintomas] = useState<Sintoma[]>([]);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      obtenerPaciente(pacienteId, rol),
      obtenerContexto(pacienteId, rol),
      lineaTiempo(pacienteId, rol),
      listarSintomas(pacienteId, rol),
    ]).then(([d, c, e, s]) => {
      if (!vivo) return;
      setDetalle(d);
      setContexto(c);
      setEventos(e);
      setSintomas(s);
    });
    return () => {
      vivo = false;
    };
  }, [pacienteId, rol]);

  if (!detalle) return <p className="vacio">Cargando historia clínica…</p>;

  const dato = (k: string, v: string | number | null) => (
    <div className="dato">
      <div className="k">{k}</div>
      <div className="v">{v ?? "—"}</div>
    </div>
  );

  return (
    <div>
      <h1>Historia clínica · {detalle.paciente_id}</h1>

      <h3>Datos del paciente</h3>
      <div className="datos">
        {dato("Edad", detalle.edad)}
        {dato("Sexo", detalle.sexo)}
        {dato("Procedencia", detalle.procedencia)}
        {dato("Estadio", detalle.estadio)}
        {dato("Fase actual", detalle.fase_actual)}
        {dato("Tratamiento sistémico", detalle.tratamiento_sistemico)}
        {dato("Inmunoterapia", detalle.inmunoterapia)}
        {dato("Cirugía previa", detalle.cirugia_previa)}
        {dato("Fecha de cirugía", detalle.fecha_cirugia)}
        {dato("Apoyo de cuidador", detalle.apoyo_cuidador)}
        {dato("Canal preferido", detalle.canal_preferido)}
      </div>

      {contexto && (
        <>
          <h3>Contexto clínico</h3>
          <div className="datos">
            {dato("Peso basal (kg)", contexto.peso_basal_kg)}
            {dato("Peso actual (kg)", contexto.peso_actual_kg)}
            {dato("Pérdida de peso (%)", contexto.perdida_peso_pct)}
            {dato("Actividad funcional", contexto.actividad_funcional)}
            {dato("Ingesta", contexto.ingesta)}
          </div>
        </>
      )}

      <h3>Síntomas reportados</h3>
      {sintomas.length === 0 ? (
        <p className="vacio">Sin síntomas registrados.</p>
      ) : (
        sintomas.map((s) => (
          <div className="tarjeta" key={s.sintoma_id}>
            <strong>{s.sintoma}</strong>
            {s.modulo && <span className="etiqueta-tipo" style={{ marginLeft: 8 }}>{s.modulo}</span>}
            <div className="fecha">
              Frecuencia: {s.frecuencia || "—"} · Intensidad:{" "}
              {s.intensidad || "—"} · Interferencia: {s.interferencia || "—"} ·
              Evolución: {s.evolucion || "—"}
            </div>
          </div>
        ))
      )}

      <h3>Línea de tiempo</h3>
      {eventos.length === 0 ? (
        <p className="vacio">Sin eventos registrados.</p>
      ) : (
        eventos.map((e, i) => (
          <div className="tarjeta" key={i}>
            <span className="etiqueta-tipo">{e.tipo}</span>
            <span className="fecha">{e.fecha ?? "sin fecha"}</span>
            <div>{e.descripcion}</div>
          </div>
        ))
      )}
    </div>
  );
}
