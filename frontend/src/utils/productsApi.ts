import axios from 'axios'
import { ProductData } from './pdfParser'

// Create axios instance with base config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface PdfMetadata {
  pageCount: number
  title?: string
  metadata?: any
}

/**
 * SWR fetcher for products
 */
export const productsFetcher = async (url: string): Promise<ProductData[]> => {
  try {
    const response = await api.get(url)
    return response.data
  } catch (error: any) {
    // If 404 or empty, return empty array (no products yet)
    if (error.response?.status === 404) {
      return []
    }
    console.error('Error fetching products:', error)
    throw error
  }
}

/**
 * SWR fetcher for PDF metadata
 */
export const pdfMetadataFetcher = async (url: string): Promise<PdfMetadata | null> => {
  try {
    const response = await api.get(url)
    return response.data
  } catch (error: any) {
    // If 404 or empty, return null (no metadata yet)
    if (error.response?.status === 404) {
      return null
    }
    console.error('Error fetching PDF metadata:', error)
    throw error
  }
}

/**
 * Get all products from database
 */
export async function getProducts(): Promise<ProductData[]> {
  const response = await api.get('/products')
  return response.data
}

/**
 * Sync products to database (replaces all existing products)
 */
export async function syncProducts(
  products: ProductData[],
  pdfMetadata?: PdfMetadata
): Promise<{ message: string; count: number }> {
  try {
    console.log('Syncing products to database:', products.length, 'products')
    const response = await api.post('/products/sync', {
      products,
      pdfMetadata,
    })
    console.log('Products synced successfully:', response.data)
    return response.data
  } catch (error: any) {
    console.error('Error syncing products:', error)
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data)
      
      // Handle validation errors
      if (error.response.status === 400 && error.response.data?.details) {
        const details = Array.isArray(error.response.data.details) 
          ? error.response.data.details.join(', ')
          : error.response.data.details
        throw new Error(`Validation failed: ${details}`)
      }
      
      // Handle server errors
      if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later or contact support.')
      }
      
      throw new Error(error.response.data?.error || error.response.data?.message || 'Failed to sync products')
    }
    
    // Handle network errors
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      throw new Error('Network error. Please check your connection and try again.')
    }
    
    throw error
  }
}

/**
 * Update conversion value for a product
 */
export async function updateProductConversion(
  productNumber: string,
  conversion: string
): Promise<ProductData> {
  try {
    const response = await api.put(`/products/${productNumber}/conversion`, {
      conversion,
    })
    return response.data
  } catch (error: any) {
    console.error('Error updating conversion:', error)
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Product not found')
      }
      if (error.response.status === 400) {
        throw new Error(error.response.data?.error || 'Invalid conversion value')
      }
      throw new Error(error.response.data?.error || error.response.data?.message || 'Failed to update conversion')
    }
    throw error
  }
}

/**
 * Get PDF metadata
 */
export async function getPdfMetadata(): Promise<PdfMetadata | null> {
  const response = await api.get('/products/metadata/pdf')
  return response.data
}

/**
 * Statistics interface
 */
export interface ProductStatistics {
  totalProducts: number
  productsByGroup: Array<{
    group: string
    count: number
  }>
  productsWithConversion: number
  productsWithoutConversion: number
  lastUpdate: string | null
}

/**
 * Category summary interface
 */
export interface CategorySummary {
  group: string
  productCount: number
  averageUsage: number
  averageCsPer1k: number
  productsWithConversion: number
  conversionRate: number
}

/**
 * Get product statistics
 */
export async function getProductStatistics(): Promise<ProductStatistics> {
  const response = await api.get('/products/statistics')
  return response.data
}

/**
 * Get category summary
 */
export async function getCategorySummary(): Promise<CategorySummary[]> {
  const response = await api.get('/products/category-summary')
  return response.data
}

