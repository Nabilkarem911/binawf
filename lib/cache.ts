import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Purges every public-facing cache after a CMS write:
 * - revalidatePath("/", "layout") clears the ISR route cache for all public
 *   pages plus the shared layout (header/footer).
 * - revalidateTag clears tagged unstable_cache data entries (lib/site.ts).
 * expire: 0 = never serve stale — the next request re-fetches synchronously.
 */
export function revalidatePublic() {
  revalidatePath("/", "layout");
  revalidateTag("public", { expire: 0 });
}
