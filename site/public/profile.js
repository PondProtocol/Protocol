(() => {
  const STEPS = [
    { id: "begin", title: "Begin", url: "/start/" },
    { id: "what-is-pnd", title: "What is $PND", url: "/start/pnd/" },
    { id: "what-is-rpnd", title: "What is $rPND", url: "/start/rpnd/" },
    { id: "verify-issuer", title: "Verify Issuer", url: "/verify/" },
    { id: "connect-wallet", title: "Connect Wallet", url: "/start/wallet/" },
    { id: "set-trust-lines", title: "Set Trust Lines", url: "/start/trust-lines/" },
    { id: "ready-dex", title: "Ready to Use DEX", url: "/start/dex/" },
  ];

  const root = () => document.querySelector("[data-pond-profile]");

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shortAddr(addr) {
    return addr && addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr || "";
  }

  function pathHandle() {
    const match = window.location.pathname.match(/^\/profile\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function isProfilePath() {
    return /^\/profile\/?$/.test(window.location.pathname) || Boolean(pathHandle());
  }

  function progressCount(progress) {
    return STEPS.filter((step) => progress?.[step.id]).length;
  }

  function progressHtml(progress) {
    const done = progressCount(progress);
    const items = STEPS.map((step, i) => {
      const n = String(i + 1).padStart(2, "0");
      const complete = progress?.[step.id] ? " is-complete" : "";
      return `<li class="start-progress-step${complete}" data-start-step="${esc(step.id)}">
        <a href="${esc(step.url)}"><b>${n}</b><strong>${esc(step.title)}</strong></a>
      </li>`;
    }).join("");
    return `<nav class="start-progress is-compact profile-progress" aria-label="Start here progress">
      <div class="start-progress-head">
        <p class="start-eyebrow">Start here</p>
        <p class="start-progress-count"><strong data-start-progress-count>${done} / ${STEPS.length}</strong> saved</p>
      </div>
      <ol class="start-progress-list">${items}</ol>
    </nav>`;
  }

  function guestHtml() {
    return `<div class="profile-card">
      <p class="profile-kicker">Pond Protocol Profile</p>
      <h2>Complete your Pond Protocol Profile</h2>
      <p>Sign in with official WalletConnect or Xaman. Pond assigns a tadpole handle and never asks for a seed.</p>
    </div>`;
  }

  function missingHtml(handle) {
    return `<div class="profile-card">
      <p class="profile-kicker">Pond Protocol Profile</p>
      <h2>No profile for ${esc(handle)}</h2>
      <p>That handle is not in the public registry yet. Sign in with WalletConnect or Xaman to get the next tadpole handle. Pond never asks for a seed.</p>
    </div>`;
  }

  function cardHtml(profile, { mine }) {
    const name = profile.displayName || profile.handle;
    const admin = profile.admin
      ? `<span class="profile-admin">Admin</span>`
      : "";
    const form = `<form class="profile-form" data-profile-form>
          <label>
            <span>Display name</span>
            <input type="text" name="displayName" maxlength="40" value="${esc(profile.displayName || "")}" autocomplete="nickname">
          </label>
          <label>
            <span>Short bio</span>
            <textarea name="bio" maxlength="160" rows="3">${esc(profile.bio || "")}</textarea>
          </label>
          <p class="profile-form-note">Public, and short. Never a seed, password, or private key.</p>
          <p class="profile-form-status" data-profile-status hidden></p>
          <button type="submit" class="button">Save profile</button>
        </form>`;
    const bio = `<p class="profile-bio">${esc(profile.bio || "This tadpole has not written a bio yet.")}</p>`;
    return `<div class="profile-card" data-profile-card>
      <p class="profile-kicker">Complete your Pond Protocol Profile</p>
      <div class="profile-id">
        <h2>${esc(name)}</h2>
        ${admin}
      </div>
      <p class="profile-handle"><a href="/profile/${esc(profile.handle)}/">/profile/${esc(profile.handle)}/</a></p>
      <p class="profile-address" title="${esc(profile.address)}">${esc(shortAddr(profile.address))}</p>
      ${mine ? form : bio}
      ${progressHtml(profile.progress)}
    </div>`;
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...(options?.headers || {}) },
      credentials: "same-origin",
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || "Profile request failed");
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  async function loadProfile(handle) {
    return fetchJson(`/api/profile/${encodeURIComponent(handle)}`);
  }

  async function loadOwn() {
    return fetchJson("/api/profile");
  }

  async function saveOwn(fields) {
    return fetchJson("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
  }

  async function syncProgress(progress) {
    if (!window.PondSession?.current?.()?.address) return null;
    try {
      return await saveOwn({ progress });
    } catch {
      return null;
    }
  }

  function bindForm(profile) {
    const form = document.querySelector("[data-profile-form]");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const body = {
        displayName: form.displayName.value,
        bio: form.bio.value,
        progress: window.PondStart?.flags?.() || profile.progress || {},
      };
      const setStatus = (message) => {
        const status = document.querySelector("[data-profile-status]");
        if (!status) return;
        status.hidden = false;
        status.textContent = message;
      };
      try {
        const saved = await saveOwn(body);
        render(saved, { mine: true });
        setStatus("Saved.");
      } catch (error) {
        setStatus(error.message || "Could not save.");
      }
    });
  }

  function render(profile, options) {
    const mount = root();
    if (!mount) return;
    if (!profile) {
      mount.innerHTML = pathHandle() ? missingHtml(pathHandle()) : guestHtml();
      return;
    }
    mount.innerHTML = cardHtml(profile, options);
    if (options.mine) bindForm(profile);
    const titleName = profile.displayName || profile.handle;
    document.title = `${titleName} — Pond Protocol`;
  }

  async function show() {
    const mount = root();
    if (!mount || !isProfilePath()) return;
    const session = window.PondSession?.current?.() || null;
    const handle = pathHandle();
    try {
      if (!handle) {
        if (!session?.address) {
          render(null, { mine: false });
          return;
        }
        const own = await loadOwn();
        if (own.handle && window.location.pathname !== `/profile/${own.handle}/`) {
          history.replaceState({}, "", `/profile/${own.handle}/`);
        }
        render(own, { mine: true });
        return;
      }
      const profile = await loadProfile(handle);
      const mine = Boolean(session?.address && session.address === profile.address);
      render(profile, { mine });
    } catch (error) {
      if (error.status === 401) {
        render(null, { mine: false });
        return;
      }
      if (error.status === 404) {
        render(null, { mine: false });
        return;
      }
      mount.innerHTML = `<div class="profile-card"><p class="profile-kicker">Pond Protocol Profile</p><p>${esc(error.message)}</p></div>`;
    }
  }

  function init() {
    show();
  }

  window.PondProfile = { init, syncProgress };
  window.addEventListener("pond:session-change", () => {
    if (isProfilePath()) show();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
