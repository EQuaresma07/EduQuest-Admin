import { db, auth, collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc,
         createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signOut, onAuthStateChanged, sendPasswordResetEmail } from './firebase.js';

const ADMIN_SENHA  = 'admin@eduquest2025';
const subjectNames = { informatica:'💻 Informática', matematica:'📐 Matemática', portugues:'📖 Português', ciencias:'🔬 Ciências' };
const diffLabel    = { facil:'🟢 Fácil', medio:'🟡 Médio', dificil:'🔴 Difícil' };
let professorAtual = null;
let nomeProfessor  = 'Professor';

// ===== RENDER HELPERS =====
const root = () => document.getElementById('appRoot');

function msg(id, texto, tipo) {
  const el = document.getElementById(id);
  if (el) { el.textContent = texto; el.className = 'msg msg-' + tipo; }
}

// ===== TELAS =====
function renderLogin() {
  root().innerHTML = `
    <div style="width:100%;max-width:480px;margin:auto;">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="font-size:3rem;">🎓</div>
        <h1 style="font-family:var(--font-head);color:white;letter-spacing:3px;font-size:1.8rem;margin:0.5rem 0;">EduQuest</h1>
        <p style="color:var(--text2);">Painel do Professor</p>
      </div>
      <div class="card"><div class="card-inner">
        <h2 class="section-title">🔒 Entrar na sua conta</h2>
        <div class="form-group"><label>📧 E-mail</label>
          <input type="email" id="loginEmail" placeholder="seu@email.com"/></div>
        <div class="form-group"><label>🔑 Senha</label>
          <input type="password" id="loginSenha" placeholder="Sua senha"/></div>
        <button class="btn-play" id="btnLogin"><span>🔓 Entrar</span><div class="btn-glow"></div></button>
        <div id="msgLogin" class="msg hidden"></div>
        <div style="text-align:center;margin-top:1rem;display:flex;flex-direction:column;gap:0.5rem;">
          <button id="btnEsqueci" style="background:none;border:none;color:var(--cyan);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;letter-spacing:1px;">
            🔑 Esqueci minha senha
          </button>
          <button id="btnIrAdmin" style="background:none;border:none;color:var(--text2);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;letter-spacing:1px;">
            ⚙️ Área do Administrador
          </button>
        </div>
      </div></div>
    </div>`;
  document.getElementById('btnLogin').onclick = fazerLogin;
  document.getElementById('loginSenha').addEventListener('keydown', e => { if(e.key==='Enter') fazerLogin(); });
  document.getElementById('btnIrAdmin').onclick = renderAdmin;
  document.getElementById('btnEsqueci').onclick = renderEsqueci;
}


function renderEsqueci() {
  root().innerHTML = `
    <div style="width:100%;max-width:480px;margin:auto;">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="font-size:3rem;">🔑</div>
        <h1 style="font-family:var(--font-head);color:white;letter-spacing:3px;font-size:1.5rem;margin:0.5rem 0;">Recuperar Senha</h1>
        <p style="color:var(--text2);">Escolha como deseja recuperar seu acesso</p>
      </div>

      <!-- OPÇÃO 1: E-MAIL AUTOMÁTICO -->
      <div class="card" style="margin-bottom:1rem;"><div class="card-inner">
        <h2 class="section-title">📧 Receber link por e-mail</h2>
        <p style="color:var(--text2);font-size:0.9rem;margin-bottom:1rem;line-height:1.6;">
          O Firebase enviará um link seguro para o seu e-mail cadastrado. Clique no link e redefina sua senha em até 1 hora.
        </p>
        <div class="form-group">
          <label>📧 Seu e-mail cadastrado</label>
          <input type="email" id="emailRecupera" placeholder="professor@escola.com"/>
        </div>
        <button class="btn-play" id="btnEnviarEmail">
          <span>📨 Enviar Link de Recuperação</span>
          <div class="btn-glow"></div>
        </button>
        <div id="msgEmail" class="msg hidden"></div>
      </div></div>

      <!-- DIVISOR -->
      <div style="text-align:center;color:var(--text2);font-size:0.85rem;margin:0.5rem 0;letter-spacing:2px;">— OU —</div>

      <!-- OPÇÃO 2: CONTATAR ADM -->
      <div class="card"><div class="card-inner">
        <h2 class="section-title">📞 Contatar o Administrador</h2>
        <p style="color:var(--text2);font-size:0.9rem;margin-bottom:1.2rem;line-height:1.6;">
          Se não tiver acesso ao e-mail cadastrado, solicite ao administrador que redefina sua senha ou crie uma nova conta.
        </p>
        <div class="form-group">
          <label>👤 Seu nome</label>
          <input type="text" id="solNome" placeholder="Seu nome completo"/>
        </div>
        <div class="form-group">
          <label>📋 Descreva o problema</label>
          <textarea id="solMensagem" placeholder="Ex: Não tenho mais acesso ao e-mail cadastrado. Meu nome é..." rows="3"></textarea>
        </div>
        <button class="btn-play" id="btnEnviarSolicitacao" style="background:linear-gradient(135deg,var(--purple),#7c3aed);">
          <span>📤 Enviar Solicitação ao ADM</span>
          <div class="btn-glow"></div>
        </button>
        <div id="msgSolicitacao" class="msg hidden"></div>
      </div></div>

      <div style="text-align:center;margin-top:1rem;">
        <button id="btnVoltarLoginEsqueci" style="background:none;border:none;color:var(--text2);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;">← Voltar ao Login</button>
      </div>
    </div>`;

  document.getElementById('btnVoltarLoginEsqueci').onclick = renderLogin;

  document.getElementById('btnEnviarEmail').onclick = async function() {
    const email = document.getElementById('emailRecupera').value.trim();
    const msgEl = document.getElementById('msgEmail');
    if (!email) { msgEl.textContent='⚠️ Digite seu e-mail!'; msgEl.className='msg msg-erro'; return; }
    try {
      msgEl.textContent='🔄 Enviando...'; msgEl.className='msg msg-info';
      await sendPasswordResetEmail(auth, email);
      msgEl.textContent='✅ E-mail enviado! Verifique sua caixa de entrada e spam.';
      msgEl.className='msg msg-sucesso';
      document.getElementById('emailRecupera').value='';
    } catch(e) {
      if (e.code==='auth/user-not-found') msgEl.textContent='❌ E-mail não encontrado no sistema!';
      else if (e.code==='auth/invalid-email') msgEl.textContent='❌ E-mail inválido!';
      else msgEl.textContent='❌ Erro: '+e.message;
      msgEl.className='msg msg-erro';
    }
  };

  document.getElementById('emailRecupera').addEventListener('keydown', e => {
    if (e.key==='Enter') document.getElementById('btnEnviarEmail').click();
  });

  document.getElementById('btnEnviarSolicitacao').onclick = async function() {
    const nome     = document.getElementById('solNome').value.trim();
    const mensagem = document.getElementById('solMensagem').value.trim();
    const msgEl    = document.getElementById('msgSolicitacao');
    if (!nome||!mensagem) { msgEl.textContent='⚠️ Preencha seu nome e a mensagem!'; msgEl.className='msg msg-erro'; return; }
    try {
      msgEl.textContent='🔄 Enviando solicitação...'; msgEl.className='msg msg-info';
      await addDoc(collection(db,'solicitacoes_senha'),{
        nome, mensagem,
        dataHora: new Date().toLocaleString('pt-BR'),
        timestamp: new Date(),
        status: 'pendente'
      });
      msgEl.textContent='✅ Solicitação enviada! O administrador entrará em contato em breve.';
      msgEl.className='msg msg-sucesso';
      document.getElementById('solNome').value='';
      document.getElementById('solMensagem').value='';
    } catch(e) {
      msgEl.textContent='❌ Erro ao enviar: '+e.message;
      msgEl.className='msg msg-erro';
    }
  };
}

