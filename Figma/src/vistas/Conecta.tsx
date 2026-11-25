import { useState } from 'react'

// "Conecta" (mockups 33-34): categorías con organizaciones reales de apoyo
// oncológico en Colombia. Los enlaces abren el sitio oficial de cada entidad.
// Fuentes consultadas públicamente (nov. 2025): Liga Colombiana Contra el
// Cáncer, Instituto Nacional de Cancerología, Fundación Santa Fe de Bogotá.

type Org = { nombre: string; desc: string; url: string }

const GRUPOS_APOYO: Org[] = [
  {
    nombre: 'Liga Colombiana Contra el Cáncer',
    desc: 'Programa de apoyo psicosocial para pacientes y familias.',
    url: 'https://www.ligacancercolombia.org/programa-de-apoyo-psicosocial/',
  },
  {
    nombre: 'Instituto Nacional de Cancerología (INC)',
    desc: 'Entidad estatal de atención, información y cuidado al paciente.',
    url: 'https://www.cancer.gov.co/',
  },
]

const FUNDACIONES: Org[] = [
  {
    nombre: 'Liga Colombiana Contra el Cáncer',
    desc: 'Educación, prevención y acompañamiento; 32 seccionales en el país.',
    url: 'https://www.ligacancercolombia.org/',
  },
  {
    nombre: 'Fundación Santa Fe de Bogotá',
    desc: 'Información y atención en cáncer gastrointestinal.',
    url: 'https://fundacionsantafedebogota.com/cancer-gastrointestinal',
  },
]

type Cat = 'menu' | 'grupos' | 'fundaciones'

export default function Conecta() {
  const [cat, setCat] = useState<Cat>('menu')

  if (cat === 'menu') {
    return (
      <div className="h-full overflow-y-auto px-4 pb-4 pt-5">
        <div className="card-krebs p-5 text-[20px] font-bold leading-snug text-krebs-ink">
          Conecta con personas que comparten tu diagnóstico
        </div>
        <div className="mt-8 space-y-4">
          <BotonCat onClick={() => setCat('grupos')}>Grupos de apoyo</BotonCat>
          <BotonCat onClick={() => setCat('fundaciones')}>Fundaciones</BotonCat>
        </div>
      </div>
    )
  }

  const titulo = cat === 'grupos' ? 'Grupos de apoyo' : 'Fundaciones'
  const lista = cat === 'grupos' ? GRUPOS_APOYO : FUNDACIONES

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 pt-5">
      <div className="card-krebs flex items-center justify-between p-4">
        <button onClick={() => setCat('menu')} className="text-[22px] font-bold text-krebs-cyan">‹</button>
        <span className="text-[20px] font-bold text-krebs-ink">{titulo}</span>
        <span className="w-5" />
      </div>

      <div className="mt-4 space-y-3">
        {lista.map((o) => (
          <a
            key={o.nombre}
            href={o.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl bg-[#e6f8fd] p-4 ring-1 ring-[#8fd8f8] transition-colors hover:bg-[#d4f1fb]"
          >
            <p className="text-[15px] font-bold text-krebs-ink">{o.nombre}</p>
            <p className="mt-1 text-[13px] text-krebs-ink/80">{o.desc}</p>
            <p className="mt-2 text-[12.5px] font-semibold text-krebs-cyan underline">Abrir sitio oficial ↗</p>
          </a>
        ))}
      </div>

      <p className="mt-5 px-1 text-[11px] italic text-krebs-ink/60">
        Enlaces a sitios oficiales de cada organización. Krebs no se responsabiliza
        por el contenido externo.
      </p>
    </div>
  )
}

function BotonCat({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className="block w-full rounded-2xl bg-gradient-to-r from-[#bfeafd] to-[#e6fbff] py-5 text-[22px] font-bold text-krebs-cyan ring-1 ring-[#8fd8f8]"
    >
      {children}
    </button>
  )
}
