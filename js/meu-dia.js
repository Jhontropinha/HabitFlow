
const listaDia = document.getElementById("lista-dia");
const listaVazia = document.getElementById("lista-vazia");
const mensagem = document.getElementById("mensagem");
const barraDia = document.getElementById("barra-dia");
const textoProgresso = document.getElementById("texto-progresso");
const botoesModo = document.querySelectorAll("[data-modo]");
const avisoModo = document.getElementById("aviso-modo");
const botaoTema = document.getElementById("tema");

const CHAVE_HABITOS = "habitflow-basico";
const CHAVE_MODO = "habitflow-modo-dia";

const agora = new Date();
const hoje = [
  agora.getFullYear(),
  String(agora.getMonth() + 1).padStart(2, "0"),
  String(agora.getDate()).padStart(2, "0")
].join("-");

const nomesModo = {
  leve: "Leve",
  normal: "Normal",
  intenso: "Intenso"
};

let modoAtual = "normal";

document.getElementById("data-atual").textContent =
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full"
  }).format(agora);

function exibirMensagem(texto) {
  mensagem.hidden = false;
  mensagem.textContent = texto;
}

function previstoHoje(habito) {
  if (habito.criacao > hoje) return false;

  const diaSemana = agora.getDay();

  if (habito.frequencia === "semana") {
    return diaSemana >= 1 && diaSemana <= 5;
  }

  if (habito.frequencia === "fim-semana") {
    return diaSemana === 0 || diaSemana === 6;
  }

  return habito.frequencia === "diario";
}

// Lê e valida os hábitos existentes.
function lerHabitos() {
  const dados = JSON.parse(
    localStorage.getItem(CHAVE_HABITOS) || "[]"
  );

  if (!Array.isArray(dados)) {
    throw new Error("Lista inválida");
  }

  const ids = new Set();

  const valido = dados.every(function (item) {
    if (
      !item ||
      !Number.isSafeInteger(item.id) ||
      ids.has(item.id) ||
      typeof item.nome !== "string" ||
      typeof item.meta !== "string" ||
      typeof item.categoria !== "string" ||
      typeof item.criacao !== "string" ||
      !["diario", "semana", "fim-semana"].includes(item.frequencia) ||
      !Array.isArray(item.concluidos) ||
      (item.dispensados !== undefined && (
        !Array.isArray(item.dispensados) ||
        !item.dispensados.every(function (dia) {
          return typeof dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dia)
            && dia >= item.criacao && !item.concluidos.includes(dia);
        })
      ))
    ) {
      return false;
    }

    ids.add(item.id);
    return true;
  });

  if (!valido) {
    throw new Error("Hábitos inválidos");
  }

  return dados;
}

// Escolhe os hábitos conforme o modo selecionado.
function selecionarHabitos(habitos) {
  const programados = habitos.filter(previstoHoje);

  if (modoAtual === "leve") {
    const quantidade = Math.ceil(programados.length / 2);

    return programados.slice(0, quantidade).map(function (habito) {
      return { habito: habito, extra: false };
    });
  }

  const selecionados = programados.map(function (habito) {
    return { habito: habito, extra: false };
  });

  if (modoAtual === "intenso") {
    const extras = habitos.filter(function (habito) {
      return habito.criacao <= hoje && !previstoHoje(habito);
    }).slice(0, 2);

    extras.forEach(function (habito) {
      selecionados.push({
        habito: habito,
        extra: true
      });
    });
  }

  return selecionados;
}

