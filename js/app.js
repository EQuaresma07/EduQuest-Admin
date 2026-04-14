import { db, auth, provider, collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc, updateDoc, query, where, limit, orderBy, startAfter,
         signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signOut, onAuthStateChanged, sendPasswordResetEmail } from './firebase.js';

// Autenticação admin via Firebase (sem senha hardcoded)
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

// ===== TELA DE LOGIN (Google) =====
function renderLogin(erroMsg = '') {
  root().innerHTML = `
    <div style="width:100%;max-width:440px;margin:auto;">
      <div style="text-align:center;margin-bottom:2.5rem;animation:fadeInDown 0.6s ease;">
        <div style="font-size:3.5rem;margin-bottom:0.5rem;">🎓</div>
        <h1 style="font-family:var(--font-head);color:white;letter-spacing:3px;font-size:1.8rem;margin:0.5rem 0;text-shadow:0 0 30px rgba(0,200,255,0.4);">EduQuest</h1>
        <p style="color:var(--text2);letter-spacing:1px;">Painel do Professor</p>
      </div>

      <div class="card">
        <div class="card-inner" style="padding:2rem;text-align:center;">
          <h2 style="font-family:var(--font-head);color:white;letter-spacing:2px;font-size:1rem;margin-bottom:0.5rem;">ÁREA DO PROFESSOR</h2>
          <p style="color:var(--text2);font-size:0.88rem;margin-bottom:2rem;line-height:1.7;">
            Entre com sua conta Google cadastrada pelo administrador para acessar o painel.
          </p>

          <button id="btnGoogle" class="btn-google">
            <svg width="20" height="20" viewBox="0 0 48 48" style="flex-shrink:0;">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            <span>Entrar com Google</span>
          </button>

          <div id="msgLogin" class="msg ${erroMsg ? 'msg-erro' : 'hidden'}" style="margin-top:1rem;">${erroMsg}</div>

          <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border);">
            <p style="color:var(--text2);font-size:0.8rem;margin-bottom:0.75rem;">Outras opções de acesso</p>
            <div style="display:flex;flex-direction:column;gap:0.5rem;">
              <button id="btnLoginEmail" style="background:none;border:1px solid var(--border);border-radius:8px;color:var(--text2);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;padding:0.5rem;letter-spacing:1px;transition:all 0.2s;">
                📧 Entrar com E-mail e Senha
              </button>
              <button id="btnEsqueci" style="background:none;border:none;color:var(--cyan);font-family:var(--font-body);font-size:0.82rem;cursor:pointer;letter-spacing:1px;">
                🔑 Esqueci minha senha
              </button>
              <button id="btnIrAdmin" style="background:none;border:none;color:var(--text2);font-family:var(--font-body);font-size:0.82rem;cursor:pointer;letter-spacing:1px;">
                ⚙️ Área do Administrador
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Painel de login por e-mail (oculto por padrão) -->
      <div id="painelEmail" style="display:none;margin-top:1rem;">
        <div class="card"><div class="card-inner" style="padding:1.5rem;">
          <h3 style="font-family:var(--font-head);color:var(--cyan);font-size:0.9rem;letter-spacing:2px;margin-bottom:1rem;">🔒 LOGIN COM E-MAIL</h3>
          <div class="form-group"><label>📧 E-mail</label>
            <input type="email" id="loginEmail" placeholder="seu@email.com"/></div>
          <div class="form-group"><label>🔑 Senha</label>
            <input type="password" id="loginSenha" placeholder="Sua senha"/></div>
          <button class="btn-play" id="btnLogin"><span>🔓 Entrar</span><div class="btn-glow"></div></button>
          <div id="msgLoginEmail" class="msg hidden" style="margin-top:0.75rem;"></div>
        </div></div>
      </div>
    </div>`;

  document.getElementById('btnGoogle').onclick = fazerLoginGoogle;
  document.getElementById('btnLoginEmail').onclick = () => {
    const p = document.getElementById('painelEmail');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
  };
  document.getElementById('btnLogin').onclick = fazerLoginEmail;
  document.getElementById('loginSenha')?.addEventListener('keydown', e => { if(e.key==='Enter') fazerLoginEmail(); });
  document.getElementById('btnIrAdmin').onclick = renderAdmin;
  document.getElementById('btnEsqueci').onclick = renderEsqueci;
}

async function fazerLoginEmail() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const senha = document.getElementById('loginSenha')?.value;
  const msgEl = document.getElementById('msgLoginEmail');
  if (!email || !senha) { msgEl.textContent='⚠️ Preencha e-mail e senha!'; msgEl.className='msg msg-erro'; return; }
  try {
    msgEl.textContent='🔄 Entrando...'; msgEl.className='msg msg-info';
    await signInWithEmailAndPassword(auth, email, senha);
  } catch(e) { msgEl.textContent='❌ E-mail ou senha incorretos!'; msgEl.className='msg msg-erro'; }
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
          <label>👤 Nome completo</label>
          <input type="text" id="solNome" placeholder="Seu nome completo"/>
        </div>
        <div class="form-group">
          <label>📧 E-mail de contato</label>
          <input type="email" id="solEmail" placeholder="seuemail@exemplo.com"/>
        </div>
        <div class="form-group">
          <label>📱 Telefone / WhatsApp</label>
          <input type="tel" id="solTelefone" placeholder="(00) 00000-0000"/>
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
    const nome      = document.getElementById('solNome').value.trim();
    const email     = document.getElementById('solEmail').value.trim();
    const telefone  = document.getElementById('solTelefone').value.trim();
    const mensagem  = document.getElementById('solMensagem').value.trim();
    const msgEl     = document.getElementById('msgSolicitacao');
    if (!nome||!mensagem) { msgEl.textContent='⚠️ Preencha pelo menos seu nome e a mensagem!'; msgEl.className='msg msg-erro'; return; }
    try {
      msgEl.textContent='🔄 Enviando solicitação...'; msgEl.className='msg msg-info';
      await addDoc(collection(db,'solicitacoes_senha'),{
        nome, email, telefone, mensagem,
        dataHora: new Date().toLocaleString('pt-BR'),
        timestamp: new Date(),
        status: 'pendente'
      });
      msgEl.textContent='✅ Solicitação enviada! O administrador entrará em contato em breve.';
      msgEl.className='msg msg-sucesso';
      document.getElementById('solNome').value='';
      document.getElementById('solEmail').value='';
      document.getElementById('solTelefone').value='';
      document.getElementById('solMensagem').value='';
    } catch(e) {
      msgEl.textContent='❌ Erro ao enviar: '+e.message;
      msgEl.className='msg msg-erro';
    }
  };
}

