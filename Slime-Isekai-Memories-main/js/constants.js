// ===============================================================
// ** 定数ファイル **
// アプリケーションで使用する定数を一元管理します。
// `export` を使って他のファイルから読み込めるようにします。
// ===============================================================

export const buffMasterList = [
    { category: "状態異常", id: "is-dragon-aura", label: "竜気状態" },
    // ... (元の内容と同じ)
];

export const skillPresetStructure = [
    { category: "状態異常", type: "state", id: "is-charmed", label: "魅了/束縛" },
    // ... (元の内容と同じ)
];

export const tooltips = {
    'base-stats': {
        title: '基礎ステータス',
        content: `
      <strong>基礎攻撃力:</strong> キャラクターの素の攻撃力。<br>
      <strong>自キャラ基礎防御力:</strong> 堅閃ダメージの計算に使用します。<br>
      <strong>敵の基礎防御力:</strong> 敵のステータスを入力します。<br>
      <strong>基礎支援攻撃力:</strong> 協心ダメージの計算に使用します。<br>
      <strong>奥義倍率(%):</strong> 奥義やスキルの説明に記載されている倍率（例: 550%なら550と入力）。<br>
      <strong>相性強化:</strong> 特性などによる、有利相性ダメージをさらに伸ばすバフの合計値。
    `
    },
    // ... (元の内容と同じ)
};

export const THEME_KEY = "maoryuTheme";
export const AUTOSAVE_KEY_LOCAL = "maoryuAutoSave_local";
export const SKILL_PRESET_KEY = "maoryuSkillPresets_v2_local";
export const MAX_DATA_SLOTS = 10;