@AGENTS.md

# FT Daily Podcast — SaaS Interface

Interface web Spotify-like pour écouter les épisodes quotidiens du FT Daily Podcast.
C'est UNIQUEMENT l'interface de lecture — la génération est un pipeline local.

## Architecture globale

```
[Mac de Greg @ 7h — launchd]              [Cloud]                 [Vercel]
Pipeline local (analysis/ft-podcast-daily) → Neon (métadonnées)  → cette app (Next.js 15)
  fetch → claude CLI → Chatterbox TTS      + Vercel Blob (MP3)      lecture SSG/ISR
```

Cron LOCAL (launchd), pas de cron cloud, pas d'auth utilisateur.

## Stack
- Next.js **15** (App Router) + React 19 + TypeScript + Tailwind CSS v4 — pnpm
- **Neon** (Postgres) pour les métadonnées épisodes — lecture **serveur** (SSG/ISR)
- **Vercel Blob** pour les MP3 (URL publiques, streamées par `<audio>`)
- Vercel — hébergement

> Historique : scaffoldé en Firebase + Next 16. Migré vers Neon + Vercel Blob et
> aligné sur Next 15 (stack Greg) par Ada. Plus aucune dépendance Firebase.

## Données — Neon

### Table `episodes`
```sql
CREATE TABLE episodes (
  id            TEXT PRIMARY KEY,   -- date YYYY-MM-DD (= doc id)
  date          DATE NOT NULL,
  title         TEXT NOT NULL,
  summary       TEXT NOT NULL DEFAULT '',
  audio_url     TEXT NOT NULL DEFAULT '',   -- URL publique Vercel Blob
  duration_sec  INTEGER NOT NULL DEFAULT 0, -- mesurée via ffprobe
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX episodes_date_idx ON episodes (date DESC);
```
- Projet Neon : `ft-podcast-daily` (org Grégoire, `bitter-credit-47171914`).
- Le pipeline fait un `INSERT ... ON CONFLICT (id) DO UPDATE` → un re-run remplace le jour.

## Vercel Blob
- Store `ft-podcast` lié au projet Vercel `ft-podcast-daily` (tous environnements).
- Chemin : `episodes/YYYY-MM-DD.mp3`, public, `allowOverwrite`.

## Variables d'environnement
```
DATABASE_URL   # Neon — SERVEUR uniquement (jamais NEXT_PUBLIC_)
```
Le token Blob (`BLOB_READ_WRITE_TOKEN`) n'est nécessaire que côté pipeline (écriture),
pas côté front (lecture d'URL publiques). À configurer sur Vercel via env vars projet.

## Data layer
- `lib/db.ts` — client Neon serveur (`getSql()`).
- `lib/episodes.ts` — `getEpisodes()` / `getEpisodeById()` (mêmes signatures qu'avant),
  `import "server-only"`.
- `lib/format.ts` — helpers purs (formatTime/formatDuration/formatDate/mapEpisodeRow), testés.

## Rendu
- `app/page.tsx` (server, `revalidate = 900`) → fetch Neon → `EpisodeListClient`.
- `app/episode/[id]/page.tsx` (SSG via `generateStaticParams` + `generateMetadata`
  avec le vrai titre) → `EpisodeDetail`.
- `components/AudioPlayer.tsx` — player complet : vitesse ×1/1.25/1.5/2, skip ±15s,
  reprise de position (localStorage/episode.id), Media Session API, tap-to-play,
  `isPlaying` piloté par les events `<audio>` (onPlay/onPause/onPlaying/onWaiting/onError).

## Structure
```
app/            page.tsx · layout.tsx · globals.css · episode/[id]/{page,EpisodePage}.tsx
components/     AudioPlayer.tsx · EpisodeCard.tsx · EpisodeList.tsx
lib/            db.ts · episodes.ts · format.ts
types/          episode.ts
tests/          format.test.ts   (pnpm test)
```

## URLs
- **Production Vercel** : https://ft-podcast-daily.vercel.app
- **Pipeline local** : `~/projects/analysis/ft-podcast-daily` (branche `agent/ada/ft-podcast-daily`)
- **Neon console** : projet `ft-podcast-daily`

## Prochaines étapes
1. Configurer `DATABASE_URL` sur Vercel (env var projet) pour la prod.
2. Vérifier le player en preview avec un épisode réel.
3. Charger le cron launchd (voir `deploy/` du pipeline) une fois validé.