function renderAdmin() {
  root().innerHTML = `
    <div style="width:100%;max-width:480px;margin:auto;">
      <div style="text-align:center;margin-bottom:2rem;animation:fadeInDown 0.6s ease;">
        <div style="font-size:3rem;">⚙️</div>
        <h1 style="font-family:var(--font-head);color:var(--purple);letter-spacing:3px;font-size:1.4rem;margin:0.5rem 0;">Administrador</h1>
        <p style="color:var(--text2);">Entre com sua conta Google de administrador</p>
      </div>

      <div class="card"><div class="card-inner" style="padding:2rem;text-align:center;">
        <h2 style="font-family:var(--font-head);color:white;letter-spacing:2px;font-size:1rem;margin-bottom:0.5rem;">ACESSO ADMINISTRATIVO</h2>
        <p style="color:var(--text2);font-size:0.88rem;margin-bottom:1.5rem;line-height:1.7;">
          Use a conta Google cadastrada como administrador do sistema.
        </p>

        <button id="btnAdminGoogle" class="btn-google">
          <svg width="20" height="20" viewBox="0 0 48 48" style="flex-shrink:0;">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          <span>Entrar como Administrador</span>
        </button>

        <div id="msgAdmin" class="msg hidden" style="margin-top:1rem;"></div>
      </div></div>

      <div style="text-align:center;margin-top:1rem;">
        <button id="btnVoltarLogin" style="background:none;border:none;color:var(--text2);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;">← Voltar ao Login</button>
      </div>
    </div>`;

  document.getElementById('btnAdminGoogle').onclick = fazerLoginAdmin;
  document.getElementById('btnVoltarLogin').onclick  = renderLogin;
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

    <div class="painel-layout">

      <!-- SIDEBAR -->
      <nav class="sidebar">
        <div class="sidebar-brand">
          <span style="font-size:1.4rem;">🎓</span>
          <div>
            <div class="sidebar-brand-name">COGNIX</div>
            <div class="sidebar-brand-sub">PROFESSOR</div>
          </div>
        </div>
        <button class="sidebar-item active" data-section="inicio">
          <span class="sidebar-icon">📊</span><span>Início</span>
        </button>
        <button class="sidebar-item" data-section="provas">
          <span class="sidebar-icon">🎯</span><span>Provas</span>
        </button>
        <button class="sidebar-item" data-section="questoes">
          <span class="sidebar-icon">➕</span><span>Questões</span>
        </button>
        <div class="sidebar-divider"></div>
        <button class="sidebar-item" data-section="banco">
          <span class="sidebar-icon">🗄️</span><span>Banco Geral</span>
        </button>
      </nav>

      <!-- CONTEÚDO -->
      <div class="painel-content">

        <!-- SEÇÃO: INÍCIO -->
        <div class="painel-section active" id="section-inicio">
          <div class="section-page-title">📊 Visão Geral</div>
          <div class="stats-grid" id="statsGrid">
            <div class="stat-card"><div class="stat-num" id="statTotal">0</div><div class="stat-label">Questões no banco</div></div>
          </div>
          <div class="card" style="margin-top:1rem;"><div class="card-inner" style="padding:1.5rem;">
            <h3 style="font-family:var(--font-head);color:var(--cyan);letter-spacing:2px;font-size:0.85rem;margin-bottom:1rem;">🚀 ACESSO RÁPIDO</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
              <button class="sidebar-shortcut" data-section="provas"
                style="background:rgba(0,200,255,0.08);border:1px solid rgba(0,200,255,0.2);border-radius:12px;padding:1rem;cursor:pointer;transition:all 0.2s;text-align:center;">
                <div style="font-size:1.5rem;">🎯</div>
                <div style="font-family:var(--font-head);color:var(--cyan);font-size:0.78rem;letter-spacing:1px;margin-top:0.3rem;">CRIAR PROVA</div>
              </button>
              <button class="sidebar-shortcut" data-section="questoes"
                style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:12px;padding:1rem;cursor:pointer;transition:all 0.2s;text-align:center;">
                <div style="font-size:1.5rem;">➕</div>
                <div style="font-family:var(--font-head);color:var(--purple);font-size:0.78rem;letter-spacing:1px;margin-top:0.3rem;">ADD QUESTÃO</div>
              </button>
              <button class="sidebar-shortcut" data-section="banco"
                style="background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);border-radius:12px;padding:1rem;cursor:pointer;transition:all 0.2s;text-align:center;">
                <div style="font-size:1.5rem;">🗄️</div>
                <div style="font-family:var(--font-head);color:var(--green);font-size:0.78rem;letter-spacing:1px;margin-top:0.3rem;">BANCO GERAL</div>
              </button>
              <button class="sidebar-shortcut" data-section="provas"
                style="background:rgba(255,68,85,0.08);border:1px solid rgba(255,68,85,0.2);border-radius:12px;padding:1rem;cursor:pointer;transition:all 0.2s;text-align:center;">
                <div style="font-size:1.5rem;">📋</div>
                <div style="font-family:var(--font-head);color:var(--red);font-size:0.78rem;letter-spacing:1px;margin-top:0.3rem;">MINHAS PROVAS</div>
              </button>
            </div>
          </div></div>
        </div>

        <!-- SEÇÃO: PROVAS -->
        <div class="painel-section" id="section-provas">
          <div class="section-page-title">🎯 Provas Coletivas</div>

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
            <div style="background:rgba(168,85,247,0.07);border:1px solid rgba(168,85,247,0.25);border-radius:12px;padding:1rem 1.2rem;margin-bottom:1rem;">
              <label style="display:flex;align-items:center;gap:0.75rem;cursor:pointer;user-select:none;">
                <div class="toggle-switch" id="togglePersonalizadas" data-on="false"
                  style="width:44px;height:24px;background:rgba(255,255,255,0.1);border-radius:12px;position:relative;cursor:pointer;transition:background 0.3s;flex-shrink:0;">
                  <div class="toggle-knob" style="width:18px;height:18px;background:#aaa;border-radius:50%;position:absolute;top:3px;left:3px;transition:all 0.3s;"></div>
                </div>
                <div>
                  <div style="font-weight:600;color:var(--text);font-size:0.95rem;">🎨 Usar minhas questões personalizadas</div>
                  <div style="color:var(--text2);font-size:0.8rem;margin-top:2px;">Misture suas questões com o banco geral</div>
                </div>
              </label>
              <div id="painelPersonalizadas" style="display:none;margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(168,85,247,0.2);">
                <div class="form-row">
                  <div class="form-group" style="margin-bottom:0;">
                    <label>🎨 Questões minhas</label>
                    <input type="number" id="qtdPersonalizadas" min="0" value="5" style="text-align:center;font-size:1.1rem;font-family:var(--font-head);"/>
                    <small id="disponivelMsg" style="color:var(--cyan);font-size:0.78rem;margin-top:4px;display:block;">Carregando...</small>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--text2);padding-top:1.5rem;">+</div>
                  <div class="form-group" style="margin-bottom:0;">
                    <label>📚 Questões do banco geral</label>
                    <input type="number" id="qtdGerais" min="0" value="5" style="text-align:center;font-size:1.1rem;font-family:var(--font-head);"/>
                  </div>
                </div>
                <div id="msgMistura" style="color:var(--text2);font-size:0.82rem;margin-top:0.75rem;text-align:center;"></div>
              </div>
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

          <div class="card" style="margin-top:1rem;"><div class="card-inner">
            <div class="acc-header" data-closed="false">
              <h2 class="section-title" style="border:none;padding:0;margin:0;">📋 Minhas Provas</h2>
              <span class="acc-arrow">▼</span>
            </div>
            <div class="acc-body">
            <div id="loadingProvas" class="loading-msg">🔄 Carregando...</div>
            <div id="listaProvas"></div>
            </div>
          </div></div>

          <div class="card" style="margin-top:1rem;"><div class="card-inner">
            <div class="acc-header" data-closed="true">
              <h2 class="section-title" style="border:none;padding:0;margin:0;">🎨 Minhas Questões Personalizadas</h2>
              <span class="acc-arrow">▼</span>
            </div>
            <div class="acc-body">
            <p style="color:var(--text2);font-size:0.85rem;margin-bottom:1rem;line-height:1.6;">Questões exclusivas suas — invisíveis para outros professores e separadas do banco geral.</p>
            <div class="card" style="background:rgba(168,85,247,0.05);border:1px solid rgba(168,85,247,0.2);margin-bottom:1.2rem;">
              <div class="card-inner" style="padding:1.2rem;">
                <h3 style="font-family:var(--font-head);color:var(--purple);font-size:0.9rem;letter-spacing:2px;margin-bottom:1rem;">➕ NOVA QUESTÃO PERSONALIZADA</h3>
                <div class="form-row">
                  <div class="form-group"><label>📚 Disciplina</label><select id="pAddDisciplina"></select></div>
                  <div class="form-group"><label>⚡ Dificuldade</label>
                    <select id="pAddDificuldade">
                      <option value="facil">🟢 Fácil</option>
                      <option value="medio">🟡 Médio</option>
                      <option value="dificil">🔴 Difícil</option>
                    </select></div>
                </div>
                <div class="form-group"><label>❓ Pergunta</label>
                  <textarea id="pAddPergunta" placeholder="Digite a pergunta..." rows="3"></textarea></div>
                <div class="form-group"><label>✅ Alternativas — clique na letra para marcar a correta</label>
                  <div class="alternativas-grid">
                    <div class="alt-item"><input type="radio" name="pCorreta" value="0" id="pr0" checked/><label for="pr0" class="alt-label">A</label><input type="text" id="pAlt0" placeholder="Alternativa A" class="alt-input"/></div>
                    <div class="alt-item"><input type="radio" name="pCorreta" value="1" id="pr1"/><label for="pr1" class="alt-label">B</label><input type="text" id="pAlt1" placeholder="Alternativa B" class="alt-input"/></div>
                    <div class="alt-item"><input type="radio" name="pCorreta" value="2" id="pr2"/><label for="pr2" class="alt-label">C</label><input type="text" id="pAlt2" placeholder="Alternativa C" class="alt-input"/></div>
                    <div class="alt-item"><input type="radio" name="pCorreta" value="3" id="pr3"/><label for="pr3" class="alt-label">D</label><input type="text" id="pAlt3" placeholder="Alternativa D" class="alt-input"/></div>
                  </div></div>
                <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
                  <button class="btn-play" id="btnAddQuestaoP" style="flex:1;"><span>💾 Salvar Questão</span><div class="btn-glow"></div></button>
                  <button id="btnImportarCSVP" style="flex:1;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:10px;padding:0.7rem 1rem;color:var(--purple);font-family:var(--font-body);font-size:0.9rem;font-weight:600;cursor:pointer;letter-spacing:1px;">📂 Importar CSV</button>
                </div>
                <input type="file" id="inputCSVP" accept=".csv" style="display:none;"/>
                <div id="msgAddP" class="msg hidden" style="margin-top:0.75rem;"></div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem;">
              <div class="filter-row" style="margin:0;flex:1;">
                <select id="filtPDisc"><option value="">Todas</option></select>
                <select id="filtPDiff"><option value="">Todos os níveis</option>
                  <option value="facil">🟢 Fácil</option>
                  <option value="medio">🟡 Médio</option>
                  <option value="dificil">🔴 Difícil</option>
                </select>
              </div>
              <button id="btnExportarP" style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:8px;padding:0.4rem 1rem;color:var(--green);font-family:var(--font-body);font-size:0.85rem;font-weight:600;cursor:pointer;letter-spacing:1px;white-space:nowrap;">📥 Exportar CSV</button>
            </div>
            <div id="loadingQuestoesP" class="loading-msg">🔄 Carregando suas questões...</div>
            <div id="listaQuestoesP"></div>
            </div>
          </div></div>
        </div>

        <!-- SEÇÃO: QUESTÕES -->
        <div class="painel-section" id="section-questoes">
          <div class="section-page-title">➕ Adicionar Questão ao Banco</div>
          <div class="card"><div class="card-inner">
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
              <button id="btnImportarCSV" style="flex:1;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:10px;padding:0.7rem 1rem;color:var(--purple);font-family:var(--font-body);font-size:0.9rem;font-weight:600;cursor:pointer;letter-spacing:1px;">📂 Importar CSV</button>
              <button id="btnExportarTemplate" style="flex:1;background:rgba(0,200,255,0.1);border:1px solid rgba(0,200,255,0.3);border-radius:10px;padding:0.7rem 1rem;color:var(--cyan);font-family:var(--font-body);font-size:0.9rem;font-weight:600;cursor:pointer;letter-spacing:1px;">📋 Exportar Template</button>
            </div>
            <input type="file" id="inputCSV" accept=".csv" style="display:none;"/>
            <div id="msgImportCSV" class="msg hidden" style="margin-top:0.75rem;"></div>
          </div></div>
        </div>

        <!-- SEÇÃO: BANCO GERAL -->
        <div class="painel-section" id="section-banco">
          <div class="section-page-title">🗄️ Banco de Questões Completo</div>
          <div class="card"><div class="card-inner">
            <div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">
              <button id="btnExportar" style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:8px;padding:0.4rem 1rem;color:var(--green);font-family:var(--font-body);font-size:0.85rem;font-weight:600;cursor:pointer;letter-spacing:1px;">📥 Exportar CSV</button>
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
          </div></div>
        </div>

      </div><!-- /painel-content -->
    </div><!-- /painel-layout -->
  `;

  // Eventos
  document.getElementById('btnLogout').onclick    = fazerLogout;
  document.body.classList.add('tem-sidebar');

  // ===== NAVEGAÇÃO SIDEBAR =====
  function ativarSecao(nome) {
    document.querySelectorAll('.sidebar-item').forEach(b => {
      b.classList.toggle('active', b.dataset.section === nome);
    });
    document.querySelectorAll('.painel-section').forEach(s => {
      s.classList.toggle('active', s.id === 'section-' + nome);
    });
    // Carrega dados da seção ao entrar
    if (nome === 'provas')   { carregarProvas(); carregarQuestoesPersonalizadas(); }
    if (nome === 'questoes') { carregarQuestoes(); }
    if (nome === 'banco')    { carregarQuestoes(); }
  }

  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.onclick = () => ativarSecao(btn.dataset.section);
  });
  document.querySelectorAll('.sidebar-shortcut').forEach(btn => {
    btn.onclick = () => ativarSecao(btn.dataset.section);
  });
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

  // Minhas Questões Personalizadas
  document.getElementById('btnAddQuestaoP').onclick    = adicionarQuestaoPersonalizada;
  document.getElementById('btnImportarCSVP').onclick   = () => document.getElementById('inputCSVP').click();
  document.getElementById('inputCSVP').onchange        = importarCSVPersonalizado;
  document.getElementById('btnExportarP').onclick      = exportarExcelPersonalizado;
  document.getElementById('filtPDisc').onchange        = carregarQuestoesPersonalizadas;
  document.getElementById('filtPDiff').onchange        = carregarQuestoesPersonalizadas;

  // Toggle questões personalizadas na prova
  document.getElementById('togglePersonalizadas').onclick = toggleQuestoesPersonalizadas;

  // Data mínima
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('provaExpiracao').min = now.toISOString().slice(0,16);

  atualizarSelectsDisciplinas();
  atualizarSelectsDisciplinas();
  carregarStats();
  // Demais seções carregam sob demanda via sidebar
  setTimeout(initAccordions, 100);
}

// ===== AUTH =====
onAuthStateChanged(auth, async user => {
  if (user) {
    // Se era sessão de admin (F5 preserva sessionStorage), restaura painel admin
    const adminUid = sessionStorage.getItem('cognix_admin_uid');
    if (adminUid && adminUid === user.uid) {
      mostrarPainelAdmin();
      return;
    }

    // Verifica se o usuário tem perfil de professor cadastrado
    try {
      const snap = await getDocs(collection(db, 'professores'));
      let encontrado = false;
      snap.forEach(d => {
        if (d.data().uid === user.uid) {
          nomeProfessor = d.data().nome;
          encontrado = true;
        }
      });
      if (!encontrado) {
        // Usuário Google logado mas não é professor cadastrado
        await signOut(auth);
        renderLogin('⛔ Sua conta Google não está cadastrada como professor. Solicite ao administrador.');
        return;
      }
    } catch(e) {}
    professorAtual = user;
    renderPainel();
    setTimeout(verificarAnunciosProfessor, 1500);
  } else {
    professorAtual = null;
    sessionStorage.removeItem('cognix_admin_uid');
    renderLogin();
  }
});

async function fazerLoginGoogle() {
  const btn = document.getElementById('btnGoogle');
  const msg = document.getElementById('msgLogin');
  if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Entrando...'; }
  try {
    await signInWithPopup(auth, provider);
    // onAuthStateChanged cuida do redirecionamento
  } catch(e) {
    let erro = '❌ Erro ao entrar com Google.';
    if (e.code === 'auth/popup-closed-by-user') erro = '⚠️ Login cancelado.';
    if (e.code === 'auth/popup-blocked') erro = '⚠️ Pop-up bloqueado. Permita pop-ups para este site.';
    if (msg) { msg.textContent = erro; msg.className = 'msg msg-erro'; }
    if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Entrar com Google'; }
  }
}

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
  if (confirm('Deseja sair da sua conta?')) {
    document.body.classList.remove('tem-sidebar');
    await signOut(auth);
  }
}

async function fazerLoginAdmin() {
  const btn   = document.getElementById('btnAdminGoogle');
  const msgEl = document.getElementById('msgAdmin');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Verificando...';
  try {
    const resultado = await signInWithPopup(auth, provider);
    const uid = resultado.user.uid;
    // Verifica se o UID está na coleção "admins"
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    if (!adminSnap.exists()) {
      await signOut(auth);
      msgEl.textContent = '⛔ Esta conta Google não tem permissão de administrador.';
      msgEl.className = 'msg msg-erro';
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Entrar como Administrador';
      return;
    }
    // Persiste sessão admin para sobreviver ao F5
    sessionStorage.setItem('cognix_admin_uid', uid);
    mostrarPainelAdmin();
  } catch(e) {
    let erro = '❌ Erro ao entrar com Google.';
    if (e.code === 'auth/popup-closed-by-user') erro = '⚠️ Login cancelado.';
    if (e.code === 'auth/popup-blocked')        erro = '⚠️ Pop-up bloqueado. Permita pop-ups para este site.';
    msgEl.textContent = erro;
    msgEl.className = 'msg msg-erro';
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Entrar como Administrador';
  }
}

function mostrarPainelAdmin() {
  root().innerHTML = `
    <nav class="sidebar">
      <div class="sidebar-brand">
        <span style="font-size:1.4rem;">⚙️</span>
        <div>
          <div class="sidebar-brand-name">COGNIX</div>
          <div class="sidebar-brand-sub">ADMIN</div>
        </div>
      </div>
      <button class="sidebar-item active" data-asection="professores">
        <span class="sidebar-icon">👨‍🏫</span><span>Professores</span>
      </button>
      <button class="sidebar-item" data-asection="disciplinas">
        <span class="sidebar-icon">📚</span><span>Disciplinas</span>
      </button>
      <div class="sidebar-divider"></div>
      <button class="sidebar-item" data-asection="solicitacoes">
        <span class="sidebar-icon">📬</span><span>Chamados</span>
      </button>
      <button class="sidebar-item" data-asection="anuncios">
        <span class="sidebar-icon">📢</span><span>Anúncios</span>
      </button>
    </nav>

    <div class="painel-content">

      <!-- PROFESSORES -->
      <div class="painel-section active" id="asection-professores">
        <div class="section-page-title">👨‍🏫 Professores</div>
        <div class="card"><div class="card-inner">
          <h3 style="font-family:var(--font-head);color:var(--cyan);font-size:0.85rem;letter-spacing:2px;margin-bottom:1rem;">➕ CRIAR CONTA DE PROFESSOR</h3>
          <div class="form-group"><label>👤 Nome</label><input type="text" id="novoProfNome" placeholder="Nome completo"/></div>
          <div class="form-group"><label>📧 E-mail</label><input type="email" id="novoProfEmail" placeholder="professor@escola.com"/></div>
          <div class="form-group"><label>🔑 Senha inicial</label><input type="text" id="novoProfSenha" placeholder="Mínimo 6 caracteres"/></div>
          <button class="btn-play" id="btnCriarProf"><span>✅ Criar Conta</span><div class="btn-glow"></div></button>
          <div id="msgCriar" class="msg hidden"></div>
        </div></div>
        <div class="card" style="margin-top:1rem;"><div class="card-inner">
          <h3 style="font-family:var(--font-head);color:var(--cyan);font-size:0.85rem;letter-spacing:2px;margin-bottom:1rem;">📋 CADASTRADOS</h3>
          <div id="loadingProfs" class="loading-msg">🔄 Carregando...</div>
          <div id="listaProfessores"></div>
        </div></div>
      </div>

      <!-- DISCIPLINAS -->
      <div class="painel-section" id="asection-disciplinas">
        <div class="section-page-title">📚 Disciplinas</div>
        <div class="card"><div class="card-inner">
          <p style="color:var(--text2);font-size:0.85rem;margin-bottom:1.2rem;line-height:1.6;">Adicione ou remova disciplinas. Alterações aparecem imediatamente no site dos alunos.</p>
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
          <div id="loadingAdminDiscs" class="loading-msg" style="display:none;">🔄 Carregando...</div>
          <div style="margin-top:1.2rem;display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;" id="listaAdminDiscs"></div>
        </div></div>
      </div>

      <!-- CHAMADOS -->
      <div class="painel-section" id="asection-solicitacoes">
        <div class="section-page-title">📬 Chamados de Suporte</div>
        <div class="card"><div class="card-inner">
          <div id="loadingSol" class="loading-msg">🔄 Carregando...</div>
          <div id="listaSolicitacoes"></div>
        </div></div>
      </div>

      <!-- ANÚNCIOS -->
      <div class="painel-section" id="asection-anuncios">
        <div class="section-page-title">📢 Anúncios para Alunos</div>
        <div class="card"><div class="card-inner">
          <p style="color:var(--text2);font-size:0.85rem;margin-bottom:1.2rem;line-height:1.6;">Crie mensagens que aparecem como pop-up na tela inicial. Cada usuário vê uma vez.</p>
          <div class="form-group"><label>🔣 Ícone (emoji)</label><input type="text" id="anuncioIcone" placeholder="🚀" maxlength="4" style="text-align:center;font-size:1.3rem;"/></div>
          <div class="form-group"><label>📋 Título</label><input type="text" id="anuncioTitulo" placeholder="Ex: Nova funcionalidade disponível!"/></div>
          <div class="form-group"><label>📝 Mensagem</label><textarea id="anuncioMensagem" rows="3" placeholder="Descreva a novidade em detalhes..."></textarea></div>
          <div class="form-group"><label>🎯 Destinatário</label>
            <select id="anuncioDestino">
              <option value="alunos">👨‍🎓 Apenas Alunos</option>
              <option value="professores">👨‍🏫 Apenas Professores</option>
              <option value="todos">👥 Todos (Alunos + Professores)</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group"><label>🔗 Botão (texto, opcional)</label><input type="text" id="anuncioBtnTexto" placeholder="Ex: Conhecer agora"/></div>
            <div class="form-group"><label>🌐 Botão (link, opcional)</label><input type="text" id="anuncioBtnLink" placeholder="Ex: amigos.html"/></div>
          </div>
          <button class="btn-play" id="btnCriarAnuncio"><span>📤 Publicar Anúncio</span><div class="btn-glow"></div></button>
          <div id="msgAnuncio" class="msg hidden"></div>
          <div style="margin-top:1.25rem;" id="listaAnuncios"></div>
        </div></div>
      </div>

      <div style="text-align:center;margin-top:2rem;">
        <button id="btnSairAdmin" style="background:none;border:1px solid rgba(255,68,85,0.3);border-radius:8px;padding:0.5rem 1.5rem;color:var(--red);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;">
          🚪 Sair do painel admin
        </button>
      </div>

    </div>`;

  document.body.classList.add('tem-sidebar');

  // Navegação sidebar admin
  document.querySelectorAll('[data-asection]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-asection]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.painel-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('asection-' + btn.dataset.asection).classList.add('active');
      if (btn.dataset.asection === 'solicitacoes') carregarSolicitacoes();
      if (btn.dataset.asection === 'anuncios')     carregarAnuncios();
      if (btn.dataset.asection === 'disciplinas')  adminCarregarDisciplinas();
    };
  });

  document.getElementById('btnCriarProf').onclick    = criarProfessor;
  document.getElementById('btnAdminAddDisc').onclick = adminAdicionarDisciplina;
  document.getElementById('btnSairAdmin').onclick    = async () => {
    document.body.classList.remove('tem-sidebar');
    sessionStorage.removeItem('cognix_admin_uid');
    await signOut(auth);
    renderLogin();
  };
  document.getElementById('btnCriarAnuncio').onclick = criarAnuncio;
  carregarProfessores();
}

async function criarProfessor() {
  const nome  = document.getElementById('novoProfNome')?.value.trim();
  const email = document.getElementById('novoProfEmail')?.value.trim();
  const senha = document.getElementById('novoProfSenha')?.value;
  if (!nome||!email||!senha) { msg('msgCriar','⚠️ Preencha todos os campos!','erro'); return; }
  if (senha.length<6)        { msg('msgCriar','⚠️ Senha mínima 6 caracteres!','erro'); return; }

  try {
    msg('msgCriar','🔄 Processando...','info');

    let uid = null;

    // === PASSO 1: tenta criar conta nova no Firebase Auth ===
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      uid = cred.user.uid;
      await signOut(auth);
    } catch(authErr) {
      if (authErr.code !== 'auth/email-already-in-use') {
        // Erro inesperado (e-mail inválido, etc.)
        msg('msgCriar','❌ Erro: '+authErr.message,'erro');
        return;
      }

      // === PASSO 2: e-mail já existe — busca o UID na coleção alunos ===
      msg('msgCriar','🔄 E-mail já existe, buscando conta...','info');
      const alunosSnap = await getDocs(collection(db,'alunos'));
      alunosSnap.forEach(d => {
        if (d.data().email === email) uid = d.id;
      });

      if (!uid) {
        // Conta não encontrada em alunos (foi excluída ou nunca foi aluno).
        // Tenta obter o UID fazendo login com e-mail+senha
        try {
          const cred2 = await signInWithEmailAndPassword(auth, email, senha);
          uid = cred2.user.uid;
          await signOut(auth);
        } catch {
          // Conta Google sem senha — pede ao admin para fazer login com a conta Google
          // para confirmar o UID e vincular como professor
          msg('msgCriar',
            '⚠️ Esta conta existe no sistema (Google) mas não tem registro como aluno. ' +
            'Para cadastrá-la como professor, o dono da conta deve fazer login no painel de professor com o Google normalmente — ' +
            'ou delete a conta no Firebase Console (Authentication) e recadastre.',
            'erro');
          return;
        }
      }
    }

    // === PASSO 4: verifica se já é professor ===
    const profSnap = await getDocs(collection(db,'professores'));
    let jaEProf = false;
    profSnap.forEach(d => { if (d.data().uid === uid) jaEProf = true; });
    if (jaEProf) {
      msg('msgCriar','⚠️ Esta conta já está cadastrada como professor!','erro');
      return;
    }

    // === PASSO 5: salva na coleção professores ===
    await addDoc(collection(db,'professores'),{ uid, nome, email, criadoEm:new Date() });
    msg('msgCriar','✅ Professor cadastrado com sucesso: '+nome,'sucesso');
    document.getElementById('novoProfNome').value='';
    document.getElementById('novoProfEmail').value='';
    document.getElementById('novoProfSenha').value='';
    carregarProfessores();

  } catch(e) {
    msg('msgCriar','❌ Erro inesperado: '+e.message,'erro');
  }
}

async function verificarAnunciosProfessor() {
  try {
    const vistos = JSON.parse(localStorage.getItem('cgnx_anuncios_prof_vistos') || '[]');
    const snap   = await getDocs(collection(db,'anuncios'));
    let pendentes = [];
    snap.forEach(d => {
      const a = { id: d.id, ...d.data() };
      const destino = a.destino || 'alunos';
      if (!vistos.includes(a.id) && a.ativo !== false && (destino === 'professores' || destino === 'todos')) {
        pendentes.push(a);
      }
    });
    if (!pendentes.length) return;
    pendentes.sort((a,b) => (b.criadoEm?.toMillis?.() || 0) - (a.criadoEm?.toMillis?.() || 0));
    mostrarAnuncioProfessor(pendentes[0], vistos);
  } catch(e) {}
}

function mostrarAnuncioProfessor(anuncio, vistos) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem;backdrop-filter:blur(6px);';
  overlay.innerHTML = `
    <div style="background:var(--card);border:1px solid rgba(168,85,247,0.4);border-radius:24px;padding:2rem;max-width:420px;width:100%;text-align:center;box-shadow:0 0 40px rgba(168,85,247,0.2);position:relative;">
      <button id="btnFecharAnuncioP" style="position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;width:32px;height:32px;cursor:pointer;color:#aaa;font-size:1rem;">✕</button>
      <div style="font-size:3rem;margin-bottom:0.75rem;">${anuncio.icone || '📢'}</div>
      <div style="font-family:var(--font-head);color:var(--purple);font-size:0.75rem;letter-spacing:3px;margin-bottom:0.4rem;">NOVIDADE — PROFESSORES</div>
      <h3 style="font-family:var(--font-head);color:white;font-size:1.1rem;letter-spacing:1px;margin-bottom:0.75rem;line-height:1.3;">${anuncio.titulo}</h3>
      <p style="color:var(--text2);font-size:0.88rem;line-height:1.6;margin-bottom:1.5rem;">${anuncio.mensagem}</p>
      ${anuncio.btnTexto ? `<a href="${anuncio.btnLink||'#'}" class="btn-play" style="display:inline-block;max-width:260px;margin:0 auto 0.75rem;background:linear-gradient(135deg,var(--purple),#7c3aed);text-decoration:none;text-align:center;padding:0.8rem 1.5rem;border-radius:12px;color:white;font-family:var(--font-head);font-size:0.9rem;">${anuncio.btnTexto}</a><br>` : ''}
      <button id="btnAnuncioPEntendido" style="background:none;border:none;color:var(--text2);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;text-decoration:underline;">Entendido!</button>
    </div>`;
  document.body.appendChild(overlay);

  const fechar = async () => {
    vistos.push(anuncio.id);
    localStorage.setItem('cgnx_anuncios_prof_vistos', JSON.stringify(vistos));
    try {
      const snap2 = await getDoc(doc(db,'anuncios',anuncio.id));
      const jaViram = snap2.data()?.professoresViram || [];
      if (!jaViram.includes(nomeProfessor)) {
        await updateDoc(doc(db,'anuncios',anuncio.id), { professoresViram: [...jaViram, nomeProfessor] });
      }
    } catch(e) {}
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector('#btnFecharAnuncioP').onclick = fechar;
  overlay.querySelector('#btnAnuncioPEntendido').onclick = fechar;
}

async function criarAnuncio() {
  const icone    = document.getElementById('anuncioIcone').value.trim() || '🚀';
  const titulo   = document.getElementById('anuncioTitulo').value.trim();
  const mensagem = document.getElementById('anuncioMensagem').value.trim();
  const destino  = document.getElementById('anuncioDestino').value;
  const btnTexto = document.getElementById('anuncioBtnTexto').value.trim();
  const btnLink  = document.getElementById('anuncioBtnLink').value.trim();
  const msgEl    = document.getElementById('msgAnuncio');

  if (!titulo || !mensagem) { msgEl.textContent='⚠️ Preencha título e mensagem!'; msgEl.className='msg msg-erro'; return; }

  const btn = document.getElementById('btnCriarAnuncio');
  btn.querySelector('span').textContent = '🔄 Publicando...'; btn.disabled = true;
  try {
    await addDoc(collection(db,'anuncios'), {
      icone, titulo, mensagem, destino, btnTexto, btnLink,
      ativo: true,
      visualizacoesAlunos: 0,
      professoresViram: [],
      criadoEm: new Date(),
      dataHora: new Date().toLocaleString('pt-BR')
    });
    msgEl.textContent='✅ Anúncio publicado!'; msgEl.className='msg msg-sucesso';
    document.getElementById('anuncioIcone').value='';
    document.getElementById('anuncioTitulo').value='';
    document.getElementById('anuncioMensagem').value='';
    document.getElementById('anuncioBtnTexto').value='';
    document.getElementById('anuncioBtnLink').value='';
    carregarAnuncios();
  } catch(e) { msgEl.textContent='❌ Erro: '+e.message; msgEl.className='msg msg-erro'; }
  btn.querySelector('span').textContent='📤 Publicar Anúncio'; btn.disabled=false;
}

async function carregarAnuncios() {
  const lista = document.getElementById('listaAnuncios');
  if (!lista) return;
  lista.innerHTML = '<div class="loading-msg">🔄 Carregando...</div>';
  try {
    const snap = await getDocs(query(collection(db,'anuncios'), orderBy('criadoEm','desc'), limit(30)));
    if (snap.empty) { lista.innerHTML='<div class="no-questions">Nenhum anúncio publicado ainda.</div>'; return; }
    let anuncios = [];
    snap.forEach(d => anuncios.push({id:d.id,...d.data()}));
    anuncios.sort((a,b)=>(b.criadoEm?.toMillis?.()|| new Date(b.dataHora||0))-(a.criadoEm?.toMillis?.()||new Date(a.dataHora||0)));
    lista.innerHTML = '';

    const destinoLabel = { alunos:'👨‍🎓 Alunos', professores:'👨‍🏫 Professores', todos:'👥 Todos' };

    anuncios.forEach(a => {
      const profs = a.professoresViram || [];
      const div = document.createElement('div'); div.className='questao-item'; div.style.marginBottom='0.75rem';
      div.innerHTML=`
        <div class="questao-header">
          <div class="rank-info">
            <div class="rank-name">${a.icone||'🚀'} ${a.titulo}</div>
            <div class="rank-details">
              📅 ${a.dataHora||''} •
              ${destinoLabel[a.destino||'alunos']||'👨‍🎓 Alunos'} •
              ${a.ativo!==false?'🟢 Ativo':'🔴 Inativo'}
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <button class="btn-ativar" data-id="${a.id}" data-ativo="${a.ativo!==false}"
              style="background:rgba(0,200,255,0.1);border:1px solid rgba(0,200,255,0.3);border-radius:8px;padding:0.3rem 0.75rem;color:var(--cyan);font-family:var(--font-body);font-size:0.82rem;cursor:pointer;">
              ${a.ativo!==false?'⏸ Desativar':'▶ Ativar'}</button>
            <button class="btn-del-anuncio" data-id="${a.id}"
              style="background:rgba(255,68,85,0.08);border:1px solid rgba(255,68,85,0.3);border-radius:8px;padding:0.3rem 0.75rem;color:var(--red);font-family:var(--font-body);font-size:0.82rem;cursor:pointer;">
              🗑️</button>
          </div>
        </div>
        <p class="questao-texto" style="margin-top:0.4rem;font-size:0.83rem;">${a.mensagem}</p>
        <!-- VISUALIZAÇÕES -->
        <div style="margin-top:0.6rem;padding-top:0.6rem;border-top:1px solid var(--border);display:flex;gap:1rem;flex-wrap:wrap;">
          ${(a.destino==='alunos'||a.destino==='todos'||!a.destino)?`
          <span style="font-size:0.8rem;color:var(--text2);">
            👨‍🎓 Alunos viram: <strong style="color:var(--cyan);">${a.visualizacoesAlunos||0}</strong>
          </span>` : ''}
          ${(a.destino==='professores'||a.destino==='todos')?`
          <span style="font-size:0.8rem;color:var(--text2);">
            👨‍🏫 Professores viram: <strong style="color:var(--purple);">${profs.length}</strong>
            ${profs.length>0?`<span style="color:var(--text2);"> (${profs.join(', ')})</span>`:''}
          </span>` : ''}
        </div>`;

      div.querySelector('.btn-ativar').onclick = async function() {
        const novoStatus = this.dataset.ativo === 'true' ? false : true;
        await updateDoc(doc(db,'anuncios',this.dataset.id),{ativo:novoStatus});
        carregarAnuncios();
      };
      div.querySelector('.btn-del-anuncio').onclick = async function() {
        if (!confirm('Excluir este anúncio?')) return;
        await deleteDoc(doc(db,'anuncios',this.dataset.id));
        div.style.opacity='0'; div.style.transition='opacity 0.3s';
        setTimeout(()=>div.remove(),300);
      };
      lista.appendChild(div);
    });
  } catch(e) { lista.innerHTML='<div class="no-questions">❌ Erro: '+e.message+'</div>'; }
}

async function carregarSolicitacoes() {
  const lista   = document.getElementById('listaSolicitacoes');
  const loading = document.getElementById('loadingSol');
  if (!lista) return;
  if (loading) { loading.style.display='block'; }
  try {
    const snap = await getDocs(query(collection(db,'solicitacoes_senha'), orderBy('timestamp','desc'), limit(50)));
    let sols=[];
    snap.forEach(d => sols.push({id:d.id,...d.data()}));
    sols.sort((a,b) => new Date(b.timestamp?.toDate?.()??0) - new Date(a.timestamp?.toDate?.()??0));
    if (loading) loading.style.display='none';
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
        ${s.email ? `<div style="color:var(--cyan);font-size:0.82rem;margin-top:0.4rem;">📧 ${s.email}</div>` : ''}
        ${s.telefone ? `<div style="color:var(--cyan);font-size:0.82rem;margin-top:0.2rem;">📱 ${s.telefone}</div>` : ''}
        <p class="questao-texto" style="margin-top:0.5rem;">${s.mensagem}</p>`;
      div.querySelector('.btn-delete').onclick = async function() {
        if (!confirm('Marcar como resolvida e remover este chamado?')) return;
        const id  = this.dataset.id;
        const card = this.closest('.questao-item');
        this.textContent = '🔄';
        this.disabled = true;
        try {
          await deleteDoc(doc(db,'solicitacoes_senha',id));
          card.style.transition = 'opacity 0.4s';
          card.style.opacity = '0';
          setTimeout(() => {
            card.remove();
            // Se não restar nenhum chamado, mostra mensagem vazia
            if (!lista.querySelector('.questao-item')) {
              lista.innerHTML = '<div class="no-questions">✅ Nenhuma solicitação pendente.</div>';
            }
          }, 400);
        } catch(e) {
          alert('Erro: ' + e.message);
          this.textContent = '✅ Resolvida';
          this.disabled = false;
        }
      };
      lista.appendChild(div);
    });
  } catch(e) { if (loading) loading.style.display='none'; lista.innerHTML='<div class="no-questions">❌ Erro: '+e.message+'</div>'; }
}


