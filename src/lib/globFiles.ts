import * as glob from "fast-glob";

export function globFiles(pattern: string): Promise<string[]> {
    return glob(pattern.replace(/\\/gi, '/'))
}