/* さいこうきろく（ベストスコア）を、ゲームごとに この スマホの なかに 保存します。
   サーバーには なにも おくりません。個人情報も あつかいません。 */
var Storage = (function () {
  'use strict';

  var PREFIX = 'obake-asobi:best:';

  function getBest(gameId) {
    try {
      var value = window.localStorage.getItem(PREFIX + gameId);
      var num = parseInt(value, 10);
      return isNaN(num) || num < 0 ? 0 : num;
    } catch (e) {
      // プライベートモードなどで使えないことがある。その場合は0あつかい。
      return 0;
    }
  }

  /* 保存した結果、記録を更新したら true を返す */
  function saveBest(gameId, score) {
    var best = getBest(gameId);
    if (score <= best) return false;
    try {
      window.localStorage.setItem(PREFIX + gameId, String(score));
    } catch (e) {
      // 保存できなくてもゲームは続けられるようにする
    }
    return true;
  }

  return { getBest: getBest, saveBest: saveBest };
})();
