import {
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { Episode } from "@/types/episode";

/**
 * Fetch the N most recent episodes from Firestore.
 * Collection: `episodes` ordered by `date` descending.
 */
export async function getEpisodes(maxResults = 30): Promise<Episode[]> {
  const db = getDb();
  const q = query(
    collection(db, "episodes"),
    orderBy("date", "desc"),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Episode[];
}

/**
 * Fetch a single episode by its ID (date string, e.g. "2026-07-21").
 * Returns null if not found.
 */
export async function getEpisodeById(id: string): Promise<Episode | null> {
  const db = getDb();
  const docRef = doc(db, "episodes", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Episode;
}
