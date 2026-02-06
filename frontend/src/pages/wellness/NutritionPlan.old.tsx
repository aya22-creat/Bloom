import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getCurrentUser } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Moon, Sun, Globe, ArrowLeft, Bell, User as UserIcon, LogOut, Flower2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import './NutritionPlan.css';

const TRANSLATIONS = {
  ar: {
    title: '🍎 خطة التغذية',
    water: '💧 شرب الماء',
    calories: '🔥 السعرات الحرارية',
    remaining: 'متبقي',
    cups: 'أكواس',
    breakfast: 'فطور',
    lunch: 'غداء',
    dinner: 'عشاء',
    snacks: 'سناك',
    options: 'خيارات',
    add: '+ إضافة',
    addCup: '+1 كوب',
    add2Cups: '+2 كوب',
    superfoods: '🌟 أطعمة خارقة لصحة الثدي',
    nutritionTips: '💡 نصائح غذائية مهمة',
    patientMeals: '📊 سجل وجبات المرضى',
    today: 'اليوم',
    viewMeals: 'عرض الوجبات',
    noMeals: 'لا توجد وجبات مسجلة',
    mealType: 'نوع الوجبة',
    time: 'الوقت'
  },
  en: {
    title: '🍎 Nutrition Plan',
    water: '💧 Water Intake',
    calories: '🔥 Calories',
    remaining: 'Remaining',
    cups: 'cups',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
    options: 'Options',
    add: '+ Add',
    addCup: '+1 Cup',
    add2Cups: '+2 Cups',
    superfoods: '🌟 Superfoods for Breast Health',
    nutritionTips: '💡 Important Nutrition Tips',
    patientMeals: '📊 Patient Meal Log',
    today: 'Today',
    viewMeals: 'View Meals',
    noMeals: 'No meals recorded',
    mealType: 'Meal Type',
    time: 'Time'
  }
};

