import * as pdfjsLib from 'pdfjs-dist'

// Устанавливаем worker для Vite - используем файл из public
// В production используем абсолютный путь
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`
}

export interface ParsedPDFData {
  text: string
  pageCount: number
  metadata?: any
  rows: string[] // Разбитые строки по продуктам
}

export interface ProductData {
  id: string
  productNumber: string
  productName: string
  unit: string
  w38: string
  w39: string
  w40: string
  w41: string
  conversion?: string // Новая колонка, пока пустая
  group?: string // Группа продукта (WIC, Appetizers, Others)
}

export function parseProductRow(row: string): ProductData | null {
  // Парсим строку вида: P10002 Chicken, Orange Dark Battered K- LB 20.09 20.41 18.42 18.59
  const productMatch = row.match(/^(P\d+)\s+(.+?)\s+([A-Z-]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  
  if (!productMatch) {
    return null
  }
  
  const [, productNumber, productName, unit, w38, w39, w40, w41] = productMatch
  
  return {
    id: productNumber,
    productNumber,
    productName: productName.trim(),
    unit,
    w38,
    w39,
    w40,
    w41,
    conversion: '', // Пустая колонка для будущего использования
  }
}

export function parseProductRows(rows: string[]): ProductData[] {
  return rows
    .map(parseProductRow)
    .filter((product): product is ProductData => product !== null)
}

// Данные конверсии для продуктов
const conversionData: Record<string, string> = {
  'P10002': '40',
  'P10028': '40',
  'P10019': '40',
  'P10027': '40',
  'P5020': '40',
  'P5017': '30',
  'P5007': '40',
  'P10008': '40',
  'P10018': '20',
  'P16032': '20', // Shrimp, Battered Tempura 29/33 K-
  'P19149': '32', // Cabbage, K-Minus Shredded
  'P19013': '20', // Broccoli
  'P19909': '30', // Bell Pepper, Red
  'P19055': '40', // Zucchini
  'P19048': '50', // Onion, Yellow Fresh
  'P19186': '20', // Bean, Green Washed & Trimmed
  'P19016': '50', // Cabbage
  'P19045': '10', // Mushroom, Fresh
  'P19085': '30', // Celery K-
  'P19169': '18', // Baby Broccoli
  'P19910': '11', // Bell Pepper, Yellow
  'P19187': '4',  // Onion, Green K-
  'P19147': '12', // Kale, Shredded
  'P19046': '8',  // Onion, Green
  'P1079': '400', // Cookies, Fortune PX
  'P1102': '30',  // Noodles, (K-) Chow Mein
  'P1260': '100', // Rangoon, Cream Cheese K-
  'P1112': '50',  // Rice, Long Grain
  'P1107': '35',  // Oil, Salad
  'P1001': '200', // Springroll, Veg
  'P1004': '60',  // Eggroll, Chicken
  'P1129': '50',  // Sugar
  'P1684': '125', // Apple, Crisps Dried
  'P19054': '20', // Peas & Carrots
  'P1249': '32',  // Sauce, Honey Walnut PX
  'P2002': '30',  // Eggs, Liquid Cage Free
  'P1404': '40',  // Sauce, Honey
  'P1295': '35',  // Sauce, Sweet and Sour PX
  'P1792': '40',  // Sauce, Crispy Shrimp & Beef
  'P1580': '40',  // Sauce, Stir Fry Black Pepper
  'P1116': '4.8', // Sauce, Cooking Basic (K-)
  'P1158': '6',   // Nuts, Walnut Glazed
  'P1272': '50',  // Starch, Modified PX
  'P19052': '6',  // Nuts, Peanuts
  'P1093': '12',  // Ginger, Garlic Blend
  'P1268': '40',  // Sauce, Stir Fry PX
  'P1131': '4',   // Vinegar, White
  'P1233': '40',  // Sauce, SweetFire PX
  'P25980': '32', // Bev, Dasani Water 16.9 oz
  'P25911': '24', // Bev, Coke Classic (Bottled)
  'P25973': '24', // Bev, Coke Mexican Glass
  'P25908': '24', // Bev, Powerade Mountain Berry Blast
  'P25353': '50', // Bev, Honest Kids Apple Juice
  'P25422': '12', // Bev, Concentrate Peach Lychee Refresher
  'P25421': '12', // Bev, Concentrate Watermelon Mango Refresher
  'P25424': '12', // Bev, Concentrate Pomegranate Pineapple Refresher
  'P25423': '12', // Bev, Concentrate Mango Guava Tea Refresher
  'P25004': '5',  // Bev, Coke Diet BIB
  'P25003': '5',  // Bev, Coke Classic BIB
  'P25005': '5',  // Bev, Dr. Pepper BIB
  'P25027': '5',  // Bev, Coke Sprite 5G BIB
  'P25943': '5',  // Bev, Coke Minute Maid Lemonade BIB
  'P25346': '5',  // Bev, Coke Fanta Strawberry BIB
  'P25006': '5',  // Bev, Coke Fanta Orange BIB
  'P25933': '5',  // Bev, Fuze Raspberry BIB
  'P25077': '5',  // Bev, Coke Cherry BIB
  'P25244': '5',  // Bev, Coke Barqs Rootbeer BIB
  'P25403': '24', // Bev, Sprite Mexican (Glass)
  'P35432': '7200', // Napkin, Kraft Interfold PX Logo
  'P35048': '2000', // Fork, Plastic Black Heavy
  'P35719': '200',  // Container, PP 3Cmp Hngd PX Logo
  'P35213': '2000', // Straw, 8.75" Clear Wrapped
  'P35509': '504',  // Lid, 20–22 oz Bowl Clear Plastic PX Logo
  'P36029': '250',  // Bag, Plas Wave 4mil 19x17 PX
  'P35508': '504',  // Bowl, 20–22 oz Plastic Black PP Square PX
  'P35149': '1000', // Cup, 12 oz Paper Kid PX Logo
  'P35130': '450',  // Pail, 8 oz PX Logo
  'P35062': '2000', // Lid, 22 oz Cold Cup PX Logo
  'P35580': '3000', // Chopsticks, Bamboo Wrapped PX Logo
  'P35275': '1000', // Bag, Glassine 4.75 x 8.25 PX Logo
  'P35542': '1500', // Kit, Cutlery PX
  'P35040': '1000', // Cup, 22 oz Paper PX Logo
  'P35094': '500',  // Plate, 9.25" Fiber 3 Compartment PX Logo
  'P35406': '1000', // Lid, Flat 12–24 oz
  'P35081': '450',  // Pail, 26 oz PX Logo
  'P35268': '750',  // Cup, 30 oz Paper PX Logo
  'P35380': '600',  // Cup, 24 oz Color Print PET
  'P35634': '300',  // Pail, Kid Panda Carton
  'P35659': '1000', // Container, Fiber 3Comp PFree PX
  'P35065': '1000', // Lid, 30–32 oz Cold Cup PX Logo
  'P35126': '450',  // Pail, 16 oz PX Logo
  'P35269': '600',  // Cup, 42 oz Paper PX Logo
  'P1124': '1000',  // Sauce, Soy Packet PX
  'P1151': '700',   // Sauce, Chili Packet PX
  'P1652': '500',   // Sauce, Sweet & Sour Packets PX
  'P1566': '311',   // Sauce, Teriyaki Sauce Packet PX
  'P23001': '500',  // Sauce, Mustard Packets PX
}

// Определяем продукты группы WIC
const WIC_PRODUCTS = new Set([
  'P10002',
  'P10028',
  'P10019',
  'P10027',
  'P5020',
  'P5017',
  'P5007',
  'P10008',
  'P10018',
  'P16032',
])

// Определяем продукты группы Appetizers
const APPETIZERS_PRODUCTS = new Set([
  'P1260',
  'P1001',
  'P1004',
])

// Определяем продукты группы Sides
const SIDES_PRODUCTS = new Set([
  'P1102',
  'P1112',
  'P2002',
])

// Определяем продукты группы Sauce Cart
const SAUCE_CART_PRODUCTS = new Set([
  'P1093',
  'P1580',
  'P1404',
  'P1233',
  'P1249',
  'P1268',
  'P1107',
  'P1295',
])

// Определяем продукты группы Condements
const CONDEMENTS_PRODUCTS = new Set([
  'P1652',
  'P1566',
  'P1151',
])

// Определяем продукты группы Vegetables
const VEGETABLES_PRODUCTS = new Set([
  'P19013',
  'P19016',
  'P19045',
  'P19048',
  'P19054',
  'P19055',
  'P19085',
  'P19147',
  'P19149',
  'P19169',
  'P19186',
  'P19187',
  'P19909',
  'P19910',
])

// Определяем продукты группы BIBs
const BIBS_PRODUCTS = new Set([
  'P25003',
  'P25004',
  'P25005',
  'P25006',
  'P25027',
  'P25244',
  'P25346',
  'P25933',
  'P25943',
])

// Определяем продукты группы PCB
const PCB_PRODUCTS = new Set([
  'P25421',
  'P25422',
  'P25423',
  'P25424',
])

// Определяем продукты группы Bottles
const BOTTLES_PRODUCTS = new Set([
  'P25908',
  'P25911',
  'P25973',
  'P25980',
])

// Определяем продукты группы FoH Packaging
const FOH_PACKAGING_PRODUCTS = new Set([
  'P35081',
  'P35126',
  'P35130',
  'P35509',
  'P35508',
  'P35275',
  'P36029',
  'P35719',
])

// Определяем продукты группы Cups & lids
const CUPS_AND_LIDS_PRODUCTS = new Set([
  'P35149',
  'P35380',
  'P35268',
  'P35269',
  'P35406',
  'P35062',
  'P35065',
  'P35040',
])

// Определяем продукты группы Prep Area
const PREP_AREA_PRODUCTS = new Set([
  'P1158',
  'P19052',
  'P1116',
  'P1129',
  'P1131',
  'P1272',
])

// Определяем продукты группы FoH
const FOH_PRODUCTS = new Set([
  'P1079',
  'P35048',
  'P35213',
  'P35432',
  'P35542',
])

export function applyConversionData(products: ProductData[]): ProductData[] {
  return products.map(product => {
    let group = 'Others'
    if (WIC_PRODUCTS.has(product.productNumber)) {
      group = 'WIF'
    } else if (APPETIZERS_PRODUCTS.has(product.productNumber)) {
      group = 'Appetizers'
    } else if (SIDES_PRODUCTS.has(product.productNumber)) {
      group = 'Sides'
    } else if (SAUCE_CART_PRODUCTS.has(product.productNumber)) {
      group = 'Sauce Cart'
    } else if (CONDEMENTS_PRODUCTS.has(product.productNumber)) {
      group = 'Condements'
    } else if (VEGETABLES_PRODUCTS.has(product.productNumber)) {
      group = 'Vegetables'
    } else if (BIBS_PRODUCTS.has(product.productNumber)) {
      group = 'BIBs'
    } else if (PCB_PRODUCTS.has(product.productNumber)) {
      group = 'PCB'
    } else if (BOTTLES_PRODUCTS.has(product.productNumber)) {
      group = 'Bottles'
    } else if (FOH_PACKAGING_PRODUCTS.has(product.productNumber)) {
      group = 'FoH Packaging'
    } else if (CUPS_AND_LIDS_PRODUCTS.has(product.productNumber)) {
      group = 'Cups & lids'
    } else if (PREP_AREA_PRODUCTS.has(product.productNumber)) {
      group = 'Prep Area'
    } else if (FOH_PRODUCTS.has(product.productNumber)) {
      group = 'FoH'
    }
    
    return {
      ...product,
      conversion: conversionData[product.productNumber] || product.conversion || '',
      group
    }
  })
}

function splitIntoProductRows(text: string): string[] {
  // Разбиваем текст на строки по паттерну P + цифры (начало нового продукта)
  const rows: string[] = []
  
  // Регулярное выражение для поиска номеров продуктов (P + цифры)
  const productPattern = /(P\d+)/g
  const matches = [...text.matchAll(productPattern)]
  
  if (matches.length === 0) {
    return []
  }
  
  // Разбиваем текст на строки между номерами продуктов
  for (let i = 0; i < matches.length; i++) {
    const startIndex = matches[i].index!
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : text.length
    
    const row = text.substring(startIndex, endIndex).trim()
    if (row) {
      rows.push(row)
    }
  }
  
  return rows
}

/**
 * Parse PDF from ArrayBuffer
 */
async function parsePDFFromBuffer(arrayBuffer: ArrayBuffer): Promise<ParsedPDFData> {
  // Загружаем PDF из ArrayBuffer
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  
  const pageCount = pdf.numPages
  let fullText = ''
  
  // Извлекаем текст со всех страниц
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    
    // Объединяем текст из всех элементов страницы
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    
    fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`
  }
  
  // Получаем метаданные если есть
  const metadata = await pdf.getMetadata()
  
  // Разбиваем текст на строки по номерам продуктов (начинаются с P и цифр)
  const rows = splitIntoProductRows(fullText.trim())
  
  return {
    text: fullText.trim(),
    pageCount,
    metadata: metadata?.info || {},
    rows
  }
}

/**
 * Parse PDF from file path (URL) or ArrayBuffer
 */
export async function parsePDF(filePathOrBuffer: string | ArrayBuffer): Promise<ParsedPDFData> {
  try {
    let arrayBuffer: ArrayBuffer
    
    if (typeof filePathOrBuffer === 'string') {
      // Загружаем PDF файл через fetch
      const response = await fetch(filePathOrBuffer)
      arrayBuffer = await response.arrayBuffer()
    } else {
      // Уже ArrayBuffer
      arrayBuffer = filePathOrBuffer
    }
    
    return await parsePDFFromBuffer(arrayBuffer)
  } catch (error: any) {
    console.error('Error parsing PDF:', error)
    throw new Error(`Failed to parse PDF: ${error?.message || error}`)
  }
}
