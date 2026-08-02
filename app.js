import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const records = [
  {
    id: "articles",
    title: "Articles of incorporation",
    group: "governance",
    description: "The association's corporate formation document and each amendment.",
    cadence: "Keep current version and amendments available",
    access: "Protected owner portal",
  },
  {
    id: "bylaws",
    title: "Recorded bylaws",
    group: "governance",
    description: "Recorded bylaws that explain association governance, meetings, officers, and operating rules.",
    cadence: "Keep current version and amendments available",
    access: "Protected owner portal",
  },
  {
    id: "declaration",
    title: "Declaration or covenants",
    group: "governance",
    description: "The recorded declaration of condominium or declaration of covenants, plus amendments.",
    cadence: "Keep current version and amendments available",
    access: "Protected owner portal",
  },
  {
    id: "rules",
    title: "Current association rules",
    group: "governance",
    description: "The current rules owners must follow, separate from the declaration and bylaws when applicable.",
    cadence: "Update whenever rules change",
    access: "Protected owner portal",
  },
  {
    id: "contracts",
    title: "Contracts and obligation lists",
    group: "financial",
    description: "Current executory contracts and documents creating obligations for the association or owners.",
    cadence: "Refresh as contracts are added, renewed, or closed",
    access: "Protected owner portal",
  },
  {
    id: "bids",
    title: "Bid lists after bidding closes",
    group: "financial",
    description: "A list of bids received for related materials, equipment, services, or work once bidding has closed.",
    cadence: "Keep bid records for the required retention period",
    access: "Protected owner portal",
  },
  {
    id: "budgets",
    title: "Annual and proposed budgets",
    group: "financial",
    description: "The adopted annual budget and any proposed budget being considered at the annual meeting.",
    cadence: "Post current budget and proposed annual meeting budget",
    access: "Protected owner portal",
  },
  {
    id: "financials",
    title: "Financial reports and monthly statements",
    group: "financial",
    description: "Required financial reports and monthly income or expense statements considered at meetings.",
    cadence: "Post required report and relevant meeting statements",
    access: "Protected owner portal",
  },
  {
    id: "director-certifications",
    title: "Director education or certification records",
    group: "controls",
    description: "Records showing required director certification or board member education completion.",
    cadence: "Update as directors join or renew requirements",
    access: "Protected owner portal",
  },
  {
    id: "conflicts",
    title: "Conflict and related-party documents",
    group: "controls",
    description: "Contracts, transactions, or documents involving actual or possible conflicts of interest.",
    cadence: "Post when such documents exist",
    access: "Protected owner portal after redaction review",
  },
  {
    id: "owner-meetings",
    title: "Owner meeting notices and agendas",
    group: "meetings",
    description: "Scheduled member or unit owner meeting notices, agendas, and documents to be voted on or considered.",
    cadence: "Post by required meeting notice dates",
    access: "Notice area plus protected documents",
  },
  {
    id: "board-meetings",
    title: "Board meeting notices and agendas",
    group: "meetings",
    description: "Board meeting notices, agendas, and documents required for the meeting.",
    cadence: "Post no later than the legally required notice date",
    access: "Notice area plus protected documents",
  },
  {
    id: "redaction-policy",
    title: "Redaction and access policy",
    group: "controls",
    description: "Internal safeguards for owner-only access, username/password delivery, and restricted information review.",
    cadence: "Review before every publication cycle",
    access: "Admin workflow with owner-facing request path",
  },
];

const groupLabels = {
  governance: "Governance",
  financial: "Financial",
  meetings: "Meetings",
  controls: "Controls",
};

const grid = document.querySelector("#recordGrid");
const searchInput = document.querySelector("#searchInput");
const filterButtons = document.querySelectorAll(".filter-button");
const form = document.querySelector("#accessForm");
const formStatus = document.querySelector("#formStatus");
const installButton = document.querySelector("#installButton");
const accountForm = document.querySelector("#accountForm");
const accountStatus = document.querySelector("#accountStatus");
const userList = document.querySelector("#userList");
const sessionCard = document.querySelector("#sessionCard");
const documentForm = document.querySelector("#documentForm");
const documentStatus = document.querySelector("#documentStatus");
const documentList = document.querySelector("#documentList");
const documentCategory = document.querySelector("#documentCategory");
const githubForm = document.querySelector("#githubForm");
const githubStatus = document.querySelector("#githubStatus");
const supabaseForm = document.querySelector("#supabaseForm");
const supabaseStatus = document.querySelector("#supabaseStatus");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");

