// ===============================================================
// ** まおりゅうダメージ計算機 (v3.2.1) **
// ===============================================================

// ===============================================================
// ** 1. グローバル変数 & 定数, Firebase 初期化 **
// ===============================================================

// --- グローバル変数 ---
let currentUser = null;
let db, auth, storage;
let unsubscribeCalculatorListener = null;
let activeComparisonBuffs = [];
let isComparisonModeActive = false;
let lastTotalResult = null;
let lastComparisonResult = null;
let currentPresetSlot = null;
let globalDataPresets = {};

const MAX_DATA_SLOTS = 10;
const THEME_KEY = "maoryuTheme";
const AUTOSAVE_KEY_LOCAL = "maoryuAutoSave_local";
const SKILL_PRESET_KEY = "maoryuSkillPresets_v2_local";
let updateCurrentPage = 1;
const updatesPerPage = 3;

// --- Firebase 初期化 ---
const firebaseConfig = {
  apiKey: "AIzaSyBYpP9_H5D9YpGA0kIDZbMlRplU7qmRX2Y",
  authDomain: "damage-login-project.firebaseapp.com",
  projectId: "damage-login-project",
  storageBucket: "damage-login-project.firebasestorage.app",
  messagingSenderId: "226418977169",
  appId: "1:226418977169:web:de3197437b1e5cb5ed1230",
  measurementId: "G-1XQ5ENVVSE"
};

try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  storage = firebase.storage();
} catch (e) {
  console.error("Firebaseの初期化に失敗しました。設定情報を確認してください。", e);
  showToast("Firebaseの初期化に失敗しました。", "error");
}

// --- 共通ヘルパー関数 ---
const v = (id) => parseFloat(document.getElementById(id)?.value) || 0;
const c = (id) => document.getElementById(id)?.checked;
const debounce = (func, wait) => {
  let timeout;
  const debounced = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
  debounced.flush = () => {
    clearTimeout(timeout);
    func.apply(this);
  };
  return debounced;
};

// --- 定数 (バフリスト & プリセット構造) ---
const buffMasterList = [{ category: "状態異常", id: "is-dragon-aura", label: "竜気状態" }, { category: "状態異常", id: "is-charmed", label: "魅了/束縛" }, { category: "状態異常", id: "is-frostbite", label: "凍傷" }, { category: "状態異常", id: "is-dominated", label: "支配" }, { category: "状態異常", id: "is-tremor", label: "戦慄" }, { category: "基礎ステータス", id: "base-attack-power", label: "基礎攻撃力" }, { category: "基礎ステータス", id: "base-defense-power", label: "自キャラ基礎防御力" }, { category: "基礎ステータス", id: "enemy-defense-power", label: "敵の基礎防御力" }, { category: "基礎ステータス", id: "support-attack-power", label: "基礎支援攻撃力" }, { category: "基礎ステータス", id: "ultimate-magnification", label: "奥義倍率(%)" }, { category: "基礎ステータス", id: "affinity-up-buff", label: "相性強化" }, { category: "攻撃系バフ", id: "attack-buff", label: "攻撃バフ(スキル)" }, { category: "攻撃系バフ", id: "attack-buff-trait", label: "攻撃バフ(特性)" }, { category: "攻撃系バフ", id: "attack-buff-cumulative", label: "攻撃バフ(累積)" }, { category: "攻撃系バフ", id: "attack-buff-faction", label: "攻撃バフ(勢力)" }, { category: "攻撃系バフ", id: "attack-buff-faction-support", label: "攻撃バフ(勢力支援)" }, { category: "攻撃系バフ", id: "attack-buff-divine-lead", label: "攻撃バフ(加護の導き)" }, { category: "攻撃系バフ", id: "attack-buff-divine-lead-support", label: "攻撃バフ(加護の導き支援)" }, { category: "攻撃系バフ", id: "attack-buff-divine-trait", label: "攻撃バフ(加護特性)" }, { category: "攻撃系バフ", id: "attack-buff-divine-trait-support", label: "攻撃バフ(加護特性支援)" }, { category: "属性・物/魔バフ", id: "all-attr-buff", label: "全属性バフ" }, { category: "属性・物/魔バフ", id: "attr-buff", label: "属性バフ" }, { category: "属性・物/魔バフ", id: "attr-buff-cumulative", label: "属性バフ(累積)" }, { category: "属性・物/魔バフ", id: "attr-buff-divine-lead", label: "属性バフ(加護の導き)" }, { category: "属性・物/魔バフ", id: "attr-buff-divine-lead-support", label: "属性バフ(加護の導き支援)" }, { category: "属性・物/魔バフ", id: "pm-buff", label: "物/魔バフ" }, { category: "属性・物/魔バフ", id: "pm-buff-cumulative", label: "物/魔バフ(累積)" }, { category: "属性・物/魔バフ", id: "pm-buff-divine-lead", label: "物/魔バフ(加護の導き)" }, { category: "属性・物/魔バフ", id: "pm-buff-divine-lead-support", label: "物/魔バフ(加護の導き支援)" }, { category: "属性・物/魔バフ", id: "pm-buff-divine-trait", label: "物/魔バフ(加護特性)" }, { category: "属性・物/魔バフ", id: "pm-buff-divine-trait-support", label: "物/魔バフ(加護特性支援)" }, { category: "その他バフ", id: "aoe-attack-buff", label: "全体攻撃バフ" }, { category: "その他バフ", id: "aoe-attack-buff-cumulative", label: "全体攻撃バフ(累積)" }, { category: "その他バフ", id: "ultimate-buff", label: "奥義バフ" }, { category: "その他バフ", id: "ultimate-buff-cumulative", label: "奥義バフ(累積)" }, { category: "その他バフ", id: "extreme-ultimate-buff", label: "極奥義バフ" }, { category: "その他バフ", id: "soul-buff", label: "魔創魂バフ" }, { category: "その他バフ", id: "charm-special-buff", label: "魅了特攻" }, { category: "その他バフ", id: "stun-special-buff", label: "気絶特攻" }, { category: "その他バフ", id: "weak-point-buff", label: "弱点特攻" }, { category: "その他バフ", id: "weak-point-infinite-buff", label: "弱点特攻(無限)" }, { category: "ダメージ威力系", id: "pm-damage-up", label: "物魔ダメージ威力UP" }, { category: "ダメージ威力系", id: "attr-damage-up", label: "属性ダメージ威力UP" }, { category: "ダメージ威力系", id: "pm-damage-resist-debuff", label: "物/魔ダメージ耐性ダウン" }, { category: "ダメージ威力系", id: "attr-damage-resist-debuff", label: "属性ダメージ耐性ダウン" }, { category: "敵へのデバフ", id: "defense-debuff", label: "防御力デバフ" }, { category: "敵へのデバフ", id: "defense-debuff-divine-trait", label: "防御力デバフ(加護)" }, { category: "敵へのデバフ", id: "enemy-all-attr-resist-buff", label: "全属性耐性バフ" }, { category: "敵へのデバフ", id: "enemy-all-attr-resist-debuff", label: "全属性耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-attr-resist-buff", label: "属性耐性バフ" }, { category: "敵へのデバフ", id: "attr-resist-debuff", label: "属性耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-pm-resist-buff", label: "物/魔耐性バフ" }, { category: "敵へのデバフ", id: "pm-resist-debuff", label: "物/魔耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-crit-resist-buff", label: "会心耐性バフ" }, { category: "敵へのデバフ", id: "crit-resist-debuff", label: "会心耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-pierce-resist-buff", label: "貫通耐性バフ" }, { category: "敵へのデバフ", id: "pierce-resist-debuff", label: "貫通耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-synergy-resist-buff", label: "協心耐性バフ" }, { category: "敵へのデバフ", id: "synergy-resist-debuff", label: "協心耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-kensan-resist-buff", label: "堅閃耐性バフ" }, { category: "敵へのデバフ", id: "kensan-resist-debuff", label: "堅閃耐性デバフ" }, { category: "敵へのデバフ", id: "single-target-resist-debuff", label: "単体攻撃耐性デバフ" }, { category: "敵へのデバフ", id: "aoe-resist-debuff", label: "全体攻撃耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-ultimate-resist-buff", label: "奥義耐性バフ" }, { category: "敵へのデバフ", id: "ultimate-resist-debuff", label: "奥義耐性デバフ" }, { category: "敵へのデバフ", id: "weak-point-resist-debuff", label: "弱点耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-weak-point-resist-buff", label: "弱点耐性バフ" }, { category: "会心", id: "crit-buff", label: "会心力バフ" }, { category: "会心", id: "crit-ex-talent", label: "会心力(EX才能)" }, { category: "会心", id: "crit-resist-debuff-trait", label: "会心耐性デバフ(特性)" }, { category: "貫通", id: "pierce-buff", label: "貫通力バフ" }, { category: "貫通", id: "pierce-ex-talent", label: "貫通力(EX才能)" }, { category: "貫通", id: "pierce-resist-debuff-trait", label: "貫通耐性デバフ(特性)" },];
const skillPresetStructure = [{ category: "状態異常", type: "state", id: "is-charmed", label: "魅了/束縛" }, { category: "状態異常", type: "state", id: "is-frostbite", label: "凍傷" }, { category: "状態異常", type: "state", id: "is-dominated", label: "支配" }, { category: "状態異常", type: "state", id: "is-tremor", label: "戦慄" }, { category: "状態異常", type: "state", id: "is-dragon-aura", label: "竜気状態" }, { category: "バフ", type: "text", id: "attack-buff", label: "攻撃バフ" }, { category: "バフ", type: "text", id: "all-attr-buff", label: "全属性バフ" }, { category: "バフ", type: "text", id: "attr-buff", label: "属性バフ" }, { category: "バフ", type: "text", id: "pm-buff", label: "物魔バフ" }, { category: "バフ", type: "text", id: "aoe-attack-buff", label: "全体攻撃バフ" }, { category: "バフ", type: "text", id: "ultimate-buff", label: "奥義バフ" }, { category: "バフ", type: "text", id: "extreme-ultimate-buff", label: "極奥義バフ" }, { category: "バフ", type: "text", id: "pm-damage-up", label: "物魔ダメージ威力UP" }, { category: "バフ", type: "text", id: "attr-damage-up", label: "属性ダメージ威力UP" }, { category: "バフ", type: "text", id: "pm-damage-resist-debuff", label: "物/魔ダメージ耐性ダウン" }, { category: "バフ", type: "text", id: "attr-damage-resist-debuff", label: "属性ダメージ耐性ダウン" }, { category: "バフ", type: "text", id: "soul-buff", label: "魔創魂バフ" }, { category: "バフ", type: "text", id: "charm-special-buff", label: "魅了特攻" }, { category: "バフ", type: "text", id: "stun-special-buff", label: "気絶特攻" }, { category: "バフ", type: "text", id: "weak-point-buff", label: "弱点特攻" }, { category: "バフ", type: "text", id: "defense-buff", label: "防御力バフ" }, { category: "バフ", type: "text", id: "crit-buff", label: "会心力バフ" }, { category: "バフ", type: "text", id: "pierce-buff", label: "貫通力バフ" }, { category: "バフ", type: "text", id: "synergy-buff", label: "協心力バフ" }, { category: "バフ", type: "text", id: "kensan-buff", label: "堅閃力バフ" }, { category: "デバフ", type: "text", id: "defense-debuff", label: "[敵]防御力デバフ" }, { category: "デバフ", type: "text", id: "enemy-all-attr-resist-buff", label: "[敵]全属性耐性バフ" }, { category: "デバフ", type: "text", id: "enemy-all-attr-resist-debuff", label: "[敵]全属性耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-attr-resist-buff", label: "[敵]属性耐性バフ" }, { category: "デバフ", type: "text", id: "attr-resist-debuff", label: "[敵]属性耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-pm-resist-buff", label: "[敵]物/魔耐性バフ" }, { category: "デバフ", type: "text", id: "pm-resist-debuff", label: "[敵]物/魔耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-weak-point-resist-buff", label: "[敵]弱点耐性バフ" }, { category: "デバフ", type: "text", id: "weak-point-resist-debuff", label: "[敵]弱点耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-ultimate-resist-buff", label: "[敵]奥義耐性バフ" }, { category: "デバフ", type: "text", id: "ultimate-resist-debuff", label: "[敵]奥義耐性デバフ" }, { category: "デバフ", type: "text", id: "single-target-resist-debuff", label: "[敵]単体攻撃耐性デバフ" }, { category: "デバフ", type: "text", id: "aoe-resist-debuff", label: "[敵]全体攻撃耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-crit-resist-buff", label: "[敵]会心耐性バフ" }, { category: "デバフ", type: "text", id: "crit-resist-debuff", label: "[敵]会心耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-pierce-resist-buff", label: "[敵]貫通耐性バフ" }, { category: "デバフ", type: "text", id: "pierce-resist-debuff", label: "[敵]貫通耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-synergy-resist-buff", label: "[敵]協心耐性バフ" }, { category: "デバフ", type: "text", id: "synergy-resist-debuff", label: "[敵]協心耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-kensan-resist-buff", label: "[敵]堅閃耐性バフ" }, { category: "デバフ", type: "text", id: "kensan-resist-debuff", label: "[敵]堅閃耐性デバフ" },];


