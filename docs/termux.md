# Kalix Code على Termux

## ما الذي يعمل محليًا؟

يوفر هذا الدليل طريقة تشغيل **Kalix Code CLI** وواجهة الويب المحلية من جهاز Android عبر Termux. الواجهة السحابية المنشورة مستقلة عن هذه الخدمة المحلية ومتاحة عبر: <https://kalixcode-lvx9ubmm.manus.space>.

> يلزم Node.js بالإصدار `22.19.0` أو أحدث، كما يعرّفه `package.json` في جذر المستودع. لا تعتمد على حزمة npm منشورة؛ ثبّت من المصدر في هذه المرحلة التجريبية.

## تثبيت أول مرة

افتح Termux ثم شغّل الأوامر التالية بالترتيب:

```sh
pkg update -y && pkg upgrade -y
pkg install -y git nodejs-lts curl unzip

command -v git node corepack
node --version
git --version
corepack --version

git config --global http.version HTTP/1.1
rm -rf "$HOME/Kalix-code"
git clone --depth 1 --single-branch https://github.com/kalix-c/Kalix-code.git "$HOME/Kalix-code"
cd "$HOME/Kalix-code"
corepack enable
corepack install
pnpm install --frozen-lockfile --no-optional
```

إذا كانت نسخة Node أقل من `22.19.0` بعد تثبيت `nodejs-lts`، حدّث حزم Termux أولًا ثم أعد فحص النسخة قبل المتابعة.

## بديل تنزيل عند انقطاع Git

إذا ظهر خطأ مثل `RPC failed` أو `early EOF` أثناء `git clone`، لا تتابع الأوامر التالية؛ فمجلد Kalix لم يُنزّل بعد. استخدم هذا البديل لتنزيل لقطة المصدر الحالية مع محاولات إعادة تلقائية، ثم أكمل من سطر `cd`:

```sh
rm -rf "$HOME/Kalix-code" "$HOME/Kalix-code-master" /tmp/kalix-code.zip
curl -fL --retry 8 --retry-delay 3 --retry-all-errors --connect-timeout 20 --max-time 600 \
  https://github.com/kalix-c/Kalix-code/archive/refs/heads/master.zip \
  -o /tmp/kalix-code.zip
unzip -q /tmp/kalix-code.zip -d "$HOME"
mv "$HOME/Kalix-code-master" "$HOME/Kalix-code"
cd "$HOME/Kalix-code"
corepack enable
corepack install
pnpm install --frozen-lockfile --no-optional
```

تحقق من نجاح التنزيل قبل التثبيت عبر الأمر التالي؛ يجب أن يعرض `package.json`:

```sh
test -f "$HOME/Kalix-code/package.json" && echo "Kalix Code downloaded successfully"
```

## تشغيل واجهة Kalix محليًا في الخلفية

شغّل الأمر التالي من جذر مستودع Kalix Code:

```sh
pnpm kalix web --background
```

افتح المتصفح على هاتفك ثم انتقل إلى:

```text
http://127.0.0.1:3080
```

لا يفتح وضع الخلفية متصفحًا تلقائيًا. ويكتب السجل في:

```sh
tail -n 100 ~/.kalix/logs/web.log
```

يمكن تغيير مسار البيانات والسجل قبل التشغيل بتحديد `KALIX_HOME`:

```sh
export KALIX_HOME="$HOME/.kalix"
pnpm kalix web --background
```

## تحديث النسخة المحلية

أوقف عملية Kalix المحلية أولًا بالعثور على PID للعملية ثم استدعاء `kill` لهذا الـ PID. بعد ذلك، من جذر المستودع، نفّذ:

```sh
git pull --ff-only
corepack install
pnpm install --frozen-lockfile --no-optional
pnpm kalix web --background
```

لمعرفة العملية التي يجب إيقافها دون تخمين، راجع قائمة العمليات ثم اختر PID الخاص بـ Kalix:

```sh
ps -ef | grep '[a]pps/cli/src/bin.ts'
kill <PID>
```

## حدود مهمة

هذه الخدمة المحلية خاصة بهاتفك ولا تجعل واجهة Kalix متاحة للعامة. لا تضع مفاتيح API أو رموز GitHub داخل مستودع Kalix أو في سجل الأوامر. تستخدم أوامر Android `--no-optional` لتجاوز `node-pty`، ولذلك لا تتوفر الطرفية التفاعلية في Termux؛ واجهة الويب المحلية وخدمة Kalix الأساسية لا تحتاج إليها. استخدم واجهة Kalix السحابية لإدارة مزوّدي النماذج أو مستودعات GitHub بحسابات معزولة، ثم أدخل الرمز داخل مساحة العمل المحمية فقط.
