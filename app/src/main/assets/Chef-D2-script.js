/* ═══════════════════════════════════════════════════════════
   CHEF D2 — FRONTEND LOGIC

   This file is FRONTEND ONLY. All backend/API calls are
   marked with  ◆ BACKEND  comments. Replace those stubs
   with real fetch() calls to your API.

   Data flow:
   1. User picks image  →  send to /api/scan  →  get ingredients
   2. User sets prefs   →  send to /api/generate  →  get recipe
   3. Recipe returned   →  send to /api/nutrition  →  get macros
   ═══════════════════════════════════════════════════════════ */

// ─── App State ────────────────────────────────────────────
const state = {
  imageFile: null,              // File object from camera/gallery
  ingredients: [],              // Array of { name, emoji, confidence }
  preferences: {
    dietary: [],                // e.g. ['vegetarian','halal']
    allergies: [],              // e.g. ['peanuts','dairy']
    budget: 350,                // in ₱
    suggestSubstitutes: true,
    prioritizeLocal: false,
  },
  recipe: null,                 // Full recipe object from API
  nutrition: null,              // Nutrition data from API
};

const SCREENS = ['screen-scan','screen-detect','screen-prefs','screen-meal','screen-nutrition'];

// ─── Navigation ───────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelector('.screen-container').scrollTop = 0;
  const idx = SCREENS.indexOf(id);
  document.querySelectorAll('.nav-dot').forEach((d,i) => d.classList.toggle('active', i === idx));
}

// Nav dots click
document.querySelectorAll('.nav-dot').forEach(dot => {
  dot.addEventListener('click', () => showScreen(dot.dataset.screen));
});

// ─── Screen 1: Image Capture ──────────────────────────────
const cameraArea    = document.getElementById('cameraArea');
const imageInput    = document.getElementById('imageInput');
const btnScan       = document.getElementById('btnScan');
const btnGallery    = document.getElementById('btnGallery');

// Tap camera area or "Scan" → open camera
if (cameraArea) {
  cameraArea.addEventListener('click', () => {
    imageInput.capture = 'environment';
    imageInput.click();
  });
}

if (btnScan) {
  btnScan.addEventListener('click', () => {
    imageInput.capture = 'environment';
    imageInput.click();
  });
}

// "Gallery" → open file picker (no capture)
if (btnGallery) {
  btnGallery.addEventListener('click', () => {
    imageInput.removeAttribute('capture');
    imageInput.click();
  });
}

// When user picks an image
if (imageInput) {
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.imageFile = file;

    // Show preview
    const url = URL.createObjectURL(file);
    let img = cameraArea.querySelector('.preview-img');
    if (!img) {
      img = document.createElement('img');
      img.className = 'preview-img';
      cameraArea.appendChild(img);
    }
    img.src = url;
    cameraArea.classList.add('has-image');

    // ◆ BACKEND: send image to your API for ingredient detection
    scanImage(file);
  });
}

// ◆ BACKEND — Replace this with your actual API call
async function scanImage(file) {
  showLoading('Scanning ingredients...', 'AI is identifying your food items');

  /* ─────────────────────────────────────────────────────
     ◆ BACKEND: Replace the mock below with:

     const formData = new FormData();
     formData.append('image', file);

     const response = await fetch('/api/scan', {
       method: 'POST',
       body: formData,
     });
     const data = await response.json();

     Expected response shape:
     {
       "ingredients": [
         { "name": "Eggs",       "emoji": "🥚", "confidence": 0.95 },
         { "name": "Onion",      "emoji": "🧅", "confidence": 0.91 },
         { "name": "Tomato",     "emoji": "🍅", "confidence": 0.88 },
         { "name": "Garlic",     "emoji": "🧄", "confidence": 0.85 },
         { "name": "Bell Pepper","emoji": "🫑", "confidence": 0.72 },
         { "name": "Rice",       "emoji": "🍚", "confidence": 0.68 },
         { "name": "Tilapia",    "emoji": "🐟", "confidence": 0.61 }
       ],
       "overallConfidence": 0.87
     }

     Then call: handleScanResult(data);
     ───────────────────────────────────────────────────── */

  // MOCK — remove this when backend is ready
  await delay(1800);
  handleScanResult({
    ingredients: [
      { name: 'Eggs',        emoji: '🥚', confidence: 0.95 },
      { name: 'Onion',       emoji: '🧅', confidence: 0.91 },
      { name: 'Tomato',      emoji: '🍅', confidence: 0.88 },
      { name: 'Garlic',      emoji: '🧄', confidence: 0.85 },
      { name: 'Bell Pepper', emoji: '🫑', confidence: 0.72 },
      { name: 'Rice',        emoji: '🍚', confidence: 0.68 },
      { name: 'Tilapia',     emoji: '🐟', confidence: 0.61 },
    ],
    overallConfidence: 0.87
  });
}