function renderAdmin() {
  root().innerHTML = `
    <div style="width:100%;max-width:560px;margin:auto;">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="font-size:3rem;">⚙️</div>
        <h1 style="font-family:var(--font-head);color:var(--purple);letter-spacing:3px;font-size:1.4rem;margin:0.5rem 0;">Administrador</h1>
        <p style="color:var(--text2);">Gerenciar contas de professores</p>
      </div>
      <div class="card" id="adminLoginCard"><div class="card-inner">
        <h2 class="section-title">🔐 Acesso Administrativo</h2>
        <div class="form-group">
          <input type="password" id="adminSenhaInput" placeholder="Senha do administrador"/></div>
        <button class="btn-play" id="btnVerAdmin" style="background:linear-gradient(135deg,var(--purple),#7c3aed);">
          <span>⚙️ Entrar como Admin</span><div class="btn-glow"></div></button>
        <div id="msgAdmin" class="msg hidden"></div>
      </div></div>
      <div id="painelAdmin" style="display:none;width:100%;">
        <div class="card"><div class="card-inner">
          <h2 class="section-title">➕ Criar Conta de Professor</h2>
          <div class="form-group"><label>👤 Nome</label><input type="text" id="novoProfNome" placeholder="Nome completo"/></div>
          <div class="form-group"><label>📧 E-mail</label><input type="email" id="novoProfEmail" placeholder="professor@escola.com"/></div>
          <div class="form-group"><label>🔑 Senha inicial</label><input type="text" id="novoProfSenha" placeholder="Mínimo 6 caracteres"/></div>
          <button class="btn-play" id="btnCriarProf"><span>✅ Criar Conta</span><div class="btn-glow"></div></button>
          <div id="msgCriar" class="msg hidden"></div>
        </div></div>
        <div class="card"><div class="card-inner">
          <h2 class="section-title">👨‍🏫 Professores Cadastrados</h2>
          <div id="loadingProfs" class="loading-msg">🔄 Carregando...</div>
          <div id="listaProfessores"></div>
        </div></div>

        <!-- GERENCIAR DISCIPLINAS -->
        <div class="card"><div class="card-inner">
          <h2 class="section-title">📚 Gerenciar Disciplinas</h2>
          <p style="color:var(--text2);font-size:0.9rem;margin-bottom:1.2rem;">Adicione ou remova disciplinas. Alterações aparecem imediatamente no site dos alunos.</p>
          <div class="form-row" style="align-items:flex-end;">
            <div class="form-group" style="margin-bottom:0;">
              <label>🔣 Emoji</label>
              <input type="text" id="adminDiscEmoji" placeholder="🌍" maxlength="4" style="text-align:center;font-size:1.3rem;"/>
            </div>
            <div class="form-group" style="margin-bottom:0;flex:2;">
              <label>📝 Nome</label>
              <input type="text" id="adminDiscNome" placeholder="Ex: Geografia"/>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label>🔢 Ordem</label>
              <input type="number" id="adminDiscOrdem" placeholder="12" min="1" max="30" style="width:80px;"/>
            </div>
          </div>
          <button class="btn-play" id="btnAdminAddDisc" style="margin-top:1rem;">
            <span>➕ Adicionar Disciplina</span><div class="btn-glow"></div>
          </button>
          <div id="msgAdminDisc" class="msg hidden"></div>
          <div style="margin-top:1.2rem;display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;" id="listaAdminDiscs"></div>
        </div></div>

      </div>
      <div style="text-align:center;margin-top:1rem;">
        <button id="btnVoltarLogin" style="background:none;border:none;color:var(--text2);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;">← Voltar ao Login</button>
      </div>
    </div>`;
  document.getElementById('btnVerAdmin').onclick  = verificarAdmin;
  document.getElementById('adminSenhaInput').addEventListener('keydown', e => { if(e.key==='Enter') verificarAdmin(); });
  document.getElementById('btnVoltarLogin').onclick = renderLogin;
}