// Monta a lista e atualiza o progresso.
function mostrarHabitos() {
  let selecionados;

  try {
    selecionados = selecionarHabitos(lerHabitos());

    mensagem.hidden = true;
    mensagem.textContent = "";
  } catch (erro) {
    listaDia.replaceChildren();
    listaVazia.hidden = false;
    listaVazia.textContent =
      "Não foi possível carregar seus hábitos.";

    barraDia.value = 0;
    textoProgresso.textContent = "Dados indisponíveis.";

    exibirMensagem(
      "Os dados não puderam ser lidos. Seus hábitos não foram alterados."
    );
    return;
  }

  listaDia.replaceChildren();
  // Atividades obrigatórias e extras são contabilizadas separadamente.
let concluidosObrigatorios = 0;
let extrasConcluidos = 0;

const totalObrigatorios = selecionados.filter(function (entrada) {
  return !entrada.extra;
}).length;

  selecionados.forEach(function (entrada) {
    const habito = entrada.habito;
    const finalizado = habito.concluidos.includes(hoje);

    if (finalizado) {
  if (entrada.extra) {
    extrasConcluidos++;
  } else {
    concluidosObrigatorios++;
  }
}

    const item = document.createElement("li");

    if (finalizado) {
      item.classList.add("concluido");
    }

    if (entrada.extra) {
      item.classList.add("extra");
    }

    const linha = document.createElement("div");
    linha.className = "linha-habito";

    const rotulo = document.createElement("label");
    rotulo.className = "marcar-habito";

    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.checked = finalizado;

    caixa.setAttribute(
      "aria-label",
      "Concluir " + habito.nome
    );

    caixa.addEventListener("change", function () {
      alternarConclusao(habito.id);
    });

    const nome = document.createElement("strong");
    nome.textContent = habito.nome;

    rotulo.append(caixa, nome);

    const situacao = document.createElement("span");
    situacao.className = "situacao";

    situacao.textContent = finalizado
      ? "Concluído"
      : entrada.extra
        ? "Extra opcional"
        : "Pendente";

    linha.append(rotulo, situacao);

    const detalhe = document.createElement("p");
    detalhe.className = "detalhe-habito";

    detalhe.textContent =
      habito.categoria + " • Meta: " + habito.meta +
      (entrada.extra ? " • Fora da frequência programada" : "");

    item.append(linha, detalhe);
    listaDia.append(item);
  });

  listaVazia.hidden = selecionados.length > 0;

  if (!selecionados.length) {
    listaVazia.textContent =
      "Nenhum hábito para este modo hoje. Cadastre hábitos no dashboard.";
  }

  const porcentagem = totalObrigatorios
  ? Math.round(
      concluidosObrigatorios / totalObrigatorios * 100
    )
  : 0;

barraDia.value = porcentagem;

textoProgresso.textContent =
  concluidosObrigatorios + " de " + totalObrigatorios +
  " hábitos obrigatórios concluídos (" + porcentagem + "%)." +
  (modoAtual === "intenso"
    ? " • " + extrasConcluidos + " extra(s) concluído(s)."
    : "");
}

// Marca ou desmarca o hábito e salva no navegador.
function alternarConclusao(id) {
  try {
    const habitos = lerHabitos();

    const habito = habitos.find(function (item) {
      return item.id === id;
    });

    if (!habito || habito.criacao > hoje) {
      throw new Error("Hábito indisponível");
    }

    if (habito.concluidos.includes(hoje)) {
      habito.concluidos = habito.concluidos.filter(function (dia) {
        return dia !== hoje;
      });
    } else {
      habito.concluidos.push(hoje);
      if (Array.isArray(habito.dispensados)) {
        habito.dispensados = habito.dispensados.filter(function (dia) { return dia !== hoje; });
      }
    }

    localStorage.setItem(
      CHAVE_HABITOS,
      JSON.stringify(habitos)
    );

    mostrarHabitos();
  } catch (erro) {
    mostrarHabitos();

    exibirMensagem(
      "Não foi possível salvar a conclusão. Nenhum dado foi substituído."
    );
  }
}

