// ===============================================================
// ** まおりゅうダメージ計算機 (最終完成版) **
// ===============================================================

// --- グローバル変数 ---
const calcInputs = document.querySelectorAll('.calc-input');
const DATA_PRESET_KEY_PREFIX = 'maoryuDataPreset_v2';
const SKILL_PRESET_KEY = 'maoryuSkillPresets_v2';
const MAX_DATA_SLOTS = 10;
const THEME_KEY = 'maoryuTheme';
let draggedItem = null;

// --- 補助関数 ---
function p(id) {
  const el = document.getElementById(id);
  const baseValue = parseFloat(el?.placeholder) || 0;
  const userValue = parseFloat(el?.value) || 0;
  return (baseValue + userValue) / 100;
}
function v(id) {
  const el = document.getElementById(id);
  const baseValue = parseFloat(el?.placeholder) || 0;
  const userValue = parseFloat(el?.value) || 0;
  return baseValue + userValue;
}
function c(id) { return document.getElementById(id)?.checked; }
function s(id) { return document.getElementById(id)?.value; }
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
// ** スキルプリセット機能 **
// ===============================================================
const skillPresetStructure = [
  { category: '状態異常', type: 'state', id: 'is-charmed', label: '魅了/束縛' }, { category: '状態異常', type: 'state', id: 'is-frostbite', label: '凍傷' },
  { category: '状態異常', type: 'state', id: 'is-dominated', label: '支配' }, { category: '状態異常', type: 'state', id: 'is-tremor', label: '戦慄' },
  { category: '状態異常', type: 'state', id: 'is-dragon-aura', label: '竜気状態' },
  { category: 'バフ', type: 'text', id: 'attack-buff', label: '攻撃バフ' }, { category: 'バフ', type: 'text', id: 'attr-buff', label: '属性バフ' },
  { category: 'バフ', type: 'text', id: 'pm-buff', label: '物魔バフ' }, { category: 'バフ', type: 'text', id: 'aoe-attack-buff', label: '全体攻撃バフ' },
  { category: 'バフ', type: 'text', id: 'ultimate-buff', label: '奥義バフ' }, { category: 'バフ', type: 'text', id: 'extreme-ultimate-buff', label: '極奥義バフ' },
  { category: 'バフ', type: 'text', id: 'pm-damage-up', label: '物魔ダメージ威力バフ' }, { category: 'バフ', type: 'text', id: 'attr-damage-up', label: '属性ダメージ威力バフ' },
  { category: 'バフ', type: 'text', id: 'soul-buff', label: '魔創魂バフ' }, { category: 'バフ', type: 'text', id: 'charm-special-buff', label: '魅了特攻' },
  { category: 'バフ', type: 'text', id: 'stun-special-buff', label: '気絶特攻' }, { category: 'バフ', type: 'text', id: 'weak-point-buff', label: '弱点特攻' },
  { category: 'バフ', type: 'text', id: 'defense-buff', label: '防御力バフ' }, { category: 'バフ', type: 'text', id: 'crit-buff', label: '会心力バフ' },
  { category: 'バフ', type: 'text', id: 'pierce-buff', label: '貫通力バフ' }, { category: 'バフ', type: 'text', id: 'synergy-buff', label: '協心力バフ' },
  { category: 'バフ', type: 'text', id: 'kensan-buff', label: '堅閃力バフ' },
  { category: 'デバフ', type: 'text', id: 'single-target-resist-debuff', label: '単体攻撃耐性デバフ' }, { category: 'デバフ', type: 'text', id: 'aoe-resist-debuff', label: '全体攻撃耐性デバフ' },
  { category: 'デバフ', type: 'text', id: 'attr-resist-debuff', label: '属性耐性デバフ' }, { category: 'デバフ', type: 'text', id: 'pm-resist-debuff', label: '物魔耐性デバフ' },
  { category: 'デバフ', type: 'text', id: 'ultimate-resist-debuff', label: '奥義耐性デバフ' }, { category: 'デバフ', type: 'text', id: 'pm-resist-down', label: '物魔ダメージ威力デバフ' },
  { category: 'デバフ', type: 'text', id: 'attr-resist-down', label: '属性ダメージ威力デバフ' }, { category: 'デバフ', type: 'text', id: 'weak-point-resist-debuff', label: '弱点耐性デバフ' },
  { category: 'デバフ', type: 'text', id: 'defense-debuff', label: '防御力デバフ' }, { category: 'デバフ', type: 'text', id: 'crit-resist-debuff', label: '会心耐性デバフ' },
  { category: 'デバフ', type: 'text', id: 'pierce-resist-debuff', label: '貫通耐性デバフ' }, { category: 'デバフ', type: 'text', id: 'synergy-resist-debuff', label: '協心耐性デバフ' },
  { category: 'デバフ', type: 'text', id: 'kensan-resist-debuff', label: '堅閃耐性デバフ' }
];

