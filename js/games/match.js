/* ゲーム3：おばけあわせ（しんけいすいじゃく）
   カードを めくって、おなじ おばけの ペアを そろえる。
   ステージ 1 → 2 と すすむと カードが ふえる（8まい → 12まい）。
   タイマーなし。2ステージ ぜんぶで まちがえた かずが すくないほど 高とくてん。 */
App.registerGame((function () {
  'use strict';

  var SYMBOLS = [
    '#ghost-shiro', '#ghost-hinotama', '#ghost-kabocha', '#ghost-koumori',
    '#ghost-neko', '#ghost-medama', '#ghost-kumo', '#ghost-gaikotsu'
  ];
  /* ステージごとの ペアの かずと ならべかた（よこ × たて）。
     ふやすときは ここに 1ぎょう たすだけ（ペアの かずは SYMBOLS の かず まで） */
  var STAGES = [
    { pairs: 4, cols: 2, rows: 4 },   //  8まい
    { pairs: 6, cols: 3, rows: 4 }    // 12まい
  ];
  var MISS_PENALTY = 5;   // まちがい 1かいで ひかれる てん
  var MIN_SCORE    = 10;   // どんなに まちがえても これより 下がらない

  var ctx = null;
  var stageIndex = 0;
  var open = [];           // いま めくっている カード（さいだい 2まい）
  var locked = false;      // 2まい めくった あとの まち時間中や、ステージの きりかえ中は true
  var pairsFound = 0;      // いまの ステージで そろった かず
  var totalPairs = 0;      // ぜんぶの ステージで そろった かず（画面の「そろった」）
  var misses = 0;
  var timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    }
    return list;
  }

  function createCard(symbol) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.setAttribute('aria-label', 'カード');
    card.dataset.symbol = symbol;
    card.innerHTML =
      '<span class="card__inner">' +
        '<span class="card__face card__face--front" aria-hidden="true">?</span>' +
        '<span class="card__face card__face--back" aria-hidden="true">' +
          '<svg viewBox="0 0 100 100"><use href="' + symbol +
          '" xlink:href="' + symbol + '"></use></svg>' +
        '</span>' +
      '</span>';
    card.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      flip(card);
    });
    return card;
  }

  /* 画面の まんなかに「ステージ 2」などを すこしの あいだ 出す */
  function showBanner(text) {
    var banner = document.createElement('div');
    banner.className = 'stage-banner';
    banner.textContent = text;
    ctx.field.appendChild(banner);
    later(function () { banner.remove(); }, 1200);
  }

  function startStage(index) {
    var stage = STAGES[index];
    stageIndex = index;
    pairsFound = 0;
    open = [];

    var old = ctx.field.querySelector('.match-grid');
    if (old) old.remove();

    var grid = document.createElement('div');
    grid.className = 'match-grid';
    grid.style.gridTemplateColumns = 'repeat(' + stage.cols + ', minmax(0, 1fr))';
    grid.style.gridTemplateRows = 'repeat(' + stage.rows + ', minmax(0, 1fr))';
    var symbols = shuffle(SYMBOLS.slice()).slice(0, stage.pairs);
    shuffle(symbols.concat(symbols)).forEach(function (symbol) {
      grid.appendChild(createCard(symbol));
    });
    ctx.field.appendChild(grid);

    showBanner('ステージ ' + (index + 1) + ' / ' + STAGES.length);
    locked = false;
  }

  function flip(card) {
    if (!ctx.isPlaying() || locked) return;
    if (card.classList.contains('is-open') || card.classList.contains('is-matched')) return;

    card.classList.add('is-open');
    Sound.tick();
    ctx.buzz(15);
    open.push(card);
    if (open.length < 2) return;

    locked = true;
    if (open[0].dataset.symbol === open[1].dataset.symbol) {
      matched();
    } else {
      misses += 1;
      Sound.miss();
      later(closeOpen, 900);
    }
  }

  function matched() {
    pairsFound += 1;
    totalPairs += 1;
    open.forEach(function (card) { card.classList.add('is-matched'); });
    Sound.pop(3);
    ctx.buzz(25);
    ctx.setScore(totalPairs);
    open = [];
    locked = false;

    if (pairsFound < STAGES[stageIndex].pairs) return;

    locked = true;
    if (stageIndex + 1 < STAGES.length) {
      // つぎの ステージへ
      later(function () {
        Sound.finish();
        showBanner('クリア！');
      }, 500);
      later(function () { startStage(stageIndex + 1); }, 1900);
    } else {
      // ぜんぶ おわった → まちがいの かずで てんすうを きめる
      var finalScore = Math.max(MIN_SCORE, 100 - misses * MISS_PENALTY);
      later(function () {
        ctx.setScore(finalScore);
        ctx.finish();
      }, 700);
    }
  }

  function closeOpen() {
    open.forEach(function (card) { card.classList.remove('is-open'); });
    open = [];
    locked = false;
  }

  return {
    id: 'match',
    name: 'おばけあわせ',
    desc: 'おなじ おばけの カードを そろえよう（2ステージ）',
    symbol: '#ghost-koumori',
    seconds: 0,
    rushSeconds: 0,
    scoreLabel: 'そろった',
    ranks: [
      { min: 80, name: 'ものおぼえマスター', symbol: '#ghost-kabocha' },
      { min: 50, name: 'ものおぼえはかせ',   symbol: '#ghost-hinotama' },
      { min: 0,  name: 'ものおぼえみならい', symbol: '#ghost-shiro' }
    ],
    start: function (context) {
      ctx = context;
      totalPairs = 0;
      misses = 0;
      timers = [];
      startStage(0);
    },
    stop: function () {
      timers.forEach(clearTimeout);
      timers = [];
      open = [];
    }
  };
})());
