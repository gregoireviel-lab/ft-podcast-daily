@AGENTS.md

# FT Daily Podcast — SaaS Interface

Interface web Spotify-like pour écouter les épisodes quotidiens du FT Daily Podcast.

## Architecture globale

```
[Mac de Greg @ 7h]                    [Firebase]              [Vercel]
Pipeline local (ft-podcast-daily) --> Firestore + Storage --> Cette app (Next.js)
(~/projects/analysis/ft-podcast-daily)  episodes collection     interface lecture
```

Le cron est LOCAL (launchd sur Mac), le SaaS est UNIQUEMENT l'interface de lecture.
Pas de cron cloud, pas d'auth utilisateur.

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- Firebase (Client SDK) — Firestore pour les métadonnées, Storage pour les MP3
- pnpm — package manager
- Vercel — hébergement

## Firebase — Structure des données

### Firestore Collection : `episodes`
```typescript
interface Episode {
  id: string;               // date (YYYY-MM-DD) utilisée comme doc ID
  date: string;             // "2026-07-21" — date de l'édition
  title: string;            // titre généré par Claude
  summary: string;          // résumé 2-3 phrases pour la card
  duration_sec: number;     // durée du MP3 en secondes
  audio_url: string;        // URL Firebase Storage (publique)
  created_at: string;       // ISO timestamp de génération
}
```

### Firebase Storage : `episodes/`
- Pattern : `episodes/YYYY-MM-DD.mp3`
- Accès public en lecture (règles Storage à configurer)
- Le pipeline local upload le MP3 puis écrit l'entrée Firestore avec l'URL publique

## Variables d'environnement

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Toutes sont `NEXT_PUBLIC_` car lues côté client (Firebase Client SDK).
À injecter sur Vercel via les env vars du projet.

## Comment le pipeline local push les épisodes

Ajouter dans `~/projects/analysis/ft-podcast-daily/src/index.ts` (Firebase Admin SDK) :

```typescript
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
});

async function publishEpisode(audioPath, date, title, summary, durationSec) {
  // 1. Upload MP3 vers Storage
  const bucket = getStorage(app).bucket();
  const storageFile = bucket.file(`episodes/${date}.mp3`);
  await storageFile.save(require("fs").readFileSync(audioPath), {
    metadata: { contentType: "audio/mpeg" },
  });
  await storageFile.makePublic();
  const audioUrl = storageFile.publicUrl();

  // 2. Écrire dans Firestore
  const db = getFirestore(app);
  await db.collection("episodes").doc(date).set({
    date, title, summary,
    duration_sec: durationSec,
    audio_url: audioUrl,
    created_at: new Date().toISOString(),
  });
}
```

## Firebase Security Rules

### Firestore
```
match /episodes/{episodeId} {
  allow read: if true;
  allow write: if false; // uniquement Admin SDK
}
```

### Storage
```
match /episodes/{fileName} {
  allow read: if true;   // MP3 publics
  allow write: if false; // uniquement Admin SDK
}
```

## Structure du projet

```
ft-podcast-daily/
├── app/
│   ├── globals.css          # Dark mode Spotify (#121212, #1DB954)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Page principale
├── components/
│   ├── AudioPlayer.tsx      # Player sticky bottom
│   ├── EpisodeCard.tsx      # Card épisode
│   └── EpisodeList.tsx      # Liste + état actif
├── lib/
│   ├── firebase.ts          # Init Firebase client
│   └── episodes.ts          # Fetch Firestore
├── types/
│   └── episode.ts           # Type Episode
└── .env.local.example       # Template env vars
```

## URLs
- **Production Vercel** : https://ft-podcast-daily.vercel.app
- **Pipeline local** : `~/projects/analysis/ft-podcast-daily` (branche `agent/ada/ft-podcast-daily`)
- **Firebase Console** : https://console.firebase.google.com/ (projet : `ft-podcast-daily`)

## Prochaines étapes
1. Créer le projet Firebase dans la console + activer Firestore + Storage
2. Configurer les env vars sur Vercel
3. Modifier le pipeline local pour push vers Firebase
4. Tester avec un épisode manuel dans Firestore
