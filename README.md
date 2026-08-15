# Pano

Collective Bucket altında QR ile paylaşılabilir ilan panosu.

## Özellikler

- Herkese açık anasayfa: yayınlanan tüm ilanlar
- İlan oluşturma / düzenleme için `auth.collectivebucket.com` oturumu
- Post-it kartları ve beş renk seçeneği
- İlan başına birden fazla link
- Liste kartlarının sol alt köşesinde ilanın QR kodu
- İstemci tarafında QR üretimi ve PNG indirme (`assets/qr.js`, jsDelivr ESM)
- İlanlarım kartlarında görüntüleme, düzenleme, QR indirme ve silme menüsü

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
