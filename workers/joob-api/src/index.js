// Worker joob-api : API publique en lecture seule (api.joobescrow.com) et bot Telegram JoobEscrow.
// Separe du Worker des alertes d'achat (joob-presale-alerts) : une panne ici ne touche pas la presale.
import { handleApi } from './api.js';
import { handleUpdate, runAlerts } from './bot.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Webhook Telegram : seul Telegram connait le secret (setWebhook ... secret_token).
    if (url.pathname === '/telegram' && request.method === 'POST') {
      // Secrets nettoyes : un retour a la ligne ajoute a l'enregistrement (PowerShell) ne doit pas tout bloquer.
      const expected = (env.TELEGRAM_WEBHOOK_SECRET || '').trim();
      if (!expected || (request.headers.get('X-Telegram-Bot-Api-Secret-Token') || '').trim() !== expected) {
        return new Response('Forbidden', { status: 403 });
      }
      const update = await request.json().catch(() => null);
      if (update) ctx.waitUntil(handleUpdate(env, update));
      return new Response('ok');
    }
    return handleApi(request, env, ctx);
  },

  // Chaque minute : alertes des wallets suivis (/track).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runAlerts(env).then((r) => console.log(`alerts: ${r}`)));
  },
};