function renderPainel() {
  root().innerHTML = `
    <div class="admin-header">
      <div class="admin-title">
        <span>🎓</span>
        <div><h1>Painel do Professor</h1>
          <p id="nomeLogado" style="color:var(--cyan);">👨‍🏫 ${nomeProfessor}</p></div>
      </div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
        <a class="btn-home" href="https://equaresma07.github.io/EduQuest" target="_blank">🎮 Ir para o Jogo</a>
        <button id="btnLogout" class="btn-ranking" style="border-color:rgba(255,68,85,0.4);color:var(--red);">🚪 Sair</button>
      </div>
    </div>

    <div class="stats-grid" id="statsGrid">
      <div class="stat-card"><div class="stat-num" id="statTotal">0</div><div class="stat-label">Total</div></div>
    </div>

    <!-- DISCIPLINAS ATIVAS -->
    <div class="card"><div class="card-inner">
      <div class="acc-header" data-closed="true">
        <h2 class="section-title" style="border:none;padding:0;margin:0;">📚 Disciplinas Disponíveis</h2>
        <span class="acc-arrow">▼</span>
      </div>
      <div class="acc-body">
      <div id="discFixasGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;"></div>
      </div>
    </div></div>

    <!-- CRIAR PROVA -->
    <div class="card"><div class="card-inner">
      <div class="acc-header" data-closed="false">
        <h2 class="section-title" style="border:none;padding:0;margin:0;">🎯 Criar Prova Coletiva</h2>
        <span class="acc-arrow">▼</span>
      </div>
      <div class="acc-body">
      <div class="form-row">
        <div class="form-group"><label>📋 Título</label><input type="text" id="provaTitulo" placeholder="Ex: Avaliação Bimestral"/></div>
        <div class="form-group"><label>📚 Disciplina</label>
          <select id="provaDisciplina">
            <option value="informatica">💻 Informática</option>
            <option value="matematica">📐 Matemática</option>
            <option value="portugues">📖 Português</option>
            <option value="ciencias">🔬 Ciências</option>
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>⚡ Dificuldade</label>
          <select id="provaDificuldade">
            <option value="facil">🟢 Fácil</option>
            <option value="medio">🟡 Médio</option>
            <option value="dificil">🔴 Difícil</option>
          </select></div>
        <div class="form-group"><label>❓ Questões</label>
          <select id="provaQuantidade">
            <option value="5">5 questões</option>
            <option value="10" selected>10 questões</option>
            <option value="15">15 questões</option>
            <option value="20">20 questões</option>
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>⏱️ Tempo/Questão</label>
          <select id="provaTempo">
            <option value="15">15s</option>
            <option value="30" selected>30s</option>
            <option value="45">45s</option>
            <option value="60">60s</option>
            <option value="90">90s</option>
          </select></div>
        <div class="form-group"><label>📅 Expiração</label>
          <input type="datetime-local" id="provaExpiracao" style="color-scheme:dark;"/></div>
      </div>
      <button class="btn-play" id="btnCriarProva"><span>🚀 Criar Prova</span><div class="btn-glow"></div></button>
      <div id="msgProva" class="msg hidden"></div>
      <div id="provaGerada" style="display:none;margin-top:1.5rem;">
        <div class="prova-gerada-box">
          <p style="color:var(--text2);font-size:0.85rem;letter-spacing:2px;text-transform:uppercase;margin-bottom:0.5rem;">Código da Prova</p>
          <div class="codigo-gerado" id="codigoGerado">P-0000000</div>
          <p style="color:var(--text2);font-size:0.85rem;margin-top:0.75rem;">Passe este código para os alunos!</p>
          <button class="btn-copy" id="btnCopy">📋 Copiar Código</button>
        </div>
      </div>
      </div>
    </div></div>

    <!-- MINHAS PROVAS -->
    <div class="card"><div class="card-inner">
      <div class="acc-header" data-closed="false">
        <h2 class="section-title" style="border:none;padding:0;margin:0;">📋 Minhas Provas</h2>
        <span class="acc-arrow">▼</span>
      </div>
      <div class="acc-body">
      <div id="loadingProvas" class="loading-msg">🔄 Carregando...</div>
      <div id="listaProvas"></div>
      </div>
    </div></div>

    <!-- ADICIONAR QUESTÃO -->
    <div class="card"><div class="card-inner">
      <div class="acc-header" data-closed="true">
        <h2 class="section-title" style="border:none;padding:0;margin:0;">➕ Adicionar Questão ao Banco</h2>
        <span class="acc-arrow">▼</span>
      </div>
      <div class="acc-body">
      <div class="form-row">
        <div class="form-group"><label>📚 Disciplina</label>
          <select id="addDisciplina">
            <option value="informatica">💻 Informática</option>
            <option value="matematica">📐 Matemática</option>
            <option value="portugues">📖 Português</option>
            <option value="ciencias">🔬 Ciências</option>
          </select></div>
        <div class="form-group"><label>⚡ Dificuldade</label>
          <select id="addDificuldade">
            <option value="facil">🟢 Fácil</option>
            <option value="medio">🟡 Médio</option>
            <option value="dificil">🔴 Difícil</option>
          </select></div>
      </div>
      <div class="form-group"><label>❓ Pergunta</label>
        <textarea id="addPergunta" placeholder="Digite a pergunta..." rows="3"></textarea></div>
      <div class="form-group"><label>✅ Alternativas — clique na letra para marcar a correta</label>
        <div class="alternativas-grid">
          <div class="alt-item"><input type="radio" name="correta" value="0" id="r0" checked/><label for="r0" class="alt-label">A</label><input type="text" id="alt0" placeholder="Alternativa A" class="alt-input"/></div>
          <div class="alt-item"><input type="radio" name="correta" value="1" id="r1"/><label for="r1" class="alt-label">B</label><input type="text" id="alt1" placeholder="Alternativa B" class="alt-input"/></div>
          <div class="alt-item"><input type="radio" name="correta" value="2" id="r2"/><label for="r2" class="alt-label">C</label><input type="text" id="alt2" placeholder="Alternativa C" class="alt-input"/></div>
          <div class="alt-item"><input type="radio" name="correta" value="3" id="r3"/><label for="r3" class="alt-label">D</label><input type="text" id="alt3" placeholder="Alternativa D" class="alt-input"/></div>
        </div></div>
      <button class="btn-play" id="btnAddQuestao"><span>💾 Salvar Questão</span><div class="btn-glow"></div></button>
      <div id="msgAdd" class="msg hidden"></div>

      <div style="display:flex;gap:0.75rem;margin-top:1rem;flex-wrap:wrap;">
        <button id="btnImportarCSV"
          style="flex:1;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:10px;padding:0.7rem 1rem;color:var(--purple);font-family:var(--font-body);font-size:0.9rem;font-weight:600;cursor:pointer;letter-spacing:1px;">
          📂 Importar CSV</button>
        <button id="btnExportarTemplate"
          style="flex:1;background:rgba(0,200,255,0.1);border:1px solid rgba(0,200,255,0.3);border-radius:10px;padding:0.7rem 1rem;color:var(--cyan);font-family:var(--font-body);font-size:0.9rem;font-weight:600;cursor:pointer;letter-spacing:1px;">
          📋 Exportar Template</button>
      </div>
      <input type="file" id="inputCSV" accept=".csv" style="display:none;"/>
      <div id="msgImportCSV" class="msg hidden" style="margin-top:0.75rem;"></div>
      </div>
    </div></div>

    <!-- BANCO DE QUESTÕES -->
    <div class="card"><div class="card-inner">
      <div class="acc-header" data-closed="true">
        <h2 class="section-title" style="border:none;padding:0;margin:0;">📚 Banco de Questões Completo</h2>
        <span class="acc-arrow">▼</span>
      </div>
      <div class="acc-body">
      <div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">
        <h2 style="display:none;">x</h2>
        <button id="btnExportar"
          style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:8px;padding:0.4rem 1rem;color:var(--green);font-family:var(--font-body);font-size:0.85rem;font-weight:600;cursor:pointer;letter-spacing:1px;">
          📥 Exportar CSV</button>
      </div>
      <div class="filter-row">
        <select id="filtDisciplina"><option value="">Todas</option>
          <option value="informatica">💻 Informática</option>
          <option value="matematica">📐 Matemática</option>
          <option value="portugues">📖 Português</option>
          <option value="ciencias">🔬 Ciências</option>
        </select>
        <select id="filtDificuldade"><option value="">Todos os níveis</option>
          <option value="facil">🟢 Fácil</option>
          <option value="medio">🟡 Médio</option>
          <option value="dificil">🔴 Difícil</option>
        </select>
      </div>
      <div id="loadingQuestoes" class="loading-msg">🔄 Carregando questões...</div>
      <div id="listaQuestoes"></div>
      </div>
    </div></div>`;

  // Eventos
  document.getElementById('btnLogout').onclick    = fazerLogout;
  atualizarSelectsDisciplinas();
  // disciplinas fixas — sem gerenciamento dinâmico
  document.getElementById('btnCriarProva').onclick = criarProva;
  document.getElementById('btnCopy').onclick       = copiarCodigo;
  document.getElementById('btnAddQuestao').onclick = adicionarQuestao;
  document.getElementById('filtDisciplina').onchange  = carregarQuestoes;
  document.getElementById('filtDificuldade').onchange = carregarQuestoes;
  document.getElementById('btnExportar').onclick      = exportarExcel;
  document.getElementById('btnImportarCSV').onclick   = () => document.getElementById('inputCSV').click();
  document.getElementById('btnExportarTemplate').onclick = exportarTemplate;
  document.getElementById('inputCSV').onchange        = importarCSV;

  // Data mínima
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('provaExpiracao').min = now.toISOString().slice(0,16);

  atualizarSelectsDisciplinas();
  atualizarSelectsDisciplinas();
  carregarStats();
  carregarProvas();
  carregarQuestoes();
  setTimeout(initAccordions, 100);
}

