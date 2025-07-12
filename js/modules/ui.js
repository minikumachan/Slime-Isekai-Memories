// ===============================================================
// ** ui.js - UI管理モジュール (修正版) **
// UIの描画、イベント処理、DOM操作など、画面表示に関するすべてを管理します。
// ===============================================================

import { signInWithGoogle, signOutUser } from './auth.js';
import { runCalculationEngine, calculateExpectedDamage } from './calculator.js';
import { updateGraph } from './graph.js';
import { getInputsAsDataObject, saveInputsToFirestore, saveInputsToLocalStorage, debounce, debouncedUpdateUrl, loadAllDataFromFirestore, loadFromUrl, loadInputsFromDataObject } from './state.js';
import * as Presets from './presets.js';
import { db } from './firebase.js';
import * as Constants from './constants.js';

// --- UI Helper Functions ---
export const v = (id) => parseFloat(document.getElementById(id)?.value) || 0;
export const c = (id) => document.getElementById(id)?.checked;

/**
 * Toast通知を表示します。
 * @param {string} message - 表示メッセージ
 * @param {string} type - 'success', 'error', 'info'
 * @param {number} duration - 表示時間(ms)
 */
export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

/**
 * モーダルを閉じます。
 * @param {jQuery} modalElement - モーダル要素
 */
export function closeModal(modalElement) {
  $(modalElement).fadeOut(200).attr('aria-hidden', 'true');
}

/**
 * カスタム確認ダイアログを表示します。
 * @param {string} message - 表示メッセージ
 * @returns {Promise<boolean>} - ユーザーがOKを押したかどうか
 */
export function showCustomConfirm(message) {
  return new Promise((resolve) => {
    const modal = $('#custom-alert-modal');
    modal.find('#custom-alert-message').text(message);

    modal.find('#custom-alert-confirm').off('click').on('click', () => {
      closeModal(modal);
      resolve(true);
    });

    modal.find('#custom-alert-cancel').off('click').on('click', () => {
      closeModal(modal);
      resolve(false);
    });

    modal.fadeIn(200);
  });
}

/**
 * カスタムプロンプト（入力ダイアログ）を表示します。
 * @param {string} title - ダイアログのタイトル
 * @param {string} message - 表示メッセージ
 * @returns {Promise<{name: string, imageUrl: string}|null>}
 */
export function showCustomPrompt(title, message, currentData = {}) {
  return new Promise((resolve) => {
    const modal = $('#custom-prompt-modal');
    modal.find('#custom-prompt-title').text(title);
    modal.find('#custom-prompt-message').text(message);
    const nameInput = modal.find('#custom-prompt-input-name');
    const imageInput = modal.find('#custom-prompt-input-image');

    nameInput.val(currentData.name || '').toggleClass('has-value', !!currentData.name);
    imageInput.val(currentData.imageUrl || '').toggleClass('has-value', !!currentData.imageUrl);

    modal.find('#custom-prompt-confirm').off('click').on('click', () => {
      const name = nameInput.val().trim();
      if (name) {
        closeModal(modal);
        resolve({ name, imageUrl: imageInput.val().trim() });
      } else {
        showToast('キャラクター名は必須です。', 'error');
        nameInput.focus();
      }
    });

    modal.find('#custom-prompt-cancel').off('click').on('click', () => {
      closeModal(modal);
      resolve(null);
    });

    modal.fadeIn(200);
    nameInput.focus();
  });
}


/**
 * ログイン済みユーザーのUIを更新します。
 * @param {object} user - Firebaseユーザーオブジェクト
 */
export function updateUiForLoggedInUser(user) {
  $('#user-avatar').attr('src', user.photoURL || 'images/default-avatar.png');
  $('#user-profile').show();
  $('#login-button').hide();
  $('#login-prompt').hide();
}

/**
 * ログアウト済みユーザーのUIを更新します。
 */
export function updateUiForLoggedOutUser() {
  $('#user-profile').hide();
  $('#login-button').show();
  $('#login-prompt').show();
}

/**
 * ダメージ計算と画面描画のメイン関数
 * @param {object} appState - アプリケーションの状態オブジェクト
 */
