// qrcode paketi artık hazır tarayıcı bundle'ı yayınlamıyor; jsDelivr'ın
// otomatik ESM çıktısı bu yüzden modül olarak yüklenir ve klasik scriptlerin
// kullanabilmesi için window'a bağlanır.
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";

const BASE_OPTIONS = {
  margin: 1,
  errorCorrectionLevel: "M",
  color: { dark: "#191c1a", light: "#ffffff" }
};

window.PanoQR = {
  toDataUrl: function (text, size) {
    return QRCode.toDataURL(
      text,
      Object.assign({ width: size || 512 }, BASE_OPTIONS)
    );
  }
};
