import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/database";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Apple, 
  Droplet, 
  Pill, 
  ArrowLeft,
  Flower2,
  Bell,
  User as UserIcon,
  LogOut,
  Utensils,
  TrendingUp
} from "lucide-react";

const NutritionPlan = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();

  const mealPlan = {
    breakfast: {
      name: "Antioxidant-Rich Smoothie Bowl",
      calories: 350,
      ingredients: ["Blueberries", "Spinach", "Greek Yogurt", "Chia Seeds", "Honey"],
    },
    lunch: {
      name: "Grilled Salmon with Quinoa",
      calories: 520,
      ingredients: ["Salmon", "Quinoa", "Broccoli", "Olive Oil", "Lemon"],
    },
    dinner: {
      name: "Vegetable Stir-Fry with Tofu",
      calories: 380,
      ingredients: ["Tofu", "Mixed Vegetables", "Brown Rice", "Ginger", "Turmeric"],
    },
    snacks: [
      { name: "Almonds & Walnuts", calories: 150 },
      { name: "Green Tea", calories: 5 },
    ],
  };

  const [dailyGoals, setDailyGoals] = useState({
    water: { current: 6, target: 8, unit: "glasses" },
    calories: { current: 1405, target: 2000, unit: "cal" },
    vitamins: { current: 3, target: 5, unit: "servings" },
  });

  const addWater = (amount: number) => {
    setDailyGoals(prev => ({
      ...prev,
      water: {
        ...prev.water,
        current: prev.water.current + amount
      }
    }));
  };

  return (
    <div className="min-h-screen gradient-blush">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/${userType}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Nutrition Plan</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <UserIcon className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="meals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="meals">Meal Plan</TabsTrigger>
            <TabsTrigger value="tracking">Daily Tracking</TabsTrigger>
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
          </TabsList>

          {/* Meal Plan Tab */}
          <TabsContent value="meals" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Utensils className="w-6 h-6 text-primary" />
                  Personalized Meal Plan
                </h2>
                <p className="text-muted-foreground">
                  {userType === "fighter" 
                    ? "Customized nutrition plan to support your body during treatment."
                    : userType === "survivor"
                    ? "Recovery-focused meal plan to help your body heal and thrive."
                    : "Preventive nutrition plan rich in antioxidants and nutrients."}
                </p>
              </div>

              <div className="space-y-6">
                {/* Breakfast */}
                <Card className="p-4 bg-rose-50 border border-rose-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">Breakfast</h3>
                      <p className="text-sm text-muted-foreground">{mealPlan.breakfast.calories} calories</p>
                    </div>
                    <Apple className="w-6 h-6 text-rose-600" />
                  </div>
                  <p className="font-medium text-foreground mb-2">{mealPlan.breakfast.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {mealPlan.breakfast.ingredients.map((ing, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white rounded-full text-xs text-muted-foreground">
                        {ing}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* Lunch */}
                <Card className="p-4 bg-green-50 border border-green-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">Lunch</h3>
                      <p className="text-sm text-muted-foreground">{mealPlan.lunch.calories} calories</p>
                    </div>
                    <Utensils className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-medium text-foreground mb-2">{mealPlan.lunch.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {mealPlan.lunch.ingredients.map((ing, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white rounded-full text-xs text-muted-foreground">
                        {ing}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* Dinner */}
                <Card className="p-4 bg-blue-50 border border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">Dinner</h3>
                      <p className="text-sm text-muted-foreground">{mealPlan.dinner.calories} calories</p>
                    </div>
                    <Utensils className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="font-medium text-foreground mb-2">{mealPlan.dinner.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {mealPlan.dinner.ingredients.map((ing, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white rounded-full text-xs text-muted-foreground">
                        {ing}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* Snacks */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Healthy Snacks</h3>
                  {mealPlan.snacks.map((snack, idx) => (
                    <Card key={idx} className="p-3 bg-white shadow-soft">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">{snack.name}</span>
                        <span className="text-sm text-muted-foreground">{snack.calories} cal</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Daily Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Daily Nutrition Tracking
                </h2>
                <p className="text-muted-foreground">
                  Track your daily intake of water, calories, and vitamins.
                </p>
              </div>

              <div className="space-y-6">
                {/* Water Intake */}
                <Card className="p-4 bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-foreground">Water Intake</h3>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {dailyGoals.water.current} / {dailyGoals.water.target} {dailyGoals.water.unit}
                    </span>
                  </div>
                  <Progress value={(dailyGoals.water.current / dailyGoals.water.target) * 100} className="h-2" />
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => addWater(1)}>+1 Glass</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => addWater(2)}>+2 Glasses</Button>
                  </div>
                </Card>

                {/* Calories */}
                <Card className="p-4 bg-green-50 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Apple className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-foreground">Calories</h3>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {dailyGoals.calories.current} / {dailyGoals.calories.target} {dailyGoals.calories.unit}
                    </span>
                  </div>
                  <Progress value={(dailyGoals.calories.current / dailyGoals.calories.target) * 100} className="h-2" />
                </Card>

                {/* Vitamins */}
                <Card className="p-4 bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold text-foreground">Vitamins & Antioxidants</h3>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {dailyGoals.vitamins.current} / {dailyGoals.vitamins.target} {dailyGoals.vitamins.unit}
                    </span>
                  </div>
                  <Progress value={(dailyGoals.vitamins.current / dailyGoals.vitamins.target) * 100} className="h-2" />
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Vitamin C</span>
                      <span className="text-foreground font-medium">✓</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Vitamin D</span>
                      <span className="text-foreground font-medium">✓</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Omega-3</span>
                      <span className="text-foreground font-medium">✓</span>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Utensils className="w-6 h-6 text-primary" />
                  Healthy Recipes
                </h2>
                <p className="text-muted-foreground">
                  Discover antioxidant-rich recipes based on recent medical studies.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Turmeric Golden Milk", category: "Beverage", time: "10 min" },
                  { name: "Broccoli & Quinoa Bowl", category: "Main", time: "25 min" },
                  { name: "Berry Antioxidant Smoothie", category: "Smoothie", time: "5 min" },
                  { name: "Mediterranean Salad", category: "Salad", time: "15 min" },
                ].map((recipe, idx) => (
                  <Card key={idx} className="p-4 bg-white shadow-soft hover:shadow-glow transition-smooth cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{recipe.name}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {recipe.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{recipe.category}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      View Recipe
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NutritionPlan;