export function calculateAndRender(appState) {
  const resultDiv = document.getElementById('damage-result');
  try {
    applySkillPresets(appState);
    const currentInputs = getInputsAsDataObject();
    appState.lastTotalResult = runCalculationEngine(currentInputs);

    if (appState.comparisonMode === 'preset') {
      const presetDataA = appState.comparisonSlots.a;
      const presetDataB = appState.comparisonSlots.b;
      if (presetDataA && presetDataB) {
        resultDiv.innerHTML = generateComparisonResultHtml(
          runCalculationEngine(presetDataA.data),
          runCalculationEngine(presetDataB.data),
          appState
        );
      } else {
        resultDiv.innerHTML = generateSingleResultHtml(appState.lastTotalResult);
      }
    } else {
      if (appState.comparisonMode === 'buff') {
        const comparisonInputs = { ...currentInputs };
        appState.activeBuffComparison.forEach(id => {
          if (comparisonInputs[id] !== undefined) comparisonInputs[id] = 0;
        });
        appState.lastComparisonResult = runCalculationEngine(comparisonInputs);
      } else {
        appState.lastComparisonResult = null;
      }
      resultDiv.innerHTML = generateSingleResultHtml(appState.lastTotalResult);
    }

    if (appState.isGraphModalOpen) {
      updateGraph(appState);
    }
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: #ff5c5c; padding: 1rem;">計算エラーが発生しました。<br>入力値やプリセットの内容を確認してください。<br><small>${error.message}</small></p>`;
    console.error("Calculation Error:", error);
  }
}


/**
 * 全てのUIを初期化し、イベントリスナーを設定します。
 * @param {object} appState - アプリケーションの状態オブジェクト
 */
export function initializeUI(appState) {
  setupEventListeners(appState);
  setupTooltips();
  setupCustomSelects();
  renderUpdates(appState);
}


