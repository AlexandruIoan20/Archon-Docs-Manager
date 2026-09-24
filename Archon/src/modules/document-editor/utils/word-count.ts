// Letters and digits in any script; `don't`, `e-mail` and `l’apel` count as one word.
const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu

export function countWords(text: string): number {
  return text.match(WORD)?.length ?? 0
}
