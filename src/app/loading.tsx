export default function HomeLoading() {
  return (
    <div className="home-page space-y-8 pb-2" aria-busy="true" aria-label="首页内容加载中">
      <section className="flex flex-col gap-5 lg:h-[480px] lg:flex-row lg:gap-6">
        <div className="h-[260px] w-full animate-pulse rounded-2xl bg-muted sm:h-[340px] lg:h-full lg:w-3/4" />
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:h-full lg:w-1/4 lg:grid-cols-1 lg:gap-6">
          <div className="min-h-[150px] animate-pulse rounded-2xl border border-border/60 bg-muted/70" />
          <div className="min-h-[210px] animate-pulse rounded-2xl border border-border/60 bg-muted/70" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 rounded-xl bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-5/6 rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
