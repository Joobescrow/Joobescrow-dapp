import { ROUTE_READ_TIMEOUT_MS } from '../../../config/presale';
import { firstProvider, fairShare, ARCHIVE_RPCS } from '../../../lib/presaleLogs';
import { SALES_BONUS, secondsToNextRefresh } from '../../../config/promo';

// Beneficiaires du bonus Fair Share, calcules cote serveur (src/lib/presaleLogs.js). Le cache CDN expire
// aux heures fixes de config/promo.js (refreshHoursUtc) : une lecture au plus par creneau, et seulement si
// quelqu'un ouvre la page.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const cached = (body, seconds) => Response.json(body, {
  headers: {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'CDN-Cache-Control': `public, s-maxage=${seconds}`,
  },
});

export async function GET() {
  try {
    // Lecture plafonnee : au-dela du delai, reponse de secours (voir config/presale.js).
    const read = (async () => {
      const p = await firstProvider(ARCHIVE_RPCS(), { 'User-Agent': 'JoobEscrow-site/1.0' });
      return fairShare(p);
    })();
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('read timeout')), ROUTE_READ_TIMEOUT_MS); });
    try {
      return cached(await Promise.race([read, timeout]), secondsToNextRefresh());
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.error('[sales-bonus]', err?.shortMessage || err?.message || err);
    const started = Date.now() / 1000 >= Date.parse(SALES_BONUS.start) / 1000;
    return cached({ campaign: SALES_BONUS.name, entries: [], started, error: 'unavailable' }, SALES_BONUS.retryAfterErrorSec);
  }
}