function handleScanResult(data) {
  state.ingredients = data.ingredients;
  renderIngredients(data);
  hideLoading();
  showScreen('screen-detect');
}

// ─── Screen 2: Detected Ingredients ───────────────────────
function renderIngredients(data) {
  const grid = document.getElementById('ingredientGrid');
  if (!grid) return;
  grid.innerHTML = '';

  data.ingredients.forEach((item, i) => {
    const chip = document.createElement('div');
    chip.className = 'ingredient-chip';
    chip.style.animationDelay = `${i * 0.05}s`;
    chip.innerHTML = `
      <span class="emoji">${item.emoji}</span>
      ${item.name}
      <button class="remove-btn" data-index="${i}">✕</button>
    `;
    grid.appendChild(chip);
  });

  // Remove button handlers
  grid.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      state.ingredients.splice(idx, 1);
      renderIngredients({ ingredients: state.ingredients, overallConfidence: data.overallConfidence });
    });
  });

  // Update badges
  const badgeCount = document.getElementById('badgeCount');
  if (badgeCount) badgeCount.textContent = `✓ ${state.ingredients.length} items found`;

  const lowConf = state.ingredients.filter(i => i.confidence < 0.7).length;
  const badgeReview = document.getElementById('badgeReview');
  if (badgeReview) {
    if (lowConf > 0) {
      badgeReview.textContent = `⚠ ${lowConf} may need review`;
      badgeReview.style.display = '';
    } else {
      badgeReview.style.display = 'none';
    }
  }

  // Confidence bar
  const confidenceValue = document.getElementById('confidenceValue');
  const confidenceFill = document.getElementById('confidenceFill');
  const pct = Math.round(data.overallConfidence * 100);
  if (confidenceValue) confidenceValue.textContent = pct + '%';
  if (confidenceFill) confidenceFill.style.width = pct + '%';
}

// Add ingredient modal
const addModal   = document.getElementById('addModal');
const modalInput = document.getElementById('newIngredientInput');

const btnAddIngredient = document.getElementById('btnAddIngredient');
if (btnAddIngredient) {
  btnAddIngredient.addEventListener('click', () => {
    addModal.classList.add('show');
    modalInput.value = '';
    modalInput.focus();
  });
}

const modalCancel = document.getElementById('modalCancel');
if (modalCancel) {
  modalCancel.addEventListener('click', () => addModal.classList.remove('show'));
}

if (addModal) {
  addModal.addEventListener('click', (e) => { if (e.target === addModal) addModal.classList.remove('show'); });
}

const modalAdd = document.getElementById('modalAdd');
if (modalAdd) {
  modalAdd.addEventListener('click', () => {
    const name = modalInput.value.trim();
    if (!name) return;
    state.ingredients.push({ name, emoji: '🥘', confidence: 1.0 });
    renderIngredients({ ingredients: state.ingredients, overallConfidence: 1.0 });
    addModal.classList.remove('show');
  });
}

if (modalInput) {
  modalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('modalAdd').click();
  });
}

// Continue to prefs
const btnToPrefs = document.getElementById('btnToPrefs');
if (btnToPrefs) {
  btnToPrefs.addEventListener('click', () => {
    if (state.ingredients.length === 0) {
      alert('Please add at least one ingredient.');
      return;
    }
    showScreen('screen-prefs');
  });
}

// ─── Screen 3: Preferences ────────────────────────────────
// Chip toggle
document.querySelectorAll('.pref-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('selected');
    collectPreferences();
  });
});

