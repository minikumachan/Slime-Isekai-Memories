// ===============================================================
// ** まおりゅうダメージ計算機 (v1.3.2 最終監査版) **
// ===============================================================

// --- グローバル変数 ---
let activeComparisonBuffs = [];
let isComparisonModeActive = false;
let lastTotalResult = null;
let lastComparisonResult = null;
const calcInputs = document.querySelectorAll(".calc-input");
const DATA_PRESET_KEY_PREFIX = "maoryuDataPreset_v2";
const SKILL_PRESET_KEY = "maoryuSkillPresets_v2";
const MAX_DATA_SLOTS = 10;
const THEME_KEY = "maoryuTheme";
const AUTOSAVE_KEY = "maoryuAutoSave";
let draggedItem = null;
let updateCurrentPage = 1;
const updatesPerPage = 3;

// --- 補助関数 ---
function p(id) {
  const el = document.getElementById(id);
  return (parseFloat(el?.value) || 0) / 100;
}
function v(id) {
  const el = document.getElementById(id);
  return parseFloat(el?.value) || 0;
}
function m(id) {
  const el = document.getElementById(id);
  const val = parseFloat(el?.value);
  return isNaN(val) || val <= 0 ? 1.0 : val;
}
function c(id) {
  return document.getElementById(id)?.checked;
}
function s(id) {
  return document.getElementById(id)?.value;
}
function getStoredJSON(key, defaultValue = []) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    localStorage.removeItem(key);
    return defaultValue;
  }
}

// ===============================================================
// ** 自動保存機能 **
// ===============================================================
function saveInputsToStorage() {
  const dataToSave = {};
  document.querySelectorAll(".calc-input").forEach((input) => {
    const id = input.id;
    if (!id) return;
    if (input.type === "checkbox" || input.type === "radio") {
      dataToSave[id] = input.checked;
    } else {
      dataToSave[id] = input.value;
    }
  });
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
}

function loadInputsFromStorage() {
  const savedData = localStorage.getItem(AUTOSAVE_KEY);
  if (!savedData) return;
  try {
    const data = JSON.parse(savedData);
    Object.entries(data).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) {
        if (input.type === "checkbox" || input.type === "radio") {
          input.checked = value;
        } else {
          input.value = value;
        }
        if (input.tagName.toLowerCase() === "select") {
          const wrapper = input.closest(".custom-select-wrapper");
          if (wrapper) {
            const triggerSpan = wrapper.querySelector(
              ".custom-select-trigger span"
            );
            const selectedOption = wrapper.querySelector(
              `.custom-option[data-value="${value}"]`
            );
            if (triggerSpan && selectedOption) {
              triggerSpan.textContent = selectedOption.textContent;
              wrapper
                .querySelectorAll(".custom-option")
                .forEach((opt) => opt.classList.remove("selected"));
              selectedOption.classList.add("selected");
            }
          }
        }
      }
    });
  } catch (e) {
    console.error("自動保存データの読み込みに失敗しました:", e);
    localStorage.removeItem(AUTOSAVE_KEY);
  }
}

