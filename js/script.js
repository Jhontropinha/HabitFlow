// 1. Elementos do HTML que serão usados no JavaScript.
const formulario = document.getElementById("formulario");
const campoNome = document.getElementById("nome");
const campoCategoria = document.getElementById("categoria");
const campoFrequencia = document.getElementById("frequencia");
const campoMeta = document.getElementById("meta");
const campoData = document.getElementById("data");
const filtro = document.getElementById("filtro");
const lista = document.getElementById("lista");
const mensagem = document.getElementById("mensagem");
const botaoTema = document.getElementById("tema");

let habitos = [];
let idEmEdicao = null;

// 2. Datas no formato ano-mês-dia, usando o horário local.
function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return ano + "-" + mes + "-" + dia;
}

function converterData(texto) {
  const partes = texto.split("-");
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 12);
}

const hoje = formatarData(new Date());
campoData.value = hoje;
campoData.max = hoje;

// 3. O localStorage mantém os dados após fechar a página.
try {
  const dados = JSON.parse(localStorage.getItem("habitflow-basico") || "[]");
  if (Array.isArray(dados)) {
    habitos = dados.filter(function (habito) {
      return habito && typeof habito.id === "number"
        && typeof habito.nome === "string" && typeof habito.categoria === "string"
        && typeof habito.meta === "string" && typeof habito.criacao === "string"
        && ["diario", "semana", "fim-semana"].includes(habito.frequencia)
        && Array.isArray(habito.concluidos);
    });
  }
  aplicarTema(localStorage.getItem("habitflow-basico-tema") === "escuro");
} catch (erro) {
  mensagem.textContent = "Não foi possível carregar os dados salvos neste navegador.";
}

function salvarDados(texto) {
  try {
    localStorage.setItem("habitflow-basico", JSON.stringify(habitos));
    mensagem.textContent = texto;
  } catch (erro) {
    mensagem.textContent = "A alteração foi feita, mas o navegador não conseguiu salvá-la. Ela pode ser perdida ao fechar a página.";
  }
}

function previstoNaData(habito, data) {
  if (data < habito.criacao) return false;
  const dia = converterData(data).getDay();
  if (habito.frequencia === "semana") return dia >= 1 && dia <= 5;
  if (habito.frequencia === "fim-semana") return dia === 0 || dia === 6;
  return true;
}

function nomeDaFrequencia(frequencia) {
  if (frequencia === "semana") return "Segunda a sexta";
  if (frequencia === "fim-semana") return "Sábado e domingo";
  return "Todos os dias";
}

// Conta as últimas datas programadas em que o hábito foi concluído.
function calcularSequencia(habito) {
  let sequencia = 0;
  const data = converterData(hoje);

  while (formatarData(data) >= habito.criacao) {
    const dia = formatarData(data);
    if (previstoNaData(habito, dia)) {
      if (habito.concluidos.includes(dia)) {
        sequencia++;
      } else if (dia !== hoje) {
        break;
      }
    }
    data.setDate(data.getDate() - 1);
  }
  return sequencia;
}

// 4. Criar ou editar um hábito usando o mesmo formulário.
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();
  const nome = campoNome.value.trim();
  const meta = campoMeta.value.trim();

  if (nome === "" || meta === "") {
    mensagem.textContent = "Preencha o nome e a meta do hábito.";
    if (nome === "") campoNome.focus();
    else campoMeta.focus();
    return;
  }

  if (idEmEdicao === null) {
    habitos.push({
      id: Date.now(),
      nome: nome,
      categoria: campoCategoria.value,
      frequencia: campoFrequencia.value,
      meta: meta,
      criacao: hoje,
      concluidos: []
    });
    salvarDados("Hábito adicionado! Ele aparecerá nas datas programadas.");
  } else {
    const habito = habitos.find(function (item) {
      return item.id === idEmEdicao;
    });
    habito.nome = nome;
    habito.categoria = campoCategoria.value;
    habito.frequencia = campoFrequencia.value;
    habito.meta = meta;
    salvarDados("Hábito atualizado!");
  }

  limparFormulario();
  atualizarPagina();
});

