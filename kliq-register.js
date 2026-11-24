/**
 * kliq-register.js —— Surge http-request 脚本（Kliq 2.0 / 2.0.1 注册链路）
 *
 * 三种模式，用模块里的 argument= 切换：
 *   argument=log    只记录，不改包（默认）
 *   argument=probe1 countryCode 改 "90"，phoneNumber 改 "+49..."（E.164）
 *   argument=probe2 countryCode 改 "90"，phoneNumber 改 "0049..."
 *   argument=probe3 countryCode 改 "90"，phoneNumber 改 "49..."（不带符号）
 *
 * 说明：服务端的 countryCode 白名单是硬校验，probe* 只是在请求层做格式博弈，
 *      唯一可能奏效的前提是「后端把 phoneNumber 直接当完整号码交给短信网关」。
 *      每点一次注册都会真发一次请求，别连续刷。
 */

const MODE = (typeof $argument === 'string' && $argument.trim()) ? $argument.trim().toLowerCase() : 'log';

function log(s) { console.log('[Kliq][reg] ' + s); }

function pick(obj, re) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    if (re.test(keys[i])) return keys[i];
  }
  return null;
}

function e164(raw) {
  let d = String(raw || '').replace(/[^\d]/g, '');
  if (d.indexOf('00') === 0) d = d.slice(2);
  if (d.indexOf('49') === 0) return d;           // 已经是 49 开头
  if (d.indexOf('90') === 0) return d;           // 已经是 90 开头（土耳其号，别动）
  return '49' + d.replace(/^0+/, '');            // 德国国内号：去掉前导 0，补 49
}

(function main() {
  const url = $request.url || '';
  const method = $request.method || 'POST';
  let body = $request.body || '';

  log(method + ' ' + url + '  mode=' + MODE);

  if (!body) { return $done({}); }

  let obj;
  try { obj = JSON.parse(body); } catch (e) {
    log('body 不是 JSON，原样放行: ' + body.slice(0, 200));
    return $done({});
  }

  const ccKey = pick(obj, /^(country_?code|phone_?country_?code|countryCode)$/i);
  const phKey = pick(obj, /^(phone_?number|phoneNumber|msisdn|mobile_?phone)$/i);

  log('字段: country=' + ccKey + '(' + (ccKey ? obj[ccKey] : '-') + ') phone=' +
      phKey + '(' + (phKey ? obj[phKey] : '-') + ')');

  if (MODE === 'log' || !ccKey || !phKey) {
    return $done({});
  }

  const before = String(obj[phKey]);
  const num = e164(before);
  obj[ccKey] = '90';

  if (MODE === 'probe1') obj[phKey] = '+' + num;
  else if (MODE === 'probe2') obj[phKey] = '00' + num;
  else if (MODE === 'probe3') obj[phKey] = num;
  else { log('未知模式，原样放行'); return $done({}); }

  log('改写: ' + before + ' -> ' + obj[phKey] + ' , countryCode -> 90');
  return $done({ body: JSON.stringify(obj) });
})();
