// ===============================================================
// ** about.js - about.html専用の軽量スクリプト **
// ===============================================================
$(function () {
  'use strict';

  // ページトップへ戻るボタン
  const topButton = $('.pagetop');
  topButton.hide();
  $(window).on('scroll', function () {
    if ($(this).scrollTop() > 300) {
      topButton.fadeIn();
    } else {
      topButton.fadeOut();
    }
  });
  topButton.on('click', function (e) {
    e.preventDefault();
    $('html, body').animate({
      scrollTop: 0
    }, 500);
  });

  // ハンバーガーメニュー (aboutページでは使われませんが、念のため)
  // もしabout.htmlにもハンバーガーメニューが必要な場合は、
  // index.htmlからmenubar_hdr要素をコピーしてください。
  // $('#menubar_hdr').on('click', function() {
  //   $(this).toggleClass('ham');
  //   $('#menubar').toggleClass('display-block');
  // });
});