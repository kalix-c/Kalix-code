# Kalix Code على Termux

## ما الذي يعمل محليًا؟

يوفر هذا الدليل طريقة تشغيل **Kalix Code CLI** وواجهة الويب المحلية من جهاز Android عبر Termux. الواجهة السحابية المنشورة مستقلة عن هذه الخدمة المحلية ومتاحة عبر: <https://kalixcode-lvx9ubmm.manus.space>.

> يلزم Node.js بالإصدار `22.19.0` أو أحدث، كما يعرّفه `package.json` في جذر المستودع. لا تعتمد على حزمة npm منشورة؛ ثبّت من المصدر في هذه المرحلة التجريبية.

## تثبيت أول مرة

استخدم المُثبّت الرسمي. ينزّل Kalix Code مع واجهته المبنية مسبقًا، ويثبت Node.js وpnpm تلقائيًا، ويتجاوز نصوص البناء native غير المتوافقة مع Android. لا يحتاج الهاتف إلى بناء الواجهة؛ انتظر حتى تظهر رسالة النجاح ثم انسخ الأمر التالي فقط:

```sh
curl -fsSL https://raw.githubusercontent.com/kalix-c/Kalix-code/master/scripts/install-termux.sh -o /tmp/kalix-install.sh && sh /tmp/kalix-install.sh
```

بعد ظهور رسالة النجاح، شغّل Kalix بالأمر المختصر التالي:

```sh
kalix web --background
```

إذا لم يكتمل تنزيل المُثبّت نفسه بسبب شبكة ضعيفة، نزّل الملف أولًا ثم افحصه اختياريًا قبل تشغيله:

```sh
curl -fL --retry 8 --retry-delay 3 --retry-all-errors https://raw.githubusercontent.com/kalix-c/Kalix-code/master/scripts/install-termux.sh -o /tmp/kalix-install.sh
sed -n '1,80p' /tmp/kalix-install.sh
sh /tmp/kalix-install.sh
```

## تشغيل واجهة Kalix محليًا في الخلفية

بعد نجاح المُثبّت، يمكن تشغيل الواجهة من أي مسار في Termux:

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

أوقف عملية Kalix المحلية أولًا بالعثور على PID للعملية ثم استدعاء `kill` لهذا الـ PID. بعد ذلك، أعد تشغيل المُثبّت نفسه؛ ينزّل الإصدار الحالي ويستبدل المصدر المحلي بطريقة نظيفة:

```sh
curl -fsSL https://raw.githubusercontent.com/kalix-c/Kalix-code/master/scripts/install-termux.sh -o /tmp/kalix-install.sh && sh /tmp/kalix-install.sh
```

ثم شغّل `kalix web --background` من جديد.

لمعرفة العملية التي يجب إيقافها دون تخمين، راجع قائمة العمليات ثم اختر PID الخاص بـ Kalix:

```sh
ps -ef | grep '[a]pps/cli/src/bin.ts'
kill <PID>
```

## حدود مهمة

هذه الخدمة المحلية خاصة بهاتفك ولا تجعل واجهة Kalix متاحة للعامة. لا تضع مفاتيح API أو رموز GitHub داخل مستودع Kalix أو في سجل الأوامر. يستخدم Android `--ignore-scripts` لتجنب بناء إضافات native غير متوافقة؛ الطرفية التفاعلية ليست مدعومة في هذا الوضع، بينما تبقى واجهة الويب المحلية وخدمة Kalix الأساسية متاحة. استخدم واجهة Kalix السحابية لإدارة مزوّدي النماذج أو مستودعات GitHub بحسابات معزولة، ثم أدخل الرمز داخل مساحة العمل المحمية فقط.
