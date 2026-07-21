import { Metadata } from "next";
import EpisodePage from "./EpisodePage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `FT Daily — ${id}`,
    description: `Épisode FT Daily du ${id}`,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <EpisodePage episodeId={id} />;
}
