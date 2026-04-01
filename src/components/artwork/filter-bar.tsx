"use client";

type FilterBarProps = {
  totalCount: number;
  onColorChange?: (value: string) => void;
  onSizeChange?: (value: string) => void;
  onCollectionChange?: (value: string) => void;
};

export function FilterBar({
  totalCount,
  onColorChange,
  onSizeChange,
  onCollectionChange,
}: FilterBarProps) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-6 py-6 mb-12 bg-surface-container-low px-8">
      <div className="flex flex-wrap items-center gap-12">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">
            renk
          </span>
          <select
            onChange={(e) => onColorChange?.(e.target.value)}
            className="bg-transparent border-0 border-b border-outline-variant py-2 pr-10 focus:ring-0 focus:border-primary text-sm font-semibold"
          >
            <option value="">tüm renkler</option>
            <option value="monokrom">monokrom</option>
            <option value="vibrant">vibrant</option>
            <option value="pastel">pastel</option>
          </select>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">
            boyut
          </span>
          <select
            onChange={(e) => onSizeChange?.(e.target.value)}
            className="bg-transparent border-0 border-b border-outline-variant py-2 pr-10 focus:ring-0 focus:border-primary text-sm font-semibold"
          >
            <option value="">tüm boyutlar</option>
            <option value="50x70">50x70 cm</option>
            <option value="70x100">70x100 cm</option>
            <option value="ozel">özel boyut</option>
          </select>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">
            koleksiyon
          </span>
          <select
            onChange={(e) => onCollectionChange?.(e.target.value)}
            className="bg-transparent border-0 border-b border-outline-variant py-2 pr-10 focus:ring-0 focus:border-primary text-sm font-semibold"
          >
            <option value="">tüm koleksiyonlar</option>
          </select>
        </div>
      </div>
      <div className="text-xs text-on-surface-variant font-medium">
        {totalCount} eser listeleniyor
      </div>
    </section>
  );
}
