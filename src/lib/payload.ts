import payload from 'payload'
import config from '@payload-config'

let cached = (global as any).payload

if (!cached) {
  cached = { client: null, promise: null }
  ;(global as any).payload = cached
}

export async function getPayloadClient() {
  if (cached.client) {
    return cached.client
  }

  if (!cached.promise) {
    cached.promise = payload.init({
      config,
    })
  }

  cached.client = await cached.promise
  return cached.client
}
