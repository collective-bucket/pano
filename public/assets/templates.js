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

  function renderLinks(links) {
    if (!links || !links.length) return "";
    return (
      '<ul class="ad-links">' +
      links
        .map(function (link) {
          return (
            '<li><a href="' +
            escapeHtml(link.url) +
            '" target="_blank" rel="noopener">' +
            escapeHtml(link.label || link.url) +
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
      renderLinks(ad.links) +
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
