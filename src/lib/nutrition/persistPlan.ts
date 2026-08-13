import { prisma } from '@/lib/prisma'
import type { MealPlan } from '@/lib/nutrition/nutritionAI'

export async function persistPlan(userId: string, mealPlan: MealPlan) {
  return prisma.plan.create({
    data: {
      userId,
      name: mealPlan.name,
      description: mealPlan.description,
      totalCalories: mealPlan.totalCalories,
      totalProtein: mealPlan.totalProtein,
      totalCarbs: mealPlan.totalCarbs,
      totalFat: mealPlan.totalFat,
      aiGenerated: mealPlan.aiGenerated,
      meals: {
        create: mealPlan.dailyMeals.flatMap((dailyMeal) =>
          dailyMeal.meals.map((meal, index) => ({
            day: dailyMeal.day,
            name: meal.name,
            slot: meal.slot,
            scheduledTime: meal.scheduledTime,
            sortOrder: index,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            ingredients: JSON.stringify(meal.ingredients),
            instructions: JSON.stringify(meal.instructions),
            prepTime: meal.prepTime,
            cookTime: meal.cookTime,
          }))
        ),
      },
    },
    include: { meals: true },
  })
}
