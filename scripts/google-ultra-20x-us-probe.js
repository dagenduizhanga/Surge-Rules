/*
 * Google Ultra 20x US offer probe for Surge iOS.
 * READ ONLY: no response rewrite, no billing request, no private data logging.
 * The $19.99 x 3 promo SKU identified by the community is for Android Play Billing,
 * and is not a verified iOS StoreKit product identifier.
 */
(function () {
  try {
    var body = ($response && typeof $response.body === "string") ? $response.body : "";
    var signals = [
      ["play-20x-us-3m-90", /g1\.ai\.ultra\.3months_ip_90p\.acq\b/i],
      ["ios-legacy-30tb", /(?:com\.google\.GoogleMobile\.)?30tb\.m\b/i],
      ["ios-modern-30tb", /(?:com\.google\.GoogleMobile\.)?30tb\.ai\.pro\.m\b/i]
    ];
    var found = [];
    for (var i = 0; i < signals.length; i++) {
      if (signals[i][1].test(body)) found.push(signals[i][0]);
    }
    console.log("[google-ultra-20x-us] read-only; matches=" +
      (found.length ? found.join(",") : "none") +
      "; HTTP=" + ($response ? $response.status : "unknown"));
  } catch (err) {
    console.log("[google-ultra-20x-us] inspection unavailable; no changes");
  }
  $done({});
})();
