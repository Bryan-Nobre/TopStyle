// assets/js/script.js
// Certifique-se de incluir antes no HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://qojmixmnztlyxvxyfayb.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvam1peG1uenRseXh2eHlmYXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzkzMjIsImV4cCI6MjA3NDkxNTMyMn0.cb5jpxtVc2MojINZPfv6fSTSMFhLpAP93IW6wCL0CMo";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const messageBox = document.getElementById("message");

  function showMsg(text, type = "info") {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
  }

  const form = document.getElementById("loginForm");
  if (form) {
    const emailInput = document.getElementById("email");
    const senhaInput = document.getElementById("senha");
    const toggle = document.getElementById("toggleSenha");
    const rememberCheckbox = document.getElementById("remember");
    const submitBtn = document.getElementById("submitBtn");

    const MAX_ATTEMPTS = 3;
    const LOCKOUT_SECONDS = 30;
    let attempts = 0;
    let lockoutTimer = null;

    if (toggle && senhaInput) {
      toggle.addEventListener("click", () => {
        if (senhaInput.type === "password") {
          senhaInput.type = "text";
          toggle.src = "img/olho.png";
        } else {
          senhaInput.type = "password";
          toggle.src = "img/olho (1).png";
        }
      });
    }

    if (localStorage.getItem("savedEmail") && emailInput) {
      emailInput.value = localStorage.getItem("savedEmail");
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    function startLockout(btn) {
      if (!btn) return;
      btn.disabled = true;
      let remaining = LOCKOUT_SECONDS;
      const originalText = btn.textContent;
      btn.textContent = `Bloqueado (${remaining}s)`;
      lockoutTimer = setInterval(() => {
        remaining--;
        btn.textContent = `Bloqueado (${remaining}s)`;
        if (remaining <= 0) {
          clearInterval(lockoutTimer);
          lockoutTimer = null;
          btn.disabled = false;
          btn.textContent = originalText;
          attempts = 0;
          showMsg("Você pode tentar novamente.", "info");
        }
      }, 1000);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = (emailInput?.value || "").trim();
      const senha = senhaInput?.value || "";

      if (!email || !senha) {
        showMsg("Preencha email e senha.", "error");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", email)
          .eq("senha", senha)
          .maybeSingle();

        if (error || !data) {
          attempts++;
          const remaining = MAX_ATTEMPTS - attempts;
          if (remaining > 0) {
            showMsg(`Email ou senha incorretos! ${remaining} tentativa(s) restante(s).`, "error");
          } else {
            showMsg(`Número máximo de tentativas atingido. Aguarde ${LOCKOUT_SECONDS}s.`, "error");
            startLockout(submitBtn);
          }
          return;
        }

        const role = data.role || "client";
        showMsg("Login realizado com sucesso! Redirecionando...", "success");

        if (rememberCheckbox?.checked) localStorage.setItem("savedEmail", email);
        else localStorage.removeItem("savedEmail");

        sessionStorage.setItem("isLogged", "true");
        sessionStorage.setItem("role", role);

        setTimeout(() => {
          window.location.href = "base.html";
        }, 1000);
      } catch (err) {
        console.error("Erro no login:", err);
        showMsg("Erro ao conectar. Veja o console para detalhes.", "error");
      }
    });
  }
});
// fim login

/* =========================================================
   GESTÃO DE PRODUTOS (BASE.HTML)
   - Persistência em localStorage (chave "products")
   - Edit / Delete / Add (só visíveis a admin)
   ========================================================= */
const productListEl = document.getElementById("product-list"); // .swiper-wrapper
const painelListEl = document.querySelector(".painel-list"); // painel lateral (se existir)
const ADD_BTN = document.getElementById("addProduct"); // botão +Adicionar (se existir)

// util: lê produtos salvos
function getStoredProducts() {
  try {
    const raw = localStorage.getItem("products");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao parsear products do localStorage:", e);
    return null;
  }
}

// util: salva e atualiza UI
function saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
  renderProducts(products);
  renderPainel(products);
}

