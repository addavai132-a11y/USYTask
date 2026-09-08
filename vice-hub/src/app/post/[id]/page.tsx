import { POSTS, USERS } from '@/lib/mocks'
import { ArrowLeft, MessageSquare, Share2, Bookmark, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function PostPage() {
  const post = POSTS[0] // Mocking specific post

  return (
    <div className="flex-1 w-full min-h-screen">
      
      {/* Top Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-[var(--color-vice-border)] px-4 py-3 flex items-center gap-4">
        <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors">
          <ArrowLeft className="size-5 text-white" />
        </Link>
        <div className="text-white font-bold">Publicación</div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-32">
        
        {/* Post Content */}
        <article className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-vice-border)] overflow-hidden mb-6">
          
          <div className="p-5 flex items-start justify-between border-b border-[var(--color-vice-border)]/50">
            <div className="flex items-center gap-3">
              <img src={post.author.avatarUrl} alt={post.author.username} className="size-12 rounded-full border border-[var(--color-vice-border)]" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">{post.author.username}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-vice-gray)]">
                  <span>{post.createdAt}</span>
                  <span>•</span>
                  <span className="text-[var(--color-vice-blue)] font-bold">{post.category}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            <h1 className="text-2xl font-black font-display text-white mb-4 leading-tight">{post.title}</h1>
            <p className="text-[var(--color-vice-gray)] text-base leading-relaxed mb-6">
              {post.content}
            </p>
            
            {post.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-[var(--color-vice-border)] mb-4 relative aspect-video">
                <img src={post.imageUrl} alt="Contenido" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {post.tags.map(tag => (
                <span key={tag} className="text-[11px] font-bold text-[var(--color-vice-gray)] bg-white/5 px-2.5 py-1 rounded-md border border-white/5 hover:text-white cursor-pointer transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-5 py-3 border-t border-[var(--color-vice-border)] bg-black/20 flex items-center justify-between text-[var(--color-vice-gray)]">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 hover:bg-[var(--color-vice-pink)]/10 hover:text-[var(--color-vice-pink)] rounded-lg transition-colors flex items-center gap-2">
                <TrendingUp className="size-5" />
                <span className="text-sm font-bold">{post.votes} Votos</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                <Bookmark className="size-5" />
              </button>
              <button className="p-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
                <Share2 className="size-5" />
              </button>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div>
          <h3 className="font-bold text-white mb-4 px-2">Comentarios ({post.commentsCount})</h3>
          
          <div className="flex gap-3 mb-8">
            <img src={USERS[1].avatarUrl} alt="Me" className="size-10 rounded-full" />
            <div className="flex-1 rounded-xl border border-[var(--color-vice-border)] bg-[var(--color-surface)] p-2 flex items-end">
              <textarea 
                placeholder="Añade un comentario..." 
                className="w-full bg-transparent text-sm text-white resize-none outline-none p-2" 
                rows={2}
              />
              <button className="px-4 py-2 bg-[var(--color-vice-blue)] text-white font-bold text-sm rounded-lg hover:opacity-90">Enviar</button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Mock Comment */}
            <div className="flex gap-3">
              <img src={USERS[2].avatarUrl} alt="User" className="size-10 rounded-full shrink-0" />
              <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-vice-border)] p-4 rounded-2xl rounded-tl-none">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{USERS[2].username}</span>
                    <span className="text-[10px] text-[var(--color-vice-gray)]">Hace 1 hora</span>
                  </div>
                  <button className="text-[10px] uppercase font-bold text-[var(--color-vice-gray)] hover:text-white">Responder</button>
                </div>
                <p className="text-sm text-[var(--color-vice-gray)]">¡Buena captura! Yo estuve por esa zona ayer pero no vi la entrada porque era de noche y el agua estaba muy oscura. Lo intentaré luego.</p>
              </div>
            </div>
            {/* Mock Reply */}
            <div className="flex gap-3 ml-12">
              <img src={post.author.avatarUrl} alt="User" className="size-8 rounded-full shrink-0" />
              <div className="flex-1 bg-black/40 border border-[var(--color-vice-border)]/50 p-4 rounded-2xl rounded-tl-none">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[var(--color-vice-pink)] text-sm">{post.author.username}</span>
                  <span className="text-[10px] bg-[var(--color-vice-pink)]/20 px-1 rounded text-[var(--color-vice-pink)]">OP</span>
                </div>
                <p className="text-sm text-[var(--color-vice-gray)]">Sí, asegúrate de llevar linterna buceadora o esperar a que amanezca.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
