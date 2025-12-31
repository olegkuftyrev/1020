import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface PlQuestion {
  id: string
  questionId: string
  label: string
  explanation: string
  formula: string
  a1: string
  a2: string
  a3: string
  a4: string
  correctAnswer: string
}

export interface QuestionSet {
  id: string
  name: string
  showAnswers: boolean
  showFormula: boolean
  showExplanation: boolean
  questionIds: string[]
  createdAt: string
  updatedAt: string
  questions?: PlQuestion[]
}

export interface QuestionSetResult {
  id: string
  questionSetId: string
  answers: Record<string, string>
  score: number
  totalQuestions: number
  completedAt: string
}

/**
 * Get all questions
 */
export async function getPlQuestions(): Promise<PlQuestion[]> {
  try {
    const response = await api.get('/pl-questions')
    return response.data
  } catch (error: any) {
    console.error('Error fetching questions:', error)
    throw new Error(error.response?.data?.error || 'Failed to fetch questions')
  }
}

/**
 * Get all question sets
 */
export async function getQuestionSets(): Promise<QuestionSet[]> {
  try {
    const response = await api.get('/pl-questions-sets')
    return response.data
  } catch (error: any) {
    console.error('Error fetching question sets:', error)
    throw new Error(error.response?.data?.error || 'Failed to fetch question sets')
  }
}

/**
 * Get a single question set with questions
 */
export async function getQuestionSet(id: string): Promise<QuestionSet> {
  try {
    const response = await api.get(`/pl-questions-sets/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Error fetching question set:', error)
    throw new Error(error.response?.data?.error || 'Failed to fetch question set')
  }
}

/**
 * Create a new question set
 */
export async function createQuestionSet(data: {
  name: string
  showAnswers: boolean
  showFormula: boolean
  showExplanation: boolean
  questionIds: string[]
}): Promise<QuestionSet> {
  try {
    const response = await api.post('/pl-questions-sets', data)
    return response.data
  } catch (error: any) {
    console.error('Error creating question set:', error)
    throw new Error(error.response?.data?.error || 'Failed to create question set')
  }
}

/**
 * Submit answers for a question set
 */
export async function submitAnswers(
  setId: string,
  answers: Record<string, string>
): Promise<{ result: QuestionSetResult; score: number; totalQuestions: number; percentage: number }> {
  try {
    const response = await api.post(`/pl-questions-sets/${setId}/submit`, { answers })
    return response.data
  } catch (error: any) {
    console.error('Error submitting answers:', error)
    throw new Error(error.response?.data?.error || 'Failed to submit answers')
  }
}

/**
 * Get results for a question set
 */
export async function getQuestionSetResults(setId: string): Promise<QuestionSetResult[]> {
  try {
    const response = await api.get(`/pl-questions-sets/${setId}/results`)
    return response.data
  } catch (error: any) {
    console.error('Error fetching results:', error)
    throw new Error(error.response?.data?.error || 'Failed to fetch results')
  }
}

/**
 * Delete a question set
 */
export async function deleteQuestionSet(id: string): Promise<void> {
  try {
    await api.delete(`/pl-questions-sets/${id}`)
  } catch (error: any) {
    console.error('Error deleting question set:', error)
    throw new Error(error.response?.data?.error || 'Failed to delete question set')
  }
}