// ===============================================================
// ** 2. 認証 (Authentication) & UI制御 **
// ===============================================================
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((error) => {
    console.error("Googleログインエラー:", error);
    showToast("Googleログインに失敗しました。", "error");
  });
}

function signOutUser() {
  if (confirm("ログアウトしますか？")) {
    auth.signOut().catch((error) => {
      console.error("ログアウトエラー:", error);
      showToast("ログアウトに失敗しました。", "error");
    });
  }
}

function updateUiForLoggedInUser(user) {
  $('#user-avatar').attr('src', user.photoURL || 'images/default-avatar.png');
  $('#user-profile').show();
  $('#login-button').hide();
  $('#login-prompt').hide();
}

function updateUiForLoggedOutUser() {
  $('#user-profile').hide();
  $('#login-button').show();
  $('#login-prompt').show();
}

// ===============================================================
// ** 2.5 UIヘルパー (Toast通知) **
// ===============================================================
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  // Animate out and remove
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}


// ===============================================================
// ** 3. データ処理 (Firestore & LocalStorage) **
// ===============================================================
async function loadAllDataFromFirestore() {
  if (!currentUser) return;
  const userRef = db.collection('users').doc(currentUser.uid);
  try {
    const dataPresetsSnap = await userRef.collection('dataPresets').get();
    globalDataPresets = {};
    dataPresetsSnap.forEach(doc => { globalDataPresets[doc.id] = doc.data(); });
    renderDataPresetButtons(globalDataPresets);

    const skillPresetsSnap = await userRef.collection('skillPresets').orderBy('order').get();
    const skillPresets = [];
    skillPresetsSnap.forEach(doc => { skillPresets.push({ id: doc.id, ...doc.data() }); });
    renderSkillPresetEditor(skillPresets);
    renderSkillPresetActivator(skillPresets);

    listenToCalculatorState();
  } catch (e) {
    console.error("Firestoreからのデータ読み込みに失敗:", e);
    showToast("クラウドからのデータ読み込みに失敗しました。", "error");
  }
}

function listenToCalculatorState() {
  if (!currentUser) return;
  if (unsubscribeCalculatorListener) unsubscribeCalculatorListener();
  unsubscribeCalculatorListener = db.collection('users').doc(currentUser.uid).collection('calculatorState').doc('live')
    .onSnapshot((doc) => {
      if (doc.exists) {
        loadInputsFromDataObject(doc.data());
        calculateDamage();
      }
    }, (error) => {
      console.error("Firestoreの監視に失敗: ", error);
      showToast("データの同期に失敗しました。", "error");
    });
}

const saveInputsToFirestore = debounce(() => {
  if (!currentUser) return;
  db.collection('users').doc(currentUser.uid).collection('calculatorState').doc('live').set(getInputsAsDataObject())
    .catch(e => {
      console.error("Firestoreへの入力値保存失敗:", e);
      showToast("自動保存に失敗しました。", "error");
    });
}, 1000);

function getInputsAsDataObject() {
  const data = {};
  document.querySelectorAll(".calc-input").forEach((input) => {
    if (input.id) { data[input.id] = (input.type === "checkbox" || input.type === "radio") ? input.checked : input.value; }
  });
  return data;
}

function loadInputsFromDataObject(data) {
  if (!data) return;
  Object.entries(data).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) {
      if (input.type === "checkbox" || input.type === "radio") { input.checked = value; }
      else { input.value = value; }
      if (input.tagName.toLowerCase() === "select") {
        const wrapper = input.closest(".custom-select-wrapper");
        if (wrapper) {
          const triggerSpan = wrapper.querySelector(".custom-select-trigger span");
          const selectedOption = wrapper.querySelector(`.custom-option[data-value="${value}"]`);
          if (triggerSpan && selectedOption) {
            triggerSpan.textContent = selectedOption.textContent;
            wrapper.querySelectorAll(".custom-option").forEach(opt => opt.classList.remove("selected"));
            selectedOption.classList.add("selected");
          }
        }
      }
    }
  });
  $('.ef').each(function () { $(this).toggleClass('has-value', !!$(this).val()); });
}

function saveInputsToLocalStorage() {
  if (currentUser) return;
  localStorage.setItem(AUTOSAVE_KEY_LOCAL, JSON.stringify(getInputsAsDataObject()));
}

function loadInputsFromLocalStorage() {
  try {
    const savedData = localStorage.getItem(AUTOSAVE_KEY_LOCAL);
    if (savedData) loadInputsFromDataObject(JSON.parse(savedData));
  } catch (e) {
    localStorage.removeItem(AUTOSAVE_KEY_LOCAL);
  }
}

function getStoredJSON(key, defaultValue = []) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    localStorage.removeItem(key); return defaultValue;
  }
}

function loadFromUrl() {
  if (window.location.hash.startsWith('#data=')) {
    try {
      const jsonString = decodeURIComponent(atob(window.location.hash.substring(6)));
      loadInputsFromDataObject(JSON.parse(jsonString));
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
      showToast("URLからデータを読み込みました。", "info");
    } catch (e) {
      console.error('URLからのデータ読み込みに失敗:', e);
      showToast("URLデータの読み込みに失敗しました。", "error");
    }
  }
}

function clearAllInputs() {
  document.querySelectorAll('.calc-input').forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') { input.checked = false; }
    else if (input.tagName.toLowerCase() === 'select') {
      input.selectedIndex = 0;
      const wrapper = input.closest('.custom-select-wrapper');
      if (wrapper) {
        const triggerSpan = wrapper.querySelector('.custom-select-trigger span');
        const firstOption = wrapper.querySelector('.custom-option');
        if (triggerSpan && firstOption) {
          triggerSpan.textContent = firstOption.textContent;
          wrapper.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
          firstOption.classList.add('selected');
        }
      }
    } else { input.value = ''; }
  });
  $('.ef').removeClass('has-value');
}

