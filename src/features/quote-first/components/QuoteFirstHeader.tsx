/**
 * QuoteFirstHeader — minimal legitimacy-only header for the /scan route.
 *
 * No navigation, no hamburger, no competing links. Logo + wordmark only.
 */
export function QuoteFirstHeader() {
  return (
    <header className="relative z-20 w-full border-b border-white/5 bg-[#0A0F14]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
        <img
          src="/windowman_logo_400.webp"
          alt="WindowMan"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          loading="eager"
          decoding="async"
        />
        <span className="text-sm font-semibold tracking-tight text-white sm:text-base">
          WindowMan
        </span>
      </div>
    </header>
  );
}
