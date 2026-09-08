'use client'

import { useState } from 'react'
import { Image as ImageIcon, MapPin, Search, AlertTriangle, Send } from 'lucide-react'

export default function CreatePostPage() {
  const [category, setCategory] = useState('Descubrimiento')
  const [spoiler, setSpoiler] = useState('none')

  return (
    <div className="flex-1 w-full min-h-screen p-4 sm:p-8 flex justify-center">
      <div className="w-full max-w-3xl">
        <h1 className="font-display font-black text-3xl text-white mb-8">Crear Publicación</h1>

        <div className="space-y-6">
          {/* Category */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-[var(--color-vice-gray)] uppercase">¿Qué vas a publicar?</label>
            <div className="flex flex-wrap gap-2">
              {['Discusión', 'Pregunta', 'Descubrimiento', 'Secreto', 'Guía', 'Teoría', 'Bug'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    category === cat 
                      ? 'bg-[var(--color-vice-pink)]/20 border-[var(--color-vice-pink)] text-[var(--color-vice-pink)]' 
                      : 'bg-[var(--color-surface)] border-[var(--color-vice-border)] text-[var(--color-vice-gray)] hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-[var(--color-vice-gray)] uppercase">Título</label>
            <input 
              type="text" 
              placeholder="Ej. Encontré una entrada secreta debajo del puente..." 
              className="w-full bg-[var(--color-surface)] border border-[var(--color-vice-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[var(--color-vice-pink)] transition-colors"
            />
          </div>

          {/* Editor */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-[var(--color-vice-gray)] uppercase">Contenido</label>
            <div className="rounded-xl border border-[var(--color-vice-border)] bg-[var(--color-surface)] overflow-hidden flex flex-col">
              
              {/* Toolbar */}
              <div className="p-2 border-b border-[var(--color-vice-border)] flex items-center gap-2 bg-white/5">
                <button className="p-2 rounded hover:bg-white/10 text-[var(--color-vice-gray)] hover:text-white transition-colors" title="Añadir Imagen">
                  <ImageIcon className="size-4" />
                </button>
                <button className="p-2 rounded hover:bg-white/10 text-[var(--color-vice-gray)] hover:text-white transition-colors" title="Vincular Ubicación del Mapa">
                  <MapPin className="size-4" />
                </button>
                <button className="p-2 rounded hover:bg-white/10 text-[var(--color-vice-gray)] hover:text-white transition-colors" title="Vincular Personaje o Misión">
                  <Search className="size-4" />
                </button>
              </div>

              {/* Textarea */}
              <textarea 
                rows={8}
                placeholder="Escribe los detalles de tu publicación aquí... Usa markdown si quieres."
                className="w-full bg-transparent p-4 text-white resize-none focus:outline-none"
              />
            </div>
          </div>

          {/* Spoiler Level */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-[var(--color-vice-gray)] uppercase">Nivel de Spoiler</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'none', label: 'Sin Spoiler', desc: 'Seguro para todos' },
                { id: 'mild', label: 'Spoiler Leve', desc: 'Misiones iniciales o mecánicas' },
                { id: 'story', label: 'Spoiler de Historia', desc: 'Trama principal o final' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSpoiler(s.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    spoiler === s.id
                      ? s.id === 'none' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                      : 'bg-[var(--color-surface)] border-[var(--color-vice-border)] text-[var(--color-vice-gray)] hover:bg-white/5'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {s.id !== 'none' && <AlertTriangle className="size-4" />}
                    {s.label}
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-[var(--color-vice-border)] flex justify-end">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-vice-pink)] to-[var(--color-vice-magenta)] text-white font-bold text-sm shadow-[0_0_20px_rgba(233,51,255,0.4)] flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Send className="size-4" />
              Publicar
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
