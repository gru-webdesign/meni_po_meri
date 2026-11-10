// Dodaje AdMob APPLICATION_ID u AndroidManifest (bez njega AdMob ruši aplikaciju pri pokretanju).
const fs=require('fs'),f='android/app/src/main/AndroidManifest.xml',id=process.env.ADMOB_APP_ID||'ca-app-pub-3940256099942544~3347511713';
let s=fs.readFileSync(f,'utf8');if(!s.includes('com.google.android.gms.ads.APPLICATION_ID')){s=s.replace(/(<application\b[^>]*>)/,`$1\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${id}"/>`)}
fs.writeFileSync(f,s);console.log(s.includes('APPLICATION_ID')?'AdMob meta-data OK':'NEUSPEH');if(!s.includes('APPLICATION_ID'))process.exit(1);
