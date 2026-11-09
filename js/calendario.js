import { lerMetas, resumoMeta } from "./metas-dados.js";

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
let metasCalendario = [];
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
        && habito.concluidos.every(dataValida)
        && (habito.dispensados === undefined || (Array.isArray(habito.dispensados) && habito.dispensados.every(function (dia) {
          return dataValida(dia) && dia >= habito.criacao && !habito.concluidos.includes(dia);
        })));
    });

    if (habitosCalendario.length !== dados.length) {
      aviso.textContent = "Alguns registros inválidos não puderam ser exibidos. Os dados salvos foram preservados.";
    }
  } catch {
    habitosCalendario = [];
    aviso.textContent = "Não foi possível ler os hábitos deste navegador. Nenhum registro foi alterado.";
  }
  try {
    metasCalendario = lerMetas().metas;
  } catch {
    metasCalendario = [];
    aviso.textContent += " Não foi possível carregar as metas. Os registros foram preservados.";
  }
  mostrarCalendario();
}

function habitosDoDia(data) {
  const diaSemana = converterData(data).getDay();
  return habitosCalendario.filter(function (habito) {
    if (data < habito.criacao) return false;
    // Mantém visível uma conclusão mesmo após mudar a frequência do hábito.
    if (habito.concluidos.includes(data)) return true;
    if (Array.isArray(habito.dispensados) && habito.dispensados.includes(data)) return true;
    // shortcut: a frequência não tem versões; versione-a para preservar regras antigas.
    if (habito.frequencia === "semana") return diaSemana >= 1 && diaSemana <= 5;
    if (habito.frequencia === "fim-semana") return diaSemana === 0 || diaSemana === 6;
    return true;
  });
}

// Hábitos e metas compartilham a contagem e as cores do calendário.

function atividadesDoDia(data) {
  const atividades = habitosDoDia(data).map(function (habito) {
    const concluida = habito.concluidos.includes(data);

    const dispensada =
      !concluida &&
      Array.isArray(habito.dispensados) &&
      habito.dispensados.includes(data);

    const diaSemana = converterData(data).getDay();

    const programada =
      habito.frequencia === "diario" ||
      (habito.frequencia === "semana" &&
        diaSemana >= 1 && diaSemana <= 5) ||
      (habito.frequencia === "fim-semana" &&
        (diaSemana === 0 || diaSemana === 6));

    // Uma conclusão fora da frequência atual é um extra.
    const extra = concluida && !programada;

    const estado = concluida
      ? "Concluído"
      : dispensada
        ? "Dispensado (Modo Leve)"
        : "Pendente";

    return {
      nome: habito.nome,
      concluida: concluida,
      dispensada: dispensada,
      andamento: concluida,
      extra: extra,

      // Extras não fazem parte das atividades exigidas.
      contaNoProgresso: !extra,

      detalhes:
        estado +
        (extra ? " • Extra fora da frequência atual" : "") +
        " • " + habito.categoria +
        " • Meta: " + habito.meta
    };
  });

  // Metas diárias e semanais possuem contagens diferentes.
  metasCalendario.forEach(function (meta) {
    const resumo = resumoMeta(meta, data);

    if (!resumo) return;

    const semanal = meta.tipo === "vezes-semana";
    const realizadasHoje = meta.registros[data] || 0;

    atividades.push({
      nome: "Meta: " + meta.nome,
      concluida: resumo.concluida,
      dispensada: false,
      andamento: resumo.andamento,
      extra: false,
      semanal: semanal,

      // Metas semanais não contam como conclusão diária.
      contaNoProgresso: !semanal,

      detalhes: semanal
        ? "Meta semanal • " +
          resumo.total + " de " + meta.alvo +
          " realizações acumuladas até este dia" +
          " • " + realizadasHoje +
          " realização(ões) nesta data"
        : (resumo.concluida
            ? "Cumprida"
            : resumo.andamento
              ? "Em andamento"
              : "Pendente") +
          " • " + resumo.total +
          " de " + meta.alvo +
          " " + resumo.unidade
    });
  });

  return atividades;
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
    const atividades = atividadesDoDia(chave);
     const exigidas = atividades.filter(function (item) {
  return !item.dispensada && item.contaNoProgresso;
});
    const dispensadas = atividades.filter(function (item) {
  return item.dispensada;
}).length;

const extras = atividades.filter(function (item) {
  return item.extra;
}).length;
    const feitos = exigidas.filter(item => item.concluida).length;
    const temProgresso = exigidas.some(item => item.andamento);
    const futuro = chave > hoje;
    let estado = "sem-habitos";
    if (exigidas.length > 0) estado = feitos === exigidas.length ? "completo" : temProgresso ? "parcial" : "pendente";
    else if (dispensadas > 0) estado = "dispensado";

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "dia " + (futuro ? "futuro" : estado);
    botao.disabled = futuro;
    botao.dataset.data = chave;
    botao.setAttribute("aria-pressed", String(chave === selecionada));
    if (chave === hoje) botao.setAttribute("aria-current", "date");

    const descricao = futuro
  ? "Data futura"
  : (exigidas.length > 0
      ? `${feitos} de ${exigidas.length} concluídos`
      : "Sem atividades diárias exigidas")
    + (dispensadas
        ? `, ${dispensadas} dispensado(s)`
        : "")
    + (extras
        ? `, ${extras} extra(s) concluído(s)`
        : "");

    const numero = document.createElement("span");
    numero.textContent = data.getDate();
    const total = document.createElement("small");
    
total.textContent = futuro
  ? "Futuro"
  : exigidas.length > 0
    ? `${feitos}/${exigidas.length}`
    : dispensadas > 0
      ? "Pausa"
      : extras > 0
        ? `${extras} extra(s)`
        : "—";

    botao.append(numero, total);
    grade.append(botao);
    data.setDate(data.getDate() + 1);
  }

  // A navegação fica entre o primeiro mês cadastrado e o mês atual.
  const inicios = [
    hoje,
    ...habitosCalendario.map(habito => habito.criacao),
    ...metasCalendario.map(meta => meta.inicio)
  ];
  const primeiraData = inicios.reduce((menor, data) => data < menor ? data : menor, hoje);
  anterior.disabled = formatarData(mesVisivel).slice(0, 7) <= primeiraData.slice(0, 7);
  proximo.disabled = formatarData(mesVisivel).slice(0, 7) >= hoje.slice(0, 7);
  mostrarHistorico();
}

