import Link from "next/link";

type FooterProps = {
  variant: "white" | "yellow";
};

export function Footer({ variant }: FooterProps) {
  if (variant === "yellow") {
    return <YellowFooter />;
  }
  return <WhiteFooter />;
}

function WhiteFooter() {
  return (
    <footer className="bg-white grid grid-cols-1 md:grid-cols-3 gap-12 px-12 py-24 w-full border-t border-outline/20">
      <div className="flex flex-col space-y-6">
        <div className="text-xl font-bold text-on-surface lowercase">
          zeyn by zeynep kömür
        </div>
        <p className="text-on-surface-variant max-w-xs font-body text-sm leading-relaxed tracking-wide lowercase">
          sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı.
        </p>
      </div>
      <div className="flex flex-col space-y-4 md:items-center">
        <div className="flex flex-col space-y-3">
          <Link
            href="tel:+900000000000"
            className="text-on-surface-variant hover:text-primary transition-all duration-300 font-body text-sm tracking-[0.1em] lowercase"
          >
            telefon
          </Link>
          <Link
            href="mailto:info@zeyn.art"
            className="text-on-surface-variant hover:text-primary transition-all duration-300 font-body text-sm tracking-[0.1em] lowercase"
          >
            e-posta
          </Link>
          <Link
            href="https://instagram.com"
            className="text-on-surface-variant hover:text-primary transition-all duration-300 font-body text-sm tracking-[0.1em] lowercase"
          >
            instagram
          </Link>
        </div>
      </div>
      <div className="flex flex-col space-y-6 md:items-end justify-between">
        <div className="flex space-x-8">
          <span className="material-symbols-outlined text-primary text-3xl">palette</span>
          <span
            className="material-symbols-outlined text-secondary text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            brush
          </span>
          <span className="material-symbols-outlined text-highlight-pink text-3xl">
            gallery_thumbnail
          </span>
        </div>
        <div className="text-on-surface-variant font-body text-xs tracking-[0.2em] lowercase opacity-60">
          &copy; zeyn by zeynep kömür. all rights reserved.
        </div>
      </div>
    </footer>
  );
}

function YellowFooter() {
  return (
    <footer className="bg-secondary-container flex flex-col md:flex-row justify-between items-center w-full px-12 py-16 font-body text-sm lowercase">
      <div className="font-bold text-on-secondary-container mb-8 md:mb-0 text-base">
        &copy; zeyn by zeynep kömür. sade ama vurucu.
      </div>
      <div className="flex flex-wrap justify-center gap-12 text-on-secondary-container">
        <Link
          href="tel:+900000000000"
          className="hover:text-primary transition-all flex items-center gap-2 font-medium"
        >
          <span className="material-symbols-outlined text-base">call</span>
          telefon
        </Link>
        <Link
          href="mailto:info@zeyn.art"
          className="hover:text-primary transition-all flex items-center gap-2 font-medium"
        >
          <span className="material-symbols-outlined text-base">mail</span>
          e-posta
        </Link>
        <Link
          href="https://instagram.com"
          className="underline font-bold hover:text-primary transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">camera</span>
          instagram
        </Link>
      </div>
    </footer>
  );
}
