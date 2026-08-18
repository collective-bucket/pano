(function () {
  "use strict";

  var listEl = document.querySelector("#mine-list");
  var statusEl = document.querySelector("#mine-status");
  var loginPrompt = document.querySelector("#login-prompt");
  var loginLink = document.querySelector("#login-link");

  function setStatus(text) {
    statusEl.textContent = text || "";
  }

  async function load() {
    loginLink.href = window.PanoAds.loginUrl();
    var session = await window.PanoAds.getOptionalSession();
    if (!session || !session.idToken) {
      loginPrompt.hidden = false;
      listEl.innerHTML = "";
      setStatus("");
      return;
    }

    loginPrompt.hidden = true;
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
            '<article class="mine-item' +
            (ad.published ? "" : " is-draft") +
            '">' +
            window.PanoTemplates.renderAd(ad, {
              compact: true,
              href: "/edit?id=" + encodeURIComponent(ad.id)
            }) +
            "</article>"
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

  load();
})();