function mostrarHistorico() {
  tituloDia.textContent = converterData(selecionada).toLocaleDateString("pt-BR", { dateStyle: "long" });
  historico.replaceChildren();
  const atividades = atividadesDoDia(selecionada);
  
const exigidas = atividades.filter(function (item) {
  return !item.dispensada && item.contaNoProgresso;
});

const dispensadas = atividades.filter(function (item) {
  return item.dispensada;
}).length;

const extras = atividades.filter(function (item) {
  return item.extra;
}).length;

const metasSemanais = atividades.filter(function (item) {
  return item.semanal;
}).length;

const feitos = exigidas.filter(function (item) {
  return item.concluida;
}).length;

if (atividades.length === 0) {
  resumoDia.textContent =
    "Sem hábitos previstos ou registrados nesta data.";
} else {
  const partes = [];

  if (exigidas.length > 0) {
    const porcentagem = Math.round(
      feitos / exigidas.length * 100
    );

    partes.push(
      `${feitos} de ${exigidas.length} concluídos (${porcentagem}%)`
    );
  } else {
    partes.push("Nenhuma atividade diária exigida");
  }

  if (dispensadas > 0) {
    partes.push(`${dispensadas} dispensado(s) no Modo Leve`);
  }

  if (extras > 0) {
    partes.push(`${extras} extra(s) concluído(s)`);
  }

  if (metasSemanais > 0) {
    partes.push(`${metasSemanais} meta(s) semanais em acompanhamento`);
  }

  resumoDia.textContent = partes.join(" • ") + ".";
}


  atividades.forEach(function (atividade) {
    const item = document.createElement("li");
    const nome = document.createElement("strong");
    const detalhes = document.createElement("p");
    // textContent impede que um nome digitado seja interpretado como HTML.
    nome.textContent = atividade.nome;
    detalhes.textContent = atividade.detalhes;
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

// Recarrega o histórico quando outra aba altera hábitos ou metas.
window.addEventListener("storage", function (evento) {
  if (evento.key === "habitflow-basico" || evento.key === "habitflow-metas" || evento.key === null) carregarHabitos();
});

carregarHabitos();
