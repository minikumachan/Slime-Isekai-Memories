// ===============================================================
// ** presets.js - プリセット管理モジュール (修正版) **
// ===============================================================
import { db } from './firebase.js';
import { getInputsAsDataObject, loadInputsFromDataObject } from './state.js';
import { DATA_PRESET_KEY_LOCAL, SKILL_PRESET_KEY, skillPresetStructure } from './constants.js';
import { showToast, closeModal, calculateAndRender, showCustomPrompt, showCustomConfirm } from './ui.js';

const CHARACTER_DEX_KEY_LOCAL = "maoryuCharacterDex_local";

// ===============================================================
// Data Preset Logic
// ===============================================================

async function getDataPresets(appState) {
  if (appState.currentUser) {
    const snapshot = await db.collection('users').doc(appState.currentUser.uid).collection('dataPresets').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  return getStoredJSON(DATA_PRESET_KEY_LOCAL, []);
}

async function saveDataPresets(presets, appState) {
  if (appState.currentUser) {
    const batch = db.batch();
    const collectionRef = db.collection('users').doc(appState.currentUser.uid).collection('dataPresets');
    // This is a simplified sync
    const snapshot = await collectionRef.get();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    presets.forEach(preset => {
      const { id, ...data } = preset;
      const docRef = collectionRef.doc(id || `preset_${Date.now()}`);
      batch.set(docRef, data);
    });
    await batch.commit();
  } else {
    localStorage.setItem(DATA_PRESET_KEY_LOCAL, JSON.stringify(presets));
  }
}


export async function saveDataPreset(appState) {
  const name = $('#preset-name-input').val().trim();
  if (!name) {
    $('#preset-name-input').focus();
    return { success: false, error: 'プリセット名を入力してください。' };
  }

  const presets = await getDataPresets(appState);
  const newPreset = {
    id: appState.currentEditingPresetId || `preset_${Date.now()}`,
    name,
    data: getInputsAsDataObject(),
    createdAt: new Date().toISOString()
  };

  const existingIndex = presets.findIndex(p => p.id === newPreset.id);
  if (existingIndex > -1) {
    presets[existingIndex] = newPreset;
  } else {
    presets.push(newPreset);
  }

  await saveDataPresets(presets, appState);
  return { success: true, name };
}

export async function getPresetDataById(id, appState) {
  const presets = await getDataPresets(appState);
  return presets.find(p => p.id === id) || null;
}

export async function deleteDataPreset(id, appState) {
  let presets = await getDataPresets(appState);
  presets = presets.filter(p => p.id !== id);
  await saveDataPresets(presets, appState);
  return { success: true };
}


// ===============================================================
// Skill Preset Logic
// ===============================================================

export async function saveSkillPreset(presetId, isNew, appState) {
  const sourceId = isNew ? 'new' : presetId;
  const nameInput = document.getElementById(`skill-preset-${sourceId}-name`);
  if (!nameInput) return { success: false, error: "要素が見つかりません" };

  const name = nameInput.value.trim();
  if (!name) {
    return { success: false, error: 'プリセットの名前を入力してください。', field: nameInput };
  }

  const presetData = {
    name,
    buffs: {},
    states: {},
    order: isNew ? Date.now() : ($(`[data-id="${presetId}"]`).index() || Date.now()),
    color: $(`#skill-preset-${sourceId}-color`).val(),
    imageUrl: $(`#skill-preset-${sourceId}-image-url`).val()
  };

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

  if (appState.currentUser) {
    const collectionRef = db.collection('users').doc(appState.currentUser.uid).collection('skillPresets');
    try {
      if (isNew) {
        const docRef = await collectionRef.add(presetData);
        return { success: true, name, id: docRef.id };
      }
      else {
        await collectionRef.doc(presetId).set(presetData, { merge: true });
        return { success: true, name, id: presetId };
      }
    } catch (e) {
      console.error("スキルプリセットの保存失敗:", e);
      return { success: false, error: e };
    }
  } else {
    let presets = getStoredJSON(SKILL_PRESET_KEY, []);
    let newId = `local_${Date.now()}`;
    if (isNew) {
      presets.push({ ...presetData, id: newId });
    } else {
      const index = presets.findIndex(p => p.id === presetId);
      if (index > -1) presets[index] = { ...presets[index], ...presetData };
      newId = presetId;
    }
    localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(presets));
    return { success: true, name, id: newId };
  }
}