let activeFilter = "all";
let installPrompt;
const defaultUsers = [
  { id: "admin", name: "Portal Admin", email: "admin@example.com", role: "Admin", passwordHash: "" },
  { id: "owner", name: "Sample Owner", email: "owner@example.com", role: "Owner", passwordHash: "" },
];

const defaultVisibility = records.reduce((settings, record) => {
  settings[record.id] = record.group === "meetings" ? "public" : "protected";
  return settings;
}, {});

let users = readStored("association-records-users", defaultUsers);
let activeUserId = localStorage.getItem("association-records-active-user") || "guest";
let visibility = readStored("association-records-visibility", defaultVisibility);
let documents = readStored("association-records-documents", []);
let githubConfig = readStored("association-records-github-config", null);
let githubToken = "";
let supabaseConfig = readStored("association-records-supabase-config", null);
let supabase = supabaseConfig ? createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
let supabaseSession = null;
let supabaseProfile = null;

function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem("association-records-users", JSON.stringify(users));
  localStorage.setItem("association-records-active-user", activeUserId);
  localStorage.setItem("association-records-visibility", JSON.stringify(visibility));
  localStorage.setItem("association-records-documents", JSON.stringify(documents));
  if (githubConfig) {
    localStorage.setItem("association-records-github-config", JSON.stringify(githubConfig));
  }
  if (supabaseConfig) {
    localStorage.setItem("association-records-supabase-config", JSON.stringify(supabaseConfig));
  }
}

function activeUser() {
  if (supabaseSession) {
    return {
      id: supabaseSession.user.id,
      name: supabaseProfile?.full_name || supabaseSession.user.email,
      email: supabaseSession.user.email,
      role: supabaseProfile?.role || "Owner",
    };
  }
  if (activeUserId === "guest") {
    return { id: "guest", name: "Visitor", email: "Not signed in", role: "Visitor" };
  }
  return users.find((user) => user.id === activeUserId) || { id: "guest", name: "Visitor", email: "Not signed in", role: "Visitor" };
}

function isAuthenticated() {
  return activeUser().role !== "Visitor";
}

function isAdmin() {
  return activeUser()?.role === "Admin";
}

function canView(status) {
  return status === "public" || isAuthenticated();
}

function encodeBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function fileToBase64(file) {
  return fileToDataUrl(file).then((dataUrl) => dataUrl.split(",")[1]);
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function githubRequest(path, options = {}) {
  if (!githubConfig || !githubToken) {
    throw new Error("Connect GitHub storage as an admin first.");
  }

  const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });

  if (response.status === 404 && options.allowMissing) return null;
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.message || "GitHub request failed.");
  }
  return response.json();
}

async function commitJson(path, value, message) {
  const existing = await githubRequest(`${path}?ref=${githubConfig.branch}`, { allowMissing: true });
  return githubRequest(path, {
    method: "PUT",
    body: JSON.stringify({
      message,
      branch: githubConfig.branch,
      content: encodeBase64(JSON.stringify(value, null, 2)),
      sha: existing?.sha,
    }),
  });
}

async function commitFile(path, file, message) {
  const existing = await githubRequest(`${path}?ref=${githubConfig.branch}`, { allowMissing: true });
  return githubRequest(path, {
    method: "PUT",
    body: JSON.stringify({
      message,
      branch: githubConfig.branch,
      content: await fileToBase64(file),
      sha: existing?.sha,
    }),
  });
}

function safePathPart(value) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-|-$/g, "");
}

async function loadSupabaseState() {
  if (!supabase) return;

  const { data: sessionData } = await supabase.auth.getSession();
  supabaseSession = sessionData.session;
  supabaseProfile = null;

  if (supabaseSession) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", supabaseSession.user.id).maybeSingle();
    supabaseProfile = profile;
  }

  const { data: remoteDocuments } = await supabase.from("official_documents").select("*").order("uploaded_at", { ascending: false });
  if (remoteDocuments) {
    documents = remoteDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      recordId: document.record_id,
      visibility: document.visibility,
      fileName: document.file_name,
      fileType: document.file_type,
      storagePath: document.storage_path,
      uploadedAt: document.uploaded_at,
      uploadedBy: document.uploaded_by,
    }));
  }
}

