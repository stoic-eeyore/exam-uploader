import { Markdown } from '@/components/questions/Markdown'

interface Props {
  content: string
  images?: any[]
}

export function StimulusContent({ content, images }: Props) {
  const image = images?.[0]
  const placement = image?.placement ?? 'none'

  switch (placement) {
    case 'right':
      return (
        <div className="grid grid-cols-[minmax(0,600px)_220px] gap-6 items-start">
          <div className="flex-1 prose max-w-none text-amber-900 text-[15px]">
            <Markdown>{content ?? ''}</Markdown>
          </div>
          {image && (
            <img src={image.url} width={image.width ?? 220} className="shrink-0 max-w-none" />
          )}
        </div>
      )
    default:
      return (
        <div className="prose max-w-none text-amber-900 text-[15px]">
          <Markdown>{content ?? ''}</Markdown>
          {image && (
            <img src={image.url} width={image.width ?? 220} className="shrink-0 max-w-none" />
          )}
        </div>
      )
  }
}
