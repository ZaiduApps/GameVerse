export default function GameDetailLoading() {
  return (
    <div
      className="game-detail-stitch min-h-screen overflow-x-clip bg-[#f5f6f7] dark:bg-[#080d14]"
      aria-busy="true"
      aria-label="游戏详情加载中"
    >
      <div className="mx-auto hidden max-w-7xl px-4 py-5 sm:px-6 lg:block lg:px-16 2xl:px-20">
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      <section className="lg:mx-auto lg:max-w-7xl lg:px-16 2xl:px-20">
        <div className="h-72 w-full animate-pulse rounded-none bg-muted sm:h-80 lg:h-96 lg:rounded-3xl" />

        <div className="relative -mt-12 px-4 lg:mt-6 lg:px-0">
          <div className="animate-pulse rounded-2xl border border-border/50 bg-card p-4 shadow-sm lg:rounded-3xl lg:p-8">
            <div className="mb-3 h-4 w-44 rounded bg-muted lg:hidden" />
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3.5 lg:gap-6">
                <div className="h-20 w-20 shrink-0 rounded-2xl bg-muted lg:h-24 lg:w-24" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-5 w-32 rounded-full bg-muted" />
                  <div className="h-6 w-56 max-w-full rounded bg-muted" />
                  <div className="h-3.5 w-40 rounded bg-muted" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-11 w-32 rounded-full bg-muted" />
                <div className="h-11 w-11 rounded-full bg-muted" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border/40 pt-4 lg:mt-8 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={index === 1 ? "hidden items-center justify-center lg:flex" : "flex items-center justify-center"}>
                  <div className="h-9 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-16 lg:pt-8 2xl:px-20">
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] lg:gap-8">
          <div className="space-y-3.5 lg:space-y-8">
            <div className="animate-pulse rounded-2xl border border-border/50 bg-card p-4 shadow-sm lg:p-6">
              <div className="h-5 w-48 rounded bg-muted" />
              <div className="mt-4 h-36 rounded-xl bg-muted lg:h-60" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="h-20 rounded-lg bg-muted" />
                <div className="h-20 rounded-lg bg-muted" />
                <div className="h-20 rounded-lg bg-muted" />
              </div>
            </div>

            <div className="animate-pulse rounded-2xl border border-border/50 bg-card p-4 shadow-sm lg:p-6">
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="mt-4 space-y-2.5">
                <div className="h-3.5 w-full rounded bg-muted" />
                <div className="h-3.5 w-11/12 rounded bg-muted" />
                <div className="h-3.5 w-full rounded bg-muted" />
                <div className="h-3.5 w-4/5 rounded bg-muted" />
                <div className="h-3.5 w-2/3 rounded bg-muted" />
              </div>
            </div>
          </div>

          <aside className="hidden space-y-3.5 lg:block lg:space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-border/50 bg-card shadow-sm"
              />
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
