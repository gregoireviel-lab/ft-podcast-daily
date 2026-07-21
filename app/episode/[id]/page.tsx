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
    return { title: "Épisode introuvable — FT Daily" };
  }
  return {
    title: `${episode.title} — FT Daily`,
    description: episode.summary || `Épisode FT Daily du ${episode.date}`,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const episode = await getEpisodeById(id).catch(() => null);
  if (!episode) notFound();
  return <EpisodeDetail episode={episode} />;
}
