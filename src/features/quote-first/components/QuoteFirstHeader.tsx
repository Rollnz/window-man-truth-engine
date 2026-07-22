import windowManLogo from '@/assets/windowman_logo_400.webp';

/**
 * QuoteFirstHeader — minimal legitimacy-only header for the /scan route.
 *
 * No navigation, no hamburger, no competing links. Icon logo + wordmark text.
 * The logo asset is icon-only, so a separate WindowMan text label is retained
 * per the Global Logo Standard.
 */
export function QuoteFirstHeader() {
  return (
    <header className="relative z-20 w-full border-b border-white/5 bg-[#0A0F14]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
        <img
          src={windowManLogo}
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
