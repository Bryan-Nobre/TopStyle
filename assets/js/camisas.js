// Camisas.js — versão final
// =====================================
// 1) Conexão com Supabase
// =====================================
const SUPABASE_URL = "https://qojmixmnztlyxvxyfayb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvam1peG1uenRseXh2eHlmYXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzkzMjIsImV4cCI6MjA3NDkxNTMyMn0.cb5jpxtVc2MojINZPfv6fSTSMFhLpAP93IW6wCL0CMo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================
// 2) Verificação de admin
// =====================================
function isAdmin() {
  const role = sessionStorage.getItem("role");
  return role === "admin";
}

// =====================================
// 3) Elementos DOM
// =====================================
const camisasList = document.getElementById("camisas-list");
const addBtn = document.getElementById("camisas-addProduct");

const modal = document.getElementById("camisas-modal");
const closeModal = document.querySelector(".camisas-close");
const modalTitle = document.getElementById("camisas-modalTitle");
const form = document.getElementById("camisas-form");

const modalName = document.getElementById("camisas-modalName");
const modalPrice = document.getElementById("camisas-modalPrice");
const modalImg = document.getElementById("camisas-modalImg");
const modalLink = document.getElementById("camisas-modalLink");
const modalCategoria = document.getElementById("camisas-modalCategoria");
const modalTamanho = document.getElementById("camisas-modalTamanho");
const modalDisponibilidade = document.getElementById("camisas-modalDisponibilidade");

let editId = null;
let allProducts = [];

// =====================================
// 4) Carregar produtos
// =====================================
async function loadCamisasProducts() {
  try {
    const { data, error } = await supabase.from("camisas").select("*").order("id", { ascending: true });
    if (error) throw error;
    allProducts = Array.isArray(data) ? data : [];
    renderCamisasProducts(allProducts);
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }
}

// =====================================
// 5) Renderizar produtos
// =====================================
function renderCamisasProducts(products) {
  if (!camisasList) return;
  camisasList.innerHTML = "";

  products.forEach(p => {
    const priceNum = Number(p.price ?? p.preco ?? 0);
    const categoria = p.categoria ?? p.category ?? "";
    const tamanho = p.tamanho ?? p.size ?? "";
    const disponibilidade = p.disponibilidade ?? p.disponibility ?? "";

    const card = document.createElement("div");
    card.className = "camisas-card-inter";
    card.innerHTML = `
      <div class="camisas-card-img">
        <img src="${p.img_url ?? ''}" alt="${escapeHtml(p.name ?? '')}">
      </div>
      <div class="camisas-card-info">
        <div class="camisas-card-inform">
          <h2>${escapeHtml(p.name ?? '')}</h2>
          <p>R$ ${priceNum.toFixed(2)}</p>
          <small>${escapeHtml(String(categoria))} | ${escapeHtml(String(tamanho))} | ${escapeHtml(String(disponibilidade))}</small>
        </div>
        <div class="camisas-card-link">
          <a href="${p.link ?? '#'}" target="_blank">&leftrightsquigarrow;</a>
        </div>
      </div>
      ${isAdmin() ? `
      <div class="camisas-admin-actions">
        <button class="camisas-btn-edit" data-id="${p.id}">Editar</button>
        <button class="camisas-btn-delete" data-id="${p.id}">Excluir</button>
      </div>` : ""}
    `;
    camisasList.appendChild(card);
  });
  attachCamisasListeners();
}

// Função de segurança
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =====================================
// 6) Botão admin
// =====================================
if (addBtn && !isAdmin()) addBtn.classList.add("hidden");

// =====================================
// 7) Modal
// =====================================
function openCamisasModal(isEdit = false, data = null) {
  if (!modal) return;
  modal.classList.remove("hidden");

  if (isEdit && data) {
    modalTitle.textContent = "Editar Produto";
    modalName.value = data.name ?? "";
    modalPrice.value = data.price ?? data.preco ?? "";
    modalImg.value = data.img_url ?? "";
    modalLink.value = data.link ?? "";
    if (modalCategoria) modalCategoria.value = (data.categoria ?? data.category ?? "camiseta");
    if (modalTamanho) modalTamanho.value = (data.tamanho ?? data.size ?? "M");
    if (modalDisponibilidade) modalDisponibilidade.value = (data.disponibilidade ?? data.disponibility ?? "estoque");
    editId = data.id;
  } else {
    modalTitle.textContent = "Adicionar Produto";
    if (form) form.reset();
    editId = null;
  }
}

