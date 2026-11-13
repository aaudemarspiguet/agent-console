// PC side of the Gate 0 spike (product-brief.md, G0-1). It does not listen on the
// network yet: it only reports what the phone will need in order to find this PC.
import { networkInterfaces } from 'node:os';
import { PROTOCOL_VERSION } from '@deck/protocol';

/** IPv4 addresses on this PC that a phone on the same Wi-Fi could reach. */
function localAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net !== undefined && net.family === 'IPv4' && !net.internal)
    .map((net) => net!.address);
}

console.log(`Deck agent, protocol version ${PROTOCOL_VERSION}`);
console.log(`Addresses on this network: ${localAddresses().join(', ') || 'none found'}`);
console.log('Pairing and the encrypted link are not built yet (Gate 0, G0-1).');
