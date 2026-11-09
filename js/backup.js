
import { validarMetas, dataValida } from "./metas-dados.js";

// 1. Chaves utilizadas pelo HabitFlow no localStorage.
const CHAVES = {
  habitos: "habitflow-basico",
  metas: "habitflow-metas",
  tema: "habitflow-basico-tema",
  modoDia: "habitflow-modo-dia"
};

const mensagemBackup = document.getElementById("mensagem");
const botaoExportar = document.getElementById("exportar");
const botaoImportar = document.getElementById("importar");
const inputArquivo = document.getElementById("arquivo-backup");

function mostrarMensagemBackup(texto) {
  mensagemBackup.textContent = texto;
}

// 2. Formata datas usando o horário local.
function formatarDataBackup(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

// 3. Verifica a estrutura de cada hábito.
function habitoValidoBackup(item) {
  return item
    && typeof item === "object"
    && !Array.isArray(item)
    && Number.isSafeInteger(item.id)
    && item.id > 0
    && typeof item.nome === "string"
    && item.nome.trim().length > 0
    && item.nome.length <= 60
    && typeof item.categoria === "string"
    && item.categoria.trim().length > 0
    && item.categoria.length <= 80
    && typeof item.meta === "string"
    && item.meta.trim().length > 0
    && item.meta.length <= 80
    && ["diario", "semana", "fim-semana"].includes(item.frequencia)
    && dataValida(item.criacao)
    && Array.isArray(item.concluidos)
    && item.concluidos.every(data =>
      dataValida(data) && data >= item.criacao
    )
    && (
      item.dispensados === undefined
      || (
        Array.isArray(item.dispensados)
        && item.dispensados.every(data =>
          dataValida(data)
          && data >= item.criacao
          && !item.concluidos.includes(data)
        )
      )
    );
}

// 4. Valida a lista inteira de hábitos.
function habitosValidosBackup(habitos) {
  if (!Array.isArray(habitos)) return false;

  const ids = new Set();

  return habitos.every(habito => {
    if (!habitoValidoBackup(habito) || ids.has(habito.id)) {
      return false;
    }

    ids.add(habito.id);
    return true;
  });
}

// 5. Valida as metas utilizando a função do próprio projeto.
function metasValidasBackup(dados) {
  if (dados === null) return true;

  if (
    !dados
    || typeof dados !== "object"
    || Array.isArray(dados)
    || dados.versao !== 1
  ) {
    return false;
  }

  try {
    validarMetas(dados.metas);
    return true;
  } catch {
    return false;
  }
}

// 6. Verifica a preferência do Modo do Dia.
function modoDiaValidoBackup(modoDia) {
  if (modoDia === null) return true;

  return modoDia
    && typeof modoDia === "object"
    && !Array.isArray(modoDia)
    && dataValida(modoDia.data)
    && ["leve", "normal", "intenso"].includes(modoDia.modo);
}

// 7. Aceita backups completos (v2) e antigos (v1).
function backupValido(conteudo) {
  if (
    !conteudo
    || typeof conteudo !== "object"
    || Array.isArray(conteudo)
    || !habitosValidosBackup(conteudo.habitos)
  ) {
    return false;
  }

  // Backups antigos contêm somente hábitos.
  if (conteudo.versao === 1) return true;

  if (conteudo.versao !== 2) return false;

  // Campos obrigatórios da nova versão.
  if (
    !Object.hasOwn(conteudo, "metas")
    || !Object.hasOwn(conteudo, "tema")
    || !Object.hasOwn(conteudo, "modoDia")
  ) {
    return false;
  }

  return metasValidasBackup(conteudo.metas)
    && (
      conteudo.tema === null
      || ["claro", "escuro"].includes(conteudo.tema)
    )
    && modoDiaValidoBackup(conteudo.modoDia);
}

// 8. Lê um JSON salvo no navegador.
function lerJSONBackup(chave, padrao) {
  const texto = localStorage.getItem(chave);

  return texto === null ? padrao : JSON.parse(texto);
}

// 9. Exporta todos os dados.
botaoExportar.addEventListener("click", function () {
  let url = null;

  try {
    const backup = {
      versao: 2,
      exportadoEm: new Date().toISOString(),

      habitos: lerJSONBackup(CHAVES.habitos, []),

      metas: lerJSONBackup(CHAVES.metas, null),

      tema: localStorage.getItem(CHAVES.tema),

      modoDia: lerJSONBackup(CHAVES.modoDia, null)
    };

    // Impede gerar um arquivo com informações inválidas.
    if (!backupValido(backup)) {
      throw new Error(
        "Existem dados inválidos no navegador. O backup não foi gerado."
      );
    }

    const arquivo = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    url = URL.createObjectURL(arquivo);

    const link = document.createElement("a");

    link.href = url;
    link.download =
      `habitflow-backup-completo-${formatarDataBackup(new Date())}.json`;

    document.body.append(link);
    link.click();
    link.remove();

    mostrarMensagemBackup(
      "Download solicitado! O backup inclui hábitos, metas e preferências."
    );

  } catch (erro) {
    mostrarMensagemBackup(
      erro.message || "Não foi possível gerar o backup."
    );

  } finally {
    if (url) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
});

// 10. Restaura os dados com tentativa de reversão em caso de falha.
function restaurarBackup(conteudo) {
  // Sempre restaura os hábitos.
  const alteracoes = [
    [CHAVES.habitos, JSON.stringify(conteudo.habitos)]
  ];

  // Somente a versão 2 contém os demais dados.
  if (conteudo.versao === 2) {
    alteracoes.push(
      [
        CHAVES.metas,
        conteudo.metas === null
          ? null
          : JSON.stringify(conteudo.metas)
      ],
      [CHAVES.tema, conteudo.tema],
      [
        CHAVES.modoDia,
        conteudo.modoDia === null
          ? null
          : JSON.stringify(conteudo.modoDia)
      ]
    );
  }

  // Guarda os valores existentes antes de modificar qualquer chave.
  const anteriores = new Map();

  for (const [chave] of alteracoes) {
    anteriores.set(chave, localStorage.getItem(chave));
  }

  const aplicadas = [];

  try {
    for (const [chave, valor] of alteracoes) {
      if (valor === null) {
        localStorage.removeItem(chave);
      } else {
        localStorage.setItem(chave, valor);
      }

      aplicadas.push(chave);
    }

  } catch (erro) {
    let reversaoCompleta = true;

    // Restaura as chaves já modificadas, na ordem inversa.
    for (const chave of aplicadas.reverse()) {
      try {
        const valorAnterior = anteriores.get(chave);

        if (valorAnterior === null) {
          localStorage.removeItem(chave);
        } else {
          localStorage.setItem(chave, valorAnterior);
        }
      } catch {
        reversaoCompleta = false;
      }
    }

    if (!reversaoCompleta) {
      throw new Error(
        "A restauração falhou e não foi possível reverter todas " +
        "as alterações. Verifique seus dados e mantenha seu backup."
      );
    }

    throw new Error(
      "Não foi possível salvar o backup. " +
      "As alterações realizadas foram revertidas."
    );
  }
}

// 11. Abre a seleção de arquivos JSON.
botaoImportar.addEventListener("click", function () {
  inputArquivo.click();
});

// 12. Lê, valida e importa o arquivo selecionado.
inputArquivo.addEventListener("change", function () {
  const arquivo = inputArquivo.files[0];

  if (!arquivo) return;

  if (arquivo.size > 5 * 1024 * 1024) {
    mostrarMensagemBackup(
      "Arquivo muito grande. Selecione um JSON de até 5 MB."
    );

    inputArquivo.value = "";
    return;
  }

  const leitor = new FileReader();

  leitor.onerror = function () {
    mostrarMensagemBackup("Não foi possível ler o arquivo.");
    inputArquivo.value = "";
  };

  leitor.onload = function () {
    try {
      const conteudo = JSON.parse(leitor.result);

      if (!backupValido(conteudo)) {
        mostrarMensagemBackup(
          "Backup inválido ou incompatível. Nenhum dado foi alterado."
        );
        return;
      }

      const completo = conteudo.versao === 2;

      const descricao = completo
        ? "Isso substituirá seus hábitos, metas e preferências atuais."
        : "Backup antigo: somente os hábitos serão substituídos. " +
          "Suas metas e preferências atuais serão mantidas.";

      const confirmar = window.confirm(
        `Restaurar ${conteudo.habitos.length} hábito(s)?\n\n` +
        descricao +
        "\n\nDeseja continuar?"
      );

      if (!confirmar) {
        mostrarMensagemBackup(
          "Importação cancelada. Seus dados foram mantidos."
        );
        return;
      }

      restaurarBackup(conteudo);

      mostrarMensagemBackup(
        completo
          ? "Backup completo restaurado! Atualizando..."
          : "Hábitos restaurados! Metas e preferências preservadas."
      );

      setTimeout(() => window.location.reload(), 800);

    } catch (erro) {
      mostrarMensagemBackup(
        erro instanceof SyntaxError
          ? "O arquivo não contém um JSON válido."
          : erro.message || "Não foi possível importar o backup."
      );

    } finally {
      inputArquivo.value = "";
    }
  };

  try {
    leitor.readAsText(arquivo);

  } catch {
    mostrarMensagemBackup(
      "Não foi possível abrir o arquivo selecionado."
    );

    inputArquivo.value = "";
  }
});
