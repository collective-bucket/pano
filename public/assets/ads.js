(function () {
  "use strict";

  var TEMPLATES = ["card", "poster", "minimal"];
  var DEFAULT_ACCENT = "#2f9a7c";

  function nowIso() {
    return new Date().toISOString();
  }

  function createId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    }
    return Math.random().toString(36).slice(2, 14);
  }

  function sanitizeUrl(url) {
    try {
      var parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
      }
      return parsed.href;
    } catch {
      return null;
    }
  }

  function normalizeLinks(links) {
    if (!Array.isArray(links)) return [];
    return links
      .map(function (link) {
        var href = sanitizeUrl((link && link.url) || "");
        if (!href) return null;
        return {
          label: String((link && link.label) || "Link").trim().slice(0, 40),
          url: href
        };
      })
      .filter(Boolean)
      .slice(0, 10);
  }

  function normalizeAd(input, session) {
    var title = String(input.title || "").trim().slice(0, 120);
    if (!title) throw new Error("Başlık zorunlu.");

    var template = TEMPLATES.indexOf(input.template) >= 0 ? input.template : "card";
    var accent = String(input.accent || DEFAULT_ACCENT).trim().slice(0, 16);
    if (!/^#[0-9a-fA-F]{3,8}$/.test(accent)) accent = DEFAULT_ACCENT;

    var payload = {
      ownerUid: session.uid,
      ownerEmail: session.email || "",
      title: title,
      body: String(input.body || "").trim().slice(0, 2000),
      emoji: String(input.emoji || "").trim().slice(0, 8),
      links: normalizeLinks(input.links),
      template: template,
      accent: accent,
      published: input.published !== false,
      updatedAt: nowIso()
    };

    if (input.createdAt) payload.createdAt = input.createdAt;
    else payload.createdAt = nowIso();

    return payload;
  }

  async function requireSession() {
    if (!window.CollectiveBucketAuth) {
      throw new Error("Oturum servisi yüklenemedi.");
    }
    var session = await window.CollectiveBucketAuth.getSession({
      forceRefresh: true
    });
    if (!session || !session.idToken) {
      var returnTo = window.location.href;
      window.location.assign(
        window.PanoConfig.authOrigin +
          "/?returnTo=" +
          encodeURIComponent(returnTo)
      );
      throw new Error("Giriş gerekli.");
    }
    return session;
  }

  async function listPublished() {
    var docs = await window.PanoFirestore.listCollection("ads");
    return docs
      .filter(function (ad) {
        return ad.published === true;
      })
      .sort(function (a, b) {
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });
  }

  async function listMine(session) {
    var docs = await window.PanoFirestore.listCollection("ads", session.idToken);
    return docs
      .filter(function (ad) {
        return ad.ownerUid === session.uid;
      })
      .sort(function (a, b) {
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });
  }

  async function getAd(id, token) {
    return window.PanoFirestore.getDocument("ads", id, token);
  }

  async function saveAd(id, input, session) {
    var existing = id ? await getAd(id, session.idToken) : null;
    if (existing && existing.ownerUid !== session.uid) {
      throw new Error("Bu ilanı düzenleme yetkiniz yok.");
    }

    var payload = normalizeAd(input, session);
    if (existing) {
      payload.createdAt = existing.createdAt || payload.createdAt;
      payload.ownerUid = existing.ownerUid;
      payload.ownerEmail = existing.ownerEmail || session.email || "";
      return window.PanoFirestore.updateDocument(
        "ads",
        id,
        payload,
        session.idToken
      );
    }

    var newId = id || createId();
    return window.PanoFirestore.createDocument(
      "ads",
      newId,
      payload,
      session.idToken
    );
  }

  async function removeAd(id, session) {
    var existing = await getAd(id, session.idToken);
    if (!existing) throw new Error("İlan bulunamadı.");
    if (existing.ownerUid !== session.uid) {
      throw new Error("Bu ilanı silme yetkiniz yok.");
    }
    await window.PanoFirestore.deleteDocument("ads", id, session.idToken);
  }

  function publicUrl(id) {
    var origin =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? window.location.origin
        : window.PanoConfig.siteOrigin;
    return origin + "/i/" + encodeURIComponent(id);
  }

  window.PanoAds = {
    TEMPLATES: TEMPLATES,
    DEFAULT_ACCENT: DEFAULT_ACCENT,
    requireSession: requireSession,
    listPublished: listPublished,
    listMine: listMine,
    getAd: getAd,
    saveAd: saveAd,
    removeAd: removeAd,
    publicUrl: publicUrl,
    normalizeLinks: normalizeLinks
  };
})();
