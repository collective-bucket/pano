(function () {
  "use strict";

  var NOTE_COLORS = ["yellow", "mint", "pink", "blue", "lilac"];
  var DEFAULT_NOTE_COLOR = "yellow";

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

    var noteColor =
      NOTE_COLORS.indexOf(input.noteColor) >= 0
        ? input.noteColor
        : DEFAULT_NOTE_COLOR;

    var payload = {
      ownerUid: session.uid,
      title: title,
      body: String(input.body || "").trim().slice(0, 2000),
      links: normalizeLinks(input.links),
      noteColor: noteColor,
      published: input.published !== false,
      updatedAt: nowIso()
    };

    if (input.createdAt) payload.createdAt = input.createdAt;
    else payload.createdAt = nowIso();

    return payload;
  }

  // client.js defer ile yüklendiği için sayfa scriptleri ondan önce
  // çalışabilir; oturum köprüsü hazır olana kadar bekle.
  async function waitForAuth() {
    var deadline = Date.now() + 10000;
    while (!window.CollectiveBucketAuth) {
      if (Date.now() > deadline) {
        throw new Error("Oturum servisi yüklenemedi.");
      }
      await new Promise(function (resolve) {
        setTimeout(resolve, 50);
      });
    }
    return window.CollectiveBucketAuth;
  }

  async function requireSession() {
    var client = await waitForAuth();
    var session = await client.getSession({
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
    var docs = await window.PanoFirestore.queryEquals("ads", "published", true);
    return docs.sort(function (a, b) {
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
  }

  async function listMine(session) {
    var docs = await window.PanoFirestore.queryEquals(
      "ads",
      "ownerUid",
      session.uid,
      session.idToken
    );
    return docs.sort(function (a, b) {
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
    NOTE_COLORS: NOTE_COLORS,
    DEFAULT_NOTE_COLOR: DEFAULT_NOTE_COLOR,
    waitForAuth: waitForAuth,
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
