export type Taste =
  | 'あっさり'
  | 'こってり'
  | '甘辛'
  | 'スパイシー'
  | 'さっぱり'
  | '香ばしい'

export type Cuisine = '和食' | '洋食' | '中華' | '韓国' | 'その他'

export interface Recipe {
  id: string
  name: string
  description: string
  ingredients: string[]
  optionalIngredients: string[]
  costYen: number
  tastes: Taste[]
  cuisine: Cuisine
  minutes: number
  servings: number
  steps: string[]
  image: string
  imageAlt: string
}

export interface Filters {
  maxCost: number
  tastes: Taste[]
  maxMinutes: number
  cuisine: Cuisine | 'すべて'
}

export interface MatchResult {
  recipe: Recipe
  score: number
  matchedIngredients: string[]
  missingIngredients: string[]
}
