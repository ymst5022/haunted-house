/* おばけの しゅるいと、出てくる ばしょを きめる ところ */
var Ghosts = (function () {
  'use strict';

  /* weight = 出やすさ。しろおばけが いちばん よく出る */
  var TYPES = [
    { id: 'shiro',    points: 1, weight: 6, symbol: '#ghost-shiro' },
    { id: 'hinotama', points: 2, weight: 3, symbol: '#ghost-hinotama' },
    { id: 'kabocha',  points: 3, weight: 1, symbol: '#ghost-kabocha' }
  ];

  var TOTAL_WEIGHT = TYPES.reduce(function (sum, t) { return sum + t.weight; }, 0);

  function pickType() {
    var r = Math.random() * TOTAL_WEIGHT;
    for (var i = 0; i < TYPES.length; i++) {
      r -= TYPES[i].weight;
      if (r <= 0) return TYPES[i];
    }
    return TYPES[0];
  }

  /* おばけの HTML を つくって返す（画面にはまだ足さない） */
  function createElement(type) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'ghost ghost--' + type.id;
    button.setAttribute('aria-label', 'おばけ');
    // href と xlink:href の両方を書くのは、古いSafariでも絵が出るようにするため
    button.innerHTML =
      '<svg viewBox="0 0 100 100"><use href="' + type.symbol +
      '" xlink:href="' + type.symbol + '"></use></svg>';
    return button;
  }

  /* 前に出た ばしょと なるべく かさならない ように 出す */
  function pickSpot(fieldWidth, fieldHeight, size, taken) {
    var pad = 8;
    var maxX = Math.max(pad, fieldWidth - size - pad);
    var maxY = Math.max(pad, fieldHeight - size - pad);
    var best = null;
    var bestDistance = -1;

    for (var attempt = 0; attempt < 12; attempt++) {
      var spot = {
        x: pad + Math.random() * (maxX - pad),
        y: pad + Math.random() * (maxY - pad)
      };
      var nearest = Infinity;
      for (var i = 0; i < taken.length; i++) {
        var dx = spot.x - taken[i].x;
        var dy = spot.y - taken[i].y;
        nearest = Math.min(nearest, Math.sqrt(dx * dx + dy * dy));
      }
      if (nearest === Infinity) return spot;          // まだ1ぴきもいない
      if (nearest > size * 1.1) return spot;          // じゅうぶん はなれている
      if (nearest > bestDistance) { bestDistance = nearest; best = spot; }
    }
    return best;
  }

  return { pickType: pickType, createElement: createElement, pickSpot: pickSpot };
})();
