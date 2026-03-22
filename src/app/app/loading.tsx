
'use client';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="magic-loader-wrap" aria-live="polite" aria-busy="true" role="status">
        <div className="magic-loader magic-loader-hex">
          <div className="magic-loader-ring magic-loader-ring-outer" />
          <div className="magic-loader-ring magic-loader-ring-inner" />
          <svg viewBox="0 0 200 200" className="magic-hex-svg magic-hex-layer-a" aria-hidden="true">
            <polygon points="100,18 24,160 176,160" className="magic-hex-triangle magic-hex-triangle-a" />
            <polygon points="100,182 24,40 176,40" className="magic-hex-triangle magic-hex-triangle-b" />
            <circle cx="100" cy="100" r="78" className="magic-hex-circle" />
          </svg>
          <svg viewBox="0 0 200 200" className="magic-hex-svg magic-hex-layer-b" aria-hidden="true">
            <polygon points="100,26 30,154 170,154" className="magic-hex-triangle magic-hex-triangle-c" />
            <polygon points="100,174 30,46 170,46" className="magic-hex-triangle magic-hex-triangle-d" />
            <circle cx="100" cy="100" r="62" className="magic-hex-circle-alt" />
          </svg>
          <div className="magic-loader-core">✡</div>
        </div>
        <p className="mt-4 text-xs tracking-[0.2em] text-white/85">LOADING</p>
      </div>
    </div>
  );
}
