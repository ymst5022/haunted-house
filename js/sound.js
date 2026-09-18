/* こうかおん。音のファイルは つかわず、その場で 音を つくります（読み込みが ゼロ）。
   はじめから オン。 */
var Sound = (function () {
  'use strict';

  var enabled = true;
  var ctx = null;

  function getContext() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    // スマホは画面をさわるまで音を止めているので、都度おこす
    if (ctx.state === 'suspended' && ctx.resume) { ctx.resume(); }
    return ctx;
  }

  function tone(freq, duration, type, delay) {
    if (!enabled) return;
    var audio = getContext();
    if (!audio) return;

    var start = audio.currentTime + (delay || 0);
    var osc = audio.createOscillator();
    var gain = audio.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  return {
    isEnabled: function () { return enabled; },
    setEnabled: function (value) {
      enabled = !!value;
      if (enabled) { getContext(); tone(880, 0.08, 'triangle'); }
    },
    /* おばけに さわったとき。点数が高いほど 高い音 */
    pop: function (points) {
      var base = [0, 660, 820, 990][points] || 660;
      tone(base, 0.12, 'triangle');
      tone(base * 1.5, 0.10, 'sine', 0.05);
    },
    /* カードを めくったときなどの ちいさな 音 */
    tick: function () {
      tone(440, 0.06, 'square');
    },
    /* カードが そろわなかったときの ざんねんな 音 */
    miss: function () {
      tone(300, 0.12, 'sawtooth');
      tone(180, 0.16, 'sawtooth', 0.08);
    },
    /* 「だいはっせい」が はじまったときの けたたましい 音 */
    rush: function () {
      tone(440, 0.10, 'square');
      tone(660, 0.10, 'square', 0.10);
      tone(880, 0.10, 'square', 0.20);
      tone(1100, 0.25, 'square', 0.30);
    },
    start: function () {
      tone(520, 0.1, 'triangle');
      tone(780, 0.14, 'triangle', 0.12);
    },
    finish: function () {
      tone(660, 0.14, 'triangle');
      tone(880, 0.14, 'triangle', 0.14);
      tone(1180, 0.30, 'triangle', 0.28);
    }
  };
})();
