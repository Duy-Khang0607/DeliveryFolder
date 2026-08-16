export const extractImageUrl = (text: string): string | null => {
    const trimmed = text.trim()
    if (!trimmed) return null

    if (/^https?:\/\/.+/i.test(trimmed)) return trimmed

    const match = trimmed.match(/https?:\/\/[^\s"'<>]+/i)
    return match?.[0] ?? null
}

export const isValidHttpUrl = (value: string): boolean => {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}
