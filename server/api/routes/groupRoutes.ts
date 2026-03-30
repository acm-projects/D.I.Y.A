import { Router } from 'express'
import { createGroup, getGroups, getGroup, updateGroup, deleteGroup } from '../../db/groups.ts'

const router = Router()

router.get('/', async (_req, res) => {
    try {
        const groups = await getGroups()
        res.json(groups)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not retrieve groups.' })
    }
})

router.post('/', async (req, res) => {
    try {
        const title = typeof req.body?.title === 'string' ? req.body.title : ''
        const description = typeof req.body?.description === 'string' ? req.body.description : ''
        const professorId = typeof req.body?.professorId === 'string' ? req.body.professorId : ''

        if (!title.trim() || !professorId.trim()) {
            return res.status(400).json({ error: 'Group title and professorId are required.' })
        }

        const group = await createGroup({
            title,
            description,
            professorId,
        })
        res.status(201).json(group)
    } catch (error) {
        console.error(error)
        if (error instanceof Error && error.message === 'Professor user record could not be found.') {
            return res.status(404).json({ error: 'Professor record not found.' })
        }

        if (error instanceof Error && (error.message === 'Professor id is required to create a group.' || error.message === 'Group title is required.')) {
            return res.status(400).json({ error: error.message })
        }

        res.status(500).json({ error: 'Could not create group.' })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const group = await getGroup(req.params.id)
        if (group) {
            res.json(group)
        } else {
            res.status(404).json({ error: 'Group not found.' })
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not retrieve group.' })
    }
})

router.put('/:id', async (req, res) => {
    try {
        await updateGroup(req.params.id, req.body)
        res.json({ success: true, message: 'Group updated successfully.' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not update group.' })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        await deleteGroup(req.params.id)
        res.json({ success: true, message: 'Group deleted successfully.' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Could not delete group.' })
    }
})

export default router