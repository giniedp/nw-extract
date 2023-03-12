export function wrapError(message: string) {
  return (error: Error) => {
    throw new Error(message, {
      cause: error,
    })
  }
}
