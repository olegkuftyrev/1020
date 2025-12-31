import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  getPlQuestions, 
  getQuestionSets, 
  createQuestionSet, 
  deleteQuestionSet,
  type PlQuestion,
  type QuestionSet 
} from '@/utils/plQuestionsApi'
import { Plus, Trash2, Play, Settings } from 'lucide-react'

// SWR fetchers
const questionsFetcher = async () => {
  const response = await fetch('/api/pl-questions')
  if (!response.ok) throw new Error('Failed to fetch questions')
  return response.json()
}

const setsFetcher = async () => {
  const response = await fetch('/api/pl-questions-sets')
  if (!response.ok) throw new Error('Failed to fetch sets')
  return response.json()
}

export function PLQuestions() {
  const navigate = useNavigate()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAnswers, setShowAnswers] = useState(true)
  const [showFormula, setShowFormula] = useState(true)
  const [showExplanation, setShowExplanation] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const { data: questions = [], isLoading: isLoadingQuestions } = useSWR<PlQuestion[]>(
    '/pl-questions',
    questionsFetcher,
    { revalidateOnFocus: false }
  )

  const { data: sets = [], mutate: mutateSets, isLoading: isLoadingSets } = useSWR<QuestionSet[]>(
    '/pl-questions-sets',
    setsFetcher,
    { revalidateOnFocus: false }
  )

  const generateSetName = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
    const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '') // HHMM
    const index = sets.length + 1
    return `${dateStr}_${timeStr}_${index}`
  }

  const getRandomQuestions = (count: number): string[] => {
    if (questions.length < count) {
      return questions.map(q => q.questionId)
    }
    
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count).map(q => q.questionId)
  }

  const handleCreateSet = async () => {
    console.log('handleCreateSet called', { questionsLength: questions.length })
    
    if (questions.length < 10) {
      alert(`Not enough questions available. Need at least 10 questions. Currently have ${questions.length}.`)
      return
    }

    setIsCreating(true)
    try {
      const randomQuestionIds = getRandomQuestions(10)
      const setName = generateSetName()
      
      console.log('Creating set:', { name: setName, questionIds: randomQuestionIds })
      
      const result = await createQuestionSet({
        name: setName,
        showAnswers,
        showFormula,
        showExplanation,
        questionIds: randomQuestionIds,
      })
      
      console.log('Set created successfully:', result)
      
      setShowCreateForm(false)
      await mutateSets()
    } catch (error: any) {
      console.error('Error creating set:', error)
      alert(`Failed to create set: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question set?')) {
      return
    }

    try {
      await deleteQuestionSet(id)
      mutateSets()
    } catch (error: any) {
      alert(`Failed to delete set: ${error.message}`)
    }
  }

  if (isLoadingQuestions || isLoadingSets) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">P&L Questions</h1>
          <p className="text-muted-foreground">
            Create question sets and test your P&L knowledge
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="iron-border"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Set
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6 border-primary/20 bg-card/40">
          <h2 className="text-xl font-bold text-foreground mb-4">Create New Question Set</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-foreground mb-2">
                A random set of 10 questions will be automatically selected from the available questions.
                The set will be named with the current date, time, and an index number.
              </p>
              <p className={`text-xs font-medium ${questions.length < 10 ? 'text-destructive' : 'text-muted-foreground'}`}>
                Available questions: {questions.length} {questions.length < 10 && '(Need at least 10 to create a set)'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Test Settings
              </label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showAnswers"
                  checked={showAnswers}
                  onCheckedChange={(checked) => setShowAnswers(checked === true)}
                />
                <label htmlFor="showAnswers" className="text-sm text-foreground cursor-pointer">
                  Show Answer Options
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showFormula"
                  checked={showFormula}
                  onCheckedChange={(checked) => setShowFormula(checked === true)}
                />
                <label htmlFor="showFormula" className="text-sm text-foreground cursor-pointer">
                  Show Formula
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showExplanation"
                  checked={showExplanation}
                  onCheckedChange={(checked) => setShowExplanation(checked === true)}
                />
                <label htmlFor="showExplanation" className="text-sm text-foreground cursor-pointer">
                  Show Explanation
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Button clicked, questions.length:', questions.length)
                  handleCreateSet()
                }} 
                disabled={isCreating || questions.length < 10}
                className="iron-border"
                type="button"
              >
                {isCreating ? 'Creating...' : `Create Random Set (${questions.length} available)`}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                }}
                disabled={isCreating}
                className="iron-border"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sets.map((set) => (
          <Card
            key={set.id}
            className="p-6 border-primary/20 bg-card/40 hover:border-primary/40 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{set.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {set.questionIds.length} questions
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteSet(set.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Settings className="h-3 w-3" />
                <span>Show Answers: {set.showAnswers ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Settings className="h-3 w-3" />
                <span>Show Formula: {set.showFormula ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Settings className="h-3 w-3" />
                <span>Show Explanation: {set.showExplanation ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/pl-questions/${set.id}`)}
              className="w-full iron-border"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Test
            </Button>
          </Card>
        ))}
      </div>

      {sets.length === 0 && !showCreateForm && (
        <Card className="p-12 text-center border-primary/20 bg-card/40">
          <p className="text-muted-foreground mb-4">No question sets yet</p>
          <Button onClick={() => setShowCreateForm(true)} className="iron-border">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Set
          </Button>
        </Card>
      )}
    </div>
  )
}

