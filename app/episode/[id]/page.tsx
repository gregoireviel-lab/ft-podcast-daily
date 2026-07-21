import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EpisodeDetail from "./EpisodePage";
import { getEpisodes, getEpisodeById } from "@/lib/episodes";

export const revalidate = 900;

interface Props {
  params: Promise<{ id: string }>;
}

// Pre-render a static page per known episode (SSG), revalidated via ISR.
export async function generateStaticParams() {
  try {
    const episodes = await getEpisodes(60);
    return episodes.map((e) => ({ id: e.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const episode = await getEpisodeById(id).catch(() => null);
  if (!episode) {
    // `title` is a plain string -> the root template ("%s — FT Daily") applies.
    return { title: "Épisode introuvable" };
  }
  return {
    // Root layout template appends " — FT Daily"; don't duplicate it here.
    title: episode.title,
    description: episode.summary || `Épisode FT Daily du ${episode.date}`,
    openGraph: {
      title: episode.title,
      description: episode.summary || `Épisode FT Daily du ${episode.date}`,
      type: "article",
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const episode = await getEpisodeById(id).catch(() => null);
  if (!episode) notFound();
  return <EpisodeDetail episode={episode} />;
}