// ===============================================================
// ** バフマスターリスト & スキルプリセット定義 **
// ===============================================================
const buffMasterList = [
  { category: "状態異常", id: "is-dragon-aura", label: "竜気状態" },
  { category: "状態異常", id: "is-charmed", label: "魅了/束縛" },
  { category: "状態異常", id: "is-frostbite", label: "凍傷" },
  { category: "状態異常", id: "is-dominated", label: "支配" },
  { category: "状態異常", id: "is-tremor", label: "戦慄" },
  { category: "基礎ステータス", id: "base-attack-power", label: "基礎攻撃力" },
  {
    category: "基礎ステータス",
    id: "base-defense-power",
    label: "自キャラ基礎防御力",
  },
  {
    category: "基礎ステータス",
    id: "enemy-defense-power",
    label: "敵の基礎防御力",
  },
  {
    category: "基礎ステータス",
    id: "support-attack-power",
    label: "基礎支援攻撃力",
  },
  {
    category: "基礎ステータス",
    id: "ultimate-magnification",
    label: "奥義倍率(%)",
  },
  { category: "基礎ステータス", id: "affinity-up-buff", label: "相性強化" },
  { category: "攻撃系バフ", id: "attack-buff", label: "攻撃バフ(スキル)" },
  { category: "攻撃系バフ", id: "attack-buff-trait", label: "攻撃バフ(特性)" },
  {
    category: "攻撃系バフ",
    id: "attack-buff-cumulative",
    label: "攻撃バフ(累積)",
  },
  { category: "攻撃系バフ", id: "attack-buff-faction", label: "攻撃バフ(勢力)" },
  {
    category: "攻撃系バフ",
    id: "attack-buff-faction-support",
    label: "攻撃バフ(勢力支援)",
  },
  {
    category: "攻撃系バフ",
    id: "attack-buff-divine-lead",
    label: "攻撃バフ(加護の導き)",
  },
  {
    category: "攻撃系バフ",
    id: "attack-buff-divine-lead-support",
    label: "攻撃バフ(加護の導き支援)",
  },
  {
    category: "攻撃系バフ",
    id: "attack-buff-divine-trait",
    label: "攻撃バフ(加護特性)",
  },
  {
    category: "攻撃系バフ",
    id: "attack-buff-divine-trait-support",
    label: "攻撃バフ(加護特性支援)",
  },
  { category: "属性・物/魔バフ", id: "all-attr-buff", label: "全属性バフ" },
  { category: "属性・物/魔バフ", id: "attr-buff", label: "属性バフ" },
  {
    category: "属性・物/魔バフ",
    id: "attr-buff-cumulative",
    label: "属性バフ(累積)",
  },
  {
    category: "属性・物/魔バフ",
    id: "attr-buff-divine-lead",
    label: "属性バフ(加護の導き)",
  },
  {
    category: "属性・物/魔バフ",
    id: "attr-buff-divine-lead-support",
    label: "属性バフ(加護の導き支援)",
  },
  { category: "属性・物/魔バフ", id: "pm-buff", label: "物/魔バフ" },
  {
    category: "属性・物/魔バフ",
    id: "pm-buff-cumulative",
    label: "物/魔バフ(累積)",
  },
  {
    category: "属性・物/魔バフ",
    id: "pm-buff-divine-lead",
    label: "物/魔バフ(加護の導き)",
  },
  {
    category: "属性・物/魔バフ",
    id: "pm-buff-divine-lead-support",
    label: "物/魔バフ(加護の導き支援)",
  },
  {
    category: "属性・物/魔バフ",
    id: "pm-buff-divine-trait",
    label: "物/魔バフ(加護特性)",
  },
  {
    category: "属性・物/魔バフ",
    id: "pm-buff-divine-trait-support",
    label: "物/魔バフ(加護特性支援)",
  },
  { category: "その他バフ", id: "aoe-attack-buff", label: "全体攻撃バフ" },
  {
    category: "その他バフ",
    id: "aoe-attack-buff-cumulative",
    label: "全体攻撃バフ(累積)",
  },
  { category: "その他バフ", id: "ultimate-buff", label: "奥義バフ" },
  {
    category: "その他バフ",
    id: "ultimate-buff-cumulative",
    label: "奥義バフ(累積)",
  },
  { category: "その他バフ", id: "extreme-ultimate-buff", label: "極奥義バフ" },
  { category: "その他バフ", id: "soul-buff", label: "魔創魂バフ" },
  { category: "その他バフ", id: "charm-special-buff", label: "魅了特攻" },
  { category: "その他バフ", id: "stun-special-buff", label: "気絶特攻" },
  { category: "その他バフ", id: "weak-point-buff", label: "弱点特攻" },
  {
    category: "その他バフ",
    id: "weak-point-infinite-buff",
    label: "弱点特攻(無限)",
  },
  { category: "ダメージ威力系", id: "pm-damage-up", label: "物魔ダメージ威力UP" },
  { category: "ダメージ威力系", id: "attr-damage-up", label: "属性ダメージ威力UP" },
  {
    category: "ダメージ威力系",
    id: "pm-damage-resist-debuff",
    label: "物/魔ダメージ耐性ダウン",
  },
  {
    category: "ダメージ威力系",
    id: "attr-damage-resist-debuff",
    label: "属性ダメージ耐性ダウン",
  },
  { category: "敵へのデバフ", id: "defense-debuff", label: "防御力デバフ" },
  {
    category: "敵へのデバフ",
    id: "defense-debuff-divine-trait",
    label: "防御力デバフ(加護)",
  },
  {
    category: "敵へのデバフ",
    id: "enemy-all-attr-resist-buff",
    label: "全属性耐性バフ",
  },
  {
    category: "敵へのデバフ",
    id: "enemy-all-attr-resist-debuff",
    label: "全属性耐性デバフ",
  },
  { category: "敵へのデバフ", id: "enemy-attr-resist-buff", label: "属性耐性バフ" },
  { category: "敵へのデバフ", id: "attr-resist-debuff", label: "属性耐性デバフ" },
  { category: "敵へのデバフ", id: "enemy-pm-resist-buff", label: "物/魔耐性バフ" },
  { category: "敵へのデバフ", id: "pm-resist-debuff", label: "物/魔耐性デバフ" },
  {
    category: "敵へのデバフ",
    id: "enemy-crit-resist-buff",
    label: "会心耐性バフ",
  },
  { category: "敵へのデバフ", id: "crit-resist-debuff", label: "会心耐性デバフ" },
  {
    category: "敵へのデバフ",
    id: "enemy-pierce-resist-buff",
    label: "貫通耐性バフ",
  },
  {
    category: "敵へのデバフ",
    id: "pierce-resist-debuff",
    label: "貫通耐性デバフ",
  },
  {
    category: "敵へのデバフ",
    id: "enemy-synergy-resist-buff",
    label: "協心耐性バフ",
  },
  {
    category: "敵へのデバフ",
    id: "synergy-resist-debuff",
    label: "協心耐性デバフ",
  },
  {
    category: "敵へのデバフ",
    id: "enemy-kensan-resist-buff",
    label: "堅閃耐性バフ",
  },
  {
    category: "敵へのデバフ",
    id: "kensan-resist-debuff",
    label: "堅閃耐性デバフ",
  },
  {
    category: "敵へのデバフ",
    id: "single-target-resist-debuff",
    label: "単体攻撃耐性デバフ",
  },
  {
    category: "敵へのデバフ",
    id: "aoe-resist-debuff",
    label: "全体攻撃耐性デバフ",
  },
  {
    category: "敵へのデバフ",
    id: "enemy-ultimate-resist-buff",
    label: "奥義耐性バフ",
  },
  {
    category: "敵へのデバフ",
    id: "ultimate-resist-debuff",
    label: "奥義耐性デバフ",
  },
  {
    category: "敵へのデバフ",
    id: "weak-point-resist-debuff",
    label: "弱点耐性デバフ",
  },
  {
    category: "敵へのデバフ",
    id: "enemy-weak-point-resist-buff",
    label: "弱点耐性バフ",
  },
  { category: "会心", id: "crit-buff", label: "会心力バフ" },
  { category: "会心", id: "crit-ex-talent", label: "会心力(EX才能)" },
  {
    category: "会心",
    id: "crit-resist-debuff-trait",
    label: "会心耐性デバフ(特性)",
  },
  { category: "貫通", id: "pierce-buff", label: "貫通力バフ" },
  { category: "貫通", id: "pierce-ex-talent", label: "貫通力(EX才能)" },
  {
    category: "貫通",
    id: "pierce-resist-debuff-trait",
    label: "貫通耐性デバフ(特性)",
  },
];
const skillPresetStructure = [
  { category: "状態異常", type: "state", id: "is-charmed", label: "魅了/束縛" },
  { category: "状態異常", type: "state", id: "is-frostbite", label: "凍傷" },
  { category: "状態異常", type: "state", id: "is-dominated", label: "支配" },
  { category: "状態異常", type: "state", id: "is-tremor", label: "戦慄" },
  { category: "状態異常", type: "state", id: "is-dragon-aura", label: "竜気状態" },
  { category: "バフ", type: "text", id: "attack-buff", label: "攻撃バフ" },
  { category: "バフ", type: "text", id: "all-attr-buff", label: "全属性バフ" },
  { category: "バフ", type: "text", id: "attr-buff", label: "属性バフ" },
  { category: "バフ", type: "text", id: "pm-buff", label: "物魔バフ" },
  { category: "バフ", type: "text", id: "aoe-attack-buff", label: "全体攻撃バフ" },
  { category: "バフ", type: "text", id: "ultimate-buff", label: "奥義バフ" },
  {
    category: "バフ",
    type: "text",
    id: "extreme-ultimate-buff",
    label: "極奥義バフ",
  },
  {
    category: "バフ",
    type: "text",
    id: "pm-damage-up",
    label: "物魔ダメージ威力UP",
  },
  {
    category: "バフ",
    type: "text",
    id: "attr-damage-up",
    label: "属性ダメージ威力UP",
  },
  {
    category: "バフ",
    type: "text",
    id: "pm-damage-resist-debuff",
    label: "物/魔ダメージ耐性ダウン",
  },
  {
    category: "バフ",
    type: "text",
    id: "attr-damage-resist-debuff",
    label: "属性ダメージ耐性ダウン",
  },
  { category: "バフ", type: "text", id: "soul-buff", label: "魔創魂バフ" },
  { category: "バフ", type: "text", id: "charm-special-buff", label: "魅了特攻" },
  { category: "バフ", type: "text", id: "stun-special-buff", label: "気絶特攻" },
  { category: "バフ", type: "text", id: "weak-point-buff", label: "弱点特攻" },
  { category: "バフ", type: "text", id: "defense-buff", label: "防御力バフ" },
  { category: "バフ", type: "text", id: "crit-buff", label: "会心力バフ" },
  { category: "バフ", type: "text", id: "pierce-buff", label: "貫通力バフ" },
  { category: "バフ", type: "text", id: "synergy-buff", label: "協心力バフ" },
  { category: "バフ", type: "text", id: "kensan-buff", label: "堅閃力バフ" },
  { category: "デバフ", type: "text", id: "defense-debuff", label: "[敵]防御力デバフ" },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-all-attr-resist-buff",
    label: "[敵]全属性耐性バフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-all-attr-resist-debuff",
    label: "[敵]全属性耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-attr-resist-buff",
    label: "[敵]属性耐性バフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "attr-resist-debuff",
    label: "[敵]属性耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-pm-resist-buff",
    label: "[敵]物/魔耐性バフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "pm-resist-debuff",
    label: "[敵]物/魔耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-weak-point-resist-buff",
    label: "[敵]弱点耐性バフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "weak-point-resist-debuff",
    label: "[敵]弱点耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-ultimate-resist-buff",
    label: "[敵]奥義耐性バフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "ultimate-resist-debuff",
    label: "[敵]奥義耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "single-target-resist-debuff",
    label: "[敵]単体攻撃耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "aoe-resist-debuff",
    label: "[敵]全体攻撃耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-crit-resist-buff",
    label: "[敵]会心耐性バフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "crit-resist-debuff",
    label: "[敵]会心耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-pierce-resist-buff",
    label: "[敵]貫通耐性バフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "pierce-resist-debuff",
    label: "[敵]貫通耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-synergy-resist-buff",
    label: "[敵]協心耐性バフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "synergy-resist-debuff",
    label: "[敵]協心耐性デバフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "enemy-kensan-resist-buff",
    label: "[敵]堅閃耐性バフ",
  },
  {
    category: "デバフ",
    type: "text",
    id: "kensan-resist-debuff",
    label: "[敵]堅閃耐性デバフ",
  },
];

