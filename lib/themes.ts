export const THEMES: Record<string, any> = {
  food: { hues: [8, 24, 345, 140, 38], emojis: ["🍽️", "🍲", "🥗", "🍹", "🔥", "🍛"], orders: true },
  beauty: { hues: [320, 290, 345, 20], emojis: ["💇", "✨", "💅", "🌸", "🪞"], orders: false },
  auto: { hues: [215, 200, 10, 160], emojis: ["🔧", "🚗", "🛞", "⚙️", "🔋"], orders: false },
  health: { hues: [175, 200, 150, 230], emojis: ["🩺", "🦷", "💊", "❤️", "🧴"], orders: false },
  hotel: { hues: [232, 35, 170, 300], emojis: ["🛏️", "🏨", "🌴", "🔑", "☕"], orders: false },
  fitness: { hues: [130, 15, 200, 270], emojis: ["💪", "🏋️", "🧘", "🏃", "🥤"], orders: false },
  school: { hues: [258, 215, 30, 160], emojis: ["📚", "✏️", "🎓", "🧠", "🚦"], orders: false },
  shop: { hues: [36, 300, 190, 350], emojis: ["🛍️", "🏷️", "🎁", "⭐", "🧺"], orders: true },
  generic: { hues: [200, 160, 280, 20], emojis: ["⭐", "✅", "🤝", "📞", "📍"], orders: false },
};

function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000003;
  return h;
}

// Chaque commerce reçoit un style différent : couleur, disposition, police, arrondis, icône
export function styleFor(theme: string, slug: string) {
  const t = THEMES[theme] || THEMES.generic;
  const h = hash(slug);
  return {
    hue: (t.hues[h % t.hues.length] + ((h >> 3) % 25) - 12 + 360) % 360,
    variant: ["a", "b", "c"][(h >> 5) % 3],
    font: (h >> 7) % 2 ? "serif" : "sans",
    radius: (h >> 9) % 3 === 0 ? "sharp" : "round",
    emoji: t.emojis[(h >> 11) % t.emojis.length],
  };
}
export function hueFor(theme: string, slug: string) { return styleFor(theme, slug).hue; }