// Budget slider
const budgetSlider = document.getElementById('budgetSlider');
if (budgetSlider) {
  budgetSlider.addEventListener('input', () => {
    const val = budgetSlider.value;
    const budgetValue = document.getElementById('budgetValue');
    if (budgetValue) budgetValue.textContent = '₱' + val;
    budgetSlider.style.setProperty('--val', ((val - 50) / 950 * 100) + '%');
    state.preferences.budget = parseInt(val);
  });
  // Init slider visual
  budgetSlider.style.setProperty('--val', '31.6%');
}

// Toggle switches
document.querySelectorAll('.toggle-switch').forEach(sw => {
  sw.addEventListener('click', () => {
    sw.classList.toggle('on');
    collectPreferences();
  });
});

function collectPreferences() {
  state.preferences.dietary = [...document.querySelectorAll('#dietaryGrid .pref-chip.selected')]
    .map(c => c.dataset.value);
  state.preferences.allergies = [...document.querySelectorAll('#allergyGrid .pref-chip.selected')]
    .map(c => c.dataset.value);

  const subToggle = document.querySelector('[data-key="suggestSubstitutes"]');
  if (subToggle) state.preferences.suggestSubstitutes = subToggle.classList.contains('on');

  const localToggle = document.querySelector('[data-key="prioritizeLocal"]');
  if (localToggle) state.preferences.prioritizeLocal = localToggle.classList.contains('on');
}

// Generate recipe
const btnGenerate = document.getElementById('btnGenerate');
if (btnGenerate) {
  btnGenerate.addEventListener('click', () => {
    collectPreferences();
    // ◆ BACKEND: send ingredients + preferences to your API
    generateRecipe();
  });
}

// ◆ BACKEND — Replace this with your actual API call
async function generateRecipe() {
  showLoading('Generating your recipe...', 'Analyzing ingredients & preferences');

  /* ─────────────────────────────────────────────────────
     ◆ BACKEND: Replace the mock below with:

     const response = await fetch('/api/generate', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         ingredients: state.ingredients.map(i => i.name),
         dietary: state.preferences.dietary,
         allergies: state.preferences.allergies,
         budget: state.preferences.budget,
         suggestSubstitutes: state.preferences.suggestSubstitutes,
         prioritizeLocal: state.preferences.prioritizeLocal,
       }),
     });
     const data = await response.json();

     Expected response shape:
     {
       "name": "Garlic Fried Rice with Tilapia",
       "emoji": "🍳",
       "time": "35 min",
       "servings": "2 servings",
       "difficulty": "Easy",
       "ingredients": [
         { "amount": "2 cups",  "name": "Leftover rice" },
         { "amount": "1 pc",    "name": "Tilapia, cleaned" },
         { "amount": "4 cloves","name": "Garlic, minced" },
         { "amount": "1 pc",    "name": "Onion, diced" },
         { "amount": "2 pcs",   "name": "Egg, beaten" },
         { "amount": "1 pc",    "name": "Tomato, chopped" },
         { "amount": "1 pc",    "name": "Bell pepper, sliced" }
       ],
       "steps": [
         "Season the tilapia with salt and pepper...",
         "In the same pan, sauté minced garlic...",
         ...
       ],
       "substitutes": [
         { "original": "Tilapia",     "replacement": "Bangus (Milkfish)", "reason": "cheaper, local" },
         { "original": "Bell Pepper",  "replacement": "Green Beans",      "reason": "more affordable" },
         { "original": "Eggs",         "replacement": "Tofu",             "reason": "for vegan option" }
       ],
       "nutrition": {
         "calories": 485,
         "carbs": 52,
         "protein": 28,
         "fat": 18,
         "fiber": 3.2,
         "sugar": 4.1,
         "sodium": 620,
         "cholesterol": 185,
         "potassium": 340,
         "vitaminA": "15% DV",
         "vitaminC": "42% DV",
         "iron": "12% DV"
       }
     }

     Then call: handleRecipeResult(data);
     ───────────────────────────────────────────────────── */

  // MOCK — remove this when backend is ready
  await delay(2200);
  handleRecipeResult({
    name: 'Garlic Fried Rice with Tilapia',
    emoji: '🍳',
    time: '35 min',
    servings: '2 servings',
    difficulty: 'Easy',
    ingredients: [
      { amount: '2 cups',   name: 'Leftover rice' },
      { amount: '1 pc',     name: 'Tilapia, cleaned' },
      { amount: '4 cloves', name: 'Garlic, minced' },
      { amount: '1 pc',     name: 'Onion, diced' },
      { amount: '2 pcs',    name: 'Egg, beaten' },
      { amount: '1 pc',     name: 'Tomato, chopped' },
      { amount: '1 pc',     name: 'Bell pepper, sliced' },
    ],
    steps: [
      'Season the tilapia with salt and pepper. Pan-fry in oil until golden and crispy on both sides. Set aside and flake into pieces.',
      'In the same pan, sauté minced garlic until fragrant and golden. Add diced onion and cook until translucent.',
      'Add chopped tomato and bell pepper. Cook for 2 minutes until slightly softened.',
      'Push vegetables to the side, pour beaten eggs into the pan, and scramble until just set.',
      'Add the leftover rice and toss everything together. Stir-fry on high heat for 3–4 minutes until rice is heated through.',
      'Fold in the flaked tilapia. Season with soy sauce and salt to taste. Serve hot.',
    ],
    substitutes: [
      { original: '🐟 Tilapia',     replacement: '🐟 Bangus (Milkfish)', reason: 'cheaper, local' },
      { original: '🫑 Bell Pepper',  replacement: '🥬 Green Beans',       reason: 'more affordable' },
      { original: '🥚 Eggs',         replacement: '🫘 Tofu',              reason: 'for vegan option' },
    ],
    nutrition: {
      calories: 485, carbs: 52, protein: 28, fat: 18,
      fiber: 3.2, sugar: 4.1, sodium: 620, cholesterol: 185,
      potassium: 340, vitaminA: '15% DV', vitaminC: '42% DV', iron: '12% DV',
    }
  });
}

