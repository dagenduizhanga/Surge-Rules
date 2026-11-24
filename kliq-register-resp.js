/**
 * kliq-register-resp.js —— Surge http-response 脚本（只记录，不改包）
 * 把 register-send-otp / verify-otp / register-personal-account 的
 * 状态码、响应头里的关键项、响应体完整打出来。
 * 目的：确认服务端到底返回了什么（status / message / 有没有 code、data、allowedCountries 之类的线索）。
 */

(function () {
  const url = $request.url || '';
  const status = $response.status || $response.statusCode || '';
  const body = $response.body || '';
  const hdrs = $response.headers || {};

  console.log('[Kliq][resp] ' + status + ' ' + url);
  try {
    const keys = Object.keys(hdrs).filter(function (k) {
      return /^(content-type|x-|request-id|trace|correlation)/i.test(k);
    });
    const picked = {};
    keys.forEach(function (k) { picked[k] = hdrs[k]; });
    if (Object.keys(picked).length) {
      console.log('[Kliq][resp.hdr] ' + JSON.stringify(picked));
    }
  } catch (e) { }

  if (body) {
    const txt = body.length > 2000 ? body.slice(0, 2000) + '...' : body;
    console.log('[Kliq][resp.body] ' + txt);
  }

  $done({});
})();
