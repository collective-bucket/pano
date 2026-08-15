(function () {
  "use strict";

  var listEl = document.querySelector("#mine-list");
  var statusEl = document.querySelector("#mine-status");

  function setStatus(text) {
    statusEl.textContent = text || "";
  }

  async function load() {
    var session;
    try {
      session = await window.PanoAds.requireSession();
    } catch (error) {
      listEl.innerHTML =
        '<p class="empty error">' +
        window.PanoTemplates.escapeHtml(error.message) +
        "</p>";
      setStatus("");
      return;
    }

    setStatus("Yükleniyor…");
    try {
      var ads = await window.PanoAds.listMine(session);
      if (!ads.length) {
        listEl.innerHTML =
          '<p class="empty">Henüz ilanın yok. <a href="/edit">Yeni ilan oluştur</a>.</p>';
        setStatus("");
        return;
      }

      listEl.innerHTML = ads
        .map(function (ad) {
          var id = window.PanoTemplates.escapeHtml(ad.id);
          return (
            '<article class="mine-item' +
            (ad.published ? "" : " is-draft") +
            '">' +
            window.PanoTemplates.renderAd(ad, {
              compact: true,
              href: "/i/" + encodeURIComponent(ad.id)
            }) +
            '<details class="postit-menu">' +
            '<summary aria-label="İlan aksiyonları">•••</summary>' +
            '<div class="postit-menu-panel">' +
            '<a href="/i/' + encodeURIComponent(ad.id) + '">Görüntüle</a>' +
            '<a href="/edit?id=' + encodeURIComponent(ad.id) + '">Düzenle</a>' +
            '<button type="button" data-qr="' + id + '">QR görselini indir</button>' +
            '<button type="button" class="danger" data-delete="' + id + '">Sil</button>' +
            "</div></details></article>"
          );
        })
        .join("");
      setStatus(ads.length + " ilan");
      window.PanoTemplates.hydrateQrCodes(listEl);
    } catch (error) {
      listEl.innerHTML =
        '<p class="empty error">' +
        window.PanoTemplates.escapeHtml(error.message) +
        "</p>";
      setStatus("");
    }
  }

  async function downloadQr(id) {
    var src = await window.PanoTemplates.qrDataUrl(
      window.PanoAds.publicUrl(id),
      1200
    );
    var link = document.createElement("a");
    link.href = src;
    link.download = "pano-" + id + ".png";
    link.click();
  }

  listEl.addEventListener("click", async function (event) {
    var qrButton = event.target.closest("[data-qr]");
    if (qrButton) {
      try {
        qrButton.disabled = true;
        await downloadQr(qrButton.getAttribute("data-qr"));
      } catch (error) {
        window.alert(error.message);
      } finally {
        qrButton.disabled = false;
      }
      return;
    }

    var deleteButton = event.target.closest("[data-delete]");
    if (!deleteButton) return;
    var id = deleteButton.getAttribute("data-delete");
    if (!window.confirm("Bu ilanı silmek istiyor musun?")) return;
    try {
      var session = await window.PanoAds.requireSession();
      await window.PanoAds.removeAd(id, session);
      await load();
    } catch (error) {
      window.alert(error.message);
    }
  });

  load();
})();