function limparFormulario() {
  formulario.reset();
  idEmEdicao = null;
  document.getElementById("titulo-formulario").textContent = "Novo hábito";
  document.getElementById("salvar").textContent = "Adicionar hábito";
  document.getElementById("cancelar").hidden = true;
}

function editarHabito(id) {
  const habito = habitos.find(function (item) { return item.id === id; });
  idEmEdicao = id;
  campoNome.value = habito.nome;
  campoCategoria.value = habito.categoria;
  campoFrequencia.value = habito.frequencia;
  campoMeta.value = habito.meta;
  document.getElementById("titulo-formulario").textContent = "Editar hábito";
  document.getElementById("salvar").textContent = "Salvar alterações";
  document.getElementById("cancelar").hidden = false;
  campoNome.focus();
}

function excluirHabito(id) {
  const habito = habitos.find(function (item) { return item.id === id; });
  if (!confirm('Excluir "' + habito.nome + '" e seu histórico?')) return;
  habitos = habitos.filter(function (item) { return item.id !== id; });
  if (idEmEdicao === id) limparFormulario();
  salvarDados("Hábito excluído.");
  atualizarPagina();
}

function marcarHabito(id, data) {
  const habito = habitos.find(function (item) { return item.id === id; });
  if (!habito || data > hoje || !previstoNaData(habito, data)) return;

  if (habito.concluidos.includes(data)) {
    habito.concluidos = habito.concluidos.filter(function (dia) { return dia !== data; });
  } else {
    habito.concluidos.push(data);
  }

  salvarDados("Registro atualizado.");
  atualizarPagina();
  const caixa = document.getElementById("habito-" + id);
  if (caixa) caixa.focus({ preventScroll: true });
}

// 5. Montar a lista. textContent mostra textos sem interpretar código HTML.
function mostrarLista() {
  lista.replaceChildren();
  const data = campoData.value;

  habitos.forEach(function (habito) {
    if (data < habito.criacao) return;
    const previsto = previstoNaData(habito, data);
    const concluido = habito.concluidos.includes(data);
    if (filtro.value === "pendentes" && (concluido || !previsto)) return;
    if (filtro.value === "concluidos" && !concluido) return;

    const item = document.createElement("li");
    if (concluido) item.classList.add("concluido");

    const rotulo = document.createElement("label");
    rotulo.className = "nome-habito";
    const caixa = document.createElement("input");
    caixa.id = "habito-" + habito.id;
    caixa.type = "checkbox";
    caixa.checked = concluido;
    caixa.disabled = !previsto;
    caixa.addEventListener("change", function () { marcarHabito(habito.id, data); });
    const nome = document.createElement("strong");
    nome.textContent = habito.nome;
    rotulo.append(caixa, nome);

    const detalhes = document.createElement("p");
    detalhes.textContent = habito.categoria + " • " + nomeDaFrequencia(habito.frequencia) + " • Meta: " + habito.meta;
    if (!previsto) detalhes.textContent += " • Não previsto nesta data.";
    const sequencia = document.createElement("p");
    sequencia.textContent = "Sequência atual: " + calcularSequencia(habito) + " realizações seguidas.";

    const acoes = document.createElement("div");
    acoes.className = "acoes";
    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "secundario";
    editar.textContent = "Editar";
    editar.setAttribute("aria-label", "Editar " + habito.nome);
    editar.addEventListener("click", function () { editarHabito(habito.id); });
    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "secundario";
    excluir.textContent = "Excluir";
    excluir.setAttribute("aria-label", "Excluir " + habito.nome);
    excluir.addEventListener("click", function () { excluirHabito(habito.id); });
    acoes.append(editar, excluir);
    item.append(rotulo, detalhes, sequencia, acoes);
    lista.append(item);
  });

  const vazio = document.getElementById("lista-vazia");
  vazio.hidden = lista.children.length > 0;
  vazio.textContent = filtro.value === "todos"
    ? "Nenhum hábito cadastrado até esta data. Adicione um no formulário acima."
    : "Nenhum hábito corresponde ao filtro escolhido.";
}

