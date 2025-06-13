// script.js

// --- Configurações ---
const FIREBASE_URL = "https://clinica-3f715-default-rtdb.firebaseio.com";
const HORA_INICIO  = 7;      // 07:00
const HORA_FIM     = 17;     // 17:00
const WHATSAPP_NUM = "5581995038049";

// --- DOM Elements ---
const form          = document.getElementById('formAgendamento');
const nomeInput     = document.getElementById('nome');
const cpfInput      = document.getElementById('cpf');
const telInput      = document.getElementById('telefone');
const emailInput    = document.getElementById('email');
const tipoSelect    = document.getElementById('tipo');
const dataInput     = document.getElementById('data');
const horaSelect    = document.getElementById('hora');
const faleConoscoBtn= document.getElementById('btnFaleConosco'); // novo botão

// --- Toast Setup ---
const toast = document.createElement('div');
toast.id = 'toast';
document.body.appendChild(toast);

function showToast(msg, type = 'info') {
  toast.textContent = msg;
  toast.className = ''; 
  toast.classList.add(type, 'show'); 
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- Date Parsing (avoid timezone shifts) ---
function parseLocalDate(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
  dataInput.min   = new Date().toISOString().split('T')[0];
  dataInput.value = dataInput.min;
  carregarHorariosDisponiveis();
});

// --- Trata mudança de data ---
dataInput.addEventListener('change', () => {
  let d = parseLocalDate(dataInput.value);
  if (d.getDay() === 0) {
    showToast('Não atendemos aos domingos', 'error');
    d.setDate(d.getDate() + 1);
    dataInput.value = d.toISOString().split('T')[0];
  }
  carregarHorariosDisponiveis();
});

// --- Carrega horários disponíveis ---
async function carregarHorariosDisponiveis() {
  const iso = dataInput.value;
  const dia = parseLocalDate(iso).getDay();
  horaSelect.disabled = true;
  horaSelect.innerHTML = `<option>Carregando...</option>`;

  if (dia === 0) {
    horaSelect.innerHTML = `<option disabled selected>Domingo sem agendamentos</option>`;
    return;
  }

  try {
    const resp = await fetch(
      `${FIREBASE_URL}/agendamentos.json?orderBy="data"&equalTo="${iso}"`
    );
    if (!resp.ok) throw new Error();

    const ags       = await resp.json() || {};
    const ocupadas  = new Set(Object.values(ags).map(a => a.hora));
    let optsHtml    = `<option value="" disabled selected>Selecione um horário</option>`;

    for (let h = HORA_INICIO; h <= HORA_FIM; h++) {
      const hh    = `${String(h).padStart(2,'0')}:00`;
      const ok    = ocupadas.has(hh) === false;
      const label = ok ? hh : `${hh} (Indisponível)`;
      optsHtml  += `<option value="${hh}"${ok ? '' : ' disabled'}>${label}</option>`;
    }
    horaSelect.innerHTML = optsHtml;
  } catch {
    horaSelect.innerHTML = `<option disabled>Erro ao carregar</option>`;
  } finally {
    horaSelect.disabled = false;
  }
}

// --- Validações ---
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = pos => {
    let s = 0;
    for (let i = 0; i < pos; i++) s += Number(cpf[i]) * (pos + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function validarTelefone(tel) {
  const nums = tel.replace(/\D/g, '');
  return /^[0-9]{10,11}$/.test(nums);
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// --- Fale Conosco (abre WhatsApp) ---
faleConoscoBtn.addEventListener('click', () => {
  const msg = encodeURIComponent('Olá, gostaria de mais informações.');
  window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUM}&text=${msg}`, '_blank');
});

// --- Submissão do formulário ---
form.addEventListener('submit', async e => {
  e.preventDefault();

  if (parseLocalDate(dataInput.value).getDay() === 0) {
    showToast('Não atendemos aos domingos', 'error');
    return;
  }

  const nome  = nomeInput.value.trim();
  const cpf   = cpfInput.value.trim();
  const tel   = telInput.value.trim();
  const email = emailInput.value.trim();
  const tipo  = tipoSelect.value;
  const data  = dataInput.value;
  const hora  = horaSelect.value;

  if (!nome || !cpf || !tel || !email || !tipo || !data || !hora) {
    showToast('Preencha todos os campos', 'error');
    return;
  }
  if (!validarCPF(cpf)) {
    showToast('CPF inválido', 'error');
    return;
  }
  if (!validarTelefone(tel)) {
    showToast('Telefone inválido', 'error');
    return;
  }

  const ts = Date.now();
  const agendamento = {
    nome,
    cpf:      cpf.replace(/\D/g, ''),
    telefone: tel.replace(/\D/g, ''),
    email,
    tipo,
    data,
    hora,
    criadoEmTimestamp: ts,
    criadoEmFormatado: new Date(ts).toLocaleString('pt-BR', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    })
  };

  try {
    const resp = await fetch(`${FIREBASE_URL}/agendamentos.json`, {
      method: 'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(agendamento)
    });
    if (!resp.ok) throw new Error();

    const texto =
      `📅 *Agendamento de Exame* 🏥\n\n` +
      `👤 *Nome:* ${nome}\n` +
      `🆔 *CPF:* ${agendamento.cpf}\n` +
      `📞 *Telefone:* ${agendamento.telefone}\n` +
      `✉️ *E-mail:* ${email}\n\n` +
      `🧪 *Exame:* ${tipo}\n` +
      `🗓️ *Data:* ${formatarData(data)}\n` +
      `⏰ *Hora:* ${hora}\n\n`;

    window.open(
      `https://api.whatsapp.com/send?phone=${WHATSAPP_NUM}&text=${encodeURIComponent(texto)}`,
      '_blank'
    );

    form.reset();
    dataInput.value = dataInput.min;
    carregarHorariosDisponiveis();
    showToast('Agendamento realizado!', 'success');
  } catch {
    showToast('Erro ao concluir. Tente novamente.', 'error');
  }
});
