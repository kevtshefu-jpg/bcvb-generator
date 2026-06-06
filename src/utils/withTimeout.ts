export async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = 12000,
  message = 'La requête a dépassé le temps maximum.'
): Promise<T> {
  let timeoutId: number | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId)
  }
}
