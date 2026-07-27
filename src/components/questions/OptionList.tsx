import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'

interface Props {
  options: any[]
}

export default function OptionList({ options }: Props) {
  const midpoint = Math.ceil(options.length / 2)

  const left = options.slice(0, midpoint)
  const right = options.slice(midpoint)

  function renderOption(option: any, index: number) {
    const choiceLetter = String.fromCharCode(65 + index)

    return (
      <div
        key={option.id ?? index}
        className="flex items-start gap-2 rounded-md border bg-gray-50/50 p-2 text-[13px] text-gray-600"
      >
        <span className="font-bold text-gray-400">{choiceLetter}.</span>

        <div className="flex-1 prose max-w-none text-[13px]">
          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
            {option.text}
          </ReactMarkdown>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 pl-[3.25rem] md:grid-cols-2 md:gap-6">
      <div className="space-y-2">{left.map((option, index) => renderOption(option, index))}</div>

      <div className="space-y-2">
        {right.map((option, index) => renderOption(option, index + midpoint))}
      </div>
    </div>
  )
}
