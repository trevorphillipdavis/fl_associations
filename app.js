const records = [
  {
    id: "articles",
    title: "Articles of incorporation",
    group: "governance",
    description: "The association's corporate formation document and each amendment.",
    access: "Protected owner portal",
  },
  {
    id: "bylaws",
    title: "Recorded bylaws",
    group: "governance",
    description: "Recorded bylaws that explain association governance, meetings, officers, and operating rules.",
    access: "Protected owner portal",
  },
  {
    id: "declaration",
    title: "Declaration or covenants",
    group: "governance",
    description: "The recorded declaration of covenants, plus amendments.",
    access: "Protected owner portal",
  },
  {
    id: "rules",
    title: "Current association rules",
    group: "governance",
    description: "The current rules owners must follow, separate from the declaration and bylaws when applicable.",
    access: "Protected owner portal",
  },
  {
    id: "contracts",
    title: "Contracts and obligation lists",
    group: "financial",
    description: "Current executory contracts and documents creating obligations for the association or owners.",
    access: "Protected owner portal",
  },
  {
    id: "bids",
    title: "Bid lists after bidding closes",
    group: "financial",
    description: "A list of bids received for related materials, equipment, services, or work once bidding has closed.",
    access: "Protected owner portal",
  },
  {
    id: "budgets",
    title: "Annual and proposed budgets",
    group: "financial",
    description: "The adopted annual budget and any proposed budget being considered at the annual meeting.",
    access: "Protected owner portal",
  },
  {
    id: "financials",
    title: "Financial reports and monthly statements",
    group: "financial",
    description: "Required financial reports and monthly income or expense statements considered at meetings.",
    access: "Protected owner portal",
  },
  {
    id: "director-certifications",
    title: "Director education or certification records",
    group: "controls",
    description: "Records showing required director certification or board member education completion.",
    access: "Protected owner portal",
  },
  {
    id: "conflicts",
    title: "Conflict and related-party documents",
    group: "controls",
    description: "Contracts, transactions, or documents involving actual or possible conflicts of interest.",
    access: "Protected owner portal after redaction review",
  },
  {
    id: "owner-meetings",
    title: "Owner meeting notices and agendas",
    group: "meetings",
    description: "Scheduled member or owner meeting notices, agendas, and documents to be voted on or considered.",
    access: "Notice area plus protected documents",
  },
  {
    id: "board-meetings",
    title: "Board meeting notices and agendas",
    group: "meetings",
    description: "Board meeting notices, agendas, and documents required for the meeting.",
    access: "Notice area plus protected documents",
  },
  {
    id: "redaction-policy",
    title: "Redaction and access policy",
    group: "controls",
    description: "Internal safeguards for owner-only access, username/password delivery, and restricted information review.",
    access: "Admin workflow with owner-facing request path",
  },
];

const groupLabels = {
  governance: "Governance",
  financial: "Financial",
  meetings: "Meetings",
  controls: "Controls",
};

const defaultVisibility = records.reduce((settings, record) => {
  settings[record.id] = record.group === "meetings" ? "public" : "protected";
  return settings;
}, {});

const grid = document.querySelector("#recordGrid");
const searchInput = document.querySelector("#searchInput");
const filterButtons = document.querySelectorAll(".filter-button");
const accessForm = document.querySelector("#accessForm");
const formStatus = document.querySelector("#formStatus");
const showRequestAccess = document.querySelector("#showRequestAccess");
const showLogin = document.querySelector("#showLogin");
const installButton = document.querySelector("#installButton");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const accountSection = document.querySelector("#account");
const navAccount = document.querySelector("#navAccount");
const authLinks = document.querySelectorAll("[data-auth-link]");
const sessionCard = document.querySelector("#sessionCard");
const adminSection = document.querySelector("[data-admin-section]");
const documentForm = document.querySelector("#documentForm");
const documentStatus = document.querySelector("#documentStatus");
const documentCategory = document.querySelector("#documentCategory");
const categoryPage = document.querySelector("#categoryPage");

let activeFilter = "all";
let installPrompt;
let currentUser = null;
let users = [];
let documents = [];
let visibility = { ...defaultVisibility };

async function loadJson(path, fallback) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return fallback;
    return response.json();
  } catch {
    return fallback;
  }
}

