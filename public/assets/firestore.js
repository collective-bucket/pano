(function () {
  "use strict";

  var PROJECT = window.PanoConfig.projectId;
  var API_KEY = window.PanoConfig.apiKey;
  var BASE =
    "https://firestore.googleapis.com/v1/projects/" +
    PROJECT +
    "/databases/(default)/documents";

  function withKey(path) {
    var sep = path.indexOf("?") >= 0 ? "&" : "?";
    return path + sep + "key=" + encodeURIComponent(API_KEY);
  }

  function encodeValue(value) {
    if (value === null) return { nullValue: null };
    if (typeof value === "boolean") return { booleanValue: value };
    if (typeof value === "number") {
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    }
    if (typeof value === "string") return { stringValue: value };
    if (Array.isArray(value)) {
      return { arrayValue: { values: value.map(encodeValue) } };
    }
    if (typeof value === "object") {
      var fields = {};
      Object.keys(value).forEach(function (key) {
        fields[key] = encodeValue(value[key]);
      });
      return { mapValue: { fields: fields } };
    }
    throw new Error("Desteklenmeyen alan tipi");
  }

  function decodeValue(node) {
    if (!node || typeof node !== "object") return null;
    if ("nullValue" in node) return null;
    if ("booleanValue" in node) return node.booleanValue;
    if ("integerValue" in node) return Number(node.integerValue);
    if ("doubleValue" in node) return node.doubleValue;
    if ("stringValue" in node) return node.stringValue;
    if ("timestampValue" in node) return node.timestampValue;
    if ("arrayValue" in node) {
      return (node.arrayValue.values || []).map(decodeValue);
    }
    if ("mapValue" in node) {
      var out = {};
      var fields = (node.mapValue && node.mapValue.fields) || {};
      Object.keys(fields).forEach(function (key) {
        out[key] = decodeValue(fields[key]);
      });
      return out;
    }
    return null;
  }

  function decodeDocument(doc) {
    if (!doc || !doc.name) return null;
    var id = doc.name.split("/").pop();
    var data = {};
    var fields = doc.fields || {};
    Object.keys(fields).forEach(function (key) {
      data[key] = decodeValue(fields[key]);
    });
    data.id = id;
    return data;
  }

  function encodeFields(data) {
    var fields = {};
    Object.keys(data).forEach(function (key) {
      if (key === "id") return;
      fields[key] = encodeValue(data[key]);
    });
    return fields;
  }

  async function request(path, options) {
    options = options || {};
    var headers = Object.assign(
      { "Content-Type": "application/json" },
      options.headers || {}
    );
    if (options.token) {
      headers.Authorization = "Bearer " + options.token;
    }

    var response = await fetch(BASE + withKey(path), {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (response.status === 404) return null;

    var text = await response.text();
    var json = text ? JSON.parse(text) : null;

    if (!response.ok) {
      var message =
        (json && json.error && json.error.message) ||
        "Firestore isteği başarısız (" + response.status + ")";
      throw new Error(message);
    }

    return json;
  }

  async function getDocument(collection, id, token) {
    var doc = await request("/" + collection + "/" + encodeURIComponent(id), {
      token: token
    });
    return decodeDocument(doc);
  }

  async function listCollection(collection, token) {
    var json = await request("/" + collection + "?pageSize=100", {
      token: token
    });
    return (json && json.documents ? json.documents : [])
      .map(decodeDocument)
      .filter(Boolean);
  }

  async function createDocument(collection, id, data, token) {
    var doc = await request(
      "/" + collection + "?documentId=" + encodeURIComponent(id),
      {
        method: "POST",
        token: token,
        body: { fields: encodeFields(data) }
      }
    );
    return decodeDocument(doc);
  }

  async function updateDocument(collection, id, data, token) {
    var keys = Object.keys(data).filter(function (key) {
      return key !== "id";
    });
    var mask = keys
      .map(function (key) {
        return "updateMask.fieldPaths=" + encodeURIComponent(key);
      })
      .join("&");
    var doc = await request(
      "/" + collection + "/" + encodeURIComponent(id) + (mask ? "?" + mask : ""),
      {
        method: "PATCH",
        token: token,
        body: { fields: encodeFields(data) }
      }
    );
    return decodeDocument(doc);
  }

  async function deleteDocument(collection, id, token) {
    await request("/" + collection + "/" + encodeURIComponent(id), {
      method: "DELETE",
      token: token
    });
  }

  window.PanoFirestore = {
    getDocument: getDocument,
    listCollection: listCollection,
    createDocument: createDocument,
    updateDocument: updateDocument,
    deleteDocument: deleteDocument
  };
})();