// ===== AUTH =====
onAuthStateChanged(auth, async user => {
  if (user) {
    professorAtual = user;
    try {
      const snap = await getDocs(collection(db, 'professores'));
      snap.forEach(d => { if (d.data().uid === user.uid) nomeProfessor = d.data().nome; });
    } catch(e) {}
    renderPainel();
  } else {
    professorAtual = null;
    renderLogin();
  }
});

async function fazerLogin() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const senha = document.getElementById('loginSenha')?.value;
  if (!email || !senha) { msg('msgLogin','⚠️ Preencha e-mail e senha!','erro'); return; }
  try {
    msg('msgLogin','🔄 Entrando...','info');
    await signInWithEmailAndPassword(auth, email, senha);
  } catch(e) { msg('msgLogin','❌ E-mail ou senha incorretos!','erro'); }
}

async function fazerLogout() {
  if (confirm('Deseja sair da sua conta?')) await signOut(auth);
}

function verificarAdmin() {
  const s = document.getElementById('adminSenhaInput')?.value;
  if (s === ADMIN_SENHA) {
    document.getElementById('adminLoginCard').style.display = 'none';
    document.getElementById('painelAdmin').style.display    = 'block';
    document.getElementById('btnCriarProf').onclick = criarProfessor;
    document.getElementById('btnAdminAddDisc').onclick = adminAdicionarDisciplina;
    carregarProfessores();
    adminCarregarDisciplinas();
    carregarSolicitacoes();
  } else {
    msg('msgAdmin','❌ Senha incorreta!','erro');
    document.getElementById('adminSenhaInput').value = '';
  }
}

async function criarProfessor() {
  const nome  = document.getElementById('novoProfNome')?.value.trim();
  const email = document.getElementById('novoProfEmail')?.value.trim();
  const senha = document.getElementById('novoProfSenha')?.value;
  if (!nome||!email||!senha) { msg('msgCriar','⚠️ Preencha todos os campos!','erro'); return; }
  if (senha.length<6)         { msg('msgCriar','⚠️ Senha mínima 6 caracteres!','erro'); return; }
  try {
    msg('msgCriar','🔄 Criando conta...','info');
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await addDoc(collection(db,'professores'),{ uid:cred.user.uid, nome, email, criadoEm:new Date() });
    await signOut(auth);
    msg('msgCriar','✅ Conta criada! Professor: '+nome,'sucesso');
    document.getElementById('novoProfNome').value='';
    document.getElementById('novoProfEmail').value='';
    document.getElementById('novoProfSenha').value='';
    carregarProfessores();
    renderAdmin(); // volta para a tela admin sem login
    document.getElementById('adminLoginCard').style.display='none';
    document.getElementById('painelAdmin').style.display='block';
    document.getElementById('btnCriarProf').onclick=criarProfessor;
    carregarProfessores();
  } catch(e) {
    if(e.code==='auth/email-already-in-use') msg('msgCriar','❌ E-mail já cadastrado!','erro');
    else msg('msgCriar','❌ Erro: '+e.message,'erro');
  }
}


async function carregarSolicitacoes() {
  const lista   = document.getElementById('listaSolicitacoes');
  const loading = document.getElementById('loadingSol');
  if (!lista||!loading) return;
  loading.style.display='block'; lista.innerHTML='';
  try {
    const snap = await getDocs(collection(db,'solicitacoes_senha'));
    let sols=[];
    snap.forEach(d => sols.push({id:d.id,...d.data()}));
    sols.sort((a,b) => new Date(b.timestamp?.toDate?.()??0) - new Date(a.timestamp?.toDate?.()??0));
    loading.style.display='none';
    if (!sols.length) { lista.innerHTML='<div class="no-questions">✅ Nenhuma solicitação pendente.</div>'; return; }
    sols.forEach(s => {
      const div=document.createElement('div'); div.className='questao-item';
      div.innerHTML=`
        <div class="questao-header">
          <div class="rank-info">
            <div class="rank-name">👤 ${s.nome}</div>
            <div class="rank-details">📅 ${s.dataHora} • ${s.status==='pendente'?'🟡 Pendente':'✅ Resolvida'}</div>
          </div>
          <button class="btn-delete" data-id="${s.id}">✅ Resolvida</button>
        </div>
        <p class="questao-texto" style="margin-top:0.5rem;">${s.mensagem}</p>`;
      div.querySelector('.btn-delete').onclick = async function() {
        const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        await updateDoc(doc(db,'solicitacoes_senha',this.dataset.id),{status:'resolvida'});
        this.closest('.questao-item').style.opacity='0.4';
        this.textContent='✅ Marcada';
        this.disabled=true;
      };
      lista.appendChild(div);
    });
  } catch(e) { loading.style.display='none'; lista.innerHTML='<div class="no-questions">❌ Erro: '+e.message+'</div>'; }
}


// ===== GERENCIAR DISCIPLINAS (ADMIN) =====
async function adminCarregarDisciplinas() {
  const lista   = document.getElementById('listaAdminDiscs');
  const loading = document.getElementById('loadingAdminDiscs');
  if (!lista) return;
  loading.style.display = 'block';
  lista.innerHTML = '';
  try {
    const snap = await getDocs(collection(db, 'disciplinas'));
    let discs = [];
    snap.forEach(d => discs.push({ id: d.id, ...d.data() }));
    discs.sort((a,b) => (a.ordem||99)-(b.ordem||99));
    loading.style.display = 'none';

    if (!discs.length) {
      lista.innerHTML = '<div class="no-questions" style="grid-column:1/-1;">Nenhuma disciplina extra cadastrada.<br>As 11 padrão já estão disponíveis no código.</div>';
      return;
    }

    discs.forEach(d => {
      const div = document.createElement('div');
      div.className = 'questao-item';
      div.innerHTML = `
        <div class="questao-header">
          <div class="rank-info">
            <div class="rank-name">${d.emoji||'📚'} ${d.nome}</div>
            <div class="rank-details">ID: ${d.id} • Ordem: ${d.ordem||'—'}</div>
          </div>
          <button class="btn-delete" data-id="${d.id}" data-nome="${d.nome}">🗑️ Remover</button>
        </div>`;
      div.querySelector('.btn-delete').onclick = async function() {
        if (!confirm('Remover "'+this.dataset.nome+'"?')) return;
        this.textContent = '🔄';
        await deleteDoc(doc(db, 'disciplinas', this.dataset.id));
        this.closest('.questao-item').remove();
        // Atualiza selects do painel do professor também
        atualizarSelectsDisciplinas();
      };
      lista.appendChild(div);
    });
  } catch(e) {
    loading.style.display = 'none';
    lista.innerHTML = '<div class="no-questions" style="grid-column:1/-1;">❌ ' + e.message + '</div>';
  }
}

