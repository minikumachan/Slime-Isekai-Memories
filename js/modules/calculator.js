// ===============================================================
// ** calculator.js - 計算エンジンモジュール **
// ===============================================================
import { getInputsAsDataObject } from './state.js';
import { c, v } from './ui.js';

/**
 * 入力データに基づいてダメージ計算を実行するコアエンジン
 * @param {object} inputData - 計算に使用する入力値のオブジェクト
 * @returns {object} - 計算結果のオブジェクト
 */
export function runCalculationEngine(inputData) {
  const p = id => (parseFloat(inputData[id]) || 0) / 100;
  const val = id => parseFloat(inputData[id]) || 0;
  const m = id => { const v = parseFloat(inputData[id]); return isNaN(v) || v <= 0 ? 1.0 : v; };
  const chk = id => inputData[id] || false;
  const s = id => inputData[id] || '';

  const baseAttack = val('base-attack-power'), baseDefense = val('base-defense-power'), enemyBaseDefense = val('enemy-defense-power'), baseSupportAttack = val('support-attack-power'), ultimateMagnification = p('ultimate-magnification'), dragonAuraCorrect = chk('is-dragon-aura') ? 1.2 : 1, charmCorrect = chk('is-charmed') ? 0.95 : 1, attackType = s('ultimate-type');
  let affinityCorrect = 1.0; if (s('affinity') === 'favorable' || s('affinity') === 'eiketsu') affinityCorrect = 1.5; if (s('affinity') === 'unfavorable') affinityCorrect = 0.7;
  let debuffAmpCorrect = 1.0; if (chk('is-frostbite')) debuffAmpCorrect += 0.3; if (chk('is-dominated')) debuffAmpCorrect += 0.3; if (chk('is-tremor')) debuffAmpCorrect += 0.4;
  const attackBuffTotal = p('attack-buff') + p('attack-buff-trait') + p('attack-buff-cumulative') + p('attack-buff-faction') + p('attack-buff-faction-support') + p('attack-buff-divine-lead') + p('attack-buff-divine-lead-support') + p('attack-buff-divine-trait') + p('attack-buff-divine-trait-support');
  const defenseBuffTotal = p('defense-buff') + p('defense-trait') + p('defense-special-stat') + p('defense-ex-talent') + p('defense-engraved-seal') + p('defense-divine-lead') + p('defense-divine-lead-support') + p('defense-divine-trait') + p('defense-divine-trait-support');
  const selfAttrBuffTotal = p('all-attr-buff') + p('attr-buff') + p('attr-buff-cumulative') + p('attr-buff-divine-lead') + p('attr-buff-divine-lead-support');
  const selfPmBuffTotal = p('pm-buff') + p('pm-buff-cumulative') + p('pm-buff-divine-lead') + p('pm-buff-divine-lead-support') + p('pm-buff-divine-trait') + p('pm-buff-divine-trait-support');
  const aoeAttackBuffTotal = p('aoe-attack-buff') + p('aoe-attack-buff-cumulative');
  const ultimateBuffTotal = p('ultimate-buff') + p('ultimate-buff-cumulative'), extremeUltimateBuffTotal = p('extreme-ultimate-buff'), soulBuffTotal = p('soul-buff'), charmSpecialTotal = p('charm-special-buff'), stunSpecialTotal = p('stun-special-buff'), affinityUpTotal = p('affinity-up-buff'), weakPointBuffTotal = p('weak-point-buff') + p('weak-point-infinite-buff'), pmDamageUpTotal = p('pm-damage-up'), attrDamageUpTotal = p('attr-damage-up'), pmDamageResistDebuffTotal = p('pm-damage-resist-debuff'), attrDamageResistDebuffTotal = p('attr-damage-resist-debuff');
  const totalPmDamageCoeff = (pmDamageUpTotal * dragonAuraCorrect) + (pmDamageResistDebuffTotal * debuffAmpCorrect), totalAttrDamageCoeff = (attrDamageUpTotal * dragonAuraCorrect) + (attrDamageResistDebuffTotal * debuffAmpCorrect), damagePowerCoeff = (1 + totalPmDamageCoeff) * (1 + totalAttrDamageCoeff);
  const critPowerTotal = p('crit-buff') + p('crit-ex-talent') + p('crit-special-stat') + p('crit-trait') + p('crit-divine-trait') + p('crit-engraved-seal'), piercePowerTotal = p('pierce-buff') + p('pierce-ex-talent') + p('pierce-special-stat') + p('pierce-trait') + p('pierce-divine-trait') + p('pierce-engraved-seal'), synergyPowerTotal = p('synergy-buff') + p('synergy-ex-talent') + p('synergy-special-stat') + p('synergy-trait'), kensanPowerTotal = p('kensan-buff') + p('kensan-ex-talent') + p('kensan-special-stat') + p('kensan-trait');
  const enemyAttrResistBuffTotal = p('enemy-all-attr-resist-buff') + p('enemy-attr-resist-buff'), enemyPmResistBuffTotal = p('enemy-pm-resist-buff'), critResistBuffTotal = p('enemy-crit-resist-buff'), pierceResistBuffTotal = p('enemy-pierce-resist-buff'), synergyResistBuffTotal = p('enemy-synergy-resist-buff'), kensanResistBuffTotal = p('enemy-kensan-resist-buff'), ultimateResistBuffTotal = p('enemy-ultimate-resist-buff'), weakPointResistBuffTotal = p('enemy-weak-point-resist-buff');
  const defenseDebuffTotal = p('defense-debuff') + p('defense-debuff-divine-trait'), enemyAttrResistDebuffTotal = p('enemy-all-attr-resist-debuff') + p('attr-resist-debuff'), enemyPmResistDebuffTotal = p('pm-resist-debuff'), singleTargetResistDebuffTotal = p('single-target-resist-debuff'), aoeResistDebuffTotal = p('aoe-resist-debuff'), ultimateResistDebuffTotal = p('ultimate-resist-debuff'), weakPointResistDebuffTotal = p('weak-point-resist-debuff'), critResistDebuffTotal = p('crit-resist-debuff') + p('crit-resist-debuff-trait') + p('crit-resist-debuff-divine-trait'), pierceResistDebuffTotal = p('pierce-resist-debuff') + p('pierce-resist-debuff-trait') + p('pierce-resist-debuff-divine-trait'), synergyResistDebuffTotal = p('synergy-resist-debuff') + p('synergy-resist-debuff-trait'), kensanResistDebuffTotal = p('kensan-resist-debuff') + p('kensan-resist-debuff-trait');
  const displayAttack = baseAttack * (1 + attackBuffTotal * dragonAuraCorrect) * charmCorrect, displayDefense = baseDefense * (1 + defenseBuffTotal), enemyPmResistCoeff = 1 + (enemyPmResistDebuffTotal * debuffAmpCorrect - enemyPmResistBuffTotal), enemyAttrResistCoeff = 1 + (enemyAttrResistDebuffTotal * debuffAmpCorrect - enemyAttrResistBuffTotal), enemyActualDefense = enemyBaseDefense * (1 - defenseDebuffTotal * debuffAmpCorrect) * enemyPmResistCoeff * enemyAttrResistCoeff, baseActualAttack = displayAttack * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect), aoeActualAttack = baseActualAttack * (1 + aoeAttackBuffTotal * dragonAuraCorrect), kensanAddedAttack = (displayDefense * 0.4) * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect), supportActualAttackSingle = baseSupportAttack * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect) * 0.4, supportActualAttackAoe = baseSupportAttack * (1 + selfAttrBuffTotal * dragonAuraCorrect) * (1 + selfPmBuffTotal * dragonAuraCorrect) * (1 + aoeAttackBuffTotal * dragonAuraCorrect) * 0.4;
  const isAoe = (attackType === 'aoe'), mainActualAttack = isAoe ? aoeActualAttack : baseActualAttack, supportActualAttack = isAoe ? supportActualAttackAoe : supportActualAttackSingle;
  const normalBaseDmg = (mainActualAttack * 2 - enemyActualDefense) * 0.2, synergyBaseDmg = ((mainActualAttack + supportActualAttack) * 2 - enemyActualDefense) * 0.2, kensanBaseDmg = ((mainActualAttack + kensanAddedAttack) * 2 - enemyActualDefense) * 0.2, synergyKensanBaseDmg = ((mainActualAttack + supportActualAttack + kensanAddedAttack) * 2 - enemyActualDefense) * 0.2;
  const critTTL = 1.3 + (critPowerTotal * dragonAuraCorrect) + ((critResistDebuffTotal * debuffAmpCorrect) - critResistBuffTotal), pierceTTL = 1 + (piercePowerTotal * dragonAuraCorrect) + ((pierceResistDebuffTotal * debuffAmpCorrect) - pierceResistBuffTotal), synergyTTL = 1 + (synergyPowerTotal * dragonAuraCorrect) + ((synergyResistDebuffTotal * debuffAmpCorrect) - synergyResistBuffTotal), kensanTTL = 1 + (kensanPowerTotal * dragonAuraCorrect) + ((kensanResistDebuffTotal * debuffAmpCorrect) - kensanResistBuffTotal);
  let finalAffinityCorrect = (s('affinity') === 'eiketsu') ? 1.6 : affinityCorrect;
  const affinityWeaknessCoeff = (finalAffinityCorrect * (1 + affinityUpTotal * dragonAuraCorrect)) + (weakPointBuffTotal * dragonAuraCorrect) + ((weakPointResistDebuffTotal * debuffAmpCorrect) - weakPointResistBuffTotal), targetResistDebuffTotal = isAoe ? aoeResistDebuffTotal : singleTargetResistDebuffTotal, specialResistCoeff = (1 + (stunSpecialTotal + charmSpecialTotal) * dragonAuraCorrect) * (1 + targetResistDebuffTotal * debuffAmpCorrect);
  let trueReleaseMultiplier = 1.0;
  if (s('target-weakness-type') === 'weak') trueReleaseMultiplier = m('true-release-weak-mult');
  else if (s('target-weakness-type') === 'super-weak') trueReleaseMultiplier = m('true-release-super-weak-mult');
  const commonCoeff = affinityWeaknessCoeff * specialResistCoeff;
  const calculateFinalDamage = (baseDmg) => (baseDmg > 0 ? baseDmg : 0) * damagePowerCoeff * commonCoeff * trueReleaseMultiplier;
  const skillBase = { normal: calculateFinalDamage(normalBaseDmg), synergy: calculateFinalDamage(synergyBaseDmg), kensan: calculateFinalDamage(kensanBaseDmg), synergyKensan: calculateFinalDamage(synergyKensanBaseDmg) };

  const ultimateResistCoeff = (1 + ((ultimateResistDebuffTotal * debuffAmpCorrect) - ultimateResistBuffTotal));
  const extremeUltMultiplier = m('extreme-ultimate-multiplier');
  const ultimateCoeff = ultimateMagnification * (1 + ultimateBuffTotal) * ultimateResistCoeff;
  const extremeUltimateCoeff = (ultimateMagnification * extremeUltMultiplier) * (1 + ultimateBuffTotal + extremeUltimateBuffTotal) * ultimateResistCoeff;

  const ultimateBase = { normal: skillBase.normal * ultimateCoeff, synergy: skillBase.synergy * ultimateCoeff, kensan: skillBase.kensan * ultimateCoeff, synergyKensan: skillBase.synergyKensan * ultimateCoeff };
  const extremeUltimateBase = { normal: skillBase.normal * extremeUltimateCoeff, synergy: skillBase.synergy * extremeUltimateCoeff, kensan: skillBase.kensan * extremeUltimateCoeff, synergyKensan: skillBase.synergyKensan * extremeUltimateCoeff };

  const applyEffects = (damage, hasSynergy, hasKensan) => {
    let finalDmg = damage;
    if (hasSynergy) finalDmg *= synergyTTL;
    if (hasKensan) finalDmg *= kensanTTL;
    return finalDmg > 0 ? finalDmg : 0;
  };

  const skillFinal = { normal: applyEffects(skillBase.normal, false, false), synergy: applyEffects(skillBase.synergy, true, false), kensan: applyEffects(skillBase.kensan, false, true), synergyKensan: applyEffects(skillBase.synergyKensan, true, true) };
  Object.keys(skillFinal).forEach(key => { skillFinal[key] *= (1 + soulBuffTotal); });

  const ultimateFinal = { normal: applyEffects(ultimateBase.normal, false, false), synergy: applyEffects(ultimateBase.synergy, true, false), kensan: applyEffects(ultimateBase.kensan, false, true), synergyKensan: applyEffects(ultimateBase.synergyKensan, true, true) };
  Object.keys(ultimateFinal).forEach(key => { ultimateFinal[key] *= (1 + soulBuffTotal); });

  const extremeUltimateFinal = { normal: applyEffects(extremeUltimateBase.normal, false, false), synergy: applyEffects(extremeUltimateBase.synergy, true, false), kensan: applyEffects(extremeUltimateBase.kensan, false, true), synergyKensan: applyEffects(extremeUltimateBase.synergyKensan, true, true) };
  Object.keys(extremeUltimateFinal).forEach(key => { extremeUltimateFinal[key] *= (1 + soulBuffTotal); });

  return { displayAttack, mainActualAttack, enemyActualDefense, isAoe, skillFinal, ultimateFinal, extremeUltimateFinal, critTTL, pierceTTL, critRate: p('crit-rate'), pierceRate: p('pierce-rate') };
}


/**
 * 期待値ダメージを計算します。
 * @param {number} normal - 通常ダメージ
 * @param {number} crit - 会心ダメージ
 * @param {number} pierce - 貫通ダメージ
 * @param {number} critPierce - 会心+貫通ダメージ
 * @param {number} critRate - 会心率
 * @param {number} pierceRate - 貫通率
 * @returns {number} 期待値
 */
export function calculateExpectedDamage(normal, crit, pierce, critPierce, critRate, pierceRate) {
  if (critRate === 0 && pierceRate === 0) return normal;
  const c = critRate, p = pierceRate;
  return (normal * (1 - c) * (1 - p)) + (crit * c * (1 - p)) + (pierce * (1 - c) * p) + (critPierce * c * p);
}