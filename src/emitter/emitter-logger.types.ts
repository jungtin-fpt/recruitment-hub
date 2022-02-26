export type EmitterLogger = {
    type: 'string' | 'object',
    level: 'info' | 'warn' | 'error',
    data: string,
}