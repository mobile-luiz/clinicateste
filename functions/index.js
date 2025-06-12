// functions/index.js

const functions = require("firebase-functions");
const admin     = require("firebase-admin");

// Inicializa o Admin SDK usando credenciais da sua conta de serviço
admin.initializeApp();

const db = admin.database();

exports.agendarExame = functions.https.onRequest(async (req, res) => {
  // Permite CORS básico
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { nome, cpf, telefone, email, tipo, data, hora } = req.body;
  if (!nome || !cpf || !telefone || !email || !tipo || !data || !hora) {
    return res.status(400).send("Campos incompletos");
  }

  try {
    await db.ref("agendamentos").push({
      nome,
      cpf,
      telefone,
      email,
      tipo,
      data,
      hora,
      criadoEm: Date.now()
    });
    return res.status(200).send({ sucesso: true });
  } catch (error) {
    console.error("Erro ao gravar agendamento:", error);
    return res.status(500).send("Erro interno");
  }
});