export async function deleteSkillPreset(presetId, appState) {
  if (appState.currentUser) {
    try {
      await db.collection('users').doc(appState.currentUser.uid).collection('skillPresets').doc(presetId).delete();
      return { success: true };
    } catch (e) {
      console.error("スキルプリセットの削除失敗:", e);
      return { success: false, error: e };
    }
  } else {
    let presets = getStoredJSON(SKILL_PRESET_KEY, []);
    localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(presets.filter(p => p.id !== presetId)));
    return { success: true };
  }
}

// ===============================================================
// Local Storage Helper
// ===============================================================

export function getStoredJSON(key, defaultValue = []) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`"${key}" のJSONパースに失敗しました。`, e);
    localStorage.removeItem(key);
    return defaultValue;
  }
}

// ===============================================================
// UI Rendering Functions
// ===============================================================

export async function renderDataPresetButtons(presets, appState) {
  const container = $('#preset-buttons');
  container.empty();
  const presetSource = presets || await getDataPresets(appState);

  // オブジェクトの場合は配列に変換してからソート
  const presetsArray = Array.isArray(presetSource) ? presetSource : Object.values(presetSource);
  presetsArray.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  presetsArray.forEach(presetData => {
    const cardHtml = `
      <div class="preset-card" data-id="${presetData.id}">
        <div class="preset-name">${$('<div/>').text(presetData.name).html()}</div>
        <div class="preset-actions">
          <button class="preset-btn load-btn" data-action="load-data" data-id="${presetData.id}" title="読み込み"><i class="fas fa-download"></i></button>
          <button class="preset-btn edit-btn" data-action="edit-data" data-id="${presetData.id}" title="編集"><i class="fas fa-edit"></i></button>
          <button class="preset-btn delete-btn" data-action="delete-data" data-id="${presetData.id}" title="削除"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>`;
    container.append(cardHtml);
  });

  const newCardHtml = `
    <div class="new-preset-card preset-card" data-action="save-data">
      <i class="fas fa-plus"></i>
      <span>新規作成</span>
    </div>`;
  container.append(newCardHtml);
}

export function renderSkillPresetEditor(presets, appState) {
  const editor = $('#skill-preset-editor');
  if (!editor.length) return;

  const currentPresets = presets || (appState.currentUser ? appState.globalSkillPresets : getStoredJSON(SKILL_PRESET_KEY, []));

  editor.empty();

  currentPresets.forEach(preset => {
    editor.append(createSkillPresetCard(preset));
  });

  const newCard = `<div id="new-skill-preset-creator" class="new-skill-preset-card">
                        <i class="fas fa-plus"></i>
                     </div>`;
  editor.append(newCard);

  editor.find('.ef').each(function () {
    if ($(this).val()) $(this).addClass('has-value');
  });
}