// ===============================================================
// ** スキルプリセット機能 **
// ===============================================================
function applySkillPresets() { const activePresetBuffs = {}; const activePresetStates = {}; const savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY); savedSkillPresets.forEach((preset, i) => { if (c(`activate-skill-preset-${i}`)) { Object.entries(preset.buffs || {}).forEach(([id, value]) => { activePresetBuffs[id] = (activePresetBuffs[id] || 0) + value; }); Object.keys(preset.states || {}).forEach(id => { activePresetStates[id] = true; }); } }); skillPresetStructure.forEach(skill => { const input = document.getElementById(skill.id); if (!input) return; if (skill.type === 'state') { if (activePresetStates[skill.id]) { input.checked = true; input.disabled = true; } else if (input.disabled) { input.checked = false; input.disabled = false; } } else if (skill.type === 'text') { const presetValue = activePresetBuffs[skill.id]; if (presetValue !== undefined) { const userValue = parseFloat(input.value) || 0; if (userValue < presetValue) { input.value = presetValue; } input.classList.add('preset-active'); } else { input.classList.remove('preset-active'); } } }); document.querySelectorAll('.ef').forEach(input => { $(input).toggleClass('has-value', input.value.trim() !== ''); }); }
function renderSkillPresetEditor() { const editor = document.getElementById('skill-preset-editor'); if (!editor) return; editor.innerHTML = ''; const savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY); savedSkillPresets.forEach((preset, i) => { const card = document.createElement('div'); card.className = 'skill-preset-card'; card.draggable = true; card.dataset.index = i; const categories = { '状態異常': '', 'バフ': '', 'デバフ': '' }; skillPresetStructure.forEach(skill => { let inputHTML = ''; const value = preset.buffs?.[skill.id] || ''; const hasValueClass = value ? ' has-value' : ''; if (skill.type === 'text') { inputHTML = `<div class="input-group"><input class="ef${hasValueClass}" type="number" id="skill-preset-${i}-${skill.id}" value="${value}"><label>${skill.label}</label><span class="focus_line"></span></div>`; } else if (skill.type === 'state') { inputHTML = `<div class="checkbox-group"><input type="checkbox" id="skill-preset-${i}-${skill.id}" ${preset.states?.[skill.id] ? 'checked' : ''}><label for="skill-preset-${i}-${skill.id}">${skill.label}</label></div>`; } if (categories[skill.category] !== undefined) categories[skill.category] += inputHTML; }); let contentHTML = '<div class="skill-preset-content">'; for (const [categoryName, categoryHTML] of Object.entries(categories)) { if (categoryHTML) contentHTML += `<div class="skill-preset-category"><h5>${categoryName}</h5><div class="skill-preset-grid">${categoryHTML}</div></div>`; } contentHTML += '</div>'; card.innerHTML = `<h4><input type="text" class="preset-name-input" id="skill-preset-${i}-name" value="${preset.name || ''}" placeholder="スキルセット ${i + 1}"><button class="save-skill-preset-btn" data-action="save-skill" data-slot="${i}" title="上書き保存"><i class="fas fa-save"></i></button><button class="delete-skill-preset-btn" data-action="delete-skill" data-slot="${i}" title="削除"><i class="fas fa-trash-alt"></i></button></h4>${contentHTML}`; editor.appendChild(card); }); const newCardEl = document.createElement('div'); newCardEl.className = 'skill-preset-card new-skill-preset-card'; newCardEl.id = 'new-skill-preset-creator'; newCardEl.title = `新規スキルプリセットを作成`; newCardEl.innerHTML = `<i class="fas fa-plus"></i>`; editor.appendChild(newCardEl); }
function saveSkillPreset(slot, isNew = false) { let savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY); const sourceIndex = isNew ? 'new' : slot; const nameInput = document.getElementById(`skill-preset-${sourceIndex}-name`); let name = nameInput ? nameInput.value.trim() : ''; if (isNew && !name) { alert('新しいプリセットの名前を入力してください。'); nameInput.focus(); return; } const preset = { name: name || `スキルセット ${slot + 1}`, buffs: {}, states: {} }; skillPresetStructure.forEach(skill => { const inputId = `skill-preset-${sourceIndex}-${skill.id}`; if (skill.type === 'text') { const value = v(inputId); if (value) preset.buffs[skill.id] = value; } else if (skill.type === 'state') { const checked = c(inputId); if (checked) preset.states[skill.id] = true; } }); if (isNew) savedSkillPresets.push(preset); else savedSkillPresets[slot] = preset; localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(savedSkillPresets)); alert(`「${preset.name}」を保存しました。`); renderSkillPresetEditor(); renderSkillPresetActivator(); }
function deleteSkillPreset(slot) { let savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY); const presetName = savedSkillPresets[slot]?.name || `スロット ${slot + 1}`; if (confirm(`スキルプリセット「${presetName}」を本当に削除しますか？`)) { savedSkillPresets.splice(slot, 1); localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(savedSkillPresets)); alert('プリセットを削除しました。'); renderSkillPresetEditor(); renderSkillPresetActivator(); calculateDamage(); } }
function addNewSkillPresetCard() { const editor = document.getElementById('skill-preset-editor'); const newCardCreator = document.getElementById('new-skill-preset-creator'); if (!editor || !newCardCreator || document.getElementById('skill-preset-new-name')) return; const card = document.createElement('div'); card.className = 'skill-preset-card'; let contentHTML = '<div class="skill-preset-content">'; const categories = { '状態異常': '', 'バフ': '', 'デバフ': '' }; skillPresetStructure.forEach(skill => { let inputHTML = ''; if (skill.type === 'text') { inputHTML = `<div class="input-group"><input class="ef" type="number" id="skill-preset-new-${skill.id}"><label>${skill.label}</label><span class="focus_line"></span></div>`; } else if (skill.type === 'state') { inputHTML = `<div class="checkbox-group"><input type="checkbox" id="skill-preset-new-${skill.id}"><label for="skill-preset-new-${skill.id}">${skill.label}</label></div>`; } if (categories[skill.category] !== undefined) categories[skill.category] += inputHTML; }); for (const [categoryName, categoryHTML] of Object.entries(categories)) { if (categoryHTML) contentHTML += `<div class="skill-preset-category"><h5>${categoryName}</h5><div class="skill-preset-grid">${categoryHTML}</div></div>`; } contentHTML += '</div>'; card.innerHTML = `<h4><input type="text" class="preset-name-input" id="skill-preset-new-name" placeholder="新しいプリセット名"><button class="save-skill-preset-btn" data-action="save-new" title="新規保存"><i class="fas fa-save"></i></button></h4>${contentHTML}`; editor.insertBefore(card, newCardCreator); newCardCreator.style.display = 'none'; }
function renderSkillPresetActivator() { const activator = document.getElementById('skill-preset-activator'); if (!activator) return; const savedStates = {}; activator.querySelectorAll('.skill-preset-activator-cb:checked').forEach(cb => savedStates[cb.id] = true); activator.innerHTML = ''; const savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY); savedSkillPresets.forEach((preset, i) => { if (preset && preset.name) { const div = document.createElement('div'); div.className = 'checkbox-group'; const id = `activate-skill-preset-${i}`; div.innerHTML = `<input type="checkbox" class="calc-input skill-preset-activator-cb" id="${id}" ${savedStates[id] ? 'checked' : ''}><label for="${id}">${preset.name}</label>`; activator.appendChild(div); } }); }