// Se não houver products em storage, gera a partir do HTML atual (seed)
function seedProductsFromDOM() {
  const items = document.querySelectorAll("#product-list .product-item");
  const products = [];
  items.forEach((item) => {
    const img = item.querySelector(".img-cloth img")?.src || item.querySelector("img")?.src || "";
    const name = (item.querySelector(".name-cloth-link h2 a")?.textContent || item.querySelector(".name-cloth-link h2")?.textContent || "").trim();
    const price = item.querySelector(".name-cloth-link p span")?.textContent?.trim() || "";
    const installments = item.querySelector(".installments")?.textContent?.trim() || "";
    const details = item.querySelector(".btn-details")?.getAttribute("href") || "#";
    products.push({ img, name, price, installments, details });
  });
  if (products.length > 0) {
    localStorage.setItem("products", JSON.stringify(products));
    return products;
  }
  return [];
}

// Renderiza os produtos no #product-list
function renderProducts(products) {
  if (!productListEl) return;
  productListEl.innerHTML = "";

  products.forEach((prod, index) => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide product-item";
    slide.innerHTML = `
        <div class="product-card">
          <div class="img-cloth">
            <img src="${prod.img}" alt="${escapeHtml(prod.name)}">
            <div class="product-actions">
              <a href="${prod.details || '#'}" class="btn-details">Ver detalhes</a>
            </div>
          </div>
          <div class="name-cloth-link">
            <h2><a href="#">${escapeHtml(prod.name)}</a></h2>
            <p><span>${escapeHtml(prod.price)}</span></p>
            <small class="installments">${escapeHtml(prod.installments)}</small>
          </div>
          <div class="admin-actions ${isAdmin() ? "" : "hidden"}">
            <button class="btn-edit" data-id="${index}">Editar</button>
            <button class="btn-delete" data-id="${index}">Excluir</button>
          </div>
        </div>
      `;
    productListEl.appendChild(slide);
  });

  // Atualiza o Swiper (se existir)
  if (window.swiper && typeof window.swiper.update === "function") {
    try { window.swiper.update(); } catch (e) { /* ignore */ }
  }
}