function createSkillPresetCard(preset) {
  const isNew = !preset.id;
  const id = isNew ? 'new' : preset.id;
  const name = preset.name || '';
  const color = preset.color || '#3d3663';
  const imageUrl = preset.imageUrl || '';

  const categorizedFields = {};
  skillPresetStructure.forEach(skill => {
    if (!categorizedFields[skill.category]) {
      categorizedFields[skill.category] = '';
    }
    const value = preset.buffs?.[skill.id] || '';
    const checked = preset.states?.[skill.id] ? 'checked' : '';
    if (skill.type === 'text') {
      categorizedFields[skill.category] += `<div class="input-group"><input class="ef calc-input" type="number" id="skill-preset-${id}-${skill.id}" value="${value}"><label>${skill.label}</label><span class="focus_line"></span></div>`;
    } else if (skill.type === 'state') {
      categorizedFields[skill.category] += `<div class="checkbox-group"><input type="checkbox" class="calc-input" id="skill-preset-${id}-${skill.id}" ${checked}><label for="skill-preset-${id}-${skill.id}">${skill.label}</label></div>`;
    }
  });

  let fieldsHtml = '';
  for (const category in categorizedFields) {
    fieldsHtml += `<div class="skill-preset-category"><h5>${category}</h5><div class="skill-preset-grid">${categorizedFields[category]}</div></div>`;
  }

  const actionButtons = `
        <button class="preset-actions-btn edit-skill-preset-btn" data-action="edit-skill" title="編集"><i class="fas fa-edit"></i></button>
        <button class="preset-actions-btn save-skill-preset-btn" data-action="save-skill" title="保存"><i class="fas fa-save"></i></button>
        <button class="preset-actions-btn delete-skill-preset-btn" data-action="delete-skill" title="削除"><i class="fas fa-trash-alt"></i></button>
    `;

  return `
        <div class="skill-preset-card" data-id="${id}">
            <h4>
                <input type="text" class="preset-name-input" id="skill-preset-${id}-name" value="${$('<div/>').text(name).html()}" placeholder="プリセット名">
                <div class="skill-preset-actions">
                    ${actionButtons}
                </div>
            </h4>
            <div class="skill-preset-content">
                <div class="customization-fields">
                     <div class="input-group">
                        <input type="url" id="skill-preset-${id}-image-url" class="ef" value="${imageUrl}">
                        <label>画像URL</label>
                        <span class="focus_line"></span>
                     </div>
                     <div class="color-picker-group">
                        <label for="skill-preset-${id}-color">カラー</label>
                        <input type="color" id="skill-preset-${id}-color" value="${color}" title="プリセットの色を選択">
                    </div>
                </div>
                ${fieldsHtml}
            </div>
        </div>`;
}


export function addNewSkillPresetCard() {
  const newCardHtml = createSkillPresetCard({ id: 'new', name: '新規プリセット' });
  const $newCard = $(newCardHtml).addClass('edit-mode');
  $newCard.insertBefore('#new-skill-preset-creator');
  $('#new-skill-preset-creator').hide();
}

export function renderSkillPresetActivator(presets, appState) {
  const activator = $('#skill-preset-activator');
  if (!activator.length) return;
  const currentPresets = presets || (appState.currentUser ? appState.globalSkillPresets : getStoredJSON(SKILL_PRESET_KEY, []));
  activator.empty();
  if (!currentPresets || currentPresets.length === 0) {
    activator.html('<p style="grid-column: 1 / -1; text-align: center; opacity: 0.7;">利用できるスキルプリセットはありません。</p>');
    return;
  }
  currentPresets.forEach(preset => {
    let imageHtml = '';
    if (preset.imageUrl) {
      imageHtml = `<img src="${preset.imageUrl}" class="activator-image" alt="${preset.name}" onerror="this.style.display='none'">`;
    }
    const cardHtml = `
            <div class="preset-activator-card" style="--border-color: ${preset.color || 'var(--card-border)'};">
                ${imageHtml}
                <input type="checkbox" id="activate-skill-preset-${preset.id}" class="skill-preset-activator-cb calc-input">
                <label for="activate-skill-preset-${preset.id}">${$('<div/>').text(preset.name).html()}</label>
            </div>`;
    activator.append(cardHtml);
  });
}

// ===============================================================
// Import / Export
// ===============================================================

