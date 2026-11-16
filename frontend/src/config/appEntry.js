// Accueil de l'app (/app) : deux entrees selon l'intention (UX direction 2).
// La categorie ne sert qu'au vocabulaire des roles (les frais sont les memes partout) :
// « Pay someone » ouvre directement le formulaire dans une categorie generique.
export const PAY_SOMEONE_CATEGORY = 'pro'; // Client <-> Expert
export const OPEN_CREATE_PARAM = 'new'; // /<categorie>?new=1 ouvre le formulaire de creation
export const GET_PAID_PATH = '/pay';
