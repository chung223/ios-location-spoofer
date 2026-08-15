// 產生 iOS 設定描述檔（.mobileconfig）：一個原生 IKEv2 VPN payload + 一個 CA 憑證 payload。
// 裝上後朋友端「零 App」：iOS 內建 IKEv2 直接連；CA 憑證裝好後仍需手動到
//「憑證信任設定」開啟完全信任（非監管裝置 iOS 規定要手動，描述檔不能代勞）。
//
// 授權：AGPL-3.0。

import crypto from "node:crypto";

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 極簡 plist 序列化：支援 string / number(integer) / boolean / {__data} / array / object
function plistNode(v, indent = "  ") {
  const pad = indent;
  if (v && typeof v === "object" && typeof v.__data === "string") {
    return `${pad}<data>\n${pad}${v.__data}\n${pad}</data>`;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return `${pad}<array/>`;
    const inner = v.map((it) => plistNode(it, indent + "  ")).join("\n");
    return `${pad}<array>\n${inner}\n${pad}</array>`;
  }
  if (v && typeof v === "object") {
    const keys = Object.keys(v);
    if (keys.length === 0) return `${pad}<dict/>`;
    const inner = keys
      .map((k) => `${indent}  <key>${xmlEscape(k)}</key>\n${plistNode(v[k], indent + "  ")}`)
      .join("\n");
    return `${pad}<dict>\n${inner}\n${pad}</dict>`;
  }
  if (typeof v === "boolean") return `${pad}<${v ? "true" : "false"}/>`;
  if (typeof v === "number") return `${pad}<integer>${Math.trunc(v)}</integer>`;
  return `${pad}<string>${xmlEscape(v)}</string>`;
}

export function toPlist(root) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
    '<plist version="1.0">\n' +
    plistNode(root, "") +
    "\n</plist>\n"
  );
}

// PEM → DER 的 base64（描述檔的 <data> 要的就是 DER 的 base64，也就是 PEM 去掉頭尾與換行）
export function pemToDataBase64(pem) {
  const m = String(pem).match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/);
  if (!m) throw new Error("invalid CA PEM (no CERTIFICATE block)");
  const body = m[1].replace(/\s+/g, "");
  if (!body) throw new Error("empty CA PEM");
  return body;
}

// 產生一份朋友專屬描述檔。
// opts: { server, friend, eapUser, eapPass, caPem, caCommonName?, org?, uuid? }
export function buildMobileConfig(opts) {
  const {
    server,
    friend,
    eapUser,
    eapPass,
    caPem,
    caCommonName = "",
    org = "Location Picker",
    uuid = () => crypto.randomUUID().toUpperCase(),
  } = opts;

  if (!server) throw new Error("server required");
  if (!friend) throw new Error("friend required");
  if (!eapUser || !eapPass) throw new Error("eapUser/eapPass required");
  if (!caPem) throw new Error("caPem required");

  const vpnUUID = uuid();
  const certUUID = uuid();
  const topUUID = uuid();
  const idBase = "men.chung.locvpn"; // 反向網域式識別碼前綴

  const ikev2 = {
    AuthenticationMethod: "None", // 純 EAP（下面 ExtendedAuth）— 首次上機請驗證
    ExtendedAuthEnabled: true,
    AuthName: eapUser,
    AuthPassword: eapPass,
    RemoteAddress: server,
    RemoteIdentifier: server,
    LocalIdentifier: friend,
    DeadPeerDetectionRate: "Medium",
    EnablePFS: true,
    IKESecurityAssociationParameters: {
      EncryptionAlgorithm: "AES-256-GCM",
      IntegrityAlgorithm: "SHA2-256",
      DiffieHellmanGroup: 19,
      LifeTimeInMinutes: 1440,
    },
    ChildSecurityAssociationParameters: {
      EncryptionAlgorithm: "AES-256-GCM",
      IntegrityAlgorithm: "SHA2-256",
      DiffieHellmanGroup: 19,
      LifeTimeInMinutes: 1440,
    },
  };
  if (caCommonName) ikev2.ServerCertificateIssuerCommonName = caCommonName;

  const vpnPayload = {
    PayloadType: "com.apple.vpn.managed",
    PayloadVersion: 1,
    PayloadIdentifier: `${idBase}.vpn.${vpnUUID}`,
    PayloadUUID: vpnUUID,
    PayloadDisplayName: `定位 VPN（${friend}）`,
    UserDefinedName: `定位 VPN（${friend}）`,
    VPNType: "IKEv2",
    IKEv2: ikev2,
  };

  const certPayload = {
    PayloadType: "com.apple.security.root",
    PayloadVersion: 1,
    PayloadIdentifier: `${idBase}.ca.${certUUID}`,
    PayloadUUID: certUUID,
    PayloadDisplayName: "定位服務 CA 憑證",
    PayloadCertificateFileName: "loc-ca.crt",
    PayloadContent: { __data: pemToDataBase64(caPem) },
  };

  const profile = {
    PayloadType: "Configuration",
    PayloadVersion: 1,
    PayloadIdentifier: `${idBase}.${topUUID}`,
    PayloadUUID: topUUID,
    PayloadDisplayName: `定位服務（${friend}）`,
    PayloadOrganization: org,
    PayloadDescription: "安裝後：到「設定→一般→關於本機→憑證信任設定」開啟本 CA 的完全信任，再連 VPN。",
    PayloadRemovalDisallowed: false,
    PayloadContent: [vpnPayload, certPayload],
  };

  return toPlist(profile);
}
