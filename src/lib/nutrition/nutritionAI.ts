import Anthropic from '@anthropic-ai/sdk'

const API_KEY = process.env.ANTHROPIC_API_KEY

const client = new Anthropic({ apiKey: API_KEY || 'demo-key' })

const BODYBUILDER_CONFIG = {
  characteristics: [
    'High protein requirements (1.2-1.5g per lb bodyweight)',
    'Strict meal timing',
    'Detailed macro tracking',
    'Supplement integration',
    'Contest prep cycles',
  ],
  nutritionFocus: {
    protein: 'high',
    carbs: 'moderate',
    fat: 'moderate',
    mealFrequency: '6-8 meals per day',
    timing: 'critical',
  },
}

export interface Meal {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  instructions: string[]
  prepTime: number
  cookTime: number
}

export interface MealPlan {
  id: string
  name: string
  description: string
  dailyMeals: { day: string; meals: Meal[] }[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  created_at: string
  aiGenerated: boolean
}

const MEAL_PLAN_SCHEMA = {
  type: 'object' as const,
  properties: {
    meals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          calories: { type: 'integer' },
          protein: { type: 'integer' },
          carbs: { type: 'integer' },
          fat: { type: 'integer' },
          ingredients: { type: 'array', items: { type: 'string' } },
          instructions: { type: 'array', items: { type: 'string' } },
          prepTime: { type: 'integer' },
          cookTime: { type: 'integer' },
        },
        required: [
          'name',
          'calories',
          'protein',
          'carbs',
          'fat',
          'ingredients',
          'instructions',
          'prepTime',
          'cookTime',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['meals'],
  additionalProperties: false,
}

function getMacroTargets(goals: string) {
  const targets: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
    weight_loss: { calories: 2200, protein: 200, carbs: 200, fat: 65 },
    muscle_gain: { calories: 3375, protein: 240, carbs: 424, fat: 80 },
    maintenance: { calories: 2800, protein: 200, carbs: 300, fat: 75 },
  }
  return targets[goals] || targets.muscle_gain
}

function formatGoalName(goals: string): string {
  return goals.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

async function generateMealPlan(goals: string, restrictions: string[]): Promise<MealPlan> {
  if (!API_KEY || API_KEY === 'demo-key') {
    return generateDemoMealPlan(goals)
  }

  try {
    const targets = getMacroTargets(goals)

    const prompt = `Create a single day nutrition plan for a bodybuilder that MUST meet these exact targets:

MANDATORY DAILY TARGETS:
- Total Calories: ${targets.calories}
- Total Protein: ${targets.protein}g
- Total Carbs: ${targets.carbs}g
- Total Fat: ${targets.fat}g

Bodybuilder Characteristics:
${BODYBUILDER_CONFIG.characteristics.map((c) => `- ${c}`).join('\n')}

Nutrition Focus:
- Protein: ${BODYBUILDER_CONFIG.nutritionFocus.protein}
- Carbs: ${BODYBUILDER_CONFIG.nutritionFocus.carbs}
- Fat: ${BODYBUILDER_CONFIG.nutritionFocus.fat}
- Meal Frequency: ${BODYBUILDER_CONFIG.nutritionFocus.mealFrequency}
- Timing: ${BODYBUILDER_CONFIG.nutritionFocus.timing}

User Goals: ${goals}
Dietary Restrictions: ${restrictions.join(', ') || 'None'}

Generate 4-6 meals whose combined macros sum to the exact target macros above.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      output_config: { format: { type: 'json_schema', schema: MEAL_PLAN_SCHEMA } },
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return generateDemoMealPlan(goals)
    }

    const parsed = JSON.parse(textBlock.text) as { meals: Meal[] }
    const meals = parsed.meals

    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0)
    const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0)
    const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0)
    const totalFat = meals.reduce((sum, m) => sum + m.fat, 0)

    const goalName = formatGoalName(goals)

    return {
      id: `plan-${Date.now()}`,
      name: `${goalName} Plan (AI Generated)`,
      description: `An AI-generated nutrition plan optimized for ${goalName.toLowerCase()}`,
      dailyMeals: [{ day: 'Daily Meals', meals }],
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      created_at: new Date().toISOString(),
      aiGenerated: true,
    }
  } catch (error) {
    console.error('Error generating meal plan:', error)
    return generateDemoMealPlan(goals)
  }
}

function createMeal(
  name: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  ingredients: string[],
  instructions: string[],
  prepTime: number,
  cookTime: number
): Meal {
  return { name, calories, protein, carbs, fat, ingredients, instructions, prepTime, cookTime }
}

function generateBodybuilderMeals(): Meal[] {
  return [
    createMeal(
      'Pre-Workout Shake',
      300,
      25,
      30,
      8,
      ['Protein powder', 'Banana', 'Oats', 'Almond milk'],
      ['Blend all ingredients', 'Drink 30 minutes before workout'],
      5,
      0
    ),
    createMeal(
      'Post-Workout Meal',
      450,
      35,
      45,
      12,
      ['Chicken breast', 'Sweet potato', 'Broccoli', 'Olive oil'],
      ['Grill chicken', 'Bake sweet potato', 'Steam broccoli'],
      15,
      25
    ),
    createMeal(
      'Protein-Rich Dinner',
      400,
      40,
      25,
      15,
      ['Salmon', 'Quinoa', 'Asparagus', 'Lemon'],
      ['Bake salmon', 'Cook quinoa', 'Roast asparagus'],
      20,
      30
    ),
  ]
}

function generateDemoMealPlan(goals: string): MealPlan {
  const meals = generateBodybuilderMeals()
  const goalName = formatGoalName(goals)

  return {
    id: `plan-${Date.now()}`,
    name: `${goalName} Plan`,
    description: `A nutrition plan optimized for ${goalName.toLowerCase()}`,
    dailyMeals: [{ day: 'Daily Meals', meals }],
    totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
    totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
    totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
    totalFat: meals.reduce((sum, m) => sum + m.fat, 0),
    created_at: new Date().toISOString(),
    aiGenerated: false,
  }
}

export default { generateMealPlan, generateDemoMealPlan }
