"use client";

import { useEffect, useState } from "react";
import { listarReportesMedicos, crearReporteMedico, ApiError } from "@/lib/api";
import { Reporte, Rol } from "@/lib/tipos";

// Reportes hechos por médicos, en pestaña aparte de los autorreportes del
// paciente. Lectura para todos; alta solo para el médico.
export default function ReportesMedicos({
  pacienteId,
  rol,
}: {
  pacienteId: string;
  rol: Rol;
}) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({
    entrada: "",
    estado_vs_habitual: "",
    actividad: "",
  });

  const esMedico = rol === "medico";

  const recargar = () =>
    listarReportesMedicos(pacienteId, rol).then(setReportes).catch(() => {});

  useEffect(() => {
    recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId, rol]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await crearReporteMedico(pacienteId, rol, form);
      setForm({ entrada: "", estado_vs_habitual: "", actividad: "" });
      await recargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.detalle : "No se pudo registrar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h1>Reportes médicos</h1>
      <p className="fecha">
        Reportes registrados por el médico, aparte de los autorreportes del
        paciente.
      </p>

      {esMedico ? (
        <form onSubmit={enviar} className="tarjeta">
          <h3 style={{ marginTop: 0 }}>Registrar reporte médico</h3>
          <div className="form-grid">
            <div className="campo">
              <label>Nota / motivo *</label>
              <input
                required
                value={form.entrada}
                onChange={(e) => setForm({ ...form, entrada: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Estado vs. habitual</label>
              <input
                value={form.estado_vs_habitual}
                onChange={(e) =>
                  setForm({ ...form, estado_vs_habitual: e.target.value })
                }
              />
            </div>
            <div className="campo">
              <label>Actividad</label>
              <input
                value={form.actividad}
                onChange={(e) =>
                  setForm({ ...form, actividad: e.target.value })
                }
              />
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={enviando || !form.entrada}>
            {enviando ? "Guardando…" : "Registrar reporte"}
          </button>
        </form>
      ) : (
        <p className="sin-permiso">
          Solo el médico puede registrar reportes médicos. Cambie el rol a
          “Médico” para hacerlo.
        </p>
      )}

      <h3>Reportes registrados</h3>
      {reportes.length === 0 ? (
        <p className="vacio">Sin reportes médicos.</p>
      ) : (
        reportes.map((r) => (
          <div className="tarjeta" key={r.reporte_id}>
            <strong>{r.entrada || "Reporte médico"}</strong>
            <span className="fecha" style={{ marginLeft: 8 }}>
              {r.fecha ?? "sin fecha"} · {r.respondedor}
            </span>
            {(r.estado_vs_habitual || r.actividad) && (
              <div className="fecha">
                {r.estado_vs_habitual && `Estado: ${r.estado_vs_habitual}`}
                {r.estado_vs_habitual && r.actividad && " · "}
                {r.actividad && `Actividad: ${r.actividad}`}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
