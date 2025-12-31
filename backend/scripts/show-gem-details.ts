import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function showGemDetails() {
  try {
    const gem = await prisma.gem.findFirst({
      orderBy: { updatedAt: 'desc' }
    })
    
    if (!gem) {
      console.log('❌ No gem data found in database')
      return
    }
    
    console.log('=== Gem Data in Database ===\n')
    console.log(`ID: ${gem.id}`)
    console.log(`Created: ${gem.createdAt}`)
    console.log(`Updated: ${gem.updatedAt}\n`)
    
    console.log('=== Individual Fields ===')
    console.log(`Count: "${gem.count}"`)
    console.log(`Taste of Food: "${gem.tasteOfFood}"`)
    console.log(`Accuracy of Order: "${gem.accuracyOfOrder}"\n`)
    
    if (gem.rawJson && Array.isArray(gem.rawJson)) {
      console.log(`=== Raw JSON (${gem.rawJson.length} rows) ===\n`)
      
      gem.rawJson.forEach((row: any, index: number) => {
        console.log(`--- Row ${index} ---`)
        const keys = Object.keys(row).sort((a, b) => {
          const numA = parseInt(a.replace('_', '')) || 0
          const numB = parseInt(b.replace('_', '')) || 0
          return numA - numB
        })
        
        keys.forEach(key => {
          const value = row[key]
          if (value !== null && value !== undefined && value !== '') {
            console.log(`  ${key}: "${value}"`)
          }
        })
        console.log('')
      })
      
      // Find the data row (usually the last row with actual values)
      console.log('=== Key Values We Are Looking For ===')
      const dataRow = gem.rawJson[gem.rawJson.length - 1] as any
      if (dataRow) {
        console.log(`_4 (Count): "${dataRow._4 || 'NOT FOUND'}"`)
        console.log(`_10 (Taste of Food): "${dataRow._10 || 'NOT FOUND'}"`)
        console.log(`_15 (Accuracy of Order): "${dataRow._15 || 'NOT FOUND'}"`)
        console.log('')
        console.log('=== Summary ===')
        console.log(`Count: ${dataRow._4 || 'NOT FOUND'}`)
        console.log(`Taste of Food: ${dataRow._10 || 'NOT FOUND'}`)
        console.log(`Accuracy of Order: ${dataRow._15 || 'NOT FOUND'}`)
      }
    } else {
      console.log('Raw JSON is null or not an array')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showGemDetails()

