export interface Episode {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  duration_sec: number;
  audio_url: string;
  created_at: string; // ISO timestamp
}