async function loadRepositoryData() {
  const [loadedUsers, loadedDocuments] = await Promise.all([
    loadJson("./data/users.json", []),
    loadJson("./data/documents.json", []),
  ]);

  users = loadedUsers;
  documents = loadedDocuments;
  visibility = {
    ...defaultVisibility,
    ...Object.fromEntries(documents.map((document) => [document.recordId, document.visibility])),
  };

  const savedUserId = sessionStorage.getItem("encantada-current-user");
  currentUser = users.find((user) => user.id === savedUserId) || null;
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function activeUser() {
  return currentUser || { id: "visitor", name: "Visitor", email: "Not signed in", role: "Visitor" };
}

function isAuthenticated() {
  return Boolean(currentUser);
}

function isAdmin() {
  return currentUser?.role === "Admin";
}

function canView(status) {
  return status === "public" || isAuthenticated();
}

function safePathPart(value) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-|-$/g, "");
}

function categoryFolder(recordId) {
  const record = records.find((item) => item.id === recordId);
  return safePathPart(record?.title || recordId);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function renderRecords() {
  const selectedRecordId = currentSectionId();
  const query = searchInput.value.trim().toLowerCase();
  const filtered = records.filter((record) => {
    const matchesFilter = activeFilter === "all" || record.group === activeFilter;
    const searchable = `${record.title} ${record.description} ${record.access}`.toLowerCase();
    return matchesFilter && searchable.includes(query);
  });

  grid.innerHTML = filtered
    .map((record) => {
      const status = visibility[record.id] || "protected";
      const visibleDocumentCount = documents.filter((document) => document.recordId === record.id && canView(document.visibility)).length;

      return `
        <article class="record-card ${record.group} ${record.id === selectedRecordId ? "is-selected" : ""} ${status === "protected" ? "is-protected" : ""}" data-record-card="${record.id}">
          <div class="record-topline">
            <span class="record-tag ${record.group}">${groupLabels[record.group]}</span>
            <span class="access-badge ${status}">${status}</span>
          </div>
          <h3>${record.title}</h3>
          <p>${record.description}</p>
          <div class="record-meta">
            ${status === "protected" ? `<span>${canView(status) ? record.access : "Sign in required"}</span>` : ""}
            <span>${visibleDocumentCount} visible official document${visibleDocumentCount === 1 ? "" : "s"}</span>
          </div>
          <a class="card-action" href="#section/${record.id}">View documents</a>
        </article>
      `;
    })
    .join("");

  if (!filtered.length) {
    grid.innerHTML = `<p>No records match that search.</p>`;
  }

  grid.querySelectorAll("[data-record-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      window.location.hash = `section/${card.dataset.recordCard}`;
    });
  });
}

function renderSession() {
  const user = activeUser();

  accountSection.classList.toggle("is-hidden", isAuthenticated());
  navAccount.classList.toggle("is-hidden", !isAuthenticated());
  authLinks.forEach((link) => link.classList.toggle("is-hidden", isAuthenticated()));

  if (!isAuthenticated()) {
    sessionCard.innerHTML = "";
    navAccount.innerHTML = "";
    return;
  }

  sessionCard.innerHTML = "";
  navAccount.innerHTML = `
    <span>${user.role}</span>
    <button class="nav-signout" type="button" id="signOutButton">Sign out</button>
  `;

  document.querySelector("#signOutButton")?.addEventListener("click", () => {
    currentUser = null;
    sessionStorage.removeItem("encantada-current-user");
    loginStatus.textContent = "";
    loginForm.classList.remove("is-hidden");
    accessForm.classList.add("is-hidden");
    showRequestAccess.classList.remove("is-hidden");
    renderAll();
  });
}

function renderDocumentCategoryOptions() {
  documentCategory.innerHTML = records.map((record) => `<option value="${record.id}">${record.title}</option>`).join("");
}

function documentUrl(document) {
  if (document.dataUrl) return document.dataUrl;
  return document.path || "#";
}