async function adminAdicionarDisciplina() {
  const emoji = document.getElementById('adminDiscEmoji')?.value.trim() || '📚';
  const nome  = document.getElementById('adminDiscNome')?.value.trim();
  const ordem = parseInt(document.getElementById('adminDiscOrdem')?.value) || 99;
  const msg   = document.getElementById('msgAdminDisc');

  if (!nome) { msg.textContent='⚠️ Digite o nome!'; msg.className='msg msg-erro'; return; }

  // Gera ID limpo a partir do nome
  const id = nome.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]/g,'');

  if (!id) { msg.textContent='⚠️ Nome inválido!'; msg.className='msg msg-erro'; return; }

  try {
    msg.textContent='🔄 Verificando...'; msg.className='msg msg-info';

    // Verifica se já existe — NUNCA cria duplicata
    const docRef = doc(db, 'disciplinas', id);
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      msg.textContent='⚠️ Disciplina "'+nome+'" já existe!';
      msg.className='msg msg-erro';
      return;
    }

    // Usa setDoc com ID FIXO — garante que nunca duplica
    await setDoc(docRef, { emoji, nome, ordem });

    msg.textContent='✅ "'+nome+'" adicionada com sucesso!';
    msg.className='msg msg-sucesso';
    document.getElementById('adminDiscEmoji').value='';
    document.getElementById('adminDiscNome').value='';
    document.getElementById('adminDiscOrdem').value='';

    adminCarregarDisciplinas();
    // Atualiza selects do painel do professor
    atualizarSelectsDisciplinas();
  } catch(e) {
    msg.textContent='❌ Erro: '+e.message;
    msg.className='msg msg-erro';
  }
}

async function carregarProfessores() {
  const lista=document.getElementById('listaProfessores');
  const loading=document.getElementById('loadingProfs');
  if(!lista||!loading) return;
  loading.style.display='block'; lista.innerHTML='';
  try {
    const snap=await getDocs(collection(db,'professores'));
    let profs=[]; snap.forEach(d=>profs.push({id:d.id,...d.data()}));
    loading.style.display='none';
    if(!profs.length){ lista.innerHTML='<div class="no-questions">Nenhum professor cadastrado.</div>'; return; }
    profs.forEach(p=>{
      const div=document.createElement('div');
      div.className='questao-item';
      div.innerHTML=`
        <div class="questao-header">
          <div class="rank-info">
            <div class="rank-name">👨‍🏫 ${p.nome}</div>
            <div class="rank-details">📧 ${p.email}</div>
          </div>
          <button class="btn-delete" data-id="${p.id}" data-nome="${p.nome}">🗑️ Excluir</button>
        </div>`;
      div.querySelector('.btn-delete').onclick = async function() {
        if(!confirm('Excluir conta de '+this.dataset.nome+'?')) return;
        this.textContent='🔄';
        await deleteDoc(doc(db,'professores',this.dataset.id));
        this.closest('.questao-item').remove();
      };
      lista.appendChild(div);
    });
  } catch(e){ loading.style.display='none'; lista.innerHTML='<div class="no-questions">❌ Erro: '+e.message+'</div>'; }
}

// ===== PROVAS =====
function gerarCodigo(){ const L='ABCDEFGHJKLMNPQRSTUVWXYZ',N='0123456789'; let c='P-'; for(let i=0;i<3;i++)c+=L[Math.floor(Math.random()*L.length)]; for(let i=0;i<4;i++)c+=N[Math.floor(Math.random()*N.length)]; return c; }

async function criarProva() {
  if(!professorAtual) return;
  const titulo     =document.getElementById('provaTitulo')?.value.trim();
  const disciplina =document.getElementById('provaDisciplina')?.value;
  const dificuldade=document.getElementById('provaDificuldade')?.value;
  const quantidade =parseInt(document.getElementById('provaQuantidade')?.value);
  const tempo      =parseInt(document.getElementById('provaTempo')?.value);
  const expiracao  =document.getElementById('provaExpiracao')?.value;
  if(!titulo||!expiracao){ msg('msgProva','⚠️ Preencha título e expiração!','erro'); return; }
  const codigo=gerarCodigo();
  try {
    msg('msgProva','🔄 Criando prova...','info');
    await addDoc(collection(db,'provas'),{
      codigo,titulo,disciplina,
      dificuldade:diffLabel[dificuldade], dificuldadeKey:dificuldade,
      quantidade,tempoPorQuestao:tempo,
      expiracao:new Date(expiracao).toISOString(),
      professor:nomeProfessor, professorUid:professorAtual.uid,
      criadaEm:new Date(), ativa:true
    });
    msg('msgProva','✅ Prova criada!','sucesso');
    document.getElementById('codigoGerado').textContent=codigo;
    document.getElementById('provaGerada').style.display='block';
    carregarProvas();
  } catch(e){ msg('msgProva','❌ Erro: '+e.message,'erro'); }
}

function copiarCodigo(){
  const c=document.getElementById('codigoGerado')?.textContent;
  navigator.clipboard.writeText(c);
  const btn=document.getElementById('btnCopy');
  btn.textContent='✅ Copiado!';
  setTimeout(()=>btn.textContent='📋 Copiar Código',2000);
}

async function carregarProvas(){
  if(!professorAtual) return;
  const lista=document.getElementById('listaProvas'), loading=document.getElementById('loadingProvas');
  if(!lista||!loading) return;
  loading.style.display='block'; lista.innerHTML='';
  try {
    const snap=await getDocs(collection(db,'provas'));
    let ps=[]; snap.forEach(d=>{ if(d.data().professorUid===professorAtual.uid) ps.push({id:d.id,...d.data()}); });
    ps.sort((a,b)=>new Date(b.criadaEm?.toDate?.()??0)-new Date(a.criadaEm?.toDate?.()??0));
    loading.style.display='none';
    if(!ps.length){ lista.innerHTML='<div class="no-questions">Você ainda não criou nenhuma prova.</div>'; return; }
    ps.forEach(p=>{
      const exp=new Date(p.expiracao),expirou=new Date()>exp;
      const div=document.createElement('div'); div.className='questao-item';
      div.innerHTML=`
        <div class="questao-header">
          <div class="questao-badges">
            <span class="badge-disc" style="font-family:var(--font-head);letter-spacing:2px;">${p.codigo}</span>
            <span class="badge-diff">${expirou?'🔴 Expirada':'🟢 Ativa'}</span>
          </div>
          <button class="btn-res" data-id="${p.id}" data-cod="${p.codigo}" data-tit="${p.titulo}"
            style="background:rgba(0,200,255,0.1);border:1px solid rgba(0,200,255,0.3);border-radius:8px;padding:0.3rem 0.75rem;color:var(--cyan);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;">
            📊 Resultados</button>
        </div>
        <p class="questao-texto"><strong>${p.titulo}</strong></p>
        <div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin-top:0.5rem;">
          <span class="op-item">${subjectNames[p.disciplina]||p.disciplina}</span>
          <span class="op-item">${p.dificuldade}</span>
          <span class="op-item">❓ ${p.quantidade} questões</span>
          <span class="op-item">⏱️ ${p.tempoPorQuestao}s/q</span>
          <span class="op-item">📅 ${exp.toLocaleString('pt-BR')}</span>
        </div>`;
      div.querySelector('.btn-res').onclick = function(){ verResultados(this.dataset.id, this.dataset.cod, this.dataset.tit); };
      lista.appendChild(div);
    });
  } catch(e){ loading.style.display='none'; lista.innerHTML='<div class="no-questions">❌ '+e.message+'</div>'; }
}

