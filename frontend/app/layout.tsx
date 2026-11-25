import type { Metadata } from "next";
import "./globals.css";
import { RolProvider } from "@/lib/RolContexto";
import MenuRol from "./MenuRol";

export const metadata: Metadata = {
  title: "Krebs — Acompañamiento",
  description:
    "Krebs es una herramienta de apoyo. No diagnostica ni reemplaza al médico.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <RolProvider>
          {/* Barra superior: marca y menú de rol arriba a la izquierda */}
          <header className="barra">
            <span className="marca">Krebs</span>
            <MenuRol />
          </header>
          {children}
        </RolProvider>
      </body>
    </html>
  );
}
