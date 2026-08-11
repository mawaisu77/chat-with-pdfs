import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Sign up", href: "/auth/sign-up" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "Privacy", href: "/" },
      { label: "Terms", href: "/" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Sign in", href: "/auth/login" },
      { label: "Documentation", href: "/" },
      { label: "Contact", href: "/" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-5 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 text-xs font-bold text-white">
                PC
              </span>
              PDF Chat
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Intelligence for your documents. Upload, ask, verify.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-subtle">
                {col.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-subtle">
            © {new Date().getFullYear()} PDF Chat. All rights reserved.
          </p>
          <div className="flex gap-3">
            {["X", "in", "GH"].map((label) => (
              <span
                key={label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-muted"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
