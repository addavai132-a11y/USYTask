import { createClient } from './supabase'

/**
 * Redimensiona y optimiza una imagen en el cliente antes de la subida para ahorrar ancho de banda.
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('No se pudo inicializar el lienzo para optimizar la imagen.'))
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Fallo en la compresión de la imagen.'))
            }
            const dataUrl = canvas.toDataURL('image/jpeg', quality)
            resolve({ blob, dataUrl })
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('No se pudo decodificar el archivo de imagen.'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo seleccionado.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Sube una imagen al bucket de Supabase Storage 'memories' con fallback automático.
 */
export async function uploadMemoryImage(
  file: File,
  userId?: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    // 1. Optimizar y redimensionar imagen en el cliente
    const { blob, dataUrl } = await optimizeImage(file)

    const supabase = createClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!supabaseUrl) {
      // Modo local / dev sin Supabase conectado
      return { success: true, publicUrl: dataUrl }
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const userFolder = userId || 'general'
    const filePath = `${userFolder}/${Date.now()}_${cleanFileName}`

    // 2. Subida a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.warn('Aviso en subida a Supabase Storage, usando dataUrl local como fallback:', uploadError.message)
      return { success: true, publicUrl: dataUrl }
    }

    // 3. Obtener URL pública
    const { data: publicData } = supabase.storage.from('memories').getPublicUrl(filePath)

    return {
      success: true,
      publicUrl: publicData.publicUrl || dataUrl,
    }
  } catch (err: unknown) {
    console.error('Error subiendo imagen de recuerdo:', err)
    const msg = err instanceof Error ? err.message : 'Error inesperado procesando la imagen.'
    return { success: false, error: msg }
  }
}

/**
 * Elimina una imagen del bucket 'memories' de Supabase Storage.
 */
export async function deleteMemoryImage(imageUrl?: string): Promise<boolean> {
  if (!imageUrl || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return true
  }

  try {
    const supabase = createClient()
    // Extraer path relativo dentro del bucket
    const match = imageUrl.match(/memories\/(.+)$/)
    if (!match || !match[1]) return true

    const filePath = decodeURIComponent(match[1].split('?')[0])
    const { error } = await supabase.storage.from('memories').remove([filePath])
    if (error) {
      console.warn('Aviso al eliminar imagen de Supabase Storage:', error.message)
    }
    return !error
  } catch (err) {
    console.error('Error eliminando imagen de storage:', err)
    return false
  }
}
