/* ゲーム2：なかまはずれ
   ならんだ おばけの なかに 1ぴきだけ ちがう おばけが いる。それを タップ。
   ぜんぶで 10もん。あとの もんだいほど おばけの かずが ふえ、
   「ちがい」も 小さくなって むずかしくなる。
   じかんせいげんは なし（じっくり 見て えらべる）。

   ちがいの しゅるい（mode）:
     type  … べつの おばけ（いちばん かんたん）
     mix   … 2しゅるいの おばけが まざっていて、そのなかに 3しゅるいめが 1ぴき
     tilt  … おなじ おばけだが 1ぴきだけ ななめに かたむいている
     size  … おなじ おばけだが 1ぴきだけ 小さい
     color … おなじ おばけだが 1ぴきだけ いろが ちがう */
App.registerGame((function () {
  'use strict';

  var POINTS_FIRST = 10;    // いっかいで せいかい → 10てん
  var POINTS_RETRY = 5;     // まちがえてから せいかい → 5てん（0てんには ならない）
  var SYMBOLS = ['#ghost-shiro', '#ghost-hinotama', '#ghost-kabocha', '#ghost-koumori'];
  var COLOR_SYMBOLS = ['#ghost-hinotama', '#ghost-kabocha', '#ghost-koumori']; // しろは いろが かわらないので のぞく

  /* もんだいごとの むずかしさ。count = おばけの かず、mode = ちがいの しゅるい
     ここを かえると むずかしさを ちょうせいできます */
  var STAGES = [
    { count: 6,  mode: 'type'  },   // 1もんめ
    { count: 6,  mode: 'type'  },
    { count: 9,  mode: 'type'  },
    { count: 9,  mode: 'tilt'  },
    { count: 9,  mode: 'mix'   },
    { count: 12, mode: 'tilt'  },
    { count: 12, mode: 'size'  },
    { count: 12, mode: 'color' },
    { count: 16, mode: 'mix'   },
    { count: 16, mode: 'hard'  }    // 10もんめ：tilt / size / color から ランダム
  ];
  var TOTAL_ROUNDS = STAGES.length;
  var HARD_MODES = ['tilt', 'size', 'color'];

  var ctx = null;
  var round = 0;
  var missedThisRound = false;
  var grid = null;
  var locked = false;
  var nextTimer = null;

  function sample(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function pick(list, except) {
    var choices = list.filter(function (s) { return s !== except; });
    return sample(choices);
  }

  function svg(symbol) {
    return '<svg viewBox="0 0 100 100"><use href="' + symbol +
           '" xlink:href="' + symbol + '"></use></svg>';
  }

  /* もんだいを つくる。かえりち: { tiles: [{symbol, variant}], oddIndex } */
  function buildRound(stage) {
    var mode = stage.mode === 'hard' ? sample(HARD_MODES) : stage.mode;
    var count = stage.count;
    var oddIndex = Math.floor(Math.random() * count);
    var tiles = [];
    var i, base, base2, odd;

    if (mode === 'type') {
      base = sample(SYMBOLS);
      odd = pick(SYMBOLS, base);
      for (i = 0; i < count; i++) {
        tiles.push({ symbol: i === oddIndex ? odd : base, variant: '' });
      }
    } else if (mode === 'mix') {
      base = sample(SYMBOLS);
      base2 = pick(SYMBOLS, base);
      odd = pick(SYMBOLS.filter(function (s) { return s !== base2; }), base);
      for (i = 0; i < count; i++) {
        var s = (i % 2 === 0) ? base : base2;      // 2しゅるいを こうごに
        if (Math.random() < 0.3) s = (s === base) ? base2 : base; // すこし ばらす
        tiles.push({ symbol: i === oddIndex ? odd : s, variant: '' });
      }
    } else {
      // tilt / size / color: みんな おなじ おばけ。1ぴきだけ 見た目を すこし かえる
      base = sample(mode === 'color' ? COLOR_SYMBOLS : SYMBOLS);
      for (i = 0; i < count; i++) {
        tiles.push({ symbol: base, variant: i === oddIndex ? 'odd-tile--' + mode : '' });
      }
    }
    return { tiles: tiles, oddIndex: oddIndex };
  }

  function showRound() {
    round += 1;
    locked = false;
    missedThisRound = false;
    grid.innerHTML = '';

    var stage = STAGES[round - 1];
    var count = stage.count;
    var cols = count <= 6 ? 2 : (count <= 12 ? 3 : 4);
    grid.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
    grid.className = 'odd-grid odd-grid--' + count;

    var q = buildRound(stage);

    for (var i = 0; i < count; i++) {
      var isOdd = (i === q.oddIndex);
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'odd-tile ' + q.tiles[i].variant;
      tile.setAttribute('aria-label', isOdd ? 'ちがう おばけ' : 'おばけ');
      tile.innerHTML = svg(q.tiles[i].symbol);
      tile.addEventListener('pointerdown', onTap(tile, isOdd));
      grid.appendChild(tile);
    }
  }

  function onTap(tile, isOdd) {
    return function (event) {
      event.preventDefault();
      if (!ctx.isPlaying() || locked) return;

      if (isOdd) {
        locked = true;
        tile.classList.add('is-correct');
        var rect = tile.getBoundingClientRect();
        var fieldRect = ctx.field.getBoundingClientRect();
        ctx.addScore(missedThisRound ? POINTS_RETRY : POINTS_FIRST,
                     rect.left - fieldRect.left + rect.width / 2,
                     rect.top - fieldRect.top);
        nextTimer = setTimeout(function () {
          if (!ctx.isPlaying()) return;
          if (round >= TOTAL_ROUNDS) { ctx.finish(); } else { showRound(); }
        }, 800);
      } else {
        // まちがい：ぷるぷる ゆれて おしえる。この もんだいは 5てんに なる
        missedThisRound = true;
        tile.classList.remove('is-wrong');
        void tile.offsetWidth;            // アニメーションを やりなおす ための おきまり
        tile.classList.add('is-wrong');
        Sound.tick();
        ctx.buzz([20, 40, 20]);
      }
    };
  }

  return {
    id: 'odd',
    name: 'なかまはずれ',
    desc: 'ひとりだけ ちがう おばけは だれ？',
    symbol: '#ghost-kabocha',
    seconds: 0,
    rushSeconds: 0,
    ranks: [
      { min: 95, name: 'めきき マスター', symbol: '#ghost-kabocha' },
      { min: 80, name: 'めきき はかせ',   symbol: '#ghost-hinotama' },
      { min: 0,   name: 'めきき みならい', symbol: '#ghost-shiro' }
    ],
    start: function (context) {
      ctx = context;
      round = 0;
      grid = document.createElement('div');
      ctx.field.appendChild(grid);
      showRound();
    },
    stop: function () {
      clearTimeout(nextTimer);
      grid = null;
    }
  };
})());
