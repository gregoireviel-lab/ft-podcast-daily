import EpisodeListClient from "@/components/EpisodeList";
import { BrandGlyph } from "@/components/BrandMark";
import { getEpisodes } from "@/lib/episodes";
import type { Episode } from "@/types/episode";

// Daily content -> statically render and revalidate every 15 min (ISR).
export const revalidate = 900;

export default async function HomePage() {
  let episodes: Episode[] = [];
  let loadError = false;
  try {
    episodes = await getEpisodes(30);
  } catch (err) {
    console.error("[HomePage] failed to load episodes:", err);
    loadError = true;
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Header — soft accent-tinted wash for depth, no hard gradient banding */}
      <header className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(120% 100% at 15% 0%, rgba(255,178,122,0.10), transparent 55%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-7">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-contrast shadow-lg shadow-black/30">
              <BrandGlyph className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-serif text-[1.7rem] font-semibold leading-none tracking-tight text-fg">
                Kairos
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Ton briefing mondial quotidien · synthèse IA
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-[0.8125rem] leading-relaxed text-subtle">
            Chaque matin à 7h, l&apos;essentiel de l&apos;actualité mondiale condensé en un
            épisode audio à écouter en quelques minutes.
          </p>
        </div>
      </header>

      {/* Episode list */}
      <section className="mx-auto max-w-2xl px-5 pb-4">
        <h2 className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
          Épisodes récents
        </h2>
        <EpisodeListClient episodes={episodes} loadError={loadError} />
      </section>
    </main>
  );
}
