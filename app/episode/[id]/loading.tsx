/**
 * Episode-detail skeleton — shown while a static/ISR episode page streams in.
 */
export default function EpisodeLoading() {
  return (
    <main className="min-h-screen bg-bg" aria-busy="true" aria-label="Chargement de l'épisode">
      <header className="mx-auto max-w-2xl px-5 pt-8 pb-7">
        <div className="skeleton mb-6 h-4 w-36 rounded" />
        <div className="flex items-start gap-4">
          <div className="skeleton h-16 w-16 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2.5">
            <div className="skeleton h-2.5 w-28 rounded" />
            <div className="skeleton h-6 w-4/5 rounded-md" />
            <div className="skeleton h-3.5 w-52 rounded" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-3 px-5">
        <div className="skeleton h-2.5 w-20 rounded" />
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-11/12 rounded" />
        <div className="skeleton h-3.5 w-4/5 rounded" />
      </div>
    </main>
  );
}
