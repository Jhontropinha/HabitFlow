import {
  lerMetas,
  salvarMetas,
  resumoMeta,
  formatarData,
  dataValida,
  limiteQuantidade,
  quantidadeValida
} from "./metas-dados.js";

const formulario = document.getElementById("formulario-meta");
const campos = document.getElementById("campos-meta");
const nome = document.getElementById("nome-meta");
const tipo = document.getElementById("tipo-meta");
const alvo = document.getElementById("alvo-meta");
const dataRegistro = document.getElementById("data-meta");
const lista = document.getElementById("lista-metas");
const mensagem = document.getElementById("mensagem");

let estado = null;

function carregar() {
  try {
    estado = lerMetas();
    campos.disabled = false;
    mensagem.textContent = "";
  } catch {
    // Bloqueia a escrita sem apagar os dados que não puderam ser lidos.
    estado = null;
    campos.disabled = true;
    mensagem.textContent =
      "Não foi possível carregar as metas. Os dados foram preservados.";
  }

  mostrarMetas();
}

function gravar(novasMetas, texto) {
  if (!estado) return false;

  try {
    // A tela só assume a alteração depois que o navegador consegue salvar.
    estado = salvarMetas(novasMetas, estado.original);
    mensagem.textContent = texto;
    mostrarMetas();
    return true;
  } catch (erro) {
    mensagem.textContent =
      erro.name === "QuotaExceededError" || erro.name === "SecurityError"
        ? "O navegador não conseguiu salvar. Nenhuma alteração foi aplicada."
        : erro.message;

    return false;
  }
}

function ajustarTipo() {
  const diaria = tipo.value === "minutos-dia";

  document.getElementById("rotulo-alvo").textContent =
    diaria ? "Minutos por dia" : "Realizações por semana";

  alvo.max = limiteQuantidade(tipo.value);
  alvo.placeholder = diaria ? "Ex.: 30" : "Ex.: 5";
}

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();
  if (!estado) return;

  const objetivo = nome.value.trim();
  const quantidade = Number(alvo.value);

  if (
    !objetivo
    || objetivo.length > 60
    || !quantidadeValida(quantidade, tipo.value, 1)
  ) {
    mensagem.textContent =
      "Preencha o nome e uma quantidade inteira dentro do limite.";
    return;
  }

  const meta = {
    id: crypto.randomUUID(),
    nome: objetivo,
    tipo: tipo.value,
    alvo: quantidade,
    inicio: formatarData(new Date()),
    registros: {}
  };

  if (gravar([...estado.metas, meta], "Meta criada!")) {
    formulario.reset();
    ajustarTipo();
    nome.focus();
  }
});

function registrar(meta, valor) {
  const data = dataRegistro.value;
  const hoje = formatarData(new Date());

  if (
    !dataValida(data)
    || data > hoje
    || data < meta.inicio
    || !quantidadeValida(valor, meta.tipo)
  ) {
    mensagem.textContent =
      "Confira a quantidade e a data. Use uma data entre a criação e hoje.";
    return;
  }

  const novas = estado.metas.map(function (item) {
    if (item.id !== meta.id) return item;

    const registros = { ...item.registros };

    // Substitui o total do dia, evitando somar o mesmo registro duas vezes.
    if (valor === 0) delete registros[data];
    else registros[data] = valor;

    return { ...item, registros };
  });

  if (gravar(novas, "Progresso salvo! Ele também aparece no calendário.")) {
    document.getElementById("quantidade-" + meta.id)?.focus();
  }
}

function mostrarMetas() {
  lista.replaceChildren();
  const data = dataRegistro.value;

  if (estado) estado.metas.forEach(function (meta) {
    const resumo = resumoMeta(meta, data);
    if (!resumo) return;

    const item = document.createElement("li");
    item.className = "cartao-meta";

    const titulo = document.createElement("h3");

    // textContent exibe o nome como texto, sem executar HTML digitado.
    titulo.textContent = meta.nome;

    const situacao = document.createElement("p");
    situacao.className = "estado-meta";
    situacao.textContent = resumo.concluida
      ? "Meta cumprida"
      : resumo.andamento ? "Em andamento" : "Não iniciada";

    const texto = document.createElement("p");
    texto.textContent =
      `${resumo.total} de ${meta.alvo} ${resumo.unidade} (${resumo.percentual}%).`;

    const barra = document.createElement("progress");
    barra.max = 100;
    barra.value = resumo.percentual;
    barra.setAttribute("aria-label", "Progresso de " + meta.nome);

    const registro = document.createElement("form");
    registro.className = "registro-meta";

    const campo = document.createElement("div");
    const rotulo = document.createElement("label");
    const entrada = document.createElement("input");

    entrada.id = "quantidade-" + meta.id;
    entrada.type = "number";
    entrada.min = 0;
    entrada.max = limiteQuantidade(meta.tipo);
    entrada.step = 1;
    entrada.required = true;
    entrada.value = meta.registros[data] || 0;

    rotulo.htmlFor = entrada.id;
    rotulo.textContent = meta.tipo === "minutos-dia"
      ? "Minutos realizados nesta data"
      : "Realizações nesta data";

    const salvar = document.createElement("button");
    salvar.type = "submit";
    salvar.textContent = "Salvar dia";
    salvar.setAttribute("aria-label", "Salvar registro de " + meta.nome);

    campo.append(rotulo, entrada);
    registro.append(campo, salvar);

    registro.addEventListener("submit", function (evento) {
      evento.preventDefault();
      registrar(meta, Number(entrada.value));
    });

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "secundario";
    excluir.textContent = "Excluir meta";
    excluir.setAttribute("aria-label", "Excluir " + meta.nome);

    excluir.addEventListener("click", function () {
      if (!confirm(`Excluir "${meta.nome}" e todos os seus registros?`)) {
        return;
      }

      const restantes = estado.metas.filter(item => item.id !== meta.id);

      if (gravar(restantes, "Meta excluída.")) {
        dataRegistro.focus();
      }
    });

    item.append(titulo, situacao, texto, barra, registro, excluir);
    lista.append(item);
  });

  document.getElementById("metas-vazias").hidden =
    !estado || lista.children.length > 0;
}

dataRegistro.value = formatarData(new Date());
dataRegistro.max = dataRegistro.value;

dataRegistro.addEventListener("change", function () {
  const hoje = formatarData(new Date());
  dataRegistro.max = hoje;

  if (!dataValida(dataRegistro.value) || dataRegistro.value > hoje) {
    dataRegistro.value = hoje;
  }

  mostrarMetas();
});

tipo.addEventListener("change", ajustarTipo);
document.getElementById("atualizar-metas").addEventListener("click", carregar);

// Avisa sem apagar uma quantidade que ainda esteja sendo digitada.
window.addEventListener("storage", function (evento) {
  if (evento.key === "habitflow-metas" || evento.key === null) {
    mensagem.textContent =
      "As metas mudaram em outra aba. Clique em Atualizar.";
  }
});

ajustarTipo();
carregar();