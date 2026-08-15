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

  function renderAd(ad, options) {
    options = options || {};
    var template = ad.template || "card";
    var accent = ad.accent || "#2f9a7c";
    var compact = options.compact;
    var href = options.href;

    var inner =
      '<div class="ad-shell tpl-' +
      escapeHtml(template) +
      '" style="--ad-accent:' +
      escapeHtml(accent) +
      '">' +
      (ad.emoji
        ? '<div class="ad-emoji" aria-hidden="true">' +
          escapeHtml(ad.emoji) +
          "</div>"
        : "") +
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
    escapeHtml: escapeHtml
  };
})();
