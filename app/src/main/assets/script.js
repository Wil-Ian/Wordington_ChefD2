
// App State
const state = {
  imageFile: null,
  ingredients: []
};

let editingIndex = -1;

const SCREENS = ['screen-scan','screen-detect','screen-prefs','screen-meal','screen-nutrition'];

// Navigation
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  const idx = SCREENS.indexOf(id);
  document.querySelectorAll('.nav-dot').forEach((d,i) => d.classList.toggle('active', i === idx));
}

// Nav dots click
document.querySelectorAll('.nav-dot').forEach(dot => {
  dot.addEventListener('click', () => showScreen(dot.dataset.screen));
});

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

async function scanImage(file) {
  // Mock scanning
  setTimeout(() => {
    handleScanResult({
      ingredients: [
        { name: 'Eggs', emoji: '🥚'},
      ]
    });
  }, 1500);
}

function renderIngredients(data) {
  const grid = document.getElementById('ingredientGrid');
  if (!grid) return;
  grid.innerHTML = '';

  state.ingredients.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'ingredient-item';
    row.style.animationDelay = `${i * 0.05}s`;
    row.innerHTML = `
      <span class="emoji">${item.emoji || '🥘'}</span>
      <span class="item-content">${item.name}</span>
      <div class="item-actions">
        <button class="action-btn edit-btn" onclick="editIngredient(${i})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn delete-btn" onclick="deleteIngredient(${i})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;
    grid.appendChild(row);
  });

  // Update badges
  const badgeCount = document.getElementById('badgeCount');
  if (badgeCount) badgeCount.textContent = `✓ ${state.ingredients.length} items found`;
}

// Global functions for list actions
window.editIngredient = function(index) {
  editingIndex = index;
  const item = state.ingredients[index];
  const addModal = document.getElementById('addModal');
  const modalInput = document.getElementById('newIngredientInput');
  const modalTitle = addModal.querySelector('h3');
  const modalAddBtn = document.getElementById('modalAdd');

  if (modalTitle) modalTitle.textContent = 'Edit Ingredient';
  if (modalAddBtn) modalAddBtn.textContent = 'Save';
  if (modalInput) {
    modalInput.value = item.name;
    addModal.classList.add('show');
    modalInput.focus();
  }
};

window.deleteIngredient = function(index) {
  state.ingredients.splice(index, 1);
  renderIngredients({ ingredients: state.ingredients });
};

function handleScanResult(data) {
  state.ingredients = data.ingredients;
  renderIngredients(data);
  if (typeof hideLoading === 'function') hideLoading();
  showScreen('screen-detect');
}

function hideLoading() {
    // Placeholder if no loading overlay exists yet
    console.log('Hiding loading...');
}

// Add ingredient modal
const addModal   = document.getElementById('addModal');
const modalInput = document.getElementById('newIngredientInput');

const btnAddIngredient = document.getElementById('btnAddIngredient');
if (btnAddIngredient) {
  btnAddIngredient.addEventListener('click', () => {
    editingIndex = -1;
    const modalTitle = addModal.querySelector('h3');
    const modalAddBtn = document.getElementById('modalAdd');
    if (modalTitle) modalTitle.textContent = 'Add Ingredient';
    if (modalAddBtn) modalAddBtn.textContent = 'Add';

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

    if (editingIndex > -1) {
      state.ingredients[editingIndex].name = name;
    } else {
      state.ingredients.push({ name, emoji: '🥘', confidence: 1.0 });
    }

    renderIngredients({ ingredients: state.ingredients, overallConfidence: 1.0 });
    addModal.classList.remove('show');
    editingIndex = -1;
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


// Screen 3

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

const btnGenerate = document.getElementById('btnGenerate');
if (btnGenerate) {
  btnGenerate.addEventListener('click', () => {
    showScreen('screen-meal');
  });
}

// Screen 4
// Tab switching
function switchMealTab(btn, tabId) {
  document.querySelectorAll('.meal-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.meal-content > div').forEach(d => d.style.display = 'none');
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.style.display = 'block';
}

// Go to nutrition
const btnNutrition = document.getElementById('btnNutrition');
if (btnNutrition) {
  btnNutrition.addEventListener('click', () => {
    showScreen('screen-nutrition');
  });
}