function renderSkillPresetEditor() {
  const editor = document.getElementById('skill-preset-editor');
  if (!editor) return;
  editor.innerHTML = '';
  const savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY);
  savedSkillPresets.forEach((preset, i) => {
    const card = document.createElement('div');
    card.className = 'skill-preset-card';
    card.draggable = true;
    card.dataset.index = i;
    const categories = { '状態異常': '', 'バフ': '', 'デバフ': '' };
    skillPresetStructure.forEach(skill => {
      let inputHTML = '';
      const value = preset.buffs?.[skill.id] || '';
      const hasValueClass = value ? ' has-value' : '';
      if (skill.type === 'text') {
        inputHTML = `<div class="input-group"><input class="ef${hasValueClass}" type="number" id="skill-preset-${i}-${skill.id}" value="${value}"><label>${skill.label}</label><span class="focus_line"></span></div>`;
      } else if (skill.type === 'state') {
        inputHTML = `<div class="checkbox-group"><input type="checkbox" id="skill-preset-${i}-${skill.id}" ${preset.states?.[skill.id] ? 'checked' : ''}><label for="skill-preset-${i}-${skill.id}">${skill.label}</label></div>`;
      }
      if (categories[skill.category] !== undefined) categories[skill.category] += inputHTML;
    });
    let contentHTML = '<div class="skill-preset-content">';
    for (const [categoryName, categoryHTML] of Object.entries(categories)) {
      if (categoryHTML) contentHTML += `<div class="skill-preset-category"><h5>${categoryName}</h5><div class="skill-preset-grid">${categoryHTML}</div></div>`;
    }
    contentHTML += '</div>';
    card.innerHTML = `<h4><input type="text" class="preset-name-input" id="skill-preset-${i}-name" value="${preset.name || ''}" placeholder="スキルセット ${i + 1}"><button class="save-skill-preset-btn" data-action="save-skill" data-slot="${i}" title="上書き保存"><i class="fas fa-save"></i></button><button class="delete-skill-preset-btn" data-action="delete-skill" data-slot="${i}" title="削除"><i class="fas fa-trash-alt"></i></button></h4>${contentHTML}`;
    editor.appendChild(card);
  });
  const newCardEl = document.createElement('div');
  newCardEl.className = 'skill-preset-card new-skill-preset-card';
  newCardEl.id = 'new-skill-preset-creator';
  newCardEl.title = `新規スキルプリセットを作成`;
  newCardEl.innerHTML = `<i class="fas fa-plus"></i>`;
  editor.appendChild(newCardEl);
}

function saveSkillPreset(slot, isNew = false) {
  let savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY);
  const sourceIndex = isNew ? 'new' : slot;
  const nameInput = document.getElementById(`skill-preset-${sourceIndex}-name`);
  let name = nameInput ? nameInput.value.trim() : '';
  if (isNew) {
    if (!name) { alert('新しいプリセットの名前を入力してください。'); nameInput.focus(); return; }
  }
  const preset = { name: name || `スキルセット ${slot + 1}`, buffs: {}, states: {} };
  skillPresetStructure.forEach(skill => {
    const inputId = `skill-preset-${sourceIndex}-${skill.id}`;
    if (skill.type === 'text') { const value = v(inputId); if (value) preset.buffs[skill.id] = value; }
    else if (skill.type === 'state') { const checked = c(inputId); if (checked) preset.states[skill.id] = true; }
  });
  if (isNew) savedSkillPresets.push(preset);
  else savedSkillPresets[slot] = preset;
  localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(savedSkillPresets));
  alert(`「${preset.name}」を保存しました。`);
  renderSkillPresetEditor();
  renderSkillPresetActivator();
}

function deleteSkillPreset(slot) {
  let savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY);
  const presetName = savedSkillPresets[slot]?.name || `スロット ${slot + 1}`;
  if (confirm(`スキルプリセット「${presetName}」を本当に削除しますか？`)) {
    savedSkillPresets.splice(slot, 1);
    localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(savedSkillPresets));
    alert('プリセットを削除しました。');
    renderSkillPresetEditor();
    renderSkillPresetActivator();
    calculateDamage();
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
    if (skill.type === 'text') { inputHTML = `<div class="input-group"><input class="ef" type="number" id="skill-preset-new-${skill.id}"><label>${skill.label}</label><span class="focus_line"></span></div>`; }
    else if (skill.type === 'state') { inputHTML = `<div class="checkbox-group"><input type="checkbox" id="skill-preset-new-${skill.id}"><label for="skill-preset-new-${skill.id}">${skill.label}</label></div>`; }
    if (categories[skill.category] !== undefined) categories[skill.category] += inputHTML;
  });
  for (const [categoryName, categoryHTML] of Object.entries(categories)) {
    if (categoryHTML) contentHTML += `<div class="skill-preset-category"><h5>${categoryName}</h5><div class="skill-preset-grid">${categoryHTML}</div></div>`;
  }
  contentHTML += '</div>';
  card.innerHTML = `<h4><input type="text" class="preset-name-input" id="skill-preset-new-name" placeholder="新しいプリセット名"><button class="save-skill-preset-btn" data-action="save-new" title="新規保存"><i class="fas fa-save"></i></button></h4>${contentHTML}`;
  editor.insertBefore(card, newCardCreator);
  newCardCreator.style.display = 'none';
}