// ===== GERENCIAR DISCIPLINAS (ADMIN) =====
async function adminCarregarDisciplinas() {
  const lista   = document.getElementById('listaAdminDiscs');
  const loading = document.getElementById('loadingAdminDiscs');
  if (!lista) return;
  if (loading) loading.style.display = 'block';
  lista.innerHTML = '';
  try {
    const snap = await getDocs(collection(db, 'disciplinas'));
    let discs = [];
    snap.forEach(d => discs.push({ id: d.id, ...d.data() }));
    discs.sort((a,b) => (a.ordem||99)-(b.ordem||99));
    if (loading) loading.style.display = 'none';

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
        atualizarSelectsDisciplinas();
      };
      lista.appendChild(div);
    });
  } catch(e) {
    if (loading) loading.style.display = 'none';
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

  // Lê configuração de questões personalizadas
  const usaPersonalizadas = document.getElementById('togglePersonalizadas')?.dataset.on === 'true';
  let qtdPersonalizadas = 0, qtdGerais = quantidade;

  if (usaPersonalizadas) {
    qtdPersonalizadas = parseInt(document.getElementById('qtdPersonalizadas')?.value) || 0;
    qtdGerais         = parseInt(document.getElementById('qtdGerais')?.value) || 0;
    const total = qtdPersonalizadas + qtdGerais;
    if (total < 1) { msg('msgProva','⚠️ A soma das questões deve ser pelo menos 1!','erro'); return; }
    if (qtdPersonalizadas > 0) {
      // Verifica se tem questões suficientes
      const snap = await getDocs(collection(db,'questoes_professor'));
      let disponiveis = 0;
      snap.forEach(d => { if(d.data().professorUid===professorAtual.uid) disponiveis++; });
      if (qtdPersonalizadas > disponiveis) {
        msg('msgProva',`⚠️ Você só tem ${disponiveis} questão(ões) personalizada(s). Reduza a quantidade!`,'erro');
        return;
      }
    }
  }

  const codigo=gerarCodigo();
  try {
    msg('msgProva','🔄 Criando prova...','info');
    await addDoc(collection(db,'provas'),{
      codigo,titulo,disciplina,
      dificuldade:diffLabel[dificuldade], dificuldadeKey:dificuldade,
      quantidade: usaPersonalizadas ? (qtdPersonalizadas + qtdGerais) : quantidade,
      tempoPorQuestao:tempo,
      expiracao:new Date(expiracao).toISOString(),
      professor:nomeProfessor, professorUid:professorAtual.uid,
      criadaEm:new Date(), ativa:true,
      usaPersonalizadas,
      qtdPersonalizadas: usaPersonalizadas ? qtdPersonalizadas : 0,
      qtdGerais:         usaPersonalizadas ? qtdGerais         : quantidade
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
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button class="btn-res" data-id="${p.id}" data-cod="${p.codigo}" data-tit="${p.titulo}"
              style="background:rgba(0,200,255,0.1);border:1px solid rgba(0,200,255,0.3);border-radius:8px;padding:0.3rem 0.75rem;color:var(--cyan);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;">
              📊 Resultados</button>
            <button class="btn-del-res" data-id="${p.id}" data-tit="${p.titulo}"
              style="background:rgba(255,68,85,0.08);border:1px solid rgba(255,68,85,0.3);border-radius:8px;padding:0.3rem 0.75rem;color:var(--red);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;">
              🗑️ Excluir Resultados</button>
            <button class="btn-del-prova" data-id="${p.id}" data-tit="${p.titulo}"
              style="background:rgba(255,68,85,0.15);border:1px solid rgba(255,68,85,0.5);border-radius:8px;padding:0.3rem 0.75rem;color:var(--red);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;font-weight:600;">
              ❌ Excluir Prova</button>
          </div>
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
      div.querySelector('.btn-del-res').onclick = function(){ excluirResultados(this.dataset.id, this.dataset.tit, div); };
      div.querySelector('.btn-del-prova').onclick = function(){ excluirProva(this.dataset.id, this.dataset.tit, div); };
      lista.appendChild(div);
    });
  } catch(e){ loading.style.display='none'; lista.innerHTML='<div class="no-questions">❌ '+e.message+'</div>'; }
}

