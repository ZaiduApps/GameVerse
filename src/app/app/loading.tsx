export default function GameLibraryLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="游戏库内容加载中">
      <div className="h-5 w-56 animate-pulse rounded bg-muted" />

      <section className="animate-pulse rounded-2xl border bg-card p-6 shadow-sm">
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="mt-4 max-w-3xl space-y-2.5">
          <div className="h-3.5 w-full rounded bg-muted" />
          <div className="h-3.5 w-11/12 rounded bg-muted" />
          <div className="h-3.5 w-4/5 rounded bg-muted" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 rounded-xl border bg-background/60 p-4">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[132px] animate-pulse gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="h-24 w-24 shrink-0 rounded-xl bg-muted" />
            <div className="min-w-0 flex-1 py-1">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-5 w-14 rounded-full bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