// ===============================================================
// ** 計算エンジン **
// ===============================================================
function runCalculationEngine(inputData) {
  const p = id => (inputData[id] || 0) / 100;
  const v = id => inputData[id] || 0;
  const m = id => { const val = inputData[id]; return isNaN(val) || val <= 0 ? 1.0 : val; };
  const c = id => inputData[id] || false;
  const s = id => inputData[id] || '';
  const baseAttack = v('base-attack-power'); const baseDefense = v('base-defense-power'); const enemyBaseDefense = v('enemy-defense-power'); const baseSupportAttack = v('support-attack-power');
  const ultimateMagnification = p('ultimate-magnification'); const dragonAuraCorrect = c('is-dragon-aura') ? 1.2 : 1; const charmCorrect = c('is-charmed') ? 0.95 : 1;
  const attackType = s('ultimate-type'); let affinityCorrect = 1.0;
  if (s('affinity') === 'favorable' || s('affinity') === 'eiketsu') affinityCorrect = 1.5;
  if (s('affinity') === 'unfavorable') affinityCorrect = 0.7;
  let debuffAmpCorrect = 1.0;
  if (c('is-frostbite')) debuffAmpCorrect += 0.3; if (c('is-dominated')) debuffAmpCorrect += 0.3; if (c('is-tremor')) debuffAmpCorrect += 0.4;
  const attackBuffTotal = p('attack-buff') + p('attack-buff-trait') + p('attack-buff-cumulative') + p('attack-buff-faction') + p('attack-buff-faction-support') + p('attack-buff-divine-lead') + p('attack-buff-divine-lead-support') + p('attack-buff-divine-trait') + p('attack-buff-divine-trait-support');
  const defenseBuffTotal = p('defense-buff') + p('defense-trait') + p('defense-special-stat') + p('defense-ex-talent') + p('defense-engraved-seal') + p('defense-divine-lead') + p('defense-divine-lead-support') + p('defense-divine-trait') + p('defense-divine-trait-support');
  const selfAttrBuffTotal = p('all-attr-buff') + p('attr-buff') + p('attr-buff-cumulative') + p('attr-buff-divine-lead') + p('attr-buff-divine-lead-support');
  const selfPmBuffTotal = p('pm-buff') + p('pm-buff-cumulative') + p('pm-buff-divine-lead') + p('pm-buff-divine-lead-support') + p('pm-buff-divine-trait') + p('pm-buff-divine-trait-support');
  const aoeAttackBuffTotal = p('aoe-attack-buff') + p('aoe-attack-buff-cumulative'); const ultimateBuffTotal = p('ultimate-buff') + p('ultimate-buff-cumulative'); const extremeUltimateBuffTotal = p('extreme-ultimate-buff');
  const soulBuffTotal = p('soul-buff'); const charmSpecialTotal = p('charm-special-buff'); const stunSpecialTotal = p('stun-special-buff'); const affinityUpTotal = p('affinity-up-buff');
  const weakPointBuffTotal = p('weak-point-buff') + p('weak-point-infinite-buff');
  const pmDamageUpTotal = p('pm-damage-up');
  const attrDamageUpTotal = p('attr-damage-up');
  const pmDamageResistDebuffTotal = p('pm-damage-resist-debuff');
  const attrDamageResistDebuffTotal = p('attr-damage-resist-debuff');
  const totalPmDamageCoeff = (pmDamageUpTotal * dragonAuraCorrect) + (pmDamageResistDebuffTotal * debuffAmpCorrect);
  const totalAttrDamageCoeff = (attrDamageUpTotal * dragonAuraCorrect) + (attrDamageResistDebuffTotal * debuffAmpCorrect);
  const damagePowerCoeff = (1 + totalPmDamageCoeff) * (1 + totalAttrDamageCoeff);
  const critPowerTotal = p('crit-buff') + p('crit-ex-talent') + p('crit-special-stat') + p('crit-trait') + p('crit-divine-trait') + p('crit-divine-trait-support') + p('crit-engraved-seal');
  const piercePowerTotal = p('pierce-buff') + p('pierce-ex-talent') + p('pierce-special-stat') + p('pierce-trait') + p('pierce-divine-trait') + p('pierce-divine-trait-support') + p('pierce-engraved-seal');
  const synergyPowerTotal = p('synergy-buff') + p('synergy-ex-talent') + p('synergy-special-stat') + p('synergy-trait');
  const kensanPowerTotal = p('kensan-buff') + p('kensan-ex-talent') + p('kensan-special-stat') + p('kensan-trait');
  const enemyAttrResistBuffTotal = p('enemy-all-attr-resist-buff') + p('enemy-attr-resist-buff'); const enemyPmResistBuffTotal = p('enemy-pm-resist-buff');
  const critResistBuffTotal = p('enemy-crit-resist-buff'); const pierceResistBuffTotal = p('enemy-pierce-resist-buff'); const synergyResistBuffTotal = p('enemy-synergy-resist-buff'); const kensanResistBuffTotal = p('enemy-kensan-resist-buff');
  const ultimateResistBuffTotal = p('enemy-ultimate-resist-buff'); const weakPointResistBuffTotal = p('enemy-weak-point-resist-buff');
  const defenseDebuffTotal = p('defense-debuff') + p('defense-debuff-divine-trait'); const enemyAttrResistDebuffTotal = p('enemy-all-attr-resist-debuff') + p('attr-resist-debuff');
  const enemyPmResistDebuffTotal = p('pm-resist-debuff'); const singleTargetResistDebuffTotal = p('single-target-resist-debuff'); const aoeResistDebuffTotal = p('aoe-resist-debuff');
  const ultimateResistDebuffTotal = p('ultimate-resist-debuff'); const weakPointResistDebuffTotal = p('weak-point-resist-debuff');
  const critResistDebuffTotal = p('crit-resist-debuff') + p('crit-resist-debuff-trait') + p('crit-resist-debuff-divine-trait');
  const pierceResistDebuffTotal = p('pierce-resist-debuff') + p('pierce-resist-debuff-trait') + p('pierce-resist-debuff-divine-trait');
  const synergyResistDebuffTotal = p('synergy-resist-debuff') + p('synergy-resist-debuff-trait'); const kensanResistDebuffTotal = p('kensan-resist-debuff') + p('kensan-resist-debuff-trait');
  const displayAttack = baseAttack * (1 + attackBuffTotal * dragonAuraCorrect) * charmCorrect;
  const displayDefense = baseDefense * (1 + defenseBuffTotal);
  const enemyPmResistCoeff = 1 + (enemyPmResistDebuffTotal * debuffAmpCorrect - enemyPmResistBuffTotal);
  const enemyAttrResistCoeff = 1 + (enemyAttrResistDebuffTotal * debuffAmpCorrect - enemyAttrResistBuffTotal);
  const enemyActualDefense = enemyBaseDefense * (1 - defenseDebuffTotal * debuffAmpCorrect) * enemyPmResistCoeff * enemyAttrResistCoeff;
  const baseActualAttack = displayAttack * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect);
  const aoeActualAttack = baseActualAttack * (1 + aoeAttackBuffTotal * dragonAuraCorrect);
  const kensanAddedAttack = (displayDefense * 0.4) * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect);
  const supportActualAttackSingle = baseSupportAttack * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect) * 0.4;
  const supportActualAttackAoe = baseSupportAttack * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect) * (1 + aoeAttackBuffTotal * dragonAuraCorrect) * 0.4;
  const isAoe = (attackType === 'aoe'); const mainActualAttack = isAoe ? aoeActualAttack : baseActualAttack; const supportActualAttack = isAoe ? supportActualAttackAoe : supportActualAttackSingle;
  const normalBaseDmg = (mainActualAttack * 2 - enemyActualDefense) * 0.2;
  const synergyBaseDmg = ((mainActualAttack + supportActualAttack) * 2 - enemyActualDefense) * 0.2;
  const kensanBaseDmg = ((mainActualAttack + kensanAddedAttack) * 2 - enemyActualDefense) * 0.2;
  const synergyKensanBaseDmg = ((mainActualAttack + supportActualAttack + kensanAddedAttack) * 2 - enemyActualDefense) * 0.2;
  const critTTL = 1.3 + (critPowerTotal * dragonAuraCorrect) + ((critResistDebuffTotal * debuffAmpCorrect) - critResistBuffTotal);
  const pierceTTL = 1 + (piercePowerTotal * dragonAuraCorrect) + ((pierceResistDebuffTotal * debuffAmpCorrect) - pierceResistBuffTotal);
  const synergyTTL = 1 + (synergyPowerTotal * dragonAuraCorrect) + ((synergyResistDebuffTotal * debuffAmpCorrect) - synergyResistBuffTotal);
  const kensanTTL = 1 + (kensanPowerTotal * dragonAuraCorrect) + ((kensanResistDebuffTotal * debuffAmpCorrect) - kensanResistBuffTotal);
  let finalAffinityCorrect = (s('affinity') === 'eiketsu') ? 1.6 : affinityCorrect;
  const affinityWeaknessCoeff = (finalAffinityCorrect * (1 + affinityUpTotal * dragonAuraCorrect)) + (weakPointBuffTotal * dragonAuraCorrect) + ((weakPointResistDebuffTotal * debuffAmpCorrect) - weakPointResistBuffTotal);
  const targetResistDebuffTotal = isAoe ? aoeResistDebuffTotal : singleTargetResistDebuffTotal;
  const specialResistCoeff = (1 + (stunSpecialTotal + charmSpecialTotal) * dragonAuraCorrect) * (1 + targetResistDebuffTotal * debuffAmpCorrect);
  const ultimateCoeff = ultimateMagnification * (1 + ultimateBuffTotal + extremeUltimateBuffTotal) * (1 + ((ultimateResistDebuffTotal * debuffAmpCorrect) - ultimateResistBuffTotal));
  let trueReleaseMultiplier = 1.0;
  const targetWeakness = s('target-weakness-type');
  if (targetWeakness === 'weak') { trueReleaseMultiplier = m('true-release-weak-mult'); } else if (targetWeakness === 'super-weak') { trueReleaseMultiplier = m('true-release-super-weak-mult'); }
  const commonCoeff = affinityWeaknessCoeff * specialResistCoeff;
  function calculateFinalDamage(baseDmg) { return (baseDmg * damagePowerCoeff) * commonCoeff * trueReleaseMultiplier; }
  const skillBase = { normal: calculateFinalDamage(normalBaseDmg), synergy: calculateFinalDamage(synergyBaseDmg), kensan: calculateFinalDamage(kensanBaseDmg), synergyKensan: calculateFinalDamage(synergyKensanBaseDmg) };
  const ultimateBase = { normal: skillBase.normal * ultimateCoeff, synergy: skillBase.synergy * ultimateCoeff, kensan: skillBase.kensan * ultimateCoeff, synergyKensan: skillBase.synergyKensan * ultimateCoeff };
  function applyEffects(damage, hasSynergy, hasKensan) { let finalDmg = damage; if (hasSynergy) finalDmg *= synergyTTL; if (hasKensan) finalDmg *= kensanTTL; finalDmg *= (1 + soulBuffTotal); return finalDmg > 0 ? finalDmg : 0; }
  const skillFinal = { normal: applyEffects(skillBase.normal, false, false), synergy: applyEffects(skillBase.synergy, true, false), kensan: applyEffects(skillBase.kensan, false, true), synergyKensan: applyEffects(skillBase.synergyKensan, true, true) };
  const ultimateFinal = { normal: applyEffects(ultimateBase.normal, false, false), synergy: applyEffects(ultimateBase.synergy, true, false), kensan: applyEffects(ultimateBase.kensan, false, true), synergyKensan: applyEffects(ultimateBase.synergyKensan, true, true) };
  return { displayAttack, mainActualAttack, enemyActualDefense, isAoe, skillFinal, ultimateFinal, critTTL, pierceTTL, critRate: p('crit-rate'), pierceRate: p('pierce-rate') };
}

