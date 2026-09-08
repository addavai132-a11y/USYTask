'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, Bell, Shield, Eye, Moon, Monitor } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Cuenta')

  return (
    <div className="flex-1 w-full min-h-screen p-4 sm:p-8 flex justify-center">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8">
        
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <h1 className="font-display font-black text-2xl text-white mb-6 px-3">Ajustes</h1>
          
          {[
            { id: 'Cuenta', icon: SettingsIcon },
            { id: 'Apariencia', icon: Moon },
            { id: 'Notificaciones', icon: Bell },
            { id: 'Privacidad', icon: Shield },
            { id: 'Spoilers', icon: Eye },
            { id: 'Plataforma', icon: Monitor },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--color-vice-pink)]/10 text-[var(--color-vice-pink)]'
                  : 'text-[var(--color-vice-gray)] hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="size-4" />
              {tab.id}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-[var(--color-surface)] border border-[var(--color-vice-border)] rounded-2xl p-6 sm:p-8 min-h-[500px]">
            <h2 className="font-display font-black text-xl text-white mb-6 border-b border-[var(--color-vice-border)] pb-4">
              {activeTab}
            </h2>

            {activeTab === 'Cuenta' && (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase text-[var(--color-vice-gray)] block mb-2">Nombre de usuario</label>
                  <input type="text" defaultValue="NeonGator" className="w-full bg-black/20 border border-[var(--color-vice-border)] rounded-xl px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-[var(--color-vice-gray)] block mb-2">Bio</label>
                  <textarea defaultValue="Explorando los pantanos y documentando cada metro de Leonida." className="w-full bg-black/20 border border-[var(--color-vice-border)] rounded-xl px-4 py-2 text-white resize-none h-24" />
                </div>
                <button className="px-6 py-2 rounded-xl bg-[var(--color-vice-blue)] text-white font-bold text-sm hover:opacity-90 transition-opacity">
                  Guardar Cambios
                </button>
              </div>
            )}

            {activeTab === 'Spoilers' && (
              <div className="space-y-6">
                <p className="text-sm text-[var(--color-vice-gray)] mb-4">
                  Elige qué nivel de spoilers quieres ver automáticamente en VICE HUB sin tener que revelarlos manualmente.
                </p>
                <div className="space-y-3">
                  {['Ocultar todos los spoilers', 'Mostrar spoilers leves', 'Mostrar todo (Bajo mi propio riesgo)'].map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-vice-border)] bg-black/20 cursor-pointer hover:border-[var(--color-vice-pink)] transition-colors">
                      <input type="radio" name="spoilers" defaultChecked={i === 0} className="accent-[var(--color-vice-pink)] size-4" />
                      <span className="text-white text-sm font-bold">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Other tabs would go here, leaving simple placeholders */}
            {['Apariencia', 'Notificaciones', 'Privacidad', 'Plataforma'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-48 text-center text-[var(--color-vice-gray)]">
                <SettingsIcon className="size-8 opacity-20 mb-4" />
                <p>Opciones de {activeTab} en desarrollo para la Fase 2.</p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
