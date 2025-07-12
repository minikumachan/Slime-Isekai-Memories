// ===============================================================
// ** graph.js - グラフ描画モジュール (最終統合版 v3.7.1) **
// ===============================================================

import { calculateExpectedDamage, runCalculationEngine } from './calculator.js';
import { c, v } from './ui.js';
import { buffMasterList } from './constants.js';
import { getInputsAsDataObject } from './state.js';

let damageChart = null; // Chart.jsのインスタンスを保持するグローバル変数

/**
 * グラフ関連の全要素を更新・描画します。
 * @param {object} appState - アプリケーションの状態オブジェクト
 */
export function updateGraph(appState) {
  if (!appState.isGraphModalOpen || !appState.lastTotalResult) return;

  // 各コンテナを取得
  const oldGraphContainer = $('#graph-container-old');
  const chartjsContainer = $('#chartjs-container');
  const contributionContainer = $('#buff-contribution-container');

  // コンテナをクリア
  oldGraphContainer.empty();
  chartjsContainer.empty().append('<canvas id="damageChart"></canvas>');
  contributionContainer.empty();

  const isComparison = appState.comparisonMode === 'buff' && appState.lastComparisonResult;

  // データを準備（両方のグラフで共有）
  const { flatDamageList, maxValue } = prepareGraphData(appState, isComparison);

  // 1. 従来のHTMLグラフを描画
  renderOldHtmlGraph(oldGraphContainer, flatDamageList, maxValue, isComparison);

  // 2. バフ貢献度分析を描画
  contributionContainer.html(createBuffContributionSection(appState));

  // 3. Chart.jsグラフを描画
  const { labels, datasets } = formatDataForChartJs(flatDamageList, isComparison);
  renderChartJsGraph(labels, datasets);
}


// ===============================================================
// データ準備 (両グラフで共通)
// ===============================================================

function prepareGraphData(appState, isComparison) {
  let flatDamageList = [];
  let allValues = [];

  const damageCategories = {
    normal: { name: '通常' },
    ...(c('toggle-synergy') && { synergy: { name: '協心' } }),
    ...(c('toggle-kensan') && { kensan: { name: '堅閃' } }),
    ...(c('toggle-synergy') && c('toggle-kensan') && { synergyKensan: { name: '協心+堅閃' } })
  };

  // ↓ここを修正しています↓
  const sections = [
    {
      type: 'スキル',
      data: appState.lastTotalResult.skillFinal,
      compData: isComparison ? appState.lastComparisonResult.skillFinal : null
    },
    {
      type: '奥義',
      data: appState.lastTotalResult.ultimateFinal,
      compData: isComparison ? appState.lastComparisonResult.ultimateFinal : null
    },
    // extreme-ultimate-multiplier が 0 より大きいときだけ要素を返し、
    // そうでなければ空配列を返す → 常に iterable に
    ...(v('extreme-ultimate-multiplier') > 0
      ? [{
          type: '極奥義',
          data: appState.lastTotalResult.extremeUltimateFinal,
          compData: isComparison
            ? appState.lastComparisonResult.extremeUltimateFinal
            : null
        }]
      : [])
  ];

  sections.forEach(section => {
    Object.keys(damageCategories).forEach(catKey => {
      const damage = section.data ? section.data[catKey] : undefined;
      if (damage === undefined || (damage <= 0 && catKey !== 'normal')) return;

      const { critTTL, pierceTTL, displayAttack, critRate, pierceRate } = appState.lastTotalResult;
      const compResult = appState.lastComparisonResult;
      const compDamage = isComparison && section.compData ? section.compData[catKey] : undefined;

      const createDataEntry = (type, value, compValue) => {
        const entry = {
          categoryName: damageCategories[catKey].name,
          label: section.type,
          type,
          value: value || 0,
          ...(isComparison && { compValue: compValue || 0 })
        };
        flatDamageList.push(entry);
        allValues.push(entry.value);
        if (isComparison) allValues.push(entry.compValue);
      };

      const expectedDmg = calculateExpectedDamage(
        damage,
        damage * critTTL,
        (damage + displayAttack * 0.06) * pierceTTL,
        (damage * critTTL + displayAttack * 0.06) * pierceTTL,
        critRate,
        pierceRate
      );
      let compExpectedDmg;
      if (isComparison) {
        compExpectedDmg = calculateExpectedDamage(
          compDamage,
          compDamage * compResult.critTTL,
          (compDamage + compResult.displayAttack * 0.06) * compResult.pierceTTL,
          (compDamage * compResult.critTTL + compResult.displayAttack * 0.06) * compResult.pierceTTL,
          compResult.critRate,
          compResult.pierceRate
        );
      }
      if ((c('toggle-crit') || c('toggle-pierce')) && (critRate > 0 || pierceRate > 0)) {
        createDataEntry('期待値', expectedDmg, compExpectedDmg);
      }

      createDataEntry('基礎', damage, compDamage);
      if (c('toggle-crit')) {
        createDataEntry('会心', damage * critTTL, isComparison ? compDamage * compResult.critTTL : undefined);
      }
      if (c('toggle-pierce')) {
        createDataEntry(
          '貫通',
          (damage + displayAttack * 0.06) * pierceTTL,
          isComparison ? (compDamage + compResult.displayAttack * 0.06) * compResult.pierceTTL : undefined
        );
        if (c('toggle-crit')) {
          createDataEntry(
            '会心+貫通',
            (damage * critTTL + displayAttack * 0.06) * pierceTTL,
            isComparison
              ? (compDamage * compResult.critTTL + compResult.displayAttack * 0.06) * compResult.pierceTTL
              : undefined
          );
        }
      }
    });
  });

  const maxValue = Math.max(...allValues, 1);
  return { flatDamageList, maxValue };
}


