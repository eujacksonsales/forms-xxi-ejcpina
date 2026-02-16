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
 * Configura headers CORS para permitir requisições cross-origin
 */
function setCorsHeaders_(output) {
  // Apps Script não suporta setHeader diretamente, mas podemos usar HtmlService
  // ou retornar um objeto com headers através de uma função auxiliar
  // Para Web Apps, o ContentService já lida com CORS de forma limitada
  // A melhor solução é usar mode: 'no-cors' no fetch OU usar uma abordagem diferente
  return output;
}

/**
 * Resposta GET para verificar se o serviço está ativo
 */
function doGet(e) {
  const output = ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      service: "forms-suplentes-xxi-ejcpina",
      message: "Use POST com Content-Type: application/json",
      headers: HEADERS
    })
  ).setMimeType(ContentService.MimeType.JSON);
  
  return output;
}

/**
 * Processa requisições POST com os dados do formulário
 */
function doPost(e) {
  try {
    const parsed = parseJsonBody_(e);
    
    // Se os dados vieram como form-urlencoded, 'data' pode ser uma string JSON
    let dataArray = parsed.data;
    if (typeof dataArray === 'string') {
      try {
        dataArray = JSON.parse(dataArray);
      } catch (err) {
        throw new Error("Erro ao fazer parse do campo 'data': " + err.message);
      }
    }
    
    // Validar estrutura dos dados
    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
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
    const timestamp = parsed.submitted_at || new Date().toISOString();

    dataArray.forEach((item) => {
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

    // Se vier de formulário HTML (e.parameter existe), retornar HTML simples
    // Caso contrário, retornar JSON
    if (e && e.parameter) {
      return ContentService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Sucesso</title>
        </head>
        <body>
          <h1>Formulário enviado com sucesso!</h1>
          <p>${count} registro(s) adicionado(s) à planilha.</p>
          <script>
            // Enviar mensagem para o iframe pai (se existir)
            if (window.parent !== window) {
              window.parent.postMessage({success: true, count: ${count}}, '*');
            }
          </script>
        </body>
        </html>
      `);
    }

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
 * Parse do corpo da requisição (suporta JSON, form-urlencoded e parâmetros de formulário HTML)
 */
function parseJsonBody_(e) {
  // Se vier de formulário HTML, os dados estarão em e.parameter
  if (e && e.parameter) {
    const params = {};
    for (let key in e.parameter) {
      const value = e.parameter[key];
      // Se a chave é 'data', tentar fazer parse do JSON
      if (key === 'data') {
        try {
          params[key] = JSON.parse(value);
        } catch {
          params[key] = value;
        }
      } else {
        params[key] = value;
      }
    }
    return params;
  }

  // Se vier como JSON no corpo da requisição
  const raw = (e && e.postData && e.postData.contents) || "";
  if (!raw) throw new Error("Corpo da requisição vazio");

  // Tentar parse como JSON primeiro
  try {
    return JSON.parse(raw);
  } catch (jsonErr) {
    // Se não for JSON, tentar como form-urlencoded
    try {
      const params = {};
      const pairs = raw.split('&');
      for (let pair of pairs) {
        const [key, value] = pair.split('=');
        const decodedKey = decodeURIComponent(key);
        const decodedValue = decodeURIComponent(value || '');
        
        // Se a chave é 'data', tentar fazer parse do JSON
        if (decodedKey === 'data') {
          try {
            params[decodedKey] = JSON.parse(decodedValue);
          } catch {
            params[decodedKey] = decodedValue;
          }
        } else {
          params[decodedKey] = decodedValue;
        }
      }
      return params;
    } catch (formErr) {
      throw new Error("Formato de dados inválido (esperado JSON ou form-urlencoded)");
    }
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
 * Retorna resposta JSON com headers CORS
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