async function uploadToSupabase(file, documentRecord) {
  if (!supabase || !supabaseSession) {
    throw new Error("Connect Supabase and sign in before uploading.");
  }

  const storagePath = `${documentRecord.recordId}/${Date.now()}-${safePathPart(file.name)}`;
  const upload = await supabase.storage.from(supabaseConfig.bucket).upload(storagePath, file, { upsert: false });
  if (upload.error) throw upload.error;

  const insert = await supabase
    .from("official_documents")
    .insert({
      title: documentRecord.title,
      record_id: documentRecord.recordId,
      visibility: documentRecord.visibility,
      file_name: file.name,
      file_type: file.type || "application/octet-stream",
      storage_path: storagePath,
      uploaded_by: supabaseSession.user.email,
    })
    .select()
    .single();

  if (insert.error) throw insert.error;
  return insert.data;
}

async function openSupabaseDocument(document) {
  const { data, error } = await supabase.storage.from(supabaseConfig.bucket).createSignedUrl(document.storagePath, 60);
  if (error) {
    documentStatus.textContent = error.message;
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener");
}

function renderRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = records.filter((record) => {
    const matchesFilter = activeFilter === "all" || record.group === activeFilter;
    const searchable = `${record.title} ${record.description} ${record.cadence} ${record.access}`.toLowerCase();
    return matchesFilter && searchable.includes(query);
  });

  grid.innerHTML = filtered
    .map(
      (record) => {
        const status = visibility[record.id] || "protected";
        const visibleDocumentCount = documents.filter((document) => document.recordId === record.id && canView(document.visibility)).length;
        return `
        <article class="record-card ${status === "protected" ? "is-protected" : ""}">
          <div class="record-topline">
            <span class="record-tag">${groupLabels[record.group]}</span>
            <span class="access-badge ${status}">${status}</span>
          </div>
          <h3>${record.title}</h3>
          <p>${record.description}</p>
          <div class="record-meta">
            <span>${record.cadence}</span>
            <span>${canView(status) ? (status === "protected" ? record.access : "Public notice area") : "Sign in required"}</span>
            <span>${visibleDocumentCount} visible official document${visibleDocumentCount === 1 ? "" : "s"}</span>
          </div>
          ${
            isAdmin()
              ? `<div class="visibility-control">
                  <label>Visibility</label>
                  <div class="segmented" role="group" aria-label="Visibility for ${record.title}">
                    <button type="button" class="${status === "public" ? "is-selected" : ""}" data-record="${record.id}" data-visibility="public">Public</button>
                    <button type="button" class="${status === "protected" ? "is-selected" : ""}" data-record="${record.id}" data-visibility="protected">Protected</button>
                  </div>
                </div>`
              : ""
          }
        </article>
      `;
      },
    )
    .join("");

  if (!filtered.length) {
    grid.innerHTML = `<p>No shared records match that search yet.</p>`;
  }

  document.querySelectorAll("[data-record][data-visibility]").forEach((button) => {
    button.addEventListener("click", () => {
      visibility[button.dataset.record] = button.dataset.visibility;
      saveState();
      renderRecords();
      renderSession();
      renderDocuments();
    });
  });
}

function renderSession() {
  const user = activeUser();
  const protectedCount = Object.values(visibility).filter((status) => status === "protected").length;
  const publicCount = records.length - protectedCount;

  sessionCard.innerHTML = `
    <h3>Current session</h3>
    <p><strong>${user.name}</strong><br />${user.email}<br /><span class="role-pill">${user.role}</span></p>
    <p>${publicCount} public categories and ${protectedCount} protected categories are configured. ${
      isAuthenticated() ? "Protected documents are available to this session." : "Protected documents are hidden until sign-in."
    }</p>
    <p>${githubConfig ? `GitHub storage target: ${githubConfig.owner}/${githubConfig.repo}@${githubConfig.branch}.` : "GitHub storage is not connected for this session."}</p>
    <p>${supabase ? `Supabase is connected${supabaseSession ? " and signed in" : ""}.` : "Supabase is not connected yet."}</p>
    <div class="session-actions">
      <button class="plain-button" type="button" data-login="guest">Continue as visitor</button>
      ${supabaseSession ? `<button class="plain-button" type="button" id="supabaseSignOut">Sign out of Supabase</button>` : ""}
      ${users
        .map(
          (account) =>
            `<button class="plain-button" type="button" data-login="${account.id}">Sign in as ${account.name}</button>`,
        )
        .join("")}
    </div>
  `;

  sessionCard.querySelectorAll("[data-login]").forEach((button) => {
    button.addEventListener("click", () => {
      activeUserId = button.dataset.login;
      saveState();
      renderSession();
      renderUsers();
      renderRecords();
      renderDocuments();
    });
  });

  document.querySelector("#supabaseSignOut")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    supabaseSession = null;
    supabaseProfile = null;
    renderSession();
    renderDocuments();
    renderRecords();
  });
}

