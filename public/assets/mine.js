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
    } catch {
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
          return (
            '<article class="mine-item">' +
            window.PanoTemplates.renderAd(ad, { compact: true }) +
            '<div class="mine-actions">' +
            '<span class="badge">' +
            (ad.published ? "yayında" : "taslak") +
            "</span>" +
            '<a class="btn btn-ghost" href="/i/' +
            encodeURIComponent(ad.id) +
            '">Görüntüle</a>' +
            '<a class="btn btn-ghost" href="/edit?id=' +
            encodeURIComponent(ad.id) +
            '">Düzenle</a>' +
            '<button type="button" class="btn btn-ghost danger" data-delete="' +
            window.PanoTemplates.escapeHtml(ad.id) +
            '">Sil</button>' +
            "</div></article>"
          );
        })
        .join("");
      setStatus(ads.length + " ilan");
    } catch (error) {
      listEl.innerHTML =
        '<p class="empty error">' +
        window.PanoTemplates.escapeHtml(error.message) +
        "</p>";
      setStatus("");
    }
  }

  listEl.addEventListener("click", async function (event) {
    var button = event.target.closest("[data-delete]");
    if (!button) return;
    var id = button.getAttribute("data-delete");
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
