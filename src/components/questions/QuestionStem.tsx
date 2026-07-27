import { Markdown } from './Markdown'

interface Props {
  question: any
}

export function QuestionStem({ question }: Props) {
  const image = question.images?.[0]
  const placement = image?.placement ?? 'none'

  switch (placement) {
    case 'right':
      return (
        <div className="grid grid-cols-[minmax(0,600px)_220px] gap-6 items-start">
          <div className="flex-1 prose max-w-none text-gray-800 text-[15px]">
            <Markdown>{question.questionText ?? ''}</Markdown>
          </div>

          {image && <img src={image.url} width={image.width ?? 220} className="shrink-0" />}
        </div>
      )

    default:
      return (
        <div className="prose max-w-none text-gray-800 text-[15px]">
          <Markdown>{question.questionText ?? ''}</Markdown>
        </div>
      )
  }
}
