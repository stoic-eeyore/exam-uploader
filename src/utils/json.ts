export function extractJson(text: string) {
  return (
    text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      //.replace(/(?<!\\)\\(?!["\\\/bfnrtu])/g, '\\\\')
      .trim()
  )
}
