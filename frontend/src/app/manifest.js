import { PWA } from '../config/pwa';

// Manifeste web (servi sur /manifest.webmanifest) : rend l'app installable sur telephone.
export default function manifest() {
  return {
    name: PWA.name,
    short_name: PWA.shortName,
    description: PWA.description,
    start_url: PWA.startUrl,
    scope: PWA.scope,
    display: PWA.display,
    background_color: PWA.backgroundColor,
    theme_color: PWA.themeColor,
    icons: PWA.icons,
  };
}