function setupEventListeners(appState) {
  const debouncedCalculateAndSave = debounce(() => {
    if (appState.currentUser) {
      saveInputsToFirestore(appState);
    } else {
      saveInputsToLocalStorage();
    }
    calculateAndRender(appState);
    debouncedUpdateUrl();
  }, 400);

  $('body').on('input change', '.calc-input', debouncedCalculateAndSave);

  $('#login-button, #prompt-login-link').on('click', (e) => {
    e.preventDefault();
    $('#login-modal').fadeIn(200).attr('aria-hidden', 'false');
  });

  $('#logout-button').on('click', async () => {
    if (await showCustomConfirm("ログアウトしますか？")) {
      signOutUser();
    }
  });
  $('#google-login-btn').on('click', signInWithGoogle);

  $('#clear-inputs').on('click', async () => {
    if (await showCustomConfirm('すべての入力値をクリアしますか？')) {
      clearAllInputs();
      debouncedCalculateAndSave.flush();
    }
  });

  $('#show-graph-btn').on('click', () => openGraphModal(appState));

  $('#export-presets').on('click', () => {
    if (appState.currentUser) {
      showToast("ログイン中はエクスポート機能を利用できません。", "info");
      return;
    }
    Presets.exportPresets(appState);
  });

  $('#import-presets').on('click', function () {
    if (appState.currentUser) {
      showToast("ログイン中はインポート機能を利用できません。", "info");
      return;
    }
    $('#import-file-input').trigger('click');
  });

  $('#import-file-input').on('change', (e) => Presets.importPresets(e, appState));

  $('#share-url-btn').on('click', generateShareableUrl);


  $('#preset-buttons').on('click', '.preset-btn', async function () {
    const action = $(this).data('action');
    const id = $(this).data('id');
    appState.currentEditingPresetId = id;

    if (action === 'edit-data') {
      const presetData = await Presets.getPresetDataById(id, appState);
      const modalTitle = 'データプリセットの編集';
      $('#save-preset-modal-title').text(modalTitle);
      $('#preset-name-input').val(presetData ? presetData.name : '').addClass('has-value');
      $('#save-preset-modal').fadeIn(200).find('#preset-name-input').focus();
    }
    else if (action === 'load-data') {
      const presetToLoad = await Presets.getPresetDataById(id, appState);
      if (presetToLoad) {
        loadInputsFromDataObject(presetToLoad.data);
        showToast(`プリセット「${presetToLoad.name}」を読み込みました。`, 'success');
        calculateAndRender(appState);
      }
    }
    else if (action === 'delete-data') {
      const presetToDelete = await Presets.getPresetDataById(id, appState);
      if (presetToDelete && await showCustomConfirm(`プリセット「${presetToDelete.name}」を削除しますか？`)) {
        Presets.deleteDataPreset(id, appState).then(result => handlePresetDelete(result, 'データプリセット', appState));
      }
    }
  });

  $('#preset-buttons').on('click', '.new-preset-card', function () {
    appState.currentEditingPresetId = null; // 新規保存の場合はIDをリセット
    $('#save-preset-modal-title').text('新規データプリセットの保存');
    $('#preset-name-input').val('').removeClass('has-value');
    $('#save-preset-modal').fadeIn(200).find('#preset-name-input').focus();
  });

  $('#skill-preset-editor').on('click', '.preset-actions-btn', async function () {
    const button = $(this);
    const card = button.closest('.skill-preset-card');
    const action = button.data('action');
    const id = card.data('id');

    if (action === 'edit-skill') {
      card.toggleClass('edit-mode');
    } else if (action === 'save-skill') {
      const isNew = id === 'new';
      const result = await Presets.saveSkillPreset(isNew ? null : id, isNew, appState);
      handlePresetSave(result, appState);
      if (result.success) {
        if (isNew) {
          card.remove();
          $('#new-skill-preset-creator').show();
        } else {
          card.removeClass('edit-mode');
        }
      }
    } else if (action === 'delete-skill') {
      const presetName = card.find('.preset-name-input').val();
      if (await showCustomConfirm(`スキルプリセット「${presetName}」を本当に削除しますか？`)) {
        const result = await Presets.deleteSkillPreset(id, appState);
        handlePresetDelete(result, "スキルプリセット", appState);
      }
    }
  });

  $('#skill-preset-editor').on('click', '#new-skill-preset-creator', Presets.addNewSkillPresetCard);

  $('#save-preset-button-confirm').on('click', async () => {
    const result = await Presets.saveDataPreset(appState);
    if (result.success) closeModal($('#save-preset-modal'));
    handlePresetSave(result, appState, true);
  });

  // Character Dex Listeners
  $('#open-dex-button').on('click', () => Presets.openCharacterDex(appState));
  $('#save-to-dex-button').on('click', () => Presets.saveCharacterToDex(appState));
  $('body').on('click', '.dex-list-item', function (e) {
    if ($(e.target).closest('.delete-dex-item-btn').length === 0) {
      const id = $(this).data('id');
      Presets.loadCharacterFromDex(id, appState);
    }
  });
  $('body').on('click', '.delete-dex-item-btn', async function (e) {
    e.stopPropagation();
    const id = $(this).closest('.dex-list-item').data('id');
    const characterName = $(this).closest('.dex-list-item').find('.dex-item-name').text();
    if (await showCustomConfirm(`図鑑から「${characterName}」を本当に削除しますか？`)) {
      Presets.deleteCharacterFromDex(id, appState);
    }
  });
  $('body').on('input', '#dex-search-input', debounce(() => Presets.renderCharacterDex(null, appState), 200));


  $('body').on('click', '.modal-close-btn, #close-comparison-modal-btn', function () {
    const modal = $(this).closest('.modal-overlay');
    if (modal.attr('id') === 'comparison-unified-modal') {
      setComparisonMode('none', appState);
      setComparisonView(false);
    }
    if (modal.attr('id') === 'graph-modal') {
      appState.isGraphModalOpen = false;
    }
    closeModal(modal);
  });

  $('body').on('click', '.modal-overlay', function (e) {
    if (e.target === this) {
      if ($(this).attr('id') === 'graph-modal') {
        appState.isGraphModalOpen = false;
      }
      if ($(this).attr('id').indexOf('custom-') === -1) {
        closeModal(this);
      }
    }
  });

  $('.openclose').on('click', function () {
    $(this).toggleClass('is-open').next('.preset-editor-container').slideToggle(300);
  });

  $('body').on('click', '.collapsible-header', function () {
    const section = $(this).closest('.form-section');
    section.toggleClass('is-open');
    section.find('.collapsible-content').first().slideToggle(400);
  });

  $('#damage-result').on('click', '.result-header, .sub-result-header', function () {
    $(this).toggleClass('is-open').next().slideToggle(200);
  });

  $('body').on('click', '.update-header', function () {
    $(this).toggleClass('is-open').next('.update-content').slideToggle(300);
  });

  $('#next-page').on('click', function () {
    appState.updates.currentPage++;
    renderUpdates(appState);
  });
  $('#prev-page').on('click', function () {
    appState.updates.currentPage--;
    renderUpdates(appState);
  });

  $('body').on('click', '.collapsible-graph-header', function () {
    $(this).toggleClass('is-open').next('.collapsible-graph-content').slideToggle(300);
  });

  const themes = ['light', 'blue-theme', 'purple-theme', 'green-theme', 'gemini-pink-theme', 'gemini-solar-theme', 'gemini-oceanic-theme'];
  let currentThemeName = localStorage.getItem(Constants.THEME_KEY) || 'light';
  applyTheme(currentThemeName);

  $('.theme-switcher').on('click', function () {
    const currentIndex = themes.indexOf(currentThemeName);
    const nextIndex = (currentIndex + 1) % themes.length;
    currentThemeName = themes[nextIndex];
    applyTheme(currentThemeName);
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
  checkVisibility();

  $('body').on('input', '.ef', function () { $(this).toggleClass('has-value', this.value.trim() !== '' || this.placeholder.trim() !== ''); });

  $('.result-toggles').on('change', 'input', () => calculateAndRender(appState));

  $('#open-comparison-unified-modal-btn').on('click', () => openComparisonUnifiedModal(appState));

  $('#comparison-unified-modal').on('click', '.modal-tab-btn', function () {
    const tabId = $(this).data('tab');
    $('.modal-tab-btn').removeClass('active');
    $(this).addClass('active');
    $('.modal-tab-content').removeClass('active');
    $(`#${tabId}-content`).addClass('active');
  });

  $('#comparison-unified-modal').on('click', '.comparison-select-btn', function () {
    const slot = $(this).data('slot');
    openPresetSelectionModal(slot, appState);
  });

  $('#comparison-unified-modal').on('click', '.comparison-current-btn', function () {
    const slot = $(this).data('slot');
    appState.comparisonSlots[slot] = { name: '現在の入力状況', data: getInputsAsDataObject() };
    if (appState.comparisonSlots.a && appState.comparisonSlots.b) {
      setComparisonMode('preset', appState);
      setComparisonView(true);
      closeModal($('#comparison-unified-modal'));
    }
    updateComparisonPanelUI(appState);
  });

  $('#comparison-unified-modal').on('click', '#comparison-clear-btn', function () {
    appState.comparisonSlots = { a: null, b: null };
    setComparisonMode('none', appState);
    setComparisonView(false);
    updateComparisonPanelUI(appState);
    showToast('プリセット比較をリセットしました。', 'info');
  });

  $('#buff-comparison-apply-btn').on('click', function () {
    appState.activeBuffComparison = $('#buff-comparison-list input:checked').map(function () { return this.id.replace('comp-', ''); }).get();
    setComparisonView(false);
    setComparisonMode(appState.activeBuffComparison.length > 0 ? 'buff' : 'none', appState);
    closeModal($('#comparison-unified-modal'));
    if (appState.activeBuffComparison.length > 0) {
      showToast('バフ比較を適用しました。', 'info');
    }
  });

  $('#buff-comparison-clear-btn').on('click', function () {
    $('#buff-comparison-list input:checked').prop('checked', false);
    appState.activeBuffComparison = [];
    if (appState.comparisonMode === 'buff') {
      setComparisonMode('none', appState);
    }
    showToast('バフ比較をクリアしました。', 'info');
  });
}

// --- 以下、このモジュール内でのみ使用される補助関数 ---

function clearAllInputs() {
  document.querySelectorAll('.calc-input').forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else if (input.tagName.toLowerCase() === 'select') {
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
    } else {
      input.value = '';
    }
  });
  $('.ef').removeClass('has-value');
}

