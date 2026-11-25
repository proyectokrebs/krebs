"use client";

import { useRol } from "@/lib/RolContexto";
import { ROLES } from "@/lib/roles";
import { Rol } from "@/lib/tipos";

// Menú de rol: arriba a la izquierda, junto a la marca. Cambiar el rol
// cambia el header X-Rol de todas las peticiones y los permisos visibles.
export default function MenuRol() {
  const { rol, setRol } = useRol();
  return (
    <div className="rol-menu">
      <label htmlFor="rol">Rol activo:</label>
      <select
        id="rol"
        value={rol}
        onChange={(e) => setRol(e.target.value as Rol)}
      >
        {ROLES.map((r) => (
          <option key={r.valor} value={r.valor}>
            {r.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
