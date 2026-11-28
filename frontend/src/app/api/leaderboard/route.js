import { ROUTE_READ_TIMEOUT_MS } from '../../../config/presale';
import * as LB from '../../../config/leaderboard';
import { firstProvider, leaderboard, ARCHIVE_RPCS } from '../../../lib/presaleLogs';

// Classements de la page /leaderboard, calcules cote serveur depuis les achats on-chain (lib/presaleLogs.js).
// Remonte au debut de la presale : RPC d'archive uniquement (les RPC publics renvoient une liste vide sans erreur).
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const cached = (body, seconds) => Response.json(body, {
  headers: { 'Cache-Control': 'public, max-age=0, must-revalidate', 'CDN-Cache-Control': `public, s-maxage=${seconds}` },
});

export async function GET() {
  let timer;
  try {
    const read = (async () => leaderboard(await firstProvider(ARCHIVE_RPCS(), { 'User-Agent': 'JoobEscrow-site/1.0' }), LB))();
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('read timeout')), ROUTE_READ_TIMEOUT_MS); });
    return cached(await Promise.race([read, timeout]), LB.LEADERBOARD_CACHE_SEC);
  } catch (err) {
    console.error('[leaderboard]', err?.shortMessage || err?.message || err);
    return cached({ error: 'unavailable' }, 60);
  } finally {
    clearTimeout(timer);
  }
}
