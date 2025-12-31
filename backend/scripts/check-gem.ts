import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkGem() {
  try {
    const gems = await prisma.gem.findMany({
      orderBy: { updatedAt: 'desc' }
    })
    
    console.log('=== Gem Records in Database ===')
    console.log(`Total records: ${gems.length}\n`)
    
    if (gems.length > 0) {
      gems.forEach((gem, index) => {
        console.log(`Record ${index + 1}:`)
        console.log(`  ID: ${gem.id}`)
        console.log(`  Count: ${gem.count}`)
        console.log(`  Taste of Food: ${gem.tasteOfFood}`)
        console.log(`  Accuracy of Order: ${gem.accuracyOfOrder}`)
        console.log(`  Raw JSON: ${gem.rawJson ? JSON.stringify(gem.rawJson, null, 2) : 'null'}`)
        console.log(`  Created: ${gem.createdAt}`)
        console.log(`  Updated: ${gem.updatedAt}`)
        console.log('')
      })
    } else {
      console.log('❌ No records found in Gem table')
      console.log('Data has not been saved yet.')
    }
  } catch (error) {
    console.error('Error checking gem data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGem()

