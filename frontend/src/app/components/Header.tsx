"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToolHeader } from "@dome-layer/dome-ui";

export function Header() {
  const pathname = usePathname();

  return (
    <ToolHeader
      toolName="LLM Council"
      width="contained"
      navLinks={[{ label: "Saved", href: "/saved" }]}
      currentPath={pathname ?? undefined}
      renderLink={({ href, children, ...rest }) => (
        <Link href={href} {...rest}>
          {children}
        </Link>
      )}
    />
  );
}
