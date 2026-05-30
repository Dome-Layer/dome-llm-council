"use client";

import Link from "next/link";
import { ToolHeader } from "@dome-layer/dome-ui";

export function Header() {
  return (
    <ToolHeader
      toolName="LLM Council"
      navLinks={[{ label: "Saved", href: "/saved" }]}
      renderLink={({ href, children, ...rest }) => (
        <Link href={href} {...rest}>
          {children}
        </Link>
      )}
    />
  );
}
