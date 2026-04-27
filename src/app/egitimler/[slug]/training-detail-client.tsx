"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/use-admin";
import { RichText } from "@/components/ui/rich-text";
import { TrainingFormModal, type Training } from "@/components/trainings/training-form-modal";

type Props = {
  training: Training;
};

export function TrainingDetailClient({ training }: Props) {
  const { isEditing } = useAdmin();
  const [showEdit, setShowEdit] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="aspect-[4/3] relative bg-surface-container-low overflow-hidden">
          {training.imagePath ? (
            <img src={training.imagePath} alt={training.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-outline/20 text-9xl">school</span>
            </div>
          )}
          {isEditing && (
            <button
              onClick={() => setShowEdit(true)}
              className="absolute top-3 right-3 bg-primary text-on-primary w-10 h-10 flex items-center justify-center shadow-md opacity-90 hover:opacity-100 transition-opacity"
              aria-label="Düzenle"
            >
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-on-surface lowercase mb-6">
            {training.title}
          </h1>

          <dl className="space-y-4 mb-8">
            {training.format && (
              <div className="flex gap-4">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-primary w-24 shrink-0">format</dt>
                <dd className="text-on-surface lowercase">{training.format}</dd>
              </div>
            )}
            {training.duration && (
              <div className="flex gap-4">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-primary w-24 shrink-0">süre</dt>
                <dd className="text-on-surface lowercase">{training.duration}</dd>
              </div>
            )}
            {training.price && (
              <div className="flex gap-4">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-primary w-24 shrink-0">fiyat</dt>
                <dd className="text-on-surface lowercase">{training.price}</dd>
              </div>
            )}
          </dl>

          <Link
            href="/iletisim"
            className="inline-flex items-center gap-3 bg-primary text-on-primary px-8 py-4 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 lowercase w-fit"
          >
            <span className="material-symbols-outlined text-lg">mail</span>
            kayıt için iletişime geçin
          </Link>
        </div>
      </div>

      <section className="border-t border-surface-container pt-12 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tighter text-on-surface lowercase mb-6">içerik</h2>
        <RichText html={training.content} className="text-lg text-on-surface-variant leading-relaxed" />
      </section>

      {showEdit && (
        <TrainingFormModal
          training={training}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
