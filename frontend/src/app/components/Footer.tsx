export function Footer() {
  return (
    <footer className="site-footer mt-auto">
      <div className="max-w-[1152px] mx-auto px-6 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p
          className="text-center sm:text-left"
          style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}
        >
          LLM Council is a free tool by{' '}
          <a
            href="https://www.domelayer.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            Dome
          </a>
          {' '}— Governance-Driven Operational AI.
        </p>
        <a
          href="https://www.domelayer.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 whitespace-nowrap transition-opacity duration-150 hover:opacity-75"
          style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-accent)', textDecoration: 'none' }}
        >
          Explore Dome
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </footer>
  )
}