function exportPresets() {
  if (currentUser) {
    showToast("ログイン中はエクスポート機能を利用できません。", "info");
    return;
  }
  let filename = prompt("書き出すファイル名:", "maoryu-backup.json");
  if (!filename) return;
  if (!filename.toLowerCase().endsWith('.json')) filename += '.json';
  const exportData = {
    version: "3.0", createdAt: new Date().toISOString(), currentCalculatorState: getInputsAsDataObject(),
    skillPresets: getStoredJSON(SKILL_PRESET_KEY), dataPresets: {}
  };
  for (let i = 1; i <= MAX_DATA_SLOTS; i++) {
    const data = getStoredJSON(`maoryuDataPreset_local_${i}`, null);
    if (data) exportData.dataPresets[i] = data;
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function importPresets(event) {
  if (currentUser) {
    showToast("ログイン中はインポート機能を利用できません。", "info");
    return;
  }
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (!importedData.currentCalculatorState) throw new Error('無効なファイル形式です。');
      if (confirm('現在の全ての状態を上書きしてインポートしますか？')) {
        if (Array.isArray(importedData.skillPresets)) localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(importedData.skillPresets));
        Object.keys(localStorage).forEach(key => { if (key.startsWith('maoryuDataPreset_local_')) localStorage.removeItem(key); });
        if (importedData.dataPresets) {
          for (const i in importedData.dataPresets) localStorage.setItem(`maoryuDataPreset_local_${i}`, JSON.stringify(importedData.dataPresets[i]));
        }
        loadInputsFromDataObject(importedData.currentCalculatorState);
        showToast("データのインポートが完了しました。", "success");
        renderSkillPresetEditor(); renderSkillPresetActivator(); renderDataPresetButtons(); calculateDamage();
      }
    } catch (error) {
      showToast(`インポートに失敗しました: ${error.message}`, "error");
    } finally {
      event.target.value = null;
    }
  };
  reader.readAsText(file);
}

function generateShareableUrl() {
  try {
    const url = `${window.location.origin}${window.location.pathname}#data=${btoa(encodeURIComponent(JSON.stringify(getInputsAsDataObject())))}`;
    navigator.clipboard.writeText(url).then(
      () => showToast('共有URLをクリップボードにコピーしました。', "success"),
      () => prompt('URLのコピーに失敗しました。手動でコピーしてください:', url)
    );
  } catch (e) {
    showToast('URLの生成に失敗しました。', "error");
  }
}


// ===============================================================
// ** 4. プリセット & 図鑑 機能 **
// ===============================================================
function openSavePresetModal(slot) {
  currentPresetSlot = slot;
  const existingPreset = getPresetDataBySlot(slot);
  const input = $('#preset-name-input');
  input.val(existingPreset?.name || `データセット ${slot}`);
  input.toggleClass('has-value', !!input.val());
  $('#save-preset-modal').fadeIn(200);
}

async function saveDataPreset() {
  if (!currentPresetSlot) return;
  const name = $('#preset-name-input').val().trim();
  if (!name) {
    showToast("プリセット名を入力してください。", "error");
    return;
  }
  const presetData = { name, data: getInputsAsDataObject(), createdAt: new Date() };
  if (currentUser) {
    try {
      await db.collection('users').doc(currentUser.uid).collection('dataPresets').doc(`slot${currentPresetSlot}`).set(presetData);
      showToast(`「${name}」をクラウドに保存しました。`, "success");
      await loadAllDataFromFirestore();
    } catch (e) {
      showToast("クラウドへの保存に失敗しました。", "error");
    }
    $('#save-preset-modal').fadeOut(200);
  } else {
    localStorage.setItem(`maoryuDataPreset_local_${currentPresetSlot}`, JSON.stringify(presetData));
    renderDataPresetButtons();
    showToast(`「${name}」をこのブラウザに保存しました。`, "success");
    $('#save-preset-modal').fadeOut(200);
  }
}

function getPresetDataBySlot(slot) {
  if (currentUser) {
    return globalDataPresets[`slot${slot}`] || null;
  } else {
    const localData = localStorage.getItem(`maoryuDataPreset_local_${slot}`);
    return localData ? JSON.parse(localData) : null;
  }
}

function loadDataPreset(slot) {
  const preset = getPresetDataBySlot(slot);
  if (!preset) {
    showToast('プリセットが見つかりません。', "error");
    return;
  }
  loadInputsFromDataObject(preset.data);
  calculateDamage();
  showToast(`「${preset.name}」を読み込みました。`, "info");
}

async function deleteDataPreset(slot) {
  const presetData = getPresetDataBySlot(slot);
  if (!presetData || !confirm(`データプリセット「${presetData.name}」を本当に削除しますか？`)) return;
  if (currentUser) {
    try {
      await db.collection('users').doc(currentUser.uid).collection('dataPresets').doc(`slot${slot}`).delete();
      showToast('クラウドからプリセットを削除しました。', "success");
      await loadAllDataFromFirestore();
    } catch (e) {
      showToast("クラウドからの削除に失敗しました。", "error");
    }
  } else {
    localStorage.removeItem(`maoryuDataPreset_local_${slot}`);
    showToast('このブラウザからプリセットを削除しました。', "success");
    renderDataPresetButtons();
  }
}

async function saveSkillPreset(presetId, isNew = false) {
  const sourceId = isNew ? 'new' : presetId;
  const nameInput = document.getElementById(`skill-preset-${sourceId}-name`);
  if (!nameInput) {
    console.error("Save failed: Name input not found for sourceId:", sourceId);
    return;
  }
  const name = nameInput.value.trim();
  if (!name) {
    showToast('プリセットの名前を入力してください。', "error");
    nameInput.focus();
    return;
  }

  const presetData = { name, buffs: {}, states: {}, order: Date.now() };
  const colorInput = document.getElementById(`skill-preset-${sourceId}-color`);
  presetData.color = colorInput ? colorInput.value : '#ffffff';

  skillPresetStructure.forEach(skill => {
    const input = document.getElementById(`skill-preset-${sourceId}-${skill.id}`);
    if (input) {
      if (skill.type === 'text' && input.value) {
        presetData.buffs[skill.id] = parseFloat(input.value) || 0;
      } else if (skill.type === 'state' && input.checked) {
        presetData.states[skill.id] = true;
      }
    }
  });

  if (currentUser) {
    try {
      const collectionRef = db.collection('users').doc(currentUser.uid).collection('skillPresets');
      if (isNew) {
        await collectionRef.add(presetData);
      } else {
        await collectionRef.doc(presetId).set(presetData, { merge: true });
      }
      showToast(`スキルプリセット「${name}」をクラウドに保存しました。`, "success");
      await loadAllDataFromFirestore();
    } catch (e) {
      console.error("Firebase save error:", e);
      showToast("クラウドへの保存に失敗しました。", "error");
    }
  } else {
    let presets = getStoredJSON(SKILL_PRESET_KEY, []);
    if (isNew) {
      presets.push({ ...presetData, id: `local_${Date.now()}` });
    } else {
      const index = presets.findIndex(p => p.id === presetId);
      if (index > -1) {
        presets[index] = { ...presets[index], ...presetData };
      }
    }
    localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(presets));
    showToast(`スキルプリセット「${name}」をこのブラウザに保存しました。`, "success");
    renderSkillPresetEditor();
    renderSkillPresetActivator();
  }
}

async function deleteSkillPreset(presetId, presetName) {
  if (!confirm(`スキルプリセット「${presetName}」を本当に削除しますか？`)) return;
  if (currentUser) {
    try {
      await db.collection('users').doc(currentUser.uid).collection('skillPresets').doc(presetId).delete();
      showToast('クラウドからプリセットを削除しました。', "success");
      await loadAllDataFromFirestore();
    } catch (e) {
      showToast("クラウドからの削除に失敗しました。", "error");
    }
  } else {
    let presets = getStoredJSON(SKILL_PRESET_KEY, []);
    localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(presets.filter(p => p.id !== presetId)));
    showToast('このブラウザからプリセットを削除しました。', "success");
    renderSkillPresetEditor(); renderSkillPresetActivator(); calculateDamage();
  }
}

async function openCharacterDex() {
  if (!currentUser) {
    showToast("マイキャラ図鑑機能の利用にはログインが必要です。", "info");
    return;
  }
  const dexList = $('#character-dex-list').html('読み込み中...');
  $('#character-dex-modal').fadeIn(200);
  try {
    const snapshot = await db.collection('users').doc(currentUser.uid).collection('characters').orderBy('registeredAt', 'desc').get();
    if (snapshot.empty) { dexList.html('<p>登録されているキャラクターがいません。</p>'); return; }
    dexList.empty();
    snapshot.forEach(doc => {
      const char = doc.data();
      const styleParts = [];
      if (char.color) styleParts.push(`border-color: ${char.color};`);
      if (char.imageUrl) styleParts.push(`background-image: url(${char.imageUrl}); background-size: cover;`);
      const styleAttr = styleParts.join(' ');
      const item = $(`
        <div class="dex-list-item" data-id="${doc.id}" style="${styleAttr}">
          <span class="dex-item-name">${char.characterName}</span>
          <button class="delete-dex-item-btn" title="削除">&times;</button>
        </div>`);
      item.on('click', (e) => { if (!$(e.target).is('.delete-dex-item-btn')) loadCharacterFromDex(doc.id); });
      item.find('.delete-dex-item-btn').on('click', () => deleteCharacterFromDex(doc.id, char.characterName));
      dexList.append(item);
    });
  } catch (e) { dexList.html('<p>図鑑の読み込みに失敗しました。</p>'); }
}

