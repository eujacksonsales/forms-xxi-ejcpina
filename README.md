# Formulário de Suplentes - XXI EJCPINA

Formulário dinâmico HTML que permite adicionar múltiplos blocos de perguntas e enviar os dados para Google Sheets via Google Apps Script.

## Características

- Formulário dinâmico com capacidade de adicionar múltiplos blocos de perguntas
- Duas perguntas por bloco:
  1. **Número da Ficha** (texto curto)
  2. **Presença em Missas** (Sim, Não, Talvez - múltipla escolha)
- Validação de campos obrigatórios
- Interface moderna e responsiva
- Integração com Google Sheets via Apps Script

## Estrutura do Projeto

```
forms_suplentes_xxi_ejcpina/
├── index.html      # Formulário HTML principal
├── Code.gs         # Google Apps Script para processar dados
└── README.md       # Este arquivo
```

## Configuração

### Passo 1: Criar Planilha Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha
3. Renomeie a primeira aba para "Respostas" (ou mantenha o nome padrão e ajuste no código)
4. Copie o **ID da planilha** da URL:
   - A URL será algo como: `https://docs.google.com/spreadsheets/d/SEU_SHEET_ID_AQUI/edit`
   - O `SEU_SHEET_ID_AQUI` é o que você precisa copiar

### Passo 2: Configurar Google Apps Script

1. Acesse [Google Apps Script](https://script.google.com)
2. Clique em "Novo projeto"
3. Cole o conteúdo do arquivo `Code.gs` no editor
4. Substitua `REPLACE_WITH_YOUR_SHEET_ID` pelo ID da sua planilha (linha 11)
5. Se você usou um nome diferente para a aba, ajuste `SHEET_NAME` (linha 12)

### Passo 3: Fazer Deploy do Apps Script

1. No editor do Apps Script, clique em "Implantar" → "Nova implantação"
2. Clique no ícone de engrenagem ⚙️ e selecione "Aplicativo da Web"
3. Configure:
   - **Descrição**: "Formulário Suplentes" (ou qualquer nome)
   - **Executar como**: Eu (seu email)
   - **Quem tem acesso**: Qualquer pessoa
4. Clique em "Implantar"
5. Autorize o acesso quando solicitado
6. **Copie a URL do Web App** que será gerada (algo como: `https://script.google.com/macros/s/...`)

### Passo 4: Configurar o HTML

1. Abra o arquivo `index.html` em um editor de texto
2. Localize a linha com `const APPS_SCRIPT_URL = 'REPLACE_WITH_YOUR_WEB_APP_URL';`
3. Substitua `REPLACE_WITH_YOUR_WEB_APP_URL` pela URL do Web App que você copiou no passo anterior
4. Salve o arquivo

### Passo 5: Usar o Formulário

1. Abra o arquivo `index.html` no navegador (duplo clique ou arraste para o navegador)
2. Preencha os campos do formulário
3. Clique em "Adicionar Outra Ficha" para adicionar mais blocos de perguntas
4. Clique em "Enviar Formulário" quando terminar
5. Verifique os dados na sua planilha Google Sheets

## Estrutura dos Dados na Planilha

A planilha terá as seguintes colunas:

| timestamp | numero_ficha | presenca_missas |
|-----------|--------------|-----------------|
| 2026-02-16T10:30:00.000Z | 123 | Sim |
| 2026-02-16T10:30:00.000Z | 456 | Não |

- **timestamp**: Data e hora do envio (ISO 8601)
- **numero_ficha**: Número da ficha informado
- **presenca_missas**: Resposta selecionada (Sim, Não ou Talvez)

## Funcionalidades

### Adicionar Blocos
- Clique no botão "➕ Adicionar Outra Ficha" para adicionar um novo bloco de perguntas
- Cada bloco adicional terá um botão "Remover" para excluí-lo

### Validação
- Todos os campos são obrigatórios
- O formulário não será enviado se algum campo estiver vazio
- Mensagens de erro são exibidas quando necessário

### Envio
- Ao clicar em "Enviar Formulário", todos os blocos são coletados e enviados
- Cada bloco vira uma linha separada na planilha
- Uma mensagem de sucesso é exibida após o envio bem-sucedido
- O formulário é limpo automaticamente após 2 segundos do sucesso

## Solução de Problemas

### Erro: "Por favor, configure a URL do Apps Script"
- Verifique se você substituiu `REPLACE_WITH_YOUR_WEB_APP_URL` no arquivo HTML

### Erro: "Planilha não encontrada"
- Verifique se o `SHEET_ID` está correto no arquivo `Code.gs`
- Certifique-se de que a planilha existe e você tem acesso a ela

### Erro: "Cabeçalhos não correspondem"
- A planilha já tem dados com cabeçalhos diferentes
- Crie uma nova aba chamada "Respostas" ou ajuste o `SHEET_NAME` no código

### Dados não aparecem na planilha
- Verifique se o deploy do Apps Script foi feito corretamente
- Verifique se você autorizou o acesso quando solicitado
- Abra o Apps Script e verifique os logs de execução (Executar → Ver logs)

## Notas Técnicas

- O formulário funciona completamente no lado do cliente (HTML/JavaScript)
- Os dados são enviados via POST para o Google Apps Script
- O Apps Script valida e salva os dados na planilha
- Não há necessidade de servidor próprio - tudo funciona com Google Sheets e Apps Script

## Suporte

Para problemas ou dúvidas, verifique:
1. Console do navegador (F12) para erros JavaScript
2. Logs do Apps Script no editor do Google Apps Script
3. Permissões da planilha e do Apps Script
