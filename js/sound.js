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
      // iPhoneは マナーモードだと この音を 消してしまうので、
      // 「音を ながすページです」と つたえて マナーモードでも 鳴るようにする（iOS 17 から）
      if (navigator.audioSession) {
        try { navigator.audioSession.type = 'playback'; } catch (e) { /* 使えない端末は そのまま */ }
      }
      try { ctx = new AC(); } catch (e) { return null; }
    }
    // スマホは画面をさわるまで音を止めているので、都度おこす
    // （iPhoneは 電話や アプリの切りかえの あとに interrupted に なることがある）
    if ((ctx.state === 'suspended' || ctx.state === 'interrupted') && ctx.resume) { ctx.resume(); }
    return ctx;
  }

  function tone(freq, duration, type, delay) {
    if (!enabled) return;
    var audio = getContext();
    if (!audio) return;
    note(audio, freq, audio.currentTime + (delay || 0), duration, type, 0.25);
  }

  /* start（音の時計で なんびょうめ）に 1つの 音を 鳴らす。volume は 0〜1 */
  function note(audio, freq, start, duration, type, volume) {
    var osc = audio.createOscillator();
    var gain = audio.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  /* ===== BGM（ゲーム中に ながれる ぶきみな 曲） =====
     8分音符 16こで 1まわり。null は おやすみ。数字は 音の高さ（69 = ラ） */
  var BGM_MELODY = [69, null, 72, null, 71, null, 68, null, 69, null, 76, null, 74, 72, 71, null];
  var BGM_BASS   = [45, 45, 41, 40];   // 4こ ごとに かわる ひくい音（ラ ラ ファ ミ）
  var BGM_STEP_NORMAL = 0.22;          // 1こ ぶんの 長さ（びょう）
  var BGM_STEP_FAST   = 0.14;          // だいはっせい中は はやく
  var BGM_VOLUME      = 0.07;          // こうかおんより ちいさく

  var bgmTimer = null;
  var bgmStep = 0;
  var bgmNextTime = 0;
  var bgmFast = false;

  function midiToFreq(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  /* 0.1びょう ごとに、すこし さきの ぶんまで 音を よやくしておく（音が とぎれないように） */
  function bgmSchedule() {
    var audio = ctx;
    if (!audio) return;
    if (bgmNextTime < audio.currentTime) bgmNextTime = audio.currentTime + 0.05;
    while (bgmNextTime < audio.currentTime + 0.3) {
      var len = bgmFast ? BGM_STEP_FAST : BGM_STEP_NORMAL;
      var i = bgmStep % BGM_MELODY.length;
      if (enabled) {
        if (BGM_MELODY[i] !== null) {
          note(audio, midiToFreq(BGM_MELODY[i]), bgmNextTime, len * 0.9, 'triangle', BGM_VOLUME);
        }
        if (i % 4 === 0) {
          note(audio, midiToFreq(BGM_BASS[i / 4]), bgmNextTime, len * 3.5, 'sine', BGM_VOLUME * 1.6);
        }
      }
      bgmStep++;
      bgmNextTime += len;
    }
  }

  return {
    /* BGMを はじめから ながす（画面を さわった ときに よぶこと） */
    bgmStart: function () {
      if (!getContext()) return;
      clearInterval(bgmTimer);
      bgmStep = 0;
      bgmNextTime = 0;
      bgmFast = false;
      bgmSchedule();
      bgmTimer = setInterval(bgmSchedule, 100);
    },
    bgmStop: function () {
      clearInterval(bgmTimer);
      bgmTimer = null;
    },
    /* だいはっせい中は テンポを はやく する */
    bgmSetFast: function (value) { bgmFast = !!value; },

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