// Render do painel lateral (se existir)
function renderPainel(products) {
  if (!painelListEl) return;
  painelListEl.innerHTML = "";
  products.forEach((prod, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
        <div class="painel-item">
          <img src="${prod.img}" alt="${escapeHtml(prod.name)}">
          <div class="info">
            <p>${escapeHtml(prod.name)}</p>
            <div class="actions">
              <button class="btn-edit" data-id="${index}">Editar</button>
              <button class="btn-delete" data-id="${index}">Excluir</button>
            </div>
          </div>
        </div>
      `;
    painelListEl.appendChild(li);
  });
}

// Helpers
function isAdmin() {
  const r = sessionStorage.getItem("role");
  return typeof r === "string" && r.toLowerCase() === "admin";
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Ações: editar (usa prompt), excluir, adicionar
function editProduct(index) {
  const products = getStoredProducts() || [];
  if (!products[index]) return;
  const p = products[index];

  const newImg = prompt("URL da imagem:", p.img) ?? p.img;
  const newName = prompt("Nome do produto:", p.name) ?? p.name;
  const newPrice = prompt("Preço (ex: R$ 129,00):", p.price) ?? p.price;
  const newInstallments = prompt("Parcelas:", p.installments) ?? p.installments;
  const newDetails = prompt("Link de detalhes (href):", p.details) ?? p.details;

  products[index] = {
    img: newImg,
    name: newName,
    price: newPrice,
    installments: newInstallments,
    details: newDetails,
  };

  saveProducts(products);
  showMsg("Produto atualizado.", "success");
}

function deleteProduct(index) {
  const products = getStoredProducts() || [];
  if (!products[index]) return;
  const ok = confirm("Confirma excluir este produto?");
  if (!ok) return;
  products.splice(index, 1);
  saveProducts(products);
  showMsg("Produto excluído.", "info");
}

function addProduct() {
  const products = getStoredProducts() || [];
  const img = prompt("URL da imagem: (ex: img/Modelo-01.webp)", "img/Modelo-01.webp") || "";
  const name = prompt("Nome do produto:", "Novo Produto") || "Novo Produto";
  const price = prompt("Preço (ex: R$ 129,00):", "R$ 129,00") || "R$ 0,00";
  const installments = prompt("Parcelas:", "ou 3x de R$ 43,30 sem juros") || "";
  const details = prompt("Link de detalhes (href):", "#") || "#";

  products.push({ img, name, price, installments, details });
  saveProducts(products);
  showMsg("Produto adicionado.", "success");
}



// Delegação de eventos para Edit / Delete (no product list e painel)
function attachDelegatedListeners() {
  // product list (swiper)
  if (productListEl) {
    productListEl.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".btn-edit");
      if (editBtn) {
        const id = parseInt(editBtn.dataset.id, 10);
        if (!isNaN(id)) editProduct(id);
        return;
      }
      const delBtn = e.target.closest(".btn-delete");
      if (delBtn) {
        const id = parseInt(delBtn.dataset.id, 10);
        if (!isNaN(id)) deleteProduct(id);
        return;
      }
    });
  }

  // painel lateral (delegado também por safety)
  if (painelListEl) {
    painelListEl.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".btn-edit");
      if (editBtn) {
        const id = parseInt(editBtn.dataset.id, 10);
        if (!isNaN(id)) editProduct(id);
        return;
      }
      const delBtn = e.target.closest(".btn-delete");
      if (delBtn) {
        const id = parseInt(delBtn.dataset.id, 10);
        if (!isNaN(id)) deleteProduct(id);
        return;
      }
    });
  }

  // botão adicionar (se existir)
  if (ADD_BTN) {
    ADD_BTN.addEventListener("click", (e) => {
      e.preventDefault();
      addProduct();
    });
  }
}

// Atualiza visibilidade dos controles admin
// Atualiza visibilidade dos controles admin
function updateAdminVisibility() {
  const adminIcon = document.querySelector(".admin-icon");
  const addProductBtn = document.querySelector(".add-product-btn"); // <== botão + Adicionar

  // Mostra ícone admin (se existir)
  if (adminIcon) {
    if (isAdmin()) adminIcon.classList.remove("hidden");
    else adminIcon.classList.add("hidden");
  }

  // Mostra botão de adicionar produto (se existir)
  if (addProductBtn) {
    if (isAdmin()) addProductBtn.classList.remove("hidden");
    else addProductBtn.classList.add("hidden");
  }
}




// Inicialização da lista de produtos
function loadProducts() {
  let products = getStoredProducts();
  if (!products || !Array.isArray(products) || products.length === 0) {
    // tentar seed a partir do HTML (caso exista)
    products = seedProductsFromDOM();
    if (!products || products.length === 0) {
      // se não houver seed, cria um array vazio (padrão)
      products = [];
      localStorage.setItem("products", JSON.stringify(products));
    }
  }
  renderProducts(products);
  renderPainel(products);
}

// run
document.addEventListener("DOMContentLoaded", () => {
  updateAdminVisibility();
  attachDelegatedListeners();
  loadProducts();
});


// fim DOMContentLoaded

/* =========================================================
   SWIPER (mantive seu bloco; deve estar incluído no HTML)
   Se você já tem esse script em outro lugar, deixe só um.
   ========================================================= */
var swiper = new Swiper(".mySwiper", {
  slidesPerView: 3,
  spaceBetween: 30,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  breakpoints: {
    1024: { slidesPerView: 3 },
    768: { slidesPerView: 2 },
    0: { slidesPerView: 1 },
  }
});

/* =========================================================
   Marquee (se existir)
   ========================================================= */
const track = document.getElementById("marquee-track");
if (track) {
  const cloneContent = () => {
    const parentWidth = track.parentElement.offsetWidth;
    while (track.scrollWidth < parentWidth * 2) {
      track.innerHTML += track.innerHTML;
    }
  };
  cloneContent();
}