/**
 * 共有用のURLを生成し、クリップボードにコピーします。
 * prompt() を使用しないように変更
 */
function generateShareableUrl() {
  try {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        showToast('現在の状態を反映した共有URLをコピーしました。', "success");
      },
      () => {
        // コピー失敗時はトーストで通知し、コンソールにURLを出力
        showToast('URLのコピーに失敗しました。手動でコピーしてください。', "error", 5000);
        console.error('Copy failed. Manual copy required:', url);
      }
    );
  } catch (e) {
    showToast('URLの生成に失敗しました。', 'error');
    console.error("Error generating shareable URL:", e);
  }
}

function applyTheme(themeName) {
  const themes = ['light', 'blue-theme', 'purple-theme', 'green-theme', 'gemini-pink-theme', 'gemini-solar-theme', 'gemini-oceanic-theme'];
  themes.forEach(t => document.body.classList.remove(t));
  if (themeName && themeName !== 'light') {
    document.body.classList.add(themeName);
  }
  localStorage.setItem(Constants.THEME_KEY, themeName);
}

function renderUpdates(appState) {
  const updates = document.querySelectorAll('.new dt');
  if (updates.length === 0) return;
  const { currentPage, perPage } = appState.updates;
  const totalPages = Math.ceil(updates.length / perPage);
  const start = (currentPage - 1) * perPage;
  updates.forEach((dt, index) => {
    const show = (index >= start && index < start + perPage);
    dt.style.display = show ? 'flex' : 'none';
    if (dt.nextElementSibling) {
      dt.nextElementSibling.style.display = show ? 'block' : 'none';
    }
  });
  $('#page-info').text(`${currentPage} / ${totalPages}`);
  $('#prev-page').prop('disabled', currentPage === 1);
  $('#next-page').prop('disabled', currentPage === totalPages);
}

