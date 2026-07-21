import EpisodeListClient from "@/components/EpisodeList";
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
    <main className="min-h-screen bg-[#121212]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a2a1a] to-[#121212] px-4 pt-8 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 1a9 9 0 0 1 9 9v7a3 3 0 0 1-3 3h-1v-8h2V10A8 8 0 0 0 4 10v2h2v8H5a3 3 0 0 1-3-3v-7a9 9 0 0 1 9-9Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">FT Daily</h1>
              <p className="text-[#b3b3b3] text-sm">Briefing Financial Times · IA</p>
            </div>
          </div>
          <p className="text-[#727272] text-xs mt-3">
            Synthèse audio quotidienne des articles FT — générée chaque matin à 7h.
          </p>
        </div>
      </div>

      {/* Episode list */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <h2 className="text-[#b3b3b3] text-xs font-semibold uppercase tracking-widest mb-3">
          Épisodes récents
        </h2>
        <EpisodeListClient episodes={episodes} loadError={loadError} />
      </div>
    </main>
  );
}
