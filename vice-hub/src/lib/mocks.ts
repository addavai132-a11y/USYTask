export interface User {
  id: string
  username: string
  avatarUrl: string
  reputation: number
  role: 'user' | 'moderator' | 'admin' | 'collaborator'
  badges: string[]
}

export interface Post {
  id: string
  title: string
  content: string
  category: 'Discusión' | 'Pregunta' | 'Descubrimiento' | 'Secreto' | 'Guía' | 'Teoría' | 'Bug'
  author: User
  createdAt: string
  votes: number
  commentsCount: number
  imageUrl?: string
  spoilerLevel: 'none' | 'mild' | 'story'
  tags: string[]
  isConfirmed?: boolean
}

export const USERS: User[] = [
  { id: 'u1', username: 'NeonGator', avatarUrl: 'https://i.pravatar.cc/150?u=u1', reputation: 4520, role: 'collaborator', badges: ['Explorador', 'Veterano'] },
  { id: 'u2', username: 'ViceExplorer', avatarUrl: 'https://i.pravatar.cc/150?u=u2', reputation: 1205, role: 'user', badges: ['Cartógrafo'] },
  { id: 'u3', username: 'SunsetHunter', avatarUrl: 'https://i.pravatar.cc/150?u=u3', reputation: 8900, role: 'moderator', badges: ['Leyenda', 'Guía de Vice'] },
  { id: 'u4', username: 'Route66', avatarUrl: 'https://i.pravatar.cc/150?u=u4', reputation: 340, role: 'user', badges: [] },
  { id: 'u5', username: 'LuciaTheory', avatarUrl: 'https://i.pravatar.cc/150?u=u5', reputation: 2150, role: 'user', badges: ['Teórico'] },
  { id: 'u6', username: 'Cartographer305', avatarUrl: 'https://i.pravatar.cc/150?u=u6', reputation: 5600, role: 'user', badges: ['Cartógrafo', 'Cazador de secretos'] },
  { id: 'u7', username: 'FlamingoKid', avatarUrl: 'https://i.pravatar.cc/150?u=u7', reputation: 120, role: 'user', badges: [] },
]

export const POSTS: Post[] = [
  {
    id: 'p1',
    title: 'Encontré una entrada secreta debajo del puente de Stockyard.',
    content: 'Estaba explorando con el aerodeslizador por los pantanos al sur de Stockyard y noté que debajo del pilar central hay una grieta. Se puede entrar buceando y hay un maletín.',
    category: 'Descubrimiento',
    author: USERS[0], // NeonGator
    createdAt: 'Hace 2 horas',
    votes: 342,
    commentsCount: 45,
    imageUrl: 'https://images.unsplash.com/photo-1590418585315-18105fc13d52?auto=format&fit=crop&q=80&w=800',
    spoilerLevel: 'none',
    tags: ['Pantano', 'Dinero', 'Buceo'],
    isConfirmed: true
  },
  {
    id: 'p2',
    title: '¿Alguien sabe para qué sirve esta llave oxidada?',
    content: 'Me la dropeó un NPC aleatorio cerca del motel Flamingo. No tiene nombre en el inventario, solo dice "Llave Oxidada".',
    category: 'Pregunta',
    author: USERS[1], // ViceExplorer
    createdAt: 'Hace 5 horas',
    votes: 128,
    commentsCount: 89,
    spoilerLevel: 'none',
    tags: ['Misterio', 'Ítems']
  },
  {
    id: 'p3',
    title: 'Ruta rápida para escapar de cinco estrellas',
    content: 'Si te metes por los túneles del metro en construcción cerca de Ocean View, los helicópteros te pierden al instante y la policía no spawnea dentro.',
    category: 'Guía',
    author: USERS[2], // SunsetHunter
    createdAt: 'Hace 1 día',
    votes: 890,
    commentsCount: 12,
    imageUrl: 'https://images.unsplash.com/photo-1518177111293-875f14e4eb1f?auto=format&fit=crop&q=80&w=800',
    spoilerLevel: 'none',
    tags: ['Policía', 'Estrategia', 'Coches']
  },
  {
    id: 'p4',
    title: 'Creo que estas dos misiones cambian dependiendo del personaje',
    content: 'Noté que si inicias la misión del atraco a la gasolinera con Jason, el enfoque es más agresivo, pero con Lucia tienes opciones de diálogo para distraer al dependiente.',
    category: 'Teoría',
    author: USERS[4], // LuciaTheory
    createdAt: 'Hace 3 días',
    votes: 560,
    commentsCount: 104,
    spoilerLevel: 'story',
    tags: ['Historia', 'Decisiones']
  },
  {
    id: 'p5',
    title: 'Este NPC aparece siempre exactamente a las 02:14 AM',
    content: 'He comprobado esto tres noches seguidas en el juego. Hay un tipo con traje blanco parado frente al club Malibu a las 02:14. Desaparece si te acercas demasiado.',
    category: 'Secreto',
    author: USERS[5], // Cartographer305
    createdAt: 'Hace 4 horas',
    votes: 215,
    commentsCount: 33,
    spoilerLevel: 'none',
    tags: ['NPC', 'Misterio', 'Noche'],
    isConfirmed: true
  }
]