function setupCustomSelects() {
  document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
    const customSelect = wrapper.querySelector('.custom-select');
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const options = Array.from(wrapper.querySelectorAll('.custom-option'));
    const originalSelect = wrapper.querySelector('select');
    const triggerSpan = trigger.querySelector('span');
    let focusedIndex = -1;

    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.tabIndex = 0;
    customSelect.querySelector('.custom-options').setAttribute('role', 'listbox');

    options.forEach((option, index) => {
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.id = `${originalSelect.id}-option-${index}`;
    });

    const closeAllSelects = (except) => {
      document.querySelectorAll('.custom-select.open').forEach(s => {
        if (s !== except) {
          s.classList.remove('open');
          s.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false');
        }
      });
    };

    const selectOption = (option) => {
      if (!option) return;
      options.forEach(opt => {
        opt.classList.remove('selected');
        opt.setAttribute('aria-selected', 'false');
      });
      option.classList.add('selected');
      option.setAttribute('aria-selected', 'true');
      triggerSpan.textContent = option.textContent;
      trigger.setAttribute('aria-activedescendant', option.id);
      originalSelect.value = option.dataset.value;
      originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
      closeAllSelects();
      trigger.focus();
    };

    const setFocus = (index) => {
      options.forEach(opt => opt.classList.remove('is-focused'));
      if (options[index]) {
        options[index].classList.add('is-focused');
        options[index].scrollIntoView({ block: 'nearest' });
      }
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = customSelect.classList.toggle('open');
      trigger.setAttribute('aria-expanded', isOpen);
      if (isOpen) {
        closeAllSelects(customSelect);
        focusedIndex = options.findIndex(opt => opt.classList.contains('selected'));
        setFocus(focusedIndex);
      }
    });

    options.forEach((option, index) => {
      option.addEventListener('click', () => selectOption(option));
      option.addEventListener('mouseenter', () => setFocus(index));
    });

    trigger.addEventListener('keydown', (e) => {
      const isOpen = customSelect.classList.contains('open');
      if (e.key === 'Escape') {
        if (isOpen) closeAllSelects();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (isOpen && focusedIndex > -1) {
          selectOption(options[focusedIndex]);
        } else {
          trigger.click();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedIndex = Math.min(options.length - 1, focusedIndex + 1);
        setFocus(focusedIndex);
        if (!isOpen) trigger.click();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedIndex = Math.max(0, focusedIndex - 1);
        setFocus(focusedIndex);
        if (!isOpen) trigger.click();
      }
    });

    document.addEventListener('click', () => closeAllSelects());
  });
}

function setupTooltips() {
  $('.tooltip-icon').each(function () {
    const tooltipId = $(this).data('tooltip-id');
    if (typeof Constants.tooltips !== 'undefined' && Constants.tooltips[tooltipId]) {
      const tooltipData = Constants.tooltips[tooltipId];
      const tooltipBox = $('<div>').addClass('tooltip-box');
      const tooltipTitle = $('<h5>').html(tooltipData.title);
      const tooltipContent = $('<div>').html(tooltipData.content);
      tooltipBox.append(tooltipTitle, tooltipContent);
      $(this).append(tooltipBox);
    }
  });
}