const MEAL_PLANS = {
  patient: {
    breakfast: [
      { name: 'شوفان بالتوت والمكسرات', calories: 350, ingredients: ['شوفان', 'توت', 'لوز', 'عسل'], protein: 12, benefit: 'غني بالألياف' },
      { name: 'بيض مسلوق مع أفوكادو وخبز أسمر', calories: 380, ingredients: ['بيض', 'أفوكادو', 'خبز أسمر'], protein: 18, benefit: 'بروتين عالي' },
      { name: 'زبادي يوناني بالفواكه', calories: 300, ingredients: ['زبادي', 'فراولة', 'موز', 'شيا'], protein: 15, benefit: 'بروبيوتيك' },
      { name: 'عجة البيض بالسبانخ', calories: 320, ingredients: ['بيض', 'سبانخ', 'بصل', 'جبن قليل الدسم'], protein: 20, benefit: 'حديد وفيتامينات' },
      { name: 'سموثي بروتين بالتوت', calories: 340, ingredients: ['حليب لوز', 'توت مشكل', 'بروتين', 'موز'], protein: 25, benefit: 'طاقة سريعة' }
    ],
    lunch: [
      { name: 'سمك السلمون المشوي مع خضار', calories: 450, ingredients: ['سلمون', 'بروكلي', 'جزر', 'أرز بني'], protein: 35, benefit: 'أوميغا 3' },
      { name: 'صدر دجاج مع سلطة كينوا', calories: 420, ingredients: ['دجاج', 'كينوا', 'خس', 'طماطم'], protein: 40, benefit: 'بروتين كامل' },
      { name: 'عدس بالخضار وأرز بني', calories: 400, ingredients: ['عدس', 'جزر', 'كوسة', 'أرز'], protein: 18, benefit: 'حديد وألياف' },
      { name: 'تونة مع سلطة خضراء', calories: 380, ingredients: ['تونة', 'خس', 'خيار', 'زيتون', 'ليمون'], protein: 32, benefit: 'أوميغا 3 وبروتين' },
      { name: 'دجاج بالكاري مع أرز بسمتي', calories: 460, ingredients: ['دجاج', 'كاري', 'أرز بسمتي', 'بصل', 'ثوم'], protein: 38, benefit: 'كركم مضاد للالتهاب' },
      { name: 'برجر دجاج مشوي مع بطاطا حلوة', calories: 440, ingredients: ['دجاج مفروم', 'بطاطا حلوة', 'خس', 'طماطم'], protein: 36, benefit: 'فيتامين A' }
    ],
    dinner: [
      { name: 'شوربة خضار مع قطعة دجاج', calories: 300, ingredients: ['دجاج', 'كوسة', 'جزر', 'بطاطس'], protein: 22, benefit: 'خفيف وسهل الهضم' },
      { name: 'سلطة تونة بزيت الزيتون', calories: 350, ingredients: ['تونة', 'خس', 'زيتون', 'طماطم'], protein: 28, benefit: 'دهون صحية' },
      { name: 'بطاطا حلوة مشوية مع سلطة', calories: 320, ingredients: ['بطاطا حلوة', 'خضار مشكلة'], protein: 8, benefit: 'مضادات أكسدة' },
      { name: 'سمك مشوي بالأعشاب', calories: 340, ingredients: ['سمك أبيض', 'ليمون', 'بقدونس', 'ثوم'], protein: 30, benefit: 'قليل الدهون' },
      { name: 'شوربة العدس الأحمر', calories: 280, ingredients: ['عدس أحمر', 'جزر', 'بصل', 'كمون'], protein: 16, benefit: 'حديد وبروتين نباتي' }
    ],
    snacks: [
      { name: 'موز مع زبدة اللوز', calories: 200, protein: 8, benefit: 'طاقة مستدامة' },
      { name: 'جزر وخيار مع حمص', calories: 150, protein: 6, benefit: 'ألياف وفيتامينات' },
      { name: 'حفنة مكسرات نيئة', calories: 180, protein: 6, benefit: 'دهون صحية' },
      { name: 'تفاحة مع زبدة الفول السوداني', calories: 190, protein: 8, benefit: 'بروتين وألياف' },
      { name: 'زبادي يوناني بالعسل', calories: 160, protein: 12, benefit: 'كالسيوم وبروبيوتيك' }
    ]
  },
  survivor: {
    breakfast: [
      { name: 'سموثي أخضر بالسبانخ والتفاح', calories: 280, ingredients: ['سبانخ', 'تفاح', 'موز', 'شيا'], protein: 10, benefit: 'ديتوكس' },
      { name: 'توست أسمر بالأفوكادو والبيض', calories: 360, ingredients: ['خبز أسمر', 'أفوكادو', 'بيض'], protein: 16, benefit: 'دهون صحية' },
      { name: 'فطائر الشوفان بالتوت', calories: 320, ingredients: ['شوفان', 'توت', 'بيض', 'قرفة'], protein: 14, benefit: 'ألياف عالية' },
      { name: 'جبن قريش مع فواكه', calories: 290, ingredients: ['جبن قريش', 'فراولة', 'كيوي', 'عسل'], protein: 18, benefit: 'بروتين خفيف' },
      { name: 'بان كيك الموز الصحي', calories: 340, ingredients: ['موز', 'شوفان', 'بيض', 'قرفة'], protein: 12, benefit: 'بدون سكر مضاف' }
    ],
    lunch: [
      { name: 'سلطة الفاصوليا السوداء', calories: 380, ingredients: ['فاصوليا', 'أفوكادو', 'ذرة', 'طماطم'], protein: 16, benefit: 'بروتين نباتي' },
      { name: 'دجاج بالكاري مع أرز بني', calories: 420, ingredients: ['دجاج', 'كاري', 'أرز', 'خضار'], protein: 38, benefit: 'مضاد التهاب' },
      { name: 'معكرونة القمح الكامل بالخضار', calories: 400, ingredients: ['معكرونة', 'بروكلي', 'طماطم'], protein: 15, benefit: 'كربوهيدرات معقدة' },
      { name: 'سلطة الكينوا بالدجاج', calories: 440, ingredients: ['كينوا', 'دجاج مشوي', 'أفوكادو', 'رمان'], protein: 36, benefit: 'بروتين كامل' },
      { name: 'يخنة الخضار مع اللحم', calories: 410, ingredients: ['لحم قليل الدهن', 'كوسة', 'جزر', 'بطاطس'], protein: 32, benefit: 'حديد وزنك' },
      { name: 'سلمون بالصلصة الآسيوية', calories: 450, ingredients: ['سلمون', 'صويا صوص', 'زنجبيل', 'أرز'], protein: 40, benefit: 'أوميغا 3 عالي' }
    ],
    dinner: [
      { name: 'سمك مشوي مع خضار بخار', calories: 350, ingredients: ['سمك', 'بروكلي', 'جزر'], protein: 32, benefit: 'وجبة خفيفة' },
      { name: 'حساء العدس الأحمر', calories: 300, ingredients: ['عدس', 'طماطم', 'كمون'], protein: 18, benefit: 'دافئ ومغذي' },
      { name: 'دجاج مشوي مع سلطة خضراء', calories: 330, ingredients: ['دجاج', 'خس', 'خيار'], protein: 36, benefit: 'قليل السعرات' },
      { name: 'شوربة الدجاج بالخضار', calories: 290, ingredients: ['دجاج', 'جزر', 'كرفس', 'بصل'], protein: 24, benefit: 'مهدئ ومغذي' },
      { name: 'عجة الخضار', calories: 280, ingredients: ['بيض', 'سبانخ', 'فلفل', 'بصل'], protein: 20, benefit: 'سريع وصحي' }
    ],
    snacks: [
      { name: 'تفاحة مع زبدة الفول السوداني', calories: 190, protein: 8, benefit: 'طاقة مستدامة' },
      { name: 'زبادي بالعنب البري', calories: 160, protein: 10, benefit: 'مضادات أكسدة' },
      { name: 'كرات الطاقة بالتمر', calories: 140, protein: 4, benefit: 'حلوى صحية' },
      { name: 'شرائح خيار بالحمص', calories: 130, protein: 5, benefit: 'منعش وخفيف' },
      { name: 'حفنة لوز محمص', calories: 170, protein: 7, benefit: 'فيتامين E' }
    ]
  },
  preventive: {
    breakfast: [
      { name: 'بان كيك الموز بالشوفان', calories: 340, ingredients: ['موز', 'شوفان', 'بيض', 'قرفة'], protein: 14, benefit: 'بدون سكر' },
      { name: 'زبادي بالجرانولا والفواكه', calories: 310, ingredients: ['زبادي', 'جرانولا', 'توت'], protein: 12, benefit: 'طاقة الصباح' },
      { name: 'عجة الخضار مع خبز أسمر', calories: 330, ingredients: ['بيض', 'سبانخ', 'طماطم'], protein: 18, benefit: 'فيتامينات متعددة' },
      { name: 'سموثي البروتين الأخضر', calories: 300, ingredients: ['سبانخ', 'موز', 'بروتين', 'حليب لوز'], protein: 22, benefit: 'غني بالبروتين' },
      { name: 'توست الأفوكادو بالبيض المسلوق', calories: 360, ingredients: ['خبز حبوب كاملة', 'أفوكادو', 'بيض', 'طماطم'], protein: 16, benefit: 'دهون صحية' }
    ],
    lunch: [
      { name: 'سلطة الكينوا بالخضار الملونة', calories: 390, ingredients: ['كينوا', 'خيار', 'طماطم', 'نعناع'], protein: 14, benefit: 'فيتامينات ملونة' },
      { name: 'دجاج تكا مسالا مع أرز', calories: 430, ingredients: ['دجاج', 'طماطم', 'كريمة', 'أرز'], protein: 36, benefit: 'بهارات صحية' },
      { name: 'برجر نباتي مع بطاطا مشوية', calories: 410, ingredients: ['برجر نباتي', 'خس', 'بطاطا'], protein: 18, benefit: 'بروتين نباتي' },
      { name: 'سلطة الدجاج المشوي', calories: 380, ingredients: ['دجاج', 'خس', 'جرجير', 'جبن فيتا', 'زيتون'], protein: 38, benefit: 'غني بالبروتين' },
      { name: 'معكرونة بالطماطم والريحان', calories: 400, ingredients: ['معكرونة حبوب كاملة', 'طماطم', 'ريحان', 'ثوم'], protein: 14, benefit: 'مضادات أكسدة' },
      { name: 'سمك التونة مع الأرز', calories: 420, ingredients: ['تونة', 'أرز بني', 'خضار مشكلة'], protein: 34, benefit: 'أوميغا 3' }
    ],
    dinner: [
      { name: 'باستا الخضار بالصلصة الحمراء', calories: 360, ingredients: ['معكرونة', 'كوسة', 'باذنجان'], protein: 12, benefit: 'خضار متنوعة' },
      { name: 'سمك التونة المشوي مع السلطة', calories: 340, ingredients: ['تونة', 'سلطة', 'ليمون'], protein: 32, benefit: 'بروتين عالي' },
      { name: 'شوربة الدجاج بالخضار', calories: 290, ingredients: ['دجاج', 'جزر', 'كرفس'], protein: 22, benefit: 'مهدئ للمعدة' },
      { name: 'بطاطا مشوية بالجبن', calories: 350, ingredients: ['بطاطا', 'جبن قليل الدسم', 'بروكلي'], protein: 16, benefit: 'كالسيوم وألياف' },
      { name: 'سلطة نيسواز', calories: 380, ingredients: ['تونة', 'بيض مسلوق', 'زيتون', 'خس', 'طماطم'], protein: 28, benefit: 'وجبة متكاملة' }
    ],
    snacks: [
      { name: 'شرائح تفاح بالقرفة', calories: 120, protein: 1, benefit: 'مضاد أكسدة' },
      { name: 'حمص بالخضار النيئة', calories: 170, protein: 6, benefit: 'ألياف وبروتين' },
      { name: 'كوب فشار بدون زبدة', calories: 100, protein: 3, benefit: 'حبوب كاملة' },
      { name: 'مكعبات جبن مع عنب', calories: 160, protein: 8, benefit: 'كالسيوم' },
      { name: 'كرات البروتين بالشوكولاتة', calories: 150, protein: 10, benefit: 'طاقة سريعة' }
    ]
  }
};

