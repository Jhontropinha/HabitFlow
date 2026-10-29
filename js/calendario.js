// Lê os registros da dashboard; esta página não altera os hábitos salvos.
const grade = document.getElementById("calendario");
const tituloMes = document.getElementById("mes-atual");
const tituloDia = document.getElementById("titulo-dia");
const resumoDia = document.getElementById("resumo-dia");
const historico = document.getElementById("historico");
const aviso = document.getElementById("mensagem");
const anterior = document.getElementById("mes-anterior");
const proximo = document.getElementById("mes-proximo");

let habitosCalendario = [];
let selecionada = formatarData(new Date());
let mesVisivel = converterData(selecionada.slice(0, 8) + "01");

// Usa o horário local para não trocar o dia por causa do fuso horário.
function formatarData(data) {
  const ano = String(data.getFullYear()).padStart(4, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function converterData(texto) {
  return new Date(texto + "T12:00:00");
}

function dataValida(texto) {
  return typeof texto === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(texto)
    && formatarData(converterData(texto)) === texto;
}

function carregarHabitos() {
  aviso.textContent = "";
  try {
    const dados = JSON.parse(localStorage.getItem("habitflow-basico") || "[]");
    if (!Array.isArray(dados)) throw new Error("Formato inválido");

    habitosCalendario = dados.filter(function (habito) {
      return habito && typeof habito.nome === "string"
        && typeof habito.meta === "string"
        && typeof habito.categoria === "string"
        && dataValida(habito.criacao)
        && ["diario", "semana", "fim-semana"].includes(habito.frequencia)
        && Array.isArray(habito.concluidos)
        && habito.concluidos.every(dataValida);
    });

    if (habitosCalendario.length !== dados.length) {
      aviso.textContent = "Alguns registros inválidos não puderam ser exibidos. Os dados salvos foram preservados.";
    }
  } catch {
    habitosCalendario = [];
    aviso.textContent = "Não foi possível ler os hábitos deste navegador. Nenhum registro foi alterado.";
  }
  mostrarCalendario();
}

function habitosDoDia(data) {
  const diaSemana = converterData(data).getDay();
  return habitosCalendario.filter(function (habito) {
    if (data < habito.criacao) return false;
    // Mantém visível uma conclusão mesmo após mudar a frequência do hábito.
    if (habito.concluidos.includes(data)) return true;
    // shortcut: a frequência não tem versões; versione-a para preservar regras antigas.
    if (habito.frequencia === "semana") return diaSemana >= 1 && diaSemana <= 5;
    if (habito.frequencia === "fim-semana") return diaSemana === 0 || diaSemana === 6;
    return true;
  });
}

function mostrarCalendario() {
  const hoje = formatarData(new Date());
  tituloMes.textContent = mesVisivel.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  grade.replaceChildren();

  // Espaços vazios alinham o primeiro dia ao dia correto da semana.
  for (let i = 0; i < mesVisivel.getDay(); i++) {
    const espaco = document.createElement("span");
    espaco.setAttribute("aria-hidden", "true");
    grade.append(espaco);
  }

  const data = new Date(mesVisivel);
  while (data.getMonth() === mesVisivel.getMonth()) {
    const chave = formatarData(data);
    const previstos = habitosDoDia(chave);
    const feitos = previstos.filter(habito => habito.concluidos.includes(chave)).length;
    const futuro = chave > hoje;
    let estado = "sem-habitos";
    if (previstos.length > 0) estado = feitos === 0 ? "pendente" : feitos === previstos.length ? "completo" : "parcial";

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "dia " + (futuro ? "futuro" : estado);
    botao.disabled = futuro;
    botao.dataset.data = chave;
    botao.setAttribute("aria-pressed", String(chave === selecionada));
    if (chave === hoje) botao.setAttribute("aria-current", "date");

    const descricao = futuro ? "Data futura" : previstos.length === 0
      ? "Sem hábitos previstos ou registrados" : `${feitos} de ${previstos.length} concluídos`;
    botao.setAttribute("aria-label", data.toLocaleDateString("pt-BR", { dateStyle: "full" }) + ": " + descricao);

    const numero = document.createElement("span");
    numero.textContent = data.getDate();
    const total = document.createElement("small");
    total.textContent = futuro ? "Futuro" : previstos.length === 0 ? "—" : `${feitos}/${previstos.length}`;
    botao.append(numero, total);
    grade.append(botao);
    data.setDate(data.getDate() + 1);
  }

  // A navegação fica entre o primeiro mês cadastrado e o mês atual.
  const primeiraData = habitosCalendario.reduce((menor, habito) => habito.criacao < menor ? habito.criacao : menor, hoje);
  anterior.disabled = formatarData(mesVisivel).slice(0, 7) <= primeiraData.slice(0, 7);
  proximo.disabled = formatarData(mesVisivel).slice(0, 7) >= hoje.slice(0, 7);
  mostrarHistorico();
}

function mostrarHistorico() {
  tituloDia.textContent = converterData(selecionada).toLocaleDateString("pt-BR", { dateStyle: "long" });
  historico.replaceChildren();
  const previstos = habitosDoDia(selecionada);
  const feitos = previstos.filter(habito => habito.concluidos.includes(selecionada)).length;
  resumoDia.textContent = previstos.length === 0 ? "Sem hábitos previstos ou registrados nesta data."
    : `${feitos} de ${previstos.length} concluídos (${Math.round(feitos / previstos.length * 100)}%).`;

  previstos.forEach(function (habito) {
    const item = document.createElement("li");
    const nome = document.createElement("strong");
    const detalhes = document.createElement("p");
    // textContent impede que um nome digitado seja interpretado como HTML.
    nome.textContent = habito.nome;
    const estado = habito.concluidos.includes(selecionada) ? "Concluído" : "Pendente";
    detalhes.textContent = `${estado} • ${habito.categoria} • Meta: ${habito.meta}`;
    item.append(nome, detalhes);
    historico.append(item);
  });
}

// Atualiza somente a seleção, preservando o foco no botão clicado.
grade.addEventListener("click", function (evento) {
  const botao = evento.target.closest("button[data-data]");
  if (!botao || botao.disabled) return;
  selecionada = botao.dataset.data;
  grade.querySelectorAll("button").forEach(dia => {
    dia.setAttribute("aria-pressed", String(dia.dataset.data === selecionada));
  });
  mostrarHistorico();
});

function mudarMes(deslocamento) {
  mesVisivel.setMonth(mesVisivel.getMonth() + deslocamento);
  selecionada = formatarData(mesVisivel);
  mostrarCalendario();
}

anterior.addEventListener("click", () => mudarMes(-1));
proximo.addEventListener("click", () => mudarMes(1));
document.getElementById("ir-hoje").addEventListener("click", function () {
  selecionada = formatarData(new Date());
  mesVisivel = converterData(selecionada.slice(0, 8) + "01");
  carregarHabitos();
});

// Recarrega o histórico se outra aba modificar os hábitos ou apagar os dados.
window.addEventListener("storage", function (evento) {
  if (evento.key === "habitflow-basico" || evento.key === null) carregarHabitos();
});

carregarHabitos();