function generateSingleResultHtml(resultData) {
  if (!resultData) return '';
  const { displayAttack, mainActualAttack, enemyActualDefense, isAoe, skillFinal, ultimateFinal, extremeUltimateFinal, critTTL, pierceTTL, critRate, pierceRate } = resultData;
  let html = `<h3 class="result-header">ステータス<i class="fas fa-chevron-down"></i></h3><div class="result-content-collapsible"><table><tr><td>表示攻撃力</td><td>${Math.round(displayAttack).toLocaleString()}</td></tr><tr><td>実攻撃力(${isAoe ? '全体' : '単体'})</td><td>${Math.round(mainActualAttack).toLocaleString()}</td></tr><tr><td>敵の実防御力</td><td>${Math.round(enemyActualDefense).toLocaleString()}</td></tr></table></div>`;

  let maxDamage = 0;

  // First pass to find the max damage
  [skillFinal, ultimateFinal, extremeUltimateFinal].forEach(resultSet => {
    if (!resultSet) return;
    Object.values(resultSet).forEach(damage => {
      if (damage <= 0) return;
      const expectedDmg = calculateExpectedDamage(damage, damage * critTTL, (damage + displayAttack * 0.06) * pierceTTL, (damage * critTTL + displayAttack * 0.06) * pierceTTL, critRate, pierceRate);
      if (expectedDmg > maxDamage) maxDamage = expectedDmg;
    });
  });

  const generateSectionHtml = (title, baseResults) => {
    if (!baseResults) return '';
    let sectionHtml = `<h3 class="result-header">${title}<i class="fas fa-chevron-down"></i></h3><div class="result-content-collapsible">`;
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

      let colorClass = '';
      if (expectedDmg === maxDamage && maxDamage > 0) colorClass = 'damage-tier-max';
      else if (expectedDmg / maxDamage > 0.8) colorClass = 'damage-tier-high';

      sectionHtml += `<h4 class="sub-result-header">▼ ${name}<i class="fas fa-chevron-down"></i></h4><div class="sub-result-content"><table>`;
      sectionHtml += `<tr><td>基礎</td><td>${Math.round(damage).toLocaleString()}</td></tr>`;
      if (c('toggle-crit')) sectionHtml += `<tr><td>会心</td><td>${Math.round(critDmg).toLocaleString()}</td></tr>`;
      if (c('toggle-pierce')) {
        sectionHtml += `<tr><td>貫通</td><td>${Math.round(pierceDmg).toLocaleString()}</td></tr>`;
        if (c('toggle-crit')) sectionHtml += `<tr><td>会心+貫通</td><td>${Math.round(critPierceDmg).toLocaleString()}</td></tr>`;
      }
      if ((c('toggle-crit') || c('toggle-pierce')) && (critRate > 0 || pierceRate > 0)) {
        sectionHtml += `<tr><td><strong>期待値</strong></td><td class="${colorClass}"><strong>${Math.round(expectedDmg).toLocaleString()}</strong></td></tr>`;
      }
      sectionHtml += `</table></div>`;
    }
    sectionHtml += `</div>`;
    return sectionHtml;
  };

  html += generateSectionHtml('通常ダメージ', skillFinal);
  html += generateSectionHtml('奥義ダメージ', ultimateFinal);
  if (v('extreme-ultimate-multiplier') > 0) {
    html += generateSectionHtml('極奥義ダメージ', extremeUltimateFinal);
  }
  return html;
}


