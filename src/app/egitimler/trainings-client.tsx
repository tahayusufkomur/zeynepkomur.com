"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/use-admin";
import { TrainingFormModal, type Training } from "@/components/trainings/training-form-modal";
import { RichText } from "@/components/ui/rich-text";

type Props = {
  trainings: Training[];
};

export function TrainingsClient({ trainings }: Props) {
  const { isEditing } = useAdmin();
  const [editing, setEditing] = useState<Training | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const visible = isEditing ? trainings : trainings.filter((t) => t.isPublished);

  function handleSaved() {
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  return (
    <>
      {visible.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-on-surface-variant text-lg lowercase">
          henüz yayınlanmış eğitim bulunmuyor.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {visible.map((t) => (
            <div
              key={t.id}
              className="group flex flex-col bg-background border border-surface-container-highest/50 hover:shadow-lg transition-shadow duration-300 relative"
            >
              {isEditing && (
                <button
                  onClick={() => setEditing(t)}
                  className="absolute top-3 right-3 z-20 bg-primary text-on-primary w-9 h-9 flex items-center justify-center shadow-md opacity-80 hover:opacity-100 transition-opacity"
                  aria-label="Düzenle"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              )}
              {!t.isPublished && (
                <div className="absolute top-3 left-3 z-10 bg-on-surface text-on-primary px-2 py-1 text-[10px] font-bold tracking-widest uppercase shadow-sm">
                  taslak
                </div>
              )}
              <Link href={`/egitimler/${t.slug}`} className="flex flex-col flex-1">
                <div className="aspect-[4/3] overflow-hidden bg-surface-container">
                  {t.imagePath ? (
                    <img
                      src={t.imagePath}
                      alt={t.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-outline/20 text-7xl">
                        school
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h2 className="text-xl font-bold text-on-surface lowercase mb-2">{t.title}</h2>
                  <RichText html={t.content} className="text-sm text-on-surface-variant line-clamp-3 mb-4" />
                  <div className="mt-auto flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest">
                    {t.format && (
                      <span className="text-primary">{t.format}</span>
                    )}
                    {t.duration && (
                      <span className="text-on-surface-variant">• {t.duration}</span>
                    )}
                    {t.price && (
                      <span className="text-on-surface-variant">• {t.price}</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <button
          onClick={() => setCreating(true)}
          className="fixed bottom-8 right-8 z-50 bg-primary text-on-primary px-6 py-4 font-bold shadow-xl hover:bg-primary-dim transition-all duration-300 flex items-center gap-3"
        >
          <span className="material-symbols-outlined">add</span>
          Yeni Eğitim Ekle
        </button>
      )}

      {editing && (
        <TrainingFormModal training={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
      {creating && (
        <TrainingFormModal onClose={() => setCreating(false)} onSaved={handleSaved} />
      )}
    </>
  );
}
