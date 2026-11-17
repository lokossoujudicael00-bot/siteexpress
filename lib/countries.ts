export const COUNTRIES: Record<string, [string, string]> = {
  BJ: ["fr", "XOF"], TG: ["fr", "XOF"], CI: ["fr", "XOF"], SN: ["fr", "XOF"], ML: ["fr", "XOF"], BF: ["fr", "XOF"], NE: ["fr", "XOF"],
  CM: ["fr", "XAF"], GA: ["fr", "XAF"], CG: ["fr", "XAF"], FR: ["fr", "EUR"], BE: ["fr", "EUR"], LU: ["fr", "EUR"], CH: ["fr", "EUR"],
  MA: ["fr", "MAD"], DZ: ["fr", "EUR"], TN: ["fr", "EUR"], ES: ["es", "EUR"], PT: ["pt", "EUR"], BR: ["pt", "USD"], MX: ["es", "USD"],
  CO: ["es", "USD"], AR: ["es", "USD"], US: ["en", "USD"], GB: ["en", "GBP"], IE: ["en", "EUR"], NG: ["en", "USD"], GH: ["en", "USD"],
  KE: ["en", "USD"], ZA: ["en", "USD"], DE: ["en", "EUR"], IT: ["en", "EUR"], NL: ["en", "EUR"], CA: ["en", "USD"],
};
export const LANGNAME: Record<string, string> = { fr: "français", en: "English", es: "español", pt: "português" };

export const CATEGORIES: [string, string][] = [
  ["Restaurant", "amenity=restaurant"], ["Café / bar", "amenity=cafe"], ["Boulangerie", "shop=bakery"],
  ["Coiffeur", "shop=hairdresser"], ["Beauté / esthétique", "shop=beauty"], ["Garage / mécanique", "shop=car_repair"],
  ["Dentiste", "amenity=dentist"], ["Clinique / cabinet", "amenity=clinic"], ["Pharmacie", "amenity=pharmacy"],
  ["Hôtel / hébergement", "tourism=hotel"], ["Salle de sport", "leisure=fitness_centre"], ["École / formation", "amenity=school"],
  ["Boutique de vêtements", "shop=clothes"], ["Autre commerce", "shop=yes"],
];

export function themeFor(tg: string): string {
  if (/amenity=(restaurant|cafe|bar|fast_food|pub|ice_cream)|shop=(bakery|pastry|butcher)/.test(tg)) return "food";
  if (/shop=(hairdresser|beauty|cosmetics|massage|tattoo)|amenity=spa/.test(tg)) return "beauty";
  if (/shop=(car_repair|car|tyres|motorcycle|car_parts)|amenity=car_wash/.test(tg)) return "auto";
  if (/amenity=(dentist|doctors|clinic|pharmacy|hospital|veterinary)|healthcare/.test(tg)) return "health";
  if (/tourism=(hotel|guest_house|hostel|apartment|motel)/.test(tg)) return "hotel";
  if (/leisure=(fitness_centre|sports_centre|gym)/.test(tg)) return "fitness";
  if (/amenity=(school|driving_school|kindergarten|language_school)/.test(tg)) return "school";
  if (/^shop=/.test(tg)) return "shop";
  return "generic";
}

export function intlPhone(p: string): string {
  const d = (p || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.slice(1);
  if (d.startsWith("00")) return d.slice(2);
  return "";
}

export const WA_MSG: Record<string, (name: string, link: string) => string> = {
  fr: (name, link) => `Bonjour, j'ai préparé gratuitement un aperçu de site web pour ${name} : ${link}\nLe tarif et les détails sont sur la page. Répondez STOP si vous ne voulez pas être contacté.`,
  en: (name, link) => `Hello, I prepared a free website preview for ${name}: ${link}\nPrice and details are on the page. Reply STOP if you do not want to be contacted.`,
  es: (name, link) => `Hola, he preparado gratis una vista previa de sitio web para ${name}: ${link}\nEl precio y los detalles están en la página. Responda STOP si no desea ser contactado.`,
  pt: (name, link) => `Olá, preparei gratuitamente uma pré-visualização de site para ${name}: ${link}\nO preço e os detalhes estão na página. Responda STOP se não quiser ser contactado.`,
};

export const MAIL_TXT: Record<string, { sub: (n: string) => string; body: (n: string, l: string) => string }> = {
  fr: { sub: (n) => `Votre site web pour ${n} : aperçu gratuit`, body: (n, l) => `Bonjour,\n\nJ'ai préparé un aperçu gratuit de site web pour ${n} :\n\n${l}\n\nIl comprend vos services, un formulaire de réservation et les pages légales. Le tarif et le bouton pour le mettre en ligne sont en bas de la page.\n\nSi vous ne voulez plus recevoir de message de ma part, répondez « STOP ».\n\nCordialement,\nRufin LOKOSSOU\nSiteExpress` },
  en: { sub: (n) => `A free website preview for ${n}`, body: (n, l) => `Hello,\n\nI prepared a free website preview for ${n}:\n\n${l}\n\nIt includes your services, a booking form and legal pages. The price and the button to put it online are at the bottom of the page.\n\nIf you do not want to receive messages from me, reply "STOP".\n\nBest regards,\nRufin LOKOSSOU\nSiteExpress` },
  es: { sub: (n) => `Vista previa gratuita del sitio web de ${n}`, body: (n, l) => `Hola,\n\nHe preparado una vista previa gratuita del sitio web de ${n}:\n\n${l}\n\nIncluye sus servicios, un formulario de reservas y las páginas legales. El precio y el botón para publicarlo están al final de la página.\n\nSi no desea recibir más mensajes míos, responda "STOP".\n\nSaludos,\nRufin LOKOSSOU\nSiteExpress` },
  pt: { sub: (n) => `Pré-visualização gratuita do site de ${n}`, body: (n, l) => `Olá,\n\nPreparei uma pré-visualização gratuita do site de ${n}:\n\n${l}\n\nInclui os seus serviços, um formulário de reservas e as páginas legais. O preço e o botão para o publicar estão no fim da página.\n\nSe não quiser receber mais mensagens minhas, responda "STOP".\n\nCumprimentos,\nRufin LOKOSSOU\nSiteExpress` },
};
