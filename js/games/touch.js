/* ゲーム1：おばけタッチ
   出てきた おばけを タップして 消す。30びょう。のこり 15びょうから だいはっせい。

   ---- ゲームの かきかた（ほかの ゲームを つくるときの おてほん） ----
   App.registerGame({
     id:          保存に つかう 英字の なまえ（ほかと かぶらない こと）
     name / desc: メニューに 出る なまえ と 一行せつめい
     symbol:      メニューと けっか画面に 出る 絵（index.html の symbol の id）
     seconds:     せいげん時間（びょう）。0 なら タイマーなし
     rushSeconds: さいごの「だいはっせい」の ながさ。0 なら なし
     unit:        とくてんの たんい（省略すると「てん」）
     scoreLabel:  ゲーム中の とくてんの みだし（省略すると「とくてん」）
     ranks:       てんすうに おうじた しょうごう（上から じゅんに はんてい）
     start(ctx):  ゲーム開始。ctx.field に 部品を 足す。ctx.addScore() で とくてん
     stop():      かたづけ（タイマーや イベントを 止める）
   }) */
App.registerGame((function () {
  'use strict';

  var GHOST_LIFETIME = 2500;  // おばけが 画面に のこる 時間（ミリびょう）
  var SPAWN_NORMAL   = 900;   // おばけが 出る かんかく（ミリびょう）
  var SPAWN_RUSH     = 380;   // だいはっせい中の かんかく
  var MAX_NORMAL     = 4;     // 画面に 同時に 出る さいだい数
  var MAX_RUSH       = 7;

  var ctx = null;
  var spawnTimer = null;
  var liveGhosts = [];

  function ghostSize() {
    return parseInt(getComputedStyle(document.documentElement)
             .getPropertyValue('--ghost-size'), 10) || 96;
  }

  function scheduleSpawn(delay) {
    spawnTimer = setTimeout(function () {
      if (!ctx.isPlaying()) return;
      spawnGhost();
      scheduleSpawn(ctx.isRush() ? SPAWN_RUSH : SPAWN_NORMAL);
    }, delay);
  }

  function spawnGhost() {
    var limit = ctx.isRush() ? MAX_RUSH : MAX_NORMAL;
    if (liveGhosts.length >= limit) return;

    var rect = ctx.field.getBoundingClientRect();
    var size = ghostSize();
    var spot = Ghosts.pickSpot(rect.width, rect.height, size, liveGhosts);
    if (!spot) return;

    var type = Ghosts.pickType();
    var el = Ghosts.createElement(type);
    el.style.left = spot.x + 'px';
    el.style.top = spot.y + 'px';

    var entry = { x: spot.x, y: spot.y, el: el, timer: null };
    liveGhosts.push(entry);

    // さわられずに 時間が すぎたら、しずかに 消える
    entry.timer = setTimeout(function () { removeGhost(entry, 'is-leaving'); }, GHOST_LIFETIME);

    // タップされたとき（クリックより はんのうが 早い pointerdown を つかう）
    el.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      if (!ctx.isPlaying() || liveGhosts.indexOf(entry) === -1) return;
      ctx.addScore(type.points, spot.x + size / 2, spot.y);
      removeGhost(entry, 'is-popped');
    });

    ctx.field.appendChild(el);
  }

  function removeGhost(entry, className) {
    var index = liveGhosts.indexOf(entry);
    if (index === -1) return;
    liveGhosts.splice(index, 1);
    clearTimeout(entry.timer);
    entry.el.classList.add(className);
    setTimeout(function () { entry.el.remove(); }, 420);
  }

  return {
    id: 'touch',
    name: 'おばけタッチ',
    desc: 'でてきた おばけを タッチ！',
    symbol: '#ghost-shiro',
    seconds: 30,
    rushSeconds: 15,
    ranks: [
      { min: 45, name: 'おばけマスター', symbol: '#ghost-kabocha' },
      { min: 25, name: 'おばけはかせ',   symbol: '#ghost-hinotama' },
      { min: 0,  name: 'おばけみならい', symbol: '#ghost-shiro' }
    ],
    start: function (context) {
      ctx = context;
      liveGhosts = [];
      scheduleSpawn(600);
    },
    stop: function () {
      clearTimeout(spawnTimer);
      liveGhosts.forEach(function (entry) { clearTimeout(entry.timer); });
      liveGhosts = [];
    }
  };
})());
