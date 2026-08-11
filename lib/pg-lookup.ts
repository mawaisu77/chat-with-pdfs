import dns from "node:dns";

/**
 * Neon pooler hostnames are CNAME chains that fail with Node's default dns.lookup
 * on some macOS setups. resolve4 follows the chain; lookup is kept as fallback.
 */
export function pgLookup(
  hostname: string,
  options: dns.LookupOneOptions,
  callback: (
    err: NodeJS.ErrnoException | null,
    address: string | dns.LookupAddress[],
    family?: number,
  ) => void,
): void {
  dns.resolve4(hostname, (resolveError, addresses) => {
    if (!resolveError && addresses.length > 0) {
      callback(null, addresses[0], 4);
      return;
    }

    dns.lookup(hostname, options, callback);
  });
}
