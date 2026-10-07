import { blends } from './blend-preview-data.mjs?v=water-colours1';

export const manukaRecipes = [
  {
    id: 'original',
    label: 'Original',
    hint: 'With maca & ginseng',
    ingredients: ['manuka-honey', 'lemon', 'maca', 'ginseng'],
    description: 'Seamoss · Manuka honey · Lemon · Maca root · Panax ginseng'
  },
  {
    id: 'honey-lemon',
    label: 'Expecting Mother Edition',
    hint: 'No maca or ginseng',
    ingredients: ['manuka-honey', 'lemon'],
    description: 'Seamoss · Manuka honey · Lemon'
  }
];

export function selectedBlend(select) {
  const blend = blends.find(item => item.id === select.value);
  if (!blend || blend.id !== 'manuka-glow') return blend;
  const recipe = manukaRecipes.find(item => item.id === select.dataset.recipe) || manukaRecipes[0];
  return {
    ...blend,
    key: `${blend.id}:${recipe.id}`,
    name: `${blend.name} (${recipe.id === 'original' ? recipe.label.toLowerCase() : recipe.label})`,
    ingredients: recipe.ingredients,
    description: recipe.description
  };
}