async function verResultados(provaId, codigo, titulo){
  const modal=document.createElement('div'); modal.className='modal-overlay';
  modal.innerHTML=`<div class="modal-box">
    <div class="modal-header">
      <h3>📊 ${titulo} — ${codigo}</h3>
      <button class="btn-delete" id="btnFecharModal">✕ Fechar</button>
    </div>
    <div id="modalContent">🔄 Carregando...</div>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#btnFecharModal').onclick = ()=>modal.remove();
  try {
    const snap=await getDocs(collection(db,'resultados_provas'));
    let res=[]; snap.forEach(d=>{ if(d.data().provaId===provaId) res.push(d.data()); });
    res.sort((a,b)=>b.nota-a.nota);
    if(!res.length){ modal.querySelector('#modalContent').innerHTML='<p style="color:var(--text2);text-align:center;padding:2rem;">Nenhum aluno realizou esta prova ainda.</p>'; return; }
    const media=(res.reduce((s,r)=>s+r.nota,0)/res.length).toFixed(1);
    const aprovados=res.filter(r=>r.nota>=5).length;
    modal.querySelector('#modalContent').innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
        <div class="stat-card"><div class="stat-num">${res.length}</div><div class="stat-label">Alunos</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--green)">${media}</div><div class="stat-label">Média</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--cyan)">${aprovados}</div><div class="stat-label">Aprovados</div></div>
      </div>
      <div class="resultado-lista">
        ${res.map((r,i)=>`
          <div class="resultado-item">
            <div class="rank-pos">${i+1}</div>
            <div class="rank-info">
              <div class="rank-name">${r.nomeAluno}</div>
              <div class="rank-details">✅ ${r.acertos} acertos • ❌ ${r.erros} erros • ${r.dataHora}</div>
            </div>
            <div class="nota-badge ${parseFloat(r.nota)>=5?'nota-ok':'nota-fail'}">${r.nota}</div>
          </div>`).join('')}
      </div>`;
  } catch(e){ modal.querySelector('#modalContent').innerHTML='<p style="color:var(--red);">Erro: '+e.message+'</p>'; }
}

// ===== QUESTÕES =====
async function adicionarQuestao(){
  if(!professorAtual) return;
  const pergunta   =document.getElementById('addPergunta')?.value.trim();
  const disciplina =document.getElementById('addDisciplina')?.value;
  const dificuldade=document.getElementById('addDificuldade')?.value;
  const ops=[0,1,2,3].map(i=>document.getElementById('alt'+i)?.value.trim());
  const correta=parseInt(document.querySelector('input[name="correta"]:checked')?.value);
  if(!pergunta||ops.some(o=>!o)){ msg('msgAdd','⚠️ Preencha a pergunta e todas as alternativas!','erro'); return; }
  try {
    msg('msgAdd','🔄 Salvando...','info');
    await addDoc(collection(db,'questoes'),{ p:pergunta,ops,c:correta,disciplina,dificuldade,criadoEm:new Date(),professorUid:professorAtual.uid });
    msg('msgAdd','✅ Questão salva com sucesso!','sucesso');
    document.getElementById('addPergunta').value='';
    [0,1,2,3].forEach(i=>{ if(document.getElementById('alt'+i)) document.getElementById('alt'+i).value=''; });
    document.getElementById('r0').checked=true;
    carregarQuestoes(); carregarStats();
  } catch(e){ msg('msgAdd','❌ Erro: '+e.message,'erro'); }
}


// ===== EDITAR PROFESSOR =====
function abrirModalEditar(id, nomeAtual, emailAtual) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:480px;">
      <div class="modal-header">
        <h3>✏️ Editar Professor</h3>
        <button class="btn-delete" id="btnFecharEditar">✕ Fechar</button>
      </div>
      <div class="form-group">
        <label>👤 Nome</label>
        <input type="text" id="editNome" value="${nomeAtual}" placeholder="Nome completo"/>
      </div>
      <div class="form-group">
        <label>📧 Novo E-mail <span style="color:var(--text2);font-size:0.8rem;">(deixe em branco para não alterar)</span></label>
        <input type="email" id="editEmail" placeholder="Novo e-mail (opcional)"/>
      </div>
      <div class="form-group">
        <label>🔑 Nova Senha <span style="color:var(--text2);font-size:0.8rem;">(deixe em branco para não alterar)</span></label>
        <input type="password" id="editSenha" placeholder="Nova senha (mín. 6 caracteres)"/>
      </div>
      <button class="btn-play" id="btnSalvarEdicao">
        <span>💾 Salvar Alterações</span><div class="btn-glow"></div>
      </button>
      <div id="msgEdicao" class="msg hidden"></div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#btnFecharEditar').onclick = () => modal.remove();

  modal.querySelector('#btnSalvarEdicao').onclick = async function() {
    const novoNome  = modal.querySelector('#editNome').value.trim();
    const novoEmail = modal.querySelector('#editEmail').value.trim();
    const novaSenha = modal.querySelector('#editSenha').value;
    const msgEl     = modal.querySelector('#msgEdicao');

    if (!novoNome) { msgEl.textContent='⚠️ O nome não pode estar vazio!'; msgEl.className='msg msg-erro'; return; }
    if (novaSenha && novaSenha.length < 6) { msgEl.textContent='⚠️ Senha mínima de 6 caracteres!'; msgEl.className='msg msg-erro'; return; }

    try {
      msgEl.textContent='🔄 Salvando...'; msgEl.className='msg msg-info';

      // Atualiza nome no Firestore
      const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      await updateDoc(doc(db, 'professores', id), { nome: novoNome, ...(novoEmail ? { email: novoEmail } : {}) });

      msgEl.textContent='✅ Dados atualizados com sucesso!';
      msgEl.className='msg msg-sucesso';

      setTimeout(() => { modal.remove(); carregarProfessores(); }, 1500);
    } catch(e) {
      msgEl.textContent='❌ Erro: ' + e.message;
      msgEl.className='msg msg-erro';
    }
  };
}



