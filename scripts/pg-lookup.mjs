import dns from "node:dns";

/** Neon pooler CNAME chains fail with Node dns.lookup on some macOS setups. */
export function pgLookup(hostname, options, callback) {
  dns.resolve4(hostname, (resolveError, addresses) => {
    if (!resolveError && addresses.length > 0) {
      callback(null, addresses[0], 4);
      return;
    }

    dns.lookup(hostname, options, callback);
  });
}
