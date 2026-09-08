import { MessageSquare, Pin, Search, ShieldCheck } from 'lucide-react'

const CATEGORIES = [
  { id: 'general', title: 'General', desc: 'Discusiones generales sobre el juego', count: 1240 },
  { id: 'story', title: 'Historia', desc: 'Debate sobre la trama, misiones y spoilers', count: 342 },
  { id: 'secrets', title: 'Secretos y Easter Eggs', desc: 'Descubrimientos ocultos en el mapa', count: 891 },
  { id: 'map', title: 'Mapa', desc: 'Ubicaciones, rutas y negocios', count: 450 },
  { id: 'vehicles', title: 'Vehículos', desc: 'Coches, motos, aviones y barcos', count: 231 },
  { id: 'weapons', title: 'Armas', desc: 'Arsenal y estadísticas', count: 112 },
  { id: 'theories', title: 'Teorías', desc: 'Especulaciones y conspiraciones de la comunidad', count: 567 },
  { id: 'help', title: 'Ayuda', desc: 'Dudas y problemas técnicos', count: 120 },
]

export default function ForumPage() {
  return (
    <div className="flex-1 w-full min-h-screen p-4 sm:p-8">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">Foro Oficial</h1>
          <p className="text-[var(--color-vice-gray)] text-sm">
            Únete a la conversación con miles de exploradores en Leonida.
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-vice-gray)]" />
          <input 
            type="text" 
            placeholder="Buscar en el foro..." 
            className="w-full bg-[var(--color-surface)] border border-[var(--color-vice-border)] rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[var(--color-vice-pink)] transition-colors"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Categories List */}
        <div className="md:col-span-2 space-y-4">
          
          {/* Pinned Topic */}
          <div className="rounded-2xl bg-gradient-to-r from-[var(--color-vice-pink)]/10 to-transparent border border-[var(--color-vice-pink)]/30 p-4 flex gap-4 cursor-pointer hover:bg-[var(--color-vice-pink)]/5 transition-colors">
            <div className="mt-1">
              <Pin className="size-5 text-[var(--color-vice-pink)]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase text-[var(--color-vice-pink)] border border-[var(--color-vice-pink)]/30 px-1.5 rounded">Fijado</span>
                <span className="text-xs text-[var(--color-vice-gray)]">por Moderación</span>
              </div>
              <h3 className="font-bold text-white text-lg">Reglas del Foro y Política de Spoilers</h3>
              <p className="text-sm text-[var(--color-vice-gray)] mt-1">
                Por favor, lee estas normas antes de publicar cualquier contenido relacionado con la historia.
              </p>
            </div>
          </div>

          {/* Categorias */}
          <div className="rounded-2xl border border-[var(--color-vice-border)] bg-[var(--color-surface)] overflow-hidden">
            {CATEGORIES.map((cat, idx) => (
              <div key={cat.id} className={`p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors ${idx !== CATEGORIES.length - 1 ? 'border-b border-[var(--color-vice-border)]' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-white/5 border border-[var(--color-vice-border)] flex items-center justify-center">
                    <MessageSquare className="size-5 text-[var(--color-vice-blue)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-[var(--color-vice-blue)] transition-colors">{cat.title}</h3>
                    <p className="text-xs text-[var(--color-vice-gray)]">{cat.desc}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="font-display font-bold text-white">{cat.count}</div>
                  <div className="text-[10px] uppercase text-[var(--color-vice-gray)] font-bold">Posts</div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Sidebar - Active Users & Stats */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--color-vice-border)] bg-[var(--color-surface)] p-5">
            <h3 className="font-display font-black text-white text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="size-5 text-[var(--color-vice-green)]" />
              Estado
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-vice-gray)]">Usuarios Activos</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-[var(--color-vice-green)] animate-pulse" />
                  1,402
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-vice-gray)]">Nuevos Posts (Hoy)</span>
                <span className="font-bold text-white">342</span>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2.5 rounded-xl bg-[var(--color-vice-blue)] hover:bg-[#20a4df] text-white font-bold text-sm transition-colors shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              + Crear Tema
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
