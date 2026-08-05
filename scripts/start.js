#!/usr/bin/env node
/**
 * Starts Expo with the QR code pointing at this machine's LAN address.
 *
 * Expo's own --lan flag falls back to advertising 127.0.0.1 on some Windows
 * network setups, which makes the QR code unscannable from a phone (the phone
 * resolves 127.0.0.1 to itself). Setting REACT_NATIVE_PACKAGER_HOSTNAME
 * explicitly is the reliable override, and detecting the IP each run means it
 * survives a new DHCP lease.
 *
 * Pass --tunnel to route via ngrok instead, for networks that block
 * device-to-device traffic (most campus and guest WiFi).
 */
const { spawn } = require('child_process');
const os = require('os');

function lanAddress() {
  const candidates = Object.values(os.networkInterfaces())
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal);

  // Prefer real private ranges over virtual adapters (Docker, WSL, VPN) which
  // a phone on the WiFi cannot reach.
  const private192 = candidates.find((n) => n.address.startsWith('192.168.'));
  const private10 = candidates.find((n) => n.address.startsWith('10.'));
  return (private192 ?? private10 ?? candidates[0])?.address;
}

const passthrough = process.argv.slice(2);
const tunnel = passthrough.includes('--tunnel');
const args = ['expo', 'start', ...(tunnel ? [] : ['--lan']), ...passthrough];

const env = { ...process.env };
if (!tunnel) {
  const host = lanAddress();
  if (host) {
    env.REACT_NATIVE_PACKAGER_HOSTNAME = host;
    console.log(`\nQR code will point at http://${host}:8081`);
    console.log('Your phone must be on the same WiFi.');
    console.log('If it still will not connect, run: npm run start:tunnel\n');
  } else {
    console.log('\nNo LAN address found — falling back to Expo defaults.\n');
  }
}

spawn('npx', args, { stdio: 'inherit', shell: true, env }).on('exit', (code) =>
  process.exit(code ?? 0),
);
