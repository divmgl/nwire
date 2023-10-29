export function pick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  const result: Partial<T> = {}
  keys.flat().forEach((key) => {
    if (key in obj) {
      result[key as keyof typeof obj] = obj[key as keyof typeof obj]
    }
  })
  return result as Pick<T, K>
}
