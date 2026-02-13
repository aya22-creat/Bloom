import React, { useEffect, useMemo, useState } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
  retryMs?: number
  maxRetries?: number
}

export default function ProductImageAuto({ src, alt, className, retryMs = 3500, maxRetries = 8 }: Props) {
  const [attempt, setAttempt] = useState(0)
  const [cacheBust, setCacheBust] = useState<number>(Date.now())
  const [loading, setLoading] = useState(true)

  const computedSrc = useMemo(() => {
    const sep = src.includes('?') ? '&' : '?'
    return `${src}${sep}_=${cacheBust}`
  }, [src, cacheBust])

  useEffect(() => {
    if (attempt >= maxRetries) return
    const id = window.setInterval(() => {
      setCacheBust(Date.now())
      setAttempt((a) => a + 1)
    }, retryMs)
    return () => window.clearInterval(id)
  }, [attempt, maxRetries, retryMs])

  return (
    <div className="relative">
      <img
        src={computedSrc}
        alt={alt}
        className={className}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(true)
          setCacheBust(Date.now())
        }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-transparent">
          جاري توليد الصورة...
        </div>
      )}
    </div>
  )
}

