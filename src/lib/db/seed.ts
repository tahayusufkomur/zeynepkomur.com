import { db } from "./index";
import { pageContent } from "./schema";

const defaults = [
  // Home
  { pageSlug: "home", sectionKey: "hero_title", content: "Sınırsız Sanat" },
  { pageSlug: "home", sectionKey: "hero_subtitle", content: "modernizmin sınırlarını zorlayan, renk ve formun dansı." },
  { pageSlug: "home", sectionKey: "new_arrivals_title", content: "yeni gelenler" },
  { pageSlug: "home", sectionKey: "new_arrivals_description", content: "son eklenen eserler ve koleksiyonlar. zeynep kömür seçkisiyle modern sanatın taze soluğu." },
  { pageSlug: "home", sectionKey: "quote_text", content: "Her çocuk bir sanatçıdır. Sorun, büyüdüğümüzde sanatçı kalmayı nasıl başaracağımızdır." },
  { pageSlug: "home", sectionKey: "quote_attribution", content: "Pablo Picasso" },
  // Hakkinda (FIXED: was "about" with wrong keys)
  { pageSlug: "hakkinda", sectionKey: "bio_1", content: "ZEYN'in hikayesi, sanatı sadece seyredilen bir nesne değil, yaşanan bir mekan haline getirme arzusuyla başladı. İstanbul merkezli multidisipliner sanatçı Zeynep Kömür, modern brutalizm ile geleneksel dokuları harmanlayarak dijital kürasyonun sınırlarını yeniden tanımlıyor." },
  { pageSlug: "hakkinda", sectionKey: "bio_2", content: "Mimar Sinan Güzel Sanatlar Üniversitesi mezunu olan Kömür, on yılı aşkın süredir hem yerel hem de uluslararası sergilerde eserlerini sergilemekte ve küratörlük yapmaktadır." },
  { pageSlug: "hakkinda", sectionKey: "skill_1", content: "dijital sanat" },
  { pageSlug: "hakkinda", sectionKey: "skill_2", content: "kürasyon" },
  { pageSlug: "hakkinda", sectionKey: "skill_3", content: "fotoğrafçılık" },
  { pageSlug: "hakkinda", sectionKey: "identity_label", content: "kurucu & küratör" },
  { pageSlug: "hakkinda", sectionKey: "portrait_image", content: "/uploads/pages/portrait.webp" },
  // Contact
  { pageSlug: "contact", sectionKey: "headline", content: "arada bağ kuralım" },
  { pageSlug: "contact", sectionKey: "section_1_title", content: "beraber çalışalım." },
  { pageSlug: "contact", sectionKey: "section_2_title", content: "bana her şeyi sorabilirsin." },
  { pageSlug: "contact", sectionKey: "studio_address", content: "moda, kadıköy, istanbul, türkiye" },
  { pageSlug: "contact", sectionKey: "studio_hours", content: "pazartesi - cumartesi, 10:00 - 19:00" },
  { pageSlug: "contact", sectionKey: "studio_email", content: "merhaba@zeyn.art" },
  { pageSlug: "contact", sectionKey: "studio_social", content: "@zeyn.art" },
  // Galeri
  { pageSlug: "galeri", sectionKey: "quote_text", content: "sanat, görünmeyeni görünür kılmaktır. her fırça darbesi, bir hikayenin başlangıcıdır." },
  { pageSlug: "galeri", sectionKey: "quote_attribution", content: "zeynep kömür" },
  // Ozel-istek
  { pageSlug: "ozel-istek", sectionKey: "headline", content: "özelleştirilmiş resim isteği" },
  { pageSlug: "ozel-istek", sectionKey: "description", content: "mekanınıza ruh katacak, sadece size özel üretilecek bir eser için kürasyon sürecini başlatın." },
  { pageSlug: "ozel-istek", sectionKey: "feature_1_title", content: "renk kürasyonu" },
  { pageSlug: "ozel-istek", sectionKey: "feature_1_desc", content: "mekanınızın ışık ve dokusuna uygun özel pigment seçimi." },
  { pageSlug: "ozel-istek", sectionKey: "feature_2_title", content: "boyut ve oran" },
  { pageSlug: "ozel-istek", sectionKey: "feature_2_desc", content: "duvar ölçülerinize altın oran ile uyumlu özel kanvas üretimi." },
  { pageSlug: "ozel-istek", sectionKey: "feature_3_title", content: "imzalı hikaye" },
  { pageSlug: "ozel-istek", sectionKey: "feature_3_desc", content: "her eser, sürecin hikayesini anlatan ıslak imzalı sertifika ile gelir." },
  { pageSlug: "ozel-istek", sectionKey: "art_image", content: "/images/custom-request-art.jpg" },
  // Footer
  { pageSlug: "footer", sectionKey: "tagline", content: "sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı." },
  { pageSlug: "footer", sectionKey: "email", content: "info@zeyn.art" },
  { pageSlug: "footer", sectionKey: "phone_label", content: "telefon" },
  { pageSlug: "footer", sectionKey: "email_label", content: "e-posta" },
  { pageSlug: "footer", sectionKey: "instagram_label", content: "instagram" },
];

export async function seedPageContent() {
  for (const item of defaults) {
    await db.insert(pageContent).values(item).onConflictDoNothing();
  }
  console.log("[seed] Page content seeded");
}
