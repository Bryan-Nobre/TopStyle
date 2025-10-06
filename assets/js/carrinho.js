const cartBtn = document.querySelector('.cart-btn');
const cart = document.getElementById('cart');
const overlay = document.getElementById('overlay');
const closeCart = document.querySelector('.close-cart');
const cartItemsContainer = document.querySelector('.cart-items');
const cartCount = document.querySelector('.cart-count');

const subtotalEl = document.getElementById('subtotal');
const descontoEl = document.getElementById('desconto');
const totalEl = document.getElementById('total');
const applyCouponBtn = document.getElementById('apply-coupon');
const cupomInput = document.getElementById('cupom-input');

let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
let desconto = parseFloat(localStorage.getItem("desconto")) || 0; // valor fixo R$
let descontoCupom = 0; // percentual %
const cupons = { "PROMO10": 10, "PROMO20": 20 };

// abrir carrinho
cartBtn.addEventListener('click', () => {
  cart.classList.add('open');
  overlay.classList.add('active');
});

// fechar carrinho
[closeCart, overlay].forEach(el =>
  el.addEventListener('click', () => {
    cart.classList.remove('open');
    overlay.classList.remove('active');
  })
);

// adicionar produto
document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', (e) => {
    const product = e.target.closest('.product');
    const name = product.dataset.name;
    const price = parseFloat(product.dataset.price);
    const img = product.querySelector('.hidden-cart-img')?.src || '';

    const size = product.querySelector('.sizes .active')?.dataset.size;
    const color = product.querySelector('.colors .active')?.dataset.color;
    const qty = parseInt(product.querySelector('.model-qty-controls input').value) || 0;

    if (!size || !color || qty <= 0) {
      alert("Selecione um tamanho, uma cor e uma quantidade válida.");
      return;
    }

    const existing = cartItems.find(item =>
      item.name === name && item.size === size && item.color === color
    );

    if (existing) {
      existing.qty = qty;
    } else {
      cartItems.push({ name, price, qty, size, color, img });
    }

    updateCart();
  });
});

// selecionar tamanho/cor
document.querySelectorAll('.sizes div').forEach(el => {
  el.addEventListener('click', () => {
    el.parentElement.querySelectorAll('div').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
  });
});
document.querySelectorAll('.colors div').forEach(el => {
  el.addEventListener('click', () => {
    el.parentElement.querySelectorAll('div').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
  });
});

// atualizar carrinho
function updateCart() {
  cartItemsContainer.innerHTML = '';
  let subtotal = 0;
  let totalQty = 0;

  cartItems.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    totalQty += item.qty;

    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div class="cart-details">
        <div class="title">${item.name}</div>
        <div class="variation">Tamanho: ${item.size} | Cor: ${item.color}</div>
        <div class="total-item">R$ ${itemTotal.toFixed(2)}</div>
      </div>
      <div class="cart-actions">
        <div class="quantity">
          <button onclick="changeQty(${index}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${index}, 1)">+</button>
        </div>
        <div class="remove" onclick="removeItem(${index})">Excluir</div>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });

  cartCount.textContent = totalQty;

  // aplica descontos
  const descontoValorCupom = (subtotal * descontoCupom) / 100;
  let total = subtotal - descontoValorCupom - desconto;
  if (total < 0) total = 0;

  subtotalEl.textContent = `R$${subtotal.toFixed(2)}`;
  descontoEl.textContent = `R$${(descontoValorCupom + desconto).toFixed(2)}`;
  totalEl.textContent = `R$${total.toFixed(2)}`;

  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  localStorage.setItem("desconto", desconto);
}

// alterar quantidade
function changeQty(index, delta) {
  cartItems[index].qty += delta;
  if (cartItems[index].qty <= 0) cartItems.splice(index, 1);
  updateCart();
}

// remover item
function removeItem(index) {
  cartItems.splice(index, 1);
  updateCart();
}

// aplicar cupom (percentual)
applyCouponBtn.addEventListener('click', () => {
  const cupom = cupomInput.value.trim().toUpperCase();
  descontoCupom = cupons[cupom] || 0;
  updateCart();
});

// aplicar desconto manual (fixo em R$)
function aplicarDesconto(valor) {
  desconto = parseFloat(valor) || 0;
  updateCart();
}

// limpar carrinho
function clearCart() {
  cartItems = [];
  desconto = 0;
  descontoCupom = 0;
  updateCart();
}

// --- controles input quantidade ---
document.querySelectorAll('.model-qty-controls').forEach(control => {
  const input = control.querySelector('input');
  input.value = 0;

  const [minus, plus] = control.querySelectorAll('button');

  minus.addEventListener('click', () => {
    let val = parseInt(input.value) || 0;
    if (val > 0) input.value = val - 1;
  });
  plus.addEventListener('click', () => {
    let val = parseInt(input.value) || 0;
    input.value = val + 1;
  });
});

