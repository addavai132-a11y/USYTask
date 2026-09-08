import { POSTS, USERS } from '@/lib/mocks'
import { Flame, Sparkles, MapPin, MessageSquare, TrendingUp, ChevronRight, Share2, Bookmark } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex w-full min-h-screen">
      {/* MAIN FEED COLUMN */}
      <div className="flex-1 max-w-3xl border-r border-[var(--color-vice-border)] min-h-screen">
        
        {/* Header & Tabs */}
        <div className="sticky top-0 z-40 glass-panel border-b border-[var(--color-vice-border)] pt-4 px-4 sm:px-6">
          <h1 className="font-display font-black text-2xl mb-4 text-white">Descubriendo Leonida</h1>
          
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-[-1px]">
            {['Para ti', 'Últimas', 'Popular', 'Descubrimientos', 'Teorías', 'Guías'].map((tab, i) => (
              <button 
                key={tab}
                className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                  i === 0 
                    ? 'border-[var(--color-vice-pink)] text-white' 
                    : 'border-transparent text-[var(--color-vice-gray)] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Feed Content */}
        <div className="p-4 sm:p-6 flex flex-col gap-6">
          {/* Create Post Prompt */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-vice-border)] flex items-center gap-4 cursor-text group transition-colors hover:border-[var(--color-vice-purple)]/50">
            <img src={USERS[0].avatarUrl} alt="Avatar" className="size-10 rounded-full object-cover" />
            <div className="flex-1 text-[var(--color-vice-gray)] font-medium">¿Qué has encontrado hoy?</div>
            <div className="px-4 py-1.5 rounded-lg bg-[var(--color-vice-pink)] text-white font-bold text-sm shadow-[0_0_10px_rgba(255,62,165,0.4)]">Publicar</div>
          </div>

          {/* Posts list */}
          {POSTS.map(post => (
            <article key={post.id} className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-vice-border)] overflow-hidden flex flex-col">
              {/* Post Header */}
              <div className="p-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src={post.author.avatarUrl} alt={post.author.username} className="size-10 rounded-full border border-[var(--color-vice-border)]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{post.author.username}</span>
                      {post.author.role !== 'user' && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[var(--color-vice-purple)]/20 text-[var(--color-vice-purple)] border border-[var(--color-vice-purple)]/30">
                          {post.author.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-vice-gray)]">
                      <span>{post.createdAt}</span>
                      <span>•</span>
                      <span className="text-[var(--color-vice-blue)] font-bold">{post.category}</span>
                    </div>
                  </div>
                </div>
                {post.isConfirmed && (
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[var(--color-vice-green)] bg-[var(--color-vice-green)]/10 px-2 py-1 rounded-full border border-[var(--color-vice-green)]/30">
                    <Sparkles className="size-3" />
                    Confirmado
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <h2 className="text-lg font-bold text-white mb-2 leading-snug">{post.title}</h2>
                <p className="text-[var(--color-vice-gray)] text-sm leading-relaxed mb-3">
                  {post.content}
                </p>
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-[var(--color-vice-border)] mb-3 relative aspect-video">
                    <img src={post.imageUrl} alt="Contenido" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[11px] font-bold text-[var(--color-vice-gray)] bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Post Actions */}
              <div className="px-4 py-3 border-t border-[var(--color-vice-border)] flex items-center justify-between text-[var(--color-vice-gray)]">
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-[var(--color-vice-pink)]/10 hover:text-[var(--color-vice-pink)] rounded-lg transition-colors flex items-center gap-1.5">
                    <TrendingUp className="size-5" />
                    <span className="text-sm font-bold">{post.votes}</span>
                  </button>
                  <button className="p-2 hover:bg-[var(--color-vice-blue)]/10 hover:text-[var(--color-vice-blue)] rounded-lg transition-colors flex items-center gap-1.5">
                    <MessageSquare className="size-5" />
                    <span className="text-sm font-bold">{post.commentsCount}</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                    <Bookmark className="size-5" />
                  </button>
                  <button className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                    <Share2 className="size-5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* RIGHT SIDEBAR (Desktop Only) */}
      <aside className="hidden lg:block w-80 p-6 space-y-6">
        
        {/* Trending Box */}
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-vice-border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-vice-border)] flex items-center gap-2">
            <Flame className="size-5 text-[var(--color-vice-orange)]" />
            <h3 className="font-display font-black text-white text-lg">Trending en Leonida</h3>
          </div>
          <div className="p-3">
            {[
              { title: '¿Será este el mapa completo?', cat: 'Teoría', posts: 342 },
              { title: 'El misterio de la radio 98.5', cat: 'Secreto', posts: 189 },
              { title: 'Localización del Banshee clásico', cat: 'Vehículos', posts: 156 },
              { title: 'Cómo conseguir dinero infinito al inicio', cat: 'Guía', posts: 112 },
            ].map((trend, i) => (
              <div key={i} className="px-3 py-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase text-[var(--color-vice-gray)]">{trend.cat}</span>
                  <span className="text-[10px] text-[var(--color-vice-gray)]">• {trend.posts} posts</span>
                </div>
                <p className="text-sm font-bold text-white group-hover:text-[var(--color-vice-pink)] transition-colors">{trend.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed Box */}
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-vice-border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-vice-border)]">
            <h3 className="font-display font-black text-white text-lg">Actividad Reciente</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-2 mt-1.5 rounded-full bg-[var(--color-vice-green)] shrink-0" />
              <p className="text-sm text-[var(--color-vice-gray)] leading-tight">
                <span className="font-bold text-white">4 jugadores</span> confirmaron el secreto <span className="text-white">"La cabaña del pantano"</span>.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-2 mt-1.5 rounded-full bg-[var(--color-vice-blue)] shrink-0" />
              <p className="text-sm text-[var(--color-vice-gray)] leading-tight">
                <span className="font-bold text-white">LuciaTheory</span> publicó una nueva teoría sobre el prólogo.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-2 mt-1.5 rounded-full bg-[var(--color-vice-purple)] shrink-0" />
              <p className="text-sm text-[var(--color-vice-gray)] leading-tight">
                Nueva zona desbloqueada: <span className="font-bold text-white">Kelly County</span> (3 nuevos marcadores).
              </p>
            </div>
          </div>
        </div>

      </aside>
    </div>
  )
}
