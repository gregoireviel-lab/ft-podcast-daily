/**
 * Home skeleton — shown during navigation / streaming (Next App Router).
 * Mirrors the real layout so there is no jump when content arrives.
 */
export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-bg" aria-busy="true" aria-label="Chargement des épisodes">
      <header className="mx-auto max-w-2xl px-5 pt-10 pb-7">
        <div className="flex items-center gap-3.5">
          <div className="skeleton h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-32 rounded-md" />
            <div className="skeleton h-3.5 w-44 rounded" />
          </div>
        </div>
        <div className="skeleton mt-4 h-3 w-72 max-w-full rounded" />
      </header>

      <section className="mx-auto max-w-2xl px-5 pb-4">
        <div className="skeleton mb-3 h-2.5 w-28 rounded" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-transparent bg-surface p-3.5">
      <div className="skeleton h-11 w-11 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="skeleton h-4 w-3/5 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-2.5 w-24 rounded" />
      </div>
    </div>
  );
}