// --- Accordion ---
document.querySelectorAll('.model-accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const content = header.nextElementSibling;
    const isOpen = content.classList.contains('open');

    // Fecha todos os conteúdos
    document.querySelectorAll('.model-accordion-content').forEach(c => {
      c.classList.remove('open');
      c.previousElementSibling.querySelector('span').textContent = "+";
    });

    // Se o que clicou não estava aberto, abre ele
    if (!isOpen) {
      content.classList.add('open');
      header.querySelector('span').textContent = "−";
    }
  });
});


// --- Barra de pesquisa ---
const searchIcon = document.getElementById("search-icon");
const searchBar = document.querySelector(".search-bar");
const closeSearch = document.getElementById("close-search");

if (searchIcon && searchBar) {
  searchIcon.addEventListener("click", (e) => {
    e.preventDefault();
    searchBar.classList.toggle("active");
  });
}
if (closeSearch && searchBar) {
  closeSearch.addEventListener("click", () => {
    searchBar.classList.remove("active");
  });
}

/* ================================
   💬 FUNÇÕES DE FORMATAÇÃO E RELATÓRIO
================================ */
function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildCartReport(items) {
  let lines = [];
  lines.push(`*Pedido via Loja*`);
  lines.push(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
  lines.push(``);
  lines.push(`*Itens:*`);
  let subtotal = 0;

  items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.qty}x ${it.name} (${it.color}, ${it.size}) — ${fmtBRL(it.price)}`);
    subtotal += it.qty * it.price;
  });

  const descontoValorCupom = (subtotal * descontoCupom) / 100;
  let total = subtotal - descontoValorCupom - desconto;
  if (total < 0) total = 0;

  lines.push(``);
  lines.push(`Subtotal: ${fmtBRL(subtotal)}`);
  if (descontoCupom > 0) lines.push(`Cupom: -${descontoCupom}% (${fmtBRL(descontoValorCupom)})`);
  if (desconto > 0) lines.push(`Desconto manual: -${fmtBRL(desconto)}`);
  lines.push(`*Total: ${fmtBRL(total)}*`);

  return lines.join('\n');
}

/* ================================
   💬 ENVIO AO WHATSAPP
================================ */
function sendViaWhatsApp(cartItems, dadosExtras) {
  if (!cartItems || cartItems.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  const text = buildCartReport(cartItems) + "\n\n" + dadosExtras;
  const encoded = encodeURIComponent(text);
  const numero = "5561984259381";
  const url = `https://wa.me/${numero}?text=${encoded}`;
  window.open(url, '_blank');
}

/* ================================
   🛒 INICIALIZAÇÃO DO CARRINHO
================================ */
updateCart();

/* ================================
   💳 FINALIZAÇÃO DO PEDIDO (MODAL)
================================ */
const finalizarOverlay = document.getElementById("finalizarOverlay");
const checkoutButton = document.querySelector(".checkout");
const fecharFinalizar = document.getElementById("fecharFinalizar");
const pagamentoCartao = document.getElementById("pagamentoCartao");
const confirmarCompra = document.getElementById("confirmarCompra");
const finalizarResumoItens = document.getElementById("finalizarResumoItens");
const finalizarTotal = document.getElementById("finalizarTotal");

