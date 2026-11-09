type FilterStatCard = {
  label: string;
  value: number | null;
  filter: string;
};

type FilterStatCardsProps = {
  cards: FilterStatCard[];
  selectedFilter: string;
  onSelect: (filter: string) => void;
  columns: "three" | "four";
  isLoading?: boolean;
  partialMessage?: string;
};

const gridColumns = {
  three: "sm:grid-cols-2 xl:grid-cols-3",
  four: "sm:grid-cols-2 xl:grid-cols-4",
};

export function FilterStatCards({
  cards,
  selectedFilter,
  onSelect,
  columns,
  isLoading = false,
  partialMessage,
}: FilterStatCardsProps) {
  return (
    <section
      className={`grid gap-3 ${gridColumns[columns]}`}
      aria-label="Statistics and status filters"
    >
      {cards.map((card) => {
        const selected = selectedFilter === card.filter;

        return (
          <button
            key={card.filter}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(card.filter)}
            className={`min-w-0 rounded-xl border bg-white p-4 text-left shadow-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
              selected
                ? "border-brand-300 ring-1 ring-brand-200"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <p className="text-xs font-semibold text-slate-500">{card.label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
              {isLoading
                ? "—"
                : card.value === null
                  ? "—"
                  : card.value.toLocaleString("en-US")}
            </p>
            <span className="sr-only">
              {selected ? "Currently selected filter" : "Filter by this status"}
            </span>
          </button>
        );
      })}
      {(isLoading || partialMessage) && (
        <p
          className="text-xs text-slate-500 sm:col-span-2 xl:col-span-full"
          role="status"
        >
          {isLoading ? "Loading global statistics…" : partialMessage}
        </p>
      )}
    </section>
  );
}
