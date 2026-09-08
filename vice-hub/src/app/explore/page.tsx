import { Compass, Search, Trophy, Map, Image as ImageIcon } from 'lucide-react'
import { POSTS } from '@/lib/mocks'

export default function ExplorePage() {
  const images = POSTS.filter(p => p.imageUrl)

  return (
    <div className="flex-1 w-full min-h-screen p-4 sm:p-8">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">Explorar Leonida</h1>
        <p className="text-[var(--color-vice-gray)] text-sm sm:text-base">
          Descubre los rincones más oscuros, los vehículos más raros y las mejores capturas de la comunidad.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Secretos', icon: Trophy, color: 'from-[var(--color-vice-pink)] to-[var(--color-vice-magenta)]' },
          { label: 'Lugares', icon: Map, color: 'from-[var(--color-vice-blue)] to-[var(--color-vice-purple)]' },
          { label: 'Capturas', icon: ImageIcon, color: 'from-[var(--color-vice-green)] to-[var(--color-vice-blue)]' },
          { label: 'Guías', icon: Compass, color: 'from-[var(--color-vice-orange)] to-[var(--color-vice-coral)]' }
        ].map((cat, i) => (
          <button key={i} className="relative overflow-hidden rounded-2xl aspect-[2/1] group transition-transform hover:scale-105 active:scale-95">
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <cat.icon className="size-6 text-white mb-auto opacity-75" />
              <span className="font-display font-black text-white text-lg tracking-wide">{cat.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Masonry-like Grid for content */}
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display font-black text-2xl text-white mb-6">Trending Visual</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((post, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-vice-border)] group cursor-pointer">
              <div className="relative aspect-square sm:aspect-auto sm:h-64 overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--color-vice-gray)]">
                    <span className="bg-[var(--color-vice-pink)]/20 text-[var(--color-vice-pink)] px-2 py-0.5 rounded font-bold uppercase border border-[var(--color-vice-pink)]/30">
                      {post.category}
                    </span>
                    <span>por {post.author.username}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* More mock images to fill out the grid since we only have a couple */}
          {[1,2,3,4].map((n) => (
            <div key={`mock-${n}`} className="rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-vice-border)] group cursor-pointer">
              <div className="relative aspect-square sm:aspect-auto sm:h-64 overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-1542282088-${String(n).repeat(3)}?auto=format&fit=crop&q=80&w=800`} 
                  alt="Mock" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1">
                    Captura del atardecer en Ocean Beach
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--color-vice-gray)]">
                    <span className="bg-[var(--color-vice-green)]/20 text-[var(--color-vice-green)] px-2 py-0.5 rounded font-bold uppercase border border-[var(--color-vice-green)]/30">
                      Captura
                    </span>
                    <span>por ViceTourist</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
