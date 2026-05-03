'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Grid2x2 } from 'lucide-react'

interface PhotoGalleryProps {
  images: Array<{ url: string; altTextEn?: string | null }>
  title: string
}

/* ── Lightbox ── */
function Lightbox({
  images,
  title,
  startIndex,
  onClose,
}: {
  images: Array<{ url: string; altTextEn?: string | null }>
  title: string
  startIndex: number
  onClose: () => void
}) {
  const [current, setCurrent] = useState(startIndex)

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), [])
  const next = useCallback(() => setCurrent((c) => Math.min(images.length - 1, c + 1)), [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [prev, next, onClose])

  /* Lock scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/60 text-sm"
          style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}>
          {current + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 relative flex items-center justify-center px-16 min-h-0"
        onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full h-full max-w-5xl max-h-[70vh]">
          <Image
            src={images[current].url}
            alt={images[current].altTextEn ?? title}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* Prev / next arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); prev() }}
          disabled={current === 0}
          className="absolute start-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-colors"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next() }}
          disabled={current === images.length - 1}
          className="absolute end-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-20 transition-colors"
          aria-label="Next photo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div
        className="flex gap-2 px-6 py-4 overflow-x-auto flex-shrink-0"
        style={{ scrollbarWidth: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="flex-shrink-0 relative w-16 h-12 rounded overflow-hidden transition-all"
            style={{
              outline: i === current ? '2px solid #C4582A' : '2px solid transparent',
              outlineOffset: '2px',
              opacity: i === current ? 1 : 0.5,
            }}
            aria-label={`View photo ${i + 1}`}
          >
            <Image
              src={img.url}
              alt={img.altTextEn ?? `Photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main grid component ── */
export function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!images.length) {
    return (
      <div
        className="w-full h-72 bg-[#EDE0CC] rounded-2xl flex flex-col items-center justify-center gap-2"
        style={{ border: '0.5px solid rgba(122,106,94,0.15)' }}
      >
        <div className="text-[#9A8878] text-4xl">🏠</div>
        <span className="text-[#9A8878] text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>No photos yet</span>
      </div>
    )
  }

  const count = images.length
  const cover = images[0]

  /* ── Adaptive grid layout based on photo count ── */
  let gridContent: React.ReactNode

  if (count === 1) {
    /* Single photo — full width */
    gridContent = (
      <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => setLightboxIndex(0)}>
        <Image src={cover.url} alt={cover.altTextEn ?? title} fill className="object-cover group-hover:brightness-95 transition-all" priority sizes="100vw" />
      </div>
    )
  } else if (count === 2) {
    /* 2 photos: equal halves */
    gridContent = (
      <div className="grid grid-cols-2 gap-2 h-72 md:h-96 rounded-2xl overflow-hidden">
        {images.slice(0, 2).map((img, i) => (
          <div key={i} className="relative cursor-pointer group" onClick={() => setLightboxIndex(i)}>
            <Image src={img.url} alt={img.altTextEn ?? title} fill className="object-cover group-hover:brightness-95 transition-all" sizes="50vw" priority={i === 0} />
          </div>
        ))}
      </div>
    )
  } else if (count === 3) {
    /* 3 photos: 1 large left + 2 stacked right */
    gridContent = (
      <div className="grid grid-cols-2 gap-2 h-72 md:h-96 rounded-2xl overflow-hidden">
        <div className="relative cursor-pointer group" onClick={() => setLightboxIndex(0)}>
          <Image src={cover.url} alt={cover.altTextEn ?? title} fill className="object-cover group-hover:brightness-95 transition-all" priority sizes="50vw" />
        </div>
        <div className="grid grid-rows-2 gap-2">
          {images.slice(1, 3).map((img, i) => (
            <div key={i} className="relative cursor-pointer group" onClick={() => setLightboxIndex(i + 1)}>
              <Image src={img.url} alt={img.altTextEn ?? title} fill className="object-cover group-hover:brightness-95 transition-all" sizes="25vw" />
            </div>
          ))}
        </div>
      </div>
    )
  } else if (count === 4) {
    /* 4 photos: 1 large left + 3 stacked right (top 2 stacked, bottom full) */
    gridContent = (
      <div className="grid grid-cols-2 gap-2 h-72 md:h-96 rounded-2xl overflow-hidden">
        <div className="relative cursor-pointer group" onClick={() => setLightboxIndex(0)}>
          <Image src={cover.url} alt={cover.altTextEn ?? title} fill className="object-cover group-hover:brightness-95 transition-all" priority sizes="50vw" />
        </div>
        <div className="grid grid-rows-3 gap-2">
          {images.slice(1, 4).map((img, i) => (
            <div key={i} className="relative cursor-pointer group" onClick={() => setLightboxIndex(i + 1)}>
              <Image src={img.url} alt={img.altTextEn ?? title} fill className="object-cover group-hover:brightness-95 transition-all" sizes="25vw" />
            </div>
          ))}
        </div>
      </div>
    )
  } else {
    /* 5+ photos: standard Airbnb-style grid */
    gridContent = (
      <div className="grid grid-cols-4 gap-2 h-72 md:h-96 rounded-2xl overflow-hidden">
        <div className="col-span-2 row-span-2 relative cursor-pointer group" onClick={() => setLightboxIndex(0)}>
          <Image src={cover.url} alt={cover.altTextEn ?? title} fill className="object-cover group-hover:brightness-95 transition-all" priority sizes="50vw" />
        </div>
        {images.slice(1, 5).map((img, i) => (
          <div key={i} className="relative cursor-pointer group hidden md:block" onClick={() => setLightboxIndex(i + 1)}>
            <Image src={img.url} alt={img.altTextEn ?? title} fill className="object-cover group-hover:brightness-95 transition-all" sizes="25vw" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="relative">
        {gridContent}

        {/* "Show all photos" button */}
        <button
          onClick={() => setLightboxIndex(0)}
          className="absolute bottom-3 end-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#1C1613] rounded-lg px-3 py-2 text-xs font-medium border border-[#EDE0CC] hover:bg-white transition-colors shadow-sm"
          style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          <Grid2x2 className="w-3.5 h-3.5" />
          {title && title.includes('ا') ? `عرض ${images.length} صورة` : `Show all ${images.length} photos`}
        </button>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          title={title}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