// abrir modal
checkoutButton.addEventListener("click", () => {
  if (!cartItems || cartItems.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  // Preenche resumo lateral
  finalizarResumoItens.innerHTML = "";
  let total = 0;

  cartItems.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const div = document.createElement("div");
    div.classList.add("item");
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div>
        <p><strong>${item.name}</strong></p>
        <p>${item.qty}x R$${item.price.toFixed(2)}</p>
      </div>
    `;
    finalizarResumoItens.appendChild(div);
  });

  finalizarTotal.textContent = `R$${total.toFixed(2)}`;
  finalizarOverlay.classList.add("open");
});

// fechar modal
fecharFinalizar.addEventListener("click", () => {
  finalizarOverlay.classList.remove("open");
});

// alternar método de pagamento
document.querySelectorAll('input[name="pagamento"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    if (e.target.value === "cartao") {
      pagamentoCartao.classList.remove("hidden");
    } else {
      pagamentoCartao.classList.add("hidden");
    }
  });
});

// confirmar compra → valida e envia via WhatsApp
confirmarCompra.addEventListener("click", () => {
  const nome = document.getElementById("nome").value.trim();
  const endereco = document.getElementById("endereco").value.trim();
  const cidade = document.getElementById("cidade").value.trim();
  const cep = document.getElementById("cep").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const metodoPagamento = document.querySelector('input[name="pagamento"]:checked')?.value;

  // Validação básica
  if (!nome || !endereco || !cidade || !cep || !telefone || !metodoPagamento) {
    alert("Por favor, preencha todos os campos obrigatórios.");
    return;
  }

  // 🔒 Validação extra para pagamento com cartão
  let dadosCartao = "";
  if (metodoPagamento === "cartao") {
    const nomeCartao = document.getElementById("nome-cartao").value.trim();
    const numeroCartao = document.getElementById("numero-cartao").value.trim();
    const validadeCartao = document.getElementById("validade-cartao").value;
    const cvvCartao = document.getElementById("cvv-cartao").value.trim();

    if (!nomeCartao || !numeroCartao || !validadeCartao || !cvvCartao) {
      alert("Por favor, preencha todos os dados do cartão antes de confirmar a compra.");
      return;
    }

    const numeroLimpo = numeroCartao.replace(/\s+/g, '');
    if (numeroLimpo.length < 13 || numeroLimpo.length > 19) {
      alert("Número de cartão inválido. Verifique e tente novamente.");
      return;
    }

    if (cvvCartao.length < 3 || cvvCartao.length > 4) {
      alert("CVV inválido. Digite 3 ou 4 dígitos.");
      return;
    }

    // ✅ Converter data YYYY-MM para MM/AA
    const [ano, mes] = validadeCartao.split("-");
    const validadeFormatada = `${mes}/${ano.slice(2)}`;

    dadosCartao =
      `\n\n*Dados do Cartão:*\n` +
      `Nome: ${nomeCartao}\n` +
      `Número: ${numeroCartao.replace(/\d(?=\d{4})/g, "•")}\n` + // mostra apenas 4 últimos dígitos
      `Validade: ${validadeFormatada}\n` +
      `CVV: ${"*".repeat(cvvCartao.length)}`;
  }

  // 🧾 Monta texto do pedido
  let dadosExtras = "*Dados do Pedido:*\n";
  dadosExtras += `Nome: ${nome}\n`;
  dadosExtras += `Endereço: ${endereco}, ${cidade} - CEP ${cep}\n`;
  dadosExtras += `Telefone: ${telefone}\n`;
  dadosExtras += `Pagamento: ${metodoPagamento === "pix" ? "PIX" : "Cartão de Crédito"}`;
  dadosExtras += dadosCartao; // 👈 adiciona os dados do cartão mascarados

  alert("Pedido confirmado! Enviando resumo via WhatsApp 💚");
  finalizarOverlay.classList.remove("open");

  sendViaWhatsApp(cartItems, dadosExtras);
});




/* menu hamburguer */

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const nav = document.querySelector('header nav');
  const overlay = document.getElementById('overlay');

  const cartBtn = document.querySelector('.cart-btn');
  const cart = document.getElementById('cart');
  const closeCart = document.querySelector('.close-cart');

  // -------- MENU + overlay --------
  if (hamburger && nav && overlay) {
    hamburger.addEventListener('click', () => {
      const ativo = hamburger.classList.toggle('active');
      nav.classList.toggle('active', ativo);
      overlay.classList.toggle('active', ativo);
      overlay.setAttribute('aria-hidden', String(!ativo));
    });
  }

  // -------- CARRINHO + overlay --------
  if (cartBtn && cart && overlay) {
    cartBtn.addEventListener('click', () => {
      cart.classList.add('active');
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
    });

    closeCart.addEventListener('click', () => {
      cart.classList.remove('active');
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    });

    overlay.addEventListener('click', () => {
      cart.classList.remove('active');
      hamburger.classList.remove('active');
      nav.classList.remove('active');
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        cart.classList.remove('active');
        hamburger.classList.remove('active');
        nav.classList.remove('active');
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
      }
    });
  }
});

/* ============================
   TOAST UNIVERSAL ROBUSTO E BONITO
   ============================ */
(function () {
  if (window.__toastInitialized) return;
  window.__toastInitialized = true;

  function ensureToastElement() {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.innerHTML = `
        <span class="toast-icon"></span>
        <span class="toast-message"></span>
      `;
      if (document.body) document.body.appendChild(t);
      else document.addEventListener("DOMContentLoaded", () => document.body.appendChild(t));
    }
    return t;
  }

  if (document.readyState !== "loading") ensureToastElement();
  else document.addEventListener("DOMContentLoaded", ensureToastElement);

  window.showToast = function (message, type = "info", duration = 3500) {
    const t = ensureToastElement();
    if (!t) return;

    const iconEl = t.querySelector(".toast-icon");
    const msgEl = t.querySelector(".toast-message");

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    const colors = {
      success: "linear-gradient(135deg, #2ecc71, #27ae60)", // verde
      error: "linear-gradient(135deg, #e74c3c, #c0392b)",   // vermelho
      warning: "linear-gradient(135deg, #f39c12, #e67e22)", // laranja
      info: "linear-gradient(135deg, #3498db, #2980b9)",    // azul
    };

    iconEl.textContent = icons[type] || icons.info;
    msgEl.textContent = message;

    // Reseta classes e define tipo
    t.classList.remove("success", "error", "warning", "info", "show");
    t.classList.add(type);

    // Aplica a cor diretamente com !important (garante prioridade)
    t.style.setProperty("background", colors[type] || colors.info, "important");

    // Reaplica animação
    void t.offsetWidth;
    t.classList.add("show");

    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => {
      t.classList.remove("show");
    }, duration);
  };

  window.__originalAlert = window.alert;
  window.alert = function (msg) {
    window.showToast(String(msg), "warning");
  };
})();
