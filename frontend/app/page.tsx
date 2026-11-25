"use client";

import { useEffect, useState } from "react";
import { useRol } from "@/lib/RolContexto";
import { PERMISOS } from "@/lib/roles";
import { listarPacientes } from "@/lib/api";
import { PacienteResumen } from "@/lib/tipos";
import Historia from "./vistas/Historia";
import Evolucion from "./vistas/Evolucion";
import Sintomas from "./vistas/Sintomas";
import Resultados from "./vistas/Resultados";
import Citas from "./vistas/Citas";
import Triaje from "./vistas/Triaje";
import ReportesMedicos from "./vistas/ReportesMedicos";

type Seccion =
  | "historia"
  | "evolucion"
  | "sintomas"
  | "reportes_medicos"
  | "resultados"
  | "citas"
  | "triaje";

const SECCIONES: { id: Seccion; etiqueta: string }[] = [
  { id: "historia", etiqueta: "Historia clínica" },
  { id: "evolucion", etiqueta: "Evolución clínica" },
  { id: "sintomas", etiqueta: "Síntomas" },
  { id: "reportes_medicos", etiqueta: "Reportes médicos" },
  { id: "resultados", etiqueta: "Resultados e imágenes" },
  { id: "citas", etiqueta: "Citas" },
  { id: "triaje", etiqueta: "Reportes de pacientes" },
];

export default function Page() {
  const { rol } = useRol();
  const [pacientes, setPacientes] = useState<PacienteResumen[]>([]);
  const [pacienteId, setPacienteId] = useState<string>("");
  const [seccion, setSeccion] = useState<Seccion>("historia");

  useEffect(() => {
    listarPacientes(rol).then((ps) => {
      setPacientes(ps);
      setPacienteId((actual) => actual || ps[0]?.paciente_id || "");
    });
  }, [rol]);

  return (
    <main className="contenedor">
      <aside className="lateral">
        <h2>Paciente</h2>
        <select
          value={pacienteId}
          onChange={(e) => setPacienteId(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem" }}
        >
          {pacientes.map((p) => (
            <option key={p.paciente_id} value={p.paciente_id}>
              {p.etiqueta}
            </option>
          ))}
        </select>

        <h2>Secciones</h2>
        <div className="nav">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              className={seccion === s.id ? "activo" : ""}
              onClick={() => setSeccion(s.id)}
            >
              {s.etiqueta}
            </button>
          ))}
        </div>

        <h2>Permisos del rol</h2>
        <ul style={{ paddingLeft: "1.1rem", margin: 0, fontSize: "0.85rem" }}>
          <li>Ver historia clínica</li>
          {PERMISOS[rol].map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </aside>

      <section className="panel">
        {seccion === "triaje" ? (
          <Triaje rol={rol} />
        ) : !pacienteId ? (
          <p className="vacio">Cargando pacientes…</p>
        ) : seccion === "historia" ? (
          <Historia pacienteId={pacienteId} rol={rol} />
        ) : seccion === "evolucion" ? (
          <Evolucion pacienteId={pacienteId} rol={rol} />
        ) : seccion === "sintomas" ? (
          <Sintomas pacienteId={pacienteId} rol={rol} />
        ) : seccion === "reportes_medicos" ? (
          <ReportesMedicos pacienteId={pacienteId} rol={rol} />
        ) : seccion === "resultados" ? (
          <Resultados pacienteId={pacienteId} rol={rol} />
        ) : (
          <Citas pacienteId={pacienteId} rol={rol} />
        )}
      </section>
    </main>
  );
}
