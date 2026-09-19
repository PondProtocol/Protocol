(() => {
  const DEFAULT_ICON = "/greenhead-duck.png";
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

  function iconSrc(value) {
    const text = String(value || "").trim();
    if (/^https:\/\//i.test(text) || /^data:image\//i.test(text) || /^\/(?!\/)/.test(text)) {
      return text;
    }
    return DEFAULT_ICON;
  }

  function balancesHtml(snapshot) {
    const assets = snapshot?.assets?.length
      ? snapshot.assets
      : [
          { id: "pnd", label: "$PND", value: "—", state: "loading", note: "Reading validated ledger…" },
          { id: "rpnd", label: "$rPND", value: "—", state: "loading", note: "Reading validated ledger…" },
          { id: "xrp", label: "$XRP", value: "—", state: "loading", note: "Reading validated ledger…" },
          { id: "rlusd", label: "$RLUSD", value: "—", state: "loading", note: "Reading validated ledger…" },
        ];
    const rows = assets
      .map(
        (asset) => `<div class="profile-balance" data-balance="${esc(asset.id)}" data-state="${esc(asset.state)}">
        <span>${esc(asset.label)}</span>
        <strong>${esc(asset.value)}</strong>
        <em>${esc(asset.note)}</em>
      </div>`,
      )
      .join("");
    return `<section class="profile-balances" data-profile-balances aria-label="Wallet balances">
      <p class="profile-kicker">Wallet balances</p>
      <p class="profile-form-note">Public XRPL account data only. $PND and $rPND stay 0 / not issued until they exist. Pond never asks for a seed.</p>
      <div class="profile-balance-grid">${rows}</div>
    </section>`;
  }

  function signOutHtml() {
    return `<p class="profile-session-actions">
      <button type="button" class="button button-quiet" data-profile-signout>Sign out</button>
    </p>`;
  }

  function lockedHtml(kind) {
    const copy =
      kind === "walletconnect"
        ? "WalletConnect can stay connected for Trade. Account pages need official Xaman SignIn."
        : "Sign in with official Xaman to open your account page. Logged-out visitors do not see handles or profile fields.";
    const session = window.PondSession?.current?.();
    return `<div class="profile-card" data-profile-locked>
      <p class="profile-kicker">Pond Protocol Profile</p>
      <h2>Complete your Pond Protocol Profile</h2>
      <p>${copy} Pond never asks for a seed.</p>
      ${session?.address ? signOutHtml() : ""}
    </div>`;
  }

  function cardHtml(profile) {
    const name = profile.displayName || profile.handle;
    const admin = profile.admin ? `<span class="profile-admin">Admin</span>` : "";
    const icon = iconSrc(profile.icon);
    const iconUrl = /^https:\/\//i.test(profile.icon || "") ? profile.icon : "";
    return `<div class="profile-card" data-profile-card>
      <p class="profile-kicker">Complete your Pond Protocol Profile</p>
      <div class="profile-id">
        <img class="profile-icon" data-profile-icon src="${esc(icon)}" width="48" height="48" alt="">
        <h2>${esc(name)}</h2>
        ${admin}
      </div>
      <p class="profile-handle">/profile/${esc(profile.handle)}/</p>
      <p class="profile-address" title="${esc(profile.address)}">${esc(shortAddr(profile.address))}</p>
      ${balancesHtml(profile.balances)}
      <form class="profile-form" data-profile-form>
        <label>
          <span>Display name</span>
          <input type="text" name="displayName" maxlength="40" value="${esc(profile.displayName || "")}" autocomplete="nickname">
        </label>
        <label>
          <span>Short bio</span>
          <textarea name="bio" maxlength="160" rows="3">${esc(profile.bio || "")}</textarea>
        </label>
        <label>
          <span>Profile icon URL</span>
          <input type="url" name="icon" maxlength="500" value="${esc(iconUrl)}" placeholder="https://… or leave blank for the duck" autocomplete="off">
        </label>
        <label>
          <span>Or upload a small image</span>
          <input type="file" name="iconFile" accept="image/png,image/jpeg,image/webp,image/gif">
        </label>
        <p class="profile-form-note">Visible only while this Xaman session is signed in. Never a seed, password, or private key.</p>
        <p class="profile-form-status" data-profile-status hidden></p>
        <div class="profile-form-actions">
          <button type="submit" class="button">Save profile</button>
          <button type="button" class="button button-quiet" data-review-disclaimer>Review disclaimer</button>
        </div>
      </form>
      ${signOutHtml()}
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

  async function loadOwn() {
    return fetchJson("/api/profile");
  }

  async function loadBalances() {
    return fetchJson("/api/profile/balances");
  }

  async function saveOwn(fields) {
    return fetchJson("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
  }

  async function syncProgress(progress) {
    const session = window.PondSession?.current?.();
    if (session?.method !== "xaman" || !session.address) return null;
    try {
      return await saveOwn({ progress });
    } catch {
      return null;
    }
  }

  function readIconFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\/(png|jpeg|webp|gif)$/i.test(file.type)) {
        reject(new Error("Choose a PNG, JPEG, WebP, or GIF."));
        return;
      }
      if (file.size > 800 * 1024) {
        reject(new Error("Choose a smaller image."));
        return;
      }
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        canvas.width = 96;
        canvas.height = 96;
        const ctx = canvas.getContext("2d");
        const side = Math.min(image.width, image.height);
        ctx.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 96, 96);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("That image could not be read."));
      };
      image.src = url;
    });
  }

  function bindForm(profile) {
    const form = document.querySelector("[data-profile-form]");
    if (!form) return;
    const setStatus = (message) => {
      const status = document.querySelector("[data-profile-status]");
      if (!status) return;
      status.hidden = false;
      status.textContent = message;
    };
    form.iconFile?.addEventListener("change", async () => {
      const file = form.iconFile.files?.[0];
      if (!file) return;
      try {
        const data = await readIconFile(file);
        form.dataset.iconData = data;
        form.icon.value = "";
        const preview = document.querySelector("[data-profile-icon]");
        if (preview) preview.src = data;
      } catch (error) {
        setStatus(error.message || "Could not read that image.");
      }
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const body = {
        displayName: form.displayName.value,
        bio: form.bio.value,
        icon: form.dataset.iconData || form.icon.value.trim(),
        progress: window.PondStart?.flags?.() || profile.progress || {},
      };
      try {
        const saved = await saveOwn(body);
        window.PondSession?.patch?.({ icon: saved.icon || "", handle: saved.handle || "" });
        render({ ...saved, balances: profile.balances });
        setStatus("Saved.");
      } catch (error) {
        setStatus(error.message || "Could not save.");
      }
    });
  }

  function bindSignOut(mount) {
    mount.querySelector("[data-profile-signout]")?.addEventListener("click", () => {
      window.PondSession?.logout?.();
    });
  }

  function render(profile) {
    const mount = root();
    if (!mount) return;
    if (!profile) {
      const session = window.PondSession?.current?.();
      mount.innerHTML = lockedHtml(session?.method === "walletconnect" ? "walletconnect" : "guest");
      bindSignOut(mount);
      document.title = "Complete your Pond Protocol Profile — Pond Protocol";
      return;
    }
    mount.innerHTML = cardHtml(profile);
    bindForm(profile);
    bindSignOut(mount);
    mount.querySelector("[data-review-disclaimer]")?.addEventListener("click", () => {
      window.PondDisclaimer?.open?.();
    });
    document.title = `${profile.displayName || profile.handle} — Pond Protocol`;
  }

  async function show() {
    const mount = root();
    if (!mount || !isProfilePath()) return;
    const session = window.PondSession?.current?.() || null;
    if (session?.method !== "xaman" || !session.address) {
      render(null);
      return;
    }
    try {
      const own = await loadOwn();
      if (own.handle && window.location.pathname !== `/profile/${own.handle}/`) {
        history.replaceState({}, "", `/profile/${own.handle}/`);
      }
      render(own);
      try {
        const snapshot = await loadBalances();
        render({ ...own, balances: snapshot });
      } catch {
        /* keep the honest loading / empty rows */
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        render(null);
        return;
      }
      mount.innerHTML = `<div class="profile-card" data-profile-locked><p class="profile-kicker">Pond Protocol Profile</p><p>${esc(error.message)}</p></div>`;
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
