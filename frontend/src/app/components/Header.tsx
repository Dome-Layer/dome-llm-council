import Link from 'next/link'
import { DomeLogo } from './DomeLogo'
import ThemeToggle from './ThemeToggle'

export function Header() {
  return (
    <header className="site-header sticky top-0 z-40">
      <div className="max-w-[1152px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Home">
          <DomeLogo width={100} />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
