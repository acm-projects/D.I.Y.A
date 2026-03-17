import { Router } from 'express'
import { createGroup, getGroup, updateGroup, deleteGroup } from '../../db/groups.ts'

const router = Router()

router.post('/', async (req, res) => {
    try {
        const group = await createGroup(req.body)
        res.status(201).json(group)
    } catch (error) {
        console.error(error)
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