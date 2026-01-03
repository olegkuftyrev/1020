// Use relative URL - nginx will proxy /api to backend
const API_BASE_URL = ''

export interface GemData {
  id: string
  count: string
  tasteOfFood: string
  accuracyOfOrder: string
  rawJson?: any
  createdAt: string
  updatedAt: string
}

export async function getGemData(): Promise<GemData | null> {
  try {
    const token = localStorage.getItem('auth_token')
    
    const response = await fetch(`${API_BASE_URL}/api/gem`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorText = await response.text()
      console.error('getGemData: Error response:', response.status, errorText)
      throw new Error(`Failed to fetch gem data: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('getGemData: Fetch error:', error)
    // Return null instead of throwing to prevent SWR from retrying indefinitely
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return null
    }
    throw error
  }
}

export async function saveGemData(data: {
  count?: string
  tasteOfFood?: string
  accuracyOfOrder?: string
  rawJson?: any
}): Promise<GemData> {
  const token = localStorage.getItem('auth_token')
  
  console.log('saveGemData: Sending request to /api/gem')
  console.log('saveGemData: Data to save:', data)
  console.log('saveGemData: rawJson type:', typeof data.rawJson, 'isArray:', Array.isArray(data.rawJson))
  
  const response = await fetch(`${API_BASE_URL}/api/gem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(data)
  })

  console.log('saveGemData: Response status:', response.status, response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('saveGemData: Error response:', errorText)
    throw new Error(`Failed to save gem data: ${response.statusText} - ${errorText}`)
  }

  const result = await response.json()
  console.log('saveGemData: Success, saved data:', result)
  return result
}

