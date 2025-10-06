// Calca.js — versão final (com filtro corrigido)
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
const calcaList = document.getElementById("calca-list");
const addBtn = document.getElementById("calca-addProduct");

const modal = document.getElementById("calca-modal");
const closeModal = document.querySelector(".calca-close");
const modalTitle = document.getElementById("calca-modalTitle");
const form = document.getElementById("calca-form");

const modalName = document.getElementById("calca-modalName");
const modalPrice = document.getElementById("calca-modalPrice");
const modalImg = document.getElementById("calca-modalImg");
const modalLink = document.getElementById("calca-modalLink");
const modalCategoria = document.getElementById("calca-modalCategoria");
const modalTamanho = document.getElementById("calca-modalTamanho");
const modalDisponibilidade = document.getElementById("calca-modalDisponibilidade");

let editId = null;
let allProducts = [];

// =====================================
// 4) Carregar produtos
// =====================================
async function loadCalcaProducts() {
  try {
    const { data, error } = await supabase.from("calca").select("*").order("id", { ascending: true });
    if (error) throw error;
    allProducts = Array.isArray(data) ? data : [];
    renderCalcaProducts(allProducts);
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }
}

// =====================================
// 5) Renderizar produtos
// =====================================
function renderCalcaProducts(products) {
  if (!calcaList) return;
  calcaList.innerHTML = "";

  products.forEach(p => {
    const priceNum = Number(p.price ?? p.preco ?? 0);
    const categoria = p.categoria ?? p.category ?? "";
    const tamanho = p.tamanho ?? p.size ?? "";
    const disponibilidade = p.disponibilidade ?? p.disponibility ?? "";

    const card = document.createElement("div");
    card.className = "calca-boy-card-inter";
    card.innerHTML = `
      <div class="calca-boy-card-img">
        <img src="${p.img_url ?? ''}" alt="${escapeHtml(p.name ?? '')}">
      </div>
      <div class="calca-boy-card-info">
        <div class="calca-boy-card-inform">
          <h2>${escapeHtml(p.name ?? '')}</h2>
          <p>R$ ${priceNum.toFixed(2)}</p>
          <small>${escapeHtml(String(categoria))} | ${escapeHtml(String(tamanho))} | ${escapeHtml(String(disponibilidade))}</small>
        </div>
        <div class="calca-boy-card-link">
          <a href="${p.link ?? '#'}" target="_blank">&leftrightsquigarrow;</a>
        </div>
      </div>
      ${isAdmin() ? `
      <div class="calca-admin-actions">
        <button class="calca-btn-edit" data-id="${p.id}">Editar</button>
        <button class="calca-btn-delete" data-id="${p.id}">Excluir</button>
      </div>` : ""}
    `;
    calcaList.appendChild(card);
  });
  attachCalcaListeners();
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
function openCalcaModal(isEdit = false, data = null) {
  if (!modal) return;
  modal.classList.remove("hidden");

  if (isEdit && data) {
    modalTitle.textContent = "Editar Produto";
    modalName.value = data.name ?? "";
    modalPrice.value = data.price ?? data.preco ?? "";
    modalImg.value = data.img_url ?? "";
    modalLink.value = data.link ?? "";
    if (modalCategoria) modalCategoria.value = (data.categoria ?? data.category ?? "calca");
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
        await supabase.from("calca").update(produto).eq("id", editId);
      } else {
        await supabase.from("calca").insert([produto]);
      }
      modal.classList.add("hidden");
      await loadCalcaProducts();
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  });
}

// =====================================
// 9) Editar / Excluir
// =====================================
function attachCalcaListeners() {
  document.querySelectorAll(".calca-btn-edit").forEach(btn => {
    btn.onclick = async () => {
      const id = parseInt(btn.dataset.id);
      const { data } = await supabase.from("calca").select("*").eq("id", id).maybeSingle();
      if (data) openCalcaModal(true, data);
    };
  });

  document.querySelectorAll(".calca-btn-delete").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Excluir produto?")) return;
      await supabase.from("calca").delete().eq("id", parseInt(btn.dataset.id));
      loadCalcaProducts();
    };
  });
}

// =====================================
// 10) FILTROS PROFISSIONAIS (corrigidos)
// =====================================
const openFilterBtn = document.getElementById("openFilterBtn");
const filterPanel = document.getElementById("filterPanel");
const closeFilter = document.getElementById("closeFilter");
const applyFilters = document.getElementById("applyFilters");
const clearFilters = document.getElementById("clearFilters");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");

let selectedSize = null;

// Abrir/fechar painel
openFilterBtn?.addEventListener("click", () => filterPanel.classList.add("open"));
closeFilter?.addEventListener("click", () => filterPanel.classList.remove("open"));

// Range de preço
priceRange?.addEventListener("input", () => (priceValue.textContent = priceRange.value));

// Toggle de tamanho
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

// Função auxiliar
function normalizeValue(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Função principal de filtragem
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

// Aplicar filtros
applyFilters?.addEventListener("click", async () => {
  if (!allProducts.length) await loadCalcaProducts();
  const filtrados = filtrarLocalmente();
  renderCalcaProducts(filtrados);
  filterPanel?.classList.remove("open");
});

// Limpar filtros
clearFilters?.addEventListener("click", () => {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => (cb.checked = false));
  document.querySelectorAll(".size-buttons button").forEach(b => b.classList.remove("active"));
  selectedSize = null;
  if (priceRange && priceValue) {
    const max = Number(priceRange.max ?? 500);
    priceRange.value = max;
    priceValue.textContent = max;
  }
  renderCalcaProducts(allProducts);
  filterPanel?.classList.remove("open");
});

// =====================================
// 11) Inicialização
// =====================================
if (addBtn) addBtn.addEventListener("click", () => openCalcaModal(false));
loadCalcaProducts();