// ===============================================================
// ** メインロジック & 結果表示関連 **
// ===============================================================
function calculateDamage() {
  const resultDiv = document.getElementById('damage-result');
  try {
    applySkillPresets();
    const currentInputs = {};
    document.querySelectorAll('.calc-input').forEach(input => {
      currentInputs[input.id] = (input.type === 'checkbox' || input.type === 'radio') ? input.checked : (input.tagName.toLowerCase() === 'select' ? input.value : (parseFloat(input.value) || 0));
    });
    lastTotalResult = runCalculationEngine(currentInputs);
    if (isComparisonModeActive) {
      const comparisonInputs = { ...currentInputs };
      activeComparisonBuffs.forEach(id => { if (comparisonInputs[id] !== undefined) comparisonInputs[id] = 0; });
      lastComparisonResult = runCalculationEngine(comparisonInputs);
    }
    resultDiv.innerHTML = generateResultHtml(lastTotalResult);
    saveInputsToStorage();
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: #ff5c5c;">計算エラーが発生しました。<br><small>${error.message}</small></p>`;
    console.error("Calculation Error:", error);
  }
}

function generateResultHtml(resultData) {
  const { displayAttack, mainActualAttack, enemyActualDefense, isAoe, skillFinal, ultimateFinal, critTTL, pierceTTL, critRate, pierceRate } = resultData;
  const showCrit = c('toggle-crit');
  const showPierce = c('toggle-pierce');
  const showSynergy = c('toggle-synergy');
  const showKensan = c('toggle-kensan');

  let html = `<h3 class="result-header is-open">ステータス<i class="fas fa-chevron-down"></i></h3>
        <div class="result-content-collapsible is-open">
            <table>
                <tr><td>表示攻撃力</td><td>${Math.round(displayAttack).toLocaleString()}</td></tr>
                <tr><td>実攻撃力(${isAoe ? '全体' : '単体'})</td><td>${Math.round(mainActualAttack).toLocaleString()}</td></tr>
                <tr><td>敵の実防御力</td><td>${Math.round(enemyActualDefense).toLocaleString()}</td></tr>
            </table>
        </div>`;

  function generateSectionHtml(title, baseResults) {
    let sectionHtml = `<h3 class="result-header is-open">${title}<i class="fas fa-chevron-down"></i></h3><div class="result-content-collapsible is-open"><table>`;
    const damageTypes = {
      normal: { name: '通常', damage: baseResults.normal },
      ...(showSynergy && { synergy: { name: '協心', damage: baseResults.synergy } }),
      ...(showKensan && { kensan: { name: '堅閃', damage: baseResults.kensan } }),
      ...(showSynergy && showKensan && { synergyKensan: { name: '協心+堅閃', damage: baseResults.synergyKensan } })
    };

    for (const type in damageTypes) {
      const { name, damage } = damageTypes[type];
      if (damage <= 0 && type !== 'normal') continue;
      const critDmg = damage * critTTL;
      const pierceDmg = (damage + displayAttack * 0.06) * pierceTTL;
      const critPierceDmg = (critDmg + displayAttack * 0.06) * pierceTTL;
      const expectedDmg = calculateExpectedDamage(damage, critDmg, pierceDmg, critPierceDmg, critRate, pierceRate);

      sectionHtml += `<tr><td colspan="2" class="result-type-header">▼ ${name}</td></tr>
                            <tr><td>基礎</td><td>${Math.round(damage).toLocaleString()}</td></tr>`;
      if (showCrit) sectionHtml += `<tr><td>会心</td><td>${Math.round(critDmg).toLocaleString()}</td></tr>`;
      if (showPierce) {
        sectionHtml += `<tr><td>貫通</td><td>${Math.round(pierceDmg).toLocaleString()}</td></tr>`;
        if (showCrit) sectionHtml += `<tr><td>会心+貫通</td><td>${Math.round(critPierceDmg).toLocaleString()}</td></tr>`;
      }
      if ((showCrit || showPierce) && (critRate > 0 || pierceRate > 0)) {
        sectionHtml += `<tr><td><strong>期待値</strong></td><td><strong>${Math.round(expectedDmg).toLocaleString()}</strong></td></tr>`;
      }
    }
    return sectionHtml + `</table></div>`;
  }
  html += generateSectionHtml('通常ダメージ', skillFinal);
  html += generateSectionHtml('奥義ダメージ', ultimateFinal);
  return html;
}

function calculateExpectedDamage(normal, crit, pierce, critPierce, critRate, pierceRate) {
  if (critRate === 0 && pierceRate === 0) return normal;
  const c = critRate; const p = pierceRate;
  return (normal * (1 - c) * (1 - p)) + (crit * c * (1 - p)) + (pierce * (1 - c) * p) + (critPierce * c * p);
}


// ===============================================================
// ** ダメージ比較 & グラフ機能 **
// ===============================================================
function openComparisonModal() {
  const existingModal = document.getElementById('comparison-modal');
  if (existingModal) existingModal.remove();
  const modal = document.createElement('div');
  modal.id = 'comparison-modal';
  modal.style.cssText = 'position: fixed; z-index: 1001; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;';
  const content = document.createElement('div');
  content.style.cssText = 'background: #2a2a3e; color: #fff; padding: 2rem; border-radius: 8px; width: 90%; max-width: 800px; height: 80%; display: flex; flex-direction: column;';
  content.innerHTML = '<h2>比較するバフを選択</h2><p>ここでチェックした項目の数値を「0」としてダメージを再計算し、比較します。</p>';
  const buffListContainer = document.createElement('div');
  buffListContainer.style.cssText = 'flex-grow: 1; overflow-y: auto; border: 1px solid #444; padding: 1rem; margin-top: 1rem;';
  const categorizedBuffs = buffMasterList.reduce((acc, buff) => {
    if (!acc[buff.category]) acc[buff.category] = [];
    acc[buff.category].push(buff);
    return acc;
  }, {});
  for (const category in categorizedBuffs) {
    buffListContainer.innerHTML += `<h4 style="color: #9efaad; margin-top: 1rem; border-bottom: 1px solid #555;">${category}</h4>`;
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;';
    categorizedBuffs[category].forEach(buff => {
      const isChecked = activeComparisonBuffs.includes(buff.id) ? 'checked' : '';
      grid.innerHTML += `<div class="checkbox-group"><input type="checkbox" class="comparison-cb" id="comp-${buff.id}" ${isChecked}><label for="comp-${buff.id}">${buff.label}</label></div>`;
    });
    buffListContainer.appendChild(grid);
  }
  content.appendChild(buffListContainer);

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;';
  buttonContainer.innerHTML = `
        <button id="clear-comparison-btn" style="background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">選択をクリア (比較終了)</button>
        <div>
            <button id="apply-comparison-btn" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">比較を適用</button>
            <button id="close-modal-btn" style="background: #666; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 1rem;">閉じる</button>
        </div>`;
  content.appendChild(buttonContainer);
  modal.appendChild(content);
  document.body.appendChild(modal);

  document.getElementById('close-modal-btn').addEventListener('click', () => modal.remove());
  document.getElementById('apply-comparison-btn').addEventListener('click', () => {
    activeComparisonBuffs = [];
    document.querySelectorAll('.comparison-cb:checked').forEach(cb => { activeComparisonBuffs.push(cb.id.replace('comp-', '')); });
    isComparisonModeActive = activeComparisonBuffs.length > 0;
    updateComparisonUI();
    calculateDamage();
    modal.remove();
  });

  document.getElementById('clear-comparison-btn').addEventListener('click', () => {
    const checked = modal.querySelectorAll('.comparison-cb:checked');
    if (checked.length === 0) {
      endComparison();
      modal.remove();
      return;
    }
    checked.forEach(cb => { cb.closest('.checkbox-group').classList.add('unchecking-animation'); });
    setTimeout(() => {
      checked.forEach(cb => {
        cb.checked = false;
        cb.closest('.checkbox-group').classList.remove('unchecking-animation');
      });
      endComparison();
      modal.remove();
    }, 500);
  });
}