async function saveCharacterToDex() {
  if (!currentUser) {
    showToast("図鑑への登録にはログインが必要です。", "info");
    return;
  }

  const name = prompt("このキャラクターの名前を入力してください:", "[竜魔人]ミリム・ナーヴァ");
  if (!name?.trim()) return;

  const charColor = prompt("枠の色を16進カラーコードで入力してください (例: #ff00ff):", "#ffffff");
  const charImage = prompt("キャラクター画像のURLを入力してください (省略可):", "");

  const statsToSave = {
    'base-attack-power': v('base-attack-power'),
    'base-defense-power': v('base-defense-power'),
    'support-attack-power': v('support-attack-power'),
    'ultimate-magnification': v('ultimate-magnification'),
    'affinity-up-buff': v('affinity-up-buff'),
  };

  try {
    await db.collection('users')
      .doc(currentUser.uid)
      .collection('characters')
      .add({
        characterName: name,
        stats: statsToSave,
        color: charColor,
        imageUrl: charImage,
        registeredAt: new Date()
      });
    showToast(`「${name}」を図鑑に登録しました。`, "success");
  } catch (e) {
    showToast("図鑑への登録に失敗しました。", "error");
  }
}

async function loadCharacterFromDex(charId) {
  try {
    const doc = await db.collection('users').doc(currentUser.uid).collection('characters').doc(charId).get();
    if (!doc.exists) {
      showToast("キャラクターデータが見つかりません。", "error");
      return;
    }
    const { stats, characterName } = doc.data();
    loadInputsFromDataObject(stats);
    calculateDamage();
    $('#character-dex-modal').fadeOut(200);
    showToast(`「${characterName}」のステータスを読み込みました。`, "info");
  } catch (e) {
    showToast("キャラクターの読み込みに失敗しました。", "error");
  }
}

async function deleteCharacterFromDex(charId, charName) {
  if (!confirm(`「${charName}」を図鑑から本当に削除しますか？`)) return;
  try {
    await db.collection('users').doc(currentUser.uid).collection('characters').doc(charId).delete();
    await openCharacterDex();
    showToast("キャラクターを削除しました。", "success");
  } catch (e) {
    showToast("キャラクターの削除に失敗しました。", "error");
  }
}


// ===============================================================
// ** 5. 計算エンジン & 結果表示 **
// ===============================================================
function calculateDamage() {
  const resultDiv = document.getElementById('damage-result');
  try {
    applySkillPresets();
    const currentInputs = getInputsAsDataObject();
    lastTotalResult = runCalculationEngine(currentInputs);

    if (isComparisonModeActive) {
      const comparisonInputs = { ...currentInputs };
      activeComparisonBuffs.forEach(id => {
        if (comparisonInputs[id] !== undefined) comparisonInputs[id] = 0;
      });
      lastComparisonResult = runCalculationEngine(comparisonInputs);
    }

    resultDiv.innerHTML = generateResultHtml(lastTotalResult);

  } catch (error) {
    resultDiv.innerHTML = `<p style="color: #ff5c5c; padding: 1rem;">計算エラーが発生しました。<br>入力値やプリセットの内容を確認してください。<br><small>${error.message}</small></p>`;
    console.error("Calculation Error:", error);
  }
}

function getCalculationHelpers(inputData) {
  return {
    p: id => (inputData[id] || 0) / 100,
    v: id => inputData[id] || 0,
    m: id => { const val = inputData[id]; return isNaN(val) || val <= 0 ? 1.0 : val; },
    c: id => inputData[id] || false,
    s: id => inputData[id] || ''
  };
}

function runCalculationEngine(inputData) {
  const { p, v, c, s, m } = getCalculationHelpers(inputData);

  const baseAttack = v('base-attack-power'), baseDefense = v('base-defense-power'), enemyBaseDefense = v('enemy-defense-power');
  const baseSupportAttack = v('support-attack-power'), ultimateMagnification = p('ultimate-magnification');
  const dragonAuraCorrect = c('is-dragon-aura') ? 1.2 : 1, charmCorrect = c('is-charmed') ? 0.95 : 1;
  const attackType = s('ultimate-type');
  let affinityCorrect = 1.0;
  if (s('affinity') === 'favorable' || s('affinity') === 'eiketsu') affinityCorrect = 1.5;
  if (s('affinity') === 'unfavorable') affinityCorrect = 0.7;
  let debuffAmpCorrect = 1.0;
  if (c('is-frostbite')) debuffAmpCorrect += 0.3;
  if (c('is-dominated')) debuffAmpCorrect += 0.3;
  if (c('is-tremor')) debuffAmpCorrect += 0.4;

  const attackBuffTotal = p('attack-buff') + p('attack-buff-trait') + p('attack-buff-cumulative') + p('attack-buff-faction') + p('attack-buff-faction-support') + p('attack-buff-divine-lead') + p('attack-buff-divine-lead-support') + p('attack-buff-divine-trait') + p('attack-buff-divine-trait-support');
  const defenseBuffTotal = p('defense-buff') + p('defense-trait') + p('defense-special-stat') + p('defense-ex-talent') + p('defense-engraved-seal') + p('defense-divine-lead') + p('defense-divine-lead-support') + p('defense-divine-trait') + p('defense-divine-trait-support');
  const selfAttrBuffTotal = p('all-attr-buff') + p('attr-buff') + p('attr-buff-cumulative') + p('attr-buff-divine-lead') + p('attr-buff-divine-lead-support');
  const selfPmBuffTotal = p('pm-buff') + p('pm-buff-cumulative') + p('pm-buff-divine-lead') + p('pm-buff-divine-lead-support') + p('pm-buff-divine-trait') + p('pm-buff-divine-trait-support');
  const aoeAttackBuffTotal = p('aoe-attack-buff') + p('aoe-attack-buff-cumulative');
  const ultimateBuffTotal = p('ultimate-buff') + p('ultimate-buff-cumulative'), extremeUltimateBuffTotal = p('extreme-ultimate-buff'), soulBuffTotal = p('soul-buff');
  const charmSpecialTotal = p('charm-special-buff'), stunSpecialTotal = p('stun-special-buff'), affinityUpTotal = p('affinity-up-buff');
  const weakPointBuffTotal = p('weak-point-buff') + p('weak-point-infinite-buff');
  const pmDamageUpTotal = p('pm-damage-up'), attrDamageUpTotal = p('attr-damage-up');
  const pmDamageResistDebuffTotal = p('pm-damage-resist-debuff'), attrDamageResistDebuffTotal = p('attr-damage-resist-debuff');
  const defenseDebuffTotal = p('defense-debuff') + p('defense-debuff-divine-trait');
  const enemyAttrResistBuffTotal = p('enemy-all-attr-resist-buff') + p('enemy-attr-resist-buff');
  const enemyPmResistBuffTotal = p('enemy-pm-resist-buff');
  const enemyAttrResistDebuffTotal = p('enemy-all-attr-resist-debuff') + p('attr-resist-debuff');
  const enemyPmResistDebuffTotal = p('pm-resist-debuff');
  const singleTargetResistDebuffTotal = p('single-target-resist-debuff'), aoeResistDebuffTotal = p('aoe-resist-debuff');
  const ultimateResistBuffTotal = p('enemy-ultimate-resist-buff'), ultimateResistDebuffTotal = p('ultimate-resist-debuff');
  const weakPointResistBuffTotal = p('enemy-weak-point-resist-buff'), weakPointResistDebuffTotal = p('weak-point-resist-debuff');

  const displayAttack = baseAttack * (1 + attackBuffTotal * dragonAuraCorrect) * charmCorrect;
  const displayDefense = baseDefense * (1 + defenseBuffTotal);
  const enemyPmResistCoeff = 1 + (enemyPmResistDebuffTotal * debuffAmpCorrect - enemyPmResistBuffTotal);
  const enemyAttrResistCoeff = 1 + (enemyAttrResistDebuffTotal * debuffAmpCorrect - enemyAttrResistBuffTotal);
  const enemyActualDefense = enemyBaseDefense * (1 - defenseDebuffTotal * debuffAmpCorrect) * enemyPmResistCoeff * enemyAttrResistCoeff;
  const baseActualAttack = displayAttack * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect);
  const isAoe = (attackType === 'aoe');
  const mainActualAttack = isAoe ? (baseActualAttack * (1 + aoeAttackBuffTotal * dragonAuraCorrect)) : baseActualAttack;
  const kensanAddedAttack = (displayDefense * 0.4) * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect);
  const supportActualAttack = (isAoe ? (baseSupportAttack * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect) * (1 + aoeAttackBuffTotal * dragonAuraCorrect)) : (baseSupportAttack * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect))) * 0.4;

  const critPowerTotal = p('crit-buff') + p('crit-ex-talent') + p('crit-special-stat') + p('crit-trait') + p('crit-divine-trait') + p('crit-engraved-seal');
  const piercePowerTotal = p('pierce-buff') + p('pierce-ex-talent') + p('pierce-special-stat') + p('pierce-trait') + p('pierce-divine-trait') + p('pierce-engraved-seal');
  const synergyPowerTotal = p('synergy-buff') + p('synergy-ex-talent') + p('synergy-special-stat') + p('synergy-trait');
  const kensanPowerTotal = p('kensan-buff') + p('kensan-ex-talent') + p('kensan-special-stat') + p('kensan-trait');
  const critResistBuffTotal = p('enemy-crit-resist-buff'), critResistDebuffTotal = p('crit-resist-debuff') + p('crit-resist-debuff-trait') + p('crit-resist-debuff-divine-trait');
  const pierceResistBuffTotal = p('enemy-pierce-resist-buff'), pierceResistDebuffTotal = p('pierce-resist-debuff') + p('pierce-resist-debuff-trait') + p('pierce-resist-debuff-divine-trait');
  const synergyResistBuffTotal = p('enemy-synergy-resist-buff'), synergyResistDebuffTotal = p('synergy-resist-debuff') + p('synergy-resist-debuff-trait');
  const kensanResistBuffTotal = p('enemy-kensan-resist-buff'), kensanResistDebuffTotal = p('kensan-resist-debuff') + p('kensan-resist-debuff-trait');
  const critTTL = 1.3 + (critPowerTotal * dragonAuraCorrect) + ((critResistDebuffTotal * debuffAmpCorrect) - critResistBuffTotal);
  const pierceTTL = 1 + (piercePowerTotal * dragonAuraCorrect) + ((pierceResistDebuffTotal * debuffAmpCorrect) - pierceResistBuffTotal);
  const synergyTTL = 1 + (synergyPowerTotal * dragonAuraCorrect) + ((synergyResistDebuffTotal * debuffAmpCorrect) - synergyResistBuffTotal);
  const kensanTTL = 1 + (kensanPowerTotal * dragonAuraCorrect) + ((kensanResistDebuffTotal * debuffAmpCorrect) - kensanResistBuffTotal);

  const totalPmDamageCoeff = (pmDamageUpTotal * dragonAuraCorrect) + (pmDamageResistDebuffTotal * debuffAmpCorrect);
  const totalAttrDamageCoeff = (attrDamageUpTotal * dragonAuraCorrect) + (attrDamageResistDebuffTotal * debuffAmpCorrect);
  const damagePowerCoeff = (1 + totalPmDamageCoeff) * (1 + totalAttrDamageCoeff);
  const finalAffinityCorrect = (s('affinity') === 'eiketsu') ? 1.6 : affinityCorrect;
  const affinityWeaknessCoeff = (finalAffinityCorrect * (1 + affinityUpTotal * dragonAuraCorrect)) + (weakPointBuffTotal * dragonAuraCorrect) + ((weakPointResistDebuffTotal * debuffAmpCorrect) - weakPointResistBuffTotal);
  const targetResistDebuffTotal = isAoe ? aoeResistDebuffTotal : singleTargetResistDebuffTotal;
  const specialResistCoeff = (1 + (stunSpecialTotal + charmSpecialTotal) * dragonAuraCorrect) * (1 + targetResistDebuffTotal * debuffAmpCorrect);
  let trueReleaseMultiplier = 1.0;
  const targetWeakness = s('target-weakness-type');
  if (targetWeakness === 'weak') { trueReleaseMultiplier = m('true-release-weak-mult'); }
  else if (targetWeakness === 'super-weak') { trueReleaseMultiplier = m('true-release-super-weak-mult'); }
  const commonCoeff = affinityWeaknessCoeff * specialResistCoeff;
  const calculateFinalDamage = (baseDmg) => (baseDmg > 0 ? baseDmg : 0) * damagePowerCoeff * commonCoeff * trueReleaseMultiplier;

  const normalBaseDmg = (mainActualAttack * 2 - enemyActualDefense) * 0.2;
  const synergyBaseDmg = ((mainActualAttack + supportActualAttack) * 2 - enemyActualDefense) * 0.2;
  const kensanBaseDmg = ((mainActualAttack + kensanAddedAttack) * 2 - enemyActualDefense) * 0.2;
  const synergyKensanBaseDmg = ((mainActualAttack + supportActualAttack + kensanAddedAttack) * 2 - enemyActualDefense) * 0.2;

  const skillBase = {
    normal: calculateFinalDamage(normalBaseDmg),
    synergy: calculateFinalDamage(synergyBaseDmg),
    kensan: calculateFinalDamage(kensanBaseDmg),
    synergyKensan: calculateFinalDamage(synergyKensanBaseDmg)
  };

  const ultimateCoeff = ultimateMagnification * (1 + ultimateBuffTotal + extremeUltimateBuffTotal) * (1 + ((ultimateResistDebuffTotal * debuffAmpCorrect) - ultimateResistBuffTotal));
  const ultimateBase = {
    normal: skillBase.normal * ultimateCoeff,
    synergy: skillBase.synergy * ultimateCoeff,
    kensan: skillBase.kensan * ultimateCoeff,
    synergyKensan: skillBase.synergyKensan * ultimateCoeff
  };

  const applyEffects = (damage, hasSynergy, hasKensan) => {
    let finalDmg = damage;
    if (hasSynergy) finalDmg *= synergyTTL;
    if (hasKensan) finalDmg *= kensanTTL;
    return finalDmg > 0 ? finalDmg : 0;
  };

  const skillFinal = {
    normal: applyEffects(skillBase.normal, false, false),
    synergy: applyEffects(skillBase.synergy, true, false),
    kensan: applyEffects(skillBase.kensan, false, true),
    synergyKensan: applyEffects(skillBase.synergyKensan, true, true)
  };
  Object.keys(skillFinal).forEach(key => { skillFinal[key] *= (1 + soulBuffTotal); });

  const ultimateFinal = {
    normal: applyEffects(ultimateBase.normal, false, false),
    synergy: applyEffects(ultimateBase.synergy, true, false),
    kensan: applyEffects(ultimateBase.kensan, false, true),
    synergyKensan: applyEffects(ultimateBase.synergyKensan, true, true)
  };
  Object.keys(ultimateFinal).forEach(key => { ultimateFinal[key] *= (1 + soulBuffTotal); });

  return {
    displayAttack, mainActualAttack, enemyActualDefense, isAoe,
    skillFinal, ultimateFinal,
    critTTL, pierceTTL,
    critRate: p('crit-rate'), pierceRate: p('pierce-rate')
  };
}

