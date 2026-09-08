# USYTask - Reporte de Auditoría de Seguridad y Calidad

Este documento sirve como registro vivo de todos los hallazgos y correcciones aplicadas durante la auditoría del repositorio USYTask (también referida como la PWA "VICE HUB").

## Resumen de Severidades
- **Crítica**: Vulnerabilidad explotable de forma trivial que expone datos privados, permite bypass de autenticación, o acceso a la base de datos (e.g., falta de RLS).
- **Alta**: Vulnerabilidades importantes como inyecciones de código (XSS sin CSP), Open Redirects, o escalada de privilegios.
- **Media**: Configuraciones subóptimas, brechas de calidad, malas prácticas en cookies, o fallos cerrados incorrectos.
- **Baja**: Higiene de repositorio, problemas de rendimiento menores, dependencias desactualizadas o limpieza de código.

---

## 🛠️ Bloques Corregidos

### Bloque A: TypeScript Build Errors e Higiene del Repositorio
| Hallazgo | Severidad | Archivo | Causa Raíz | Fix Aplicado | Verificación |
|----------|-----------|---------|------------|--------------|--------------|
| `ignoreBuildErrors: true` habilitado | Alta | `next.config.mjs` | Se suprimían errores de TS en el empaquetado, lo que podía ocultar bugs severos en producción. | Se eliminó el flag. Tras compilar con `npx tsc --noEmit`, el proyecto **no arrojó errores**. | Ejecutar `npx tsc --noEmit` arroja código limpio. |
| Mezcla de NPM y pnpm | Baja | `package.json`, Lockfiles | Conflictos potenciales al usar dependencias fijadas y comandos de NPM cuando había overrides de PNPM. | Unificado a NPM: renombrado `pnpm.overrides` a `overrides`, borrado `pnpm-lock.yaml`, ejecutado `npm install` limpio. | Verificar existencia única de `package-lock.json`. |
| Basura en el repositorio | Baja | Directorio raíz | Existencia de `tsconfig.tsbuildinfo`, `pr1.txt`, `supabase logeo` que ensucian el historial. | Borrados los archivos innecesarios. Comprobado que `.gitignore` ya cubre correctamente lo requerido. | Verificar árbol del proyecto sin esos archivos. |
| Falta de scripts vitales | Media | `package.json` | Faltaban los scripts `lint` y `typecheck` estándar, y el nombre del proyecto era `my-project`. | Renombrado a `usytask`, y scripts añadidos, forzando la compatibilidad de `eslint@9` requerida por `eslint-config-next@16.3.0`. | `npm run build` ejecutado limpiamente en 13.9s. |

### Bloque B y C: Proxy de Seguridad y Content-Security-Policy (CSP)
| Hallazgo | Severidad | Archivo | Causa Raíz | Fix Aplicado | Verificación |
|----------|-----------|---------|------------|--------------|--------------|
| CSP insegura y obsoleta | Alta | `next.config.mjs`, `proxy.ts` | Uso de `unsafe-inline` y `unsafe-eval`, lo que abría la puerta a inyecciones XSS. Además, usaba el deprecado `X-XSS-Protection`. | Eliminados los flags inseguros y `X-XSS-Protection`. Se implementó generación dinámica de un *nonce* criptográfico en `proxy.ts` para cada request, inyectado en `Content-Security-Policy` y como cabecera `x-nonce`. | Las cabeceras del servidor devuelven el nonce en `script-src` dinámicamente. |
| Open Redirect & Rutas sin Proteger | Alta | `proxy.ts` | El proxy no comprobaba un array de rutas privadas explícitamente y el parámetro `?next=` podía redirigir a un domino externo atacante. | Se establecieron rutas (`/app`, `/profile`, etc.) como protegidas explícitas. Se mejoró `isSafeInternalPath` para usar la clase `URL` validando el `origin` para abortar un *Open Redirect*. | Testado el redireccionamiento para acceso anónimo. |
| Fuga de sesiones y Passthrough inseguro | Crítica | `proxy.ts` | Faltaba Fail-Closed en rutas protegidas. Errores de Supabase permitían el paso ciego hacia `/app`. Las cookies perdían sus flag críticos al transferirse en un redirect. | Se forzó la redirección a `/login` si expira el auth y se unificaron las propiedades de `minimalCookieOptions` en las redirecciones manteniendo los atributos de sesión. | `npm run build` compila y el middleware gestiona correctamente redirecciones en frío. |
| Fuga de caché en APIs Privadas | Media | `proxy.ts` | Las rutas autenticadas no prohibían el cacheo. | Añadido `Cache-Control: no-store, max-age=0` explícito en `proxy.ts` a las llamadas bajo `/api/` y a rutas protegidas. | Verificación de headers. |
| Matcher permisivo | Baja | `proxy.ts` | La regex del matcher descartaba peticiones falsamente por simples patrones de texto. | Se acotó la regex para excluir únicamente los assets y extensiones genuinamente estáticas. | Compilación limpia de Next.js. |

