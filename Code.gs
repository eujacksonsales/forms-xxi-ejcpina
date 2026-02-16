/**
 * Formulário de Suplentes - XXI EJCPINA
 * Google Apps Script Web App (doPost JSON -> append to Google Sheets)
 *
 * Deploy:
 * - Substitua SHEET_ID abaixo pelo ID da sua planilha
 * - Crie uma aba na planilha chamada "Respostas" (ou ajuste SHEET_NAME)
 * - Faça deploy como Web App (Executar como: Eu, Quem tem acesso: Qualquer pessoa)
 * - Copie a URL do Web App e atualize no arquivo index.html
 */

const SHEET_ID = "REPLACE_WITH_YOUR_SHEET_ID";
const SHEET_NAME = "Respostas";

// Ordem das colunas na planilha
const HEADERS = [
  "timestamp",
  "numero_ficha",
  "presenca_missas"
];

/**
 * Resposta GET para verificar se o serviço está ativo
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      service: "forms-suplentes-xxi-ejcpina",
      message: "Use POST com Content-Type: application/json",
      headers: HEADERS
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Processa requisições POST com os dados do formulário
 */
function doPost(e) {
  try {
    const data = parseJsonBody_(e);
    
    // Validar estrutura dos dados
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error("Dados inválidos: esperado um array 'data' com pelo menos um item");
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    if (!ss) {
      throw new Error(`Planilha não encontrada. Verifique o SHEET_ID: ${SHEET_ID}`);
    }

    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Criar aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      ensureHeaders_(sheet, HEADERS);
    } else {
      ensureHeaders_(sheet, HEADERS);
    }

    // Processar cada registro do array
    let count = 0;
    const timestamp = data.submitted_at || new Date().toISOString();

    data.data.forEach((item) => {
      // Validar campos obrigatórios
      if (!item.numero_ficha || !item.presenca_missas) {
        throw new Error("Cada registro deve conter 'numero_ficha' e 'presenca_missas'");
      }

      // Criar linha com os dados
      const row = [
        timestamp,
        String(item.numero_ficha).trim(),
        String(item.presenca_missas).trim()
      ];

      sheet.appendRow(row);
      count++;
    });

    return json_({
      ok: true,
      appended: true,
      count: count,
      message: `${count} registro(s) adicionado(s) com sucesso`,
      sheetUrl: ss.getUrl()
    });

  } catch (err) {
    return json_(
      {
        ok: false,
        error: String(err && err.message ? err.message : err),
      },
      400
    );
  }
}

/**
 * Parse do corpo JSON da requisição
 */
function parseJsonBody_(e) {
  const raw = (e && e.postData && e.postData.contents) || "";
  if (!raw) throw new Error("Corpo da requisição vazio");

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("JSON inválido no corpo da requisição");
  }
}

/**
 * Garante que os cabeçalhos existem na planilha
 */
function ensureHeaders_(sheet, headers) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  const existing = range.getValues()[0];
  const empty = existing.every((v) => !String(v || "").trim());

  if (empty) {
    // Planilha vazia, adicionar cabeçalhos
    range.setValues([headers]);
    sheet.setFrozenRows(1);
    
    // Formatar cabeçalhos
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#667eea");
    headerRange.setFontColor("#ffffff");
    
    return;
  }

  // Verificar se os cabeçalhos estão corretos
  const existingTrimmed = existing.map((v) => String(v || "").trim());
  const mismatch =
    existingTrimmed.length !== headers.length ||
    headers.some((h, idx) => existingTrimmed[idx] !== h);

  if (mismatch) {
    throw new Error(
      `Cabeçalhos não correspondem na aba '${SHEET_NAME}'. Esperado: ${headers.join(", ")}. Encontrado: ${existingTrimmed.join(", ")}`
    );
  }
}

/**
 * Retorna resposta JSON
 */
function json_(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
  if (statusCode && output.setResponseCode) {
    output.setResponseCode(statusCode);
  }
  return output;
}
