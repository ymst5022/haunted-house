/* ぜんぶの ゲームに きょうつうな しくみ
   ・メニューの ひょうじ
   ・タイマー / とくてん / けっか画面
   ・音と ふるえ

   ★ あたらしい ゲームを ふやすときは js/games/ に ファイルを つくり、
      App.registerGame({...}) を よぶだけで メニューに ならびます。
      くわしい かきかたは js/games/touch.js の さいしょの コメントを 見てください。 */
var App = (function () {
  'use strict';

  /* ===== 画面の部品 ===== */
  var screens = {
    menu:   document.getElementById('screen-menu'),
    game:   document.getElementById('screen-game'),
    result: document.getElementById('screen-result')
  };
  var menuList    = document.getElementById('menu-list');
  var field       = document.getElementById('field');
  var scoreEl     = document.getElementById('score');
  var scoreLabel  = document.getElementById('score-label');
  var hudTime     = document.getElementById('hud-time');
  var timeLeftEl  = document.getElementById('time-left');
  var timebarFill = document.getElementById('timebar-fill');
  var rushBanner  = document.getElementById('rush-banner');
  var resultGame  = document.getElementById('result-game');
  var resultScore = document.getElementById('result-score');
  var resultUnit  = document.getElementById('result-unit');
  var resultBest  = document.getElementById('result-best');
  var rankName    = document.getElementById('rank-name');
  var rankUse     = document.getElementById('rank-use');
  var newRecord   = document.getElementById('new-record');
  var soundToggle = document.getElementById('soundToggle');
  var soundIcon   = document.getElementById('soundIcon');

  /* ===== じょうたい ===== */
  var games = [];          // とうろくされた ゲームの いちらん
  var current = null;      // いま あそんでいる ゲーム
  var score = 0;
  var endTime = 0;
  var isPlaying = false;
  var tickTimer = null;

  /* ---------- 画面の きりかえ ---------- */
  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle('is-active', key === name);
    });
  }

  /* ---------- ちいさく ふるえる（音がオフでも 手ごたえが あるように） ---------- */
  function buzz(pattern) {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) { /* 使えない端末は なにもしない */ }
    }
  }

  function setUse(useEl, symbol) {
    useEl.setAttribute('href', symbol);
    useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', symbol);
  }

  function svgIcon(symbol) {
    return '<svg viewBox="0 0 100 100"><use href="' + symbol +
           '" xlink:href="' + symbol + '"></use></svg>';
  }

  /* ---------- メニューを つくる ---------- */
  function buildMenu() {
    menuList.innerHTML = '';
    games.forEach(function (game) {
      var best = Storage.getBest(game.id);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'menu-card';
      button.innerHTML =
        '<span class="menu-card__icon" aria-hidden="true">' + svgIcon(game.symbol) + '</span>' +
        '<span class="menu-card__text">' +
          '<span class="menu-card__name">' + game.name + '</span>' +
          '<span class="menu-card__desc">' + game.desc + '</span>' +
          (best > 0 ? '<span class="menu-card__best">さいこう ' + best + (game.unit || 'てん') + '</span>' : '') +
        '</span>' +
        '<span class="menu-card__arrow" aria-hidden="true">▶</span>';
      button.addEventListener('click', function () { startGame(game); });
      menuList.appendChild(button);
    });
  }

  /* ---------- ゲームから つかえる どうぐ ---------- */
  var ctx = {
    field: field,

    /* とくてんを ふやす。x, y を わたすと その ばしょに「+1」が うかぶ */
    addScore: function (points, x, y) {
      score += points;
      scoreEl.textContent = String(score);
      Sound.pop(points);
      buzz(25);
      if (typeof x === 'number') {
        var label = document.createElement('span');
        label.className = 'pop-score';
        label.textContent = '+' + points;
        label.style.left = x + 'px';
        label.style.top = y + 'px';
        field.appendChild(label);
        setTimeout(function () { label.remove(); }, 700);
      }
    },

    /* とくてんを ちょくせつ きめる */
    setScore: function (value) {
      score = value;
      scoreEl.textContent = String(score);
    },

    /* ゲームがわから「おわり」を つたえる */
    finish: function () { if (isPlaying) endGame(); },

    remainingMs: function () { return Math.max(0, endTime - Date.now()); },
    isRush: function () {
      return !!current && current.rushSeconds > 0 &&
             (endTime - Date.now()) <= current.rushSeconds * 1000;
    },
    isPlaying: function () { return isPlaying; },
    buzz: buzz
  };

  /* ---------- ゲームを はじめる ---------- */
  function startGame(game) {
    current = game;
    score = 0;
    isPlaying = true;

    scoreEl.textContent = '0';
    scoreLabel.textContent = game.scoreLabel || 'とくてん';
    rushBanner.hidden = true;
    timebarFill.classList.remove('is-rush');
    timebarFill.style.width = '100%';

    var hasTimer = game.seconds > 0;
    hudTime.hidden = !hasTimer;
    if (hasTimer) {
      timeLeftEl.textContent = String(game.seconds);
      endTime = Date.now() + game.seconds * 1000;
      tickTimer = setInterval(tick, 100);
    }

    showScreen('game');
    Sound.start();
    game.start(ctx);
  }

  /* ---------- 0.1びょう ごとの こうしん ---------- */
  function tick() {
    var total = current.seconds * 1000;
    var remainMs = ctx.remainingMs();

    timebarFill.style.width = (remainMs / total * 100) + '%';
    timeLeftEl.textContent = String(Math.ceil(remainMs / 1000));

    if (ctx.isRush() && rushBanner.hidden) {
      rushBanner.hidden = false;
      timebarFill.classList.add('is-rush');
    }
    if (remainMs <= 0) { endGame(); }
  }

  /* ---------- ゲームを かたづける（けっかを 出さずに） ---------- */
  function stopGame() {
    isPlaying = false;
    clearInterval(tickTimer);
    if (current) { current.stop(); }
    // ゲームが のこした ものを ぜんぶ 消す（バナーだけ のこす）
    Array.prototype.slice.call(field.children).forEach(function (el) {
      if (el !== rushBanner) el.remove();
    });
    field.className = 'field';
  }

  /* ---------- ゲームを おわって けっかを 出す ---------- */
  function endGame() {
    var game = current;
    stopGame();

    var rank = game.ranks[game.ranks.length - 1];
    for (var r = 0; r < game.ranks.length; r++) {
      if (score >= game.ranks[r].min) { rank = game.ranks[r]; break; }
    }
    resultGame.textContent = game.name;
    rankName.textContent = rank.name;
    setUse(rankUse, rank.symbol || game.symbol);
    resultScore.textContent = String(score);
    resultUnit.textContent = game.unit || 'てん';

    var updated = Storage.saveBest(game.id, score);
    newRecord.hidden = !updated;
    resultBest.textContent = 'さいこうきろく ' + Storage.getBest(game.id) + (game.unit || 'てん');

    Sound.finish();
    buzz([0, 40, 60, 40]);
    showScreen('result');
    buildMenu();
  }

  /* ---------- 音の オン・オフ ---------- */
  soundToggle.addEventListener('click', function () {
    var next = !Sound.isEnabled();
    Sound.setEnabled(next);
    soundIcon.textContent = next ? '🔊' : '🔇';
    soundToggle.setAttribute('aria-pressed', String(next));
  });

  /* ---------- ボタン ---------- */
  document.getElementById('btn-retry').addEventListener('click', function () {
    if (current) startGame(current);
  });
  document.getElementById('btn-menu').addEventListener('click', function () {
    showScreen('menu');
  });
  document.getElementById('btn-back').addEventListener('click', function () {
    if (isPlaying) stopGame();
    showScreen('menu');
  });

  /* 画面から はなれたら（他のアプリに 切りかえたら）ゲームを 止める */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && isPlaying) { endGame(); }
  });

  /* オフラインでも つかえるように、うらで ファイルを 保存しておく */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js')['catch'](function () { /* 失敗しても ゲームは動く */ });
    });
  }

  /* ---------- ゲームの とうろく（各ゲームの ファイルから よばれる） ---------- */
  function registerGame(game) {
    games.push(game);
    buildMenu();
  }

  return { registerGame: registerGame };
})();
