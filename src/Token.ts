export enum Token { ">", "<", "+", "-", ".", ",", "[", "]" }

export function isToken (str: string): boolean {
  return Object.values(Token).includes(str)
}