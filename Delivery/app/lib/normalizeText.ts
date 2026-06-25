export function normalizeText(str: string): string {
    if (!str) return ''
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, m => m === 'đ' ? 'd' : 'D')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
}