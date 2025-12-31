import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default class PlQuestionsController {
  /**
   * Get all questions
   */
  async index({ response }: HttpContext) {
    try {
      const questions = await prisma.plQuestion.findMany({
        orderBy: { questionId: 'asc' },
      })
      return response.ok(questions)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to fetch questions',
        message: error.message,
      })
    }
  }

  /**
   * Get a single question by ID
   */
  async show({ params, response }: HttpContext) {
    try {
      const question = await prisma.plQuestion.findUnique({
        where: { id: params.id },
      })

      if (!question) {
        return response.notFound({ error: 'Question not found' })
      }

      return response.ok(question)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to fetch question',
        message: error.message,
      })
    }
  }

  /**
   * Get all question sets
   */
  async getSets({ response }: HttpContext) {
    try {
      const sets = await prisma.questionSet.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { results: true },
          },
        },
      })
      return response.ok(sets)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to fetch question sets',
        message: error.message,
      })
    }
  }

  /**
   * Get a single question set by ID
   */
  async getSet({ params, response }: HttpContext) {
    try {
      const set = await prisma.questionSet.findUnique({
        where: { id: params.id },
        include: {
          results: {
            orderBy: { completedAt: 'desc' },
            take: 10, // Last 10 results
          },
        },
      })

      if (!set) {
        return response.notFound({ error: 'Question set not found' })
      }

      // Fetch questions for this set
      const questions = await prisma.plQuestion.findMany({
        where: {
          questionId: { in: set.questionIds },
        },
        orderBy: { questionId: 'asc' },
      })

      return response.ok({
        ...set,
        questions,
      })
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to fetch question set',
        message: error.message,
      })
    }
  }

  /**
   * Create a new question set
   */
  async createSet({ request, response }: HttpContext) {
    try {
      const body = request.body()
      const { name, showAnswers, showFormula, showExplanation, questionIds } = body

      if (!name || !Array.isArray(questionIds) || questionIds.length !== 10) {
        return response.badRequest({
          error: 'Invalid request. Name and exactly 10 question IDs are required.',
        })
      }

      const set = await prisma.questionSet.create({
        data: {
          name,
          showAnswers: showAnswers !== undefined ? showAnswers : true,
          showFormula: showFormula !== undefined ? showFormula : true,
          showExplanation: showExplanation !== undefined ? showExplanation : true,
          questionIds,
        },
      })

      return response.ok(set)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to create question set',
        message: error.message,
      })
    }
  }

  /**
   * Submit answers for a question set
   */
  async submitAnswers({ params, request, response }: HttpContext) {
    try {
      const body = request.body()
      const { answers } = body

      const set = await prisma.questionSet.findUnique({
        where: { id: params.id },
      })

      if (!set) {
        return response.notFound({ error: 'Question set not found' })
      }

      // Get all questions in the set
      const questions = await prisma.plQuestion.findMany({
        where: {
          questionId: { in: set.questionIds },
        },
      })

      // Calculate score
      let score = 0
      questions.forEach((question) => {
        const selectedAnswer = answers[question.questionId]
        if (selectedAnswer === question.correctAnswer) {
          score++
        }
      })

      // Save result
      const result = await prisma.questionSetResult.create({
        data: {
          questionSetId: set.id,
          answers,
          score,
          totalQuestions: questions.length,
        },
      })

      return response.ok({
        result,
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
      })
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to submit answers',
        message: error.message,
      })
    }
  }

  /**
   * Get results for a question set
   */
  async getResults({ params, response }: HttpContext) {
    try {
      const results = await prisma.questionSetResult.findMany({
        where: { questionSetId: params.id },
        orderBy: { completedAt: 'desc' },
      })

      return response.ok(results)
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to fetch results',
        message: error.message,
      })
    }
  }

  /**
   * Delete a question set
   */
  async deleteSet({ params, response }: HttpContext) {
    try {
      await prisma.questionSet.delete({
        where: { id: params.id },
      })

      return response.ok({ message: 'Question set deleted successfully' })
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to delete question set',
        message: error.message,
      })
    }
  }

  /**
   * Bulk create/update questions
   */
  async bulkCreateQuestions({ request, response }: HttpContext) {
    try {
      const body = request.body()
      const { questions } = body

      if (!Array.isArray(questions)) {
        return response.badRequest({ error: 'Questions must be an array' })
      }

      const results = []
      for (const question of questions) {
        const result = await prisma.plQuestion.upsert({
          where: { questionId: question.questionId },
          update: question,
          create: question,
        })
        results.push(result)
      }

      return response.ok({
        message: `Successfully processed ${results.length} questions`,
        count: results.length,
      })
    } catch (error: any) {
      return response.internalServerError({
        error: 'Failed to bulk create questions',
        message: error.message,
      })
    }
  }
}

