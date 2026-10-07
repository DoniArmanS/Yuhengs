// Dev server reachable from phones on the same network, over HTTPS.
//
// Plain http://<lan-ip>:3000 is not a secure context, so browsers disable
// Web Crypto inside the player iframes and some servers (MegaPlay) can't
// decrypt their streams. This generates a self-signed certificate for
// localhost plus this machine's current LAN addresses and starts `next dev`
// with it. Your phone will warn about the certificate once; accept it.

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";

const port = process.env.PORT ?? "3000";
const dir = "certificates";
const key = `${dir}/dev-key.pem`;
const cert = `${dir}/dev-cert.pem`;
const stamp = `${dir}/dev-ips.txt`;

const ips = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4" && !a.internal && !a.address.startsWith("172.17."))
  .map((a) => a.address);

const wanted = ["127.0.0.1", ...ips].join(",");
const stale = !existsSync(cert) || !existsSync(stamp) || readFileSync(stamp, "utf8") !== wanted;

if (stale) {
  mkdirSync(dir, { recursive: true });
  const san = ["DNS:localhost", ...wanted.split(",").map((ip) => `IP:${ip}`)].join(",");
  execFileSync(
    "openssl",
    ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "365", "-subj", "/CN=yuhengs-dev",
      "-addext", `subjectAltName=${san}`, "-keyout", key, "-out", cert],
    { stdio: "ignore" },
  );
  writeFileSync(stamp, wanted);
}

console.log("\nOpen on your phone (accept the certificate warning once):");
for (const ip of ips) console.log(`  https://${ip}:${port}`);
console.log("");

const child = spawn(
  "npx",
  ["next", "dev", "-H", "0.0.0.0", "-p", port,
    "--experimental-https", "--experimental-https-key", key, "--experimental-https-cert", cert],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 0));