function generateResultHtml(resultData) {
  if (!resultData) return '';
  const { displayAttack, mainActualAttack, enemyActualDefense, isAoe, skillFinal, ultimateFinal, critTTL, pierceTTL, critRate, pierceRate } = resultData;
  let html = `<h3 class="result-header is-open">ステータス<i class="fas fa-chevron-down"></i></h3><div class="result-content-collapsible is-open"><table><tr><td>表示攻撃力</td><td>${Math.round(displayAttack).toLocaleString()}</td></tr><tr><td>実攻撃力(${isAoe ? '全体' : '単体'})</td><td>${Math.round(mainActualAttack).toLocaleString()}</td></tr><tr><td>敵の実防御力</td><td>${Math.round(enemyActualDefense).toLocaleString()}</td></tr></table></div>`;

  const generateSectionHtml = (title, baseResults) => {
    let sectionHtml = `<h3 class="result-header is-open">${title}<i class="fas fa-chevron-down"></i></h3><div class="result-content-collapsible is-open">`;

    const damageTypes = {
      normal: { name: '通常', damage: baseResults.normal },
      ...(c('toggle-synergy') && { synergy: { name: '協心', damage: baseResults.synergy } }),
      ...(c('toggle-kensan') && { kensan: { name: '堅閃', damage: baseResults.kensan } }),
      ...(c('toggle-synergy') && c('toggle-kensan') && { synergyKensan: { name: '協心+堅閃', damage: baseResults.synergyKensan } })
    };

    for (const type in damageTypes) {
      const { name, damage } = damageTypes[type];
      if (damage <= 0 && type !== 'normal') continue;

      const critDmg = damage * critTTL;
      const pierceDmg = (damage + displayAttack * 0.06) * pierceTTL;
      const critPierceDmg = (critDmg + displayAttack * 0.06) * pierceTTL;
      const expectedDmg = calculateExpectedDamage(damage, critDmg, pierceDmg, critPierceDmg, critRate, pierceRate);

      sectionHtml += `<h4 class="sub-result-header is-open">▼ ${name}<i class="fas fa-chevron-down"></i></h4><div class="sub-result-content" style="display:block;"><table>`;
      sectionHtml += `<tr><td>基礎</td><td>${Math.round(damage).toLocaleString()}</td></tr>`;
      if (c('toggle-crit')) sectionHtml += `<tr><td>会心</td><td>${Math.round(critDmg).toLocaleString()}</td></tr>`;
      if (c('toggle-pierce')) {
        sectionHtml += `<tr><td>貫通</td><td>${Math.round(pierceDmg).toLocaleString()}</td></tr>`;
        if (c('toggle-crit')) sectionHtml += `<tr><td>会心+貫通</td><td>${Math.round(critPierceDmg).toLocaleString()}</td></tr>`;
      }
      if ((c('toggle-crit') || c('toggle-pierce')) && (critRate > 0 || pierceRate > 0)) {
        sectionHtml += `<tr><td><strong>期待値</strong></td><td><strong>${Math.round(expectedDmg).toLocaleString()}</strong></td></tr>`;
      }
      sectionHtml += `</table></div>`;
    }
    sectionHtml += `</div>`;
    return sectionHtml;
  };

  html += generateSectionHtml('通常ダメージ', skillFinal);
  html += generateSectionHtml('奥義ダメージ', ultimateFinal);
  return html;
}

function calculateExpectedDamage(normal, crit, pierce, critPierce, critRate, pierceRate) {
  if (critRate === 0 && pierceRate === 0) return normal;
  const c = critRate, p = pierceRate;
  return (normal * (1 - c) * (1 - p)) + (crit * c * (1 - p)) + (pierce * (1 - c) * p) + (critPierce * c * p);
}


