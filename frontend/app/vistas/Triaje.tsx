"use client";

import { useEffect, useState } from "react";
import { tableroReportesSintomas, ApiError } from "@/lib/api";
import { ReporteSintoma, Rol } from "@/lib/tipos";

// Tablero del call center: síntomas de todos los pacientes, de más a menos
// urgente. La prioridad es un orden de gestión, no una valoración médica.
export default function Triaje({ rol }: { rol: Rol }) {
  const [filas, setFilas] = useState<ReporteSintoma[]>([]);
  const [error, setError] = useState("");
  const esCallCenter = rol === "call_center";

  useEffect(() => {
    if (!esCallCenter) return;
    tableroReportesSintomas(rol)
      .then(setFilas)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.detalle : "No se pudo cargar el tablero."
        )
      );
  }, [rol, esCallCenter]);

  if (!esCallCenter) {
    return (
      <div>
        <h1>Reportes de pacientes</h1>
        <p className="sin-permiso">
          Este tablero es exclusivo del call center. Cambie el rol a “Call
          center” para verlo.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Reportes de pacientes</h1>
      <p className="fecha">
        Síntomas autorreportados por todos los pacientes, ordenados por
        prioridad de gestión (no es una valoración médica). {filas.length}{" "}
        registros.
      </p>
      {error && <p className="error">{error}</p>}

      {filas.length === 0 ? (
        <p className="vacio">Sin reportes.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Prioridad</th>
              <th>Nombre</th>
              <th>Edad</th>
              <th>Código</th>
              <th>Síntoma</th>
              <th>Gravedad</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={`${f.paciente_id}-${i}`}>
                <td>
                  <span
                    className={`estado-badge prioridad-${f.prioridad.toLowerCase()}`}
                  >
                    {f.prioridad}
                  </span>
                </td>
                <td>{f.nombre}</td>
                <td>{f.edad ?? "—"}</td>
                <td>{f.paciente_id}</td>
                <td>
                  {f.sintoma}
                  {f.modulo && (
                    <div className="fecha">{f.modulo}</div>
                  )}
                </td>
                <td>{f.intensidad || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
