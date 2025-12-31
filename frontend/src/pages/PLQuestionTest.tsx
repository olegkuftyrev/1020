import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  getQuestionSet, 
  submitAnswers,
  type QuestionSet,
  type PlQuestion 
} from '@/utils/plQuestionsApi'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

const setFetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch question set')
  return response.json()
}

export function PLQuestionTest() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; totalQuestions: number; percentage: number } | null>(null)

  const { data: setData, isLoading } = useSWR<QuestionSet>(
    id ? `/pl-questions-sets/${id}` : null,
    setFetcher,
    { revalidateOnFocus: false }
  )

  const questions = setData?.questions || []
  const currentQuestion = questions[currentQuestionIndex]

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      if (!confirm(`You have answered ${Object.keys(answers).length} out of ${questions.length} questions. Submit anyway?`)) {
        return
      }
    }

    setIsSubmitting(true)
    try {
      const result = await submitAnswers(id!, answers)
      setResult(result)
    } catch (error: any) {
      alert(`Failed to submit answers: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!setData || questions.length === 0) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-950/20 p-6">
        <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
        <p className="text-red-300">Question set not found</p>
        <Button
          onClick={() => navigate('/pl-questions')}
          variant="outline"
          className="mt-4 iron-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Button>
      </div>
    )
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="p-8 border-primary/20 bg-card/40 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Test Results</h2>
          <div className="text-6xl font-bold text-primary mb-2">
            {result.score}/{result.totalQuestions}
          </div>
          <div className="text-2xl font-semibold text-foreground mb-6">
            {result.percentage}%
          </div>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/pl-questions')}
              variant="outline"
              className="iron-border"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sets
            </Button>
            <Button
              onClick={() => {
                setResult(null)
                setCurrentQuestionIndex(0)
                setAnswers({})
              }}
              className="iron-border"
            >
              Retake Test
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{setData.name}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <Button
          onClick={() => navigate('/pl-questions')}
          variant="outline"
          className="iron-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="p-6 border-primary/20 bg-card/40">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 whitespace-pre-line">
            {currentQuestion.label}
          </h2>

          {setData.showFormula && currentQuestion.formula && (
            <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary mb-1">Formula:</p>
              <p className="text-sm text-foreground">{currentQuestion.formula}</p>
            </div>
          )}

          {setData.showAnswers && (
            <RadioGroup
              value={answers[currentQuestion.questionId] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.questionId, value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-card/60 transition-colors">
                <RadioGroupItem value="a1" id="a1" />
                <Label htmlFor="a1" className="flex-1 cursor-pointer">
                  {currentQuestion.a1}
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-card/60 transition-colors">
                <RadioGroupItem value="a2" id="a2" />
                <Label htmlFor="a2" className="flex-1 cursor-pointer">
                  {currentQuestion.a2}
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-card/60 transition-colors">
                <RadioGroupItem value="a3" id="a3" />
                <Label htmlFor="a3" className="flex-1 cursor-pointer">
                  {currentQuestion.a3}
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-card/60 transition-colors">
                <RadioGroupItem value="a4" id="a4" />
                <Label htmlFor="a4" className="flex-1 cursor-pointer">
                  {currentQuestion.a4}
                </Label>
              </div>
            </RadioGroup>
          )}

          {setData.showExplanation && currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-primary/10">
              <p className="text-sm font-medium text-foreground mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-primary/20">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="iron-border"
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-primary-foreground'
                    : answers[questions[index].questionId]
                    ? 'bg-primary/40 text-foreground'
                    : 'bg-card/60 text-muted-foreground hover:bg-card/80'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext} className="iron-border">
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="iron-border"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

