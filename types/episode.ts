export interface EpisodeSource {
  /** Human-readable title of the article/source. */
  title: string;
  /** Canonical URL of the source article. */
  url: string;
}

export interface EpisodeHighlight {
  /** 1-based importance rank (1 = most important). */
  rank: number;
  /** Short headline of the news item. */
  title: string;
  /** One-line explanatory blurb. */
  blurb: string;
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
  /**
   * Top-10 ranked news highlights (COS-0087). Optional: the `episodes.highlights`
   * column (jsonb) may be empty/absent while the pipeline backfills. When present,
   * rendered as a single-open accordion under the episode row, ordered by `rank`.
   */
  highlights?: EpisodeHighlight[];
}