// ===== EXPORTAR TEMPLATE CSV =====
function exportarTemplate() {
  const linhas = [
    ['Nº','Disciplina','Dificuldade','Pergunta','A','B','C','D','Correta'],
    ['1','Informática','Fácil','O que significa HTML?','HyperText Markup Language','High Transfer Machine','HyperTool Multi Logic','Home Text Master','A'],
    ['2','Matemática','Médio','Quanto é 2³?','6','9','8','12','C'],
    ['3','Português','Difícil','O que é metáfora?','Comparação com como','Comparação implícita','Repetição de sons','Exagero','B'],
    ['4','Ciências','Fácil','Fórmula química da água?','CO₂','NaCl','H₂O','O₂','C'],
    ['5','Geografia','Médio','Capital do Brasil?','São Paulo','Salvador','Rio de Janeiro','Brasília','D'],
    ['6','Biologia','Difícil','O que é mitose?','Gera gametas','Gera células idênticas','Fusão de células','Morte celular','B'],
    ['7','Educação Física','Fácil','Quantos jogadores no futebol?','9','10','12','11','D'],
    ['8','Química','Médio','Símbolo do ouro?','Or','Go','Ag','Au','D'],
    ['9','Física','Difícil','O que é E=mc²?','Energia cinética','Lei termodinâmica','Força gravitacional','Massa equivale a energia','D'],
    ['10','História','Fácil','Ano da independência do Brasil?','1808','1822','1889','1500','B']
  ];

  let csv = '\uFEFF'; // BOM UTF-8 para Excel
  linhas.forEach(linha => {
    csv += linha.map(c => '"'+String(c).replace(/"/g,'""')+'"').join(';') + '\n';
  });

  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'EduQuest_Template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// ===== IMPORTAR CSV =====
async function importarCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const msg = document.getElementById('msgImportCSV');
  msg.textContent = '🔄 Lendo arquivo...'; msg.className = 'msg msg-info';

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const text = e.target.result;
      const linhas = text.split('\n').filter(l => l.trim());
      if (linhas.length < 2) { msg.textContent='❌ Arquivo vazio!'; msg.className='msg msg-erro'; return; }

      // Pula cabeçalho
      let importadas = 0, erros = 0;
      const discSnap = await getDocs(collection(db,'disciplinas'));
      const discIds = new Set();
      discSnap.forEach(d => discIds.add(d.id));

      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];
        if (!linha.trim()) continue;
        // Remove aspas e divide por ;
        const cols = linha.split(';').map(c => c.replace(/^"|"$/g,'').replace(/""/g,'"').trim());
        if (cols.length < 9) { erros++; continue; }

        const [num, discNome, diffNome, pergunta, opA, opB, opC, opD, correta] = cols;
        if (!pergunta || !opA || !opB || !opC || !opD || !correta) { erros++; continue; }

        // Mapeia disciplina
        const discMap = {
          'informática':'informatica','informatica':'informatica',
          'matemática':'matematica','matematica':'matematica',
          'português':'portugues','portugues':'portugues',
          'ciências':'ciencias','ciencias':'ciencias',
          'geografia':'geografia','biologia':'biologia',
          'educação física':'educacaofisica','educacaofisica':'educacaofisica',
          'química':'quimica','quimica':'quimica',
          'física':'fisica','fisica':'fisica',
          'história':'historia','historia':'historia',
          'artes':'artes'
        };
        const discId = discMap[discNome.toLowerCase()] || discNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');

        // Mapeia dificuldade
        const diffMap = { 'fácil':'facil','facil':'facil','médio':'medio','medio':'medio','difícil':'dificil','dificil':'dificil' };
        const diffId = diffMap[diffNome.toLowerCase()] || 'facil';

        // Mapeia índice correto
        const corrIdx = {'A':0,'B':1,'C':2,'D':3}[correta.toUpperCase()];
        if (corrIdx === undefined) { erros++; continue; }

        try {
          await addDoc(collection(db,'questoes'), {
            p: pergunta,
            ops: [opA, opB, opC, opD],
            c: corrIdx,
            disciplina: discId,
            dificuldade: diffId,
            criadoEm: new Date(),
            professorUid: professorAtual?.uid || ''
          });
          importadas++;
          if (importadas % 10 === 0) {
            msg.textContent = `🔄 Importando... ${importadas} questões salvas`;
          }
        } catch(e2) { erros++; }
      }

      msg.textContent = `✅ ${importadas} questões importadas! ${erros>0?'('+erros+' com erro)':''}`;
      msg.className = 'msg msg-sucesso';
      document.getElementById('inputCSV').value = '';
      carregarQuestoes();
      carregarStats();
    } catch(e) {
      msg.textContent = '❌ Erro ao ler arquivo: ' + e.message;
      msg.className = 'msg msg-erro';
    }
  };
  reader.readAsText(file, 'UTF-8');
}

