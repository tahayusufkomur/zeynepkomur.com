import { db } from "./index";
import { pageContent } from "./schema";

const defaults = [
  { pageSlug: "home", sectionKey: "hero_title", content: "Sınırsız Sanat" },
  { pageSlug: "home", sectionKey: "hero_subtitle", content: "modernizmin sınırlarını zorlayan, renk ve formun dansı." },
  { pageSlug: "home", sectionKey: "new_arrivals_title", content: "yeni gelenler" },
  { pageSlug: "home", sectionKey: "new_arrivals_description", content: "son eklenen eserler ve koleksiyonlar. zeynep kömür seçkisiyle modern sanatın taze soluğu." },
  { pageSlug: "home", sectionKey: "quote_text", content: "Her çocuk bir sanatçıdır. Sorun, büyüdüğümüzde sanatçı kalmayı nasıl başaracağımızdır." },
  { pageSlug: "home", sectionKey: "quote_attribution", content: "Pablo Picasso" },
  { pageSlug: "about", sectionKey: "bio_main", content: "ZEYN'in hikayesi, sanatı sadece seyredilen bir nesne değil, yaşanan bir mekan haline getirme arzusuyla başladı. İstanbul merkezli multidisipliner sanatçı Zeynep Kömür, modern brutalizm ile geleneksel dokuları harmanlayarak dijital kürasyonun sınırlarını yeniden tanımlıyor." },
  { pageSlug: "about", sectionKey: "bio_secondary", content: "Mimar Sinan Güzel Sanatlar Üniversitesi mezunu olan Kömür, on yılı aşkın süredir hem yerel hem de uluslararası sergilerde eserlerini sergilemekte ve küratörlük yapmaktadır." },
  { pageSlug: "contact", sectionKey: "headline", content: "arada bağ kuralım" },
  { pageSlug: "contact", sectionKey: "studio_address", content: "moda, kadıköy, istanbul, türkiye" },
  { pageSlug: "contact", sectionKey: "studio_hours", content: "pazartesi - cumartesi, 10:00 - 19:00" },
  { pageSlug: "contact", sectionKey: "studio_email", content: "merhaba@zeyn.art" },
  { pageSlug: "contact", sectionKey: "studio_social", content: "@zeyn.art" },
  { pageSlug: "ozel-istek", sectionKey: "headline", content: "özelleştirilmiş resim isteği" },
  { pageSlug: "ozel-istek", sectionKey: "description", content: "mekanınıza ruh katacak, sadece size özel üretilecek bir eser için kürasyon sürecini başlatın." },
  { pageSlug: "footer", sectionKey: "tagline", content: "sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı." },
];

export async function seedPageContent() {
  for (const item of defaults) {
    await db.insert(pageContent).values(item).onConflictDoNothing();
  }
  console.log("[seed] Page content seeded");
}
