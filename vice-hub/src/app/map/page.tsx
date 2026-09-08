'use client'

import { useState } from 'react'
import { Map as MapIcon, Plus, Filter, Search, ChevronRight, X, Image as ImageIcon } from 'lucide-react'

const MOCK_MARKERS = [
  { id: 1, type: 'secret', title: 'Cabaña sumergida', x: 45, y: 30 },
  { id: 2, type: 'weapon', title: 'Fusil de Asalto', x: 60, y: 55 },
  { id: 3, type: 'vehicle', title: 'Banshee Clásico', x: 30, y: 70 },
  { id: 4, type: 'mission', title: 'Punto de entrega', x: 75, y: 25 },
]

export default function MapPage() {
  const [selectedMarker, setSelectedMarker] = useState<any>(null)

  return (
    <div className="relative w-full h-[calc(100vh-64px)] md:h-screen overflow-hidden bg-[#1a2327]">
      
      {/* SIMULATED MAP BACKGROUND */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-[2s] hover:scale-105"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000")' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#09070D]/80 via-transparent to-[#09070D]/80" />
      
      {/* MAP GRID OVERLAY */}
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '100px 100px' }} />

      {/* MARKERS */}
      {MOCK_MARKERS.map(m => (
        <button
          key={m.id}
          onClick={() => setSelectedMarker(m)}
          className={`absolute flex items-center justify-center size-8 -ml-4 -mt-4 rounded-full border-2 transition-transform hover:scale-125 hover:z-20 ${
            selectedMarker?.id === m.id ? 'scale-125 z-20 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-80 hover:opacity-100'
          } ${
            m.type === 'secret' ? 'bg-[var(--color-vice-pink)] text-white' :
            m.type === 'weapon' ? 'bg-[var(--color-vice-orange)] text-white' :
            m.type === 'vehicle' ? 'bg-[var(--color-vice-blue)] text-white' :
            'bg-[var(--color-vice-green)] text-white'
          }`}
          style={{ top: `${m.y}%`, left: `${m.x}%` }}
        >
          <div className="size-2 rounded-full bg-white" />
        </button>
      ))}

      {/* TOP OVERLAY CONTROLS */}
      <div className="absolute top-4 left-4 right-4 md:left-6 md:right-auto md:w-80 space-y-3 z-30">
        <div className="glass-panel rounded-2xl flex items-center p-2 border border-[var(--color-vice-border)]">
          <Search className="size-5 text-[var(--color-vice-gray)] ml-2" />
          <input 
            type="text" 
            placeholder="Buscar en Leonida..." 
            className="bg-transparent border-none outline-none text-white px-3 w-full text-sm placeholder:text-[var(--color-vice-gray)]"
          />
        </div>
        
        <div className="flex gap-2">
          <button className="glass-panel p-2.5 rounded-xl border border-[var(--color-vice-border)] text-white hover:bg-white/10 transition-colors">
            <Filter className="size-5" />
          </button>
          <button className="glass-panel flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-vice-border)] bg-[var(--color-vice-pink)]/20 text-[var(--color-vice-pink)] font-bold text-sm hover:bg-[var(--color-vice-pink)]/30 transition-colors">
            <Plus className="size-4" />
            Añadir Marcador
          </button>
        </div>
      </div>

      {/* BOTTOM LEGEND */}
      <div className="absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 glass-panel rounded-full px-4 py-2 border border-[var(--color-vice-border)] flex items-center gap-4 text-xs font-bold text-white whitespace-nowrap z-30">
        <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-[var(--color-vice-pink)]" /> Secretos</div>
        <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-[var(--color-vice-blue)]" /> Vehículos</div>
        <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-[var(--color-vice-orange)]" /> Armas</div>
      </div>

      {/* SIDE PANEL (DRAWER) */}
      <div className={`absolute top-0 right-0 h-full w-full md:w-96 bg-[var(--color-background)] border-l border-[var(--color-vice-border)] z-40 transform transition-transform duration-300 ease-in-out ${selectedMarker ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedMarker && (
          <div className="flex flex-col h-full">
            <div className="relative h-48 bg-slate-800">
              <img src="https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=800" alt="Lugar" className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedMarker(null)}
                className="absolute top-4 right-4 size-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase text-[var(--color-vice-pink)]">
                <MapIcon className="size-3" />
                {selectedMarker.type}
              </div>
              <h2 className="font-display font-black text-2xl text-white mb-2">{selectedMarker.title}</h2>
              <p className="text-[var(--color-vice-gray)] text-sm mb-6">
                Un hallazgo interesante cerca de los pantanos de Kelly County. Necesitas un vehículo acuático para acceder a la zona sin alertar a la fauna local.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[var(--color-surface)] border border-[var(--color-vice-border)] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[var(--color-vice-gray)] uppercase mb-1">Coordenadas</div>
                  <div className="text-sm font-mono text-white">X:{selectedMarker.x} Y:{selectedMarker.y}</div>
                </div>
                <div className="bg-[var(--color-surface)] border border-[var(--color-vice-border)] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[var(--color-vice-gray)] uppercase mb-1">Confirmaciones</div>
                  <div className="text-sm font-bold text-[var(--color-vice-green)]">143 jugadores</div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full py-3 rounded-xl bg-[var(--color-vice-pink)] text-white font-bold text-sm hover:bg-pink-600 transition-colors">
                  ¡Lo encontré!
                </button>
                <button className="w-full py-3 rounded-xl border border-[var(--color-vice-border)] text-white font-bold text-sm hover:bg-white/5 transition-colors">
                  Guardar marcador
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
