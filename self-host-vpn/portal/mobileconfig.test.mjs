import assert from "node:assert/strict";
import test from "node:test";
import { buildMobileConfig, toPlist, pemToDataBase64 } from "./mobileconfig.mjs";

const CA_PEM = "-----BEGIN CERTIFICATE-----\nMIIBFAKEca0BASE64body+/==\n-----END CERTIFICATE-----\n";

// 極簡 XML 良構檢查：驗證標籤成對巢狀（忽略文字/資料內容）
function assertWellFormed(xml) {
  const body = xml.replace(/<\?[\s\S]*?\?>/g, "").replace(/<!DOCTYPE[\s\S]*?>/g, "");
  const re = /<(\/?)([A-Za-z][\w.:-]*)(?:[^>"']|"[^"]*"|'[^']*')*?(\/?)>/g;
  const stack = [];
  let m;
  while ((m = re.exec(body))) {
    const closing = m[1] === "/";
    const name = m[2];
    const selfClose = m[3] === "/";
    if (selfClose) continue;
    if (!closing) stack.push(name);
    else {
      const top = stack.pop();
      assert.equal(top, name, "標籤不對稱：</" + name + "> 對到 " + top);
    }
  }
  assert.equal(stack.length, 0, "有未關閉標籤：" + stack.join(","));
}

test("pemToDataBase64 去掉 PEM 頭尾與換行", () => {
  assert.equal(pemToDataBase64(CA_PEM), "MIIBFAKEca0BASE64body+/==");
  assert.throws(() => pemToDataBase64("not a pem"));
});

test("toPlist 產生良構 XML（含各型別）", () => {
  const xml = toPlist({ a: "x", b: 3, c: true, d: ["y", { e: false }], f: { __data: "AAAA" } });
  assertWellFormed(xml);
  assert.match(xml, /<key>a<\/key>\s*<string>x<\/string>/);
  assert.match(xml, /<integer>3<\/integer>/);
  assert.match(xml, /<true\/>/);
  assert.match(xml, /<data>\s*AAAA\s*<\/data>/);
});

test("buildMobileConfig：IKEv2 VPN + CA 憑證，良構且欄位正確", () => {
  const xml = buildMobileConfig({
    server: "fly.chung.men",
    friend: "alice",
    eapUser: "alice",
    eapPass: "s3cr3t-pw",
    caPem: CA_PEM,
    caCommonName: "Location CA",
    uuid: (() => { let n = 0; return () => "UUID-" + (++n); })(),
  });
  assertWellFormed(xml);
  assert.match(xml, /<key>VPNType<\/key>\s*<string>IKEv2<\/string>/);
  assert.match(xml, /<key>RemoteAddress<\/key>\s*<string>fly\.chung\.men<\/string>/);
  assert.match(xml, /<key>RemoteIdentifier<\/key>\s*<string>fly\.chung\.men<\/string>/);
  assert.match(xml, /<key>LocalIdentifier<\/key>\s*<string>alice<\/string>/);
  assert.match(xml, /<key>AuthName<\/key>\s*<string>alice<\/string>/);
  assert.match(xml, /<key>AuthPassword<\/key>\s*<string>s3cr3t-pw<\/string>/);
  assert.match(xml, /<key>ServerCertificateIssuerCommonName<\/key>\s*<string>Location CA<\/string>/);
  // CA 憑證 payload 內含 DER base64
  assert.match(xml, /com\.apple\.security\.root/);
  assert.match(xml, /MIIBFAKEca0BASE64body\+\/==/);
  // 兩個 payload（VPN + 憑證）
  assert.match(xml, /com\.apple\.vpn\.managed/);
});

test("特殊字元的密碼會被 XML 逸出（不破壞描述檔）", () => {
  const xml = buildMobileConfig({
    server: "fly.chung.men",
    friend: "bob",
    eapUser: "bob",
    eapPass: 'a&b<c>"d',
    caPem: CA_PEM,
  });
  assertWellFormed(xml);
  assert.match(xml, /<string>a&amp;b&lt;c&gt;&quot;d<\/string>/);
  assert.doesNotMatch(xml, /a&b<c>"d/); // 不應有未逸出的原字元
});

test("缺必要欄位會擋下", () => {
  assert.throws(() => buildMobileConfig({ friend: "x", eapUser: "x", eapPass: "y", caPem: CA_PEM }));
  assert.throws(() => buildMobileConfig({ server: "s", eapUser: "x", eapPass: "y", caPem: CA_PEM }));
  assert.throws(() => buildMobileConfig({ server: "s", friend: "x", eapUser: "x", eapPass: "y" }));
});