// 6. Calcular e mostrar as barras de progresso.
function contarPeriodo(inicio, fim) {
  let previstos = 0;
  let concluidos = 0;
  const data = converterData(inicio);

  while (formatarData(data) <= fim) {
    const dia = formatarData(data);
    habitos.forEach(function (habito) {
      if (previstoNaData(habito, dia)) {
        previstos++;
        if (habito.concluidos.includes(dia)) concluidos++;
      }
    });
    data.setDate(data.getDate() + 1);
  }
  return { previstos: previstos, concluidos: concluidos };
}

function mostrarBarra(nome, inicio, fim) {
  const total = contarPeriodo(inicio, fim);
  const porcentagem = total.previstos === 0 ? 0 : Math.round(total.concluidos / total.previstos * 100);
  document.getElementById("barra-" + nome).value = porcentagem;
  document.getElementById("texto-" + nome).textContent = total.concluidos + " de " + total.previstos + " concluídos (" + porcentagem + "%)";
}

function atualizarPagina() {
  mostrarLista();
  mostrarBarra("dia", campoData.value, campoData.value);

  const segunda = converterData(hoje);
  const diaDaSemana = segunda.getDay();
  segunda.setDate(segunda.getDate() - (diaDaSemana === 0 ? 6 : diaDaSemana - 1));
  mostrarBarra("semana", formatarData(segunda), hoje);
  mostrarBarra("mes", hoje.slice(0, 8) + "01", hoje);
}

// 7. Eventos dos filtros, do cancelamento e do tema.
campoData.addEventListener("change", function () {
  if (!campoData.value || campoData.value > hoje) campoData.value = hoje;
  atualizarPagina();
});
filtro.addEventListener("change", atualizarPagina);
document.getElementById("cancelar").addEventListener("click", limparFormulario);

function aplicarTema(escuro) {
  document.body.classList.toggle("escuro", escuro);
  botaoTema.textContent = escuro ? "Modo claro" : "Modo escuro";
  botaoTema.setAttribute("aria-pressed", String(escuro));
}

botaoTema.addEventListener("click", function () {
  const escuro = !document.body.classList.contains("escuro");
  aplicarTema(escuro);
  try {
    localStorage.setItem("habitflow-basico-tema", escuro ? "escuro" : "claro");
  } catch (erro) {
    mensagem.textContent = "O tema foi alterado, mas não pôde ser salvo neste navegador.";
  }
});

atualizarPagina();

document.getElementById("exportar").addEventListener("click", function () {
  let url;

  try {
    const backup = {

      versao: 1,
      exportadoEm: new Date().toISOString(),
      habitos: habitos

    };

    const arquivo = new Blob(

      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }

    )

    url = URL.createObjectURL(arquivo);

    const link = document.createElement("a");
    link.href = url;
    link.download = `habitflow-backup-${formatarData(new Date())}.json`;

    document.body.append(link);
    link.click();
    link.remove();

    mensagem.textContent = "Download solicitado. Confira o arquivo na pasta de downloads.";
  } catch (erro) {
    mensagem.textContent = "Não foi possível gerar o backup.";
  } finally {
    if (url) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
});

const botaoImportar = document.getElementById("importar");
const inputArquivo = document.getElementById("arquivo-backup");

botaoImportar.addEventListener("click", function () {
  inputArquivo.click();
});

inputArquivo.addEventListener("change", function () {
  const arquivo = inputArquivo.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = function (e) {
    try {
      const backup = JSON.parse(e.target.result);

      if (!backup || backup.versao !== 1 || !Array.isArray(backup.habitos)) {
        mensagem.textContent = "O arquivo selecionado não é um backup válido.";
        inputArquivo.value = "";
        return;
      }

      const confirmar = window.confirm(
        `Restaurar ${backup.habitos.length} hábitos do backup? Isso substituirá os hábitos atuais.`
      );

      if (!confirmar) {
        mensagem.textContent = "Importação cancelada.";
        inputArquivo.value = "";
        return;
      }

      habitos.length = 0;
      backup.habitos.forEach((item) => habitos.push(item));
      localStorage.setItem("habitflow-basico", JSON.stringify(habitos));

      mensagem.textContent = "Backup restaurado com sucesso!";
      setTimeout(() => window.location.reload(), 800);
    } catch (erro) {
      mensagem.textContent = "Não foi possível ler o arquivo de backup.";
    } finally {
      inputArquivo.value = "";
    }
  };

  leitor.readAsText(arquivo);
});