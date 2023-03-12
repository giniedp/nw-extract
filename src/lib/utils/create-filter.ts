import { globMatch } from "./file-utils"

export function createFilter(pattern: string[]) {
  const include = pattern.filter((it) => !it.startsWith('!'))
  const exclude = pattern.filter((it) => it.startsWith('!')).map((it) => it.substring(1))
  return (file: string) => {
    if (exclude.length && globMatch([file], exclude).length) {
      return false
    }
    if (include.length && !globMatch([file], include).length) {
      return false
    }
    return true
  }
}
