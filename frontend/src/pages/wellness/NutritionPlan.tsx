import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getCurrentUser } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Bell, User as UserIcon, Flower2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const NutritionPlan = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { toast } = useToast();
  const user = getCurrentUser();
  
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [waterIntake, setWaterIntake] = useState(0);
  const [caloriesTarget] = useState(1800);
  const [todayCalories, setTodayCalories] = useState(0);
  const [mealLog, setMealLog] = useState([]);

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    loadTodayData();
    loadMealLog();
  }, []);

  const loadTodayData = () => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`nutrition_${today}`);
    if (saved) {
      const data = JSON.parse(saved);
      setWaterIntake(data.waterIntake || 0);
      setTodayCalories(data.calories || 0);
    }
  };

  const saveTodayData = (water: number, calories: number) => {
    const today = new Date().toDateString();
    localStorage.setItem(`nutrition_${today}`, JSON.stringify({
      waterIntake: water,
      calories: calories,
      timestamp: new Date().toISOString()
    }));
  };

  const loadMealLog = () => {
    const mealLogs = localStorage.getItem('meal_log');
    if (mealLogs) {
      setMealLog(JSON.parse(mealLogs));
    }
  };

  const addMealCalories = (meal: any, mealType: string) => {
    const newCalories = todayCalories + meal.calories;
    setTodayCalories(newCalories);
    saveTodayData(waterIntake, newCalories);
    
    const newLog = {
      ...meal,
      mealType,
      timestamp: new Date().toISOString()
    };
    const updatedLog = [...mealLog, newLog];
    setMealLog(updatedLog);
    localStorage.setItem('meal_log', JSON.stringify(updatedLog));
    
    toast({
      title: t('wellness.meal_added') || 'Meal Added',
      description: `${meal.name} - ${meal.calories} cal`,
    });
  };

  const addWater = (cups: number) => {
    const newWaterIntake = waterIntake + cups;
    setWaterIntake(newWaterIntake);
    saveTodayData(newWaterIntake, todayCalories);
  };

  const getMealPlans = () => {
    return {
      breakfast: [
        { name: 'شوفان بالتوت والمكسرات', calories: 350, protein: 12, benefit: 'غني بالألياف', ingredients: ['شوفان', 'توت', 'لوز'] },
        { name: 'Oatmeal with berries', calories: 350, protein: 12, benefit: 'High fiber', ingredients: ['oats', 'berries', 'almonds'] },
        { name: 'بيض مسلوق مع أفوكادو', calories: 380, protein: 18, benefit: 'بروتين عالي', ingredients: ['بيض', 'أفوكادو'] },
        { name: 'Boiled eggs with avocado', calories: 380, protein: 18, benefit: 'High protein', ingredients: ['eggs', 'avocado'] }
      ],
      lunch: [
        { name: 'سمك السلمون مع خضار', calories: 450, protein: 35, benefit: 'أوميغا 3', ingredients: ['سلمون', 'بروكلي', 'أرز'] },
        { name: 'Salmon with vegetables', calories: 450, protein: 35, benefit: 'Omega 3', ingredients: ['salmon', 'broccoli', 'rice'] },
        { name: 'صدر دجاج مع سلطة', calories: 420, protein: 40, benefit: 'بروتين كامل', ingredients: ['دجاج', 'سلطة'] },
        { name: 'Chicken breast with salad', calories: 420, protein: 40, benefit: 'Complete protein', ingredients: ['chicken', 'salad'] }
      ],
      dinner: [
        { name: 'شوربة خضار مع دجاج', calories: 300, protein: 22, benefit: 'خفيف الهضم', ingredients: ['دجاج', 'خضار'] },
        { name: 'Vegetable soup with chicken', calories: 300, protein: 22, benefit: 'Light digestion', ingredients: ['chicken', 'vegetables'] },
        { name: 'سمك مشوي بالأعشاب', calories: 340, protein: 30, benefit: 'قليل الدهون', ingredients: ['سمك', 'أعشاب'] },
        { name: 'Grilled fish with herbs', calories: 340, protein: 30, benefit: 'Low fat', ingredients: ['fish', 'herbs'] }
      ],
      snacks: [
        { name: 'موز مع زبدة اللوز', calories: 200, protein: 8, benefit: 'طاقة مستدامة', ingredients: ['موز', 'زبدة لوز'] },
        { name: 'Banana with almond butter', calories: 200, protein: 8, benefit: 'Sustained energy', ingredients: ['banana', 'almond butter'] },
        { name: 'جزر وخيار مع حمص', calories: 150, protein: 6, benefit: 'ألياف وفيتامينات', ingredients: ['جزر', 'خيار', 'حمص'] },
        { name: 'Carrots and hummus', calories: 150, protein: 6, benefit: 'Fiber and vitamins', ingredients: ['carrots', 'cucumber', 'hummus'] }
      ]
    };
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'dark bg-zinc-950' : 'bg-gradient-to-br from-rose-50 via-white to-pink-50'}`}>
      {/* Header - Integrated with app */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-rose-100 dark:hover:bg-rose-900/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-md">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text text-transparent">
              {t('wellness.nutrition_plan') || '🍎 Nutrition Plan'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Button variant="ghost" size="icon" className="hover:bg-rose-100 dark:hover:bg-rose-900/20">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-rose-100 dark:hover:bg-rose-900/20">
              <UserIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Daily Tracker Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Water Intake Card */}
          <Card className="p-6 bg-white dark:bg-zinc-900 shadow-soft border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">💧 {t('wellness.water_intake') || 'Water Intake'}</h3>
                <span className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text">
                  {waterIntake}/8
                </span>
              </div>
              
              {/* Water Progress Bar */}
              <div className="mb-6">
                <div className="w-full h-3 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${(waterIntake / 8) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => addWater(1)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                  size="sm"
                >
                  +1 Cup
                </Button>
                <Button
                  onClick={() => addWater(2)}
                  className="flex-1 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  variant="outline"
                  size="sm"
                >
                  +2 Cups
                </Button>
              </div>
            </div>
          </Card>

          {/* Calories Card */}
          <Card className="p-6 bg-white dark:bg-zinc-900 shadow-soft border-0 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-red-200/30 dark:from-orange-900/20 dark:to-red-900/20 rounded-full -ml-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">🔥 {t('wellness.calories') || 'Calories'}</h3>
                <span className="text-3xl font-bold text-transparent bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text">
                  {todayCalories}
                </span>
              </div>

              {/* Calorie Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{t('wellness.target') || 'Target'}: {caloriesTarget}</span>
                  <span>{t('wellness.remaining') || 'Remaining'}: {Math.max(caloriesTarget - todayCalories, 0)}</span>
                </div>
                <div className="w-full h-3 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                    style={{ width: `${Math.min((todayCalories / caloriesTarget) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {todayCalories >= caloriesTarget && (
                <p className="text-sm text-orange-600 dark:text-orange-400">✓ {t('wellness.goal_reached') || 'Daily goal reached!'}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Meal Selector Tabs */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">{t('wellness.select_meal') || 'Select a Meal'}</h2>
          
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'breakfast', icon: '🌅', label: 'wellness.breakfast' },
              { id: 'lunch', icon: '☀️', label: 'wellness.lunch' },
              { id: 'dinner', icon: '🌙', label: 'wellness.dinner' },
              { id: 'snacks', icon: '🍪', label: 'wellness.snacks' }
            ].map((meal) => (
              <Button
                key={meal.id}
                onClick={() => setSelectedMeal(meal.id)}
                className={`whitespace-nowrap px-6 transition-all ${
                  selectedMeal === meal.id
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md'
                    : 'bg-white dark:bg-zinc-900 text-foreground border border-border hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                {meal.icon} {t(meal.label) || meal.id}
              </Button>
            ))}
          </div>
        </div>

        {/* Meal Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getMealPlans()[selectedMeal]?.map((meal, index) => (
            <Card
              key={index}
              className="p-5 bg-white dark:bg-zinc-900 shadow-soft border-0 hover:shadow-glow transition-all duration-300 group cursor-pointer overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <h3 className="font-semibold text-foreground mb-3 text-lg group-hover:text-primary transition-colors">
                  {meal.name}
                </h3>

                {/* Meal Stats */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-medium">
                    {meal.calories} cal
                  </span>
                  {meal.protein && (
                    <span className="text-xs bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full font-medium">
                      {meal.protein}g protein
                    </span>
                  )}
                </div>

                {/* Benefit */}
                {meal.benefit && (
                  <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                    <span>✨</span> {meal.benefit}
                  </p>
                )}

                {/* Ingredients */}
                {meal.ingredients && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {meal.ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="text-xs bg-rose-100/50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-2 py-1 rounded-md"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Button */}
                <Button
                  onClick={() => addMealCalories(meal, selectedMeal)}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-glow text-white border-0 font-medium"
                  size="sm"
                >
                  {t('wellness.add') || 'Add Meal'} +
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Nutrition Tips Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 shadow-soft">
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-300 mb-4">💧 {t('wellness.hydration_tips') || 'Hydration Tips'}</h3>
            <ul className="space-y-3 text-sm text-emerald-800 dark:text-emerald-200">
              <li className="flex gap-2">
                <span>✓</span>
                <span>{t('wellness.tip_water_morning') || 'Drink water first thing in the morning'}</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>{t('wellness.tip_water_meals') || 'Drink water with every meal'}</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>{t('wellness.tip_water_exercise') || 'Increase intake during exercise'}</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>{t('wellness.tip_water_evening') || 'Limit water intake 2 hours before bed'}</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800/50 shadow-soft">
            <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-4">🥗 {t('wellness.nutrition_tips') || 'Nutrition Tips'}</h3>
            <ul className="space-y-3 text-sm text-purple-800 dark:text-purple-200">
              <li className="flex gap-2">
                <span>✓</span>
                <span>{t('wellness.tip_balance') || 'Balance proteins, carbs, and healthy fats'}</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>{t('wellness.tip_colorful') || 'Eat colorful vegetables daily'}</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>{t('wellness.tip_portions') || 'Practice portion control'}</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>{t('wellness.tip_frequent') || 'Eat smaller meals more frequently'}</span>
              </li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NutritionPlan;