function generateComparisonResultHtml(resultA, resultB, appState) {
  let html = '<div class="result-comparison-wrapper">';
  const generateColumnHtml = (resultData, otherResultData, title) => {
    let columnHtml = `<div class="result-column"><h3>${title}</h3>`;
    if (!resultData) return columnHtml + '</div>';

    const { displayAttack, mainActualAttack, skillFinal, ultimateFinal, extremeUltimateFinal } = resultData;
    const compareAndClassify = (valA, valB) => {
      if (valA > valB) return 'damage-higher';
      if (valA < valB) return 'damage-lower';
      return '';
    };

    columnHtml += `<table>`;
    columnHtml += `<tr><td>表示攻撃力</td><td class="${compareAndClassify(displayAttack, otherResultData.displayAttack)}">${Math.round(displayAttack).toLocaleString()}</td></tr>`;
    columnHtml += `<tr><td>実攻撃力</td><td class="${compareAndClassify(mainActualAttack, otherResultData.mainActualAttack)}">${Math.round(mainActualAttack).toLocaleString()}</td></tr>`;
    columnHtml += `</table>`;

    const generateSectionHtml = (title, baseResults, otherBaseResults) => {
      if (!baseResults) return '';
      let sectionHtml = `<h4>${title}</h4><table>`;
      const damageTypes = ['normal', 'synergy', 'kensan', 'synergyKensan'];
      const typeNames = { 'normal': '基礎', 'synergy': '協心', 'kensan': '堅閃', 'synergyKensan': '協心+堅閃' };

      damageTypes.forEach(type => {
        const damage = baseResults[type] || 0;
        const otherDamage = otherBaseResults ? (otherBaseResults[type] || 0) : 0;
        if (damage > 0 || otherDamage > 0) {
          sectionHtml += `<tr><td>${typeNames[type]}</td><td class="${compareAndClassify(damage, otherDamage)}">${Math.round(damage).toLocaleString()}</td></tr>`;
        }
      });
      sectionHtml += '</table>';
      return sectionHtml;
    };

    columnHtml += generateSectionHtml('通常ダメージ', skillFinal, otherResultData.skillFinal);
    columnHtml += generateSectionHtml('奥義ダメージ', ultimateFinal, otherResultData.ultimateFinal);
    if (v('extreme-ultimate-multiplier') > 0 || (otherResultData && otherResultData.extremeUltimateFinal)) {
      columnHtml += generateSectionHtml('極奥義ダメージ', extremeUltimateFinal, otherResultData.extremeUltimateFinal);
    }
    return columnHtml + '</div>';
  };

  html += generateColumnHtml(resultA, resultB, appState.comparisonSlots.a.name);
  html += generateColumnHtml(resultB, resultA, appState.comparisonSlots.b.name);
  html += '</div>';
  return html;
}

