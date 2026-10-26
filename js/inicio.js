// Usa a mesma preferência de tema da dashboard.
const botaoTema = document.getElementById("tema");

function aplicarTema(escuro) {
  document.body.classList.toggle("escuro", escuro);
  botaoTema.textContent = escuro ? "Modo claro" : "Modo escuro";
  botaoTema.setAttribute("aria-pressed", String(escuro));
}

// A página continua funcionando se o armazenamento estiver bloqueado.
try {
  aplicarTema(localStorage.getItem("habitflow-basico-tema") === "escuro");
} catch {
  aplicarTema(false);
}

botaoTema.addEventListener("click", function () {
  const escuro = !document.body.classList.contains("escuro");
  aplicarTema(escuro);
  try {
    localStorage.setItem("habitflow-basico-tema", escuro ? "escuro" : "claro");
  } catch {
    // Sem armazenamento, o tema permanece ativo somente nesta página.
  }
});
