// API client for communicating with the nutrition API routes

const API_BASE_URL = '/api';

export interface NutritionGoals {
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance';
  dietaryRestrictions: string[];
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}

export interface PlanMeal {
  id: string;
  day: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  mealLogs?: MealLog[];
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  aiGenerated: boolean;
  createdAt: string;
  meals: PlanMeal[];
}

export interface Food {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface MealLog {
  id: string;
  planMealId: string;
  status: 'as_planned' | 'substituted' | 'skipped';
  substituteFoodId: string | null;
  substituteQuantityG: number | null;
  date: string;
}

export interface MacroDiff {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Demo plans (from demo-plan endpoint) use the old nested shape since
// they're not persisted to the database.
export interface DemoMealPlan {
  id: string;
  name: string;
  description: string;
  dailyMeals: { day: string; meals: DemoMeal[] }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  created_at: string;
}

export interface DemoMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
}

export interface DailyLog {
  id: string;
  weight: number;
  sleepHours: number;
  wakeTime: string;
  digestionRating: number;
  date: string;
  created_at: string;
}

export interface UserGoal {
  goalWeight: number | null;
  goalDirection: 'lose' | 'gain' | 'maintain' | null;
}

export interface OptimalScore {
  score: number;
  recommendations: string[];
  factors: {
    sleep: { score: number; weight: number };
    digestion: { score: number; weight: number };
    weight: { score: number; weight: number };
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  private parsePlan(raw: any): Plan {
    return {
      ...raw,
      meals: raw.meals.map((meal: any) => ({
        ...meal,
        ingredients: JSON.parse(meal.ingredients),
        instructions: JSON.parse(meal.instructions),
      })),
    };
  }

  async generateMealPlan(
    goals: string,
    restrictions: string[] = []
  ): Promise<{ success: boolean; data: Plan }> {
    const response = await this.request<{ success: boolean; data: any }>('/nutrition/generate-plan', {
      method: 'POST',
      body: JSON.stringify({
        goals,
        restrictions,
      }),
    });
    return { ...response, data: this.parsePlan(response.data) };
  }

  async getDemoPlan(goals: string): Promise<{ success: boolean; data: DemoMealPlan }> {
    return this.request(`/nutrition/demo-plan/${goals}`);
  }

  async listPlans(): Promise<{ success: boolean; data: Omit<Plan, 'meals'>[] }> {
    return this.request('/nutrition/plans');
  }

  async getPlan(id: string): Promise<{ success: boolean; data: Plan }> {
    const response = await this.request<{ success: boolean; data: any }>(`/nutrition/plans/${id}`);
    return { ...response, data: this.parsePlan(response.data) };
  }

  async getFoods(): Promise<{ success: boolean; data: Food[] }> {
    return this.request('/nutrition/foods');
  }

  async logMeal(
    planMealId: string,
    status: 'as_planned' | 'substituted' | 'skipped',
    substituteFoodId?: string,
    substituteQuantityG?: number,
    date?: string
  ): Promise<{ success: boolean; data: { mealLog: MealLog; macroDiff: MacroDiff | null } }> {
    return this.request('/nutrition/meal-log', {
      method: 'POST',
      body: JSON.stringify({ planMealId, status, substituteFoodId, substituteQuantityG, date }),
    });
  }

  async logDailyMetrics(
    weight: number,
    sleepHours: number,
    wakeTime: string,
    digestionRating: number,
    date?: string
  ): Promise<{ success: boolean; data: DailyLog }> {
    return this.request('/nutrition/daily-log', {
      method: 'POST',
      body: JSON.stringify({
        weight,
        sleepHours,
        wakeTime,
        digestionRating,
        date,
      }),
    });
  }

  async getDailyLogs(limit?: number): Promise<{ success: boolean; data: DailyLog[] }> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/nutrition/daily-logs${params}`);
  }

  async getOptimalScore(): Promise<{ success: boolean; data: OptimalScore }> {
    return this.request('/nutrition/optimal-score');
  }

  async getGoal(): Promise<{ success: boolean; data: UserGoal }> {
    return this.request('/user/goal');
  }

  async setGoal(
    goalWeight: number | null,
    goalDirection: 'lose' | 'gain' | 'maintain' | null
  ): Promise<{ success: boolean; data: UserGoal }> {
    return this.request('/user/goal', {
      method: 'PATCH',
      body: JSON.stringify({ goalWeight, goalDirection }),
    });
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);