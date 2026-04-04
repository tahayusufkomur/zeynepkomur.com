"use client";

type FilterBarProps = {
  totalCount: number;
  dimensions: string[];
  collections: { id: string; title: string }[];
  selectedDimension: string | null;
  selectedCollection: string | null;
  onDimensionChange: (value: string | null) => void;
  onCollectionChange: (value: string | null) => void;
};

export function FilterBar({
  totalCount,
  dimensions,
  collections,
  selectedDimension,
  selectedCollection,
  onDimensionChange,
  onCollectionChange,
}: FilterBarProps) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low px-8 py-6 mb-8">
      <div className="flex flex-wrap items-center gap-4">
        {/* Boyut filter */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            boyut
          </label>
          <select
            value={selectedDimension ?? ""}
            onChange={(e) => onDimensionChange(e.target.value || null)}
            className="text-sm bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary text-on-surface lowercase py-1 pr-6 cursor-pointer"
          >
            <option value="">tümü</option>
            {dimensions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Collection filter */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            koleksiyon
          </label>
          <select
            value={selectedCollection ?? ""}
            onChange={(e) => onCollectionChange(e.target.value || null)}
            className="text-sm bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary text-on-surface lowercase py-1 pr-6 cursor-pointer"
          >
            <option value="">tümü</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-on-surface-variant lowercase">
        <span className="font-bold text-on-surface">{totalCount}</span> eser listeleniyor
      </div>
    </section>
  );
}