async function excluirResultados(provaId, titulo, divProva) {
  if (!confirm(`Excluir todos os resultados de "${titulo}"?

Isto remove as notas de todos os alunos desta prova, permitindo que façam novamente.
A prova em si não será excluída.`)) return;

  const btnDel = divProva.querySelector('.btn-del-res');
  btnDel.textContent = '🔄 Excluindo...';
  btnDel.disabled = true;

  try {
    const snap = await getDocs(query(collection(db,'resultados_provas'), where('provaId','==',provaId)));
    const lote = [];
    snap.forEach(d => lote.push(d.id));

    if (!lote.length) {
      alert('Esta prova ainda não tem resultados para excluir.');
      btnDel.textContent = '🗑️ Excluir Resultados';
      btnDel.disabled = false;
      return;
    }

    for (const id of lote) {
      await deleteDoc(doc(db, 'resultados_provas', id));
    }

    btnDel.textContent = `✅ ${lote.length} excluído(s)`;
    setTimeout(() => {
      btnDel.textContent = '🗑️ Excluir Resultados';
      btnDel.disabled = false;
    }, 3000);
  } catch(e) {
    alert('Erro ao excluir: ' + e.message);
    btnDel.textContent = '🗑️ Excluir Resultados';
    btnDel.disabled = false;
  }
}

