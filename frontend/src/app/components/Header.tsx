"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToolHeader } from "@dome-layer/dome-ui";
import { useT } from "@/lib/i18n";

export function Header() {
  const pathname = usePathname();
  const t = useT();

  return (
    <ToolHeader
      toolName="LLM Council"
      width="contained"
      navLinks={[{ label: t.nav.saved, href: "/saved" }]}
      languages
      currentPath={pathname ?? undefined}
      renderLink={({ href, children, ...rest }) => (
        <Link href={href} {...rest}>
          {children}
        </Link>
      )}
    />
  );
}
