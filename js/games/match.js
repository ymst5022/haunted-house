/* ゲーム3：おばけあわせ（しんけいすいじゃく）
   8まいの カードを めくって、おなじ おばけの ペアを そろえる。
   タイマーなし。まちがえた かずが すくないほど 高とくてん。 */
App.registerGame((function () {
  'use strict';

  var SYMBOLS = ['#ghost-shiro', '#ghost-hinotama', '#ghost-kabocha', '#ghost-koumori'];
  var MISS_PENALTY = 10;   // まちがい 1かいで ひかれる てん
  var MIN_SCORE    = 10;   // どんなに まちがえても これより 下がらない

  var ctx = null;
  var open = [];           // いま めくっている カード（さいだい 2まい）
  var locked = false;      // 2まい めくった あとの まち時間中は true
  var pairsFound = 0;
  var misses = 0;
  var closeTimer = null;

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
      closeTimer = setTimeout(closeOpen, 900);
    }
  }

  function matched() {
    pairsFound += 1;
    open.forEach(function (card) { card.classList.add('is-matched'); });
    Sound.pop(3);
    ctx.buzz(25);
    ctx.setScore(pairsFound);
    open = [];
    locked = false;

    if (pairsFound === SYMBOLS.length) {
      // ぜんぶ そろった → まちがいの かずで てんすうを きめる
      var finalScore = Math.max(MIN_SCORE, 100 - misses * MISS_PENALTY);
      setTimeout(function () {
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
    desc: 'おなじ おばけの カードを そろえよう',
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
      open = [];
      locked = false;
      pairsFound = 0;
      misses = 0;

      var grid = document.createElement('div');
      grid.className = 'match-grid';
      shuffle(SYMBOLS.concat(SYMBOLS)).forEach(function (symbol) {
        grid.appendChild(createCard(symbol));
      });
      ctx.field.appendChild(grid);
    },
    stop: function () {
      clearTimeout(closeTimer);
      open = [];
    }
  };
})());
