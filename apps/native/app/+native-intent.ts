import { getShareExtensionKey } from "expo-share-intent"

export function redirectSystemPath(params: { path: string; initial: boolean }) {
  const { path } = params

  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return "/"
    }
    return path
  } catch {
    return "/"
  }
}
