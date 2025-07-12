// ===============================================================
// ** main.js - アプリケーションのエントリーポイント (修正版) **
// ===============================================================

// --- モジュールのインポート ---
import { auth, db, storage } from './modules/firebase.js';
import { onAuthStateChanged, signOutUser } from './modules/auth.js'; // signOutUser をインポート
import { initializeUI, calculateAndRender } from './modules/ui.js';
import { loadFromUrl, loadInputsFromLocalStorage } from './modules/state.js';

// --- グローバル状態管理オブジェクト ---
// アプリケーション全体で共有する状態をすべてここで定義します。
const appState = {
  // 認証・DB関連
  currentUser: null,
  unsubscribeCalculatorListener: null,
  db: null,
  auth: null,
  storage: null,

  // プリセットデータ
  globalDataPresets: [],
  globalSkillPresets: [],
  characterDex: [],
  currentEditingPresetId: null,

  // 比較機能関連
  comparisonSlots: { a: null, b: null },
  comparisonMode: 'none', // 'none', 'preset', 'buff'
  activeBuffComparison: [],

  // 計算結果
  lastTotalResult: null,
  lastComparisonResult: null,

  // UI状態
  isGraphModalOpen: false,
  updates: {
    currentPage: 1,
    perPage: 10, // 1ページあたりの更新履歴の表示件数
  }
};

// --- 初期化処理 ---
function initializeApp() {
  // FirebaseのインスタンスをappStateに格納
  appState.db = db;
  appState.auth = auth;
  appState.storage = storage;

  // UIの初期化（イベントリスナーなどを設定）
  initializeUI(appState);

  // 認証状態の変化を監視
  auth.onAuthStateChanged(user => {
    onAuthStateChanged(user, appState);
  });

  // ログアウト処理のイベントリスナーを main.js に集約
  // (ui.js に依存しないようにするため)
  $('#logout-button').on('click', () => {
    signOutUser();
  });


  // URLにデータがあれば読み込み、なければローカルストレージから読み込む
  if (!loadFromUrl()) {
    loadInputsFromLocalStorage();
  }

  // ページ読み込み時に最初の計算と描画を実行
  calculateAndRender(appState);

  // ===== 変更箇所 =====
  // 最初はすべての折りたたみ項目を閉じておく
  $('.collapsible-content').hide();
  $('.form-section').removeClass('is-open');
  $('.preset-editor-container').hide();
  $('.openclose').removeClass('is-open');
  // ====================


  console.log("まおりゅうダメージ計算機が正常に初期化されました。");
}

// --- アプリケーションの起動 ---
// DOMの読み込みが完了したら、初期化処理を実行します
document.addEventListener('DOMContentLoaded', initializeApp);