export function importPresets(e, appState) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function (event) {
    try {
      const { dataPresets, skillPresets, inputs, characterDex } = JSON.parse(event.target.result);

      if (dataPresets) {
        await saveDataPresets(dataPresets, appState);
      }
      if (skillPresets) {
        localStorage.setItem(SKILL_PRESET_KEY, JSON.stringify(skillPresets));
      }
      if (characterDex) {
        await saveDex(characterDex, appState);
      }
      if (inputs) {
        loadInputsFromDataObject(inputs);
      }

      // Re-render everything
      await loadAllDataFromFirestore(appState);
      calculateAndRender(appState);
      showToast('プリセットと入力データを正常に読み込みました。', 'success');
    } catch (err) {
      showToast('ファイルの読み込みに失敗しました。ファイルが破損しているか、形式が正しくありません。', 'error');
      console.error(err);
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
}

export async function exportPresets(appState) {
  try {
    const dataToExport = {
      dataPresets: await getDataPresets(appState),
      skillPresets: getStoredJSON(SKILL_PRESET_KEY, []),
      characterDex: await getDex(appState),
      inputs: getInputsAsDataObject()
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    a.download = `maoryu_presets_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('全プリセットと現在の入力内容をエクスポートしました。', 'success');
  } catch (err) {
    showToast('エクスポートに失敗しました。', 'error');
    console.error(err);
  }
}

// ===============================================================
// Character Dex Logic
// ===============================================================

async function getDex(appState) {
  if (appState.currentUser) {
    const snapshot = await db.collection('users').doc(appState.currentUser.uid).collection('characterDex').orderBy('name').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  return getStoredJSON(CHARACTER_DEX_KEY_LOCAL, []);
}

async function saveDex(dex, appState) {
  if (appState.currentUser) {
    const batch = db.batch();
    const collectionRef = db.collection('users').doc(appState.currentUser.uid).collection('characterDex');
    const snapshot = await collectionRef.get();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    dex.forEach(character => {
      const { id, ...data } = character;
      const docRef = collectionRef.doc(id || `char_${Date.now()}`);
      batch.set(docRef, data);
    });
    await batch.commit();
  } else {
    localStorage.setItem(CHARACTER_DEX_KEY_LOCAL, JSON.stringify(dex));
  }
}

export async function openCharacterDex(appState) {
  appState.characterDex = await getDex(appState);
  renderCharacterDex(appState.characterDex, appState);
  $('#character-dex-modal').fadeIn(200);
}

export function renderCharacterDex(dex, appState) {
  const list = $('#character-dex-list');
  const dexToRender = dex || appState.characterDex || [];
  const searchTerm = $('#dex-search-input').val().toLowerCase();

  if (list.children().length === 0 || dex === null) {
    list.empty();
    if (dexToRender.length === 0) {
      list.html('<p class="dex-empty-message">図鑑にキャラクターが登録されていません。<br>基礎ステータスを入力して「このステータスを図鑑に登録」ボタンから追加してください。</p>');
      return;
    }
    dexToRender.forEach(character => {
      const itemHtml = `
                <div class="dex-list-item" data-id="${character.id}">
                    <div class="dex-item-info">
                        <img src="${character.imageUrl || 'images/default-avatar.png'}" class="dex-item-img" alt="${character.name}" onerror="this.src='images/default-avatar.png'">
                        <span class="dex-item-name">${$('<div/>').text(character.name).html()}</span>
                    </div>
                    <button class="delete-dex-item-btn" title="削除"><i class="fas fa-trash-alt"></i></button>
                </div>`;
      list.append(itemHtml);
    });
  }

  list.children('.dex-list-item').each(function () {
    const name = $(this).find('.dex-item-name').text().toLowerCase();
    $(this).toggleClass('hidden', !name.includes(searchTerm));
  });
}

export async function saveCharacterToDex(appState) {
  const result = await showCustomPrompt('図鑑に登録', 'キャラクター名と画像のURLを入力してください。');

  if (!result || !result.name) {
    showToast("登録をキャンセルしました。", "info");
    return;
  }

  let dex = await getDex(appState);
  const newCharacter = {
    id: `char_${Date.now()}`,
    name: result.name,
    imageUrl: result.imageUrl,
    stats: getInputsAsDataObject()
  };

  dex.push(newCharacter);
  dex.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  appState.characterDex = dex;
  await saveDex(dex, appState);
  showToast(`「${newCharacter.name}」を図鑑に登録しました。`, "success");
}

export async function loadCharacterFromDex(id, appState) {
  const dex = await getDex(appState);
  const character = dex.find(c => c.id === id);
  if (character) {
    loadInputsFromDataObject(character.stats);
    calculateAndRender(appState);
    closeModal($('#character-dex-modal'));
    showToast(`「${character.name}」のステータスを読み込みました。`, "success");
  }
}

export async function deleteCharacterFromDex(id, appState) {
  let dex = await getDex(appState);
  const characterName = dex.find(c => c.id === id)?.name || "キャラクター";
  dex = dex.filter(c => c.id !== id);
  appState.characterDex = dex;
  await saveDex(dex, appState);
  renderCharacterDex(dex, appState);
  showToast(`「${characterName}」を削除しました。`, "info");
}