const SUPERFOODS = [
  { name: 'التوت البري', benefit: 'غني بمضادات الأكسدة', icon: '🫐' },
  { name: 'البروكلي', benefit: 'يحتوي على مركبات مضادة للسرطان', icon: '🥦' },
  { name: 'الثوم', benefit: 'يعزز جهاز المناعة', icon: '🧄' },
  { name: 'الكركم', benefit: 'مضاد قوي للالتهابات', icon: '✨' },
  { name: 'السلمون', benefit: 'غني بأوميغا 3', icon: '🐟' },
  { name: 'الشاي الأخضر', benefit: 'مضاد للأكسدة', icon: '🍵' },
  { name: 'الجوز', benefit: 'يدعم صحة الثدي', icon: '🌰' },
  { name: 'الرمان', benefit: 'يحمي الخلايا', icon: '🍒' },
  { name: 'السبانخ', benefit: 'غني بالحديد وفيتامين K', icon: '🥬' },
  { name: 'الأفوكادو', benefit: 'دهون صحية للقلب', icon: '🥑' },
  { name: 'اللوز', benefit: 'فيتامين E للبشرة', icon: '🥜' },
  { name: 'الزنجبيل', benefit: 'يحارب الغثيان', icon: '🥖' },
  { name: 'الفلفل الملون', benefit: 'غني بفيتامين C', icon: '🫑' },
  { name: 'الشوفان', benefit: 'ألياف للهضم', icon: '🍚' },
  { name: 'الطماطم', benefit: 'لايكوبين لصحة الثدي', icon: '🍅' },
  { name: 'بذور الشيا', benefit: 'أوميغا 3 نباتي', icon: '🌿' }
];

