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

  function formatWhen(ms) {
    const n = Number(ms);
    if (!Number.isFinite(n) || n <= 0) return "Not yet";
    try {
      return new Date(n).toLocaleString();
    } catch {
      return "Not yet";
    }
  }

  function progressCount(progress) {
    return STEPS.filter((step) => progress?.[step.id]).length;
  }

  function progressHtml(progress) {
    const done = progressCount(progress);
    const items = STEPS.map((step, i) => {
      const n = String(i + 1).padStart(2, "0");
      const complete = Boolean(progress?.[step.id]);
      return `<li class="profile-check${complete ? " is-done" : ""}" data-start-step="${esc(step.id)}">
        <span class="profile-check-state">${complete ? "Done" : "Open"}</span>
        <a href="${esc(step.url)}"><b>${n}</b><strong>${esc(step.title)}</strong></a>
      </li>`;
    }).join("");
    return `<nav class="profile-checklist" aria-label="Start here progress">
      <p class="profile-kicker">Start here</p>
      <p class="profile-checklist-count"><strong data-start-progress-count>${done} / ${STEPS.length}</strong> saved</p>
      <ol class="profile-check-list">${items}</ol>
    </nav>`;
  }

  function identiconSrc(address) {
    const addr = String(address || "").trim();
    return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(addr) ? `/identicon/${addr}.svg` : "";
  }

  function iconSrc(value, address) {
    const text = String(value || "").trim();
    if (/^https:\/\//i.test(text) || /^data:image\//i.test(text) || /^\/(?!\/)/.test(text)) {
      return text;
    }
    return identiconSrc(address);
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

  function trustHtml(snapshot) {
    const pnd = snapshot?.trustLines?.pnd || { status: "loading", note: "Reading validated ledger…" };
    const rpnd = snapshot?.trustLines?.rpnd || { status: "loading", note: "Reading validated ledger…" };
    const pndLabel = pnd.status === "set" ? "Set" : pnd.status === "missing" ? "Missing" : "…";
    const rpndLabel = rpnd.status === "not_issued" ? "Missing / not issued" : rpnd.status === "missing" ? "Missing" : "…";
    return `<section class="profile-trust" aria-label="Trust lines">
      <p class="profile-kicker">Trust lines</p>
      <div class="profile-trust-grid">
        <div class="profile-trust-row" data-trust="pnd" data-state="${esc(pnd.status)}">
          <span>$PND</span>
          <strong>${esc(pndLabel)}</strong>
          <em>${esc(pnd.note || "")}</em>
        </div>
        <div class="profile-trust-row" data-trust="rpnd" data-state="${esc(rpnd.status)}">
          <span>$rPND</span>
          <strong>${esc(rpndLabel)}</strong>
          <em>${esc(rpnd.note || "")}</em>
        </div>
      </div>
      <p class="profile-form-note"><a href="/start/trust-lines/">Set trust lines</a> when you are ready. $PND is set when a line to this issuer exists, even at 0.</p>
    </section>`;
  }

  function membershipHtml(snapshot) {
    const note = snapshot?.membership?.note || "None yet. A membership or seat NFT is not minted.";
    return `<section class="profile-membership" aria-label="Membership">
      <p class="profile-kicker">Membership / seat NFT</p>
      <p class="profile-form-note">${esc(note)}</p>
    </section>`;
  }

  function airdropHtml(snapshot) {
    const hold = snapshot?.airdrop?.hold ?? "0";
    const note =
      snapshot?.airdrop?.note ||
      "Snapshot eligibility is later. Hold amount only — not an APY. $PND is not issued.";
    return `<section class="profile-airdrop" aria-label="Airdrop snapshot">
      <p class="profile-kicker">Airdrop snapshot</p>
      <p class="profile-form-note">Current $PND hold: <strong>${esc(hold)}</strong>. ${esc(note)}</p>
    </section>`;
  }

  function sessionMetaHtml() {
    const session = window.PondSession?.current?.() || {};
    const method = session.method === "xaman" ? "Xaman" : session.method === "walletconnect" ? "WalletConnect" : "";
    return `<section class="profile-session-meta" aria-label="Session">
      <p class="profile-kicker">Session</p>
      <p>Signed in with ${esc(method || "unknown")}.</p>
      <p class="profile-form-note">Idle timeout is 24 hours. This session expires ${esc(formatWhen(session.expiresAt))} if unused.</p>
    </section>`;
  }

  function activityHtml(profile) {
    return `<section class="profile-activity" aria-label="Account activity">
      <p class="profile-kicker">Activity</p>
      <dl class="profile-activity-list">
        <div><dt>Last sign-in</dt><dd>${esc(formatWhen(profile.lastSignedInAt))}</dd></div>
        <div><dt>Last disclaimer accept</dt><dd>${esc(formatWhen(profile.disclaimerAcceptedAt))}</dd></div>
        <div><dt>Last profile save</dt><dd>${esc(formatWhen(profile.lastSavedAt))}</dd></div>
      </dl>
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
      <p class="profile-kicker">Profile</p>
      <p>${copy}</p>
      ${session?.address ? sessionMetaHtml() : ""}
      ${session?.address ? signOutHtml() : ""}
    </div>`;
  }

  function cardHtml(profile) {
    const name = profile.displayName || profile.handle;
    const admin = profile.admin ? `<span class="profile-admin">Admin</span>` : "";
    const icon = iconSrc(profile.icon, profile.address);
    const iconUrl = /^https:\/\//i.test(profile.icon || "") ? profile.icon : "";
    return `<div class="profile-card" data-profile-card>
      <div class="profile-id">
        <div class="profile-icon-wrap">
          <img class="profile-icon" data-profile-icon src="${esc(icon)}" width="72" height="72" alt="">
          <button type="button" class="profile-icon-edit" data-profile-icon-edit aria-label="Edit profile photo">Edit</button>
          <input class="profile-icon-file" type="file" name="iconFile" data-profile-icon-file accept="image/png,image/jpeg,image/webp,image/gif" hidden>
        </div>
        <h2>${esc(name)}</h2>
        ${admin}
      </div>
      <p class="profile-handle">/profile/${esc(profile.handle)}/</p>
      <p class="profile-address" title="${esc(profile.address)}">${esc(shortAddr(profile.address))}</p>
      ${sessionMetaHtml()}
      <div class="profile-quick-actions">
        <button type="button" class="button button-quiet" data-review-disclaimer>Review disclaimer</button>
        <button type="button" class="button button-quiet" data-privacy-controls>Privacy Controls</button>
      </div>
      ${balancesHtml(profile.balances)}
      ${trustHtml(profile.balances)}
      ${membershipHtml(profile.balances)}
      ${airdropHtml(profile.balances)}
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
          <span>Profile photo URL</span>
          <input type="url" name="icon" maxlength="500" value="${esc(iconUrl)}" placeholder="https://… or leave blank for the generated photo" autocomplete="off">
        </label>
        <label class="profile-public-card">
          <input type="checkbox" name="publicCard" ${profile.publicCard ? "checked" : ""}>
          <span>Show a public card (handle + avatar only — never the address)</span>
        </label>
        <p class="profile-form-note">Public card URL: <a href="/card/${esc(profile.handle)}/">/card/${esc(profile.handle)}/</a>. Visible only if you turn it on. Full profile stays Xaman-only. Never a seed, password, or private key.</p>
        <p class="profile-form-status" data-profile-status hidden></p>
        <div class="profile-form-actions">
          <button type="submit" class="button">Save profile</button>
        </div>
      </form>
      ${activityHtml(profile)}
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
    const fileInput = document.querySelector("[data-profile-icon-file]");
    const openPicker = () => fileInput?.click();
    document.querySelector("[data-profile-icon-edit]")?.addEventListener("click", (event) => {
      event.preventDefault();
      openPicker();
    });
    document.querySelector("[data-profile-icon]")?.addEventListener("click", openPicker);
    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const data = await readIconFile(file);
        form.dataset.iconData = data;
        if (form.icon) form.icon.value = "";
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
        publicCard: Boolean(form.publicCard?.checked),
      };
      try {
        const saved = await saveOwn(body);
        window.PondSession?.patch?.({
          icon: saved.icon || "",
          handle: saved.handle || "",
          displayName: saved.displayName || "",
        });
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
      document.title = "Profile — Pond Protocol";
      return;
    }
    mount.innerHTML = cardHtml(profile);
    bindForm(profile);
    bindSignOut(mount);
    mount.querySelector("[data-review-disclaimer]")?.addEventListener("click", () => {
      window.PondDisclaimer?.open?.();
    });
    mount.querySelector("[data-privacy-controls]")?.addEventListener("click", () => {
      window.PondPrivacy?.openVault?.();
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