// ===============================================================
// ** 6. UI描画 & 操作関連 **
// ===============================================================
function applySkillPresets() {
  const activePresetBuffs = {}, activePresetStates = {};
  const activePresetIds = new Set();
  document.querySelectorAll('.skill-preset-activator-cb:checked').forEach(cb => {
    activePresetIds.add(cb.id.replace('activate-skill-preset-', ''));
  });

  let presets = [];
  if (currentUser) {
    document.querySelectorAll('#skill-preset-editor .skill-preset-card[data-id]').forEach(card => {
      if (activePresetIds.has(card.dataset.id)) {
        const preset = { buffs: {}, states: {} };
        skillPresetStructure.forEach(skill => {
          const input = document.getElementById(`skill-preset-${card.dataset.id}-${skill.id}`);
          if (!input) return;
          if (skill.type === 'text') {
            const value = parseFloat(input.value) || 0;
            if (value) preset.buffs[skill.id] = value;
          } else if (skill.type === 'state') {
            if (input.checked) preset.states[skill.id] = true;
          }
        });
        presets.push(preset);
      }
    });
  } else {
    presets = getStoredJSON(SKILL_PRESET_KEY, []).filter(p => activePresetIds.has(p.id));
  }

  presets.forEach(preset => {
    if (preset && typeof preset.buffs === 'object') {
      Object.entries(preset.buffs).forEach(([id, value]) => {
        activePresetBuffs[id] = (activePresetBuffs[id] || 0) + value;
      });
    }
    if (preset && typeof preset.states === 'object') {
      Object.keys(preset.states).forEach(id => {
        activePresetStates[id] = true;
      });
    }
  });

  skillPresetStructure.forEach(skill => {
    const input = document.getElementById(skill.id);
    if (!input) return;
    if (skill.type === 'state') {
      if (activePresetStates[skill.id]) {
        input.checked = true;
        input.disabled = true;
      } else if (input.disabled) {
        input.checked = false;
        input.disabled = false;
      }
    } else if (skill.type === 'text') {
      const presetValue = activePresetBuffs[skill.id];
      if (presetValue !== undefined) {
        if ((parseFloat(input.value) || 0) < presetValue) {
          input.value = presetValue;
        }
        input.classList.add('preset-active');
      } else {
        input.classList.remove('preset-active');
      }
    }
  });
  $('.ef').each(function () {
    $(this).toggleClass('has-value', $(this).val().trim() !== '');
  });
}

function renderDataPresetButtons(presets = null) {
  const container = document.getElementById('preset-buttons');
  if (!container) return;
  container.innerHTML = '';
  let lastSavedSlot = 0;
  const presetSource = presets || {};
  if (!currentUser) {
    for (let i = 1; i <= MAX_DATA_SLOTS; i++) {
      const localData = getStoredJSON(`maoryuDataPreset_local_${i}`, null);
      if (localData) presetSource[`slot${i}`] = localData;
    }
  }
  Object.keys(presetSource).map(key => parseInt(key.replace('slot', ''))).sort((a, b) => a - b).forEach(slot => {
    const savedData = presetSource[`slot${slot}`];
    const slotEl = document.createElement('div');
    slotEl.className = 'preset-card';
    slotEl.dataset.index = slot;
    slotEl.innerHTML = `<div class="preset-name" title="${savedData.name}">${savedData.name}</div><div class="preset-actions"><button class="preset-btn load-btn" data-action="load-data" data-slot="${slot}" title="読込"><i class="fas fa-download"></i></button><button class="preset-btn delete-btn" data-action="delete-data" data-slot="${slot}" title="削除"><i class="fas fa-trash-alt"></i></button></div>`;
    container.appendChild(slotEl);
    lastSavedSlot = slot;
  });
  if (lastSavedSlot < MAX_DATA_SLOTS) {
    const newCardEl = document.createElement('div');
    newCardEl.className = 'preset-card new-preset-card';
    newCardEl.dataset.action = 'save-data'; newCardEl.dataset.slot = lastSavedSlot + 1;
    newCardEl.innerHTML = `<i class="fas fa-plus"></i>`;
    container.appendChild(newCardEl);
  }
}

function renderSkillPresetEditor(presets = null) {
  const editor = document.getElementById('skill-preset-editor');
  if (!editor) return;
  editor.innerHTML = '';
  let skillPresets = presets;
  if (!currentUser && !presets) {
    skillPresets = getStoredJSON(SKILL_PRESET_KEY, []);
  }

  if (skillPresets) {
    skillPresets.forEach((preset) => {
      if (!preset || typeof preset !== 'object') return;

      const card = document.createElement('div');
      card.className = 'skill-preset-card';
      card.dataset.id = preset.id;

      const categories = { '状態異常': '', 'バフ': '', 'デバフ': '' };
      skillPresetStructure.forEach(skill => {
        const value = preset.buffs?.[skill.id] || '';
        let inputHTML = '';
        if (skill.type === 'text') {
          inputHTML = `<div class="input-group"><input class="ef${value ? ' has-value' : ''}" type="number" id="skill-preset-${preset.id}-${skill.id}" value="${value}"><label>${skill.label}</label><span class="focus_line"></span></div>`;
        } else {
          const checked = preset.states?.[skill.id] ? 'checked' : '';
          inputHTML = `<div class="checkbox-group"><input type="checkbox" id="skill-preset-${preset.id}-${skill.id}" ${checked}><label for="skill-preset-${preset.id}-${skill.id}">${skill.label}</label></div>`;
        }
        if (categories[skill.category] !== undefined) categories[skill.category] += inputHTML;
      });
      let contentHTML = '<div class="skill-preset-content">';
      for (const [categoryName, categoryHTML] of Object.entries(categories)) {
        if (categoryHTML) contentHTML += `<div class="skill-preset-category"><h5>${categoryName}</h5><div class="skill-preset-grid">${categoryHTML}</div></div>`;
      }
      contentHTML += '</div>';

      card.innerHTML = `
            <h4>
                <input type="text" class="preset-name-input" id="skill-preset-${preset.id}-name" value="${preset.name || ''}" placeholder="スキルセット">
                <button class="save-skill-preset-btn" data-action="save-skill" data-id="${preset.id}" title="上書き保存"><i class="fas fa-save"></i></button>
                <button class="delete-skill-preset-btn" data-action="delete-skill" data-id="${preset.id}" data-name="${preset.name || ''}" title="削除"><i class="fas fa-trash-alt"></i></button>
            </h4>
            <div class="customization-fields">
                <div class="color-picker-group">
                    <label for="skill-preset-${preset.id}-color">色</label>
                    <input type="color" id="skill-preset-${preset.id}-color" value="${preset.color || '#ffffff'}">
                </div>
            </div>
            ${contentHTML}`;
      editor.appendChild(card);
    });
  }

  const newCardEl = document.createElement('div');
  newCardEl.className = 'skill-preset-card new-skill-preset-card';
  newCardEl.id = 'new-skill-preset-creator';
  newCardEl.title = '新規スキルプリセットを作成';
  newCardEl.innerHTML = '<i class="fas fa-plus"></i>';
  editor.appendChild(newCardEl);
}

function renderSkillPresetActivator(presets = null) {
  const activator = document.getElementById('skill-preset-activator');
  if (!activator) return;
  const savedStates = {};
  activator.querySelectorAll('.skill-preset-activator-cb:checked').forEach(cb => { savedStates[cb.id] = true; });
  activator.innerHTML = '';
  let skillPresets = presets;
  if (!currentUser && !presets) skillPresets = getStoredJSON(SKILL_PRESET_KEY, []);
  if (skillPresets) {
    skillPresets.forEach((preset) => {
      if (preset && preset.name) {
        const div = document.createElement('div');
        div.className = 'preset-activator-card';
        div.style.setProperty('--border-color', preset.color || 'var(--card-border)');

        const id = `activate-skill-preset-${preset.id}`;
        const checkedAttr = savedStates[id] ? 'checked' : '';

        div.innerHTML = `
                    <input type="checkbox" class="calc-input skill-preset-activator-cb" id="${id}" ${checkedAttr}>
                    <label for="${id}">${preset.name}</label>
                `;
        activator.appendChild(div);
      }
    });
  }
}

function addNewSkillPresetCard() {
  const editor = document.getElementById('skill-preset-editor');
  const newCardCreator = document.getElementById('new-skill-preset-creator');
  if (!editor || !newCardCreator || document.getElementById('skill-preset-new-name')) return;

  const card = document.createElement('div');
  card.className = 'skill-preset-card';
  let contentHTML = '<div class="skill-preset-content">';
  const categories = { '状態異常': '', 'バフ': '', 'デバフ': '' };

  skillPresetStructure.forEach(skill => {
    let inputHTML = '';
    if (skill.type === 'text') {
      inputHTML = `<div class="input-group"><input class="ef" type="number" id="skill-preset-new-${skill.id}"><label>${skill.label}</label><span class="focus_line"></span></div>`;
    } else {
      inputHTML = `<div class="checkbox-group"><input type="checkbox" id="skill-preset-new-${skill.id}"><label for="skill-preset-new-${skill.id}">${skill.label}</label></div>`;
    }
    if (categories[skill.category] !== undefined) categories[skill.category] += inputHTML;
  });

  for (const [categoryName, categoryHTML] of Object.entries(categories)) {
    if (categoryHTML) contentHTML += `<div class="skill-preset-category"><h5>${categoryName}</h5><div class="skill-preset-grid">${categoryHTML}</div></div>`;
  }
  contentHTML += '</div>';

  card.innerHTML = `
    <h4>
        <input type="text" class="preset-name-input" id="skill-preset-new-name" placeholder="新しいプリセット名">
        <button class="save-skill-preset-btn" data-action="save-new" title="新規保存"><i class="fas fa-save"></i></button>
    </h4>
    <div class="customization-fields">
        <div class="color-picker-group">
            <label for="skill-preset-new-color">色</label>
            <input type="color" id="skill-preset-new-color" value="#ffffff">
        </div>
    </div>
    ${contentHTML}`;

  editor.insertBefore(card, newCardCreator);
  newCardCreator.style.display = 'none';
}

