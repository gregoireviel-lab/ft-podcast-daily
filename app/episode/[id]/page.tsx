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

const SITE_URL = "https://ft-podcast-daily.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const episode = await getEpisodeById(id).catch(() => null);
  if (!episode) {
    return { title: "Épisode introuvable" };
  }
  return {
    title: episode.title,
    description: episode.summary || `The Essential — ${episode.date}`,
    openGraph: {
      title: episode.title,
      description: episode.summary || `The Essential — ${episode.date}`,
      type: "article",
      url: `${SITE_URL}/episode/${id}`,
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "The Essential",
        },
      ],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const episode = await getEpisodeById(id).catch(() => null);
  if (!episode) notFound();
  return <EpisodeDetail episode={episode} />;
}
