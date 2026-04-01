import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CustomRequestForm } from "@/components/forms/custom-request-form";

export default function OzelIstekPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="ozel-istek" />

      <main className="flex-1 pt-48 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <header className="mb-20">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface lowercase mb-6 leading-none">
            özelleştirilmiş{" "}
            <span style={{ color: "#085F7F" }}>resim</span> isteği
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg lowercase">
            mekanınıza ruh katacak, sadece size özel üretilecek bir eser için kürasyon sürecini başlatın. zeynep kömür&apos;ün fırçasından modern bir hikaye.
          </p>
        </header>

        {/* Two-column form + info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-surface-container-highest shadow-sm">
          {/* Form side */}
          <section className="lg:col-span-7 bg-white p-8 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 -mr-16 -mt-16 rotate-45" style={{ backgroundColor: "#FFD54F" }} />
            <CustomRequestForm />
          </section>

          {/* Visual side */}
          <section className="lg:col-span-5 bg-white flex flex-col">
            <div className="aspect-square w-full relative group overflow-hidden">
              <img
                alt="modern sanat illüstrasyonu"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                src="/images/custom-request-art.jpg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e8e6ff'/%3E%3Crect x='50' y='50' width='300' height='300' fill='%23004be3' opacity='0.2'/%3E%3C/svg%3E";
                }}
              />
              <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{ backgroundColor: "#085F7F" }} />
            </div>

            <div className="p-12 space-y-8 bg-surface-container flex-grow">
              {/* Feature: Renk kürasyonu */}
              <div className="flex gap-4 items-start">
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#085F7F" }}
                >
                  <span className="material-symbols-outlined text-white text-sm">palette</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface lowercase mb-1 text-sm">
                    renk kürasyonu
                  </h3>
                  <p className="text-xs text-on-surface-variant lowercase">
                    mekanınızın ışık ve dokusuna uygun özel pigment seçimi.
                  </p>
                </div>
              </div>

              {/* Feature: Boyut ve oran */}
              <div className="flex gap-4 items-start">
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#FFD54F" }}
                >
                  <span className="material-symbols-outlined text-on-secondary-container text-sm">
                    aspect_ratio
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface lowercase mb-1 text-sm">
                    boyut ve oran
                  </h3>
                  <p className="text-xs text-on-surface-variant lowercase">
                    duvar ölçülerinize altın oran ile uyumlu özel kanvas üretimi.
                  </p>
                </div>
              </div>

              {/* Feature: İmzalı hikaye */}
              <div className="flex gap-4 items-start">
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#F4A261" }}
                >
                  <span className="material-symbols-outlined text-white text-sm">history_edu</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface lowercase mb-1 text-sm">
                    imzalı hikaye
                  </h3>
                  <p className="text-xs text-on-surface-variant lowercase">
                    her eser, sürecin hikayesini anlatan ıslak imzalı sertifika ile gelir.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer variant="white" />
    </div>
  );
}