function renderSkillPresetActivator() {
  const activator = document.getElementById('skill-preset-activator');
  if (!activator) return;
  const savedStates = {};
  activator.querySelectorAll('.skill-preset-activator-cb:checked').forEach(cb => savedStates[cb.id] = true);
  activator.innerHTML = '';
  const savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY);
  savedSkillPresets.forEach((preset, i) => {
    if (preset && preset.name) {
      const div = document.createElement('div');
      div.className = 'checkbox-group';
      const id = `activate-skill-preset-${i}`;
      div.innerHTML = `<input type="checkbox" class="calc-input skill-preset-activator-cb" id="${id}" ${savedStates[id] ? 'checked' : ''}><label for="${id}">${preset.name}</label>`;
      activator.appendChild(div);
    }
  });
}

function applySkillPresets() {
  document.querySelectorAll('.calc-input[type="number"]').forEach(input => {
    input.placeholder = '';
    $(input).toggleClass('has-value', input.value.trim() !== '');
  });
  document.querySelectorAll('.calc-input[type="checkbox"]:disabled').forEach(cb => { cb.checked = false; cb.disabled = false; });
  const baseBuffs = {}, baseStates = {};
  const savedSkillPresets = getStoredJSON(SKILL_PRESET_KEY);
  savedSkillPresets.forEach((preset, i) => {
    if (c(`activate-skill-preset-${i}`)) {
      Object.entries(preset.buffs || {}).forEach(([id, value]) => { baseBuffs[id] = (baseBuffs[id] || 0) + value; });
      Object.keys(preset.states || {}).forEach(id => { baseStates[id] = true; });
    }
  });
  Object.entries(baseBuffs).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) {
      input.placeholder = value;
      $(input).toggleClass('has-value', input.value.trim() !== '' || input.placeholder.trim() !== '');
    }
  });
  Object.keys(baseStates).forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = true;
      checkbox.disabled = true;
    }
  });
}


