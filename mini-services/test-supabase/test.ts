// 手動加載 .env 文件並覆蓋現有環境變量
import { config } from 'dotenv'
config({ override: true })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('Testing Supabase connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')

  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to Supabase!')

    // Query trips
    const trips = await prisma.trip.findMany({
      include: {
        members: true,
        expenses: true,
      },
    })

    console.log(`Found ${trips.length} trips:`)
    trips.forEach(trip => {
      console.log(`- ${trip.name} (${trip.members.length} members, ${trip.expenses.length} expenses)`)
    })

  } catch (error) {
    console.error('❌ Connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
