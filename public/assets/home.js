(function () {
  "use strict";

  var listEl = document.querySelector("#ad-list");
  var statusEl = document.querySelector("#home-status");

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  async function load() {
    setStatus("İlanlar yükleniyor…");
    try {
      var ads = await window.PanoAds.listPublished();
      if (!ads.length) {
        listEl.innerHTML =
          '<p class="empty">Henüz yayında ilan yok. İlk ilanı sen oluştur.</p>';
        setStatus("");
        return;
      }

      listEl.innerHTML = ads
        .map(function (ad) {
          return (
            '<article class="ad-grid-item">' +
            window.PanoTemplates.renderAd(ad, {
              compact: true,
              href: "/i/" + encodeURIComponent(ad.id)
            }) +
            "</article>"
          );
        })
        .join("");
      setStatus(ads.length + " ilan");
    } catch (error) {
      listEl.innerHTML =
        '<p class="empty error">İlanlar yüklenemedi: ' +
        window.PanoTemplates.escapeHtml(error.message) +
        "</p>";
      setStatus("");
    }
  }

  load();
})();