// ===============================================================
// ** メインダメージ計算ロジック **
// ===============================================================
function calculateDamage() {
  const resultDiv = document.getElementById('damage-result');
  try {
    applySkillPresets();
    const baseAttack = v('base-attack-power');
    const baseDefense = v('base-defense-power');
    const enemyBaseDefense = v('enemy-defense-power');
    const baseSupportAttack = v('support-attack-power');
    const ultimateMagnification = p('ultimate-magnification');
    const dragonAuraCorrect = c('is-dragon-aura') ? 1.2 : 1;
    const charmCorrect = c('is-charmed') ? 0.95 : 1;
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
    const attrBuffTotal = p('attr-buff') + p('attr-buff-cumulative') + p('attr-buff-divine-lead') + p('attr-buff-divine-lead-support');
    const pmBuffTotal = p('pm-buff') + p('pm-buff-cumulative') + p('pm-buff-divine-lead') + p('pm-buff-divine-lead-support') + p('pm-buff-divine-trait') + p('pm-buff-divine-trait-support');
    const aoeAttackBuffTotal = p('aoe-attack-buff') + p('aoe-attack-buff-cumulative');
    const ultimateBuffTotal = p('ultimate-buff') + p('ultimate-buff-cumulative');
    const extremeUltimateBuffTotal = p('extreme-ultimate-buff');
    const soulBuffTotal = p('soul-buff');
    const charmSpecialTotal = p('charm-special-buff');
    const stunSpecialTotal = p('stun-special-buff');
    const affinityUpTotal = p('affinity-up-buff');
    const weakPointBuffTotal = p('weak-point-buff') + p('weak-point-infinite-buff');
    const weakPointResistDebuffTotal = p('weak-point-resist-debuff');
    const pmDamageUpTotal = p('pm-damage-up');
    const attrDamageUpTotal = p('attr-damage-up');
    const pmResistDownTotal = p('pm-resist-down');
    const attrResistDownTotal = p('attr-resist-down');
    const defenseDebuffTotal = p('defense-debuff') + p('defense-debuff-divine-trait');
    const pmResistDebuffTotal = p('pm-resist-debuff');
    const attrResistDebuffTotal = p('attr-resist-debuff');
    const ultimateResistDebuffTotal = p('ultimate-resist-debuff');
    const singleTargetResistDebuffTotal = p('single-target-resist-debuff');
    const aoeResistDebuffTotal = p('aoe-resist-debuff');
    const critPowerTotal = p('crit-buff') + p('crit-ex-talent') + p('crit-special-stat') + p('crit-trait') + p('crit-divine-trait') + p('crit-divine-trait-support') + p('crit-engraved-seal');
    const critResistDebuffTotal = p('crit-resist-debuff') + p('crit-resist-debuff-trait') + p('crit-resist-debuff-divine-trait') + p('crit-resist-debuff-divine-trait-support');
    const piercePowerTotal = p('pierce-buff') + p('pierce-ex-talent') + p('pierce-special-stat') + p('pierce-trait') + p('pierce-divine-trait') + p('pierce-divine-trait-support') + p('pierce-engraved-seal');
    const pierceResistDebuffTotal = p('pierce-resist-debuff') + p('pierce-resist-debuff-trait') + p('pierce-resist-debuff-divine-trait') + p('pierce-resist-debuff-divine-trait-support');
    const synergyPowerTotal = p('synergy-buff') + p('synergy-ex-talent') + p('synergy-special-stat') + p('synergy-trait');
    const synergyResistDebuffTotal = p('synergy-resist-debuff') + p('synergy-resist-debuff-trait');
    const kensanPowerTotal = p('kensan-buff') + p('kensan-ex-talent') + p('kensan-special-stat') + p('kensan-trait');
    const kensanResistDebuffTotal = p('kensan-resist-debuff') + p('kensan-resist-debuff-trait');
    const displayAttack = baseAttack * (1 + attackBuffTotal * dragonAuraCorrect) * charmCorrect;
    const displayDefense = baseDefense * (1 + defenseBuffTotal);
    const enemyActualDefense = enemyBaseDefense * (1 - defenseDebuffTotal * debuffAmpCorrect) * (1 - pmResistDebuffTotal * debuffAmpCorrect) * (1 - attrResistDebuffTotal * debuffAmpCorrect);
    const baseActualAttack = displayAttack * (1 + attrBuffTotal * dragonAuraCorrect) * (1 + pmBuffTotal * dragonAuraCorrect);
    const aoeActualAttack = baseActualAttack * (1 + aoeAttackBuffTotal * dragonAuraCorrect);
    const kensanAddedAttack = (displayDefense * 0.4) * (1 + attrBuffTotal * dragonAuraCorrect) * (1 + pmBuffTotal * dragonAuraCorrect);
    const supportActualAttackSingle = baseSupportAttack * (1 + attrBuffTotal * dragonAuraCorrect) * (1 + pmBuffTotal * dragonAuraCorrect) * 0.4;
    const supportActualAttackAoe = baseSupportAttack * (1 + attrBuffTotal * dragonAuraCorrect) * (1 + pmBuffTotal * dragonAuraCorrect) * (1 + aoeAttackBuffTotal * dragonAuraCorrect) * 0.4;
    const isAoe = (attackType === 'aoe');
    const mainActualAttack = isAoe ? aoeActualAttack : baseActualAttack;
    const supportActualAttack = isAoe ? supportActualAttackAoe : supportActualAttackSingle;
    const normalBaseDmg = (mainActualAttack * 2 - enemyActualDefense) * 0.2;
    const synergyBaseDmg = ((mainActualAttack + supportActualAttack) * 2 - enemyActualDefense) * 0.2;
    const kensanBaseDmg = ((mainActualAttack + kensanAddedAttack) * 2 - enemyActualDefense) * 0.2;
    const synergyKensanBaseDmg = ((mainActualAttack + supportActualAttack + kensanAddedAttack) * 2 - enemyActualDefense) * 0.2;
    const critTTL = 1.3 + (critPowerTotal * dragonAuraCorrect) + (critResistDebuffTotal * debuffAmpCorrect);
    const pierceTTL = 1 + (piercePowerTotal * dragonAuraCorrect) + (pierceResistDebuffTotal * debuffAmpCorrect);
    const synergyTTL = 1 + (synergyPowerTotal * dragonAuraCorrect) + (synergyResistDebuffTotal * debuffAmpCorrect);
    const kensanTTL = 1 + (kensanPowerTotal * dragonAuraCorrect) + (kensanResistDebuffTotal * debuffAmpCorrect);
    let finalAffinityCorrect = (s('affinity') === 'eiketsu') ? 1.6 : affinityCorrect;
    const affinityWeaknessCoeff = (finalAffinityCorrect * (1 + affinityUpTotal * dragonAuraCorrect)) + (weakPointBuffTotal * dragonAuraCorrect) + (weakPointResistDebuffTotal * debuffAmpCorrect);
    const targetResistDebuffTotal = isAoe ? aoeResistDebuffTotal : singleTargetResistDebuffTotal;
    const specialResistCoeff = (1 + (stunSpecialTotal + charmSpecialTotal) * dragonAuraCorrect) * (1 + targetResistDebuffTotal * debuffAmpCorrect);
    const damagePowerCoeff = (1 + pmDamageUpTotal * dragonAuraCorrect) * (1 + pmResistDownTotal * debuffAmpCorrect) * (1 + attrDamageUpTotal * dragonAuraCorrect) * (1 + attrResistDownTotal * debuffAmpCorrect);
    const ultimateCoeff = ultimateMagnification * (1 + ultimateBuffTotal + extremeUltimateBuffTotal) * (1 + ultimateResistDebuffTotal * debuffAmpCorrect);
    const commonCoeff = affinityWeaknessCoeff * specialResistCoeff * damagePowerCoeff;
    const skillBase = { normal: normalBaseDmg * commonCoeff, synergy: synergyBaseDmg * commonCoeff, kensan: kensanBaseDmg * commonCoeff, synergyKensan: synergyKensanBaseDmg * commonCoeff };
    const ultimateBase = { normal: skillBase.normal * ultimateCoeff, synergy: skillBase.synergy * ultimateCoeff, kensan: skillBase.kensan * ultimateCoeff, synergyKensan: skillBase.synergyKensan * ultimateCoeff };
    function applyEffects(damage, hasSynergy, hasKensan) { let finalDmg = damage; if (hasSynergy) finalDmg *= synergyTTL; if (hasKensan) finalDmg *= kensanTTL; finalDmg *= (1 + soulBuffTotal); return finalDmg > 0 ? finalDmg : 0; }
    const skillFinal = { normal: applyEffects(skillBase.normal, false, false), synergy: applyEffects(skillBase.synergy, true, false), kensan: applyEffects(skillBase.kensan, false, true), synergyKensan: applyEffects(skillBase.synergyKensan, true, true) };
    const ultimateFinal = { normal: applyEffects(ultimateBase.normal, false, false), synergy: applyEffects(ultimateBase.synergy, true, false), kensan: applyEffects(ultimateBase.kensan, false, true), synergyKensan: applyEffects(ultimateBase.synergyKensan, true, true) };
    const critRate = p('crit-rate');
    const pierceRate = p('pierce-rate');

    function calculateExpectedDamage(normal, crit, pierce, critPierce) {
      if (critRate === 0 && pierceRate === 0) return normal;
      const c = critRate; const p = pierceRate;
      return (normal * (1 - c) * (1 - p)) + (crit * c * (1 - p)) + (pierce * (1 - c) * p) + (critPierce * c * p);
    }

    function generateResultHtml(title, baseResults) {
      let html = `<h3 class="result-header is-open">${title}<i class="fas fa-chevron-down"></i></h3><div class="result-content-collapsible is-open"><table>`;
      const types = [{ key: 'normal', name: '通常' }, { key: 'synergy', name: '協心' }, { key: 'kensan', name: '堅閃' }, { key: 'synergyKensan', name: '協心+堅閃' }];
      types.forEach(type => {
        const damage = baseResults[type.key];
        if (damage <= 0 && type.key !== 'normal') return;
        const critDmg = damage * critTTL;
        const pierceDmg = (damage + displayAttack * 0.06) * pierceTTL;
        const critPierceDmg = (critDmg + displayAttack * 0.06) * pierceTTL;
        const expectedDmg = calculateExpectedDamage(damage, critDmg, pierceDmg, critPierceDmg);
        html += `<tr><td colspan="2" class="result-type-header">▼ ${type.name}</td></tr>
                         <tr><td>基礎</td><td>${Math.round(damage).toLocaleString()}</td></tr>
                         <tr><td>会心</td><td>${Math.round(critDmg).toLocaleString()}</td></tr>
                         <tr><td>貫通</td><td>${Math.round(pierceDmg).toLocaleString()}</td></tr>
                         <tr><td>会心+貫通</td><td>${Math.round(critPierceDmg).toLocaleString()}</td></tr>`;
        if (critRate > 0 || pierceRate > 0) {
          html += `<tr><td><strong>期待値</strong></td><td><strong>${Math.round(expectedDmg).toLocaleString()}</strong></td></tr>`;
        }
      });
      return html + `</table></div>`;
    }

    resultDiv.innerHTML = `
            <h3 class="result-header is-open">ステータス<i class="fas fa-chevron-down"></i></h3>
            <div class="result-content-collapsible is-open">
                <table>
                    <tr><td>表示攻撃力</td><td>${Math.round(displayAttack).toLocaleString()}</td></tr>
                    <tr><td>実攻撃力(${isAoe ? '全体' : '単体'})</td><td>${Math.round(mainActualAttack).toLocaleString()}</td></tr>
                    <tr><td>敵の実防御力</td><td>${Math.round(enemyActualDefense).toLocaleString()}</td></tr>
                </table>
            </div>
            ${generateResultHtml('通常ダメージ', skillFinal)}
            ${generateResultHtml('奥義ダメージ', ultimateFinal)}`;

    renderGraph({ '通常ダメージ': skillFinal, '奥義ダメージ': ultimateFinal });

  } catch (error) {
    resultDiv.innerHTML = `<p style="color: #ff5c5c;">計算エラーが発生しました。<br><small>${error.message}</small></p>`;
    console.error("Calculation Error:", error);
  }
}