function deletedDocumentPath(document) {
  const currentPath = document.path || `official-documents/${categoryFolder(document.recordId)}/${document.fileName}`;
  return currentPath.replace(/^official-documents\//, "deleted-documents/");
}

function activeDocuments() {
  return documents.filter((document) => !document.deletedAt);
}

function moveDocumentToDeleted(documentId) {
  const document = documents.find((item) => item.id === documentId);
  if (!document) return null;

  document.deletedAt = new Date().toISOString();
  document.deletedBy = activeUser().email;
  document.deletedPath = deletedDocumentPath(document);
  return document;
}

function currentSectionId() {
  const match = window.location.hash.match(/^#section\/(.+)$/);
  return match ? match[1] : "";
}

function isCategoryPage() {
  return Boolean(currentSectionId());
}

function renderCategoryPage() {
  const sectionId = currentSectionId();
  const record = records.find((item) => item.id === sectionId);

  categoryPage.classList.toggle("is-hidden", !record);
  grid.classList.toggle("is-hidden", Boolean(record));
  document.querySelector(".toolbar")?.classList.toggle("is-hidden", Boolean(record));

  if (!record) {
    categoryPage.innerHTML = "";
    return;
  }

  const currentDocuments = activeDocuments();
  const visibleDocuments = currentDocuments.filter((document) => document.recordId === record.id && canView(document.visibility));
  const lockedCount = currentDocuments.filter((document) => document.recordId === record.id && !canView(document.visibility)).length;

  categoryPage.innerHTML = `
    <a class="back-link" href="#library">Back to document sections</a>
    <div class="section-heading compact-heading">
      <h2>${record.title}</h2>
      <p>${record.description}</p>
    </div>
    <div class="document-list">
      ${
        visibleDocuments.length
          ? visibleDocuments
              .map(
                (document) => `
                  <article class="document-row">
                    <div>
                      <span class="document-date">${new Date(document.uploadedAt).toLocaleDateString()}</span>
                      <h3>${document.title}</h3>
                    </div>
                    <div class="document-actions">
                      <a class="plain-button" href="${documentUrl(document)}" target="_blank" rel="noopener">Open</a>
                      ${isAdmin() ? `<button class="danger-button" type="button" data-delete-document="${document.id}">Delete</button>` : ""}
                    </div>
                  </article>
                `,
              )
              .join("")
          : `<article class="document-row"><div><h3>No visible documents yet</h3><p>${lockedCount ? "Sign in to view protected placeholder documents in this section." : "Placeholder documents can be added to this section."}</p></div></article>`
      }
    </div>
  `;

  categoryPage.querySelectorAll("[data-delete-document]").forEach((button) => {
    button.addEventListener("click", () => {
      const document = documents.find((item) => item.id === button.dataset.deleteDocument);
      const confirmed = window.confirm(`Move "${document?.title || "this document"}" to deleted documents?`);
      if (!confirmed) return;

      const movedDocument = moveDocumentToDeleted(button.dataset.deleteDocument);
      documentStatus.textContent = movedDocument
        ? `Document marked deleted. Move the file from ${movedDocument.path} to ${movedDocument.deletedPath} and commit data/documents.json.`
        : "Document marked deleted.";
      renderAll();
    });
  });
}

function renderDocuments() {
  const showHomepageUpload = isAdmin() && !isCategoryPage();
  adminSection.classList.toggle("is-hidden", !showHomepageUpload);
  documentForm.classList.toggle("is-hidden", !showHomepageUpload);
}

function renderAll() {
  renderSession();
  renderRecords();
  renderCategoryPage();
  renderDocuments();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderRecords();
  });
});

searchInput.addEventListener("input", renderRecords);

window.addEventListener("hashchange", renderAll);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm).entries());
  const passwordHash = await hashPassword(data.password);
  const user = users.find((item) => item.email.toLowerCase() === data.email.toLowerCase() && item.passwordHash === passwordHash);

  if (!user) {
    loginStatus.textContent = "Email or password not recognized.";
    return;
  }

  currentUser = user;
  sessionStorage.setItem("encantada-current-user", user.id);
  loginStatus.textContent = "Signed in.";
  loginForm.reset();
  renderAll();
});

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.textContent = "Access request saved for this browser session.";
  accessForm.reset();
});

showRequestAccess.addEventListener("click", () => {
  accessForm.classList.remove("is-hidden");
  loginForm.classList.add("is-hidden");
  showRequestAccess.classList.add("is-hidden");
  accessForm.querySelector("input")?.focus();
});

showLogin.addEventListener("click", () => {
  loginForm.classList.remove("is-hidden");
  accessForm.classList.add("is-hidden");
  showRequestAccess.classList.remove("is-hidden");
  loginForm.querySelector("input")?.focus();
});

documentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin()) return;

  const data = Object.fromEntries(new FormData(documentForm).entries());
  const file = documentForm.elements.file.files[0];
  const dataUrl = await fileToDataUrl(file);
  const categoryVisibility = visibility[data.recordId] || defaultVisibility[data.recordId] || "protected";
  const document = {
    id: crypto.randomUUID(),
    title: data.title,
    recordId: data.recordId,
    visibility: categoryVisibility,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    path: `official-documents/${categoryFolder(data.recordId)}/${Date.now()}-${safePathPart(file.name)}`,
    uploadedAt: new Date().toISOString(),
    uploadedBy: activeUser().email,
    dataUrl,
  };

  documents = [document, ...documents];
  documentStatus.textContent = `Document staged as ${categoryVisibility}. Add the file to its category folder under official-documents/ and update data/documents.json before committing to GitHub.`;
  documentForm.reset();
  renderAll();
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

renderDocumentCategoryOptions();
loadRepositoryData().then(renderAll);