async function excluirProva(provaId, titulo, divProva) {
  if (!confirm(`⚠️ Excluir a prova "${titulo}"?\n\nIsso irá remover a prova e TODOS os resultados dos alunos permanentemente.\n\nEsta ação não pode ser desfeita.`)) return;

  const btnDel = divProva.querySelector('.btn-del-prova');
  btnDel.textContent = '🔄 Excluindo...';
  btnDel.disabled = true;

  try {
    // Exclui resultados associados
    const resSnap = await getDocs(query(collection(db,'resultados_provas'), where('provaId','==',provaId)));
    for (const d of resSnap.docs) await deleteDoc(doc(db,'resultados_provas',d.id));
    // Exclui a prova
    await deleteDoc(doc(db, 'provas', provaId));
    divProva.style.transition = 'opacity 0.4s';
    divProva.style.opacity = '0';
    setTimeout(() => divProva.remove(), 400);
  } catch(e) {
    alert('Erro ao excluir prova: ' + e.message);
    btnDel.textContent = '❌ Excluir Prova';
    btnDel.disabled = false;
  }
}


async function verResultados(provaId, codigo, titulo){
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:860px;width:96vw;padding:0;overflow:hidden;display:flex;flex-direction:column;max-height:90vh;">
      <div class="modal-header" style="flex-shrink:0;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);">
        <div>
          <h3 style="font-family:var(--font-head);font-size:0.95rem;letter-spacing:2px;margin:0;">📊 ${titulo}</h3>
          <span style="font-size:0.75rem;color:var(--cyan);font-family:var(--font-head);letter-spacing:2px;">${codigo}</span>
        </div>
        <button class="btn-delete" id="btnFecharModal" style="flex-shrink:0;">✕ Fechar</button>
      </div>
      <div style="display:flex;flex:1;overflow:hidden;">
        <nav style="width:155px;flex-shrink:0;border-right:1px solid var(--border);background:rgba(10,10,30,0.4);padding:1rem 0.6rem;display:flex;flex-direction:column;gap:0.25rem;">
          <button class="res-nav-btn active" data-panel="resumo" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;border-radius:8px;border:1px solid rgba(0,200,255,0.25);background:rgba(0,200,255,0.12);color:var(--cyan);font-family:var(--font-body);font-size:0.82rem;font-weight:600;cursor:pointer;text-align:left;width:100%;transition:all 0.2s;">📈 Resumo</button>
          <button class="res-nav-btn" data-panel="questoes" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;border-radius:8px;border:1px solid transparent;background:none;color:var(--text2);font-family:var(--font-body);font-size:0.82rem;font-weight:600;cursor:pointer;text-align:left;width:100%;transition:all 0.2s;">🎯 Questões</button>
          <button class="res-nav-btn" data-panel="alunos" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;border-radius:8px;border:1px solid transparent;background:none;color:var(--text2);font-family:var(--font-body);font-size:0.82rem;font-weight:600;cursor:pointer;text-align:left;width:100%;transition:all 0.2s;">👥 Alunos</button>
        </nav>
        <div style="flex:1;overflow-y:auto;padding:1.25rem;" id="modalPaineis">
          <div style="text-align:center;padding:3rem;color:var(--text2);">🔄 Carregando...</div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.querySelector('#btnFecharModal').onclick = () => modal.remove();

  modal.querySelectorAll('.res-nav-btn').forEach(btn => {
    btn.onmouseenter = () => { if (!btn.classList.contains('active')) btn.style.background = 'rgba(255,255,255,0.05)'; };
    btn.onmouseleave = () => { if (!btn.classList.contains('active')) btn.style.background = 'none'; };
  });

  try {
    const snap = await getDocs(query(collection(db,'resultados_provas'), where('provaId','==',provaId)));
    let res = []; snap.forEach(d => res.push({ id:d.id, ...d.data() }));

    if (!res.length) {
      modal.querySelector('#modalPaineis').innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text2);">Nenhum aluno realizou esta prova ainda.</div>';
      return;
    }

    res.sort((a,b) => b.nota - a.nota);

    const media         = (res.reduce((s,r) => s+r.nota, 0) / res.length).toFixed(1);
    const aprovados     = res.filter(r => r.nota >= 5).length;
    const reprovados    = res.length - aprovados;
    const notaMax       = Math.max(...res.map(r => r.nota)).toFixed(1);
    const notaMin       = Math.min(...res.map(r => r.nota)).toFixed(1);
    const taxaAprovacao = ((aprovados/res.length)*100).toFixed(0);

    const questaoMap = {};
    res.forEach(r => {
      (r.respostas||[]).forEach(resp => {
        const q = resp.questao || 'Questão sem texto';
        if (!questaoMap[q]) questaoMap[q] = { acertos:0, erros:0, total:0 };
        questaoMap[q].total++;
        if (resp.acertou) questaoMap[q].acertos++; else questaoMap[q].erros++;
      });
    });
    const questoes = Object.entries(questaoMap)
      .map(([texto,d]) => ({ texto, ...d, taxa: ((d.acertos/d.total)*100).toFixed(0) }))
      .sort((a,b) => parseFloat(a.taxa) - parseFloat(b.taxa));

    const faixas = [
      { label:'0–2', cor:'rgba(255,68,85,0.7)',  count: res.filter(r=>r.nota<2).length },
      { label:'2–4', cor:'rgba(255,140,0,0.7)',   count: res.filter(r=>r.nota>=2&&r.nota<4).length },
      { label:'4–6', cor:'rgba(255,200,0,0.7)',   count: res.filter(r=>r.nota>=4&&r.nota<6).length },
      { label:'6–8', cor:'rgba(0,200,150,0.7)',   count: res.filter(r=>r.nota>=6&&r.nota<8).length },
      { label:'8–10',cor:'rgba(0,200,255,0.7)',   count: res.filter(r=>r.nota>=8).length },
    ];
    const maxFaixa = Math.max(...faixas.map(f=>f.count), 1);

    const painelResumo = `
      <div style="font-family:var(--font-head);color:var(--cyan);font-size:0.72rem;letter-spacing:2px;margin-bottom:1rem;">VISÃO GERAL</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-bottom:0.75rem;">
        <div class="stat-card"><div class="stat-num">${res.length}</div><div class="stat-label">Alunos</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--green)">${media}</div><div class="stat-label">Média geral</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--cyan)">${taxaAprovacao}%</div><div class="stat-label">Aprovação</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;margin-bottom:1.5rem;">
        <div class="stat-card"><div class="stat-num" style="color:var(--green)">${aprovados}</div><div class="stat-label">Aprovados</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--red)">${reprovados}</div><div class="stat-label">Reprovados</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--cyan)">${notaMax}</div><div class="stat-label">Maior nota</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--red)">${notaMin}</div><div class="stat-label">Menor nota</div></div>
      </div>
      <div style="font-family:var(--font-head);color:var(--cyan);font-size:0.72rem;letter-spacing:2px;margin-bottom:0.75rem;">DISTRIBUIÇÃO DE NOTAS</div>
      <div style="display:flex;align-items:flex-end;gap:0.5rem;height:90px;padding:0 0.25rem;margin-bottom:0.4rem;">
        ${faixas.map(f=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;"><span style="font-size:0.7rem;color:var(--text2);">${f.count}</span><div style="width:100%;background:${f.cor};border-radius:4px 4px 0 0;height:${Math.max(6,(f.count/maxFaixa)*70)}px;"></div></div>`).join('')}
      </div>
      <div style="display:flex;gap:0.5rem;padding:0 0.25rem;">
        ${faixas.map(f=>`<div style="flex:1;text-align:center;font-size:0.68rem;color:var(--text2);">${f.label}</div>`).join('')}
      </div>`;

    const painelQuestoes = questoes.length === 0
      ? '<div style="text-align:center;padding:2rem;color:var(--text2);">Sem dados de questões para esta prova.</div>'
      : `<div style="font-family:var(--font-head);color:var(--cyan);font-size:0.72rem;letter-spacing:2px;margin-bottom:0.75rem;">DESEMPENHO POR QUESTÃO</div>
        ${questoes[0] ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
          <div style="background:rgba(255,68,85,0.08);border:1px solid rgba(255,68,85,0.25);border-radius:12px;padding:0.75rem;">
            <div style="font-size:0.68rem;color:var(--red);font-family:var(--font-head);letter-spacing:1px;margin-bottom:0.3rem;">❌ MAIS DIFÍCIL · ${questoes[0].taxa}%</div>
            <div style="color:var(--text);font-size:0.8rem;line-height:1.4;">${questoes[0].texto.substring(0,90)}${questoes[0].texto.length>90?'...':''}</div>
          </div>
          <div style="background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.25);border-radius:12px;padding:0.75rem;">
            <div style="font-size:0.68rem;color:var(--green);font-family:var(--font-head);letter-spacing:1px;margin-bottom:0.3rem;">✅ MAIS FÁCIL · ${questoes[questoes.length-1].taxa}%</div>
            <div style="color:var(--text);font-size:0.8rem;line-height:1.4;">${questoes[questoes.length-1].texto.substring(0,90)}${questoes[questoes.length-1].texto.length>90?'...':''}</div>
          </div>
        </div>` : ''}
        <div style="display:flex;flex-direction:column;gap:0.4rem;">
          ${questoes.map((q,i) => {
            const pct = parseFloat(q.taxa);
            const cor = pct>=70?'var(--green)':pct>=40?'rgba(255,200,0,0.8)':'var(--red)';
            return `<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:0.6rem 0.9rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
                <span style="color:var(--text2);font-size:0.72rem;font-family:var(--font-head);">Q${i+1}</span>
                <div style="display:flex;gap:0.75rem;font-size:0.75rem;">
                  <span style="color:var(--green);">✅ ${q.acertos}</span>
                  <span style="color:var(--red);">❌ ${q.erros}</span>
                  <span style="color:${cor};font-weight:600;">${q.taxa}%</span>
                </div>
              </div>
              <div style="color:var(--text);font-size:0.8rem;line-height:1.4;margin-bottom:0.35rem;">${q.texto.substring(0,110)}${q.texto.length>110?'...':''}</div>
              <div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${q.taxa}%;background:${cor};border-radius:3px;"></div></div>
            </div>`;
          }).join('')}
        </div>`;

    const painelAlunos = `
      <div style="font-family:var(--font-head);color:var(--cyan);font-size:0.72rem;letter-spacing:2px;margin-bottom:0.75rem;">RESULTADOS POR ALUNO — ${res.length} participante(s)</div>
      <div class="resultado-lista">
        ${res.map((r,i) => `
          <div class="resultado-item">
            <div class="rank-pos">${i+1}</div>
            <div class="rank-info" style="flex:1;">
              <div class="rank-name" style="display:flex;align-items:center;gap:0.5rem;">
                <a href="https://equaresma07.github.io/EduQuest/perfil.html?uid=${r.alunoUid||''}" target="_blank" style="color:var(--cyan);text-decoration:none;" title="Ver perfil">👤</a>
                <span>${r.nomeAluno}${r.nomeCompleto?' — '+r.nomeCompleto:''}</span>
              </div>
              <div class="rank-details">✅ ${r.acertos||0} acertos • ❌ ${r.erros||0} erros • ${r.dataHora||''}</div>
            </div>
            <div class="nota-badge ${parseFloat(r.nota)>=5?'nota-ok':'nota-fail'}">${r.nota}</div>
          </div>`).join('')}
      </div>`;

    const paineis = { resumo: painelResumo, questoes: painelQuestoes, alunos: painelAlunos };
    modal.querySelector('#modalPaineis').innerHTML = painelResumo;

    modal.querySelectorAll('.res-nav-btn').forEach(btn => {
      btn.onclick = () => {
        modal.querySelectorAll('.res-nav-btn').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'none'; b.style.color = 'var(--text2)'; b.style.border = '1px solid transparent';
        });
        btn.classList.add('active');
        btn.style.background = 'rgba(0,200,255,0.12)'; btn.style.color = 'var(--cyan)'; btn.style.border = '1px solid rgba(0,200,255,0.25)';
        modal.querySelector('#modalPaineis').innerHTML = paineis[btn.dataset.panel];
      };
    });

  } catch(e) {
    modal.querySelector('#modalPaineis').innerHTML = `<p style="color:var(--red);padding:1rem;">Erro: ${e.message}</p>`;
  }
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

    const snap = await getDocs(query(collection(db,'questoes'), limit(100)));
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

  ['provaDisciplina','addDisciplina','pAddDisciplina'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opcoes;
  });
  const filtEl = document.getElementById('filtDisciplina');
  if (filtEl) filtEl.innerHTML = '<option value="">Todas</option>' + opcoes;
  const filtPEl = document.getElementById('filtPDisc');
  if (filtPEl) filtPEl.innerHTML = '<option value="">Todas</option>' + opcoes;

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

