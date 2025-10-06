// assets/js/cadastro.js
// Certifique-se de incluir antes no HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://qojmixmnztlyxvxyfayb.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvam1peG1uenRseXh2eHlmYXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzkzMjIsImV4cCI6MjA3NDkxNTMyMn0.cb5jpxtVc2MojINZPfv6fSTSMFhLpAP93IW6wCL0CMo";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const registerForm = document.getElementById("registerForm");
  const cadastroEmail = document.getElementById("cadastroEmail");
  const cadastroSenha = document.getElementById("cadastroSenha");
  const cadastroSenha2 = document.getElementById("cadastroSenha2");
  const msgBox = document.getElementById("cadastro-message");

  // função para mostrar mensagens
  function showMsg(text, type = "info") {
    if (!msgBox) return;
    msgBox.textContent = text;
    msgBox.className = `message ${type}`;
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = cadastroEmail.value.trim();
      const senha = cadastroSenha.value.trim();
      const senha2 = cadastroSenha2.value.trim();

      // validação básica
      if (!email || !senha || !senha2) {
        showMsg("Preencha todos os campos!", "error");
        return;
      }
      if (senha !== senha2) {
        showMsg("As senhas não coincidem!", "error");
        return;
      }

      try {
        // verificar se já existe usuário com esse email
        const { data: existingUser, error: checkError } = await supabase
          .from("usuarios")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (checkError) {
          console.error(checkError);
          showMsg("Erro ao verificar usuário existente.", "error");
          return;
        }
        if (existingUser) {
          showMsg("Este email já está cadastrado!", "error");
          return;
        }

        // inserir novo usuário
        const { data, error } = await supabase
          .from("usuarios")
          .insert([{ email, senha, role: "client" }])
          .select();

        if (error) {
          console.error(error);
          showMsg("Erro ao cadastrar: " + error.message, "error");
          return;
        }

        // sucesso
        showMsg("Cadastro realizado com sucesso!", "success");
        registerForm.reset();

        setTimeout(() => {
          window.location.href = "index.html"; // redireciona para login
        }, 1200);
      } catch (err) {
        console.error(err);
        showMsg("Erro inesperado. Veja o console.", "error");
      }
    });
  }
});

// Função para alternar visibilidade da senha
document.querySelectorAll(".toggleSenha").forEach((eyeIcon, index) => {
  eyeIcon.addEventListener("click", () => {
    const input = eyeIcon.previousElementSibling; // o input vem logo antes
    if (input.type === "password") {
      input.type = "text";
      eyeIcon.src = "img/olho.png"; // coloque a imagem do olho fechado
    } else {
      input.type = "password";
      eyeIcon.src = "img/olho (1).png"; // volta pro olho aberto
    }
  });
});
