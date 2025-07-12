// ===============================================================
// ** 定数ファイル (v1.0.0) **
// アプリケーションで使用する定数を一元管理します。
// ===============================================================

export const MAX_DATA_SLOTS = 10;
export const THEME_KEY = "maoryuTheme";
export const AUTOSAVE_KEY_LOCAL = "maoryuAutoSave_local";
export const SKILL_PRESET_KEY = "maoryuSkillPresets_v2_local";
export const DATA_PRESET_KEY_LOCAL = "maoryuDataPresets_v1_local"; // <<< この行を追加

export const buffMasterList = [{ category: "状態異常", id: "is-dragon-aura", label: "竜気状態" }, { category: "状態異常", id: "is-charmed", label: "魅了/束縛" }, { category: "状態異常", id: "is-frostbite", label: "凍傷" }, { category: "状態異常", id: "is-dominated", label: "支配" }, { category: "状態異常", id: "is-tremor", label: "戦慄" }, { category: "基礎ステータス", id: "base-attack-power", label: "基礎攻撃力" }, { category: "基礎ステータス", id: "base-defense-power", label: "自キャラ基礎防御力" }, { category: "基礎ステータス", id: "enemy-defense-power", label: "敵の基礎防御力" }, { category: "基礎ステータス", id: "support-attack-power", label: "基礎支援攻撃力" }, { category: "基礎ステータス", id: "ultimate-magnification", label: "奥義倍率(%)" }, { category: "基礎ステータス", id: "affinity-up-buff", label: "相性強化" }, { category: "攻撃系バフ", id: "attack-buff", label: "攻撃バフ(スキル)" }, { category: "攻撃系バフ", id: "attack-buff-trait", label: "攻撃バフ(特性)" }, { category: "攻撃系バフ", id: "attack-buff-cumulative", label: "攻撃バフ(累積)" }, { category: "攻撃系バフ", id: "attack-buff-faction", label: "攻撃バフ(勢力)" }, { category: "攻撃系バフ", id: "attack-buff-faction-support", label: "攻撃バフ(勢力支援)" }, { category: "攻撃系バフ", id: "attack-buff-divine-lead", label: "攻撃バフ(加護の導き)" }, { category: "攻撃系バフ", id: "attack-buff-divine-lead-support", label: "攻撃バフ(加護の導き支援)" }, { category: "攻撃系バフ", id: "attack-buff-divine-trait", label: "攻撃バフ(加護特性)" }, { category: "攻撃系バフ", id: "attack-buff-divine-trait-support", label: "攻撃バフ(加護特性支援)" }, { category: "属性・物/魔バフ", id: "all-attr-buff", label: "全属性バフ" }, { category: "属性・物/魔バフ", id: "attr-buff", label: "属性バフ" }, { category: "属性・物/魔バフ", id: "attr-buff-cumulative", label: "属性バフ(累積)" }, { category: "属性・物/魔バフ", id: "attr-buff-divine-lead", label: "属性バフ(加護の導き)" }, { category: "属性・物/魔バフ", id: "attr-buff-divine-lead-support", label: "属性バフ(加護の導き支援)" }, { category: "属性・物/魔バフ", id: "pm-buff", label: "物/魔バフ" }, { category: "属性・物/魔バフ", id: "pm-buff-cumulative", label: "物/魔バフ(累積)" }, { category: "属性・物/魔バフ", id: "pm-buff-divine-lead", label: "物/魔バフ(加護の導き)" }, { category: "属性・物/魔バフ", id: "pm-buff-divine-lead-support", label: "物/魔バフ(加護の導き支援)" }, { category: "属性・物/魔バフ", id: "pm-buff-divine-trait", label: "物/魔バフ(加護特性)" }, { category: "属性・物/魔バフ", id: "pm-buff-divine-trait-support", label: "物/魔バフ(加護特性支援)" }, { category: "その他バフ", id: "aoe-attack-buff", label: "全体攻撃バフ" }, { category: "その他バフ", id: "aoe-attack-buff-cumulative", label: "全体攻撃バフ(累積)" }, { category: "その他バフ", id: "ultimate-buff", label: "奥義バフ" }, { category: "その他バフ", id: "ultimate-buff-cumulative", label: "奥義バフ(累積)" }, { category: "その他バフ", id: "extreme-ultimate-buff", label: "極奥義バフ" }, { category: "その他バフ", id: "soul-buff", label: "魔創魂バフ" }, { category: "その他バフ", id: "charm-special-buff", label: "魅了特攻" }, { category: "その他バフ", id: "stun-special-buff", label: "気絶特攻" }, { category: "その他バフ", id: "weak-point-buff", label: "弱点特攻" }, { category: "その他バフ", id: "weak-point-infinite-buff", label: "弱点特攻(無限)" }, { category: "ダメージ威力系", id: "pm-damage-up", label: "物魔ダメージ威力UP" }, { category: "ダメージ威力系", id: "attr-damage-up", label: "属性ダメージ威力UP" }, { category: "ダメージ威力系", id: "pm-damage-resist-debuff", label: "物/魔ダメージ耐性ダウン" }, { category: "ダメージ威力系", id: "attr-damage-resist-debuff", label: "属性ダメージ耐性ダウン" }, { category: "敵へのデバフ", id: "defense-debuff", label: "防御力デバフ" }, { category: "敵へのデバフ", id: "defense-debuff-divine-trait", label: "防御力デバフ(加護)" }, { category: "敵へのデバフ", id: "enemy-all-attr-resist-buff", label: "全属性耐性バフ" }, { category: "敵へのデバフ", id: "enemy-all-attr-resist-debuff", label: "全属性耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-attr-resist-buff", label: "属性耐性バフ" }, { category: "敵へのデバフ", id: "attr-resist-debuff", label: "属性耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-pm-resist-buff", label: "物/魔耐性バフ" }, { category: "敵へのデバフ", id: "pm-resist-debuff", label: "物/魔耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-crit-resist-buff", label: "会心耐性バフ" }, { category: "敵へのデバフ", id: "crit-resist-debuff", label: "会心耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-pierce-resist-buff", label: "貫通耐性バフ" }, { category: "敵へのデバフ", id: "pierce-resist-debuff", label: "貫通耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-synergy-resist-buff", label: "協心耐性バフ" }, { category: "敵へのデバフ", id: "synergy-resist-debuff", label: "協心耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-kensan-resist-buff", label: "堅閃耐性バフ" }, { category: "敵へのデバフ", id: "kensan-resist-debuff", label: "堅閃耐性デバフ" }, { category: "敵へのデバフ", id: "single-target-resist-debuff", label: "単体攻撃耐性デバフ" }, { category: "敵へのデバフ", id: "aoe-resist-debuff", label: "全体攻撃耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-ultimate-resist-buff", label: "奥義耐性バフ" }, { category: "敵へのデバフ", id: "ultimate-resist-debuff", label: "奥義耐性デバフ" }, { category: "敵へのデバフ", id: "weak-point-resist-debuff", label: "弱点耐性デバフ" }, { category: "敵へのデバフ", id: "enemy-weak-point-resist-buff", label: "弱点耐性バフ" }, { category: "会心", id: "crit-buff", label: "会心力バフ" }, { category: "会心", id: "crit-ex-talent", label: "会心力(EX才能)" }, { category: "会心", id: "crit-resist-debuff-trait", label: "会心耐性デバフ(特性)" }, { category: "貫通", id: "pierce-buff", label: "貫通力バフ" }, { category: "貫通", id: "pierce-ex-talent", label: "貫通力(EX才能)" }, { category: "貫通", id: "pierce-resist-debuff-trait", label: "貫通耐性デバフ(特性)" },];
export const skillPresetStructure = [{ category: "状態異常", type: "state", id: "is-charmed", label: "魅了/束縛" }, { category: "状態異常", type: "state", id: "is-frostbite", label: "凍傷" }, { category: "状態異常", type: "state", id: "is-dominated", label: "支配" }, { category: "状態異常", type: "state", id: "is-tremor", label: "戦慄" }, { category: "状態異常", type: "state", id: "is-dragon-aura", label: "竜気状態" }, { category: "バフ", type: "text", id: "attack-buff", label: "攻撃バフ" }, { category: "バフ", type: "text", id: "all-attr-buff", label: "全属性バフ" }, { category: "バフ", type: "text", id: "attr-buff", label: "属性バフ" }, { category: "バフ", type: "text", id: "pm-buff", label: "物魔バフ" }, { category: "バフ", type: "text", id: "aoe-attack-buff", label: "全体攻撃バフ" }, { category: "バフ", type: "text", id: "ultimate-buff", label: "奥義バフ" }, { category: "バフ", type: "text", id: "extreme-ultimate-buff", label: "極奥義バフ" }, { category: "バフ", type: "text", id: "pm-damage-up", label: "物魔ダメージ威力UP" }, { category: "バフ", type: "text", id: "attr-damage-up", label: "属性ダメージ威力UP" }, { category: "バフ", type: "text", id: "pm-damage-resist-debuff", label: "物/魔ダメージ耐性ダウン" }, { category: "バフ", type: "text", id: "attr-damage-resist-debuff", label: "属性ダメージ耐性ダウン" }, { category: "バフ", type: "text", id: "soul-buff", label: "魔創魂バフ" }, { category: "バフ", type: "text", id: "charm-special-buff", label: "魅了特攻" }, { category: "バフ", type: "text", id: "stun-special-buff", label: "気絶特攻" }, { category: "バフ", type: "text", id: "weak-point-buff", label: "弱点特攻" }, { category: "バフ", type: "text", id: "defense-buff", label: "防御力バフ" }, { category: "バフ", type: "text", id: "crit-buff", label: "会心力バフ" }, { category: "バフ", type: "text", id: "pierce-buff", label: "貫通力バフ" }, { category: "バフ", type: "text", id: "synergy-buff", label: "協心力バフ" }, { category: "バフ", type: "text", id: "kensan-buff", label: "堅閃力バフ" }, { category: "デバフ", type: "text", id: "defense-debuff", label: "[敵]防御力デバフ" }, { category: "デバフ", type: "text", id: "enemy-all-attr-resist-buff", label: "[敵]全属性耐性バフ" }, { category: "デバフ", type: "text", id: "enemy-all-attr-resist-debuff", label: "[敵]全属性耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-attr-resist-buff", label: "[敵]属性耐性バフ" }, { category: "デバフ", type: "text", id: "attr-resist-debuff", label: "[敵]属性耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-pm-resist-buff", label: "[敵]物/魔耐性バフ" }, { category: "デバフ", type: "text", id: "pm-resist-debuff", label: "[敵]物/魔耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-weak-point-resist-buff", label: "[敵]弱点耐性バフ" }, { category: "デバフ", type: "text", id: "weak-point-resist-debuff", label: "[敵]弱点耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-ultimate-resist-buff", label: "[敵]奥義耐性バフ" }, { category: "デバフ", type: "text", id: "ultimate-resist-debuff", label: "[敵]奥義耐性デバフ" }, { category: "デバフ", type: "text", id: "single-target-resist-debuff", label: "[敵]単体攻撃耐性デバフ" }, { category: "デバフ", type: "text", id: "aoe-resist-debuff", label: "[敵]全体攻撃耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-crit-resist-buff", label: "[敵]会心耐性バフ" }, { category: "デバフ", type: "text", id: "crit-resist-debuff", label: "[敵]会心耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-pierce-resist-buff", label: "[敵]貫通耐性バフ" }, { category: "デバフ", type: "text", id: "pierce-resist-debuff", label: "[敵]貫通耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-synergy-resist-buff", label: "[敵]協心耐性バフ" }, { category: "デバフ", type: "text", id: "synergy-resist-debuff", label: "[敵]協心耐性デバフ" }, { category: "デバフ", type: "text", id: "enemy-kensan-resist-buff", label: "[敵]堅閃耐性バフ" }, { category: "デバフ", type: "text", id: "kensan-resist-debuff", label: "[敵]堅閃耐性デバフ" },];
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
  'combat-conditions': {
    title: '戦闘条件',
    content: `
      <strong>攻撃の種類:</strong> 単体攻撃か全体攻撃かを選択します。<br>
      <strong>属性相性:</strong> 敵に対する属性の相性を選択します。<br>
      <strong>会心率(%)/貫通率(%):</strong> 期待値計算に使用します。100%クリティカルなどの場合は100と入力。<br>
      <strong>真・属性解放:</strong> 対応する弱点属性で攻撃する際の倍率を入力します。
    `
  },
  'attack-buffs': {
    title: '攻撃系バフ',
    content: 'スキル、特性、加護の導きなど、種類を問わず全ての攻撃力バフの数値を合計して入力してください。'
  },
  'element-pm-buffs': {
    title: '属性・物/魔バフ',
    content: '全属性攻撃アップ、特定の属性攻撃アップ、物理または魔法攻撃アップのバフをそれぞれ合計して入力します。'
  },
  'other-buffs': {
    title: 'その他バフ',
    content: '奥義ダメージアップ、魔創魂バフ、特定の状態異常の敵への特攻など、特殊なバフの数値を入力します。'
  },
  'damage-power': {
    title: 'ダメージ威力系',
    content: '「物理/魔法ダメージ威力UP」や「属性ダメージ威力UP」、また敵の「耐性DOWN」デバフの値を入力します。これらは最終ダメージに乗算される強力な効果です。'
  },
  'enemy-debuffs': {
    title: '敵へのバフ/デバフ',
    content: '敵に付与されている防御デバフや、各種耐性バフ・デバフの値を入力します。敵の耐性バフはマイナス効果として機能します。'
  },
  'crit-buffs': {
    title: '会心',
    content: '会心力バフや、会心耐性デバフの値を入力します。これらは会心ダメージの倍率に影響します。'
  },
  'pierce-buffs': {
    title: '貫通',
    content: '貫通力バフや、貫通耐性デバフの値を入力します。これらは貫通ダメージの倍率に影響します。'
  },
  'synergy-buffs': {
    title: '協心',
    content: '協心力バフや、協心耐性デバフの値を入力します。これらは協心ダメージの倍率に影響します。'
  },
  'kensan-buffs': {
    title: '堅閃',
    content: '堅閃力バフや、堅閃耐性デバフの値を入力します。これらは堅閃ダメージの倍率に影響します。'
  },
  'self-defense': {
    title: '自キャラ防御力バフ',
    content: '自身の防御力に影響するバフの値を入力します。主に堅閃ダメージの計算に影響します。'
  }
};