// ===============================================================
// 1. 従来のHTMLグラフ
// ===============================================================

function renderOldHtmlGraph(container, flatDamageList, maxValue, isComparison) {
  container.append(`<h2>ダメージ詳細</h2>`).append(createColorLegend());

  if (flatDamageList.length === 0) {
    container.append('<p>表示できるダメージがありません。表示トグルを確認してください。</p>');
    return;
  }

  const topDamage = [...flatDamageList].sort((a, b) => b.value - a.value)[0];
  const summaryHtml = `
      <div class="graph-top-summary">
        <span>最大ダメージパターン</span>
        <div class="top-damage-label">${topDamage.label} - ${topDamage.categoryName} / ${topDamage.type}</div>
        <div class="top-damage-value">${Math.round(topDamage.value).toLocaleString()}</div>
      </div>
    `;
  container.append(summaryHtml);

  const groupedData = flatDamageList.reduce((acc, item) => {
    const key = item.categoryName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  for (const category in groupedData) {
    const catData = groupedData[category];
    catData.sort((a, b) => b.value - a.value);
    let categoryHtml = `<h4 class="graph-category-title collapsible-graph-header">${category}<i class="fas fa-chevron-down"></i></h4><div class="collapsible-graph-content"><div class="graph">`;
    catData.forEach(item => {
      categoryHtml += createGraphBar(item, maxValue, isComparison);
    });
    categoryHtml += `</div></div>`;
    container.append(categoryHtml);
  }
}

function createGraphBar(item, maxValue, isComparison) {
  const label = `${item.label} / ${item.type}`;
  let barHtml = `<div class="graph-group"><h5>${label}</h5>`;
  const totalWidth = (item.value / maxValue) * 100;
  const totalBarColor = getGraphBarColor(item.value, maxValue);
  barHtml += `<div class="graph-item"><div class="graph-label" title="合計: ${Math.round(item.value).toLocaleString()}">合計</div><div class="graph-bar-container"><div class="graph-bar" style="width: ${totalWidth}%; background: ${totalBarColor};">${Math.round(item.value).toLocaleString()}</div></div></div>`;
  if (isComparison && typeof item.compValue !== 'undefined') {
    const compWidth = (item.compValue / maxValue) * 100;
    const compBarColor = getGraphBarColor(item.compValue, maxValue);
    const diff = item.value - item.compValue;
    const diffText = diff >= 0 ? `+${Math.round(diff).toLocaleString()}` : Math.round(diff).toLocaleString();
    barHtml += `<div class="graph-item"><div class="graph-label" style="color:#ffb899;" title="比較対象: ${Math.round(item.compValue).toLocaleString()} | 差分: ${diffText}">比較対象</div><div class="graph-bar-container"><div class="graph-bar" style="width: ${compWidth}%; background: ${compBarColor};">${Math.round(item.compValue).toLocaleString()}</div></div></div>`;
  }
  barHtml += `</div>`;
  return barHtml;
}

function getGraphBarColor(value, maxValue) {
  if (value === maxValue && maxValue > 0) return 'linear-gradient(90deg, #FEE140, #FA709A)';
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  if (percentage > 80) return 'linear-gradient(90deg, #AB6CFF, #8E2DE2)';
  if (percentage > 60) return 'linear-gradient(90deg, #A7D4FF, #4FACFE)';
  if (percentage > 40) return 'linear-gradient(90deg, #84FAB0, #8FD3F4)';
  if (percentage > 20) return 'linear-gradient(90deg, #EAEAEA, #BDBDBD)';
  return 'linear-gradient(90deg, #888, #bbb)';
}

function createColorLegend() {
  return `<div class="color-legend"><span>弱い</span><div class="color-legend-bar"></div><span>強い</span></div>`;
}

// ===============================================================
// 2. バフ貢献度分析
// ===============================================================

function createBuffContributionSection(appState) {
  const currentInputs = getInputsAsDataObject();
  const baseResult = appState.lastTotalResult;
  if (!baseResult) return '';

  const getMaxExpectedDamage = (result) => {
    let maxDmg = 0;
    const { skillFinal, ultimateFinal, extremeUltimateFinal, critTTL, pierceTTL, displayAttack, critRate, pierceRate } = result;
    [skillFinal, ultimateFinal, extremeUltimateFinal].forEach(resultSet => {
      if (!resultSet) return;
      Object.values(resultSet).forEach(damage => {
        if (damage > 0) {
          const expectedDmg = calculateExpectedDamage(damage, damage * critTTL, (damage + displayAttack * 0.06) * pierceTTL, (damage * critTTL + displayAttack * 0.06) * pierceTTL, critRate, pierceRate);
          if (expectedDmg > maxDmg) maxDmg = expectedDmg;
        }
      });
    });
    return maxDmg;
  };

  const baseMaxDamage = getMaxExpectedDamage(baseResult);
  if (baseMaxDamage === 0) return '';

  const contributions = [];
  buffMasterList.forEach(buff => {
    if ((typeof currentInputs[buff.id] === 'string' && parseFloat(currentInputs[buff.id]) > 0) || (typeof currentInputs[buff.id] === 'boolean' && currentInputs[buff.id])) {
      const tempInputs = { ...currentInputs };
      tempInputs[buff.id] = typeof tempInputs[buff.id] === 'boolean' ? false : 0;
      const resultWithoutBuff = runCalculationEngine(tempInputs);
      const maxDamageWithoutBuff = getMaxExpectedDamage(resultWithoutBuff);
      const contribution = baseMaxDamage - maxDamageWithoutBuff;
      if (contribution > 0.1) {
        contributions.push({ label: buff.label, value: contribution, percentage: (contribution / baseMaxDamage) * 100 });
      }
    }
  });

  if (contributions.length === 0) return '';
  contributions.sort((a, b) => b.value - a.value);

  let html = `
        <h2 style="text-align: center;">バフ貢献度分析</h2>
        <div class="graph-top-summary" style="margin-top: 1rem;">
            <span>最大期待ダメージ</span>
            <div class="top-damage-value">${Math.round(baseMaxDamage).toLocaleString()}</div>
        </div>
        <div class="contribution-table">
            <div class="contribution-header">
                <span>バフ名</span>
                <span>貢献ダメージ</span>
                <span>貢献率</span>
            </div>`;
  contributions.forEach(item => {
    html += `
            <div class="contribution-row">
                <span>${item.label}</span>
                <span>+${Math.round(item.value).toLocaleString()}</span>
                <span>${item.percentage.toFixed(2)}%</span>
            </div>`;
  });
  html += `</div>`;
  return html;
}

// ===============================================================
// 3. Chart.jsグラフ
// ===============================================================

function formatDataForChartJs(flatDamageList, isComparison) {
  const expectedDmgList = flatDamageList
    .filter(item => item.type === '期待値')
    .sort((a, b) => b.value - a.value);

  const labels = expectedDmgList.map(d => `${d.label} (${d.categoryName})`);
  const mainData = expectedDmgList.map(d => d.value);

  const datasets = [{
    label: '期待値ダメージ',
    data: mainData,
    backgroundColor: 'rgba(84, 235, 249, 0.6)',
    borderColor: 'rgba(84, 235, 249, 1)',
    borderWidth: 1
  }];

  if (isComparison) {
    const comparisonData = expectedDmgList.map(d => d.compValue);
    datasets.push({
      label: '比較対象 (バフ無し)',
      data: comparisonData,
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    });
  }
  return { labels, datasets };
}

function renderChartJsGraph(labels, datasets) {
  const ctx = document.getElementById('damageChart');
  if (!ctx) return;

  if (damageChart) damageChart.destroy();

  damageChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: '#fff',
            callback: value => new Intl.NumberFormat('ja-JP').format(value)
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
          ticks: { color: '#fff', font: { size: 12 } },
          grid: { display: false }
        }
      },
      plugins: {
        title: {
          display: true,
          text: '期待値ダメージ グラフ',
          color: '#fff',
          font: { size: 18, weight: 'bold' },
          padding: { top: 10, bottom: 20 }
        },
        legend: {
          position: 'bottom',
          labels: { color: '#fff' }
        },
        tooltip: {
          callbacks: {
            label: context => {
              let lbl = context.dataset.label || '';
              if (lbl) lbl += ': ';
              if (context.parsed.x !== null) {
                lbl += new Intl.NumberFormat('ja-JP').format(context.parsed.x);
              }
              return lbl;
            }
          }
        }
      }
    }
  });
}
