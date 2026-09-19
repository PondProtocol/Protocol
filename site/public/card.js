(() => {
  const root = () => document.querySelector("[data-pond-card]");

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pathHandle() {
    const match = window.location.pathname.match(/^\/card\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function iconSrc(value) {
    const text = String(value || "").trim();
    if (/^https:\/\//i.test(text) || /^data:image\//i.test(text) || /^\/(?!\/)/.test(text)) {
      return text;
    }
    return "";
  }

  function emptyHtml(message) {
    return `<div class="public-card" data-public-card-empty>
      <p class="profile-kicker">Public card</p>
      <p>${esc(message)}</p>
    </div>`;
  }

  function cardHtml(card) {
    return `<div class="public-card" data-public-card>
      <p class="profile-kicker">Public card</p>
      <img class="public-card-icon" src="${esc(iconSrc(card.icon))}" width="96" height="96" alt="">
      <p class="public-card-handle">${esc(card.handle)}</p>
    </div>`;
  }

  async function show() {
    const mount = root();
    if (!mount) return;
    const handle = pathHandle();
    if (!handle) {
      mount.innerHTML = emptyHtml("This public card is optional. Open /card/<handle>/ only when the owner turned it on.");
      document.title = "Public card — Pond Protocol";
      return;
    }
    try {
      const response = await fetch(`/api/card/${encodeURIComponent(handle)}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.handle) {
        mount.innerHTML = emptyHtml(data.message || "That card is not public.");
        document.title = "Public card — Pond Protocol";
        return;
      }
      mount.innerHTML = cardHtml({ handle: data.handle, icon: data.icon || "" });
      document.title = `${data.handle} — Pond Protocol`;
    } catch (error) {
      mount.innerHTML = emptyHtml(error.message || "That card is not public.");
      document.title = "Public card — Pond Protocol";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
  else show();
})();