if (closeModal) closeModal.addEventListener("click", () => modal.classList.add("hidden"));

// =====================================
// 8) CRUD via modal
// =====================================
if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!isAdmin()) return alert("Apenas administradores podem editar.");

    const produto = {
      name: modalName.value.trim(),
      price: Number(modalPrice.value),
      img_url: modalImg.value.trim(),
      link: modalLink.value.trim(),
      categoria: modalCategoria?.value.trim().toLowerCase(),
      tamanho: modalTamanho?.value.trim().toUpperCase(),
      disponibilidade: modalDisponibilidade?.value.trim().toLowerCase()
    };

    try {
      if (editId) {
        await supabase.from("camisas").update(produto).eq("id", editId);
      } else {
        await supabase.from("camisas").insert([produto]);
      }
      modal.classList.add("hidden");
      await loadCamisasProducts();
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  });
}

// =====================================
// 9) Editar / Excluir
// =====================================
function attachCamisasListeners() {
  document.querySelectorAll(".camisas-btn-edit").forEach(btn => {
    btn.onclick = async () => {
      const id = parseInt(btn.dataset.id);
      const { data } = await supabase.from("camisas").select("*").eq("id", id).maybeSingle();
      if (data) openCamisasModal(true, data);
    };
  });

  document.querySelectorAll(".camisas-btn-delete").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Excluir produto?")) return;
      await supabase.from("camisas").delete().eq("id", parseInt(btn.dataset.id));
      loadCamisasProducts();
    };
  });
}

// =====================================
// 10) FILTROS PROFISSIONAIS
// =====================================
const openFilterBtn = document.getElementById("openFilterBtn");
const filterPanel = document.getElementById("filterPanel");
const closeFilter = document.getElementById("closeFilter");
const applyFilters = document.getElementById("applyFilters");
const clearFilters = document.getElementById("clearFilters");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");

let selectedSize = null;

openFilterBtn?.addEventListener("click", () => filterPanel.classList.add("open"));
closeFilter?.addEventListener("click", () => filterPanel.classList.remove("open"));
priceRange?.addEventListener("input", () => (priceValue.textContent = priceRange.value));

document.querySelectorAll(".size-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    const size = (btn.dataset.size ?? "").trim().toUpperCase();
    if (selectedSize === size) {
      selectedSize = null;
      btn.classList.remove("active");
    } else {
      document.querySelectorAll(".size-buttons button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = size;
    }
  });
});

function normalizeValue(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function filtrarLocalmente() {
  const filtrosCategoria = Array.from(document.querySelectorAll('input[name="categoria"]:checked')).map(e => normalizeValue(e.value));
  const filtrosDisp = Array.from(document.querySelectorAll('input[name="disponibilidade"]:checked')).map(e => normalizeValue(e.value));
  const precoMax = Number(priceRange?.value ?? Infinity);
  const tamanhoFiltro = selectedSize ? selectedSize.toUpperCase() : null;

  return (allProducts || []).filter(p => {
    const cat = normalizeValue(p.categoria ?? p.category);
    const disp = normalizeValue(p.disponibilidade ?? p.disponibility);
    const preco = Number(p.price ?? p.preco ?? 0);
    const tam = String(p.tamanho ?? p.size ?? "").toUpperCase();

    const matchCat = filtrosCategoria.length === 0 || filtrosCategoria.includes(cat);
    const matchDisp = filtrosDisp.length === 0 || filtrosDisp.includes(disp);
    const matchTam = !tamanhoFiltro || tamanhoFiltro === tam;
    const matchPreco = preco <= precoMax;

    return matchCat && matchDisp && matchTam && matchPreco;
  });
}

applyFilters?.addEventListener("click", async () => {
  if (!allProducts.length) await loadCamisasProducts();
  const filtrados = filtrarLocalmente();
  renderCamisasProducts(filtrados);
  filterPanel?.classList.remove("open");
});

clearFilters?.addEventListener("click", () => {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => (cb.checked = false));
  document.querySelectorAll(".size-buttons button").forEach(b => b.classList.remove("active"));
  selectedSize = null;
  if (priceRange && priceValue) {
    const max = Number(priceRange.max ?? 500);
    priceRange.value = max;
    priceValue.textContent = max;
  }
  renderCamisasProducts(allProducts);
  filterPanel?.classList.remove("open");
});

// =====================================
// 11) Inicialização
// =====================================
if (addBtn) addBtn.addEventListener("click", () => openCamisasModal(false));
loadCamisasProducts();
