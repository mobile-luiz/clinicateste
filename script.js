// URL base do seu Realtime Database
const FIREBASE_URL = "https://clinica-3f715-default-rtdb.firebaseio.com";

// Ajusta a data mínima para hoje
const inputData = document.getElementById('data');
inputData.min = new Date().toISOString().split('T')[0];

document.getElementById('formAgendamento')
  .addEventListener('submit', async function(e) {
    e.preventDefault();

    // Coleta os valores do formulário
    const nome     = document.getElementById('nome').value.trim();
    const cpf      = document.getElementById('cpf').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const email    = document.getElementById('email').value.trim();
    const tipo     = document.getElementById('tipo').value;
    const data     = document.getElementById('data').value;
    const hora     = document.getElementById('hora').value;

    // Monta o objeto de agendamento
    const agora = new Date();
    const agendamento = {
      nome,
      cpf,
      telefone,
      email,
      tipo,
      data,     // YYYY-MM-DD
      hora,     // HH:MM
      criadoEmTimestamp: agora.getTime(),
      criadoEmFormatado: agora.toLocaleString('pt-BR', {
        day:   '2-digit',
        month: '2-digit',
        year:  'numeric',
        hour:  '2-digit',
        minute:'2-digit'
      })
    };

    try {
      // Grava no nó "agendamentos" via REST API
      const resp = await fetch(
        `${FIREBASE_URL}/agendamentos.json`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(agendamento)
        }
      );
      if (!resp.ok) throw new Error(`Status ${resp.status}`);

      // Monta a mensagem formatada (sem assinatura)
      const mensagem = 
        `📅 *Agendamento de Exame* 🏥\n\n` +
        `👤 *Nome:* ${nome}\n` +
        `🆔 *CPF:* ${cpf}\n` +
        `📞 *Telefone:* ${telefone}\n` +
        `✉️ *E-mail:* ${email}\n\n` +
        `🧪 *Exame:* ${tipo}\n` +
        `🗓️ *Data Agendada:* ${formatarData(data)}\n` +
        `⏰ *Hora Agendada:* ${hora}\n\n`;
        //`⏳ *Criado em:* ${agendamento.criadoEmFormatado}`;

      // Envia via WhatsApp
      const destinatario = "5581995038049";
      const url = 
        `https://api.whatsapp.com/send?phone=${destinatario}` +
        `&text=` + encodeURIComponent(mensagem);
      window.open(url, "_blank");

    } catch (error) {
      console.error("Erro ao gravar agendamento:", error);
      alert("Não foi possível salvar o agendamento. Tente novamente.");
    }
});

// Formata 'YYYY-MM-DD' → 'DD/MM/YYYY'
function formatarData(isoDate) {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}
