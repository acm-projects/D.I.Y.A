import { Router } from 'express'
import {
    createSelfCheck,
    getSelfChecksByStudent,
    type SelfCheckImprovement,
} from '../../db/selfChecks.ts'

const router = Router()

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim()

const toWords = (value: string): string[] => {
    const matches = value.toLowerCase().match(/[a-z0-9]{4,}/g)
    return matches ?? []
}

const unique = (values: string[]): string[] => Array.from(new Set(values))

const extractSections = (rubricText: string, rubricName: string): string[] => {
    const lines = rubricText
        .split(/\r?\n/)
        .map((line) => normalizeText(line))
        .filter((line) => line.length >= 4)

    if (lines.length > 0) {
        return unique(lines).slice(0, 4)
    }

    const cleanedName = rubricName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
    return [
        cleanedName || 'Rubric Alignment',
        'Specific supporting details',
        'Clarity and organization',
    ]
}

const buildImprovements = (sections: string[], workText: string): SelfCheckImprovement[] => {
    const loweredWork = workText.toLowerCase()

    const improvements = sections.map((section) => {
        const keywords = toWords(section)
        const matched = keywords.some((keyword) => loweredWork.includes(keyword))

        return {
            section,
            suggestion: matched
                ? `Strengthen ${section.toLowerCase()} with one more precise example or direct reference to the rubric.`
                : `Address ${section.toLowerCase()} more directly so the submission aligns with the rubric expectations.`,
        }
    })

    return improvements.slice(0, 4)
}

const calculateScore = (rubricText: string, workText: string): number => {
    const rubricWords = unique(toWords(rubricText))
    const workWords = new Set(toWords(workText))

    if (rubricWords.length === 0) {
        return Math.min(96, 70 + Math.floor(workText.length / 250))
    }

    const matches = rubricWords.filter((word) => workWords.has(word)).length
    const coverage = matches / rubricWords.length
    const lengthBoost = Math.min(8, Math.floor(workText.length / 350))
    const score = Math.round(64 + coverage * 28 + lengthBoost)

    return Math.max(60, Math.min(99, score))
}

const toLetterGrade = (score: number): string => {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    if (score >= 67) return 'D+'
    if (score >= 63) return 'D'
    if (score >= 60) return 'D-'
    return 'F'
}

router.get('/student/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required.' })
        }

        const selfChecks = await getSelfChecksByStudent(studentId)
        res.json(selfChecks)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not retrieve self-check history.' })
    }
})

router.post('/analyze', async (req, res) => {
    try {
        const { studentId, assignmentName, rubricName, workText, rubricText } = req.body

        if (!studentId || !assignmentName || !rubricName) {
            return res.status(400).json({ error: 'studentId, assignmentName, and rubricName are required.' })
        }

        const normalizedWorkText = typeof workText === 'string' ? workText : ''
        const normalizedRubricText = typeof rubricText === 'string' ? rubricText : ''
        const sections = extractSections(normalizedRubricText, rubricName)
        const score = calculateScore(normalizedRubricText, normalizedWorkText)
        const selfCheck = await createSelfCheck({
            studentId,
            assignmentName,
            rubricName,
            potentialGrade: `${score}/100`,
            letterGrade: toLetterGrade(score),
            improvements: buildImprovements(sections, normalizedWorkText),
        })

        res.status(201).json(selfCheck)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not analyze self-check submission.' })
    }
})

export default router
