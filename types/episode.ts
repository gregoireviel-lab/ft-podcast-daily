export interface EpisodeSource {
  /** Human-readable title of the article/source. */
  title: string;
  /** Canonical URL of the source article. */
  url: string;
}

export interface Episode {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  duration_sec: number;
  audio_url: string;
  created_at: string; // ISO timestamp
  /**
   * Full narration script (COS-0064). Optional: the `episodes.script` column
   * is not yet populated by the pipeline. The UI renders it when present.
   */
  script?: string;
  /**
   * Clickable source articles (COS-0068). Optional: the `episodes.sources`
   * column (jsonb) is not yet populated by the pipeline. Rendered when present.
   */
  sources?: EpisodeSource[];
}