function endComparison() {
  isComparisonModeActive = false;
  activeComparisonBuffs = [];
  lastComparisonResult = null;
  updateComparisonUI();
  calculateDamage();
}

function updateComparisonUI() {
  $('#open-compare-modal-btn i').toggleClass('fa-spin', isComparisonModeActive);
  $('#open-compare-modal-btn').css('color', isComparisonModeActive ? '#ff9800' : '');
}

function getGraphBarColor(value, maxValue) {
  if (value === maxValue && maxValue > 0) return 'linear-gradient(90deg, #ff7eb9, #ffb3d7)'; // Pink for max
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  if (percentage > 66) {
    return 'linear-gradient(90deg, #ff7e5f, #feb47b)'; // High damage color
  } else if (percentage > 33) {
    return 'linear-gradient(90deg, #54ebf9, #9efaad)'; // Medium damage color
  } else {
    return 'linear-gradient(90deg, #3d8bff, #8cb8ff)'; // Low damage color
  }
}

function openGraphModal() {
  const existingModal = document.getElementById('graph-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'graph-modal';
  modal.style.cssText = 'position: fixed; z-index: 1002; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;';
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  const content = document.createElement('div');
  content.className = 'graph-modal-content';
  content.style.cssText = 'background: #2a2a3e; color: #fff; padding: 2rem; border-radius: 8px; width: 90%; max-width: 900px; max-height: 90%; overflow-y: auto;';

  let html = `<h2>${isComparisonModeActive ? 'ダメージ比較グラフ' : 'ダメージグラフ'}</h2>`;

  if (!lastTotalResult) {
    content.innerHTML = html + '<p>計算データがありません。</p>';
    modal.appendChild(content);
    document.body.appendChild(modal);
    return;
  }

  const showCrit = c('toggle-crit');
  const showPierce = c('toggle-pierce');
  const showSynergy = c('toggle-synergy');
  const showKensan = c('toggle-kensan');

  const damageCategories = {
    normal: { name: '通常ダメージ', data: [] },
    ...(showSynergy && { synergy: { name: '協心ダメージ', data: [] } }),
    ...(showKensan && { kensan: { name: '堅閃ダメージ', data: [] } }),
    ...(showSynergy && showKensan && { synergyKensan: { name: '協心+堅閃ダメージ', data: [] } })
  };

  const sections = [{ type: '通常', data: lastTotalResult.skillFinal }, { type: '奥義', data: lastTotalResult.ultimateFinal }];
  const comparisonSections = isComparisonModeActive ? [{ type: '通常', data: lastComparisonResult.skillFinal }, { type: '奥義', data: lastComparisonResult.ultimateFinal }] : null;

  let allValues = [];

  Object.keys(damageCategories).forEach(catKey => {
    const categoryName = damageCategories[catKey].name;
    sections.forEach((section, sectionIndex) => {
      const damage = section.data[catKey];
      if (!damage || (damage <= 0 && catKey !== 'normal')) return;

      const critDmg = damage * lastTotalResult.critTTL;
      const pierceDmg = (damage + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL;
      const critPierceDmg = (critDmg + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL;
      const expectedDmg = calculateExpectedDamage(damage, critDmg, pierceDmg, critPierceDmg, lastTotalResult.critRate, lastTotalResult.pierceRate);

      const createDataEntry = (type, value, compValue) => ({ categoryName, label: section.type, type, value, ...(isComparisonModeActive && { compValue }) });

      damageCategories[catKey].data.push(createDataEntry('基礎', damage, isComparisonModeActive ? comparisonSections[sectionIndex].data[catKey] : undefined));
      if (showCrit) damageCategories[catKey].data.push(createDataEntry('会心', critDmg, isComparisonModeActive ? comparisonSections[sectionIndex].data[catKey] * lastTotalResult.critTTL : undefined));
      if (showPierce) {
        damageCategories[catKey].data.push(createDataEntry('貫通', pierceDmg, isComparisonModeActive ? (comparisonSections[sectionIndex].data[catKey] + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL : undefined));
        if (showCrit) damageCategories[catKey].data.push(createDataEntry('会心+貫通', critPierceDmg, isComparisonModeActive ? (comparisonSections[sectionIndex].data[catKey] * lastTotalResult.critTTL + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL : undefined));
      }
      if ((showCrit || showPierce) && (lastTotalResult.critRate > 0 || lastTotalResult.pierceRate > 0)) {
        let compExpectedDmg;
        if (isComparisonModeActive) {
          const compDmg = comparisonSections[sectionIndex].data[catKey];
          const compCrit = compDmg * lastTotalResult.critTTL;
          const compPierce = (compDmg + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL;
          const compCritPierce = (compCrit + lastTotalResult.displayAttack * 0.06) * lastTotalResult.pierceTTL;
          compExpectedDmg = calculateExpectedDamage(compDmg, compCrit, compPierce, compCritPierce, lastTotalResult.critRate, lastTotalResult.pierceRate);
        }
        damageCategories[catKey].data.push(createDataEntry('期待値', expectedDmg, compExpectedDmg));
      }
    });
    allValues.push(...damageCategories[catKey].data.map(d => d.value), ...(isComparisonModeActive ? damageCategories[catKey].data.map(d => d.compValue || 0) : []));
  });

  const maxValue = Math.max(...allValues, 1);

  const flatDamageList = Object.values(damageCategories).flatMap(cat => cat.data);
  if (flatDamageList.length > 0) {
    flatDamageList.sort((a, b) => b.value - a.value);
    const topDamage = flatDamageList[0];
    html += `<div class="graph-top-summary">
                   <span>最大ダメージパターン</span>
                   <div class="top-damage-label">${topDamage.categoryName} - ${topDamage.label} / ${topDamage.type}</div>
                   <div class="top-damage-value">${Math.round(topDamage.value).toLocaleString()}</div>
                 </div>`;
  }

  for (const category in damageCategories) {
    const catData = damageCategories[category];
    if (catData.data.length === 0) continue;

    catData.data.sort((a, b) => b.value - a.value);

    html += `<h4 class="graph-category-title collapsible-graph-header is-open">${catData.name}<i class="fas fa-chevron-down"></i></h4>
                 <div class="collapsible-graph-content is-open"><div class="graph">`;

    catData.data.forEach(item => {
      const label = `${item.label} / ${item.type}`;
      const totalWidth = (item.value / maxValue) * 100;
      const barTitle = `合計: ${Math.round(item.value).toLocaleString()}`;
      const totalBarColor = getGraphBarColor(item.value, maxValue);

      html += `<div class="graph-group"><h5>${label}</h5>
                       <div class="graph-item"><div class="graph-label" title="${barTitle}">合計</div><div class="graph-bar-container"><div class="graph-bar" style="width: ${totalWidth}%; background: ${totalBarColor};">${Math.round(item.value).toLocaleString()}</div></div></div>`;

      if (isComparisonModeActive && item.compValue !== undefined) {
        const compWidth = (item.compValue / maxValue) * 100;
        const compTitle = `バフ無し: ${Math.round(item.compValue).toLocaleString()}`;
        const compBarColor = getGraphBarColor(item.compValue, maxValue);
        html += `<div class="graph-item"><div class="graph-label" style="color:#ffb899;" title="${compTitle}">バフ無し</div><div class="graph-bar-container"><div class="graph-bar" style="width: ${compWidth}%; background: ${compBarColor};">${Math.round(item.compValue).toLocaleString()}</div></div></div>`;
      }
      html += `</div>`;
    });

    html += `</div></div>`;
  }

  if (flatDamageList.length === 0) {
    html += '<p>表示できるダメージがありません。表示トグルを確認してください。</p>';
  }

  content.innerHTML = html;
  modal.appendChild(content);
  document.body.appendChild(modal);
}


// ===============================================================
// ** 初期化&イベントリスナー **
// ===============================================================
$(function () {
  function debounce(func, wait) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
  const debouncedCalculate = debounce(calculateDamage, 400);

  $('body').on('input change', '.calc-input', debouncedCalculate);

  $('#clear-inputs').on('click', () => clearAllInputs(true));
  $('#open-compare-modal-btn').on('click', openComparisonModal);
  $('#show-graph-btn').on('click', openGraphModal);

  $('body').on('click', '.collapsible-graph-header', function () {
    $(this).toggleClass('is-open').next('.collapsible-graph-content').slideToggle(300);
  });

  $('body').on('click', '.update-header', function () {
    $(this).toggleClass('is-open').next('.update-content').slideToggle(300);
  });

  $('#next-page').on('click', function () {
    renderUpdates(updateCurrentPage + 1);
  });
  $('#prev-page').on('click', function () {
    renderUpdates(updateCurrentPage - 1);
  });

  $('#preset-buttons').on('click', '.preset-btn, .new-preset-card', function () { const action = $(this).data('action'); const slot = $(this).data('slot'); if (action === 'save-data') saveDataPreset(slot); else if (action === 'load-data') loadDataPreset(slot); else if (action === 'delete-data') deleteDataPreset(slot); });
  $('#skill-preset-editor').on('click', '[data-action]', function () { const action = $(this).data('action'); const slot = $(this).data('slot'); if (action === 'save-skill') saveSkillPreset(slot); else if (action === 'delete-skill') deleteSkillPreset(slot); else if (action === 'save-new') saveSkillPreset(null, true); });
  $('#skill-preset-editor').on('click', '#new-skill-preset-creator', addNewSkillPresetCard);
  $('body').on('click', '.collapsible-header', function () { $(this).closest('.form-section').toggleClass('is-open'); });
  $('.openclose').on('click', function () { $(this).toggleClass('is-open').next('.preset-editor-container').slideToggle(300); });
  $('#damage-result').on('click', '.result-header', function () { $(this).toggleClass('is-open').next('.result-content-collapsible').slideToggle(300); });
  $('#export-presets').on('click', exportPresets);
  $('#import-presets').on('click', () => $('#import-file-input').click());
  $('#import-file-input').on('change', importPresets);
  $('#share-url-btn').on('click', generateShareableUrl);

  const themes = ['dark', 'blue-theme']; function applyTheme(themeName) { themes.forEach(t => { if (t !== 'dark') document.body.classList.remove(t); }); if (themeName && themeName !== 'dark') { document.body.classList.add(themeName); } localStorage.setItem(THEME_KEY, themeName); } const savedTheme = localStorage.getItem(THEME_KEY); const currentTheme = themes.includes(savedTheme) ? savedTheme : 'dark'; applyTheme(currentTheme); $('.theme-switcher').on('click', function () { const bodyClassList = document.body.classList; let currentThemeName = 'dark'; for (const theme of themes) { if (theme !== 'dark' && bodyClassList.contains(theme)) { currentThemeName = theme; break; } } const currentIndex = themes.indexOf(currentThemeName); const nextIndex = (currentIndex + 1) % themes.length; const nextTheme = themes[nextIndex]; applyTheme(nextTheme); });
  let currentZoomLevel = 0; const result_content = document.getElementById('damage-result'); function updateZoom() { const scale = 1.0 + (currentZoomLevel * 0.1); if (result_content) result_content.style.setProperty('--result-scale', scale.toFixed(2)); } $('#zoom-in').on('click', () => { if (currentZoomLevel < 5) { currentZoomLevel++; updateZoom(); } }); $('#zoom-out').on('click', () => { if (currentZoomLevel > -3) { currentZoomLevel--; updateZoom(); } });
  const $menubar = $('#menubar'); const $menubarHdr = $('#menubar_hdr'); $(window).on("load resize", debounce(() => { if (window.innerWidth < 900) { $('body').addClass('small-screen').removeClass('large-screen'); $menubar.removeClass('display-block'); $menubarHdr.removeClass('display-none ham'); } else { $('body').addClass('large-screen').removeClass('small-screen'); $menubar.addClass('display-block'); $menubarHdr.addClass('display-none'); } }, 100)); $menubarHdr.on('click', function () { $(this).toggleClass('ham'); $menubar.toggleClass('display-block'); }); $menubar.on('click', 'a[href^="#"]', function () { $menubar.removeClass('display-block'); $menubarHdr.removeClass('ham'); }); if ($menubarHdr.length) { const observer = new MutationObserver(() => { $('body').css({ overflow: $menubarHdr.hasClass('ham') ? 'hidden' : '', height: $menubarHdr.hasClass('ham') ? '100vh' : '' }); }); observer.observe($menubarHdr[0], { attributes: true, attributeFilter: ['class'] }); }
  const topButton = $('.pagetop'); topButton.hide(); function smoothScroll(target) { const scrollTo = target === '#' ? 0 : $(target).offset().top; $('html, body').animate({ scrollTop: scrollTo }, 500); } $('body').on('click', 'a[href^="#"], .pagetop', function (e) { e.preventDefault(); smoothScroll($(this).attr('href') || '#'); }); $(window).on('scroll', debounce(() => { topButton.fadeToggle($(window).scrollTop() >= 300); }, 100)); if (window.location.hash && !window.location.hash.startsWith('#data=')) { $('html, body').scrollTop(0); setTimeout(() => smoothScroll(window.location.hash), 10); }
  function checkVisibility() { const viewportHeight = $(window).height(); const scrollTop = $(window).scrollTop(); const activationPoint = scrollTop + viewportHeight * 0.5; $(".section").each(function () { const sectionTop = $(this).offset().top; $(this).toggleClass("active", activationPoint > sectionTop); }); } $(window).on("scroll", debounce(checkVisibility, 50)); checkVisibility();
  $('body').on('input', '.ef', function () { $(this).toggleClass('has-value', this.value.trim() !== '' || this.placeholder.trim() !== ''); });

  // --- 初期化処理 ---
  setupCustomSelects();
  loadFromUrl();
  loadInputsFromStorage();
  renderSkillPresetEditor();
  renderSkillPresetActivator();
  renderDataPresetButtons();
  calculateDamage();
  updateComparisonUI();
  renderUpdates(1);
});


// ===============================================================
// ** その他の関数群 **
// ===============================================================
function setupCustomSelects() { document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => { const customSelect = wrapper.querySelector('.custom-select'); const trigger = wrapper.querySelector('.custom-select-trigger'); const options = wrapper.querySelectorAll('.custom-option'); const originalSelect = wrapper.querySelector('select'); const triggerSpan = trigger.querySelector('span'); trigger.addEventListener('click', (e) => { e.stopPropagation(); closeAllSelects(customSelect); customSelect.classList.toggle('open'); }); options.forEach(option => { option.addEventListener('click', function () { options.forEach(opt => opt.classList.remove('selected')); this.classList.add('selected'); triggerSpan.textContent = this.textContent; originalSelect.value = this.dataset.value; originalSelect.dispatchEvent(new Event('change', { bubbles: true })); customSelect.classList.remove('open'); }); }); const initialValue = originalSelect.value; const initialOption = wrapper.querySelector(`.custom-option[data-value="${initialValue}"]`); if (initialOption) { initialOption.classList.add('selected'); triggerSpan.textContent = initialOption.textContent; } }); document.addEventListener('click', () => closeAllSelects()); function closeAllSelects(exceptThisOne = null) { document.querySelectorAll('.custom-select').forEach(select => { if (select !== exceptThisOne) { select.classList.remove('open'); } }); } }
function renderDataPresetButtons() { const container = document.getElementById('preset-buttons'); if (!container) return; container.innerHTML = ''; let lastSavedSlot = 0; for (let i = 1; i <= MAX_DATA_SLOTS; i++) { const key = `${DATA_PRESET_KEY_PREFIX}${i}`; const savedData = getStoredJSON(key, null); if (savedData) { const presetName = savedData.name || `スロット${i}`; const slotEl = document.createElement('div'); slotEl.className = 'preset-card'; slotEl.draggable = true; slotEl.dataset.index = i; slotEl.innerHTML = `<div class="preset-name" title="${presetName}">${presetName}</div><div class="preset-actions"><button class="preset-btn load-btn" data-action="load-data" data-slot="${i}" title="読込"><i class="fas fa-download"></i></button><button class="preset-btn save-btn" data-action="save-data" data-slot="${i}" title="上書き保存"><i class="fas fa-save"></i></button><button class="preset-btn delete-btn" data-action="delete-data" data-slot="${i}" title="削除"><i class="fas fa-trash-alt"></i></button></div>`; container.appendChild(slotEl); lastSavedSlot = i; } } if (lastSavedSlot < MAX_DATA_SLOTS) { const nextSlot = lastSavedSlot + 1; const newCardEl = document.createElement('div'); newCardEl.className = 'preset-card new-preset-card'; newCardEl.dataset.action = 'save-data'; newCardEl.dataset.slot = nextSlot; newCardEl.innerHTML = `<i class="fas fa-plus"></i>`; container.appendChild(newCardEl); } }
function saveDataPreset(slot) { const key = `${DATA_PRESET_KEY_PREFIX}${slot}`; const existingName = getStoredJSON(key, { name: `データセット ${slot}` }).name; const name = prompt('このデータセットの名前を入力してください:', existingName); if (name === null) return; const presetData = {}; document.querySelectorAll('.calc-input').forEach(input => { presetData[input.id] = (input.type === 'checkbox') ? input.checked : input.value; }); const dataToStore = { name: name.trim() || `データセット ${slot}`, data: presetData }; localStorage.setItem(key, JSON.stringify(dataToStore)); alert(`スロット${slot}に「${dataToStore.name}」を保存しました。`); renderDataPresetButtons(); }
function loadDataPreset(slot) { const savedData = getStoredJSON(`${DATA_PRESET_KEY_PREFIX}${slot}`, null); if (savedData) { if (!savedData.data) { alert(`スロット${slot}のデータが破損しています。`); return; } clearAllInputs(false); Object.keys(savedData.data).forEach(id => { const input = document.getElementById(id); if (input) { if (input.type === 'checkbox') { input.checked = savedData.data[id]; } else { input.value = savedData.data[id]; } } }); document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => { const select = wrapper.querySelector('select'); const value = savedData.data[select.id]; if (select && value !== undefined) { select.value = value; const triggerSpan = wrapper.querySelector('.custom-select-trigger span'); const selectedOption = wrapper.querySelector(`.custom-option[data-value="${value}"]`); if (triggerSpan && selectedOption) { triggerSpan.textContent = selectedOption.textContent; wrapper.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected')); selectedOption.classList.add('selected'); } } }); document.querySelectorAll('.ef').forEach(input => $(input).toggleClass('has-value', input.value.trim() !== '' || input.placeholder.trim() !== '')); calculateDamage(); alert(`「${savedData.name}」を読み込みました。`); } else { alert(`スロット${slot}に保存されたデータがありません。`); } }
function deleteDataPreset(slot) { const key = `${DATA_PRESET_KEY_PREFIX}${slot}`; const presetName = getStoredJSON(key, { name: `スロット ${slot}` }).name; if (confirm(`データプリセット「${presetName}」を本当に削除しますか？`)) { localStorage.removeItem(key); alert('プリセットを削除しました。'); renderDataPresetButtons(); } }
function clearAllInputs(showConfirm) { if (showConfirm && !confirm('すべての入力値をクリアしますか？')) return; document.querySelectorAll('.calc-input').forEach(input => { if (input.type === 'checkbox') { input.checked = false; } else if (input.tagName.toLowerCase() === 'select') { input.selectedIndex = 0; const wrapper = input.closest('.custom-select-wrapper'); if (wrapper) { const triggerSpan = wrapper.querySelector('.custom-select-trigger span'); const firstOption = wrapper.querySelector('.custom-option'); if (triggerSpan && firstOption) { triggerSpan.textContent = firstOption.textContent; wrapper.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected')); firstOption.classList.add('selected'); } } } else { input.value = ''; } }); document.querySelectorAll('.ef').forEach(input => $(input).toggleClass('has-value', false)); if (showConfirm) calculateDamage(); }
// ★★【修正】この関数を置き換えてください ★★
function exportPresets() {
  let filename = prompt("書き出すファイル名を入力してください:", "maoryu-full-backup.json");
  if (!filename || filename.trim() === "") {
    alert("エクスポートをキャンセルしました。");
    return;
  }
  if (!filename.toLowerCase().endsWith('.json')) filename += '.json';

  if (confirm(`ファイル名「${filename}」で現在の全データを書き出しますか？\n(入力数値、トグル状態、全プリセットが含まれます)`)) {
    // 現在の入力値を収集
    const currentInputs = {};
    document.querySelectorAll('.calc-input').forEach(input => {
      currentInputs[input.id] = (input.type === 'checkbox' || input.type === 'radio') ? input.checked : input.value;
    });

    // エクスポートする全データをまとめる
    const exportData = {
      version: "2.0", // データ構造のバージョン
      createdAt: new Date().toISOString(),
      currentCalculatorState: currentInputs, // 現在の入力状態
      skillPresets: getStoredJSON(SKILL_PRESET_KEY), // スキルプリセット
      dataPresets: {} // 入力数値プリセット
    };

    for (let i = 1; i <= MAX_DATA_SLOTS; i++) {
      const data = getStoredJSON(`${DATA_PRESET_KEY_PREFIX}${i}`, null);
      if (data) exportData.dataPresets[i] = data;
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    alert("エクスポートをキャンセルしました。");
  }
}
// ★★【修正】この関数を置き換えてください ★★
function importPresets(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);

      // データ形式の簡易チェック
      if (!importedData.currentCalculatorState && !importedData.skillPresets && !importedData.dataPresets) {
        throw new Error('無効なファイル形式です。');
      }

      if (confirm('現在の全ての状態（入力値、プリセット）を上書きしてインポートしますか？\nこの操作は元に戻せません。')) {
        // プリセットの復元
        if (Array.isArray(importedData.skillPresets)) {
          localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(importedData.skillPresets));
        }
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(DATA_PRESET_KEY_PREFIX)) localStorage.removeItem(key);
        });
        if (importedData.dataPresets) {
          for (const i in importedData.dataPresets) {
            if (i >= 1 && i <= MAX_DATA_SLOTS) {
              localStorage.setItem(`${DATA_PRESET_KEY_PREFIX}${i}`, JSON.stringify(importedData.dataPresets[i]));
            }
          }
        }

        // 計算機の入力状態を復元
        if (importedData.currentCalculatorState) {
          clearAllInputs(false); // 既存の入力をクリア
          Object.keys(importedData.currentCalculatorState).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
              const value = importedData.currentCalculatorState[id];
              if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = value;
              } else {
                input.value = value;
              }
              // カスタムセレクトの表示を更新
              if (input.tagName.toLowerCase() === 'select') {
                const wrapper = input.closest('.custom-select-wrapper');
                if (wrapper) {
                  const triggerSpan = wrapper.querySelector('.custom-select-trigger span');
                  const selectedOption = wrapper.querySelector(`.custom-option[data-value="${value}"]`);
                  if (triggerSpan && selectedOption) {
                    triggerSpan.textContent = selectedOption.textContent;
                    wrapper.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                    selectedOption.classList.add('selected');
                  }
                }
              }
            }
          });
        }

        alert('データのインポートが完了しました。');

        // UIを再描画して計算を再実行
        renderSkillPresetEditor();
        renderSkillPresetActivator();
        renderDataPresetButtons();
        calculateDamage();
        updateComparisonUI();

      }
    } catch (error) {
      alert(`インポートに失敗しました: ${error.message}`);
    } finally {
      event.target.value = null; // 同じファイルを連続で選択できるようにする
    }
  };
  reader.readAsText(file);
}
function generateShareableUrl() { const dataToShare = {}; document.querySelectorAll('.calc-input').forEach(input => { dataToShare[input.id] = (input.type === 'checkbox') ? input.checked : input.value; }); try { const jsonString = JSON.stringify(dataToShare); const encodedData = btoa(encodeURIComponent(jsonString)); const url = `${window.location.origin}${window.location.pathname}#data=${encodedData}`; navigator.clipboard.writeText(url).then(() => { alert('共有URLをクリップボードにコピーしました。'); }, () => { prompt('URLのコピーに失敗しました。以下のURLを手動でコピーしてください:', url); }); } catch (e) { alert('URLの生成に失敗しました。'); console.error(e); } }
function loadFromUrl() { if (window.location.hash.startsWith('#data=')) { try { const encodedData = window.location.hash.substring(6); const jsonString = decodeURIComponent(atob(encodedData)); const data = JSON.parse(jsonString); document.querySelectorAll('.calc-input').forEach(input => { if (data[input.id] !== undefined) { if (input.type === 'checkbox') input.checked = data[input.id]; else input.value = data[input.id]; } }); document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => { const select = wrapper.querySelector('select'); if (select && data[select.id] !== undefined) { const triggerSpan = wrapper.querySelector('.custom-select-trigger span'); const selectedOption = wrapper.querySelector(`.custom-option[data-value="${select.id}"]`); if (triggerSpan && selectedOption) { triggerSpan.textContent = selectedOption.textContent; wrapper.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected')); selectedOption.classList.add('selected'); } } }); window.history.pushState("", document.title, window.location.pathname + window.location.search); } catch (e) { console.error('Failed to load data from URL:', e); alert('URLからのデータ読み込みに失敗しました。'); } } }