// Atualiza a seleção visual e a rotina.
// Uma dispensa protege a sequência, mas nunca é uma conclusão.
function atualizarDispensasDoDia(modo) {
  const habitos = lerHabitos();
  const programados = habitos.filter(previstoHoje);
  const limite = Math.ceil(programados.length / 2);
  const ativos = new Set(programados.slice(0, limite).map(function (h) { return h.id; }));

  let mudou = false;
  habitos.forEach(function (habito) {
    const anteriores = Array.isArray(habito.dispensados) ? habito.dispensados : [];
    const dispensar = modo === "leve" && previstoHoje(habito)
      && !ativos.has(habito.id) && !habito.concluidos.includes(hoje);
    const novos = anteriores.filter(function (dia) { return dia !== hoje; });
    if (dispensar) novos.push(hoje);
    if (JSON.stringify(novos) !== JSON.stringify(anteriores)) {
      habito.dispensados = novos;
      mudou = true;
    }
  });

  if (mudou) {
    localStorage.setItem(CHAVE_HABITOS, JSON.stringify(habitos));
  }
  return habitos.filter(function (h) {
    return Array.isArray(h.dispensados) && h.dispensados.includes(hoje);
  }).length;
}

function escolherModo(modo) {
  if (!Object.hasOwn(nomesModo, modo)) return;
  let dispensados = 0;
  try {
    dispensados = atualizarDispensasDoDia(modo);
  } catch (erro) {
    exibirMensagem("Não foi possível salvar as dispensas. Os dados anteriores foram preservados.");
    return;
  }

  modoAtual = modo;
  botoesModo.forEach(function (botao) {
    botao.setAttribute("aria-pressed", String(botao.dataset.modo === modo));
  });

  const explicacoes = {
    leve: "Metade dos hábitos programados fica ativa; os outros recebem uma dispensa hoje, sem conclusão fictícia.",
    normal: "Todos os hábitos previstos ficam ativos. As dispensas de hoje são canceladas.",
    intenso: "Todos os previstos e até dois extras opcionais. As dispensas de hoje são canceladas."
  };
  avisoModo.textContent = "Modo " + nomesModo[modo] + ". " + explicacoes[modo]
    + (dispensados ? " " + dispensados + " hábito(s) dispensado(s) hoje." : "");
  mostrarHabitos();

  try {
    localStorage.setItem(CHAVE_MODO, JSON.stringify({ data: hoje, modo: modo }));
  } catch (erro) {
    exibirMensagem("O modo funciona, mas a preferência não pôde ser salva.");
  }
}

botoesModo.forEach(function (botao) {
  botao.addEventListener("click", function () {
    escolherModo(botao.dataset.modo);
  });
});

// Tema claro e escuro.
function aplicarTema(escuro) {
  document.body.classList.toggle("escuro", escuro);

  botaoTema.textContent =
    escuro ? "Modo claro" : "Modo escuro";

  botaoTema.setAttribute(
    "aria-pressed",
    String(escuro)
  );
}

try {
  aplicarTema(
    localStorage.getItem("habitflow-basico-tema") === "escuro"
  );
} catch (erro) {
  aplicarTema(false);
}

botaoTema.addEventListener("click", function () {
  const escuro = !document.body.classList.contains("escuro");

  aplicarTema(escuro);

  try {
    localStorage.setItem(
      "habitflow-basico-tema",
      escuro ? "escuro" : "claro"
    );
  } catch (erro) {
    exibirMensagem(
      "O tema mudou, mas a preferência não pôde ser salva."
    );
  }
});

// Recupera a preferência apenas para a data atual.
try {
  const salvo = JSON.parse(
    localStorage.getItem(CHAVE_MODO) || "null"
  );

  if (
    salvo &&
    salvo.data === hoje &&
    Object.hasOwn(nomesModo, salvo.modo)
  ) {
    modoAtual = salvo.modo;
  }
} catch (erro) {
  modoAtual = "normal";
}

// Se o backup restaurou dispensas de hoje, elas indicam que o dia era Leve.
// Recupera o Modo Leve antes de chamar escolherModo; abrir a página não
// deve apagar dispensas restauradas por uma preferência antiga de Modo Normal.
try {
  const habitosRestaurados = lerHabitos();
  const possuiDispensaHoje = habitosRestaurados.some(function (habito) {
    return Array.isArray(habito.dispensados) && habito.dispensados.includes(hoje);
  });
  if (possuiDispensaHoje) modoAtual = "leve";
} catch (erro) {
  // Se os dados estiverem inválidos, mostrarHabitos informará o erro.
}

// Inicialização.
escolherModo(modoAtual);
