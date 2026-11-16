# HabitFlow — Protótipo acadêmico em HTML e CSS

O **HabitFlow** é uma proposta de interface para organizar hábitos e adaptar a rotina à disponibilidade do usuário. O diferencial é o **Meu Dia**, que demonstra três intensidades: **Leve, Normal e Intenso**.

## Tecnologias utilizadas

- **HTML5:** estrutura semântica, navegação, cabeçalhos, listas, cartões, botões de opção (`radio`), caixas de seleção e elementos nativos como `details` e `progress`.
- **CSS3:** identidade visual, layout, responsividade, estados visuais e troca das rotinas por seletores `:checked`.
- **Sem JavaScript, bibliotecas externas, frameworks, backend ou banco de dados** nesta entrega.

> **Importante:** o HabitFlow é um **protótipo navegável com dados fictícios**, não um gerenciador funcional. As caixas de seleção alteram apenas a aparência; indicadores, calendário e metas são exemplos estáticos. Não há salvamento, importação de backups nem cálculo automático de resultados.

## Como executar

1. Faça o download do repositório pelo botão **Code → Download ZIP** do GitHub ou use `git clone https://github.com/Jhontropinha/HabitFlow.git`.
2. Abra a pasta do projeto no VS Code.
3. Abra o arquivo **`index.html` na raiz** com o navegador ou a extensão **Live Server**. Ele redireciona para `html/index.html`.
4. Navegue pelas cinco páginas pelo menu. Não é necessário instalar pacotes ou dependências.

## Estrutura

```text
HabitFlow/
├── index.html
├── README.md
├── css/
│   ├── inicio.css
│   ├── dashboard.css
│   └── apresentacao.css
└── html/
    ├── index.html
    ├── dashboard.html
    ├── meu-dia.html
    ├── calendario.html
    └── metas.html
```

| Página | O que demonstra |
| --- | --- |
| Início | Apresentação do HabitFlow, recursos e perguntas frequentes |
| Dashboard | Quatro hábitos e estatísticas ilustrativas |
| Meu Dia | Modos Leve, Normal e Intenso com alternância visual em HTML/CSS |
| Calendário | Novembro de 2026, com 30 dias e histórico fictício acessível pelo dia 13 |
| Metas | Quatro exemplos de metas e barras de progresso nativas |

## Revisão técnica final — 16/11/2026

A inspeção do código da branch `main` verificou:
- Links relativos e âncoras das cinco páginas: **nenhum destino interno quebrado identificado**.
- IDs HTML: **nenhuma duplicação identificada**.
- Associação de `label for` e `aria-labelledby`: **nenhum destino ausente identificado**.
- Modos Leve, Normal e Intenso: **controles HTML e seletores CSS correspondentes presentes**.
- Calendário: **dias 1 a 30 de novembro**, com o dia 13 apontando para um histórico ilustrativo.
- Metas: quatro elementos `progress` com valores de exemplo.
- Responsividade: existem regras em `@media` para diferentes larguras, inclusive celulares de até 390 px.
- Os arquivos HTML **não possuem tags `script`**.

Estas são **verificações estruturais do código**. Conferir alinhamento, legibilidade e comportamento real no navegador e no celular continua sendo uma etapa manual obrigatória antes da entrega.

## Checklist de verificação visual

- [ ] Início: menu, tabela e cartões legíveis no computador.
- [ ] Dashboard: quatro cartões sem cortes e caixas de seleção com mudança visual.
- [ ] Meu Dia: os três modos alternam suas listas ao clicar.
- [ ] Calendário: 30 datas visíveis; clicar no **dia 13** leva ao histórico de exemplo.
- [ ] Metas: quatro cartões e barras de progresso legíveis.
- [ ] Celular: testar aproximadamente **390 px** de largura; sem rolagem horizontal inesperada.
- [ ] Conferir todos os links no endereço publicado, se a publicação for exigida.

## Publicar no GitHub Pages

O repositório é público, mas o GitHub Pages precisa estar habilitado nas configurações:

1. Abra **Settings → Pages** no repositório.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione **main** e a pasta **/(root)**; clique em **Save**.
4. Verifique o endereço mostrado pelo GitHub quando a publicação estiver concluída.
5. Abra o endereço em janela anônima e teste os links das cinco páginas.

**Não declare um endereço público como válido sem testar a publicação.**

## Roteiro de apresentação — 17/11/2026

**Abertura:** “O HabitFlow nasceu da ideia de facilitar a organização de hábitos sem impor a mesma intensidade de rotina todos os dias.”

**Página inicial:** apresente o problema, os benefícios e a navegação entre as telas.

**Dashboard:** explique os cartões de hábitos e os indicadores, destacando que os valores são demonstrativos.

**Meu Dia:** selecione **Leve**, **Normal** e **Intenso** e mostre a mudança das listas usando apenas HTML e CSS. Explique que a intensidade do dia é o diferencial do conceito.

**Calendário e Metas:** mostre o histórico ilustrativo do dia 13 e os exemplos de progresso.

**Encerramento:** “Nesta etapa entregamos a interface responsiva em HTML e CSS. Em uma evolução futura, a aplicação poderia usar JavaScript e armazenamento para cadastrar hábitos e calcular o progresso real.”

**Entrega do projeto:** 16/11/2026 à noite. **Apresentação:** 17/11/2026.

## Repositório

https://github.com/Jhontropinha/HabitFlow
