import { USERS, POSTS } from '@/lib/mocks'
import { Map, MessageSquare, Compass, Settings, Trophy, ShieldCheck, Bookmark } from 'lucide-react'

export default function ProfilePage() {
  const user = USERS[0]
  const userPosts = POSTS.filter(p => p.author.id === user.id)

  return (
    <div className="flex-1 w-full min-h-screen">
      
      {/* Cover & Avatar Header */}
      <div className="relative h-48 sm:h-64 bg-slate-800">
        <img src="https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&q=80&w=2000" alt="Cover" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex items-end justify-between translate-y-12">
          <div className="flex items-end gap-4 sm:gap-6">
            <div className="relative">
              <img src={user.avatarUrl} alt={user.username} className="size-24 sm:size-32 rounded-2xl border-4 border-[var(--color-background)] object-cover shadow-2xl" />
              {user.role !== 'user' && (
                <div className="absolute -bottom-2 -right-2 size-8 rounded-lg bg-[var(--color-vice-purple)] border-2 border-[var(--color-background)] flex items-center justify-center text-white" title={user.role}>
                  <ShieldCheck className="size-4" />
                </div>
              )}
            </div>
            <div className="pb-2">
              <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">{user.username}</h1>
              <div className="flex items-center gap-2 text-sm mt-1 font-bold">
                <span className="text-[var(--color-vice-pink)]">LVL 24</span>
                <span className="text-[var(--color-vice-gray)]">•</span>
                <span className="text-[var(--color-vice-gray)]">Miami, FL</span>
              </div>
            </div>
          </div>
          
          <button className="pb-2 hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-vice-border)] bg-[var(--color-surface)] text-white font-bold hover:bg-white/10 transition-colors">
            <Settings className="size-4" />
            Editar Perfil
          </button>
        </div>
      </div>

      {/* Main Profile Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Sidebar - Stats & Badges */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-vice-border)] rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="font-display font-black text-2xl text-[var(--color-vice-pink)]">{user.reputation}</div>
                <div className="text-[10px] uppercase font-bold text-[var(--color-vice-gray)]">Reputación</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="font-display font-black text-2xl text-[var(--color-vice-blue)]">142</div>
                <div className="text-[10px] uppercase font-bold text-[var(--color-vice-gray)]">Descubiertos</div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-vice-border)] rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="size-4 text-[var(--color-vice-yellow)]" />
              Insignias
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.badges.map(badge => (
                <div key={badge} className="px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--color-vice-border)] text-xs font-bold text-[var(--color-vice-gray)] flex items-center gap-1.5 hover:text-white cursor-help">
                  <div className="size-2 rounded-full bg-[var(--color-vice-yellow)]" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content - Tabs & Feed */}
        <div className="md:col-span-2">
          
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar border-b border-[var(--color-vice-border)] mb-6">
            {[
              { label: 'Actividad', icon: Compass },
              { label: 'Posts', icon: MessageSquare },
              { label: 'Mapa', icon: Map },
              { label: 'Guardado', icon: Bookmark },
            ].map((tab, i) => (
              <button 
                key={tab.label}
                className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-colors ${
                  i === 0 
                    ? 'border-[var(--color-vice-pink)] text-white' 
                    : 'border-transparent text-[var(--color-vice-gray)] hover:text-white'
                }`}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <h2 className="text-white font-bold text-lg">Actividad Reciente</h2>
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <article key={post.id} className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-vice-border)] p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--color-vice-gray)] uppercase">
                    Publicó un <span className="text-[var(--color-vice-pink)]">{post.category}</span> • {post.createdAt}
                  </div>
                  <h3 className="text-white font-bold text-xl">{post.title}</h3>
                  <p className="text-[var(--color-vice-gray)] text-sm line-clamp-2">{post.content}</p>
                </article>
              ))
            ) : (
              <div className="p-8 text-center text-[var(--color-vice-gray)] border border-dashed border-[var(--color-vice-border)] rounded-2xl">
                No hay actividad reciente.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}