const NutritionPlan = () => {
  const [userType, setUserType] = useState('patient');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [waterIntake, setWaterIntake] = useState(0);
  const [caloriesTarget] = useState(1800);
  const [todayCalories, setTodayCalories] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('ar');
  const [mealLog, setMealLog] = useState([]);
  const user = getCurrentUser();
  const isDoctor = false; // TODO: Integrate RBAC system
  const t = TRANSLATIONS[language];


  useEffect(() => {
    loadTodayData();
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (profile.userType) {
      setUserType(profile.userType);
    }
    loadMealLog();
  }, [language]);

  const loadTodayData = () => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('nutritionData');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === today) {
        setWaterIntake(data.water || 0);
        setTodayCalories(data.calories || 0);
      }
    }
  };

  const loadMealLog = () => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('mealLog');
    if (saved) {
      const logs = JSON.parse(saved);
      const todayLogs = logs.filter(log => log.date === today);
      setMealLog(todayLogs);
    }
  };

  const saveTodayData = (water, calories) => {
    const data = {
      date: new Date().toDateString(),
      water,
      calories
    };
    localStorage.setItem('nutritionData', JSON.stringify(data));
  };

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('nutritionTheme', newTheme ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    localStorage.setItem('nutritionLang', newLang);
  };

  const addWater = (amount) => {
    const newAmount = waterIntake + amount;
    setWaterIntake(newAmount);
    saveTodayData(newAmount, todayCalories);
  };

  const addMealCalories = (meal, mealType) => {
    const newTotal = todayCalories + meal.calories;
    setTodayCalories(newTotal);
    saveTodayData(waterIntake, newTotal);
    
    // Log the meal
    const mealEntry = {
      date: new Date().toDateString(),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      mealType,
      meal: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      userId: user?.id,
      userName: user?.name
    };
    
    const saved = localStorage.getItem('mealLog');
    const logs = saved ? JSON.parse(saved) : [];
    logs.push(mealEntry);
    localStorage.setItem('mealLog', JSON.stringify(logs));
    loadMealLog();
  };

  const getMealPlans = () => {
    return MEAL_PLANS[userType] || MEAL_PLANS.patient;
  };

  return (
    <div className={`nutrition-page ${darkMode ? 'dark-mode' : ''} ${language === 'en' ? 'ltr' : ''}`}>
      <div className="nutrition-header">
        <button onClick={() => window.history.back()} className="back-btn">←</button>
        <h1>{t.title}</h1>
        <div className="header-controls">
          <button onClick={toggleLanguage} className="control-btn" title={language === 'ar' ? 'English' : 'عربي'}>
            <Globe size={20} />
          </button>
          <button onClick={toggleTheme} className="control-btn" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <div className="nutrition-content">
        {/* Doctor View - Meal Log */}
        {isDoctor && (
          <div className="doctor-meal-log">
            <h3>{t.patientMeals}</h3>
            {mealLog.length > 0 ? (
              <div className="meal-log-list">
                {mealLog.map((log, index) => (
                  <div key={index} className="meal-log-item">
                    <div className="log-time">{log.time}</div>
                    <div className="log-details">
                      <strong>{log.meal}</strong>
                      <div className="log-meta">
                        <span>{log.mealType} • </span>
                        <span>{log.calories} {language === 'ar' ? 'سعرة' : 'cal'} • </span>
                        <span>🥩 {log.protein}g</span>
                      </div>
                      {log.userName && <div className="log-user">👤 {log.userName}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-meals">{t.noMeals}</p>
            )}
          </div>
        )}

        {/* Daily Tracker */}
        {!isDoctor && (
          <div className="daily-tracker">
            <WaterTracker 
              current={waterIntake}
              target={8}
              onAdd={addWater}
              t={t}
            />
            <CalorieTracker 
              current={todayCalories}
              target={caloriesTarget}
              t={t}
              language={language}
            />
          </div>
        )}

        {/* Meal Selector */}
        {!isDoctor && (
          <div className="meal-selector">
            <button 
              className={selectedMeal === 'breakfast' ? 'active' : ''}
              onClick={() => setSelectedMeal('breakfast')}
            >
              🌅 {t.breakfast}
            </button>
            <button 
              className={selectedMeal === 'lunch' ? 'active' : ''}
              onClick={() => setSelectedMeal('lunch')}
            >
              ☀️ {t.lunch}
            </button>
            <button 
              className={selectedMeal === 'dinner' ? 'active' : ''}
              onClick={() => setSelectedMeal('dinner')}
            >
              🌙 {t.dinner}
            </button>
            <button 
              className={selectedMeal === 'snacks' ? 'active' : ''}
              onClick={() => setSelectedMeal('snacks')}
            >
              🍪 {t.snacks}
            </button>
          </div>
        )}

        {/* Meal Options */}
        {!isDoctor && (
          <div className="meal-options">
            <h3>{t.options} {selectedMeal === 'breakfast' ? t.breakfast : 
                        selectedMeal === 'lunch' ? t.lunch : 
                        selectedMeal === 'dinner' ? t.dinner : t.snacks}</h3>
            <div className="meals-grid">
              {getMealPlans()[selectedMeal]?.map((meal, index) => (
                <MealCard 
                  key={index} 
                  meal={meal}
                  onAdd={() => addMealCalories(meal, selectedMeal)}
                  t={t}
                  language={language}
                />
              ))}
            </div>
          </div>
        )}
        {/* Superfoods Section */}
        <div className="superfoods-section">
          <h3>🌟 {t.superfoods}</h3>
          <div className="superfoods-grid">
            {SUPERFOODS.map((food, index) => (
              <SuperfoodCard key={index} food={food} />
            ))}
          </div>
        </div>

        {/* Nutrition Tips */}
        <NutritionTips />
      </div>
    </div>
  );
};

const WaterTracker = ({ current, target, onAdd, t }) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="tracker-card water">
      <div className="tracker-header">
        <h4>{t.water}</h4>
        <span className="tracker-value">{current} / {target} {t.cups}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="water-actions">
        <button onClick={() => onAdd(1)} className="add-water-btn">{t.addCup}</button>
        <button onClick={() => onAdd(2)} className="add-water-btn">{t.add2Cups}</button>
      </div>
    </div>
  );
};

const CalorieTracker = ({ current, target, t, language }) => {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  return (
    <div className="tracker-card calories">
      <div className="tracker-header">
        <h4>{t.calories}</h4>
        <span className="tracker-value">{current} / {target}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <p className="remaining">{t.remaining}: {remaining} {language === 'ar' ? 'سعرة' : 'cal'}</p>
    </div>
  );
};

const MealCard = ({ meal, onAdd, t, language }) => (
  <div className="meal-card">
    <div className="meal-info">
      <h4>{meal.name}</h4>
      <div className="meal-badges">
        <div className="calories-badge">{meal.calories} {language === 'ar' ? 'سعرة' : 'cal'}</div>
        {meal.protein && <div className="protein-badge">🥩 {meal.protein}g</div>}
      </div>
      {meal.benefit && (
        <div className="benefit-tag">✨ {meal.benefit}</div>
      )}
      {meal.ingredients && (
        <div className="ingredients">
          {meal.ingredients.map((ing, i) => (
            <span key={i} className="ingredient-tag">{ing}</span>
          ))}
        </div>
      )}
    </div>
    <button onClick={onAdd} className="add-meal-btn">
      {t.add}
    </button>
  </div>
);

const SuperfoodCard = ({ food }) => (
  <div className="superfood-card">
    <div className="superfood-icon">{food.icon}</div>
    <h5>{food.name}</h5>
    <p>{food.benefit}</p>
  </div>
);

const NutritionTips = () => (
  <div className="nutrition-tips">
    <h3>💡 نصائح غذائية مهمة</h3>
    <div className="tips-grid">
      <div className="tip-card">
        <span className="tip-icon">🥗</span>
        <p>تناولي 5 حصص من الخضار والفواكه يومياً</p>
      </div>
      <div className="tip-card">
        <span className="tip-icon">🚫</span>
        <p>قللي من السكريات المصنعة واللحوم الحمراء</p>
      </div>
      <div className="tip-card">
        <span className="tip-icon">🌾</span>
        <p>اختاري الحبوب الكاملة بدلاً من المكررة</p>
      </div>
      <div className="tip-card">
        <span className="tip-icon">🥜</span>
        <p>أضيفي المكسرات والبذور لوجباتك</p>
      </div>
    </div>
  </div>
);

export default NutritionPlan;