function renderUpdates(page) {
  const updates = document.querySelectorAll('.new dt');
  if (updates.length === 0) return;
  const totalPages = Math.ceil(updates.length / updatesPerPage);
  updateCurrentPage = Math.max(1, Math.min(page, totalPages));
  const start = (updateCurrentPage - 1) * updatesPerPage;
  updates.forEach((dt, index) => {
    const show = (index >= start && index < start + updatesPerPage);
    dt.style.display = show ? 'flex' : 'none';
    dt.nextElementSibling.style.display = show ? 'block' : 'none';
  });
  $('#page-info').text(`${updateCurrentPage} / ${totalPages}`);
  $('#prev-page').prop('disabled', updateCurrentPage === 1);
  $('#next-page').prop('disabled', updateCurrentPage === totalPages);
}

function setupCustomSelects() {
  document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
    const customSelect = wrapper.querySelector('.custom-select'), trigger = wrapper.querySelector('.custom-select-trigger'), options = wrapper.querySelectorAll('.custom-option'), originalSelect = wrapper.querySelector('select'), triggerSpan = trigger.querySelector('span');
    trigger.addEventListener('click', (e) => { e.stopPropagation(); closeAllSelects(customSelect); customSelect.classList.toggle('open'); });
    options.forEach(option => {
      option.addEventListener('click', function () {
        options.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        triggerSpan.textContent = this.textContent;
        originalSelect.value = this.dataset.value;
        originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
        customSelect.classList.remove('open');
      });
    });
    const initialOption = wrapper.querySelector(`.custom-option[data-value="${originalSelect.value}"]`);
    if (initialOption) { initialOption.classList.add('selected'); triggerSpan.textContent = initialOption.textContent; }
  });
  const closeAllSelects = (except) => { document.querySelectorAll('.custom-select').forEach(s => { if (s !== except) s.classList.remove('open'); }); };
  document.addEventListener('click', () => closeAllSelects());
}

function openComparisonModal() {
  $('#comparison-modal')?.remove();
  const modal = $('<div id="comparison-modal" style="position: fixed; z-index: 1001; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;"></div>');
  const content = $('<div style="background: #2a2a3e; color: #fff; padding: 2rem; border-radius: 8px; width: 90%; max-width: 800px; height: 80%; display: flex; flex-direction: column;"></div>');
  content.html('<h2>比較するバフを選択</h2><p>ここでチェックした項目の数値を「0」としてダメージを再計算し、比較します。</p>');
  const buffListContainer = $('<div style="flex-grow: 1; overflow-y: auto; border: 1px solid #444; padding: 1rem; margin-top: 1rem;"></div>');
  const categorizedBuffs = buffMasterList.reduce((acc, buff) => { (acc[buff.category] = acc[buff.category] || []).push(buff); return acc; }, {});
  for (const category in categorizedBuffs) {
    buffListContainer.append(`<h4 style="color: var(--accent-color-3); margin-top: 1rem; border-bottom: 1px solid #555;">${category}</h4>`);
    const grid = $('<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;"></div>');
    categorizedBuffs[category].forEach(buff => {
      grid.append(`<div class="checkbox-group"><input type="checkbox" class="comparison-cb" id="comp-${buff.id}" ${activeComparisonBuffs.includes(buff.id) ? 'checked' : ''}><label for="comp-${buff.id}">${buff.label}</label></div>`);
    });
    buffListContainer.append(grid);
  }
  content.append(buffListContainer);
  const buttonContainer = $('<div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;"></div>');
  buttonContainer.html(`<button id="clear-comparison-btn" class="link-button">選択をクリア (比較終了)</button><div><button id="apply-comparison-btn" class="link-button">比較を適用</button><button id="close-modal-btn" class="link-button" style="background: #666; margin-left: 1rem;">閉じる</button></div>`);
  content.append(buttonContainer);
  modal.append(content).appendTo('body');
  $('#close-modal-btn').on('click', () => modal.remove());
  $('#apply-comparison-btn').on('click', () => {
    activeComparisonBuffs = $('.comparison-cb:checked').map(function () { return this.id.replace('comp-', ''); }).get();
    isComparisonModeActive = activeComparisonBuffs.length > 0;
    updateComparisonUI(); calculateDamage(); modal.remove();
  });
  $('#clear-comparison-btn').on('click', () => {
    const checked = modal.find('.comparison-cb:checked');
    if (checked.length === 0) { endComparison(); modal.remove(); return; }
    checked.closest('.checkbox-group').addClass('unchecking-animation');
    setTimeout(() => { checked.prop('checked', false).closest('.checkbox-group').removeClass('unchecking-animation'); endComparison(); modal.remove(); }, 500);
  });
}

function endComparison() { isComparisonModeActive = false; activeComparisonBuffs = []; lastComparisonResult = null; updateComparisonUI(); calculateDamage(); }
function updateComparisonUI() { $('#open-compare-modal-btn i').toggleClass('fa-spin', isComparisonModeActive); }

function getGraphBarColor(value, maxValue) {
  if (value === maxValue && maxValue > 0) return 'linear-gradient(90deg, #ff7eb9, #ffb3d7)';
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  if (percentage > 66) return 'linear-gradient(90deg, #ff7e5f, #feb47b)';
  if (percentage > 33) return 'linear-gradient(90deg, #54ebf9, #9efaad)';
  return 'linear-gradient(90deg, #3d8bff, #8cb8ff)';
}

