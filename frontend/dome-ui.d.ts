// @dome-layer/dome-ui ships its Tailwind preset as a subpath export whose
// generated .d.ts is not reliably resolved on Vercel's clean git-dependency
// install (TS7016). The preset is a plain config object and is cast to
// `Config` in tailwind.config.ts, so an ambient module declaration (typed as
// `any`) is sufficient and safe — the real values still load at build time.
declare module "@dome-layer/dome-ui/tailwind-preset";