function handleRecipeResult(data) {
  state.recipe = data;
  state.nutrition = data.nutrition;
  renderMeal(data);
  hideLoading();
  showScreen('screen-meal');
}

// ─── Screen 4: Meal Result ────────────────────────────────
function renderMeal(recipe) {
  // Hero
  const mealEmoji = document.getElementById('mealEmoji');
  const mealName = document.getElementById('mealName');
  const mealTime = document.getElementById('mealTime');
  const mealServings = document.getElementById('mealServings');
  const mealDifficulty = document.getElementById('mealDifficulty');

  if (mealEmoji) mealEmoji.textContent = recipe.emoji;
  if (mealName) mealName.textContent = recipe.name;
  if (mealTime) mealTime.textContent = recipe.time;
  if (mealServings) mealServings.textContent = recipe.servings;
  if (mealDifficulty) mealDifficulty.textContent = recipe.difficulty;

  // Ingredients
  const ingList = document.getElementById('mealIngredients');
  if (ingList) {
    ingList.innerHTML = recipe.ingredients.map(ing => `
      <li>
        <div class="check-circle" onclick="this.classList.toggle('checked')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="amount">${ing.amount}</span> ${ing.name}
      </li>
    `).join('');
  }

  // Steps
  const stepList = document.getElementById('mealSteps');
  if (stepList) {
    stepList.innerHTML = recipe.steps.map((step, i) => `
      <li class="step-item">
        <div class="step-num">${i + 1}</div>
        <p>${step}</p>
      </li>
    `).join('');
  }

  // Substitutes
  const subsDiv = document.getElementById('tab-subs');
  if (subsDiv) {
    if (recipe.substitutes && recipe.substitutes.length > 0) {
      subsDiv.innerHTML = recipe.substitutes.map(s => `
        <div class="substitute-card">
          <span>${s.original}</span>
          <span class="arrow">→</span>
          <span>${s.replacement} — ${s.reason}</span>
        </div>
      `).join('');
    } else {
      subsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;padding:8px 0;">No substitutes suggested for this recipe.</p>';
    }
  }
}

// Tab switching
function switchMealTab(btn, tabId) {
  document.querySelectorAll('.meal-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.meal-content > div').forEach(d => d.style.display = 'none');
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.style.display = 'block';
}

// Save recipe
const btnSaveRecipe = document.getElementById('btnSaveRecipe');
if (btnSaveRecipe) {
  btnSaveRecipe.addEventListener('click', () => {
    // ◆ BACKEND: call your save/bookmark API
    // await fetch('/api/recipes/save', { method: 'POST', body: JSON.stringify({ recipeId: state.recipe.id }) });
    alert('Recipe saved! (hook up to backend)');
  });
}

