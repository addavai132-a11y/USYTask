// Fitness Routine Templates & Variants for "Crear Nueva Rutina"

import type { RoutineCategory, Exercise } from '@/types/fitness'
import { PREDEFINED_EXERCISES } from '@/lib/fitness-store'

export interface RoutineTemplateVariant {
  id: string
  name: string
  subtitle: string
  description: string
  category: RoutineCategory
  badge: string
  suggestedDuration: string
  exercises: Exercise[]
}

const findEx = (id: string): Exercise => {
  const found = PREDEFINED_EXERCISES.find((e) => e.id === id)
  if (!found) {
    return PREDEFINED_EXERCISES[0]
  }
  return found
}

export const ROUTINE_TEMPLATES: Record<Exclude<RoutineCategory, 'personalizada'>, RoutineTemplateVariant[]> = {
  push_pull_legs: [
    {
      id: 'ppl_v1_classic',
      name: '⚡ PPL Clásico de Hipertrofia (6 Días)',
      subtitle: 'Volumen moderado-alto y progresión semanal',
      description: 'El esquema rey de la hipertrofia. Estimula cada grupo muscular con 4-6 series efectivas por sesión.',
      category: 'push_pull_legs',
      badge: 'Más Popular',
      suggestedDuration: '~65 min',
      exercises: [
        findEx('ex_bench_press'),
        findEx('ex_inc_db_press'),
        findEx('ex_ohp'),
        findEx('ex_chest_dips'),
        findEx('ex_db_lat_raise'),
        findEx('ex_tricep_pushdown'),
      ],
    },
    {
      id: 'ppl_v2_nippard',
      name: '🔬 PPL Científico (Jeff Nippard Style)',
      subtitle: 'Enfoque biomecánico y perfiles de resistencia',
      description: 'Diseñada con ejercicios de máxima tensión en posición de estiramiento y control de RPE/RIR.',
      category: 'push_pull_legs',
      badge: 'Ciencia & RPE',
      suggestedDuration: '~60 min',
      exercises: [
        findEx('ex_inc_db_press'),
        findEx('ex_cable_crossover'),
        findEx('ex_cable_lat_raise'),
        findEx('ex_face_pull'),
        findEx('ex_skull_crushers'),
      ],
    },
    {
      id: 'ppl_v3_express',
      name: '⏱️ PPL Express de Alta Intensidad (3-4 Días)',
      subtitle: 'Sesión compacta con multiarticulares pesados',
      description: 'Para quienes tienen poco tiempo pero buscan máximas ganancias con series llevadas cerca del fallo.',
      category: 'push_pull_legs',
      badge: 'Express 45m',
      suggestedDuration: '~45 min',
      exercises: [
        findEx('ex_bench_press'),
        findEx('ex_ohp'),
        findEx('ex_chest_dips'),
        findEx('ex_db_lat_raise'),
      ],
    },
  ],

  torso_pierna: [
    {
      id: 'tp_v1_frec2',
      name: '🏆 Torso / Pierna Frecuencia 2 (4 Días)',
      subtitle: 'Equilibrio perfecto de fuerza e hipertrofia',
      description: 'Ideal para progresar semana a semana con 2 días de tren superior y 2 días de pierna completa.',
      category: 'torso_pierna',
      badge: 'Equilibrada',
      suggestedDuration: '~60 min',
      exercises: [
        findEx('ex_bench_press'),
        findEx('ex_barbell_row'),
        findEx('ex_inc_db_press'),
        findEx('ex_lat_pulldown'),
        findEx('ex_cable_lat_raise'),
        findEx('ex_bb_curl'),
      ],
    },
    {
      id: 'tp_v2_hypertrophy',
      name: '💥 Torso Denso & Pecho Superior',
      subtitle: 'Enfoque en pectoral clavicular y dorsal ancho',
      description: 'Prioriza el desarrollo de la espalda en V y la parte superior del pecho con ejercicios aislados.',
      category: 'torso_pierna',
      badge: 'Estética V-Taper',
      suggestedDuration: '~65 min',
      exercises: [
        findEx('ex_inc_db_press'),
        findEx('ex_seated_cable_row'),
        findEx('ex_cable_crossover'),
        findEx('ex_face_pull'),
        findEx('ex_inc_db_curl'),
        findEx('ex_tricep_pushdown'),
      ],
    },
    {
      id: 'tp_v3_phul',
      name: '⚡ Torso PHUL (Power Hypertrophy)',
      subtitle: 'Potencia pesada + congestión metabólica',
      description: 'Combina series pesadas de 3-5 repeticiones con trabajo hipertrófico de 8-12 repeticiones.',
      category: 'torso_pierna',
      badge: 'Fuerza + Hipertrofia',
      suggestedDuration: '~70 min',
      exercises: [
        findEx('ex_bench_press'),
        findEx('ex_barbell_row'),
        findEx('ex_ohp'),
        findEx('ex_pull_ups'),
        findEx('ex_skull_crushers'),
      ],
    },
  ],

  fullbody: [
    {
      id: 'fb_v1_classic',
      name: '🌍 Fullbody Clásica 3 Días',
      subtitle: 'Estimulación de cuerpo completo 3x por semana',
      description: 'Maximiza la síntesis proteica entrenando todo el cuerpo en cada sesión con levantamientos globales.',
      category: 'fullbody',
      badge: 'Clásica 3x',
      suggestedDuration: '~65 min',
      exercises: [
        findEx('ex_squat'),
        findEx('ex_bench_press'),
        findEx('ex_barbell_row'),
        findEx('ex_ohp'),
        findEx('ex_hanging_leg_raise'),
      ],
    },
    {
      id: 'fb_v2_shoulder3d',
      name: '🎯 Fullbody Énfasis Hombro 3D & Brazos',
      subtitle: 'Cuerpo completo con foco estético superior',
      description: 'Añade volumen directo al deltoides lateral y brazos sin descuidar el tren inferior.',
      category: 'fullbody',
      badge: 'Hombro 3D',
      suggestedDuration: '~60 min',
      exercises: [
        findEx('ex_inc_db_press'),
        findEx('ex_pull_ups'),
        findEx('ex_cable_lat_raise'),
        findEx('ex_squat'),
        findEx('ex_face_pull'),
        findEx('ex_bb_curl'),
      ],
    },
    {
      id: 'fb_v3_functional',
      name: '⚡ Fullbody Funcional & Potencia',
      subtitle: 'Multiarticulares pesados y núcleo abdominal',
      description: 'Enfocada en rendimiento atlético, fuerza de agarre y estabilidad del core.',
      category: 'fullbody',
      badge: 'Funcional & Core',
      suggestedDuration: '~55 min',
      exercises: [
        findEx('ex_deadlift'),
        findEx('ex_ohp'),
        findEx('ex_chest_dips'),
        findEx('ex_lat_pulldown'),
        findEx('ex_ab_wheel'),
      ],
    },
  ],

  hipertrofia: [
    {
      id: 'hyp_v1_arnold',
      name: '🥇 Arnold Split (Pecho & Espalda / Brazos)',
      subtitle: 'El legendario esquema de la era dorada',
      description: 'Super-congestión trabajando grupos musculares antagonistas emparejados (Pecho + Espalda).',
      category: 'hipertrofia',
      badge: 'Golden Era',
      suggestedDuration: '~75 min',
      exercises: [
        findEx('ex_bench_press'),
        findEx('ex_pull_ups'),
        findEx('ex_inc_db_press'),
        findEx('ex_barbell_row'),
        findEx('ex_cable_crossover'),
      ],
    },
    {
      id: 'hyp_v2_shoulders_arms',
      name: '💎 Enfoque Deltoides, Brazos & Pecho Alto',
      subtitle: 'Máximo desarrollo de brazos y silueta estética',
      description: 'Diseño hipertrófico centrado en cabeza lateral del hombro, bíceps braquial y tríceps.',
      category: 'hipertrofia',
      badge: 'Prioridad Brazos',
      suggestedDuration: '~60 min',
      exercises: [
        findEx('ex_inc_db_press'),
        findEx('ex_cable_lat_raise'),
        findEx('ex_inc_db_curl'),
        findEx('ex_tricep_pushdown'),
        findEx('ex_hammer_curl'),
      ],
    },
    {
      id: 'hyp_v3_hybrid',
      name: '💪 Empuje / Tirón + Día de Brazos Dedicado',
      subtitle: 'Distribución híbrida con día de aislamiento',
      description: 'Combina el volumen de empuje y tirón con un día exclusivo para exprimir los brazos al 100%.',
      category: 'hipertrofia',
      badge: 'Híbrida Viral',
      suggestedDuration: '~60 min',
      exercises: [
        findEx('ex_bb_curl'),
        findEx('ex_skull_crushers'),
        findEx('ex_hammer_curl'),
        findEx('ex_db_lat_raise'),
        findEx('ex_tricep_pushdown'),
      ],
    },
  ],

  fuerza: [
    {
      id: 'str_v1_531',
      name: '🛡️ 5/3/1 Wendler Base de Fuerza',
      subtitle: 'Progresión probada para récords en los 4 básicos',
      description: 'Ciclos de fuerza basados en porcentajes con una serie final AMRAP (+ repeticiones posibles).',
      category: 'fuerza',
      badge: 'Wendler 5/3/1',
      suggestedDuration: '~60 min',
      exercises: [
        findEx('ex_bench_press'),
        findEx('ex_ohp'),
        findEx('ex_chest_dips'),
        findEx('ex_seated_cable_row'),
        findEx('ex_hanging_leg_raise'),
      ],
    },
    {
      id: 'str_v2_texas',
      name: '⚡ Texas Method (Progresión Lineal Pesada)',
      subtitle: 'Día de volumen (5x5) y día de nuevo récord (1x5 PR)',
      description: 'El método definitivo de fuerza para atletas intermedios que buscan subir sus marcas personales.',
      category: 'fuerza',
      badge: 'Texas 5x5',
      suggestedDuration: '~70 min',
      exercises: [
        findEx('ex_squat'),
        findEx('ex_bench_press'),
        findEx('ex_deadlift'),
        findEx('ex_barbell_row'),
      ],
    },
    {
      id: 'str_v3_candito',
      name: '🔥 Candito Strength Split',
      subtitle: 'Periodización ondulante para sentadilla, banca y peso muerto',
      description: 'Estructura enfocada en maximizar el total de powerlifting con técnica estricta.',
      category: 'fuerza',
      badge: 'Candito Power',
      suggestedDuration: '~65 min',
      exercises: [
        findEx('ex_squat'),
        findEx('ex_bench_press'),
        findEx('ex_romanian_deadlift'),
        findEx('ex_pull_ups'),
      ],
    },
  ],

  cardio: [
    {
      id: 'car_v1_hiit',
      name: '❤️‍🔥 HIIT & Quema Metabólica',
      subtitle: 'Intervalos de alta intensidad para capacidad aeróbica',
      description: 'Combina sprints en cinta o bicicleta con ejercicios de autocarga para máxima quema calórica.',
      category: 'cardio',
      badge: 'HIIT Intenso',
      suggestedDuration: '~35 min',
      exercises: [
        findEx('ex_treadmill_hiit'),
        findEx('ex_chest_dips'),
        findEx('ex_hanging_leg_raise'),
        findEx('ex_ab_wheel'),
      ],
    },
    {
      id: 'car_v2_endurance',
      name: '🏃 Resistencia & Acondicionamiento Aeróbico',
      subtitle: 'Trabajo continuo en Zona 2-3 para salud mitocondrial',
      description: 'Sesión enfocada en resistencia cardiovascular prolongada y recuperación activa.',
      category: 'cardio',
      badge: 'Zona 2 Aeróbico',
      suggestedDuration: '~45 min',
      exercises: [
        findEx('ex_treadmill_hiit'),
        findEx('ex_hanging_leg_raise'),
      ],
    },
    {
      id: 'car_v3_circuit',
      name: '⚡ Circuito Funcional Full Body & Cardio',
      subtitle: 'Rondas dinámicas sin descanso entre estaciones',
      description: 'Ideal para acondicionamiento atlético, quema de grasa y tonificación general.',
      category: 'cardio',
      badge: 'Circuito Activo',
      suggestedDuration: '~40 min',
      exercises: [
        findEx('ex_pull_ups'),
        findEx('ex_chest_dips'),
        findEx('ex_treadmill_hiit'),
        findEx('ex_ab_wheel'),
      ],
    },
  ],
}
