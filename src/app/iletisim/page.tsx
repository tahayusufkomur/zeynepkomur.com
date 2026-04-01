import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ContactForm } from "@/components/forms/contact-form";
import { QuestionForm } from "@/components/forms/question-form";

export default function IletisimPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar currentPage="iletisim" />

      <main className="flex-1 pt-48 pb-24 px-8 md:px-16 max-w-[1440px] mx-auto w-full">
        {/* Hero headline */}
        <div className="mb-24 text-center lg:text-left">
          <h1 className="text-8xl md:text-[10rem] font-extrabold tracking-tighter text-on-surface lowercase leading-none">
            arada <span className="text-primary italic">bağ</span> kuralım
          </h1>
        </div>

        {/* Section 1: Beraber çalışalım */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <h2 className="text-7xl md:text-[9rem] font-extrabold tracking-tighter text-on-surface lowercase leading-[0.85] mb-8">
                beraber <span className="text-primary">çalışalım.</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pt-8">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* Pink divider */}
        <div className="w-32 h-2 bg-tertiary mb-48 opacity-60" />

        {/* Section 2: Bana her şeyi sorabilirsin */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-5 order-2 lg:order-1 lg:pb-8">
              <QuestionForm />
            </div>
            <div className="lg:col-span-7 order-1 lg:order-2 text-right">
              <h2 className="text-7xl md:text-[9rem] font-extrabold tracking-tighter text-on-surface lowercase leading-[0.85] mb-8">
                bana{" "}
                <span style={{ color: "#FFD700" }}>her şeyi</span>{" "}
                sorabilirsin.
              </h2>
            </div>
          </div>
        </section>

        {/* Studio info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-24 mb-32">
          <div className="border-t border-outline-variant pt-8">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              stüdyo
            </p>
            <p className="text-2xl text-on-surface lowercase leading-tight">
              moda, kadıköy
              <br />
              istanbul, türkiye
            </p>
          </div>
          <div className="border-t border-outline-variant pt-8">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              mesai
            </p>
            <p className="text-2xl text-on-surface lowercase leading-tight">
              pazartesi - cumartesi
              <br />
              10:00 - 19:00
            </p>
          </div>
          <div className="border-t border-outline-variant pt-8">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              dijital
            </p>
            <p className="text-2xl text-on-surface lowercase leading-tight">
              merhaba@arada.art
              <br />
              @arada.art
            </p>
          </div>
        </div>
      </main>

      <Footer variant="white" />
    </div>
  );
}
