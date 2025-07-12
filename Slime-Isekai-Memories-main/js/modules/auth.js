// ===============================================================
// ** auth.js - 認証管理モジュール **
// ===============================================================

import { auth } from './firebase.js';
// showCustomConfirm をインポートリストに追加
import { showToast, updateUiForLoggedInUser, updateUiForLoggedOutUser, calculateAndRender, closeModal, showCustomConfirm } from './ui.js';
import { loadAllDataFromFirestore, loadInputsFromLocalStorage } from './state.js';
import { renderDataPresetButtons, renderSkillPresetEditor, renderSkillPresetActivator } from './presets.js';

/**
 * Googleアカウントでサインインします。
 */
export function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((error) => {
    console.error("Googleログインエラー:", error);
    showToast("Googleログインに失敗しました。", "error");
  });
}

/**
 * ユーザーをサインアウトします。
 * confirm() を showCustomConfirm() に置き換え
 */
export async function signOutUser() {
  if (await showCustomConfirm("ログアウトしますか？")) {
    try {
      await auth.signOut();
      // 成功時のToast通知は onAuthStateChanged でハンドリングされるため不要
    } catch (error) {
      console.error("ログアウトエラー:", error);
      showToast("ログアウトに失敗しました。", "error");
    }
  }
}


/**
 * 認証状態の変更をハンドリングします。
 * @param {object | null} user - Firebaseのユーザーオブジェクト
 * @param {object} appState - アプリケーションの状態オブジェクト
 */
export function onAuthStateChanged(user, appState) {
  if (user) {
    if (appState.currentUser?.uid === user.uid) return;

    appState.currentUser = user;
    updateUiForLoggedInUser(user);
    loadAllDataFromFirestore(appState); // データをFirestoreからロード
    closeModal($('#login-modal'));
  } else {
    // ログアウト後の処理
    if (appState.currentUser) { // currentUser が null でない場合のみ（つまり、ログアウト直後のみ）実行
      showToast("ログアウトしました。", "info");
    }
    appState.currentUser = null;
    if (appState.unsubscribeCalculatorListener) {
      appState.unsubscribeCalculatorListener();
      appState.unsubscribeCalculatorListener = null;
    }
    updateUiForLoggedOutUser();
    loadInputsFromLocalStorage(); // ローカルストレージからデータをロード
    // ログアウト状態のUIを描画
    renderDataPresetButtons(null, appState);
    renderSkillPresetEditor([], appState);
    renderSkillPresetActivator([], appState);
    calculateAndRender(appState);
  }
}