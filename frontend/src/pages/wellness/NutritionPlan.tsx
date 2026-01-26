import React, { useState, useEffect } from 'react';
import './NutritionPlan.css';

const MEAL_PLANS = {
  patient: {
    breakfast: [
      { name: 'شوفان بالتوت والمكسرات', calories: 350, ingredients: ['شوفان', 'توت', 'لوز', 'عسل'] },
      { name: 'بيض مسلوق مع أفوكادو وخبز أسمر', calories: 380, ingredients: ['بيض', 'أفوكادو', 'خبز أسمر'] },
      { name: 'زبادي يوناني بالفواكه', calories: 300, ingredients: ['زبادي', 'فراولة', 'موز', 'شيا'] }
    ],
    lunch: [
      { name: 'سمك السلمون المشوي مع خضار', calories: 450, ingredients: ['سلمون', 'بروكلي', 'جزر', 'أرز بني'] },
      { name: 'صدر دجاج مع سلطة كينوا', calories: 420, ingredients: ['دجاج', 'كينوا', 'خس', 'طماطم'] },
      { name: 'عدس بالخضار وأرز بني', calories: 400, ingredients: ['عدس', 'جزر', 'كوسة', 'أرز'] }
    ],
    dinner: [
      { name: 'شوربة خضار مع قطعة دجاج', calories: 300, ingredients: ['دجاج', 'كوسة', 'جزر', 'بطاطس'] },
      { name: 'سلطة تونة بزيت الزيتون', calories: 350, ingredients: ['تونة', 'خس', 'زيتون', 'طماطم'] },
      { name: 'بطاطا حلوة مشوية مع سلطة', calories: 320, ingredients: ['بطاطا حلوة', 'خضار مشكلة'] }
    ],
    snacks: [
      { name: 'موز مع زبدة اللوز', calories: 200 },
      { name: 'جزر وخيار مع حمص', calories: 150 },
      { name: 'حفنة مكسرات نيئة', calories: 180 }
    ]
  },
  survivor: {
    breakfast: [
      { name: 'سموثي أخضر بالسبانخ والتفاح', calories: 280, ingredients: ['سبانخ', 'تفاح', 'موز', 'شيا'] },
      { name: 'توست أسمر بالأفوكادو والبيض', calories: 360, ingredients: ['خبز أسمر', 'أفوكادو', 'بيض'] },
      { name: 'فطائر الشوفان بالتوت', calories: 320, ingredients: ['شوفان', 'توت', 'بيض', 'قرفة'] }
    ],
    lunch: [
      { name: 'سلطة الفاصوليا السوداء', calories: 380, ingredients: ['فاصوليا', 'أفوكادو', 'ذرة', 'طماطم'] },
      { name: 'دجاج بالكاري مع أرز بني', calories: 420, ingredients: ['دجاج', 'كاري', 'أرز', 'خضار'] },
      { name: 'معكرونة القمح الكامل بالخضار', calories: 400, ingredients: ['معكرونة', 'بروكلي', 'طماطم'] }
    ],
    dinner: [
      { name: 'سمك مشوي مع خضار بخار', calories: 350, ingredients: ['سمك', 'بروكلي', 'جزر'] },
      { name: 'حساء العدس الأحمر', calories: 300, ingredients: ['عدس', 'طماطم', 'كمون'] },
      { name: 'دجاج مشوي مع سلطة خضراء', calories: 330, ingredients: ['دجاج', 'خس', 'خيار'] }
    ],
    snacks: [
      { name: 'تفاحة مع زبدة الفول السوداني', calories: 190 },
      { name: 'زبادي بالعنب البري', calories: 160 },
      { name: 'كرات الطاقة بالتمر', calories: 140 }
    ]
  },
  preventive: {
    breakfast: [
      { name: 'بان كيك الموز بالشوفان', calories: 340, ingredients: ['موز', 'شوفان', 'بيض', 'قرفة'] },
      { name: 'زبادي بالجرانولا والفواكه', calories: 310, ingredients: ['زبادي', 'جرانولا', 'توت'] },
      { name: 'عجة الخضار مع خبز أسمر', calories: 330, ingredients: ['بيض', 'سبانخ', 'طماطم'] }
    ],
    lunch: [
      { name: 'سلطة الكينوا بالخضار الملونة', calories: 390, ingredients: ['كينوا', 'خيار', 'طماطم', 'نعناع'] },
      { name: 'دجاج تكا مسالا مع أرز', calories: 430, ingredients: ['دجاج', 'طماطم', 'كريمة', 'أرز'] },
      { name: 'برجر نباتي مع بطاطا مشوية', calories: 410, ingredients: ['برجر نباتي', 'خس', 'بطاطا'] }
    ],
    dinner: [
      { name: 'باستا الخضار بالصلصة الحمراء', calories: 360, ingredients: ['معكرونة', 'كوسة', 'باذنجان'] },
      { name: 'سمك التونة المشوي مع السلطة', calories: 340, ingredients: ['تونة', 'سلطة', 'ليمون'] },
      { name: 'شوربة الدجاج بالخضار', calories: 290, ingredients: ['دجاج', 'جزر', 'كرفس'] }
    ],
    snacks: [
      { name: 'شرائح تفاح بالقرفة', calories: 120 },
      { name: 'حمص بالخضار النيئة', calories: 170 },
      { name: 'كوب فشار بدون زبدة', calories: 100 }
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
  { name: 'الرمان', benefit: 'يحمي الخلايا', icon: '🍒' }
];

const NutritionPlan = () => {
  const [userType, setUserType] = useState('patient');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [waterIntake, setWaterIntake] = useState(0);
  const [caloriesTarget] = useState(1800);
  const [todayCalories, setTodayCalories] = useState(0);


  useEffect(() => {
    loadTodayData();
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (profile.userType) {
      setUserType(profile.userType);
    }
  }, []);

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

  const saveTodayData = (water, calories) => {
    const data = {
      date: new Date().toDateString(),
      water,
      calories
    };
    localStorage.setItem('nutritionData', JSON.stringify(data));
  };

  const addWater = (amount) => {
    const newAmount = waterIntake + amount;
    setWaterIntake(newAmount);
    saveTodayData(newAmount, todayCalories);
  };

  const addMealCalories = (calories) => {
    const newTotal = todayCalories + calories;
    setTodayCalories(newTotal);
    saveTodayData(waterIntake, newTotal);
  };

  const getMealPlans = () => {
    return MEAL_PLANS[userType] || MEAL_PLANS.patient;
  };

  return (
    <div className="nutrition-page">
      <div className="nutrition-header">
        <button onClick={() => window.history.back()} className="back-btn">←</button>
        <h1>🍎 خطة التغذية</h1>
        <div style={{ width: '40px' }}></div>
      </div>

      <div className="nutrition-content">
        {/* Daily Tracker */}
        <div className="daily-tracker">
          <WaterTracker 
            current={waterIntake}
            target={8}
            onAdd={addWater}
          />
          <CalorieTracker 
            current={todayCalories}
            target={caloriesTarget}
          />
        </div>

        {/* Meal Selector */}
        <div className="meal-selector">
          <button 
            className={selectedMeal === 'breakfast' ? 'active' : ''}
            onClick={() => setSelectedMeal('breakfast')}
          >
            🌅 فطور
          </button>
          <button 
            className={selectedMeal === 'lunch' ? 'active' : ''}
            onClick={() => setSelectedMeal('lunch')}
          >
            ☀️ غداء
          </button>
          <button 
            className={selectedMeal === 'dinner' ? 'active' : ''}
            onClick={() => setSelectedMeal('dinner')}
          >
            🌙 عشاء
          </button>
          <button 
            className={selectedMeal === 'snacks' ? 'active' : ''}
            onClick={() => setSelectedMeal('snacks')}
          >
            🍪 سناك
          </button>
        </div>

        {/* Meal Options */}
        <div className="meal-options">
          <h3>خيارات {selectedMeal === 'breakfast' ? 'الفطور' : 
                      selectedMeal === 'lunch' ? 'الغداء' : 
                      selectedMeal === 'dinner' ? 'العشاء' : 'السناك'}</h3>
          <div className="meals-grid">
            {getMealPlans()[selectedMeal]?.map((meal, index) => (
              <MealCard 
                key={index} 
                meal={meal}
                onAdd={() => addMealCalories(meal.calories)}
              />
            ))}
          </div>
        </div>

        {/* Superfoods Section */}
        <div className="superfoods-section">
          <h3>🌟 أطعمة خارقة لصحة الثدي</h3>
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

const WaterTracker = ({ current, target, onAdd }) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="tracker-card water">
      <div className="tracker-header">
        <h4>💧 شرب الماء</h4>
        <span className="tracker-value">{current} / {target} أكواس</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="water-actions">
        <button onClick={() => onAdd(1)} className="add-water-btn">+1 كوب</button>
        <button onClick={() => onAdd(2)} className="add-water-btn">+2 كوب</button>
      </div>
    </div>
  );
};

const CalorieTracker = ({ current, target }) => {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  return (
    <div className="tracker-card calories">
      <div className="tracker-header">
        <h4>🔥 السعرات الحرارية</h4>
        <span className="tracker-value">{current} / {target}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <p className="remaining">متبقي: {remaining} سعرة</p>
    </div>
  );
};

const MealCard = ({ meal, onAdd }) => (
  <div className="meal-card">
    <div className="meal-info">
      <h4>{meal.name}</h4>
      <div className="calories-badge">{meal.calories} سعرة</div>
      {meal.ingredients && (
        <div className="ingredients">
          {meal.ingredients.map((ing, i) => (
            <span key={i} className="ingredient-tag">{ing}</span>
          ))}
        </div>
      )}
    </div>
    <button onClick={onAdd} className="add-meal-btn">
      + إضافة
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