// ===============================================================
// ** 新機能：グラフ表示、URL共有、D&Dなど **
// ===============================================================
function renderGraph(results) {
  const container = document.getElementById('graph-container');
  if (!container) return;

  let graphHTML = '<h3>ダメージグラフ</h3><div class="graph">';
  const allDamages = [];
  for (const title in results) {
    const data = results[title];
    for (const type in data) {
      if (data[type] > 0) {
        let label = '';
        switch (type) {
          case 'normal': label = '通常'; break;
          case 'synergy': label = '協心'; break;
          case 'kensan': label = '堅閃'; break;
          case 'synergyKensan': label = '協心+堅閃'; break;
        }
        if (title === '奥義ダメージ') label += '(奥義)';
        allDamages.push({ label: label, value: data[type] });
      }
    }
  }

  if (allDamages.length > 0) {
    const maxValue = Math.max(...allDamages.map(d => d.value));
    allDamages.forEach(item => {
      const barWidth = (item.value / maxValue) * 100;
      graphHTML += `<div class="graph-item"><div class="graph-label" title="${item.label}">${item.label}</div><div class="graph-bar-container"><div class="graph-bar" style="width: ${barWidth}%;">${Math.round(item.value).toLocaleString()}</div></div></div>`;
    });
  } else {
    graphHTML += '<p>計算結果がありません。</p>';
  }

  graphHTML += '</div>';
  container.innerHTML = graphHTML;
}

