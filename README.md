# Meni po meri

Lični plan ishrane i praćenje, kao Android aplikacija.

- Jelovnik za 7 dana u domaćim merama (šaka, dlan, kašika, šolja), sa kalorijama i makroima za svaki obrok
- Praćenje obroka, vode, Coca-Cole i hodanja
- Kretanje prilagođeno diskus herniji
- Grafikon kilaže, spisak za kupovinu, podsetnici
- „Pitaj Claude” otvara Claude aplikaciju sa celim kontekstom plana

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