// ===== BANCO GERAL — PAGINAÇÃO =====
let ultimoDocQuestao = null;   // cursor do Firebase para próxima página
let totalCarregadoQ  = 0;
const PAGE_SIZE_Q    = 20;

async function carregarQuestoes(resetar = true){
  const filtDisc = document.getElementById('filtDisciplina')?.value;
  const filtDiff = document.getElementById('filtDificuldade')?.value;
  const lista    = document.getElementById('listaQuestoes');
  const loading  = document.getElementById('loadingQuestoes');
  if (!lista || !loading) return;

  if (resetar) {
    lista.innerHTML = '';
    ultimoDocQuestao = null;
    totalCarregadoQ  = 0;
    // Remove botão "Carregar mais" anterior se existir
    document.getElementById('btnCarregarMaisQ')?.remove();
  }

  loading.style.display = 'block';

  try {
    // Monta constraints com filtros opcionais
    let constraints = [];
    if (filtDisc) constraints.push(where('disciplina', '==', filtDisc));
    if (filtDiff) constraints.push(where('dificuldade', '==', filtDiff));
    constraints.push(limit(PAGE_SIZE_Q));

    // Paginação: começa após o último documento carregado
    if (ultimoDocQuestao) {
      constraints.push(startAfter(ultimoDocQuestao));
    }

    const snap = await getDocs(query(collection(db,'questoes'), ...constraints));
    loading.style.display = 'none';

    if (snap.empty && totalCarregadoQ === 0) {
      lista.innerHTML = '<div class="no-questions">Nenhuma questão encontrada.</div>';
      return;
    }

    if (snap.empty) {
      // Não há mais questões
      document.getElementById('btnCarregarMaisQ')?.remove();
      return;
    }

    // Atualiza cursor
    ultimoDocQuestao = snap.docs[snap.docs.length - 1];

    const dN  = { informatica:'💻 Informática', matematica:'📐 Matemática', portugues:'📖 Português', ciencias:'🔬 Ciências' };
    const dfN = { facil:'🟢 Fácil', medio:'🟡 Médio', dificil:'🔴 Difícil' };

    snap.forEach((d, idx) => {
      const q = { id: d.id, ...d.data() };
      totalCarregadoQ++;
      const div = document.createElement('div'); div.className = 'questao-item';
      div.innerHTML = `
        <div class="questao-header">
          <div class="questao-badges">
            <span class="badge-disc">${dN[q.disciplina]||q.disciplina}</span>
            <span class="badge-diff">${dfN[q.dificuldade]||q.dificuldade}</span>
          </div>
          <button class="btn-delete" data-id="${q.id}">🗑️ Excluir</button>
        </div>
        <p class="questao-texto"><strong>${totalCarregadoQ - (snap.size - 1 - idx)}.</strong> ${q.p}</p>
        <div class="questao-ops">
          ${(q.ops||[]).map((op,i)=>`<div class="op-item ${i===q.c?'op-correta':''}">
            <span class="op-label">${['A','B','C','D'][i]}</span><span>${op}</span>
            ${i===q.c?'<span class="op-check">✅</span>':''}
          </div>`).join('')}
        </div>`;
      div.querySelector('.btn-delete').onclick = async function(){
        if (!confirm('Excluir esta questão?')) return;
        this.textContent = '🔄';
        await deleteDoc(doc(db,'questoes',this.dataset.id));
        this.closest('.questao-item').remove();
        totalCarregadoQ--;
        carregarStats();
      };
      lista.appendChild(div);
    });

    // Botão "Carregar mais" — só aparece se veio uma página cheia (pode ter mais)
    document.getElementById('btnCarregarMaisQ')?.remove();
    if (snap.size === PAGE_SIZE_Q) {
      const btnMais = document.createElement('button');
      btnMais.id = 'btnCarregarMaisQ';
      btnMais.style.cssText = 'width:100%;margin-top:1rem;background:rgba(0,200,255,0.08);border:1px solid rgba(0,200,255,0.25);border-radius:10px;padding:0.75rem;color:var(--cyan);font-family:var(--font-body);font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s;letter-spacing:1px;';
      btnMais.textContent = `📄 Carregar mais (exibindo ${totalCarregadoQ})`;
      btnMais.onmouseenter = () => btnMais.style.background = 'rgba(0,200,255,0.15)';
      btnMais.onmouseleave = () => btnMais.style.background = 'rgba(0,200,255,0.08)';
      btnMais.onclick = () => carregarQuestoes(false);
      lista.appendChild(btnMais);
    } else {
      // Chegou ao fim
      if (totalCarregadoQ > PAGE_SIZE_Q) {
        const fim = document.createElement('div');
        fim.style.cssText = 'text-align:center;color:var(--text2);font-size:0.82rem;margin-top:1rem;padding:0.5rem;';
        fim.textContent = `✅ Todas as ${totalCarregadoQ} questões carregadas`;
        lista.appendChild(fim);
      }
    }

  } catch(e) {
    loading.style.display = 'none';
    lista.innerHTML = '<div class="no-questions">❌ ' + e.message + '</div>';
  }
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

// ===== TOGGLE QUESTÕES PERSONALIZADAS NA PROVA =====
async function toggleQuestoesPersonalizadas() {
  const toggle = document.getElementById('togglePersonalizadas');
  const painel = document.getElementById('painelPersonalizadas');
  const isOn   = toggle.dataset.on === 'true';
  const knob   = toggle.querySelector('.toggle-knob');

  if (isOn) {
    toggle.dataset.on = 'false';
    toggle.style.background = 'rgba(255,255,255,0.1)';
    knob.style.left = '3px';
    knob.style.background = '#aaa';
    painel.style.display = 'none';
  } else {
    toggle.dataset.on = 'true';
    toggle.style.background = 'var(--purple)';
    knob.style.left = '23px';
    knob.style.background = '#fff';
    painel.style.display = 'block';
    await atualizarDisponiveisPorFiltro();
    // Listeners para atualizar o total em tempo real
    document.getElementById('qtdPersonalizadas').oninput = atualizarMsgMistura;
    document.getElementById('qtdGerais').oninput = atualizarMsgMistura;
    // Atualiza disponíveis quando disciplina/dificuldade mudar
    document.getElementById('provaDisciplina').onchange = atualizarDisponiveisPorFiltro;
    document.getElementById('provaDificuldade').onchange = atualizarDisponiveisPorFiltro;
  }
}

async function atualizarDisponiveisPorFiltro() {
  if (!professorAtual) return;
  const disc = document.getElementById('provaDisciplina')?.value;
  const diff = document.getElementById('provaDificuldade')?.value;
  const msgEl = document.getElementById('disponivelMsg');
  if (!msgEl) return;
  msgEl.textContent = '🔄 Verificando...';
  try {
    const snap = await getDocs(collection(db,'questoes_professor'));
    let total = 0;
    snap.forEach(d => {
      const q = d.data();
      if (q.professorUid === professorAtual.uid && q.disciplina === disc && q.dificuldade === diff) total++;
    });
    msgEl.textContent = `✅ ${total} questão(ões) disponível(is) para ${disc}/${diff}`;
    // Ajusta o máximo do campo
    const inp = document.getElementById('qtdPersonalizadas');
    if (inp) { inp.max = total; if(parseInt(inp.value) > total) inp.value = total; }
    atualizarMsgMistura();
  } catch(e) { msgEl.textContent = '⚠️ Erro ao verificar'; }
}

function atualizarMsgMistura() {
  const qtdP = parseInt(document.getElementById('qtdPersonalizadas')?.value) || 0;
  const qtdG = parseInt(document.getElementById('qtdGerais')?.value) || 0;
  const msgEl = document.getElementById('msgMistura');
  if (msgEl) msgEl.textContent = `Total: ${qtdP + qtdG} questão(ões) na prova`;
}

// ===== CRUD QUESTÕES PERSONALIZADAS =====
async function adicionarQuestaoPersonalizada() {
  if (!professorAtual) return;
  const pergunta   = document.getElementById('pAddPergunta')?.value.trim();
  const disciplina = document.getElementById('pAddDisciplina')?.value;
  const dificuldade= document.getElementById('pAddDificuldade')?.value;
  const ops        = [0,1,2,3].map(i => document.getElementById('pAlt'+i)?.value.trim());
  const correta    = parseInt(document.querySelector('input[name="pCorreta"]:checked')?.value);
  const msgEl      = document.getElementById('msgAddP');

  if (!pergunta || ops.some(o => !o)) {
    msgEl.textContent='⚠️ Preencha a pergunta e todas as alternativas!'; msgEl.className='msg msg-erro'; return;
  }
  try {
    msgEl.textContent='🔄 Salvando...'; msgEl.className='msg msg-info';
    await addDoc(collection(db,'questoes_professor'), {
      p: pergunta, ops, c: correta, disciplina, dificuldade,
      professorUid: professorAtual.uid,
      criadaEm: new Date()
    });
    msgEl.textContent='✅ Questão personalizada salva!'; msgEl.className='msg msg-sucesso';
    document.getElementById('pAddPergunta').value = '';
    [0,1,2,3].forEach(i => { const el = document.getElementById('pAlt'+i); if(el) el.value=''; });
    document.getElementById('pr0').checked = true;
    carregarQuestoesPersonalizadas();
    // Atualiza contador se o painel de prova estiver aberto
    if (document.getElementById('togglePersonalizadas')?.dataset.on === 'true') {
      await atualizarDisponiveisPorFiltro();
    }
  } catch(e) { msgEl.textContent='❌ Erro: '+e.message; msgEl.className='msg msg-erro'; }
}

// ===== QUESTÕES PERSONALIZADAS — PAGINAÇÃO =====
let ultimoDocQuestaoP = null;
let totalCarregadoQP  = 0;

async function carregarQuestoesPersonalizadas(resetar = true) {
  if (!professorAtual) return;
  const filtDisc = document.getElementById('filtPDisc')?.value;
  const filtDiff = document.getElementById('filtPDiff')?.value;
  const lista    = document.getElementById('listaQuestoesP');
  const loading  = document.getElementById('loadingQuestoesP');
  if (!lista || !loading) return;

  if (resetar) {
    lista.innerHTML = '';
    ultimoDocQuestaoP = null;
    totalCarregadoQP  = 0;
    document.getElementById('btnCarregarMaisQP')?.remove();
  }

  loading.style.display = 'block';

  try {
    let constraints = [where('professorUid','==',professorAtual.uid)];
    if (filtDisc) constraints.push(where('disciplina','==',filtDisc));
    if (filtDiff) constraints.push(where('dificuldade','==',filtDiff));
    constraints.push(limit(PAGE_SIZE_Q));
    if (ultimoDocQuestaoP) constraints.push(startAfter(ultimoDocQuestaoP));

    const snap = await getDocs(query(collection(db,'questoes_professor'), ...constraints));
    loading.style.display = 'none';

    if (snap.empty && totalCarregadoQP === 0) {
      lista.innerHTML = '<div class="no-questions">Você ainda não tem questões personalizadas. Crie a primeira acima! 🎨</div>';
      return;
    }
    if (snap.empty) { document.getElementById('btnCarregarMaisQP')?.remove(); return; }

    ultimoDocQuestaoP = snap.docs[snap.docs.length - 1];

    const dN  = { informatica:'💻 Informática', matematica:'📐 Matemática', portugues:'📖 Português', ciencias:'🔬 Ciências' };
    const dfN = { facil:'🟢 Fácil', medio:'🟡 Médio', dificil:'🔴 Difícil' };
    const labels = ['A','B','C','D'];

    snap.forEach((d, idx) => {
      const q = { id: d.id, ...d.data() };
      totalCarregadoQP++;
      const div = document.createElement('div'); div.className = 'questao-item';
      div.innerHTML = `
        <div class="questao-header">
          <div class="questao-badges">
            <span class="badge-disc" style="background:rgba(168,85,247,0.15);border-color:rgba(168,85,247,0.3);color:var(--purple);">${dN[q.disciplina]||q.disciplina}</span>
            <span class="badge-diff">${dfN[q.dificuldade]||q.dificuldade}</span>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn-edit-p" data-id="${q.id}"
              style="background:rgba(0,200,255,0.1);border:1px solid rgba(0,200,255,0.3);border-radius:8px;padding:0.3rem 0.75rem;color:var(--cyan);font-family:var(--font-body);font-size:0.85rem;cursor:pointer;">
              ✏️ Editar</button>
            <button class="btn-del-p btn-delete" data-id="${q.id}">🗑️ Excluir</button>
          </div>
        </div>
        <p class="questao-texto"><strong>${totalCarregadoQP}.</strong> ${q.p}</p>
        <div class="questao-ops">
          ${(q.ops||[]).map((op,i)=>`<div class="op-item ${i===q.c?'op-correta':''}">
            <span class="op-label">${labels[i]}</span><span>${op}</span>
            ${i===q.c?'<span class="op-check">✅</span>':''}
          </div>`).join('')}
        </div>`;

      div.querySelector('.btn-del-p').onclick = async function() {
        if (!confirm('Excluir esta questão personalizada?')) return;
        this.textContent = '🔄';
        await deleteDoc(doc(db,'questoes_professor',this.dataset.id));
        div.remove();
        totalCarregadoQP--;
        if (document.getElementById('togglePersonalizadas')?.dataset.on === 'true') {
          await atualizarDisponiveisPorFiltro();
        }
      };
      div.querySelector('.btn-edit-p').onclick = () => abrirModalEditarQuestaoP(q);
      lista.appendChild(div);
    });

    document.getElementById('btnCarregarMaisQP')?.remove();
    if (snap.size === PAGE_SIZE_Q) {
      const btnMais = document.createElement('button');
      btnMais.id = 'btnCarregarMaisQP';
      btnMais.style.cssText = 'width:100%;margin-top:1rem;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.25);border-radius:10px;padding:0.75rem;color:var(--purple);font-family:var(--font-body);font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s;letter-spacing:1px;';
      btnMais.textContent = `📄 Carregar mais (exibindo ${totalCarregadoQP})`;
      btnMais.onmouseenter = () => btnMais.style.background = 'rgba(168,85,247,0.15)';
      btnMais.onmouseleave = () => btnMais.style.background = 'rgba(168,85,247,0.08)';
      btnMais.onclick = () => carregarQuestoesPersonalizadas(false);
      lista.appendChild(btnMais);
    } else if (totalCarregadoQP > PAGE_SIZE_Q) {
      const fim = document.createElement('div');
      fim.style.cssText = 'text-align:center;color:var(--text2);font-size:0.82rem;margin-top:1rem;';
      fim.textContent = `✅ Todas as ${totalCarregadoQP} questões carregadas`;
      lista.appendChild(fim);
    }

  } catch(e) {
    loading.style.display = 'none';
    lista.innerHTML = '<div class="no-questions">❌ ' + e.message + '</div>';
  }
}

function abrirModalEditarQuestaoP(q) {
  const modal = document.createElement('div'); modal.className='modal-overlay';
  const labels = ['A','B','C','D'];
  modal.innerHTML = `
    <div class="modal-box" style="max-width:560px;max-height:90vh;overflow-y:auto;">
      <div class="modal-header">
        <h3>✏️ Editar Questão Personalizada</h3>
        <button class="btn-delete" id="btnFecharEditP">✕ Fechar</button>
      </div>
      <div style="padding:0 0.5rem;">
        <div class="form-row">
          <div class="form-group"><label>📚 Disciplina</label>
            <select id="editPDisc">
              ${DISCIPLINAS_PADRAO.map(d=>`<option value="${d.id}" ${d.id===q.disciplina?'selected':''}>${d.emoji} ${d.nome}</option>`).join('')}
            </select></div>
          <div class="form-group"><label>⚡ Dificuldade</label>
            <select id="editPDiff">
              <option value="facil" ${q.dificuldade==='facil'?'selected':''}>🟢 Fácil</option>
              <option value="medio" ${q.dificuldade==='medio'?'selected':''}>🟡 Médio</option>
              <option value="dificil" ${q.dificuldade==='dificil'?'selected':''}>🔴 Difícil</option>
            </select></div>
        </div>
        <div class="form-group"><label>❓ Pergunta</label>
          <textarea id="editPPergunta" rows="3">${q.p}</textarea></div>
        <div class="form-group"><label>✅ Alternativas</label>
          <div class="alternativas-grid">
            ${[0,1,2,3].map(i=>`
              <div class="alt-item">
                <input type="radio" name="editPCorreta" value="${i}" id="epr${i}" ${i===q.c?'checked':''}/>
                <label for="epr${i}" class="alt-label">${labels[i]}</label>
                <input type="text" id="editPAlt${i}" value="${q.ops[i]||''}" class="alt-input"/>
              </div>`).join('')}
          </div></div>
        <button class="btn-play" id="btnSalvarEditP"><span>💾 Salvar Alterações</span><div class="btn-glow"></div></button>
        <div id="msgEditP" class="msg hidden" style="margin-top:0.75rem;"></div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#btnFecharEditP').onclick = () => modal.remove();
  modal.querySelector('#btnSalvarEditP').onclick = async function() {
    const pergunta   = document.getElementById('editPPergunta').value.trim();
    const disciplina = document.getElementById('editPDisc').value;
    const dificuldade= document.getElementById('editPDiff').value;
    const ops        = [0,1,2,3].map(i => document.getElementById('editPAlt'+i).value.trim());
    const correta    = parseInt(document.querySelector('input[name="editPCorreta"]:checked')?.value);
    const msgEl      = document.getElementById('msgEditP');
    if (!pergunta || ops.some(o=>!o)) { msgEl.textContent='⚠️ Preencha todos os campos!'; msgEl.className='msg msg-erro'; return; }
    try {
      msgEl.textContent='🔄 Salvando...'; msgEl.className='msg msg-info';
      await setDoc(doc(db,'questoes_professor',q.id), {
        p:pergunta, ops, c:correta, disciplina, dificuldade,
        professorUid: professorAtual.uid, criadaEm: q.criadaEm || new Date()
      });
      msgEl.textContent='✅ Questão atualizada!'; msgEl.className='msg msg-sucesso';
      setTimeout(() => { modal.remove(); carregarQuestoesPersonalizadas(); }, 1000);
    } catch(e) { msgEl.textContent='❌ Erro: '+e.message; msgEl.className='msg msg-erro'; }
  };
}

// ===== IMPORTAR CSV PERSONALIZADO =====
async function importarCSVPersonalizado(event) {
  const file = event.target.files[0];
  if (!file) return;
  const msgEl = document.getElementById('msgAddP');
  msgEl.textContent = '🔄 Lendo arquivo...'; msgEl.className = 'msg msg-info';

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const text   = e.target.result;
      const linhas = text.split('\n').filter(l => l.trim());
      if (linhas.length < 2) { msgEl.textContent='❌ Arquivo vazio!'; msgEl.className='msg msg-erro'; return; }

      let importadas = 0, erros = 0;
      const discMap = {
        'informática':'informatica','informatica':'informatica',
        'matemática':'matematica','matematica':'matematica',
        'português':'portugues','portugues':'portugues',
        'ciências':'ciencias','ciencias':'ciencias',
        'geografia':'geografia','biologia':'biologia',
        'educação física':'educacaofisica','educacaofisica':'educacaofisica',
        'química':'quimica','quimica':'quimica',
        'física':'fisica','fisica':'fisica',
        'história':'historia','historia':'historia','artes':'artes'
      };
      const diffMap = { 'fácil':'facil','facil':'facil','médio':'medio','medio':'medio','difícil':'dificil','dificil':'dificil' };

      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];
        if (!linha.trim()) continue;
        const cols = linha.split(';').map(c => c.replace(/^\"|\"$/g,'').replace(/\"\"/g,'"').trim());
        if (cols.length < 9) { erros++; continue; }
        const [num, discNome, diffNome, pergunta, opA, opB, opC, opD, correta] = cols;
        if (!pergunta||!opA||!opB||!opC||!opD||!correta) { erros++; continue; }
        const discId  = discMap[discNome.toLowerCase()] || discNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
        const diffId  = diffMap[diffNome.toLowerCase()] || 'facil';
        const corrIdx = {'A':0,'B':1,'C':2,'D':3}[correta.toUpperCase()];
        if (corrIdx === undefined) { erros++; continue; }
        try {
          await addDoc(collection(db,'questoes_professor'), {
            p:pergunta, ops:[opA,opB,opC,opD], c:corrIdx,
            disciplina:discId, dificuldade:diffId,
            professorUid: professorAtual.uid, criadaEm: new Date()
          });
          importadas++;
          if (importadas % 10 === 0) msgEl.textContent = `🔄 Importando... ${importadas} questões salvas`;
        } catch(e2) { erros++; }
      }

      msgEl.textContent = `✅ ${importadas} questões personalizadas importadas! ${erros>0?'('+erros+' com erro)':''}`;
      msgEl.className = 'msg msg-sucesso';
      document.getElementById('inputCSVP').value = '';
      carregarQuestoesPersonalizadas();
      if (document.getElementById('togglePersonalizadas')?.dataset.on === 'true') {
        await atualizarDisponiveisPorFiltro();
      }
    } catch(e) { msgEl.textContent='❌ Erro: '+e.message; msgEl.className='msg msg-erro'; }
  };
  reader.readAsText(file, 'UTF-8');
}

// ===== EXPORTAR CSV PERSONALIZADO =====
async function exportarExcelPersonalizado() {
  if (!professorAtual) return;
  const btn = document.getElementById('btnExportarP');
  btn.textContent = '⏳ Exportando...'; btn.disabled = true;
  try {
    const filtDisc = document.getElementById('filtPDisc')?.value;
    const filtDiff = document.getElementById('filtPDiff')?.value;
    const snap = await getDocs(collection(db,'questoes_professor'));
    let qs = [];
    snap.forEach(d => { const q = d.data(); if (q.professorUid === professorAtual.uid) qs.push({ id:d.id, ...q }); });
    if (filtDisc) qs = qs.filter(q => q.disciplina === filtDisc);
    if (filtDiff) qs = qs.filter(q => q.dificuldade === filtDiff);
    if (!qs.length) { alert('Nenhuma questão para exportar!'); btn.textContent='📥 Exportar CSV'; btn.disabled=false; return; }

    const dN  = { informatica:'Informática', matematica:'Matemática', portugues:'Português', ciencias:'Ciências' };
    const dfN = { facil:'Fácil', medio:'Médio', dificil:'Difícil' };
    const labels = ['A','B','C','D'];
    const linhas = [['Nº','Disciplina','Dificuldade','Pergunta','A','B','C','D','Correta'].join(';')];
    qs.forEach((q,i) => {
      linhas.push([
        i+1, dN[q.disciplina]||q.disciplina, dfN[q.dificuldade]||q.dificuldade,
        '"'+(q.p||'').replace(/"/g,'""')+'"',
        '"'+(q.ops?.[0]||'').replace(/"/g,'""')+'"',
        '"'+(q.ops?.[1]||'').replace(/"/g,'""')+'"',
        '"'+(q.ops?.[2]||'').replace(/"/g,'""')+'"',
        '"'+(q.ops?.[3]||'').replace(/"/g,'""')+'"',
        labels[q.c]||''
      ].join(';'));
    });

    const csv  = '\uFEFF' + linhas.join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'MinhasQuestoes_EduQuest.csv'; link.click();
    URL.revokeObjectURL(url);
    btn.textContent = '✅ Exportado!';
    setTimeout(() => { btn.textContent='📥 Exportar CSV'; btn.disabled=false; }, 2000);
  } catch(e) { alert('Erro: '+e.message); btn.textContent='📥 Exportar CSV'; btn.disabled=false; }
}
