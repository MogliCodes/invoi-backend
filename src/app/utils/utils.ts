export function isEmptyObject(obj: unknown): boolean {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Object.keys(obj).length === 0;
}