// Go to nutrition
const btnNutrition = document.getElementById('btnNutrition');
if (btnNutrition) {
  btnNutrition.addEventListener('click', () => {
    renderNutrition(state.nutrition, state.recipe);
    showScreen('screen-nutrition');
  });
}

// ─── Screen 5: Nutrition Info ──────────────────────────────
function renderNutrition(nutrition, recipe) {
  const nutritionMealName = document.getElementById('nutritionMealName');
  const nutritionServings = document.getElementById('nutritionServings');
  if (nutritionMealName) nutritionMealName.textContent = recipe.name;
  if (nutritionServings) nutritionServings.textContent = recipe.servings + ' total';

  // Calorie ring animation
  const maxCal = 800;
  const pct = Math.min(nutrition.calories / maxCal, 1);
  const circumference = 440;
  const offset = circumference - (circumference * pct);
  const progress = document.getElementById('calorieProgress');
  const calorieNum = document.getElementById('calorieNum');

  if (progress) {
    progress.style.strokeDashoffset = circumference; // reset
    requestAnimationFrame(() => {
      progress.style.strokeDashoffset = offset;
    });
  }
  if (calorieNum) calorieNum.textContent = nutrition.calories;

  // Macros
  const carbVal = document.getElementById('carbVal');
  const proteinVal = document.getElementById('proteinVal');
  const fatVal = document.getElementById('fatVal');
  if (carbVal) carbVal.textContent = nutrition.carbs;
  if (proteinVal) proteinVal.textContent = nutrition.protein;
  if (fatVal) fatVal.textContent = nutrition.fat;

  const total = nutrition.carbs + nutrition.protein + nutrition.fat;
  const cPct = Math.round((nutrition.carbs / total) * 100);
  const pPct = Math.round((nutrition.protein / total) * 100);
  const fPct = 100 - cPct - pPct;

  const barCarbs = document.getElementById('barCarbs');
  const barProtein = document.getElementById('barProtein');
  const barFat = document.getElementById('barFat');
  if (barCarbs) barCarbs.style.width = cPct + '%';
  if (barProtein) barProtein.style.width = pPct + '%';
  if (barFat) barFat.style.width = fPct + '%';

  const pctCarbs = document.getElementById('pctCarbs');
  const pctProtein = document.getElementById('pctProtein');
  const pctFat = document.getElementById('pctFat');
  if (pctCarbs) pctCarbs.textContent = cPct;
  if (pctProtein) pctProtein.textContent = pPct;
  if (pctFat) pctFat.textContent = fPct;

  // Detail rows
  const details = [
    ['Fiber', nutrition.fiber + ' g'],
    ['Sugar', nutrition.sugar + ' g'],
    ['Sodium', nutrition.sodium + ' mg'],
    ['Cholesterol', nutrition.cholesterol + ' mg'],
    ['Potassium', nutrition.potassium + ' mg'],
    ['Vitamin A', nutrition.vitaminA],
    ['Vitamin C', nutrition.vitaminC],
    ['Iron', nutrition.iron],
  ];
  const detailRows = document.getElementById('detailRows');
  if (detailRows) {
    detailRows.innerHTML = details.map(([label, val]) => `
      <div class="detail-row">
        <span class="detail-label">${label}</span>
        <span class="detail-value">${val}</span>
      </div>
    `).join('');
  }
}

// Share
const btnShare = document.getElementById('btnShare');
if (btnShare) {
  btnShare.addEventListener('click', () => {
    // ◆ BACKEND: implement share logic (native share API or your own)
    if (navigator.share) {
      navigator.share({
        title: state.recipe.name,
        text: `Check out this recipe: ${state.recipe.name} (${state.nutrition.calories} cal)`,
      }).catch(() => {});
    } else {
      alert('Share not supported on this device (hook up to backend)');
    }
  });
}

// ─── Loading Helpers ───────────────────────────────────────
function showLoading(text, sub) {
  const loadingText = document.getElementById('loadingText');
  const loadingSub = document.getElementById('loadingSub');
  const loadingOverlay = document.getElementById('loadingOverlay');

  if (loadingText) loadingText.textContent = text;
  if (loadingSub) loadingSub.textContent = sub;
  if (loadingOverlay) loadingOverlay.classList.add('show');
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) loadingOverlay.classList.remove('show');
}

// ─── Utilities ─────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