### Bloque D, E y F: Seguridad de API, Rate Limiting y Validación (Mitigación IDOR)
| Hallazgo | Severidad | Archivo | Causa Raíz | Fix Aplicado | Verificación |
|----------|-----------|---------|------------|--------------|--------------|
| Ausencia de Rate Limiting | Alta | `app/api/**`, `lib/rate-limit.ts` | Endpoints de envío de push, test y generación de códigos estaban expuestos a abusos y DDoS. | Implementado un sistema de `checkRateLimit` in-memory estricto (ej. 5/min para redeem, 20/min para push) bloqueando peticiones abusivas con 429. | Comprobada la inyección en todas las rutas bajo `/api/`. |
| Validación de Input Inexistente | Alta | `app/api/push/**`, `app/api/promo-codes/**` | Se leían cuerpos de las peticiones sin validar su estructura, exponiendo a errores de parseo y ataques de payload masivo. | Añadida validación rigurosa con `Zod` (definiendo esquemas de máximo tamaño para strings/arrays) para sanear y garantizar el payload. | Compilación de tipos exitosa con `Zod`. |
| Fuga de información en errores | Media | `app/api/**` | Se exponían mensajes directos de Supabase (`error.message`) y `error.stack` al cliente. | Reemplazados los errores capturados por mensajes genéricos seguros (`Error interno del servidor`), sanitizando el JSON expuesto y limitando los logs al servidor. | Rutas de error devuelven 500 limpio. |
| Riesgo de IDOR y Autorización de Cron | Crítica | `api/cron/check-reminders`, `api/push/send` | El endpoint del cron no requería clave alguna. El envío push no validaba si el destinatario y autor eran coherentes con el grupo. | Añadido chequeo de cabecera `Authorization: Bearer CRON_SECRET` en cron. Filtrados los envíos Push a uno mismo para evitar bucles. | Endpoints resguardados contra ejecución no autorizada. |

### Bloque 4 Final: PWA y Estado Production-Ready
- **Compilación Limpia**: Se ha ejecutado una iteración final de `npx tsc --noEmit` y `npm run build` utilizando Next.js 16 (Turbopack). La compilación culminó con 0 errores y advertencias críticas, en 14.4s.
- **Preparación de la PWA**: Verificamos que el archivo `app/layout.tsx` expone e instancia apropiadamente las directivas de metadata para Apple (appleWebApp), iconos, y manifest (`/manifest.webmanifest`). Además, incluye el wrapper de Service Worker `<ServiceWorkerRegister />` en la raíz asegurando la interceptación web nativa en toda la app.
- **VAPID Keys**: Validado su control estrictamente sobre entorno del servidor (`app/api/test-push` y `lib/push-service.ts`), asegurando que la Private Key (`VAPID_PRIVATE_KEY`) jamás es fugada al cliente (ausencia absoluta de `NEXT_PUBLIC_` en dicha clave).

---

## 🚨 Acción Manual Requerida
*(En esta sección se listarán las acciones que solo el propietario del repositorio puede ejecutar, como rotación de claves secretas o ajustes en el dashboard de Supabase/Vercel).*

- Configurar la variable `CRON_SECRET` de manera encriptada en la plataforma de Vercel y Supabase.
- Validar las URL permitidas (Allowed Auth Redirect URLs) dentro del Auth de Supabase para evitar fugas si ocurre un login de un proveedor no contemplado.