function generateShareableUrl() {
  const dataToShare = {};
  document.querySelectorAll('.calc-input').forEach(input => {
    dataToShare[input.id] = (input.type === 'checkbox') ? input.checked : input.value;
  });
  try {
    const jsonString = JSON.stringify(dataToShare);
    const encodedData = btoa(encodeURIComponent(jsonString));
    const url = `${window.location.origin}${window.location.pathname}#data=${encodedData}`;
    navigator.clipboard.writeText(url).then(() => { alert('共有URLをクリップボードにコピーしました。'); }, () => { prompt('URLのコピーに失敗しました。以下のURLを手動でコピーしてください:', url); });
  } catch (e) {
    alert('URLの生成に失敗しました。');
    console.error(e);
  }
}

function loadFromUrl() {
  if (window.location.hash.startsWith('#data=')) {
    try {
      const encodedData = window.location.hash.substring(6);
      const jsonString = decodeURIComponent(atob(encodedData));
      const data = JSON.parse(jsonString);
      document.querySelectorAll('.calc-input').forEach(input => {
        if (data[input.id] !== undefined) {
          if (input.type === 'checkbox') input.checked = data[input.id];
          else input.value = data[input.id];
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    } catch (e) {
      console.error('Failed to load data from URL:', e);
      alert('URLからのデータ読み込みに失敗しました。');
    }
  }
}

// ===============================================================
// ** データプリセット管理機能 **
// ===============================================================
function renderDataPresetButtons() {
  const container = document.getElementById('preset-buttons'); if (!container) return;
  container.innerHTML = ''; let lastSavedSlot = 0;
  for (let i = 1; i <= MAX_DATA_SLOTS; i++) {
    const key = `${DATA_PRESET_KEY_PREFIX}${i}`;
    const savedData = getStoredJSON(key, null);
    if (savedData) {
      const presetName = savedData.name || `スロット${i}`;
      const slotEl = document.createElement('div');
      slotEl.className = 'preset-card';
      slotEl.draggable = true;
      slotEl.dataset.index = i;
      slotEl.innerHTML = `<div class="preset-name" title="${presetName}">${presetName}</div><div class="preset-actions"><button class="preset-btn load-btn" data-action="load-data" data-slot="${i}" title="読込"><i class="fas fa-download"></i></button><button class="preset-btn save-btn" data-action="save-data" data-slot="${i}" title="上書き保存"><i class="fas fa-save"></i></button><button class="preset-btn delete-btn" data-action="delete-data" data-slot="${i}" title="削除"><i class="fas fa-trash-alt"></i></button></div>`;
      container.appendChild(slotEl);
      lastSavedSlot = i;
    }
  }
  if (lastSavedSlot < MAX_DATA_SLOTS) {
    const nextSlot = lastSavedSlot + 1;
    const newCardEl = document.createElement('div');
    newCardEl.className = 'preset-card new-preset-card';
    newCardEl.dataset.action = 'save-data';
    newCardEl.dataset.slot = nextSlot;
    newCardEl.innerHTML = `<i class="fas fa-plus"></i>`;
    container.appendChild(newCardEl);
  }
}
function saveDataPreset(slot) {
  const key = `${DATA_PRESET_KEY_PREFIX}${slot}`;
  const existingName = getStoredJSON(key, { name: `データセット ${slot}` }).name;
  const name = prompt('このデータセットの名前を入力してください:', existingName);
  if (name === null) return;
  const presetData = {};
  document.querySelectorAll('.calc-input').forEach(input => { presetData[input.id] = (input.type === 'checkbox') ? input.checked : input.value; });
  const dataToStore = { name: name.trim() || `データセット ${slot}`, data: presetData };
  localStorage.setItem(key, JSON.stringify(dataToStore));
  alert(`スロット${slot}に「${dataToStore.name}」を保存しました。`);
  renderDataPresetButtons();
}
function loadDataPreset(slot) {
  const savedData = getStoredJSON(`${DATA_PRESET_KEY_PREFIX}${slot}`, null);
  if (savedData) {
    if (!savedData.data) { alert(`スロット${slot}のデータが破損しています。`); return; }
    document.querySelectorAll('.calc-input').forEach(input => {
      if (savedData.data[input.id] !== undefined) {
        if (input.type === 'checkbox') input.checked = savedData.data[input.id];
        else input.value = savedData.data[input.id];
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    calculateDamage();
    alert(`「${savedData.name}」を読み込みました。`);
  } else { alert(`スロット${slot}に保存されたデータがありません。`); }
}
function deleteDataPreset(slot) {
  const key = `${DATA_PRESET_KEY_PREFIX}${slot}`;
  const presetName = getStoredJSON(key, { name: `スロット ${slot}` }).name;
  if (confirm(`データプリセット「${presetName}」を本当に削除しますか？`)) {
    localStorage.removeItem(key);
    alert('プリセットを削除しました。');
    renderDataPresetButtons();
  }
}
function clearInputs() {
  if (confirm('すべての入力値をクリアしますか？')) {
    document.querySelectorAll('.calc-input').forEach(input => {
      if (input.type === 'checkbox') input.checked = false;
      else if (input.tagName.toLowerCase() === 'select') input.selectedIndex = 0;
      else input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    calculateDamage();
  }
}

// ===============================================================
// ** インポート・エクスポート機能 **
// ===============================================================
function exportPresets() {
  let filename = prompt("書き出すファイル名を入力してください:", "maoryu-presets.json");
  if (!filename || filename.trim() === "") { alert("エクスポートをキャンセルしました。"); return; }
  if (!filename.toLowerCase().endsWith('.json')) filename += '.json';
  if (confirm(`ファイル名「${filename}」でプリセットを書き出しますか？`)) {
    const exportData = { skillPresets: getStoredJSON(SKILL_PRESET_KEY), dataPresets: {} };
    for (let i = 1; i <= MAX_DATA_SLOTS; i++) {
      const data = getStoredJSON(`${DATA_PRESET_KEY_PREFIX}${i}`, null);
      if (data) exportData.dataPresets[i] = data;
    }
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else { alert("エクスポートをキャンセルしました。"); }
}
function importPresets(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (!importedData.skillPresets && !importedData.dataPresets) throw new Error('無効なファイル形式です。');
      if (confirm('現在のプリセットを上書きしてインポートしますか？この操作は元に戻せません。')) {
        if (Array.isArray(importedData.skillPresets)) localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(importedData.skillPresets));
        Object.keys(localStorage).forEach(key => { if (key.startsWith(DATA_PRESET_KEY_PREFIX)) localStorage.removeItem(key); });
        if (importedData.dataPresets) {
          for (const i in importedData.dataPresets) { if (i >= 1 && i <= MAX_DATA_SLOTS) localStorage.setItem(`${DATA_PRESET_KEY_PREFIX}${i}`, JSON.stringify(importedData.dataPresets[i])); }
        }
        alert('プリセットのインポートが完了しました。');
        renderSkillPresetEditor(); renderSkillPresetActivator(); renderDataPresetButtons(); calculateDamage();
      }
    } catch (error) { alert(`インポートに失敗しました: ${error.message}`); } finally { event.target.value = null; }
  };
  reader.readAsText(file);
}

// ===============================================================
// ** サイト全体のUI機能 **
// ===============================================================
$(function () {
  function debounce(func, wait) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }

  $('#preset-buttons').on('click', '.preset-btn, .new-preset-card', function () {
    const action = $(this).data('action'); const slot = $(this).data('slot');
    if (action === 'save-data') saveDataPreset(slot);
    else if (action === 'load-data') loadDataPreset(slot);
    else if (action === 'delete-data') deleteDataPreset(slot);
  });
  $('#skill-preset-editor').on('click', '[data-action]', function () {
    const action = $(this).data('action'); const slot = $(this).data('slot');
    if (action === 'save-skill') saveSkillPreset(slot);
    else if (action === 'delete-skill') deleteSkillPreset(slot);
    else if (action === 'save-new') saveSkillPreset(null, true);
  });
  $('#skill-preset-editor').on('click', '#new-skill-preset-creator', addNewSkillPresetCard);

  $('#clear-inputs').on('click', clearInputs);
  $('body').on('click', '.collapsible-header', function () { $(this).closest('.form-section').toggleClass('is-open'); });
  $('.openclose').on('click', function () { $(this).toggleClass('is-open').next('.preset-editor-container').slideToggle(300); });
  $('#damage-result').on('click', '.result-header', function () { $(this).toggleClass('is-open').next('.result-content-collapsible').slideToggle(300); });

  $('#export-presets').on('click', exportPresets);
  $('#import-presets').on('click', () => $('#import-file-input').click());
  $('#import-file-input').on('change', importPresets);
  $('#share-url-btn').on('click', generateShareableUrl);
  $('#show-graph-btn').on('click', () => $('#graph-container').slideToggle());

  const debouncedCalculate = debounce(calculateDamage, 400);
  $('body').on('input', '.calc-input', debouncedCalculate);

  let currentZoomLevel = 0;
  const result_content = document.getElementById('damage-result');
  function updateZoom() { const scale = 1.0 + (currentZoomLevel * 0.1); if (result_content) result_content.style.setProperty('--result-scale', scale.toFixed(2)); }
  $('#zoom-in').on('click', () => { if (currentZoomLevel < 5) { currentZoomLevel++; updateZoom(); } });
  $('#zoom-out').on('click', () => { if (currentZoomLevel > -3) { currentZoomLevel--; updateZoom(); } });

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) document.body.classList.add(savedTheme);
  $('.theme-switcher').on('click', function () {
    document.body.classList.toggle('light-theme');
    localStorage.setItem(THEME_KEY, document.body.classList.contains('light-theme') ? 'light-theme' : '');
  });

  loadFromUrl();
  renderSkillPresetEditor();
  renderSkillPresetActivator();
  renderDataPresetButtons();
  calculateDamage();

  const $menubar = $('#menubar'); const $menubarHdr = $('#menubar_hdr');
  $(window).on("load resize", debounce(() => {
    if (window.innerWidth < 900) { $('body').addClass('small-screen').removeClass('large-screen'); $menubar.removeClass('display-block'); $menubarHdr.removeClass('display-none ham'); }
    else { $('body').addClass('large-screen').removeClass('small-screen'); $menubar.addClass('display-block'); $menubarHdr.addClass('display-none'); }
  }, 100));
  $menubarHdr.on('click', function () { $(this).toggleClass('ham'); $menubar.toggleClass('display-block'); });
  $menubar.on('click', 'a[href^="#"]', function () { $menubar.removeClass('display-block'); $menubarHdr.removeClass('ham'); });
  if ($menubarHdr.length) { const observer = new MutationObserver(() => { $('body').css({ overflow: $menubarHdr.hasClass('ham') ? 'hidden' : '', height: $menubarHdr.hasClass('ham') ? '100vh' : '' }); }); observer.observe($menubarHdr[0], { attributes: true, attributeFilter: ['class'] }); }
  const topButton = $('.pagetop'); topButton.hide();
  function smoothScroll(target) { const scrollTo = target === '#' ? 0 : $(target).offset().top; $('html, body').animate({ scrollTop: scrollTo }, 500); }
  $('body').on('click', 'a[href^="#"], .pagetop', function (e) { e.preventDefault(); smoothScroll($(this).attr('href') || '#'); });
  $(window).on('scroll', debounce(() => { topButton.fadeToggle($(window).scrollTop() >= 300); }, 100));
  if (window.location.hash && !window.location.hash.startsWith('#data=')) {
    $('html, body').scrollTop(0);
    setTimeout(() => smoothScroll(window.location.hash), 10);
  }
  function checkVisibility() {
    const viewportHeight = $(window).height(); const scrollTop = $(window).scrollTop(); const activationPoint = scrollTop + viewportHeight * 0.5;
    $(".section").each(function () { const sectionTop = $(this).offset().top; $(this).toggleClass("active", activationPoint > sectionTop); });
  }
  $(window).on("scroll", debounce(checkVisibility, 50)); checkVisibility();
  $('body').on('input', '.ef', function () { $(this).toggleClass('has-value', this.value.trim() !== '' || this.placeholder.trim() !== ''); });
});