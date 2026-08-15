(function () {
  "use strict";

  var root = document.querySelector("#ad-view");
  var statusEl = document.querySelector("#view-status");

  function adIdFromPath() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "i" && parts[1]) return decodeURIComponent(parts[1]);
    var params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  async function load() {
    var id = adIdFromPath();
    if (!id) {
      root.innerHTML = '<p class="empty error">İlan bulunamadı.</p>';
      return;
    }

    statusEl.textContent = "Yükleniyor…";
    try {
      var ad = await window.PanoAds.getAd(id);
      if (!ad || ad.published !== true) {
        root.innerHTML = '<p class="empty error">Bu ilan yayında değil veya yok.</p>';
        statusEl.textContent = "";
        return;
      }
      document.title = ad.title + " | Pano";
      root.innerHTML = window.PanoTemplates.renderAd(ad);
      statusEl.textContent = "";
    } catch (error) {
      root.innerHTML =
        '<p class="empty error">' +
        window.PanoTemplates.escapeHtml(error.message) +
        "</p>";
      statusEl.textContent = "";
    }
  }

  load();
})();
