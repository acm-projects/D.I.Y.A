export function getTemperature(type: string): number {
    if (type === 'STEM') {
        return 0.3  // Higher accuracy for STEM subjects
    }
    return 0.7 // Higher creativity for non-STEM or unclassified subjects
}
