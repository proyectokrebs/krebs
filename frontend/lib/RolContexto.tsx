"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Rol } from "./tipos";

interface RolCtx {
  rol: Rol;
  setRol: (r: Rol) => void;
}

const Contexto = createContext<RolCtx | null>(null);
const CLAVE = "krebs-rol";

// Roles válidos en el panel de escritorio (sin "paciente").
const ROLES_PANEL: Rol[] = ["medico", "call_center"];

export function RolProvider({ children }: { children: ReactNode }) {
  const [rol, setRolEstado] = useState<Rol>("medico");

  // Recuperar el rol de la sesión anterior, ignorando valores que ya no
  // aplican a este panel (p. ej. "paciente" guardado antes).
  useEffect(() => {
    const guardado = localStorage.getItem(CLAVE) as Rol | null;
    if (guardado && ROLES_PANEL.includes(guardado)) setRolEstado(guardado);
  }, []);

  const setRol = (r: Rol) => {
    setRolEstado(r);
    localStorage.setItem(CLAVE, r);
  };

  return (
    <Contexto.Provider value={{ rol, setRol }}>{children}</Contexto.Provider>
  );
}

export function useRol(): RolCtx {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useRol debe usarse dentro de <RolProvider>");
  return ctx;
}