function renderUsers() {
  userList.innerHTML = `
    <h3>Demo users</h3>
    ${users
      .map(
        (user) => `
          <div class="user-row">
            <div>
              <strong>${user.name}</strong>
              <span>${user.email}</span>
              <span class="role-pill">${user.role}</span>
            </div>
            <button class="plain-button" type="button" data-login="${user.id}">${user.id === activeUserId ? "Signed in" : "Use account"}</button>
          </div>
        `,
      )
      .join("")}
  `;

  userList.querySelectorAll("[data-login]").forEach((button) => {
    button.addEventListener("click", () => {
      activeUserId = button.dataset.login;
      saveState();
      renderSession();
      renderUsers();
      renderRecords();
      renderDocuments();
    });
  });
}

function renderDocumentCategoryOptions() {
  documentCategory.innerHTML = records.map((record) => `<option value="${record.id}">${record.title}</option>`).join("");
}

function renderDocuments() {
  documentForm.classList.toggle("is-hidden", !isAdmin());

  const visibleDocuments = documents.filter((document) => canView(document.visibility));
  const lockedCount = documents.length - visibleDocuments.length;

  if (!documents.length) {
    documentList.innerHTML = `<article class="document-row"><div><h3>No official documents uploaded yet</h3><p>Sign in as an admin to add the first document.</p></div></article>`;
    return;
  }

  documentList.innerHTML = `
    ${visibleDocuments
      .map((document) => {
        const record = records.find((item) => item.id === document.recordId);
        return `
          <article class="document-row">
            <div>
              <h3>${document.title}</h3>
              <div class="document-details">
                <span>${record?.title || "Shared category"}</span>
                <span>${document.fileName}</span>
                <span>${new Date(document.uploadedAt).toLocaleDateString()}</span>
                <span class="access-badge ${document.visibility}">${document.visibility}</span>
              </div>
            </div>
            <div class="document-actions">
              ${
                document.storagePath
                  ? `<button class="plain-button" type="button" data-download-document="${document.id}">Download</button>`
                  : `<a class="plain-button" href="${document.dataUrl}" download="${document.fileName}">Download</a>`
              }
              ${
                isAdmin()
                  ? `<button class="danger-button" type="button" data-delete-document="${document.id}">Delete</button>`
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("")}
    ${
      lockedCount
        ? `<article class="document-row is-locked"><div><h3>${lockedCount} protected document${lockedCount === 1 ? " is" : "s are"} hidden</h3><p>Sign in with an owner, board, or admin account to view protected official records.</p></div></article>`
        : ""
    }
  `;

  documentList.querySelectorAll("[data-delete-document]").forEach((button) => {
    button.addEventListener("click", async () => {
      const document = documents.find((item) => item.id === button.dataset.deleteDocument);
      if (supabase && document?.storagePath) {
        await supabase.storage.from(supabaseConfig.bucket).remove([document.storagePath]);
        await supabase.from("official_documents").delete().eq("id", document.id);
      }
      documents = documents.filter((item) => item.id !== button.dataset.deleteDocument);
      saveState();
      renderDocuments();
      renderRecords();
    });
  });

  documentList.querySelectorAll("[data-download-document]").forEach((button) => {
    button.addEventListener("click", () => {
      const document = documents.find((item) => item.id === button.dataset.downloadDocument);
      openSupabaseDocument(document);
    });
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderRecords();
  });
});

searchInput.addEventListener("input", renderRecords);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  localStorage.setItem("association-records-access-request", JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
  formStatus.textContent = "Request saved on this device for prototype review.";
  form.reset();
});

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(accountForm).entries());
  if (supabase) {
    if (!isAdmin()) {
      accountStatus.textContent = "Sign in as an admin before creating Supabase accounts.";
      return;
    }
    const signup = await supabase.auth.signUp({ email: data.email, password: data.password });
    if (signup.error) {
      accountStatus.textContent = signup.error.message;
      return;
    }
    const userId = signup.data.user?.id;
    if (userId) {
      const profile = await supabase.from("profiles").upsert({ id: userId, email: data.email, full_name: data.name, role: data.role });
      if (profile.error) {
        accountStatus.textContent = profile.error.message;
        return;
      }
    }
    accountStatus.textContent = `${data.name} created in Supabase.`;
    accountForm.reset();
    await loadSupabaseState();
    renderSession();
    renderUsers();
    renderRecords();
    renderDocuments();
    return;
  }

  const account = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    role: data.role,
    passwordHash: await hashPassword(data.password),
  };
  users = [...users, account];
  activeUserId = account.id;
  saveState();
  if (githubConfig && githubToken && isAdmin()) {
    await commitJson("data/users.json", users, `Add portal user ${account.email}`);
  }
  accountStatus.textContent = `${account.name} created and signed in.`;
  accountForm.reset();
  renderSession();
  renderUsers();
  renderRecords();
  renderDocuments();
});

supabaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(supabaseForm).entries());
  supabaseConfig = {
    url: data.url.trim(),
    anonKey: data.anonKey.trim(),
    bucket: data.bucket.trim() || "official-documents",
  };
  supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  saveState();
  await loadSupabaseState();
  supabaseStatus.textContent = "Supabase connected. Sign in to load protected records.";
  supabaseForm.reset();
  renderSession();
  renderDocuments();
  renderRecords();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) {
    loginStatus.textContent = "Connect Supabase first.";
    return;
  }
  const data = Object.fromEntries(new FormData(loginForm).entries());
  const result = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
  if (result.error) {
    loginStatus.textContent = result.error.message;
    return;
  }
  await loadSupabaseState();
  loginStatus.textContent = "Signed in.";
  loginForm.reset();
  renderSession();
  renderDocuments();
  renderRecords();
});

githubForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin()) {
    githubStatus.textContent = "Sign in as an admin before connecting GitHub storage.";
    return;
  }

  const data = Object.fromEntries(new FormData(githubForm).entries());
  githubConfig = {
    owner: data.owner.trim(),
    repo: data.repo.trim(),
    branch: data.branch.trim() || "main",
  };
  githubToken = data.token;
  saveState();

  try {
    await commitJson("data/users.json", users, "Initialize portal users");
    await commitJson("data/documents.json", documents, "Initialize portal document index");
    githubStatus.textContent = "GitHub storage connected for this browser session.";
    githubForm.reset();
    renderSession();
  } catch (error) {
    githubStatus.textContent = error.message;
  }
});

documentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;

  const data = Object.fromEntries(new FormData(documentForm).entries());
  const file = documentForm.elements.file.files[0];
  if (supabase) {
    try {
      const uploaded = await uploadToSupabase(file, {
        title: data.title,
        recordId: data.recordId,
        visibility: data.visibility,
      });
      documents = [
        {
          id: uploaded.id,
          title: uploaded.title,
          recordId: uploaded.record_id,
          visibility: uploaded.visibility,
          fileName: uploaded.file_name,
          fileType: uploaded.file_type,
          storagePath: uploaded.storage_path,
          uploadedAt: uploaded.uploaded_at,
          uploadedBy: uploaded.uploaded_by,
        },
        ...documents,
      ];
      documentStatus.textContent = `${data.title} uploaded to Supabase as ${data.visibility}.`;
      documentForm.reset();
      renderDocuments();
      renderRecords();
      renderSession();
      return;
    } catch (error) {
      documentStatus.textContent = error.message;
      return;
    }
  }

  const dataUrl = await fileToDataUrl(file);
  const documentId = crypto.randomUUID();
  const githubPath = `official-documents/${data.recordId}/${Date.now()}-${safePathPart(file.name)}`;

  documents = [
    {
      id: documentId,
      title: data.title,
      recordId: data.recordId,
      visibility: data.visibility,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      githubPath,
      uploadedAt: new Date().toISOString(),
      uploadedBy: activeUser().email,
      dataUrl,
    },
    ...documents,
  ];

  saveState();
  try {
    if (githubConfig && githubToken) {
      await commitFile(githubPath, file, `Upload official document ${data.title}`);
      await commitJson("data/documents.json", documents.map(({ dataUrl: _dataUrl, ...document }) => document), `Update document index for ${data.title}`);
      documentStatus.textContent = `${data.title} uploaded to GitHub as ${data.visibility}.`;
    } else {
      documentStatus.textContent = `${data.title} uploaded locally. Connect GitHub storage to commit it to the repository.`;
    }
    documentForm.reset();
    renderDocuments();
    renderRecords();
    renderSession();
  } catch (error) {
    documents = documents.filter((document) => document.id !== documentId);
    saveState();
    documentStatus.textContent = error.message;
    renderDocuments();
    renderRecords();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.classList.add("can-install");
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = undefined;
  installButton.classList.remove("can-install");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

renderRecords();
renderSession();
renderUsers();
renderDocumentCategoryOptions();
renderDocuments();
