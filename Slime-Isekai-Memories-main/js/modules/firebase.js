// ===============================================================
// ** firebase.js - Firebase 初期化モジュール (修正版) **
// ===============================================================

// Firebase設定情報
const firebaseConfig = {
  apiKey: "AIzaSyBYpP9_H5D9YpGA0kIDZbMlRplU7qmRX2Y",
  authDomain: "damage-login-project.firebaseapp.com",
  projectId: "damage-login-project",
  storageBucket: "damage-login-project.firebasestorage.app",
  messagingSenderId: "226418977169",
  appId: "1:226418977169:web:de3197437b1e5cb5ed1230",
  measurementId: "G-1XQ5ENVVSE"
};

// Firebaseの初期化（一度だけ実行）
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebaseが正常に初期化されました。");
}

// 初期化したサービスを定数として取得
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// 初期化済みのサービスをエクスポート
export { db, auth, storage };