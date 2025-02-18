export function isEmptyObject(obj: unknown): boolean {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return false;
  }
  return Object.keys(obj).length === 0;
}
