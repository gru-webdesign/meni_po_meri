# Meni po meri

Lični plan ishrane i praćenje, kao Android aplikacija.

- Profil korisnika (čarobnjak pri prvom pokretanju) iz kog se računa sve: kalorije, makroi, voda, hod, trening
- Adaptivni jelovnik: biblioteka od 78 obroka sa oznakama (gluten, laktoza, riba, meso...), nedeljna rotacija, porcije skalirane na dnevni cilj, zamena jela jednim dodirom
- Nedeljna provera tempa: ako kilaža stoji uz doslednost, -100 kcal; ako ide prebrzo, +100 kcal; usporavanje na zadnjih 5 kg i prelaz na održavanje
- Tracker: obroci (ceo ili pola), hrana van plana, voda, gazirano, hod, trening, san i energija, kilaža, obim struka, kalorije za 7 dana
- Trening iz profila: hod koji raste po nedeljama, vežbe za leđa ili snagu po izabranim danima
- Savetnik bez interneta: 75 tema, kalorije za 209 jela i pića, razume padeže, greške u kucanju i nastavak razgovora; odgovara iz tvog plana i dnevnika (šta je za koji obrok, zamene, preostale kalorije, nedeljni pregled, šta da napravim od onoga što imam)
- Pitanja na koja savetnik ne zna odgovor beleže se u profilu, da bi se baza dopunjavala
- Spisak za kupovinu, podsetnici, rezervna kopija

## Kako dobiti APK

Svaki push na `main` pokreće GitHub Actions (`.github/workflows/android.yml`), koji napravi APK i objavi ga u **Releases**.

1. Otvori **Releases** na GitHub-u i skini `meni-po-meri.apk` iz poslednje verzije.
2. Na telefonu otvori fajl i dozvoli instalaciju iz tog izvora kad Android pita.
3. Nova verzija se instalira preko stare i podaci ostaju, jer je ključ za potpis stalan (`keystore/debug.keystore`).

## Izmene

Cela aplikacija je u `www/index.html`. Jelovnik i namirnice su na vrhu skripte (`MENU`, `F`, `N`).

Lokalno, uz instaliran Android Studio:

```
npm ci
npm run android:prepare
npx cap open android
```

## Podaci

Svi upisi se čuvaju samo na telefonu. Pre brisanja aplikacije ili promene telefona: Napredak → Podešavanja → Kopiraj podatke.
