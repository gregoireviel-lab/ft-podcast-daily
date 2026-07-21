import {
  collection,
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
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Episode[];
}
