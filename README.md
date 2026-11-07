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

- Prikazi: trend kilaže bez skokova vode sa očekivanim napretkom, kalendar doslednosti i niz dobrih dana, uvidi iz dnevnika, kalorije i makroi po danu, prekretnice, nedeljni izveštaj
- UX: poništavanje u poruci, prevlačenje obroka (udesno upis, ulevo zamena), režim kuvanja sa tajmerom, omiljena jela i jela koja se ne nude, jutarnji check-in, deljenje spiska, vibracija
- Svetla i tamna tema, prilagođavanje uvećanom sistemskom fontu, zaštita od duplog dodira

- Igra: biljka koja raste kroz 10 nivoa, listići za svaku dobru naviku, 3 dnevna izazova, pitanje dana, štit koji čuva niz, kolekcija probanih jela, konfete i večernji podsetnik za niz
- Sekcije: Napredak (Kilaža, Navike, Ishrana, Nagrade), Jelovnik (Plan, Kuvar sa filterima i pretragom), Trening (Danas, Nedelja, Saveti), Profil u tabovima

## Kako dobiti APK

Svaki push na `main` pokreće GitHub Actions (`.github/workflows/android.yml`), koji napravi APK i objavi ga u **Releases**.

1. Otvori **Releases** na GitHub-u i skini `meni-po-meri.apk` iz poslednje verzije.
2. Na telefonu otvori fajl i dozvoli instalaciju iz tog izvora kad Android pita.
3. Nova verzija se instalira preko stare i podaci ostaju, jer je ključ za potpis stalan (`keystore/debug.keystore`).

## Google Play (AAB)

Workflow pravi i `meni-po-meri.aab` kad u repou postoje tajne (Settings → Secrets and variables → Actions):
`UPLOAD_KEYSTORE_BASE64`, `UPLOAD_STORE_PASSWORD`, `UPLOAD_KEY_ALIAS`, `UPLOAD_KEY_PASSWORD`. Ključ za potpis se nikad ne stavlja u repo.

## Izmene

Aplikacija je u `www/`: `data.js` (namirnice, obroci), `kb.js` (savetnik), `app.js` (logika i ekrani), `v4.js` (prikazi, UX), `v5.js` (igra, sekcije, Danas, start).

Lokalno, uz instaliran Android Studio:

```
npm ci
npm run android:prepare
npx cap open android
```

## Podaci

Upisi se čuvaju na telefonu (i u Android rezervnoj kopiji). Za prelazak na drugi telefon: Profil → Podešavanja → Sačuvaj u fajl, pa Učitaj iz fajla.
