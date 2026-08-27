import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Braces, ChevronLeft, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const enterWorkspace = () => isAuthenticated ? setLocation("/workspace") : startLogin();

  return (
    <div className="min-h-screen overflow-hidden bg-[#08090c] text-white" dir="rtl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(123,97,255,.20),transparent_28%),radial-gradient(circle_at_18%_60%,rgba(89,207,172,.10),transparent_25%)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <img src="/kalix-code-wordmark.png" alt="Kalix Code" className="h-9 w-auto rounded bg-white px-2 py-1 object-contain" />
        <Button onClick={enterWorkspace} variant="ghost" className="text-slate-200 hover:bg-white/10 hover:text-white">
          {loading ? "جارٍ التحقق" : isAuthenticated ? "مساحة العمل" : "تسجيل الدخول"}
          <ChevronLeft className="mr-1 h-4 w-4" />
        </Button>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.12fr_.88fr] lg:px-8 lg:pb-28 lg:pt-20">
        <section className="max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-sm text-violet-100">
            <Sparkles className="h-4 w-4" /> مساحة عمل النماذج الخاصة بك
          </div>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-[-.055em] text-white sm:text-6xl lg:text-7xl">
            استدل، ابنِ، ووجّه نماذجك من <span className="text-violet-300">مكانٍ واحد.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Kalix Code هو فضاء عملي هادئ لإدارة مزوّدات النماذج المخصصة، واكتشاف نماذجها، والبدء في العمل بثقة.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={enterWorkspace} className="h-12 rounded-xl bg-violet-400 px-6 text-base font-semibold text-[#120d22] hover:bg-violet-300">
              {isAuthenticated ? "افتح مساحة العمل" : "ابدأ بأمان"}<ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
            <a href="https://github.com/kalix-c/Kalix-code" target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-medium text-white transition hover:bg-white/10">استكشف المشروع</a>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <Feature icon={<ShieldCheck />} title="ضمن حسابك" text="إعداداتك ومزوّداتك معزولة عن كل مستخدم آخر." />
            <Feature icon={<KeyRound />} title="مفاتيح غير مكشوفة" text="يُحفظ المفتاح مشفّرًا على الخادم ولا يعود إلى المتصفح." />
            <Feature icon={<Braces />} title="اكتشاف تلقائي" text="يجلب Kalix قائمة النماذج أو يتيح لك إدخالها يدويًا." />
          </div>
        </section>
        <section className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-5 rounded-[2rem] bg-violet-500/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.055] p-5 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div><p className="text-sm text-slate-400">Kalix Workspace</p><p className="mt-1 font-medium">مزوّداتك الخاصة</p></div>
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs text-emerald-200">محمي</span>
            </div>
            <div className="mt-6 space-y-3">
              <ProviderPreview name="OpenAI-compatible" models="12 نموذجًا مكتشفًا" accent="bg-violet-300" />
              <ProviderPreview name="Inference lab" models="أضف مفتاح API للربط" accent="bg-teal-300" muted />
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-white/15 p-4 text-sm text-slate-300">
              <img src="/kalix-code-mascot.png" alt="Kalix mascot" className="h-11 w-11 rounded-xl bg-white object-cover" />
              <span>أدخل الاسم وBase URL وAPI key، ثم دع Kalix يبحث عن النماذج.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="mb-3 text-violet-300">{icon}</div><h2 className="font-medium text-white">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div>;
}

function ProviderPreview({ name, models, accent, muted = false }: { name: string; models: string; accent: string; muted?: boolean }) {
  return <div className={`flex items-center gap-3 rounded-2xl border border-white/10 p-4 ${muted ? "bg-white/[.025]" : "bg-white/[.08]"}`}><span className={`h-2.5 w-2.5 rounded-full ${accent}`} /><div className="min-w-0"><p className="truncate text-sm font-medium">{name}</p><p className="mt-1 text-xs text-slate-400">{models}</p></div></div>;
}
