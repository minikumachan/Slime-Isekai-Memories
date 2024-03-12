//テキストボックスの切り替え
function toggleInput(row) {
  var effectSelect = document.getElementsByClassName("effect")[row];
  var buffInput = document.getElementsByClassName("buff")[row];
  var debuffInput = document.getElementsByClassName("debuff")[row];
  if (effectSelect.value === "buff") {
    if (buffInput.value == "") {
      buffInput.value = "0";
    }
    buffInput.disabled = false;
    buffInput.placeholder = "バフ倍率を入力してください";
    debuffInput.disabled = true;
    debuffInput.placeholder = "0";
    debuffInput.value = "0";
  } else if (effectSelect.value === "debuff") {
    if (debuffInput.value == "") {
      debuffInput.value = "0";
    }
    debuffInput.disabled = false;
    debuffInput.placeholder = "デバフ倍率を入力してください";
    buffInput.disabled = true;
    buffInput.placeholder = "0";
    buffInput.value = "0";
  } else if (effectSelect.value === "both") {
    if (buffInput.value == "") {
      buffInput.value = "0";
    }
    buffInput.disabled = false;
    buffInput.placeholder = "バフ倍率を入力してください";
    if (debuffInput.value == "") {
      debuffInput.value = "0";
    }
    debuffInput.disabled = false;
    debuffInput.placeholder = "デバフ倍率を入力してください";
  } else {
    buffInput.value = "0";
    debuffInput.value = "0";
    buffInput.disabled = true;
    buffInput.placeholder = "0";
    debuffInput.disabled = true;
    debuffInput.placeholder = "0";
  }
}
//奥義発動時はコンボ・超反撃を無効にする
function combochange0(ischecked) {
  if (ischecked == true) {
    document.getElementById("4combo").disabled = true;
    document.getElementById("5combo").disabled = true;
    document.getElementById("6combo").disabled = true;
    document.getElementById("combonasi").checked = true;
    document.getElementById("hangekiari").disabled = true;
    document.getElementById("hangekinasi").checked = true;
  }
}

