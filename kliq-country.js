/**
 * kliq-country.js —— Surge http-response 脚本
 * 作用：改写 Kliq 收到的 GET /v1/country/list 响应，
 *      1) 给已返回的国家强制补上 permissions = AllowRegistration, AllowLogin
 *      2) 补上 Germany(+49) 等实测可注册的国家（缺哪个补哪个，不重复）
 * 只影响本机 UI 上"能不能选这个国家"，不改注册请求本体，也不改服务端校验。
 */

const EXTRA = [
  { name: 'Germany',        two_letter_iso_code: 'DE', three_letter_iso_code: 'DEU', numeric_iso_code: 276, dial_codes: '49' },
  { name: 'Netherlands',    two_letter_iso_code: 'NL', three_letter_iso_code: 'NLD', numeric_iso_code: 528, dial_codes: '31' },
  { name: 'France',         two_letter_iso_code: 'FR', three_letter_iso_code: 'FRA', numeric_iso_code: 250, dial_codes: '33' },
  { name: 'Switzerland',    two_letter_iso_code: 'CH', three_letter_iso_code: 'CHE', numeric_iso_code: 756, dial_codes: '41' },
  { name: 'Austria',        two_letter_iso_code: 'AT', three_letter_iso_code: 'AUT', numeric_iso_code: 40,  dial_codes: '43' },
  { name: 'United States',  two_letter_iso_code: 'US', three_letter_iso_code: 'USA', numeric_iso_code: 840, dial_codes: '1'  }
];

const NEED = ['AllowRegistration', 'AllowLogin'];

function log(s) {
  console.log('[Kliq] ' + s);
}

function isCountryObj(x) {
  return x && typeof x === 'object' &&
    ('two_letter_iso_code' in x || 'dial_codes' in x || 'code' in x || 'iso_code' in x);
}

function codeOf(x) {
  return String(x.two_letter_iso_code || x.code || x.iso_code || '').toUpperCase();
}

/* 深度找国家数组：优先 payload/data/result/countries/... ，也接受空数组 */
function findList(node, depth) {
  if (!node || depth > 5) return null;
  if (Array.isArray(node)) {
    if (node.length === 0) return node;
    const sample = node.find(isCountryObj);
    return sample ? node : null;
  }
  if (typeof node === 'object') {
    const prefer = ['payload', 'data', 'result', 'countries', 'items', 'list', 'value', 'content'];
    for (let i = 0; i < prefer.length; i++) {
      const k = prefer[i];
      if (k in node) {
        const r = findList(node[k], depth + 1);
        if (r) return r;
      }
    }
    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      const r = findList(node[keys[i]], depth + 1);
      if (r) return r;
    }
  }
  return null;
}

/* 补权限：保持原类型（数组仍数组，字符串仍字符串） */
function fixPerms(c) {
  let p = c.permissions;
  if (Array.isArray(p)) {
    NEED.forEach(function (n) { if (p.indexOf(n) < 0) p.push(n); });
    c.permissions = p;
    return c;
  }
  const set = [];
  String(p || '').split(',').forEach(function (s) {
    s = String(s).trim();
    if (s && set.indexOf(s) < 0) set.push(s);
  });
  NEED.forEach(function (n) { if (set.indexOf(n) < 0) set.push(n); });
  c.permissions = set.join(', ');
  return c;
}

(function main() {
  const body = $response.body;
  if (!body) { log('empty body, skip'); return $done({}); }

  let obj;
  try {
    obj = JSON.parse(body);
  } catch (e) {
    log('response is not JSON, skip (' + body.slice(0, 60) + ')');
    return $done({});
  }

  const list = findList(obj, 0);
  if (!list) {
    log('country array not found, top keys=' + Object.keys(obj || {}).join(','));
    return $done({ body: body });
  }

  const have = {};
  list.forEach(function (c) { if (isCountryObj(c)) have[codeOf(c)] = c; });

  /* 1) 已有国家全部补权限（服务端只给 TR 开 AllowRegistration 时也能过客户端这一层） */
  list.forEach(function (c) { if (isCountryObj(c)) fixPerms(c); });

  /* 2) 缺的国家补进去 */
  const added = [];
  EXTRA.forEach(function (e) {
    if (!have[e.two_letter_iso_code]) {
      const item = {};
      Object.keys(e).forEach(function (k) { item[k] = e[k]; });
      fixPerms(item);
      list.push(item);
      added.push(e.two_letter_iso_code);
    }
  });

  log('countries=' + list.length + ' injected=' + (added.join(',') || '-') +
      ' sample=' + list.slice(0, 1).map(function (c) { return codeOf(c); }).join(''));

  $done({ body: JSON.stringify(obj) });
})();
