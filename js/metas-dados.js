const CHAVE_METAS = "habitflow-metas";

// Usa a data local, evitando alterações de dia por causa do fuso horário.
export function formatarData(data) {
  const ano = String(data.getFullYear()).padStart(4, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export function converterData(texto) {
  return new Date(texto + "T12:00:00");
}

export function dataValida(texto) {
  return typeof texto === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(texto)
    && formatarData(converterData(texto)) === texto;
}

export function limiteQuantidade(tipo) {
  return tipo === "minutos-dia" ? 1440 : 1000;
}

export function quantidadeValida(valor, tipo, minimo = 0) {
  return Number.isInteger(valor)
    && valor >= minimo
    && valor <= limiteQuantidade(tipo);
}

// Se houver dados inválidos, interrompe a gravação para preservá-los.
export function validarMetas(metas) {
  if (!Array.isArray(metas)) {
    throw new Error("A lista de metas salva é inválida.");
  }

  const ids = new Set();

  for (const meta of metas) {
    if (
      !meta
      || typeof meta.id !== "string"
      || !meta.id
      || ids.has(meta.id)
      || typeof meta.nome !== "string"
      || !meta.nome.trim()
      || meta.nome.length > 60
      || !["minutos-dia", "vezes-semana"].includes(meta.tipo)
      || !quantidadeValida(meta.alvo, meta.tipo, 1)
      || !dataValida(meta.inicio)
      || !meta.registros
      || typeof meta.registros !== "object"
      || Array.isArray(meta.registros)
    ) {
      throw new Error(
        "Há uma meta inválida. Os dados salvos não foram alterados."
      );
    }

    ids.add(meta.id);

    for (const [data, quantidade] of Object.entries(meta.registros)) {
      if (
        !dataValida(data)
        || data < meta.inicio
        || !quantidadeValida(quantidade, meta.tipo)
      ) {
        throw new Error(
          "Há um registro inválido. Os dados salvos foram preservados."
        );
      }
    }
  }
}

export function lerMetas() {
  const original = localStorage.getItem(CHAVE_METAS);

  if (original === null) {
    return { metas: [], original };
  }

  const dados = JSON.parse(original);

  if (!dados || dados.versao !== 1) {
    throw new Error("O formato das metas salvas não é reconhecido.");
  }

  validarMetas(dados.metas);
  return { metas: dados.metas, original };
}

export function salvarMetas(metas, original) {
  validarMetas(metas);

  // Evita sobrescrever registros alterados em outra aba.
  if (localStorage.getItem(CHAVE_METAS) !== original) {
    throw new Error(
      "As metas mudaram em outra aba. Clique em Atualizar."
    );
  }

  const texto = JSON.stringify({ versao: 1, metas });
  localStorage.setItem(CHAVE_METAS, texto);

  return { metas, original: texto };
}

export function resumoMeta(meta, data) {
  if (!dataValida(data) || data < meta.inicio) {
    return null;
  }

  let total = meta.registros[data] || 0;

  if (meta.tipo === "vezes-semana") {
    const segunda = converterData(data);
    segunda.setDate(
      segunda.getDate() - (segunda.getDay() + 6) % 7
    );

    const inicio = formatarData(segunda);

    // Soma apenas a semana consultada, até o dia selecionado.
    total = Object.entries(meta.registros).reduce(
      (soma, [dia, quantidade]) => {
        return dia >= inicio && dia <= data
          ? soma + quantidade
          : soma;
      },
      0
    );
  }

  return {
    total,
    unidade: meta.tipo === "minutos-dia"
      ? "minutos no dia"
      : "realizações na semana até este dia",
    percentual: Math.min(100, Math.round(total / meta.alvo * 100)),
    concluida: total >= meta.alvo,
    andamento: total > 0
  };
}