import DashboardLayout from "@/components/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ExternalLink, FileCode2, Folder, Github, GitBranch, KeyRound, Loader2, LockKeyhole, PencilLine, RefreshCw, Search, ShieldCheck, Unplug } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Repository = { fullName: string; name: string; description: string | null; isPrivate: boolean; htmlUrl: string; defaultBranch: string; updatedAt: string | null; language: string | null; canPush: boolean; isArchived: boolean };
type FileData = { kind: "file"; path: string; sha: string; size: number; content: string };
type DirectoryData = { kind: "directory"; path: string; entries: Array<{ type: "file" | "dir"; name: string; path: string; sha: string; size: number }> };

export default function Repositories() {
  return <DashboardLayout><RepositoriesContent /></DashboardLayout>;
}

function RepositoriesContent() {
  const utils = trpc.useUtils();
  const connection = trpc.github.connection.useQuery();
  const [connectOpen, setConnectOpen] = useState(false);
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [branch, setBranch] = useState("");
  const [path, setPath] = useState<string | undefined>();
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const repositories = trpc.github.repositories.useQuery(undefined, { enabled: Boolean(connection.data?.configured), retry: 1 });
  const parts = selectedRepo?.fullName.split("/") ?? [];
  const owner = parts[0];
  const repository = parts[1];
  const branches = trpc.github.branches.useQuery({ owner: owner ?? "", repository: repository ?? "" }, { enabled: Boolean(owner && repository && connection.data?.configured), retry: 1 });
  const content = trpc.github.content.useQuery({ owner: owner ?? "", repository: repository ?? "", path, branch }, { enabled: Boolean(owner && repository && branch && connection.data?.configured), retry: 1 });

  const connect = trpc.github.connect.useMutation({
    onSuccess: async result => {
      await utils.github.connection.invalidate();
      await utils.github.repositories.invalidate();
      setToken("");
      setConnectOpen(false);
      toast.success(`تم ربط GitHub بالحساب ${result.githubLogin}.`);
    },
    onError: error => toast.error("تعذر ربط GitHub", { description: error.message }),
  });
  const disconnect = trpc.github.disconnect.useMutation({
    onSuccess: async () => {
      await utils.github.connection.invalidate();
      utils.github.repositories.setData(undefined, undefined);
      setSelectedRepo(null); setBranch(""); setPath(undefined); setDraft("");
      toast.success("أزيل اتصال GitHub والمفتاح المشفر من حسابك.");
    },
    onError: error => toast.error("تعذر فصل GitHub", { description: error.message }),
  });
  const updateFile = trpc.github.updateFile.useMutation({
    onSuccess: async result => {
      setConfirmOpen(false);
      if (owner && repository && branch) await utils.github.content.invalidate({ owner, repository, path, branch });
      toast.success("أُنشئ commit في GitHub بنجاح.", { description: result.commitSha ? `SHA: ${result.commitSha.slice(0, 8)}` : undefined });
    },
    onError: error => toast.error("تعذر إنشاء commit", { description: error.message }),
  });

  useEffect(() => {
    if (selectedRepo) {
      setBranch(selectedRepo.defaultBranch);
      setPath(undefined);
      setDraft("");
      setMessage("");
    }
  }, [selectedRepo]);
  useEffect(() => {
    if (content.data?.kind === "file") {
      setDraft(content.data.content);
      setMessage(`تحديث ${content.data.path} عبر Kalix Code`);
    }
  }, [content.data]);

  const filteredRepositories = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    return ((repositories.data ?? []) as Repository[]).filter(repo => !normalized || `${repo.fullName} ${repo.description ?? ""} ${repo.language ?? ""}`.toLocaleLowerCase().includes(normalized));
  }, [repositories.data, search]);
  const directory = content.data?.kind === "directory" ? content.data as DirectoryData : null;
  const file = content.data?.kind === "file" ? content.data as FileData : null;

  return <div className="mx-auto max-w-7xl space-y-6" dir="rtl">
    <section className="kalix-console-hero relative overflow-hidden rounded-3xl border border-violet-200/10 bg-[linear-gradient(115deg,rgba(117,88,255,.18),rgba(9,13,22,.22))] p-6 sm:p-8">
      <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 text-sm text-violet-200"><Github className="h-4 w-4" /> مستودعاتك في مساحة واحدة</div><h1 className="text-3xl font-semibold tracking-tight text-white">مستودعات GitHub</h1><p className="mt-2 text-sm leading-6 text-slate-300">اربط رمز وصولك الشخصي المشفر داخل Kalix Code، ثم ابحث في المستودعات وافتح الملفات وأنشئ commits واضحة بعد مراجعة صريحة.</p></div>{connection.data?.configured ? <div className="flex flex-wrap gap-2"><Badge className="h-10 border-emerald-300/20 bg-emerald-300/10 px-3 text-emerald-100"><CheckCircle2 className="ml-1 h-4 w-4" />متصل: {connection.data.githubLogin ?? "GitHub"}</Badge><Button variant="outline" onClick={() => setConnectOpen(true)} className="border-white/15">تغيير الرمز</Button><Button variant="ghost" onClick={() => disconnect.mutate()} disabled={disconnect.isPending} className="text-red-200 hover:bg-red-400/10 hover:text-red-100"><Unplug className="ml-1 h-4 w-4" />فصل</Button></div> : <Button onClick={() => setConnectOpen(true)} className="h-11 rounded-xl bg-violet-400 px-5 font-semibold text-[#110d20] hover:bg-violet-300"><KeyRound className="ml-1 h-4 w-4" />ربط GitHub</Button>}</div>
    </section>

    {!connection.data?.configured ? <ConnectionEmpty onConnect={() => setConnectOpen(true)} /> : <div className="grid gap-5 xl:grid-cols-[minmax(280px,.85fr)_minmax(0,1.6fr)]">
      <section className="rounded-3xl border border-white/10 bg-white/[.025] p-4 sm:p-5"><div className="mb-4"><div className="flex items-center justify-between"><h2 className="font-semibold text-white">المستودعات</h2><Badge variant="outline" className="border-white/10 text-slate-300">{filteredRepositories.length}</Badge></div><p className="mt-1 text-xs leading-5 text-slate-400">تظهر المستودعات المتاحة فقط وفق صلاحيات رمزك.</p></div><div className="relative mb-3"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث باسم المستودع أو اللغة" className="border-white/10 bg-black/20 pr-9" /></div>{repositories.isLoading ? <SmallLoading /> : repositories.isError ? <InlineError text={repositories.error.message} retry={() => repositories.refetch()} /> : <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">{filteredRepositories.length ? filteredRepositories.map(repo => <button key={repo.fullName} onClick={() => setSelectedRepo(repo)} className={`w-full rounded-2xl border p-3 text-right transition ${selectedRepo?.fullName === repo.fullName ? "border-violet-300/50 bg-violet-400/10" : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[.035]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium text-white">{repo.name}</p><p className="mt-1 truncate text-xs text-slate-500" dir="ltr">{repo.fullName}</p></div><Badge variant="outline" className={repo.isPrivate ? "border-amber-300/20 text-amber-100" : "border-emerald-300/20 text-emerald-100"}>{repo.isPrivate ? "خاص" : "عام"}</Badge></div>{repo.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{repo.description}</p> : null}<div className="mt-3 flex gap-2 text-[11px] text-slate-500"><span>{repo.language ?? "غير مصنف"}</span><span>•</span><span>{repo.canPush ? "قابل للتعديل" : "قراءة فقط"}</span></div></button>) : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">لا توجد مستودعات مطابقة للبحث.</p>}</div>}</section>
      <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[.025] p-4 sm:p-5">{selectedRepo ? <><div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-xl font-semibold text-white">{selectedRepo.fullName}</h2><a href={selectedRepo.htmlUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white" aria-label="فتح المستودع في GitHub"><ExternalLink className="h-4 w-4" /></a></div><p className="mt-1 text-sm text-slate-400">{selectedRepo.description ?? "لا يوجد وصف لهذا المستودع."}</p></div><label className="flex min-w-44 items-center gap-2 rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-slate-300"><GitBranch className="h-4 w-4 text-violet-300" /><select value={branch} onChange={event => { setBranch(event.target.value); setPath(undefined); }} className="min-w-0 flex-1 bg-transparent outline-none">{branches.data?.map(item => <option key={item.name} value={item.name} className="bg-[#15151d]">{item.name}{item.protected ? " · محمي" : ""}</option>) ?? <option value={branch} className="bg-[#15151d]">{branch || "جارٍ تحميل الفروع"}</option>}</select></label></div>
        <div className="mt-4">{content.isLoading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-violet-300" /></div> : content.isError ? <InlineError text={content.error.message} retry={() => content.refetch()} /> : directory ? <DirectoryView directory={directory} onOpen={entry => setPath(entry.path)} onBack={directory.path ? () => setPath(directory.path.split("/").slice(0, -1).join("/") || undefined) : undefined} /> : file ? <FileEditor file={file} draft={draft} setDraft={setDraft} message={message} setMessage={setMessage} canPush={selectedRepo.canPush && !selectedRepo.isArchived} onRequestSave={() => setConfirmOpen(true)} /> : <p className="min-h-72 pt-24 text-center text-sm text-slate-500">اختر فرعًا لعرض محتوى المستودع.</p>}</div>
      </> : <RepositoryEmpty />}</section>
    </div>}

    <section className="grid gap-4 md:grid-cols-3"><SecurityCard icon={<LockKeyhole />} title="رمز مشفّر" text="لا يعود رمز GitHub إلى المتصفح بعد التحقق أو الحفظ." /><SecurityCard icon={<ShieldCheck />} title="عزل الحساب" text="كل قراءة أو كتابة تستخدم اتصال GitHub المخزن للحساب المسجل فقط." /><SecurityCard icon={<PencilLine />} title="تأكيد قبل الكتابة" text="لا تنشئ Kalix commit إلا بعد مراجعتك للملف والرسالة وتأكيدك الصريح." /></section>

    <Dialog open={connectOpen} onOpenChange={setConnectOpen}><DialogContent dir="rtl" className="border-white/10 bg-[#10121a] text-white sm:max-w-lg"><DialogHeader><DialogTitle className="text-xl">ربط GitHub</DialogTitle><DialogDescription className="leading-6">استخدم رمز وصول شخصيًا دقيق الصلاحيات. يلزم وصول <span dir="ltr">Contents: Read and write</span> لتعديل الملفات، أو <span dir="ltr">Contents: Read-only</span> للتصفح فقط.</DialogDescription></DialogHeader><form onSubmit={(event: FormEvent) => { event.preventDefault(); connect.mutate({ token }); }} className="space-y-4 pt-2"><div className="space-y-2"><Label htmlFor="github-token">رمز GitHub الشخصي</Label><Input id="github-token" type="password" dir="ltr" autoComplete="new-password" value={token} onChange={event => setToken(event.target.value)} placeholder="github_pat_…" required minLength={20} className="border-white/10 bg-white/5" /><p className="text-xs leading-5 text-slate-400">يُستخدم الرمز للتحقق من هويتك ثم يحفظ مشفّرًا على الخادم داخل حسابك فقط.</p></div><DialogFooter><Button type="submit" disabled={connect.isPending} className="w-full bg-violet-400 font-semibold text-[#110d20] hover:bg-violet-300 sm:w-auto">{connect.isPending ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جارٍ التحقق</> : "ربط آمن"}</Button></DialogFooter></form></DialogContent></Dialog>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}><AlertDialogContent dir="rtl" className="border-white/10 bg-[#10121a] text-white"><AlertDialogHeader><AlertDialogTitle>تأكيد إنشاء commit</AlertDialogTitle><AlertDialogDescription className="leading-6">سيُحدَّث الملف <span dir="ltr">{file?.path}</span> في الفرع <span dir="ltr">{branch}</span> داخل <span dir="ltr">{selectedRepo?.fullName}</span>. هذا الإجراء ينشئ commit جديدًا في GitHub ولا يمكن التراجع عنه من Kalix.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-white/10 bg-transparent hover:bg-white/10">إلغاء</AlertDialogCancel><AlertDialogAction disabled={!file || updateFile.isPending} onClick={() => file && owner && repository && updateFile.mutate({ owner, repository, path: file.path, branch, sha: file.sha, content: draft, commitMessage: message, confirmed: true })} className="bg-violet-400 text-[#110d20] hover:bg-violet-300">{updateFile.isPending ? "جارٍ الإنشاء" : "أنشئ commit"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function ConnectionEmpty({ onConnect }: { onConnect: () => void }) { return <section className="rounded-3xl border border-dashed border-white/15 bg-white/[.02] px-6 py-16 text-center"><Github className="mx-auto h-9 w-9 text-violet-300" /><h2 className="mt-4 text-lg font-semibold text-white">اربط GitHub لعرض مستودعاتك</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">لا يعتمد Kalix على جلسة متصفحك ولا يعرض رمزك بعد الحفظ. أدخل رمز وصول شخصي دقيق الصلاحيات داخل هذه المساحة المحمية.</p><Button onClick={onConnect} className="mt-6 bg-violet-400 text-[#110d20] hover:bg-violet-300"><KeyRound className="ml-1 h-4 w-4" />ربط GitHub</Button></section>; }
function RepositoryEmpty() { return <div className="flex min-h-[430px] flex-col items-center justify-center text-center"><Github className="h-9 w-9 text-violet-300" /><h2 className="mt-4 text-lg font-semibold text-white">اختر مستودعًا</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">ابحث في قائمة المستودعات واختر أحدها لتصفح فروعه وملفاته.</p></div>; }
function DirectoryView({ directory, onOpen, onBack }: { directory: DirectoryData; onOpen: (entry: DirectoryData["entries"][number]) => void; onBack?: () => void }) { return <div><div className="mb-3 flex items-center justify-between"><p className="truncate text-sm text-slate-400" dir="ltr">/{directory.path || ""}</p>{onBack ? <Button size="sm" variant="ghost" onClick={onBack} className="text-slate-300">للأعلى</Button> : null}</div><div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">{directory.entries.length ? directory.entries.map(entry => <button key={`${entry.type}-${entry.path}`} onClick={() => onOpen(entry)} className="flex w-full items-center gap-3 bg-black/10 px-4 py-3 text-right transition hover:bg-white/[.045]"><span className={entry.type === "dir" ? "text-amber-200" : "text-violet-300"}>{entry.type === "dir" ? <Folder className="h-4 w-4" /> : <FileCode2 className="h-4 w-4" />}</span><span className="min-w-0 flex-1 truncate text-sm text-slate-200" dir="ltr">{entry.name}</span><span className="text-xs text-slate-500">{entry.type === "file" ? `${Math.ceil(entry.size / 1024)} KB` : ""}</span></button>) : <p className="p-8 text-center text-sm text-slate-500">هذا المجلد فارغ.</p>}</div></div>; }
function FileEditor({ file, draft, setDraft, message, setMessage, canPush, onRequestSave }: { file: FileData; draft: string; setDraft: (value: string) => void; message: string; setMessage: (value: string) => void; canPush: boolean; onRequestSave: () => void }) { const changed = draft !== file.content; return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium text-white" dir="ltr">{file.path}</p><p className="mt-1 text-xs text-slate-500">{Math.ceil(file.size / 1024)} KB · يمكنك تعديل الملفات النصية حتى 750 KB.</p></div><Badge variant="outline" className={changed ? "border-amber-300/20 text-amber-100" : "border-white/10 text-slate-400"}>{changed ? "تغييرات غير محفوظة" : "لا تغييرات"}</Badge></div><Textarea dir="ltr" value={draft} onChange={event => setDraft(event.target.value)} spellCheck={false} className="min-h-[320px] resize-y border-white/10 bg-[#090a10] font-mono text-xs leading-6 text-slate-200" /><div className="flex flex-col gap-2 sm:flex-row"><Input value={message} onChange={event => setMessage(event.target.value)} maxLength={160} placeholder="رسالة commit واضحة" className="border-white/10 bg-black/20" /><Button onClick={onRequestSave} disabled={!changed || !message.trim() || !canPush} className="shrink-0 bg-violet-400 text-[#110d20] hover:bg-violet-300">إنشاء commit</Button></div>{!canPush ? <p className="text-xs text-amber-200">ليس لرمزك إذن كتابة لهذا المستودع، أو أن المستودع مؤرشف.</p> : null}</div>; }
function SecurityCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="mb-3 text-emerald-300">{icon}</div><h3 className="font-medium text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div>; }
function SmallLoading() { return <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-violet-300" /></div>; }
function InlineError({ text, retry }: { text: string; retry: () => void }) { return <div className="rounded-2xl border border-red-300/15 bg-red-300/[.04] p-5 text-center"><p className="text-sm text-red-100">{text}</p><Button variant="outline" onClick={retry} className="mt-3 border-white/10">حاول مجددًا</Button></div>; }
