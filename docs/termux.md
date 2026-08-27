# Kalix Code على Termux

## المسار الموصى به للهاتف

هذا المثبّت الخفيف لا ينزّل مساحة عمل Kalix التطويرية أو مئات حزم JavaScript إلى الهاتف. بدلًا من ذلك، يضيف أمر `kalix` رسميًا لفتح مساحة **Kalix Code Cloud** المحمية والمتجاوبة مع الهاتف على الرابط التالي: <https://kalixcode-lvx9ubmm.manus.space>.

> تحتاج إلى اتصال بالإنترنت لأن مساحة Kalix تعمل عبر HTTPS. تظل مفاتيح مزوّدي النماذج ورموز GitHub ضمن حسابك في مساحة العمل المحمية، ولا تُحفظ في Termux.

## تثبيت مرة واحدة

انسخ هذا الأمر فقط. يحفظ الملف داخل مجلد Termux القابل للكتابة ويعيد المحاولة تلقائيًا عند ضعف الشبكة:

```sh
mkdir -p "$HOME/.cache/kalix" && curl --fail --location --retry 8 --retry-delay 3 --retry-all-errors --connect-timeout 20 --max-time 120 https://raw.githubusercontent.com/kalix-c/Kalix-code/master/scripts/install-termux.sh -o "$HOME/.cache/kalix/install-termux.sh" && sh "$HOME/.cache/kalix/install-termux.sh"
```

## الفتح

بعد ظهور رسالة النجاح شغّل:

```sh
kalix web
```

يفتح الأمر الموقع في متصفح الهاتف إذا كانت أداة `termux-open-url` متاحة؛ وإلا يطبع الرابط لتفتحه يدويًا. لعرض الرابط فقط استخدم:

```sh
kalix url
```

## التحديث

أعد تنفيذ أمر التثبيت نفسه. سيستبدل المشغّل الخفيف فقط ولا يحمّل حزمًا كبيرة.

## الوضع المحلي الكامل

تشغيل خادم Kalix كاملًا من المصدر داخل Termux غير موصى به حاليًا: يعتمد على مئات الحزم وبعض إضافات Node الأصلية، وقد يتجاوز مساحة الهاتف أو مهلة الشبكة. يستخدم `kalix web` على Android مساحة Kalix السحابية بدلاً من إنشاء خادم محلي على `127.0.0.1`.
