# Kalix Code محليًا على Termux

## التشغيل المحلي الكامل

يثبّت هذا المسار **نسخة Kalix Code الكاملة محليًا**: مصدر المشروع، خادم Kalix، وواجهة الويب على هاتفك. بعد التشغيل، تكون الواجهة على `http://127.0.0.1:3080` ولا تُستخدم مساحة Kalix Cloud لتقديم الواجهة المحلية.

> يلزم اتصال ثابت بالإنترنت أثناء التنزيل فقط، و**5 GB من المساحة الحرة على الأقل** قبل البدء. إذا كانت المساحة أقل، يتوقف المثبّت قبل تنزيل الحزم بدل ترك تثبيت معطوب. لا يحتاج مسار التشغيل العادي إلى Android NDK أو CMake؛ تتجاوز عملية تثبيت Node نصوص البناء native غير المتوافقة مع Termux.

## تثبيت مرة واحدة

انسخ هذا الأمر الواحد إلى Termux. يحفظ المثبّت في مجلد المستخدم القابل للكتابة ويعيد المحاولة تلقائيًا عند انقطاع الشبكة:

```sh
mkdir -p "$HOME/.cache/kalix" && curl --fail --location --retry 8 --retry-delay 3 --retry-all-errors --connect-timeout 20 --max-time 120 https://raw.githubusercontent.com/kalix-c/Kalix-code/master/scripts/install-termux.sh -o "$HOME/.cache/kalix/install-termux.sh" && sh "$HOME/.cache/kalix/install-termux.sh"
```

## تشغيل الخادم المحلي

بعد نجاح التثبيت، شغّل:

```sh
kalix web --background
```

ثم افتح متصفح الهاتف على:

```text
http://127.0.0.1:3080
```

لعرض السجل عند الحاجة:

```sh
tail -n 100 "$HOME/.kalix/logs/web.log"
```

## التحديث

أوقف خادم Kalix أولًا، ثم أعد تنفيذ أمر التثبيت نفسه. يستبدل المصدر المحلي فقط ويحتفظ بمجلد بيانات Kalix:

```sh
ps -ef | grep '[a]pps/cli/src/bin.ts'
kill <PID>
```

## المساحة والتعافي

في حال أوقف المثبّت بسبب السعة، لا تعِد تشغيله. احذف فقط مخلفات التثبيت المؤقتة ثم حرر مساحة إضافية من هاتفك حتى تصل إلى 5 GB أو أكثر:

```sh
rm -rf "$HOME/.kalix/source" "$HOME/.cache/pnpm" "$HOME/.cache/node"
pkg clean
df -h "$HOME"
```

لا تضع مفاتيح API أو رموز GitHub في سجل Termux أو داخل مستودع Kalix.