function combochange1(ischecked) {
  if (ischecked == true) {
    document.getElementById("4combo").disabled = false;
    document.getElementById("5combo").disabled = false;
    document.getElementById("6combo").disabled = false;
    document.getElementById("hangekiari").disabled = false;
  }
}
function keisan(
  attack,
  defense,
  subattack,
  kaisinbuff,
  kaisindebuff,
  kantubuff,
  kantudebuff,
  kyousinbuff,
  kyousindebuff,
  attackbuff,
  attackdebuff,
  mahoubuturibuff,
  mahoubuturidebuff,
  zokuseibuff,
  zokuseidebuff,
  zenzokuseibuff,
  zenzokuseidebuff,
  jyakutenbuff,
  hangekibuff,
  hangekidebuff,
  guardkantubuff,
  guardkantudebuff,
  kizetubuff,
  kizetudebuff,
  ougibuff,
  ougidebuff,
  bougyobuff,
  bougyodebuff,
  mahoubuturitaiseibuff,
  mahoubuturitaiseidebuff,
  zokuseitaiseibuff,
  zokuseitaiseidebuff,
  zenzokuseitaiseibuff,
  zenzokuseitaiseidebuff,
  kaisintaiseibuff,
  kaisintaiseidebuff,
  kantutaiseibuff,
  kantutaiseidebuff,
  kyousintaiseibuff,
  kyousintaiseidebuff,
  hangekitaiseibuff,
  hangekitaiseidebuff,
  guardryokubuff,
  guardryokudebuff,
  ougitaiseibuff,
  ougitaiseidebuff,
  ougibairitu,
  kagobuff,
  shienbuff
) {
  var mojisiki2;
  var susiki2;
  var jyakutenValue = 50;
  var teikouValue = -30;
  var kaisin = 30;
  var guard = 50;
  var tyouguard = 25;
  var basedamage = 0;
  var kougekiryoku = 0;
  var ransu2 = 0;
  var ransu3 = 0;
  var jyakutenChecked = document.getElementById("jyakuten").checked;
  var teikouChecked = document.getElementById("teikou").checked;
  var kaisinChecked = document.getElementById("kaisinari").checked;
  var guardChecked = document.getElementById("guardari").checked;
  var tyouguardChecked = document.getElementById("tyouguardari").checked;
  var ougiChecked = document.getElementById("ougiari").checked;
  var comboChecked = document.getElementById("combonasi").checked;
  var comboChecked4 = document.getElementById("4combo").checked;
  var comboChecked5 = document.getElementById("5combo").checked;
  var comboChecked6 = document.getElementById("6combo").checked;
  var kantuChecked = document.getElementById("kantuari").checked;
  var hangekiChecked = document.getElementById("hangekiari").checked;
  document.getElementById("ransu").value = "";
  document.getElementById("mojisiki").value = "";
  document.getElementById("susiki").value = "";

  //攻撃力計算
  kougekiryoku = Math.round(attack * ((attackbuff - attackdebuff) / 100 + 1));

  //実攻撃力計算(basedamage)
  basedamage = Math.round(
    (kougekiryoku *
      (((mahoubuturibuff - mahoubuturidebuff) / 100 + 1) *
        ((zokuseibuff - zokuseidebuff) / 100 + 1) *
        ((zenzokuseibuff - zenzokuseidebuff) / 100 + 1) +
        subattack * 0.4 * shienbuff) *
      2 -
      defense *
        ((bougyobuff - bougyodebuff) / 100 + 1) *
        ((zokuseitaiseibuff - zokuseitaiseidebuff) / 100 + 1) *
        ((zenzokuseitaiseibuff - zenzokuseitaiseidebuff) / 100 + 1) *
        ((mahoubuturitaiseibuff - mahoubuturitaiseidebuff) / 100 + 1)) *
      0.2
  );
  mojisiki2 =
    " × (((魔法 / 物理バフ - 魔法 / 物理デバフ) × (属性バフ - 属性デバフ) × (全属性バフ - 全属性デバフ) + 支援攻撃力 × 0.4 × 支援加護バフ × 2 - 基礎防御力 × (防御力バフ - 防御力デバフ) × (属性耐性バフ - 属性耐性デバフ)) × (全属性耐性バフ - 全属性耐性デバフ) × (魔法 / 物理耐性バフ - 魔法 / 物理耐性デバフ)) × 0.2 (ここまでがベースダメージ)";
  susiki2 =
    " × (((" +
    mahoubuturibuff +
    " - " +
    mahoubuturidebuff +
    ") ÷ 100 + 1) × ((" +
    zokuseibuff +
    " - " +
    zokuseidebuff +
    ") ÷ 100 + 1) × ((" +
    zenzokuseibuff +
    " - " +
    zenzokuseidebuff +
    ") ÷ 100 + 1) + " +
    subattack +
    " × 0.4 × " +
    shienbuff +
    ") × 2 - " +
    defense +
    " × ((" +
    bougyobuff +
    " - " +
    bougyodebuff +
    ") ÷ 100 + 1) × ((" +
    zokuseitaiseibuff +
    " - " +
    zokuseitaiseidebuff +
    ") ÷ 100 + 1) × ((" +
    zenzokuseitaiseibuff +
    " - " +
    zenzokuseitaiseidebuff +
    ") ÷ 100 + 1) × ((" +
    mahoubuturitaiseibuff +
    " - " +
    mahoubuturitaiseidebuff +
    ") ÷ 100 + 1)) × 0.2";

  //会心発生時
  if (kaisinChecked) {
    basedamage = Math.round(
      basedamage *
        (kaisin / 100 +
          1 +
          (kaisinbuff -
            kaisindebuff -
            (kaisintaiseibuff - kaisintaiseidebuff)) /
            100)
    );
    mojisiki2 =
      mojisiki2 +
      " × (会心バフ - 会心デバフ - (会心耐性バフ - 会心耐性デバフ))";
    susiki2 =
      susiki2 +
      " × (" +
      kaisin +
      " ÷ 100 + 1 + (" +
      kaisinbuff +
      " - " +
      kaisindebuff +
      " - (" +
      kaisintaiseibuff +
      " - " +
      kaisintaiseidebuff +
      ")) ÷ 100)";
  }

  //奥義発動時
  if (ougiChecked && ougibairitu != 0) {
    basedamage = Math.round(
      basedamage *
        (ougibairitu / 100 + 1) *
        ((ougibuff - ougidebuff - (ougitaiseibuff - ougitaiseidebuff)) / 100 +
          1)
    );
    mojisiki2 =
      mojisiki2 +
      " × 奥義倍率 × (奥義バフ - 奥義デバフ - (奥義耐性バフ - 奥義耐性デバフ))";

    mojisiki2 =
      mojisiki2 +
      " × (会心バフ - 会心デバフ - (会心耐性バフ - 会心耐性デバフ))";
    susiki2 =
      susiki2 +
      " × " +
      ougibairitu +
      " × ((" +
      ougibuff +
      " - " +
      ougidebuff +
      " - (" +
      ougitaiseibuff +
      " - " +
      ougitaiseidebuff +
      ")) ÷ 100 + 1)";

    //魔創魂コンボ時
  } else if (comboChecked4) {
    basedamage = Math.round(basedamage * 1.1);
    mojisiki2 = mojisiki2 + " × 4コンボ倍率110%";
    susiki2 = susiki2 + " × 1.10";
  } else if (comboChecked5) {
    basedamage = Math.round(basedamage * 1.5);
    mojisiki2 = mojisiki2 + " × 5コンボ倍率150%";
    susiki2 = susiki2 + " × 1.50";
  } else if (comboChecked6) {
    basedamage = Math.round(basedamage * 2);
    mojisiki2 = mojisiki2 + " × 6コンボ倍率200%";
    susiki2 = susiki2 + " × 2.00";
  }

  //ガード発生時
  if (guardChecked) {
    basedamage = Math.round(
      basedamage *
        ((guard -
          (guardryokubuff -
            guardryokudebuff +
            (guardkantubuff - guardkantudebuff))) /
          100)
    );
    mojisiki2 =
      mojisiki2 +
      " × (ガード - (ガード力バフ - ガード力デバフ + (ガード貫通バフ - ガード貫通デバフ)))";
    susiki2 =
      susiki2 +
      " × ((" +
      guard +
      " - (" +
      guardryokubuff +
      " - " +
      guardryokudebuff +
      " + (" +
      guardkantubuff +
      " - " +
      guardkantudebuff +
      "))) ÷ 100)";
  }
  //超ガード発生時
  if (tyouguardChecked) {
    basedamage = Math.round(
      basedamage *
        ((tyouguard -
          (guardryokubuff -
            guardryokudebuff +
            (guardkantubuff - guardkantudebuff))) /
          100)
    );
    mojisiki2 =
      mojisiki2 +
      " × (超ガード - (ガード力バフ - ガード力デバフ + (ガード貫通バフ - ガード貫通デバフ)))";
    susiki2 =
      susiki2 +
      " × ((" +
      tyouguard +
      " - (" +
      guardryokubuff +
      " - " +
      guardryokudebuff +
      " + (" +
      guardkantubuff +
      " - " +
      guardkantudebuff +
      "))) ÷ 100)";
  }

  //貫通発生時
  if (kantuChecked) {
    basedamage = Math.round(
      basedamage +
        kougekiryoku *
          0.06 *
          (kantubuff -
            kantudebuff -
            (kantutaiseibuff - kantutaiseidebuff) / 100 +
            1)
    );
    mojisiki2 = "(基礎攻撃力 × (攻撃力バフ - 攻撃力デバフ)" + mojisiki2;
    mojisiki2 =
      mojisiki2 +
      " + 基礎攻撃力 × 貫通 × (貫通バフ - 貫通デバフ - (貫通耐性バフ - 貫通耐性デバフ))";
    susiki2 =
      "((" +
      attack +
      " × " +
      "((" +
      attackbuff +
      " - " +
      attackdebuff +
      ")" +
      " ÷ 100 + 1)" +
      susiki2;
    susiki2 =
      susiki2 +
      " + " +
      kougekiryoku +
      " × 0.06 × (" +
      kantubuff +
      " - " +
      kantudebuff +
      " - (" +
      kantutaiseibuff +
      " - " +
      kantutaiseidebuff +
      ") ÷ 100 + 1))";
  } else {
    mojisiki2 = "基礎攻撃力 × (攻撃力バフ - 攻撃力デバフ)" + mojisiki2;
    susiki2 =
      "(" +
      attack +
      " × " +
      "((" +
      attackbuff +
      " - " +
      attackdebuff +
      ") ÷ 100 + 1)" +
      susiki2;
  }

  //超反撃発動時
  if (hangekiChecked) {
    basedamage = Math.round(basedamage * 2);
    mojisiki2 = mojisiki2 + " × 超反撃200%";
    susiki2 = susiki2 + " × 2";
  }

  //弱点発生時かつ弱点特攻が自然数の場合
  if (jyakutenChecked && jyakutenbuff > 0) {
    basedamage =
      basedamage * (jyakutenValue / 100 + 1) * (kagobuff / 100 + 1) +
      basedamage *
        (jyakutenbuff / 100 + 1) *
        (kyousinbuff -
          kyousindebuff -
          (kyousintaiseibuff - kyousintaiseidebuff) / 100 +
          1) *
        ((kizetubuff - kizetudebuff) / 100 + 1);
    mojisiki2 =
      mojisiki2 +
      " × 弱点 × 加護の導き + ベースダメージ × 弱点バフ × (協心バフ - 協心デバフ - (協心耐性バフ - 協心耐性デバフ)) × (気絶バフ - 気絶デバフ)";
    susiki2 =
      susiki2 +
      " × (" +
      jyakutenValue +
      " ÷ 100 + 1) × (" +
      kagobuff +
      " ÷ 100 + 1) + " +
      basedamage +
      " × (" +
      jyakutenbuff +
      " ÷ 100 + 1) × (" +
      kyousinbuff +
      " - " +
      kyousindebuff +
      " - (" +
      kyousintaiseibuff +
      " - " +
      kyousintaiseidebuff +
      ") ÷ 100 + 1) × ((" +
      kizetubuff +
      " - " +
      kizetudebuff +
      ") ÷ 100 + 1)";
  } else if (jyakutenChecked) {
    //弱点発生時
    basedamage =
      basedamage *
      (jyakutenValue / 100 + 1) *
      (kagobuff / 100 + 1) *
      (kyousinbuff -
        kyousindebuff -
        (kyousintaiseibuff - kyousintaiseidebuff) / 100 +
        1) *
      ((kizetubuff - kizetudebuff) / 100 + 1);
    mojisiki2 =
      mojisiki2 +
      " × 弱点 × 加護の導き × (協心バフ - 協心デバフ - (協心耐性バフ - 協心耐性デバフ)) × (気絶バフ - 気絶デバフ)";

    susiki2 =
      susiki2 +
      " × (" +
      jyakutenValue +
      " ÷ 100 + 1) × (" +
      kagobuff +
      " ÷ 100 + 1) × (" +
      kyousinbuff +
      " - " +
      kyousindebuff +
      " - (" +
      kyousintaiseibuff +
      " - " +
      kyousintaiseidebuff +
      ") ÷ 100 + 1) × ((" +
      kizetubuff +
      " - " +
      kizetudebuff +
      ") ÷ 100 + 1)";
  } else if (teikouChecked) {
    //抵抗発生時
    basedamage =
      basedamage *
      (teikouValue / 100 + 1) *
      (kagobuff / 100 + 1) *
      (kyousinbuff -
        kyousindebuff -
        (kyousintaiseibuff - kyousintaiseidebuff) / 100 +
        1) *
      ((kizetubuff - kizetudebuff) / 100 + 1);
    mojisiki2 =
      mojisiki2 +
      " × 抵抗 × 加護の導き × (協心バフ - 協心デバフ - (協心耐性バフ - 協心耐性デバフ)) × (気絶バフ - 気絶デバフ)";
    susiki2 =
      susiki2 +
      " × (" +
      teikouValue +
      " ÷ 100 + 1) × (" +
      kagobuff +
      " ÷ 100 + 1) × (" +
      kyousinbuff +
      " - " +
      kyousindebuff +
      " - (" +
      kyousintaiseibuff +
      " - " +
      kyousintaiseidebuff +
      ") ÷ 100 + 1) × ((" +
      kizetubuff +
      " - " +
      kizetudebuff +
      ") ÷ 100 + 1)";
  } else {
    //弱点・抵抗無発生の場合
    basedamage =
      basedamage *
      1 *
      (kagobuff / 100 + 1) *
      (kyousinbuff -
        kyousindebuff -
        (kyousintaiseibuff - kyousintaiseidebuff) / 100 +
        1) *
      ((kizetubuff - kizetudebuff) / 100 + 1);
    mojisiki2 =
      mojisiki2 +
      " × 加護の導き × (協心バフ - 協心デバフ - (協心耐性バフ - 協心耐性デバフ)) × (気絶バフ - 気絶デバフ)";
    susiki2 =
      susiki2 +
      " × (" +
      kagobuff +
      " ÷ 100 + 1) × (" +
      kyousinbuff +
      " - " +
      kyousindebuff +
      " - (" +
      kyousintaiseibuff +
      " - " +
      kyousintaiseidebuff +
      ") ÷ 100 + 1) × ((" +
      kizetubuff +
      " - " +
      kizetudebuff +
      ") ÷ 100 + 1)";
  }
  const damage_value = (document.getElementById(
    "basedamage"
  ).value = Math.round(basedamage));
  ransu2 = Math.round(basedamage - basedamage * 0.02);
  ransu3 = Math.round(basedamage + basedamage * 0.02);
  document.getElementById("ransu").value = ransu2 + " 〜 " + ransu3;
  document.getElementById("mojisiki").value = mojisiki2 + " = 火力";
  document.getElementById("susiki").value = susiki2 + " = " + damage_value;
}
