// ===============================================================
// ** state.js - 状態管理モジュール (修正版) **
// ===============================================================
import { db } from './firebase.js';
// ui.js から calculateAndRender をインポート
import { calculateAndRender } from './ui.js';
// presets.js から描画関数をインポート
import { renderDataPresetButtons, renderSkillPresetEditor, renderSkillPresetActivator } from './presets.js';
import { AUTOSAVE_KEY_LOCAL } from './constants.js';

/**
 * 全ての入力項目の値をオブジェクトとして取得します。
 * @returns {object} 入力値のオブジェクト
 */
export function getInputsAsDataObject() {
  const data = {};
  document.querySelectorAll(".calc-input").forEach((input) => {
    if (input.id) {
      data[input.id] = (input.type === "checkbox" || input.type === "radio") ? input.checked : input.value;
    }
  });
  return data;
}

/**
 * 入力オブジェクトからフォームを復元します。
 * ※個別に has-value クラスを更新し、
 *   全体を一括で走査するのはやめました。
 * @param {object} data - 入力データオブジェクト
 */
export function loadInputsFromDataObject(data) {
  if (!data) return;
  Object.entries(data).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (!input) return;

    if (input.type === "checkbox" || input.type === "radio") {
      input.checked = value;
    } else {
      input.value = value;
    }

    // カスタムセレクトボックスの表示を更新
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

    // このフィールドのみ has-value クラスを付与／削除
    const $inp = $(input);
    if ($inp.hasClass('ef')) {
      if (input.type === "checkbox" || input.type === "radio") {
        $inp.toggleClass('has-value', input.checked);
      } else {
        $inp.toggleClass('has-value', input.value.toString().trim() !== '');
      }
    }
  });
}

/**
 * URLのハッシュからデータを読み込みます。
 */
export function loadFromUrl() {
  if (window.location.hash.startsWith('#data=')) {
    try {
      const jsonString = decodeURIComponent(atob(window.location.hash.substring(6)));
      const data = JSON.parse(jsonString);
      loadInputsFromDataObject(data);
      return true; // 読み込み成功
    } catch (e) {
      console.error('URLからのデータ読み込みに失敗:', e);
      return false; // 読み込み失敗
    }
  }
  return false;
}

/**
 * ローカルストレージから入力データを読み込みます。
 */
export function loadInputsFromLocalStorage() {
  try {
    const savedData = localStorage.getItem(AUTOSAVE_KEY_LOCAL);
    if (savedData) {
      loadInputsFromDataObject(JSON.parse(savedData));
    }
  } catch (e) {
    console.error("ローカルストレージからの読み込みに失敗:", e);
    localStorage.removeItem(AUTOSAVE_KEY_LOCAL);
  }
}

/**
 * 入力データをローカルストレージに保存します。
 */
export function saveInputsToLocalStorage() {
  if (window.location.hash.startsWith('#data=')) return;
  localStorage.setItem(AUTOSAVE_KEY_LOCAL, JSON.stringify(getInputsAsDataObject()));
}

/**
 * Firestoreから全てのデータを非同期で読み込みます。
 * @param {object} appState - アプリケーションの状態オブジェクト
 */
export async function loadAllDataFromFirestore(appState) {
  if (!appState.currentUser) return;
  const userRef = db.collection('users').doc(appState.currentUser.uid);
  try {
    // データプリセットの読み込み
    const dataPresetsSnap = await userRef.collection('dataPresets').get();
    appState.globalDataPresets = {};
    dataPresetsSnap.forEach(doc => { appState.globalDataPresets[doc.id] = doc.data(); });
    renderDataPresetButtons(appState.globalDataPresets, appState);

    // スキルプリセットの読み込み
    const skillPresetsSnap = await userRef.collection('skillPresets').orderBy('order').get();
    const skillPresets = [];
    skillPresetsSnap.forEach(doc => { skillPresets.push({ id: doc.id, ...doc.data() }); });
    appState.globalSkillPresets = skillPresets;
    renderSkillPresetEditor(skillPresets, appState);
    renderSkillPresetActivator(skillPresets, appState);

    // 計算機状態の監視を開始
    listenToCalculatorState(appState);
    return { success: true };
  } catch (e) {
    console.error("Firestoreからのデータ読み込みに失敗:", e);
    return { success: false, error: e };
  }
}

function listenToCalculatorState(appState) {
  if (!appState.currentUser) return;
  if (appState.unsubscribeCalculatorListener) appState.unsubscribeCalculatorListener();

  appState.unsubscribeCalculatorListener = db.collection('users').doc(appState.currentUser.uid).collection('calculatorState').doc('live')
    .onSnapshot((doc) => {
      if (doc.exists && !doc.metadata.hasPendingWrites) {
        loadInputsFromDataObject(doc.data());
        calculateAndRender(appState);
      }
    }, (error) => {
      console.error("Firestoreの監視に失敗: ", error);
    });
}

/**
 * debounce（処理をまとめる）関数
 * @param {function} func - 実行する関数
 * @param {number} wait - 待機時間(ms)
 * @returns {function}
 */
export function debounce(func, wait) {
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

/**
 * 入力データをFirestoreに保存します（debounceあり）。
 */
export const saveInputsToFirestore = debounce((appState) => {
  if (!appState.currentUser) return;
  db.collection('users').doc(appState.currentUser.uid).collection('calculatorState').doc('live').set(getInputsAsDataObject())
    .catch(e => {
      console.error("Firestoreへの入力値保存失敗:", e);
    });
}, 1000);

export const debouncedUpdateUrl = debounce(() => {
  try {
    const dataString = btoa(encodeURIComponent(JSON.stringify(getInputsAsDataObject())));
    history.replaceState(null, '', `#data=${dataString}`);
  } catch (e) {
    console.error('URLハッシュの更新に失敗:', e);
  }
}, 800);