function applySkillPresets(appState) {
  const activePresetBuffs = {}, activePresetStates = {};
  const activePresetIds = new Set();
  document.querySelectorAll('.skill-preset-activator-cb:checked').forEach(cb => {
    activePresetIds.add(cb.id.replace('activate-skill-preset-', ''));
  });

  let presets = [];
  if (appState.currentUser) {
    presets = appState.globalSkillPresets.filter(p => activePresetIds.has(p.id));
  } else {
    presets = Presets.getStoredJSON(Constants.SKILL_PRESET_KEY, []).filter(p => activePresetIds.has(p.id));
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

  Constants.skillPresetStructure.forEach(skill => {
    const input = document.getElementById(skill.id);
    if (!input) return;

    input.disabled = false;
    input.classList.remove('preset-active');

    if (skill.type === 'state') {
      if (activePresetStates[skill.id]) {
        input.checked = true;
        input.disabled = true;
      }
    } else if (skill.type === 'text') {
      const presetValue = activePresetBuffs[skill.id];
      if (presetValue !== undefined) {
        if ((parseFloat(input.value) || 0) < presetValue) {
          input.value = presetValue;
        }
        input.classList.add('preset-active');
      }
    }
  });
  $('.ef').each(function () {
    $(this).toggleClass('has-value', this.value.trim() !== '' || $(this).attr('placeholder'));
  });
}

function openGraphModal(appState) {
  appState.isGraphModalOpen = true;
  const modal = $('#graph-modal');
  modal.fadeIn(200);
  updateGraph(appState);
}

function openComparisonUnifiedModal(appState) {
  const modal = $('#comparison-unified-modal');
  modal.fadeIn(200).attr('aria-hidden', 'false');
  updateComparisonPanelUI(appState);
  renderBuffComparisonList(appState);
}

function updateComparisonPanelUI(appState) {
  const slotA = $('#comparison-slot-a .comparison-preset-name');
  const slotB = $('#comparison-slot-b .comparison-preset-name');
  slotA.text(appState.comparisonSlots.a?.name || '未選択');
  slotB.text(appState.comparisonSlots.b?.name || '未選択');
}

function renderBuffComparisonList(appState) {
  const container = $('#buff-comparison-list');
  container.empty();
  const categorizedBuffs = Constants.buffMasterList.reduce((acc, buff) => {
    if (buff.category.includes('基礎ステータス')) return acc; //基礎ステータスは除外
    (acc[buff.category] = acc[buff.category] || []).push(buff);
    return acc;
  }, {});

  Object.entries(categorizedBuffs).forEach(([category, buffs]) => {
    container.append(`<h4 class="comparison-category-header">${category}</h4>`);
    const $grid = $('<div>').addClass('comparison-buff-grid');
    buffs.forEach(buff => {
      const isChecked = appState.activeBuffComparison.includes(buff.id) ? 'checked' : '';
      $grid.append(`<div class="checkbox-group"><input type="checkbox" class="comparison-cb" id="comp-${buff.id}" ${isChecked}><label for="comp-${buff.id}">${buff.label}</label></div>`);
    });
    container.append($grid);
  });
}

function setComparisonView(isComparing) {
  $('#calculator-content').toggleClass('comparison-view', isComparing);
}

function setComparisonMode(mode, appState) {
  appState.comparisonMode = mode;
  calculateAndRender(appState);
}

/**
 * データプリセット選択用のカスタムモーダルを開きます。
 * @param {string} slot - 'a' または 'b'
 * @param {object} appState - アプリケーションの状態オブジェクト
 */
async function openPresetSelectionModal(slot, appState) {
  const presets = await Presets.getDataPresets(appState);

  if (presets.length === 0) {
    showToast('比較できる保存済みプリセットがありません。', 'error');
    return;
  }

  const modal = $('#preset-selection-modal');
  const list = $('#preset-selection-list');
  list.empty(); // リストをクリア

  // プリセット一覧をリストアイテムとして生成
  presets.forEach(preset => {
    const itemHtml = `
      <div class="dex-list-item" data-id="${preset.id}" style="cursor: pointer;">
          <div class="dex-item-info">
              <span class="dex-item-name">${$('<div/>').text(preset.name).html()}</span>
          </div>
      </div>`;
    list.append(itemHtml);
  });

  // モーダルを表示
  modal.fadeIn(200);

  // イベントリスナーを一度クリアしてから再設定
  list.off('click', '.dex-list-item').on('click', '.dex-list-item', function () {
    const presetId = $(this).data('id');
    const selectedPreset = presets.find(p => p.id === presetId);

    if (selectedPreset) {
      appState.comparisonSlots[slot] = { name: selectedPreset.name, data: selectedPreset.data };

      // 両方のスロットが埋まったら比較モードを開始
      if (appState.comparisonSlots.a && appState.comparisonSlots.b) {
        setComparisonMode('preset', appState);
        setComparisonView(true);
        closeModal($('#comparison-unified-modal')); // 親モーダルも閉じる
      }
      updateComparisonPanelUI(appState);
      closeModal(modal); // 自分自身を閉じる
    }
  });

  // 閉じるボタンの処理
  modal.find('.modal-close-btn').off('click').on('click', () => closeModal(modal));
}

function handlePresetSave(result, appState, isDataPreset = false) {
  if (result.success) {
    showToast(`「${result.name}」を保存しました。`, "success");
    if (appState.currentUser) {
      loadAllDataFromFirestore(appState);
    } else {
      if (isDataPreset) {
        Presets.renderDataPresetButtons(null, appState);
      } else {
        Presets.renderSkillPresetEditor(null, appState);
        Presets.renderSkillPresetActivator(null, appState);
      }
    }
  } else {
    showToast(`保存に失敗しました: ${result.error}`, "error");
    if (result.field) result.field.focus();
  }
}

function handlePresetDelete(result, type, appState) {
  if (result.success) {
    showToast(`${type}を削除しました。`, "success");
    if (appState.currentUser) {
      loadAllDataFromFirestore(appState);
    } else {
      if (type === 'データプリセット') {
        Presets.renderDataPresetButtons(null, appState);
      } else {
        Presets.renderSkillPresetEditor(null, appState);
        Presets.renderSkillPresetActivator(null, appState);
      }
    }
    calculateAndRender(appState);
  } else {
    showToast("削除に失敗しました。", "error");
  }
}