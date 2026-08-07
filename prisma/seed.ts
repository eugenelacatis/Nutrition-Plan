import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const foods = [
  { name: 'Chicken breast', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { name: 'Salmon', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { name: 'Ground beef (93/7)', caloriesPer100g: 152, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 7 },
  { name: 'Turkey breast', caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1 },
  { name: 'Tilapia', caloriesPer100g: 96, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 1.7 },
  { name: 'Shrimp', caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3 },
  { name: 'Eggs (whole)', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { name: 'Egg whites', caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
  { name: 'Whey protein powder', caloriesPer100g: 400, proteinPer100g: 80, carbsPer100g: 8, fatPer100g: 5 },
  { name: 'Greek yogurt (nonfat)', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { name: 'Cottage cheese', caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3 },
  { name: 'Tofu', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8 },
  { name: 'White rice (cooked)', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { name: 'Brown rice (cooked)', caloriesPer100g: 112, proteinPer100g: 2.6, carbsPer100g: 24, fatPer100g: 0.9 },
  { name: 'Sweet potato', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1 },
  { name: 'White potato', caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1 },
  { name: 'Oats (dry)', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7 },
  { name: 'Quinoa (cooked)', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9 },
  { name: 'Whole wheat pasta (cooked)', caloriesPer100g: 124, proteinPer100g: 5.3, carbsPer100g: 26, fatPer100g: 0.9 },
  { name: 'Ezekiel bread', caloriesPer100g: 250, proteinPer100g: 10, carbsPer100g: 45, fatPer100g: 1.5 },
  { name: 'Banana', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { name: 'Apple', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { name: 'Broccoli', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
  { name: 'Asparagus', caloriesPer100g: 20, proteinPer100g: 2.2, carbsPer100g: 3.9, fatPer100g: 0.1 },
  { name: 'Spinach', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { name: 'Almonds', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { name: 'Peanut butter', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
  { name: 'Olive oil', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { name: 'Avocado', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 8.5, fatPer100g: 15 },
  { name: 'Almond milk (unsweetened)', caloriesPer100g: 15, proteinPer100g: 0.6, carbsPer100g: 0.6, fatPer100g: 1.2 },
]

async function main() {
  for (const food of foods) {
    await prisma.food.upsert({
      where: { name: food.name },
      update: food,
      create: food,
    })
  }
  console.log(`Seeded ${foods.length} foods`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
