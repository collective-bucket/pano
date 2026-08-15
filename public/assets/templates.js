(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Kart bir <a> içine sarıldığında linkler <a> olarak render edilemez;
  // iç içe anchor geçersiz HTML olduğu için tarayıcı kartı bölüp bozuk
  // kutular çiziyor. Bu durumda linkler tıklanmayan etiket olarak gösterilir.
  function renderLinks(links, asText) {
    if (!links || !links.length) return "";
    return (
      '<ul class="ad-links">' +
      links
        .map(function (link) {
          var label = escapeHtml(link.label || link.url);
          if (asText) {
            return '<li><span class="ad-link-chip">' + label + "</span></li>";
          }
          return (
            '<li><a class="ad-link-chip" href="' +
            escapeHtml(link.url) +
            '" target="_blank" rel="noopener">' +
            label +
            "</a></li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  // qr.js bir ES modülü olduğu için klasik sayfa scriptlerinden sonra
  // çalışabilir; hazır olana kadar bekle.
  async function waitForQr() {
    var deadline = Date.now() + 10000;
    while (!window.PanoQR) {
      if (Date.now() > deadline) {
        throw new Error("QR aracı yüklenemedi.");
      }
      await new Promise(function (resolve) {
        setTimeout(resolve, 50);
      });
    }
    return window.PanoQR;
  }

  async function qrDataUrl(text, size) {
    var lib = await waitForQr();
    return lib.toDataUrl(text, size);
  }

  // Kartlardaki QR kutuları önce boş render edilir, görsel sonradan
  // yerleştirilir; böylece liste beklemeden ekrana gelir.
  async function hydrateQrCodes(root) {
    var slots = Array.from(
      (root || document).querySelectorAll(".postit-qr[data-qr-url]")
    );
    if (!slots.length) return;

    var lib;
    try {
      lib = await waitForQr();
    } catch {
      slots.forEach(function (slot) {
        slot.remove();
      });
      return;
    }

    await Promise.all(
      slots.map(async function (slot) {
        try {
          var src = await lib.toDataUrl(slot.getAttribute("data-qr-url"), 240);
          var img = document.createElement("img");
          img.src = src;
          img.alt = "";
          slot.appendChild(img);
        } catch {
          slot.remove();
        }
      })
    );
  }

  function renderAd(ad, options) {
    options = options || {};
    var colors = ["yellow", "mint", "pink", "blue", "lilac"];
    var noteColor =
      colors.indexOf(ad.noteColor) >= 0 ? ad.noteColor : "yellow";
    var compact = options.compact;
    var href = options.href;
    var qrUrl =
      compact && ad.id && window.PanoAds ? window.PanoAds.publicUrl(ad.id) : "";

    var inner =
      '<div class="ad-shell postit postit-' +
      noteColor +
      (qrUrl ? " has-qr" : "") +
      '">' +
      "<h" +
      (compact ? "3" : "1") +
      ' class="ad-title">' +
      escapeHtml(ad.title || "İsimsiz ilan") +
      "</h" +
      (compact ? "3" : "1") +
      ">" +
      (ad.body
        ? '<p class="ad-body">' + escapeHtml(ad.body) + "</p>"
        : "") +
      renderLinks(ad.links, Boolean(href)) +
      (qrUrl
        ? '<span class="postit-qr" data-qr-url="' + escapeHtml(qrUrl) + '"></span>'
        : "") +
      "</div>";

    if (href) {
      return (
        '<a class="ad-card-link" href="' +
        escapeHtml(href) +
        '">' +
        inner +
        "</a>"
      );
    }
    return inner;
  }

  window.PanoTemplates = {
    renderAd: renderAd,
    escapeHtml: escapeHtml,
    qrDataUrl: qrDataUrl,
    hydrateQrCodes: hydrateQrCodes
  };
})();