function openGraphModal() {
  $('#graph-modal')?.remove();
  const modal = $('<div id="graph-modal" class="modal-overlay"></div>').on('click', function (e) { if (e.target === this) $(this).remove(); });
  const content = $('<div class="modal-content graph-modal-content"></div>');
  content.css({ 'overflow-y': 'auto' });
  let html = `<h2>${isComparisonModeActive ? 'ダメージ比較グラフ' : 'ダメージグラフ'}</h2>`;
  if (!lastTotalResult) { content.html(html + '<p>計算データがありません。</p>'); modal.append(content).appendTo('body').fadeIn(200); return; }
  const damageCategories = { normal: { name: '通常ダメージ', data: [] }, ...(c('toggle-synergy') && { synergy: { name: '協心ダメージ', data: [] } }), ...(c('toggle-kensan') && { kensan: { name: '堅閃ダメージ', data: [] } }), ...(c('toggle-synergy') && c('toggle-kensan') && { synergyKensan: { name: '協心+堅閃ダメージ', data: [] } }) };
  const sections = [{ type: '通常', data: lastTotalResult.skillFinal }, { type: '奥義', data: lastTotalResult.ultimateFinal }];
  const comparisonSections = isComparisonModeActive ? [{ type: '通常', data: lastComparisonResult.skillFinal }, { type: '奥義', data: lastComparisonResult.ultimateFinal }] : null;
  let allValues = [];
  Object.keys(damageCategories).forEach(catKey => {
    sections.forEach((section, sectionIndex) => {
      const damage = section.data[catKey];
      if (damage === undefined || (damage <= 0 && catKey !== 'normal')) return;
      const critDmg = damage * lastTotalResult.critTTL, pierceDmg = (damage + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL, critPierceDmg = (critDmg + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL, expectedDmg = calculateExpectedDamage(damage, critDmg, pierceDmg, critPierceDmg, lastTotalResult.critRate, lastTotalResult.pierceRate);
      const createDataEntry = (type, value, compValue) => ({ categoryName: damageCategories[catKey].name, label: section.type, type, value, ...(isComparisonModeActive && { compValue }) });
      damageCategories[catKey].data.push(createDataEntry('基礎', damage, isComparisonModeActive ? comparisonSections[sectionIndex].data[catKey] : undefined));
      if (c('toggle-crit')) damageCategories[catKey].data.push(createDataEntry('会心', critDmg, isComparisonModeActive ? comparisonSections[sectionIndex].data[catKey] * lastTotalResult.critTTL : undefined));
      if (c('toggle-pierce')) {
        damageCategories[catKey].data.push(createDataEntry('貫通', pierceDmg, isComparisonModeActive ? (comparisonSections[sectionIndex].data[catKey] + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL : undefined));
        if (c('toggle-crit')) damageCategories[catKey].data.push(createDataEntry('会心+貫通', critPierceDmg, isComparisonModeActive ? (comparisonSections[sectionIndex].data[catKey] * lastTotalResult.critTTL + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL : undefined));
      }
      if ((c('toggle-crit') || c('toggle-pierce')) && (lastTotalResult.critRate > 0 || lastTotalResult.pierceRate > 0)) {
        let compExpectedDmg;
        if (isComparisonModeActive) { const compDmg = comparisonSections[sectionIndex].data[catKey], compCrit = compDmg * lastTotalResult.critTTL, compPierce = (compDmg + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL, compCritPierce = (compCrit + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL; compExpectedDmg = calculateExpectedDamage(compDmg, compCrit, compPierce, compCritPierce, lastTotalResult.critRate, lastTotalResult.pierceRate); }
        damageCategories[catKey].data.push(createDataEntry('期待値', expectedDmg, compExpectedDmg));
      }
    });
    allValues.push(...damageCategories[catKey].data.map(d => d.value), ...(isComparisonModeActive ? damageCategories[catKey].data.map(d => d.compValue || 0) : []));
  });
  const maxValue = Math.max(...allValues, 1), flatDamageList = Object.values(damageCategories).flatMap(cat => cat.data);
  if (flatDamageList.length > 0) { const topDamage = flatDamageList.sort((a, b) => b.value - a.value)[0]; html += `<div class="graph-top-summary"><span>最大ダメージパターン</span><div class="top-damage-label">${topDamage.categoryName} - ${topDamage.label} / ${topDamage.type}</div><div class="top-damage-value">${Math.round(topDamage.value).toLocaleString()}</div></div>`; }
  for (const category in damageCategories) {
    const catData = damageCategories[category];
    if (catData.data.length === 0) continue;
    catData.data.sort((a, b) => b.value - a.value);
    html += `<h4 class="graph-category-title collapsible-graph-header is-open">${catData.name}<i class="fas fa-chevron-down"></i></h4><div class="collapsible-graph-content is-open"><div class="graph">`;
    catData.data.forEach(item => {
      const totalWidth = (item.value / maxValue) * 100, totalBarColor = getGraphBarColor(item.value, maxValue);
      html += `<div class="graph-group"><h5>${item.label} / ${item.type}</h5><div class="graph-item"><div class="graph-label" title="合計: ${Math.round(item.value).toLocaleString()}">合計</div><div class="graph-bar-container"><div class="graph-bar" style="width: ${totalWidth}%; background: ${totalBarColor};">${Math.round(item.value).toLocaleString()}</div></div></div>`;
      if (isComparisonModeActive && item.compValue !== undefined) { const compWidth = (item.compValue / maxValue) * 100, compBarColor = getGraphBarColor(item.compValue, maxValue); html += `<div class="graph-item"><div class="graph-label" style="color:#ffb899;" title="バフ無し: ${Math.round(item.compValue).toLocaleString()}">バフ無し</div><div class="graph-bar-container"><div class="graph-bar" style="width: ${compWidth}%; background: ${compBarColor};">${Math.round(item.compValue).toLocaleString()}</div></div></div>`; }
      html += `</div>`;
    });
    html += `</div></div>`;
  }
  if (flatDamageList.length === 0) html += '<p>表示できるダメージがありません。表示トグルを確認してください。</p>';
  content.html(html); modal.append(content).appendTo('body').fadeIn(200);
}


// ===============================================================
// ** 7. 初期化 & イベントリスナー **
// ===============================================================
$(function () {
  const debouncedCalculateAndSave = debounce(() => {
    if (currentUser) { saveInputsToFirestore(); }
    else { calculateDamage(); saveInputsToLocalStorage(); }
  }, 400);

  $('body').on('input change', '.calc-input', function (e) {
    if (this.type === 'number' && parseFloat(this.value) < 0) {
      this.value = 0;
    }
    debouncedCalculateAndSave();
  });

  $('#login-button, #prompt-login-link').on('click', (e) => { e.preventDefault(); $('#login-modal').fadeIn(200); });
  $('#logout-button').on('click', signOutUser);
  $('#google-login-btn').on('click', signInWithGoogle);
  $('#clear-inputs').on('click', () => { if (confirm('すべての入力値をクリアしますか？')) { clearAllInputs(); debouncedCalculateAndSave.flush(); } });
  $('#open-compare-modal-btn').on('click', openComparisonModal);
  $('#show-graph-btn').on('click', openGraphModal);
  $('#export-presets').on('click', exportPresets);
  $('#import-presets').on('click', function () { if (!$(this).is('.disabled')) $('#import-file-input').trigger('click'); });
  $('#import-file-input').on('change', importPresets);
  $('#share-url-btn').on('click', generateShareableUrl);

  $('#preset-buttons').on('click', '.preset-btn, .new-preset-card', function () {
    const action = $(this).data('action'), slot = $(this).data('slot');
    if (action === 'save-data') openSavePresetModal(slot);
    else if (action === 'load-data') loadDataPreset(slot);
    else if (action === 'delete-data') deleteDataPreset(slot);
  });

  $('#skill-preset-editor').on('click', '[data-action]', function () {
    const action = $(this).data('action'), id = $(this).data('id');
    if (action === 'save-skill') saveSkillPreset(id);
    else if (action === 'delete-skill') deleteSkillPreset(id, $(this).data('name'));
    else if (action === 'save-new') saveSkillPreset(null, true);
  });
  $('#skill-preset-editor').on('click', '#new-skill-preset-creator', addNewSkillPresetCard);

  $('#save-preset-button-confirm').on('click', saveDataPreset);

  $('#open-dex-button').on('click', openCharacterDex);
  $('#save-to-dex-button').on('click', saveCharacterToDex);

  $('.modal-overlay .modal-close-btn').on('click', function () { $(this).closest('.modal-overlay').fadeOut(200); });
  $('.openclose').on('click', function () { $(this).toggleClass('is-open').next('.preset-editor-container').slideToggle(300); });
  $('body').on('click', '.collapsible-header', function () { $(this).closest('.form-section').toggleClass('is-open'); });
  $('#damage-result').off('click', '.result-header').on('click', '.result-header', function () {
    const $header = $(this);
    const $content = $header.next('.result-content-collapsible');
    if ($header.hasClass('is-open')) {
      $header.removeClass('is-open');
      $content.slideUp(300);
    } else {
      $header.addClass('is-open');
      $content.slideDown(300);
    }
  });

  $('#damage-result').off('click', '.sub-result-header').on('click', '.sub-result-header', function () {
    const $hdr = $(this);
    const $content = $hdr.next('.sub-result-content');
    if ($hdr.hasClass('is-open')) {
      $hdr.removeClass('is-open');
      $content.slideUp(200);
      $hdr.find('i').removeClass('fa-chevron-down').addClass('fa-chevron-up');
    } else {
      $hdr.addClass('is-open');
      $content.slideDown(200);
      $hdr.find('i').removeClass('fa-chevron-up').addClass('fa-chevron-down');
    }
  });
  $('body').on('click', '.collapsible-graph-header', function () { $(this).toggleClass('is-open').next('.collapsible-graph-content').slideToggle(300); });
  $('body').on('click', '.update-header', function () { $(this).toggleClass('is-open').next('.update-content').slideToggle(300); });
  $('#next-page').on('click', function () { renderUpdates(updateCurrentPage + 1); });
  $('#prev-page').on('click', function () { renderUpdates(updateCurrentPage - 1); });

  const themes = ['light', 'blue-theme', 'purple-theme', 'green-theme', 'gemini-pink-theme', 'gemini-solar-theme', 'gemini-oceanic-theme'];
  let currentThemeName = 'light';

  function applyTheme(themeName) {
    themes.forEach(t => document.body.classList.remove(t));
    if (themeName && themeName !== 'light') {
      document.body.classList.add(themeName);
    }
    localStorage.setItem(THEME_KEY, themeName);
    currentThemeName = themeName;
  }

  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(themes.includes(savedTheme) ? savedTheme : 'light');

  $('.theme-switcher').on('click', function () {
    const currentIndex = themes.indexOf(currentThemeName);
    const nextIndex = (currentIndex + 1) % themes.length;
    applyTheme(themes[nextIndex]);
  });

  let currentZoomLevel = 0;
  function updateZoom() { $('#damage-result').css('--result-scale', (1.0 + (currentZoomLevel * 0.1)).toFixed(2)); }
  $('#zoom-in').on('click', () => { if (currentZoomLevel < 5) { currentZoomLevel++; updateZoom(); } });
  $('#zoom-out').on('click', () => { if (currentZoomLevel > -3) { currentZoomLevel--; updateZoom(); } });

  const $menubar = $('#menubar'), $menubarHdr = $('#menubar_hdr');
  $(window).on("load resize", debounce(() => {
    if (window.innerWidth < 900) { $('body').addClass('small-screen').removeClass('large-screen'); $menubar.removeClass('display-block'); $menubarHdr.removeClass('display-none ham'); }
    else { $('body').addClass('large-screen').removeClass('small-screen'); $menubar.addClass('display-block'); $menubarHdr.addClass('display-none'); }
  }, 100)).trigger('resize');
  $menubarHdr.on('click', function () { $(this).toggleClass('ham'); $menubar.toggleClass('display-block'); });
  $menubar.on('click', 'a[href^="#"]', function () { $menubar.removeClass('display-block'); $menubarHdr.removeClass('ham'); });

  const topButton = $('.pagetop');
  topButton.hide();
  function smoothScroll(target) { const offset = target === '#' ? 0 : $(target).offset().top; $('html, body').animate({ scrollTop: offset }, 500); }
  $('body').on('click', 'a[href^="#"]:not([data-lightbox]), .pagetop a', function (e) { e.preventDefault(); smoothScroll($(this).attr('href') || '#'); });
  $(window).on('scroll', debounce(() => { topButton.fadeToggle($(window).scrollTop() >= 300); }, 100));

  function checkVisibility() {
    const viewportHeight = $(window).height(), scrollTop = $(window).scrollTop(), activationPoint = scrollTop + viewportHeight * 0.5;
    $(".section").each(function () { $(this).toggleClass("active", activationPoint > $(this).offset().top); });
  }
  $(window).on("scroll", debounce(checkVisibility, 50));

  const $utilControls = $('.util-controls');
  if ($utilControls.length) {
    const utilOriginalTop = $utilControls.offset().top;
    $(window).on('scroll', debounce(() => {
      const scrollTop = $(window).scrollTop();
      if (scrollTop >= utilOriginalTop - 20) {
        $utilControls.css({ position: 'fixed', top: '20px' });
      } else {
        $utilControls.css({ position: '', top: '' });
      }
    }, 20));
  }

  $('body').on('input', '.ef', function () { $(this).toggleClass('has-value', this.value.trim() !== '' || this.placeholder.trim() !== ''); });

  loadFromUrl();
  setupCustomSelects();
  renderUpdates(1);
  checkVisibility();

  auth.onAuthStateChanged(user => {
    if (user) {
      if (currentUser?.uid === user.uid) return;
      currentUser = user;
      updateUiForLoggedInUser(user);
      loadAllDataFromFirestore();
      $('#login-modal').fadeOut(200);
    } else {
      currentUser = null;
      if (unsubscribeCalculatorListener) { unsubscribeCalculatorListener(); unsubscribeCalculatorListener = null; }
      updateUiForLoggedOutUser();
      loadInputsFromLocalStorage();
      renderDataPresetButtons();
      renderSkillPresetEditor();
      renderSkillPresetActivator();
      calculateDamage();
    }
  });
});
