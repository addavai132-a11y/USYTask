import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Make sure this is set in .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Define which keys to KEEP in the JWT user_metadata.
// Since we are migrating everything to public.profiles, we should keep this as small as possible.
// Typically just 'username' or 'name' might be useful, or nothing at all.
const WHITELIST_KEYS = ['full_name', 'avatar_url', 'email_verified', 'phone_verified', 'sub']

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = !args.includes('--apply')
  
  if (isDryRun) {
    console.log('--- DRY RUN MODE --- (Run with --apply to actually modify data)')
  } else {
    console.log('!!! APPLY MODE !!! (Modifying data)')
  }

  console.log('Fetching users...')
  let page = 1
  const perPage = 100
  let allUsers: any[] = []
  
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: page,
      perPage: perPage
    })

    if (error) {
      console.error('Failed to list users:', error)
      process.exit(1)
    }

    if (!data.users || data.users.length === 0) {
      break
    }

    allUsers = allUsers.concat(data.users)
    if (data.users.length < perPage) {
      break
    }
    page++
  }

  console.log(`Found ${allUsers.length} users in total.\n`)

  let totalBytesSaved = 0
  let usersModified = 0

  for (const user of allUsers) {
    const meta = user.user_metadata || {}
    const originalMetaStr = JSON.stringify(meta)
    const originalBytes = Buffer.byteLength(originalMetaStr, 'utf8')
    
    // Check if there are keys outside the whitelist
    const keysToRemove = Object.keys(meta).filter(k => !WHITELIST_KEYS.includes(k))
    
    if (keysToRemove.length > 0) {
      const newMeta: Record<string, any> = {}
      for (const key of WHITELIST_KEYS) {
        if (meta[key] !== undefined) {
          newMeta[key] = meta[key]
        }
      }
      
      const newMetaStr = JSON.stringify(newMeta)
      const newBytes = Buffer.byteLength(newMetaStr, 'utf8')
      const savedBytes = originalBytes - newBytes
      
      if (savedBytes > 0) {
        usersModified++
        totalBytesSaved += savedBytes
        console.log(`User ${user.id} (${user.email}): removing [${keysToRemove.join(', ')}]. Saved ${savedBytes} bytes.`)
        
        if (!isDryRun) {
          const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: newMeta
          })
          if (error) {
            console.error(`Failed to update user ${user.id}:`, error)
          }
        }
      }
    }
  }

  console.log(`\nSummary:`)
  console.log(`Total users needing cleanup: ${usersModified}`)
  console.log(`Total bytes saved: ${totalBytesSaved}`)
  
  if (isDryRun) {
    console.log('--- DRY RUN COMPLETE --- (Run with --apply to actually modify data)')
  } else {
    console.log('--- APPLY COMPLETE ---')
  }
}

main().catch(console.error)
