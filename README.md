# Pano

Collective Bucket altında QR ile paylaşılabilir ilan panosu.

## Özellikler

- Herkese açık anasayfa: yayınlanan tüm ilanlar
- İlan oluşturma / düzenleme için `auth.collectivebucket.com` oturumu
- Şablonlar: kart, poster, minimal
- Link ekleme, vurgu rengi, emoji
- İstemci tarafında QR üretimi ve PNG indirme

## Adresler

- Canlı: `https://pano.collectivebucket.com`
- Hosting site: `cbucket-pano`
- Public ilan: `/i/{id}`

## Yerel

```bash
npm install
npm run check
npm run serve
```

## Veri

Firestore `ads` koleksiyonu. Okuma yayınlananlar için herkese açık; yazma yalnızca
ilan sahibi (`ownerUid`).
