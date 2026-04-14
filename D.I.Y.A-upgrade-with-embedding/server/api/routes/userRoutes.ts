import { Router } from 'express'
import { getUsers, syncUserFromAuth, updateUser } from '../../db/users.ts'

const router = Router()

const normalizeParam = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim()
    return normalized ? normalized : null
}

const normalizeRole = (value: string | null | undefined): 'student' | 'professor' => {
    const normalized = value?.trim().toLowerCase()

    if (normalized === 'professor' || normalized === 'admin' || normalized === 'ta') {
        return 'professor'
    }

    return 'student'
}

const normalizeRequestedRole = (value: string | null | undefined): 'student' | 'professor' | undefined => {
    if (!value) {
        return undefined
    }

    return normalizeRole(value)
}

router.get('/', async (_req, res) => {
    try {
        const role = normalizeParam(_req.query.role)?.toLowerCase()
        const users = await getUsers()
        const filteredUsers = role
            ? users.filter((user) => user.role.trim().toLowerCase() === role)
            : users

        return res.json(filteredUsers)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Could not retrieve users.' })
    }
})

router.get('/role', async (req, res) => {
    try {
        const email = normalizeParam(req.query.email)
        const id = normalizeParam(req.query.id) || normalizeParam(req.query.sub)
        const name = normalizeParam(req.query.name)
        const selectedRole = normalizeRequestedRole(normalizeParam(req.query.selectedRole))

        if (!email && !id) {
            return res.status(400).json({ error: 'Either email or Auth0 id/sub is required.' })
        }

        const user = await syncUserFromAuth({
            email,
            id,
            name,
            ...(selectedRole ? { role: selectedRole } : {}),
        })

        return res.json({
            role: normalizeRole(user.role),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Could not retrieve user role.' })
    }
})

router.put('/:id', async (req, res) => {
    try {
        const id = normalizeParam(req.params.id)

        if (!id) {
            return res.status(400).json({ error: 'User id is required.' })
        }

        await updateUser(id, req.body)
        return res.json({ success: true, message: 'User updated successfully.' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Could not update user.' })
    }
})

export default router
