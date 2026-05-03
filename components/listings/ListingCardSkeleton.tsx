export function ListingCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '0.5px solid rgba(122,106,94,0.15)', background: 'white' }}
    >
      {/* Image skeleton */}
      <div className="aspect-[4/3] skeleton-shimmer" />
      {/* Content skeleton */}
      <div className="p-3.5 space-y-2.5">
        <div className="h-2.5 skeleton-shimmer rounded-full w-1/2" />
        <div className="h-3.5 skeleton-shimmer rounded w-full" />
        <div className="h-3 skeleton-shimmer rounded w-3/4" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 skeleton-shimmer rounded-full w-12" />
          <div className="h-4 skeleton-shimmer rounded w-20" />
        </div>
      </div>
    </div>
  )
}