// ===== EXPORTAR EXCEL =====
async function exportarExcel() {
  const btn = document.getElementById('btnExportar');
  btn.textContent = '⏳ Exportando...';
  btn.disabled = true;

  try {
    const filtDisc = document.getElementById('filtDisciplina')?.value;
    const filtDiff = document.getElementById('filtDificuldade')?.value;

    const snap = await getDocs(collection(db, 'questoes'));
    let qs = [];
    snap.forEach(d => qs.push({ id: d.id, ...d.data() }));
    if (filtDisc) qs = qs.filter(q => q.disciplina === filtDisc);
    if (filtDiff) qs = qs.filter(q => q.dificuldade === filtDiff);

    if (!qs.length) { alert('Nenhuma questão para exportar com os filtros atuais!'); btn.textContent='📥 Exportar Excel'; btn.disabled=false; return; }

    const dN = { informatica:'Informática', matematica:'Matemática', portugues:'Português', ciencias:'Ciências' };
    const dfN = { facil:'Fácil', medio:'Médio', dificil:'Difícil' };
    const labels = ['A','B','C','D'];

    // Monta CSV com separador ponto-e-vírgula (compatível com Excel BR)
    const linhas = [
      ['Nº','Disciplina','Dificuldade','Pergunta','A','B','C','D','Correta'].join(';')
    ];

    qs.forEach((q, i) => {
      const correta = labels[q.c] || '';
      const linha = [
        i + 1,
        dN[q.disciplina] || q.disciplina,
        dfN[q.dificuldade] || q.dificuldade,
        '"' + (q.p || '').replace(/"/g, '""') + '"',
        '"' + (q.ops?.[0] || '').replace(/"/g, '""') + '"',
        '"' + (q.ops?.[1] || '').replace(/"/g, '""') + '"',
        '"' + (q.ops?.[2] || '').replace(/"/g, '""') + '"',
        '"' + (q.ops?.[3] || '').replace(/"/g, '""') + '"',
        correta
      ].join(';');
      linhas.push(linha);
    });

    const csvContent = '\uFEFF' + linhas.join('\n'); // BOM para Excel reconhecer UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filtroNome = (filtDisc ? '_' + (dN[filtDisc]||filtDisc) : '') + (filtDiff ? '_' + (dfN[filtDiff]||filtDiff) : '');
    link.href = url;
    link.download = 'EduQuest_Questoes' + filtroNome + '.csv';
    link.click();
    URL.revokeObjectURL(url);

    btn.textContent = '✅ Exportado!';
    setTimeout(() => { btn.textContent='📥 Exportar Excel'; btn.disabled=false; }, 2000);

  } catch(e) {
    alert('Erro ao exportar: ' + e.message);
    btn.textContent='📥 Exportar Excel';
    btn.disabled=false;
  }
}


// ===== DISCIPLINAS FIXAS =====
const DISCIPLINAS_PADRAO = [
  { id:'informatica',    emoji:'💻', nome:'Informática' },
  { id:'matematica',     emoji:'📐', nome:'Matemática' },
  { id:'portugues',      emoji:'📖', nome:'Português' },
  { id:'ciencias',       emoji:'🔬', nome:'Ciências' },
  { id:'geografia',      emoji:'🌍', nome:'Geografia' },
  { id:'biologia',       emoji:'🧬', nome:'Biologia' },
  { id:'educacaofisica', emoji:'⚽', nome:'Educação Física' },
  { id:'quimica',        emoji:'⚗️', nome:'Química' },
  { id:'fisica',         emoji:'⚡', nome:'Física' },
  { id:'historia',       emoji:'📜', nome:'História' },
  { id:'artes',          emoji:'🎨', nome:'Artes' }
];


// ===== ACCORDION =====
function initAccordions() {
  document.querySelectorAll('.acc-header').forEach(header => {
    // Estado inicial — define quais começam fechados
    const body = header.nextElementSibling;
    const arrow = header.querySelector('.acc-arrow');
    const startClosed = header.dataset.closed === 'true';
    if (startClosed && body && arrow) {
      body.classList.add('collapsed');
      arrow.classList.add('collapsed');
    }
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.acc-arrow');
      if (!body || !arrow) return;
      body.classList.toggle('collapsed');
      arrow.classList.toggle('collapsed');
    });
  });
}

// Popula selects e card com disciplinas fixas + extras do Firebase
async function atualizarSelectsDisciplinas() {
  // Começa com as fixas
  let todasDiscs = [...DISCIPLINAS_PADRAO];

  // Busca extras do Firebase (adicionadas pelo admin)
  try {
    const snap = await getDocs(collection(db, 'disciplinas'));
    snap.forEach(d => {
      const data = d.data();
      // Só adiciona se não for duplicata das fixas
      const jaExiste = todasDiscs.some(f => f.id === d.id);
      if (!jaExiste) {
        todasDiscs.push({ id: d.id, emoji: data.emoji||'📚', nome: data.nome, ordem: data.ordem||99 });
      }
    });
    todasDiscs.sort((a,b) => (a.ordem||99)-(b.ordem||99));
  } catch(e) { console.log('Erro ao buscar disciplinas extras:', e); }

  const opcoes = todasDiscs.map(d=>`<option value="${d.id}">${d.emoji} ${d.nome}</option>`).join('');

  ['provaDisciplina','addDisciplina'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opcoes;
  });
  const filtEl = document.getElementById('filtDisciplina');
  if (filtEl) filtEl.innerHTML = '<option value="">Todas</option>' + opcoes;

  // Popula card visual de disciplinas
  const grid = document.getElementById('discFixasGrid');
  if (grid) {
    grid.innerHTML = todasDiscs.map(d => `
      <div style="background:rgba(0,200,255,0.05);border:1px solid var(--border);border-radius:10px;padding:0.7rem 1rem;display:flex;align-items:center;gap:0.5rem;">
        <span style="font-size:1.3rem;">${d.emoji}</span>
        <span style="font-weight:600;color:var(--text);">${d.nome}</span>
      </div>`).join('');
  }
}

async function carregarQuestoes(){
  const filtDisc=document.getElementById('filtDisciplina')?.value;
  const filtDiff=document.getElementById('filtDificuldade')?.value;
  const lista=document.getElementById('listaQuestoes'), loading=document.getElementById('loadingQuestoes');
  if(!lista||!loading) return;
  loading.style.display='block'; lista.innerHTML='';
  try {
    const snap=await getDocs(collection(db,'questoes'));
    let qs=[]; snap.forEach(d=>qs.push({id:d.id,...d.data()}));
    if(filtDisc) qs=qs.filter(q=>q.disciplina===filtDisc);
    if(filtDiff) qs=qs.filter(q=>q.dificuldade===filtDiff);
    loading.style.display='none';
    if(!qs.length){ lista.innerHTML='<div class="no-questions">Nenhuma questão encontrada.</div>'; return; }
    const dN={informatica:'💻 Informática',matematica:'📐 Matemática',portugues:'📖 Português',ciencias:'🔬 Ciências'};
    const dfN={facil:'🟢 Fácil',medio:'🟡 Médio',dificil:'🔴 Difícil'};
    qs.forEach((q,i)=>{
      const div=document.createElement('div'); div.className='questao-item';
      div.innerHTML=`
        <div class="questao-header">
          <div class="questao-badges">
            <span class="badge-disc">${dN[q.disciplina]||q.disciplina}</span>
            <span class="badge-diff">${dfN[q.dificuldade]||q.dificuldade}</span>
          </div>
          <button class="btn-delete" data-id="${q.id}">🗑️ Excluir</button>
        </div>
        <p class="questao-texto"><strong>${i+1}.</strong> ${q.p}</p>
        <div class="questao-ops">
          ${q.ops.map((op,idx)=>`<div class="op-item ${idx===q.c?'op-correta':''}">
            <span class="op-label">${['A','B','C','D'][idx]}</span><span>${op}</span>
            ${idx===q.c?'<span class="op-check">✅</span>':''}
          </div>`).join('')}
        </div>`;
      div.querySelector('.btn-delete').onclick = async function(){
        if(!confirm('Excluir esta questão?')) return;
        this.textContent='🔄';
        await deleteDoc(doc(db,'questoes',this.dataset.id));
        this.closest('.questao-item').remove();
        carregarStats();
      };
      lista.appendChild(div);
    });
  } catch(e){ loading.style.display='none'; lista.innerHTML='<div class="no-questions">❌ '+e.message+'</div>'; }
}

async function carregarStats(){
  try {
    const snap = await getDocs(collection(db,'questoes'));
    let total = 0;
    const contagem = {};
    snap.forEach(d => {
      total++;
      const disc = d.data().disciplina || 'outros';
      contagem[disc] = (contagem[disc] || 0) + 1;
    });

    // Reconstrói o grid usando disciplinas fixas
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    grid.innerHTML = `<div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total</div></div>`;
    DISCIPLINAS_PADRAO.forEach(d => {
      const qtd = contagem[d.id] || 0;
      if (qtd > 0) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `<div class="stat-num">${qtd}</div><div class="stat-label">${d.emoji} ${d.nome}</div>`;
        grid.appendChild(card);
      }
    });
  } catch(e){ console.log('Stats erro:', e); }
}
