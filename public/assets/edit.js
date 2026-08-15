(function () {
  "use strict";

  var form = document.querySelector("#edit-form");
  var preview = document.querySelector("#preview");
  var message = document.querySelector("#edit-message");
  var qrImage = document.querySelector("#qr-image");
  var qrDownload = document.querySelector("#qr-download");
  var qrPublicUrl = document.querySelector("#qr-public-url");
  var qrPanel = document.querySelector("#qr-panel");
  var linksList = document.querySelector("#links-list");
  var adIdInput = document.querySelector("#ad-id");
  var editingId = null;
  var session = null;

  function showMessage(text, type) {
    message.textContent = text || "";
    message.className = "message" + (type ? " message-" + type : "");
  }

  function readForm() {
    var linkRows = Array.from(linksList.querySelectorAll(".link-row"));
    return {
      title: form.title.value,
      body: form.body.value,
      noteColor: form.noteColor.value,
      published: form.published.checked,
      links: linkRows.map(function (row) {
        return {
          label: row.querySelector('[name="link-label"]').value,
          url: row.querySelector('[name="link-url"]').value
        };
      })
    };
  }

  function addLinkRow(link) {
    link = link || { label: "", url: "" };
    var row = document.createElement("div");
    row.className = "link-row";
    row.innerHTML =
      '<input name="link-label" type="text" placeholder="Etiket" maxlength="40" value="' +
      window.PanoTemplates.escapeHtml(link.label || "") +
      '" />' +
      '<input name="link-url" type="url" placeholder="https://…" value="' +
      window.PanoTemplates.escapeHtml(link.url || "") +
      '" />' +
      '<button type="button" class="btn btn-ghost remove-link">Sil</button>';
    row.querySelector(".remove-link").addEventListener("click", function () {
      row.remove();
      updatePreview();
    });
    row.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("input", updatePreview);
    });
    linksList.appendChild(row);
  }

  function updatePreview() {
    var draft = readForm();
    preview.innerHTML = window.PanoTemplates.renderAd({
      title: draft.title || "Başlık önizlemesi",
      body: draft.body || "Kısa açıklama burada görünecek.",
      noteColor: draft.noteColor,
      links: window.PanoAds.normalizeLinks(draft.links)
    });
  }

  async function renderQr(id) {
    var url = window.PanoAds.publicUrl(id);
    qrPublicUrl.href = url;
    qrPublicUrl.textContent = url;
    qrPanel.hidden = false;

    var src = await window.PanoTemplates.qrDataUrl(url, 1200);
    qrImage.src = src;
    qrDownload.href = src;
    qrDownload.download = "pano-" + id + ".png";
  }

  function fillForm(ad) {
    form.title.value = ad.title || "";
    form.body.value = ad.body || "";
    var noteColor = ad.noteColor || window.PanoAds.DEFAULT_NOTE_COLOR;
    var colorInput = form.querySelector(
      '[name="noteColor"][value="' + noteColor + '"]'
    );
    (colorInput || form.querySelector('[name="noteColor"][value="yellow"]')).checked = true;
    form.published.checked = ad.published !== false;
    linksList.innerHTML = "";
    (ad.links && ad.links.length ? ad.links : [{ label: "", url: "" }]).forEach(
      addLinkRow
    );
    updatePreview();
  }

  async function boot() {
    try {
      session = await window.PanoAds.requireSession();
    } catch (error) {
      showMessage(error.message, "error");
      return;
    }

    var params = new URLSearchParams(window.location.search);
    editingId = params.get("id");
    adIdInput.value = editingId || "";

    if (editingId) {
      try {
        var ad = await window.PanoAds.getAd(editingId, session.idToken);
        if (!ad || ad.ownerUid !== session.uid) {
          showMessage("İlan bulunamadı veya yetkiniz yok.", "error");
          return;
        }
        fillForm(ad);
        showMessage("İlan düzenleniyor.", "success");
        renderQr(ad.id).catch(function (error) {
          showMessage(error.message, "error");
        });
      } catch (error) {
        showMessage(error.message, "error");
      }
    } else {
      fillForm({
        title: "",
        body: "",
        noteColor: window.PanoAds.DEFAULT_NOTE_COLOR,
        published: true,
        links: [{ label: "Web sitesi", url: "" }]
      });
    }
  }

  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);

  document.querySelector("#add-link").addEventListener("click", function () {
    addLinkRow();
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    showMessage("Kaydediliyor…");
    try {
      session = await window.PanoAds.requireSession();
      var saved = await window.PanoAds.saveAd(editingId, readForm(), session);
      editingId = saved.id;
      adIdInput.value = saved.id;
      history.replaceState({}, "", "/edit?id=" + encodeURIComponent(saved.id));
      showMessage("Kaydedildi. QR kodu hazırlanıyor…", "success");
      await renderQr(saved.id);
      showMessage("Kaydedildi. QR kodu hazır.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  });

  boot();
})();
