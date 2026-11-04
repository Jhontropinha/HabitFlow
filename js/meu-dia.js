// Esta página LÊ os hábitos do dashboard. Ela não altera habitflow-basico.
const listaDia = document.getElementById("lista-dia");
const listaVazia = document.getElementById("lista-vazia");
const mensagem = document.getElementById("mensagem");
const barraDia = document.getElementById("barra-dia");
const textoProgresso = document.getElementById("texto-progresso");
const botoesModo = document.querySelectorAll("[data-modo]");
const avisoModo = document.getElementById("aviso-modo");
const botaoTema = document.getElementById("tema");

// Formata o dia no horário local (evita diferenças de fuso horário).
const agora = new Date();
const hoje = [
  agora.getFullYear(),
  String(agora.getMonth() + 1).padStart(2, "0"),
  String(agora.getDate()).padStart(2, "0")
].join("-");

document.getElementById("data-atual").textContent =
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(agora);

function previstoHoje(habito) {
  if (habito.criacao > hoje) return false;

  const diaSemana = agora.getDay(); // domingo = 0; sábado = 6.
  if (habito.frequencia === "semana") return diaSemana >= 1 && diaSemana <= 5;
  if (habito.frequencia === "fim-semana") return diaSemana === 0 || diaSemana === 6;
  return habito.frequencia === "diario";
}

function carregarHabitos() {
  try {
    const dados = JSON.parse(localStorage.getItem("habitflow-basico") || "[]");
    if (!Array.isArray(dados)) throw new Error("Formato de dados inválido");

    return dados.filter(function (item) {
      return item && typeof item.nome === "string"
        && typeof item.meta === "string"
        && typeof item.categoria === "string"
        && typeof item.criacao === "string"
        && Array.isArray(item.concluidos)
        && ["diario", "semana", "fim-semana"].includes(item.frequencia);
    });
  } catch (erro) {
    mensagem.hidden = false;
    mensagem.textContent = "Não foi possível ler os hábitos salvos. Abra o dashboard para verificar seus dados.";
    return [];
  }
}

function mostrarHabitos() {
  const habitos = carregarHabitos().filter(previstoHoje);
  let concluidos = 0;

  listaDia.replaceChildren();

  habitos.forEach(function (habito) {
    const finalizado = habito.concluidos.includes(hoje);
    if (finalizado) concluidos++;

    const item = document.createElement("li");
    if (finalizado) item.classList.add("concluido");

    const linha = document.createElement("div");
    linha.className = "linha-habito";

    const nome = document.createElement("strong");
    nome.textContent = habito.nome;

    const situacao = document.createElement("span");
    situacao.className = "situacao";
    situacao.textContent = finalizado ? "Concluído" : "Pendente";

    linha.append(nome, situacao);

    const detalhe = document.createElement("p");
    detalhe.className = "detalhe-habito";
    detalhe.textContent = habito.categoria + " • Meta: " + habito.meta;

    item.append(linha, detalhe);
    listaDia.append(item);
  });

  listaVazia.hidden = habitos.length > 0;
  if (habitos.length === 0) {
    listaVazia.textContent = "Você não tem hábitos programados para hoje. Cadastre um hábito no dashboard.";
  }

  const porcentagem = habitos.length === 0 ? 0 : Math.round(concluidos / habitos.length * 100);
  barraDia.value = porcentagem;
  textoProgresso.textContent = concluidos + " de " + habitos.length +
    " hábitos concluídos (" + porcentagem + "%).";
}

// Prévia dos modos: muda somente a seleção visual; ainda não muda a rotina.
const nomesModo = { leve: "Leve", normal: "Normal", intenso: "Intenso" };
botoesModo.forEach(function (botao) {
  botao.addEventListener("click", function () {
    botoesModo.forEach(function (outro) {
      outro.setAttribute("aria-pressed", String(outro === botao));
    });
    avisoModo.textContent = "Modo " + nomesModo[botao.dataset.modo] +
      " selecionado. Esta é uma prévia: o modo ainda não altera seus hábitos.";
  });
});

// Compartilha a preferência de tema com o dashboard, sem alterar os hábitos.
function aplicarTema(escuro) {
  document.body.classList.toggle("escuro", escuro);
  botaoTema.textContent = escuro ? "Modo claro" : "Modo escuro";
  botaoTema.setAttribute("aria-pressed", String(escuro));
}

try {
  aplicarTema(localStorage.getItem("habitflow-basico-tema") === "escuro");
} catch (erro) {
  aplicarTema(false);
}

botaoTema.addEventListener("click", function () {
  const escuro = !document.body.classList.contains("escuro");
  aplicarTema(escuro);
  try {
    localStorage.setItem("habitflow-basico-tema", escuro ? "escuro" : "claro");
  } catch (erro) {
    mensagem.hidden = false;
    mensagem.textContent = "O tema foi alterado, mas não pôde ser salvo.";
  }
});

mostrarHabitos();
