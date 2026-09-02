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

async function main() {
  console.log('Auditing Supabase User Metadata sizes...')
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

  const userStats = []
  const keySizes: Record<string, number> = {}
  let totalBytesAllUsers = 0

  for (const user of allUsers) {
    const meta = user.user_metadata || {}
    const metaStr = JSON.stringify(meta)
    const bytes = Buffer.byteLength(metaStr, 'utf8')
    
    totalBytesAllUsers += bytes

    userStats.push({
      id: user.id,
      email: user.email,
      bytes: bytes
    })

    for (const [key, value] of Object.entries(meta)) {
      const keyStr = JSON.stringify({ [key]: value })
      const keyBytes = Buffer.byteLength(keyStr, 'utf8')
      keySizes[key] = (keySizes[key] || 0) + keyBytes
    }
  }

  // Sort by bytes desc
  userStats.sort((a, b) => b.bytes - a.bytes)

  console.log('=== TOP 20 USERS BY METADATA SIZE ===')
  for (let i = 0; i < Math.min(20, userStats.length); i++) {
    const u = userStats[i]
    console.log(`${i+1}. [${u.id}] ${u.email}: ${u.bytes} bytes`)
  }

  console.log('\n=== METADATA KEYS BY TOTAL SIZE ACROSS ALL USERS ===')
  const sortedKeys = Object.entries(keySizes).sort((a, b) => b[1] - a[1])
  for (const [key, size] of sortedKeys) {
    console.log(`- "${key}": ${size} bytes total`)
  }

  const avgBytes = allUsers.length > 0 ? (totalBytesAllUsers / allUsers.length).toFixed(2) : 0
  console.log(`\nAverage metadata size per user: ${avgBytes} bytes`)
  console.log(`Total metadata size across all users: ${totalBytesAllUsers} bytes`)
}

main().catch(console.error)
