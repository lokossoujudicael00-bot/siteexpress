export const THEMES: Record<string, any> = {
  food: { hue: 14, emojis: ["🍽️", "🍲", "🥗", "🍹", "🔥"] },
  beauty: { hue: 320, emojis: ["💇", "✨", "💅", "🌸", "🪞"] },
  auto: { hue: 215, emojis: ["🔧", "🚗", "🛞", "⚙️", "🔋"] },
  health: { hue: 175, emojis: ["🩺", "🦷", "💊", "❤️", "🧴"] },
  hotel: { hue: 232, emojis: ["🛏️", "🏨", "🌴", "🔑", "☕"] },
  fitness: { hue: 130, emojis: ["💪", "🏋️", "🧘", "🏃", "🥤"] },
  school: { hue: 258, emojis: ["📚", "✏️", "🎓", "🧠", "🚦"] },
  shop: { hue: 36, emojis: ["🛍️", "🏷️", "🎁", "⭐", "🧺"] },
  generic: { hue: 200, emojis: ["⭐", "✅", "🤝", "📞", "📍"] },
};

// Chaque commerce a une teinte légèrement différente (déterminée par son identifiant)
export function hueFor(theme: string, slug: string): number {
  const base = (THEMES[theme] || THEMES.generic).hue;
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 997;
  return (base + (h % 41) - 20 + 360) % 360;
}
