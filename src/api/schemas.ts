export const healthSchema = {
  type: 'object',
  required: ['status', 'timestamp'],
  properties: {
    status: { type: 'string' },
    timestamp: { type: 'string' },
    uptime: { type: 'number' }
  }
} as const;
