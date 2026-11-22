/*
 * Nhạc nền cho thiệp: nhận link YouTube hoặc file nhạc (mp3, m4a…).
 * Dùng chung cho thiệp (index.html) và trang tạo link (tao-link.html).
 *
 *   NHAC.parse('https://youtu.be/abcdefghijk?t=30')  → { type: 'yt', id: 'abcdefghijk', start: 30 }
 *   NHAC.parse('assets/nhac/bai-hat.mp3')            → { type: 'audio', src: 'assets/nhac/bai-hat.mp3' }
 *   NHAC.toParam(spec)  → chuỗi gọn để gắn vào link mời (?nhac=yt:abcdefghijk@30)
 *   NHAC.player(spec, { onReady, onState, onError })  → { play(), pause(), toggle(), playing() }
 */
(function () {
  'use strict';
  var YT_ID = /^[A-Za-z0-9_-]{11}$/;
  var OFF = /^(tat|tắt|off|none|khong|không)$/i;

  // "90", "90s", "1m30s", "1h2m3s" → số giây
  function seconds(t) {
    if (!t) return 0;
    if (/^\d+$/.test(t)) return +t;
    var m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
    return m ? (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0)) : 0;
  }

  function parse(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return null;
    if (OFF.test(s)) return { type: 'off' };
    var m = /^yt:([A-Za-z0-9_-]{11})(?:@(\d+))?$/.exec(s);
    if (m) return { type: 'yt', id: m[1], start: +(m[2] || 0) };
    if (YT_ID.test(s)) return { type: 'yt', id: s, start: 0 };
    if (/^(https?:)?\/\//i.test(s) || /^www\./i.test(s) || /(^|\.)youtu\.?be/i.test(s)) {
      var u;
      try { u = new URL(/^\/\//.test(s) ? 'https:' + s : /^https?:/i.test(s) ? s : 'https://' + s); } catch (e) { return null; }
      var host = u.hostname.replace(/^www\.|^m\.|^music\./, '');
      var id = '';
      if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
      else if (/(^|\.)youtube(-nocookie)?\.com$/.test(host)) {
        id = u.searchParams.get('v') || '';
        var p = /^\/(embed|shorts|live|v)\/([^/?#]+)/.exec(u.pathname);
        if (!id && p) id = p[2];
      }
      if (id) {
        if (!YT_ID.test(id)) return null;
        return { type: 'yt', id: id, start: seconds(u.searchParams.get('t') || u.searchParams.get('start') || '') };
      }
      if (/^https?:$/.test(u.protocol)) return { type: 'audio', src: u.href };
      return null;
    }
    // đường dẫn trong thư mục thiệp, ví dụ assets/nhac/bai-hat.mp3
    if (/^[\w./%-]+\.(mp3|m4a|aac|ogg|oga|wav|webm|opus)$/i.test(s) && !/^\.\.|\/\.\./.test(s)) return { type: 'audio', src: s };
    return null;
  }

  function toParam(spec) {
    if (!spec) return '';
    if (spec.type === 'off') return 'tat';
    if (spec.type === 'yt') return 'yt:' + spec.id + (spec.start ? '@' + spec.start : '');
    return spec.src;
  }

  function describe(spec) {
    if (!spec) return 'Chưa có nhạc';
    if (spec.type === 'off') return 'Không phát nhạc';
    if (spec.type === 'yt') return 'YouTube · ' + spec.id + (spec.start ? ' · bắt đầu từ giây ' + spec.start : '');
    return 'File nhạc · ' + spec.src.split('/').pop();
  }

  /* ---------- Tải YouTube IFrame API (một lần) ---------- */
  var ytLoading = null;
  function loadYT() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (ytLoading) return ytLoading;
    ytLoading = new Promise(function (resolve, reject) {
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) try { prev(); } catch (e) { /* bỏ qua */ } resolve(); };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = function () { reject(new Error('Không tải được YouTube')); };
      document.head.appendChild(s);
      setTimeout(function () { reject(new Error('YouTube tải quá lâu')); }, 20000);
    });
    return ytLoading;
  }

  /* ---------- Trình phát: cùng một cách gọi cho YouTube và file nhạc ---------- */
  function player(spec, cb) {
    cb = cb || {};
    var wantPlay = false, isPlaying = false, ready = false, dead = false;
    function state(on) { isPlaying = on; if (cb.onState) cb.onState(on); }
    function fail(err) { dead = true; state(false); if (cb.onError) cb.onError(err); }
    var api = { play: function () {}, pause: function () {}, toggle: function () { (isPlaying || wantPlay) ? api.pause() : api.play(); }, playing: function () { return isPlaying; } };
    if (!spec || spec.type === 'off') return null;

    if (spec.type === 'audio') {
      var a = new Audio();
      a.loop = true; a.preload = 'metadata'; a.volume = .85;
      a.addEventListener('loadedmetadata', function () { ready = true; if (cb.onReady) cb.onReady(); });
      a.addEventListener('playing', function () { state(true); });
      a.addEventListener('pause', function () { state(false); });
      a.addEventListener('error', function () { fail(new Error('Không mở được file nhạc')); });
      a.src = spec.src;
      api.play = function () { wantPlay = true; if (dead) return; var p = a.play(); if (p && p.catch) p.catch(function () { state(false); }); };
      api.pause = function () { wantPlay = false; a.pause(); };
      return api;
    }

    // YouTube: khung phát ẩn ngoài màn hình (vẫn đủ 200×200 theo quy định của YouTube)
    var box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'position:fixed;left:-320px;bottom:0;width:200px;height:200px;overflow:hidden;pointer-events:none;opacity:0;';
    var slot = document.createElement('div');
    box.appendChild(slot);
    document.body.appendChild(box);
    var yt = null;
    loadYT().then(function () {
      yt = new window.YT.Player(slot, {
        width: 200, height: 200, videoId: spec.id,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, loop: 1, playlist: spec.id, start: spec.start || 0, origin: location.origin },
        events: {
          onReady: function () {
            ready = true;
            try { yt.setVolume(85); } catch (e) { /* bỏ qua */ }
            if (cb.onReady) cb.onReady();
            if (wantPlay) yt.playVideo();
          },
          onStateChange: function (e) {
            if (e.data === 1) state(true);
            else if (e.data === 2) state(false);
            else if (e.data === 0) { try { yt.seekTo(spec.start || 0); yt.playVideo(); } catch (er) { /* bỏ qua */ } }
          },
          onError: function (e) { fail(new Error('YouTube không cho phát video này (mã ' + e.data + ')')); },
        },
      });
    }).catch(fail);
    api.play = function () { wantPlay = true; if (!dead && ready && yt) yt.playVideo(); };
    api.pause = function () { wantPlay = false; if (ready && yt) yt.pauseVideo(); state(false); };
    return api;
  }

  window.NHAC = { parse: parse, toParam: toParam, describe: describe, player: player, seconds: seconds };
})();
