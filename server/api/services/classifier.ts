// Need a group creation logic to properly run it, and throw error if group not found. 
// For now, default to NON_STEM if group not found.

import { getGroup } from '../../db/groups.ts'

export const classifyBySubject = async (groupId: string) => {
    const stemSubjects = ['science', 'intelligence', 'technology', 'cyber', 
        'biology', 'bioinformatics', 'informatics', 'engineering', 'pharm', 'forensic', 'chem', 
        'astro', 'medic', 'physic', 'psych', 'research', 'accounting', 'statistic', 
        'economics', 'architecture', 'math', 'algorithm', 'software', 'robotic', 
        'geology', 'programming']

    const group = await getGroup(groupId)
    if (!group) {
        //throw new Error('Group not found')
        return 'NON_STEM' // Default to NON_STEM if group not found
    }

    const title = group.title.toLowerCase()

    const isStem = stemSubjects.some(subject => title.includes(subject))
    return isStem ? 'STEM' : 'NON_STEM'
}
