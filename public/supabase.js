import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Simulação de Supabase Client e persistência local
// TODO: [CHAVES] VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

const DB_KEY = 'mvp_db_v1';
const SESSION_KEY = 'mvp_session_v1';
const PENDING_ONBOARD_KEY = 'mvp_pending_onboard_v1';
const ACTIVE_CHILD_KEY = 'mvp_active_child_v1';

// Configuração Supabase real (auth) - Projeto Raízes Educacional
const SUPABASE_URL = 'https://vjeizqpzzfgdxbhetfdc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZWl6cXB6emZnZHhiaGV0ZmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzIwMTYsImV4cCI6MjA3NDIwODAxNn0.dYhRjGVZscO2npH35Zbe5_ZrMMAKeFuqmu2w4hLbrkE';
const REAL_AUTH = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
const client = REAL_AUTH ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function getDB(){
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  const init = { profiles: [], children: [], games: defaultGames(), game_sessions: [], game_events: [] };
  localStorage.setItem(DB_KEY, JSON.stringify(init));
  return init;
}
function setDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

const normalizeIdValue = (value)=>{
  if (value === undefined || value === null || value === '') return value;
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

const sameId = (a, b)=>{
  if (a === undefined || a === null || a === '') return a === b;
  if (b === undefined || b === null || b === '') return a === b;
  return String(a) === String(b);
};

const buildMetricsFromEvents = (events = [])=>{
  if (!Array.isArray(events) || !events.length){
    return {
      totalEvents: 0,
      totalCorrect: 0,
      totalErrors: 0,
      totalAttempts: 0,
      accuracy: 0,
      avgReactionMs: 0,
      avgLevel: 0,
    };
  }
  let total = 0;
  let hits = 0;
  let errors = 0;
  let reactionSum = 0;
  let levelSum = 0;
  let attemptsSum = 0;

  events.forEach(event=>{
    const payload = event?.payload || {};
    if (typeof payload.correct === 'boolean'){
      total++;
      if (payload.correct){
        hits++;
      } else {
        errors++;
      }
    }
    if (typeof payload.reactionTimeMs === 'number') reactionSum += payload.reactionTimeMs;
    if (typeof payload.level === 'number') levelSum += payload.level;
    if (typeof payload.attempts === 'number') attemptsSum += payload.attempts;
  });

  return {
    totalEvents: total,
    totalCorrect: hits,
    totalErrors: errors,
    totalAttempts: attemptsSum,
    accuracy: total ? hits / total : 0,
    avgReactionMs: total ? reactionSum / total : 0,
    avgLevel: total ? levelSum / total : 0,
  };
};

const normalizeAttemptTimeline = (events = [])=>{
  if (!Array.isArray(events) || !events.length) return [];
  const toTs = (value)=>{
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  };
  const sorted = [...events].sort((a, b)=>{
    const tsA = toTs(a?.ts);
    const tsB = toTs(b?.ts);
    return (tsA ?? 0) - (tsB ?? 0);
  });
  const timeline = [];
  let cumulativeHits = 0;
  let cumulativeTotal = 0;

  sorted.forEach(event=>{
    const payload = event?.payload || {};
    if (typeof payload.correct !== 'boolean') return;
    cumulativeTotal++;
    if (payload.correct) cumulativeHits++;
    timeline.push({
      order: timeline.length + 1,
      ts: toTs(event?.ts),
      sessionId: event?.session_id ?? null,
      correct: payload.correct,
      accuracy: cumulativeTotal ? cumulativeHits / cumulativeTotal : 0,
      reactionTimeMs: typeof payload.reactionTimeMs === 'number' ? payload.reactionTimeMs : null,
      level: typeof payload.level === 'number' ? payload.level : null,
      attempts: typeof payload.attempts === 'number' ? payload.attempts : null,
      cumulativeHits,
      cumulativeTotal,
    });
  });

  return timeline;
};

function defaultGames(){
  return [
    { id: 'onde-esta-o-brinquedo', title: 'Onde está o brinquedo!', enabled: true, description:'Memória visual com grid adaptativo.' },
    { id: 'em-breve-2', title: 'Jogo #2', enabled: false, description:'Em breve' },
    { id: 'em-breve-3', title: 'Jogo #3', enabled: false, description:'Em breve' },
    { id: 'em-breve-4', title: 'Jogo #4', enabled: false, description:'Em breve' },
  ];
}

export const supabase = {
  getClient(){
    return client;
  },
  async getGameProgressBySession({ childId, gameId }){
    const sessions = await this.getGameSessions({ childId, gameId });
    if (!sessions.length) return [];
    const sessionIds = sessions.map(s=>s.id);

    const compute = (events)=>{
      const grouped = {};
      events.forEach(event=>{
        const sid = event.session_id;
        if (!grouped[sid]) grouped[sid] = [];
        grouped[sid].push(event);
      });
      return sessions
        .map(sess=>({ ...sess, events: grouped[sess.id] || [] }))
        .map((sess, idx)=>{
          const metrics = buildMetricsFromEvents(sess.events);
          return {
            order: idx + 1,
            sessionId: sess.id,
            startedAt: sess.started_at,
            ...metrics,
          };
        });
    };

    if (client){
      try{
        const { data: evts, error } = await client
          .from('game_events')
          .select('session_id, ts, payload')
          .in('session_id', sessionIds)
          .order('ts', { ascending: true });
        if (error) throw error;
        return compute(evts || []);
      }catch(err){ /* fallback */ }
    }

    const db = getDB();
    const events = db.game_events
      .filter(e => sessionIds.includes(e.session_id))
      .map(e=>({ ...e }));
    events.sort((a,b)=> (a.ts||0) - (b.ts||0));
    return compute(events);
  },
  async getGameProgressByAttempt({ childId, gameId }){
    const sessions = await this.getGameSessions({ childId, gameId });
    if (!sessions.length) return [];
    const sessionIds = sessions.map(s=>s.id);

    if (client){
      try{
        const { data: evts, error } = await client
          .from('game_events')
          .select('session_id, ts, payload')
          .in('session_id', sessionIds)
          .order('ts', { ascending: true });
        if (error) throw error;
        return normalizeAttemptTimeline(evts || []);
      }catch(err){ /* fallback */ }
    }

    const db = getDB();
    const events = db.game_events
      .filter(e => sessionIds.includes(e.session_id))
      .map(e=>({ ...e }));
    events.sort((a,b)=> (a.ts||0) - (b.ts||0));
    return normalizeAttemptTimeline(events);
  },
  init(){
    if (!client) return;
    client.auth.getSession().then(({ data })=>{
      const s = data?.session;
      if (s){
        const session = { user: { id: s.user.id, email: s.user.email, name: s.user.user_metadata?.name || s.user.email } };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        // tenta processar onboarding pendente
        this.tryProcessPendingOnboarding();
      }
    });
    client.auth.onAuthStateChange((_event, s)=>{
      if (s){
        const session = { user: { id: s.user.id, email: s.user.email, name: s.user.user_metadata?.name || s.user.email } };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        this.tryProcessPendingOnboarding();
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    });
  },
  getCurrentUser(){
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async emailExists(email){
    if (!email) return false;
    if (client){
      try{
        const { data, error } = await client
          .from('usuarios')
          .select('id_usuario')
          .eq('email', email)
          .limit(1);
        if (error) throw error;
        if (Array.isArray(data) && data.length) return true;
      }catch(err){
        console.warn('emailExists usuarios fallback', err);
      }
    }
    const db = getDB();
    return db.profiles.some(p=>p.email===email);
  },
  async getUserBundle(){
    const session = this.getCurrentUser();
    if (!session) return { usuario:null, criancas:[] };

    const fallback = ()=>{
      const db = getDB();
      const profile = db.profiles.find(p=>p.id === session.user.id) || null;
      const criancas = db.children
        .filter(c=>c.profile_id === session.user.id)
        .map(c=>({
          ...c,
          id: c.id,
          name: c.nome_completo || c.name || c.nome || 'Criança'
        }));
      const usuario = profile ? {
        id: profile.id,
        nome_completo: profile.name,
        email: profile.email
      } : null;
      return { usuario, criancas };
    };

    if (client){
      try{
        const authId = session.user.id;
        const { data: usuarioData, error: usuarioError } = await client
          .from('usuarios')
          .select('id_usuario, uuid, nome_completo, data_nascimento, parentesco, escolaridade, profissao, email, celular, cidade_estado')
          .eq('uuid', authId)
          .maybeSingle();
        if (usuarioError && usuarioError.code !== 'PGRST116') throw usuarioError;

        const usuario = usuarioData ? {
          id: usuarioData.id_usuario,
          ...usuarioData
        } : null;

        let criancas = [];
        if (usuario?.id){
          const { data: criData, error: criError } = await client
            .from('criancas')
            .select('id_crianca, nome_completo, data_nascimento, sexo, estuda, tipo_escola, terapia, tipos_terapia, outras_terapias')
            .eq('id_responsavel', usuario.id);
          if (criError) throw criError;
          criancas = (criData||[]).map(c=>({
            ...c,
            id: c.id_crianca,
            name: c.nome_completo || 'Criança',
            birthdate: c.data_nascimento
          }));
        }

        return { usuario, criancas };
      }catch(err){
        console.error('Erro ao buscar dados do usuário no Supabase', err);
        return fallback();
      }
    }

    return fallback();
  },
  ensureActiveChild(childId){
    const normalized = normalizeIdValue(childId);
    if (normalized === undefined || normalized === null || normalized === ''){
      localStorage.setItem(ACTIVE_CHILD_KEY, '');
      return null;
    }
    localStorage.setItem(ACTIVE_CHILD_KEY, String(normalized));
    return String(normalized);
  },
  async signOut(){
    if (client) await client.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  },
  async login({email, password}){
    if (client){
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const s = data.session;
      const session = { user: { id: s.user.id, email: s.user.email, name: s.user.user_metadata?.name || s.user.email } };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      // pós-login processa pending
      await this.tryProcessPendingOnboarding();
      return session;
    }
    const db = getDB();
    const profile = db.profiles.find(p=>p.email===email && p.password===password);
    if (!profile) throw new Error('Credenciais inválidas');
    const session = { user: { id: profile.id, email: profile.email, name: profile.name } };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
  async upsertUsuario(usuario){
    // usuario: { uuid?, nome_completo, data_nascimento, parentesco, escolaridade, profissao, email, celular, cidade_estado }
    if (client){
      const authUser = (await client.auth.getUser()).data.user;
      if (!authUser) throw new Error('É necessário estar autenticado.');
      const payload = { ...usuario, uuid: authUser.id };
      // 42P10 ocorre porque 'uuid' não é UNIQUE. Fazemos upsert manual por uuid.
      const { data: found, error: selErr } = await client
        .from('usuarios')
        .select('id_usuario')
        .eq('uuid', authUser.id)
        .limit(1);
      if (selErr) throw selErr;
      if (Array.isArray(found) && found.length){
        const id = found[0].id_usuario;
        const { error: updErr } = await client
          .from('usuarios')
          .update(payload)
          .eq('id_usuario', id);
        if (updErr) throw updErr;
        return id;
      } else {
        const { data: ins, error: insErr } = await client
          .from('usuarios')
          .insert(payload)
          .select('id_usuario')
          .single();
        if (insErr) throw insErr;
        return ins.id_usuario;
      }
    }
    // Stub local
    const db = getDB();
    let existing = db.profiles.find(p=>p.email===usuario.email);
    if (!existing){
      const id = 'prof_'+Math.random().toString(36).slice(2,9);
      existing = { id, name: usuario.nome_completo, email: usuario.email };
      db.profiles.push(existing);
      setDB(db);
    }
    return existing.id; // usa id de profile como id_usuario fake
  },
  async insertCrianca({ id_responsavel, crianca }){
    // crianca: mapeia para tabela real quando possível
    if (client){
      const payload = { ...crianca, id_responsavel };
      const { data, error } = await client.from('criancas').insert(payload).select('id_crianca').single();
      if (error) throw error;
      return data.id_crianca;
    }
    // Stub local
    const db = getDB();
    const id = 'child_'+Math.random().toString(36).slice(2,9);
    db.children.push({ id, profile_id: id_responsavel, ...crianca });
    setDB(db);
    return id;
  },
  setPendingOnboarding(data){
    localStorage.setItem(PENDING_ONBOARD_KEY, JSON.stringify(data));
  },
  async tryProcessPendingOnboarding(){
    const raw = localStorage.getItem(PENDING_ONBOARD_KEY);
    if (!raw) return false;
    if (!client) return false;
    const auth = (await client.auth.getUser()).data.user;
    if (!auth) return false;
    try{
      const { usuario, crianca } = JSON.parse(raw);
      const idUsuario = await this.upsertUsuario(usuario);
      await this.insertCrianca({ id_responsavel: idUsuario, crianca });
      localStorage.removeItem(PENDING_ONBOARD_KEY);
      return true;
    }catch(e){
      // mantém pendente
      return false;
    }
  },
  async registerAndSaveProfile({name, email, password}){
    if (client){
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      const s = data.session;
      if (s){
        const session = { user: { id: s.user.id, email: s.user.email, name: s.user.user_metadata?.name || name || s.user.email } };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
      }
      // Sem sessão imediata (e-mail conf.)
      return { user: { id: data.user.id, email: data.user.email, name: name || data.user.email } };
    }
    const db = getDB();
    if (db.profiles.some(p=>p.email===email)) throw new Error('E-mail já cadastrado');
    const id = 'prof_'+Math.random().toString(36).slice(2,9);
    db.profiles.push({ id, name, email, password });
    setDB(db);
    const session = { user: { id, email, name } };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
  async saveChild({profileId, child}){
    const db = getDB();
    const id = 'child_'+Math.random().toString(36).slice(2,9);
    db.children.push({ id, profile_id: profileId, ...child });
    setDB(db);
    return { id };
  },
  async listChildren(){
    const session = this.getCurrentUser();
    if (!session) return [];

    const { criancas } = await this.getUserBundle();
    if (Array.isArray(criancas) && criancas.length) return criancas.map(c=>({
      ...c,
      id: c.id ?? c.id_crianca ?? c.uuid ?? c.id,
      name: c.name || c.nome_completo || 'Criança',
    }));

    const db = getDB();
    return db.children
      .filter(c=>c.profile_id === session.user.id)
      .map(c=>({
        ...c,
        id: c.id,
        name: c.nome_completo || c.name || c.nome || 'Criança'
      }));
  },
  setActiveChild(childId){
    this.ensureActiveChild(childId);
  },
  getActiveChild(){
    const raw = localStorage.getItem(ACTIVE_CHILD_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  },
  async listGames(){
    return getDB().games;
  },
  async startSession({gameId, childId}){
    // Try Supabase real
    if (client){
      try{
        const started_at = new Date().toISOString();
        const { data, error } = await client.from('game_sessions').insert({ game_id: gameId, child_id: childId || null, started_at }).select('id, started_at').single();
        if (error) throw error;
        return { id: data.id, started_at: new Date(data.started_at).getTime?.() || Date.now() };
      }catch(e){ /* fallback to local */ }
    }
    const db = getDB();
    const id = 'sess_'+Math.random().toString(36).slice(2,9);
    const started_at = Date.now();
    db.game_sessions.push({ id, game_id: gameId, child_id: childId || null, started_at, ended_at: null });
    setDB(db);
    return { id, started_at };
  },
  async getGameProgressBySession({ childId, gameId }){
    const sessions = await this.getGameSessions({ childId, gameId });
    if (!sessions.length) return [];
    const sessionIds = sessions.map(s=>s.id);

    const compute = (events)=>{
      const grouped = {};
      events.forEach(event=>{
        const sid = event.session_id;
        if (!grouped[sid]){
          grouped[sid] = [];
        }
        grouped[sid].push(event);
      });
      const orderedSessions = sessions
        .map(sess=>({ ...sess, events: grouped[sess.id] || [] }))
        .map((sess, idx)=>{
          const metrics = buildMetricsFromEvents(sess.events);
          return {
            order: idx + 1,
            sessionId: sess.id,
            startedAt: sess.started_at,
            ...metrics,
          };
        });
      return orderedSessions;
    };

    if (client){
      try{
        const { data: evts, error } = await client
          .from('game_events')
          .select('session_id, ts, payload')
          .in('session_id', sessionIds)
          .order('ts', { ascending: true });
        if (error) throw error;
        return compute(evts || []);
      }catch(err){ /* fallback */ }
    }

    const db = getDB();
    const events = db.game_events
      .filter(e => sessionIds.includes(e.session_id))
      .map(e=>({ ...e }));
    events.sort((a,b)=> (a.ts||0) - (b.ts||0));
    return compute(events);
  },
  async getGameSessions({ childId, gameId }){
    const normalizedChild = normalizeIdValue(childId);

    if (client){
      try{
        const query = client
          .from('game_sessions')
          .select('id, child_id, game_id, started_at')
          .eq('game_id', gameId)
          .order('started_at', { ascending: true });
        const { data, error } = normalizedChild ? await query.eq('child_id', normalizedChild) : await query;
        if (error) throw error;
        return (data || []).map(row => ({
          ...row,
          started_at: row.started_at ? new Date(row.started_at).getTime?.() || Date.parse(row.started_at) || Date.now() : Date.now(),
        }));
      }catch(err){ /* fallback */ }
    }

    const db = getDB();
    return db.game_sessions
      .filter(sess=> (
        sess.game_id === gameId &&
        (normalizedChild ? sameId(sess.child_id, normalizedChild) : true)
      ))
      .map(sess=>({ ...sess }));
  },
  init(){
    if (!client) return;
    client.auth.getSession().then(({ data })=>{
      const s = data?.session;
      if (s){
        const session = { user: { id: s.user.id, email: s.user.email, name: s.user.user_metadata?.name || s.user.email } };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        // tenta processar onboarding pendente
        this.tryProcessPendingOnboarding();
      }
    });
    client.auth.onAuthStateChange((_event, s)=>{
      if (s){
        const session = { user: { id: s.user.id, email: s.user.email, name: s.user.user_metadata?.name || s.user.email } };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        this.tryProcessPendingOnboarding();
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    });
  },
  getCurrentUser(){
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async emailExists(email){
    if (!email) return false;
    if (client){
      try{
        const { data, error } = await client
          .from('usuarios')
          .select('id_usuario')
          .eq('email', email)
          .limit(1);
        if (error) throw error;
        if (Array.isArray(data) && data.length) return true;
      }catch(err){
        console.warn('emailExists usuarios fallback', err);
      }
    }
    const db = getDB();
    return db.profiles.some(p=>p.email===email);
  },
  ensureActiveChild(childId){
    const normalized = normalizeIdValue(childId);
    if (normalized === undefined || normalized === null || normalized === ''){
      localStorage.setItem(ACTIVE_CHILD_KEY, '');
      return null;
    }
    localStorage.setItem(ACTIVE_CHILD_KEY, String(normalized));
    return String(normalized);
  },
  async signOut(){
    if (client) await client.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  },
  async login({email, password}){
    if (client){
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const s = data.session;
      const session = { user: { id: s.user.id, email: s.user.email, name: s.user.user_metadata?.name || s.user.email } };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      // pós-login processa pending
      await this.tryProcessPendingOnboarding();
      return session;
    }
    const db = getDB();
    const profile = db.profiles.find(p=>p.email===email && p.password===password);
    if (!profile) throw new Error('Credenciais inválidas');
    const session = { user: { id: profile.id, email: profile.email, name: profile.name } };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
  async upsertUsuario(usuario){
    // usuario: { uuid?, nome_completo, data_nascimento, parentesco, escolaridade, profissao, email, celular, cidade_estado }
    if (client){
      const authUser = (await client.auth.getUser()).data.user;
      if (!authUser) throw new Error('É necessário estar autenticado.');
      const payload = { ...usuario, uuid: authUser.id };
      // 42P10 ocorre porque 'uuid' não é UNIQUE. Fazemos upsert manual por uuid.
      const { data: found, error: selErr } = await client
        .from('usuarios')
        .select('id_usuario')
        .eq('uuid', authUser.id)
        .limit(1);
      if (selErr) throw selErr;
      if (Array.isArray(found) && found.length){
        const id = found[0].id_usuario;
        const { error: updErr } = await client
          .from('usuarios')
          .update(payload)
          .eq('id_usuario', id);
        if (updErr) throw updErr;
        return id;
      } else {
        const { data: ins, error: insErr } = await client
          .from('usuarios')
          .insert(payload)
          .select('id_usuario')
          .single();
        if (insErr) throw insErr;
        return ins.id_usuario;
      }
    }
    // Stub local
    const db = getDB();
    let existing = db.profiles.find(p=>p.email===usuario.email);
    if (!existing){
      const id = 'prof_'+Math.random().toString(36).slice(2,9);
      existing = { id, name: usuario.nome_completo, email: usuario.email };
      db.profiles.push(existing);
      setDB(db);
    }
    return existing.id; // usa id de profile como id_usuario fake
  },
  async insertCrianca({ id_responsavel, crianca }){
    // crianca: mapeia para tabela real quando possível
    if (client){
      const payload = { ...crianca, id_responsavel };
      const { data, error } = await client.from('criancas').insert(payload).select('id_crianca').single();
      if (error) throw error;
      return data.id_crianca;
    }
    // Stub local
    const db = getDB();
    const id = 'child_'+Math.random().toString(36).slice(2,9);
    db.children.push({ id, profile_id: id_responsavel, ...crianca });
    setDB(db);
    return id;
  },
  setPendingOnboarding(data){
    localStorage.setItem(PENDING_ONBOARD_KEY, JSON.stringify(data));
  },
  async tryProcessPendingOnboarding(){
    const raw = localStorage.getItem(PENDING_ONBOARD_KEY);
    if (!raw) return false;
    if (!client) return false;
    const auth = (await client.auth.getUser()).data.user;
    if (!auth) return false;
    try{
      const { usuario, crianca } = JSON.parse(raw);
      const idUsuario = await this.upsertUsuario(usuario);
      await this.insertCrianca({ id_responsavel: idUsuario, crianca });
      localStorage.removeItem(PENDING_ONBOARD_KEY);
      return true;
    }catch(e){
      // mantém pendente
      return false;
    }
  },
  async registerAndSaveProfile({name, email, password}){
    if (client){
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      const s = data.session;
      if (s){
        const session = { user: { id: s.user.id, email: s.user.email, name: s.user.user_metadata?.name || name || s.user.email } };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
      }
      // Sem sessão imediata (e-mail conf.)
      return { user: { id: data.user.id, email: data.user.email, name: name || data.user.email } };
    }
    const db = getDB();
    if (db.profiles.some(p=>p.email===email)) throw new Error('E-mail já cadastrado');
    const id = 'prof_'+Math.random().toString(36).slice(2,9);
    db.profiles.push({ id, name, email, password });
    setDB(db);
    const session = { user: { id, email, name } };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
  async saveChild({profileId, child}){
    const db = getDB();
    const id = 'child_'+Math.random().toString(36).slice(2,9);
    db.children.push({ id, profile_id: profileId, ...child });
    setDB(db);
    return { id };
  },
  async listChildren(){
    const session = this.getCurrentUser();
    if (!session) return [];
    const db = getDB();
    const criancas = db.children
      .filter(c=>c.profile_id === session.user.id)
      .map(c=>({
        ...c,
        id: c.id,
        name: c.nome_completo || c.name || c.nome || 'Criança'
      }));
    return criancas;
  },
  setActiveChild(childId){
    this.ensureActiveChild(childId);
  },
  getActiveChild(){
    const raw = localStorage.getItem(ACTIVE_CHILD_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  },
  async listGames(){
    return getDB().games;
  },
  async startSession({gameId, childId}){
    // Try Supabase real
    if (client){
      try{
        const started_at = new Date().toISOString();
        const { data, error } = await client.from('game_sessions').insert({ game_id: gameId, child_id: childId || null, started_at }).select('id, started_at').single();
        if (error) throw error;
        return { id: data.id, started_at: new Date(data.started_at).getTime?.() || Date.now() };
      }catch(e){ /* fallback to local */ }
    }
    const db = getDB();
    const id = 'sess_'+Math.random().toString(36).slice(2,9);
    const started_at = Date.now();
    db.game_sessions.push({ id, game_id: gameId, child_id: childId || null, started_at, ended_at: null });
    setDB(db);
    return { id, started_at };
  },
  async logEvent(sessionId, ts, payload){
    if (client){
      try{
        const { error } = await client.from('game_events').insert({ session_id: sessionId, ts: new Date(ts).toISOString?.() || new Date().toISOString(), payload });
        if (!error) return;
      }catch(e){ /* fallback */ }
    }
    const db = getDB();
    db.game_events.push({ id: 'evt_'+Math.random().toString(36).slice(2,9), session_id: sessionId, ts, payload });
    setDB(db);
  },
  async endSession(sessionId){
    if (client){
      try{
        const ended_at = new Date().toISOString();
        await client.from('game_sessions').update({ ended_at }).eq('id', sessionId);
        return;
      }catch(e){ /* fallback */ }
    }
    const db = getDB();
    const s = db.game_sessions.find(s=>s.id===sessionId);
    if (s) s.ended_at = Date.now();
    setDB(db);
  },
  async addChild({ name, birthdate }){
    const session = this.getCurrentUser();
    if (!session) throw new Error('Usuário não logado');
    
    if (client){
      try{
        // Buscar id_usuario pelo uuid
        const { data: userData, error: userErr } = await client
          .from('usuarios')
          .select('id_usuario')
          .eq('uuid', session.user.id)
          .single();
        if (userErr) throw userErr;
        
        const { data, error } = await client
          .from('criancas')
          .insert({
            id_responsavel: userData.id_usuario,
            nome_completo: name,
            data_nascimento: birthdate
          })
          .select('id_crianca')
          .single();
        if (error) throw error;
        return { id: data.id_crianca };
      } catch(e){
        console.error('Erro ao adicionar criança no Supabase', e);
        throw e;
      }
    }
    
    // Fallback local
    const db = getDB();
    const id = 'child_'+Math.random().toString(36).slice(2,9);
    db.children.push({ id, profile_id: session.user.id, nome_completo: name, data_nascimento: birthdate });
    setDB(db);
    return { id };
  },
  
  async getChildStats(childId){
    if (!childId) return null;
    
    if (client){
      try{
        // Buscar sessões da criança
        const { data: sessions, error } = await client
          .from('game_sessions')
          .select('id, started_at')
          .eq('child_id', childId);
        if (error) throw error;
        
        if (!sessions || sessions.length === 0){
          return { totalSessions: 0, accuracy: 0, avgReactionTime: 0, maxLevel: 0 };
        }
        
        const sessionIds = sessions.map(s => s.id);
        
        // Buscar eventos dessas sessões
        const { data: events, error: evtErr } = await client
          .from('game_events')
          .select('payload')
          .in('session_id', sessionIds);
        if (evtErr) throw evtErr;
        
        let total = 0, hits = 0, rtSum = 0, maxLevel = 0;
        (events || []).forEach(e => {
          const p = e.payload || {};
          if (typeof p.correct === 'boolean'){
            total++;
            if (p.correct) hits++;
          }
          if (typeof p.reactionTimeMs === 'number') rtSum += p.reactionTimeMs;
          if (typeof p.level === 'number' && p.level > maxLevel) maxLevel = p.level;
        });
        
        return {
          totalSessions: sessions.length,
          accuracy: total ? Math.round((hits / total) * 100) : 0,
          avgReactionTime: total ? Math.round(rtSum / total) : 0,
          maxLevel
        };
      } catch(e){
        console.error('Erro ao buscar stats', e);
      }
    }
    
    // Fallback local
    const db = getDB();
    const sessions = db.game_sessions.filter(s => s.child_id === childId);
    const events = db.game_events.filter(e => sessions.some(s => s.id === e.session_id));
    
    let total = 0, hits = 0, rtSum = 0, maxLevel = 0;
    events.forEach(e => {
      const p = e.payload || {};
      if (typeof p.correct === 'boolean'){
        total++;
        if (p.correct) hits++;
      }
      if (typeof p.reactionTimeMs === 'number') rtSum += p.reactionTimeMs;
      if (typeof p.level === 'number' && p.level > maxLevel) maxLevel = p.level;
    });
    
    return {
      totalSessions: sessions.length,
      accuracy: total ? Math.round((hits / total) * 100) : 0,
      avgReactionTime: total ? Math.round(rtSum / total) : 0,
      maxLevel
    };
  },
  
  async getWeeklyProgress(childId){
    const result = [0, 0, 0, 0, 0, 0, 0]; // Dom-Sáb
    if (!childId) return result;
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (client){
      try{
        const { data: sessions, error } = await client
          .from('game_sessions')
          .select('started_at')
          .eq('child_id', childId)
          .gte('started_at', weekAgo.toISOString());
        if (error) throw error;
        
        (sessions || []).forEach(s => {
          const d = new Date(s.started_at);
          result[d.getDay()]++;
        });
        return result;
      } catch(e){
        console.error('Erro ao buscar progresso semanal', e);
      }
    }
    
    // Fallback local
    const db = getDB();
    db.game_sessions
      .filter(s => s.child_id === childId && s.started_at >= weekAgo.getTime())
      .forEach(s => {
        const d = new Date(s.started_at);
        result[d.getDay()]++;
      });
    
    return result;
  },
  
  async getGameProgress({childId, gameId}){
    if (client){
      try{
        const q1 = client.from('game_sessions').select('id, child_id, game_id').eq('game_id', gameId);
        const { data: sess, error: e1 } = childId ? await q1.eq('child_id', childId) : await q1;
        if (!e1 && sess && sess.length){
          const ids = sess.map(s=>s.id);
          const { data: evts, error: e2 } = await client.from('game_events').select('session_id, ts, payload').in('session_id', ids);
          if (!e2){
            let total=0, hits=0, errors=0, rt=0, levelSum=0, totalAttempts=0;
            evts.forEach(e=>{
              const { level, correct, reactionTimeMs, attempts } = e.payload || {};
              if (typeof level === 'number') levelSum += level;
              if (typeof reactionTimeMs === 'number') rt += reactionTimeMs;
              if (typeof attempts === 'number') totalAttempts += attempts;
              if (typeof correct === 'boolean') { 
                total++; 
                if (correct) hits++; 
                else errors++;
              }
            });
            return { 
              sessions: sess.length, 
              accuracy: total? (hits/total):0, 
              avgReaction: total? (rt/total):0, 
              avgLevel: evts.length? (levelSum/Math.max(1,evts.length)):0,
              totalCorrect: hits,
              totalErrors: errors,
              totalAttempts: totalAttempts,
              avgReactionMs: total? rt : 0
            };
          }
        }
      }catch(e){ /* fallback */ }
    }
    const db = getDB();
    const sessions = db.game_sessions.filter(s => (childId? s.child_id===childId : true) && s.game_id===gameId);
    const events = db.game_events.filter(e => sessions.some(s=>s.id===e.session_id));
    // métricas simples
    let total=0, hits=0, errors=0, rt=0, levelSum=0, totalAttempts=0;
    events.forEach(e=>{
      const { level, correct, reactionTimeMs, attempts } = e.payload || {};
      if (typeof level === 'number') levelSum += level;
      if (typeof reactionTimeMs === 'number') rt += reactionTimeMs;
      if (typeof attempts === 'number') totalAttempts += attempts;
      if (typeof correct === 'boolean') { 
        total++; 
        if (correct) hits++; 
        else errors++;
      }
    });
    return {
      sessions: sessions.length,
      accuracy: total? (hits/total) : 0,
      avgReaction: total? (rt/total) : 0,
      avgLevel: events.length? (levelSum/Math.max(1,events.length)) : 0,
      totalCorrect: hits,
      totalErrors: errors,
      totalAttempts: totalAttempts,
      avgReactionMs: total? rt : 0
    };
  },
  
  async getGameProgressByDay({childId, gameId}){
    // Retorna progresso agrupado por dia, começando do primeiro dia
    const result = [];
    
    if (client){
      try{
        const q1 = client.from('game_sessions').select('id, child_id, game_id, started_at').eq('game_id', gameId);
        const { data: sess, error: e1 } = childId ? await q1.eq('child_id', childId) : await q1;
        if (!e1 && sess && sess.length){
          const ids = sess.map(s=>s.id);
          const { data: evts, error: e2 } = await client.from('game_events').select('session_id, ts, payload').in('session_id', ids);
          if (!e2 && evts){
            // Agrupar eventos por dia
            const byDay = {};
            evts.forEach(e=>{
              const ts = new Date(e.ts);
              const dayKey = ts.toISOString().split('T')[0]; // YYYY-MM-DD
              if (!byDay[dayKey]){
                byDay[dayKey] = { date: dayKey, total: 0, hits: 0, errors: 0, rt: 0, levelSum: 0, attempts: 0 };
              }
              const { level, correct, reactionTimeMs, attempts } = e.payload || {};
              if (typeof level === 'number') byDay[dayKey].levelSum += level;
              if (typeof reactionTimeMs === 'number') byDay[dayKey].rt += reactionTimeMs;
              if (typeof attempts === 'number') byDay[dayKey].attempts += attempts;
              if (typeof correct === 'boolean'){
                byDay[dayKey].total++;
                if (correct) byDay[dayKey].hits++;
                else byDay[dayKey].errors++;
              }
            });
            
            // Converter para array e ordenar por data
            const days = Object.keys(byDay).sort();
            return days.map(dayKey => {
              const d = byDay[dayKey];
              return {
                date: dayKey,
                accuracy: d.total ? (d.hits / d.total) : 0,
                avgReaction: d.total ? (d.rt / d.total) : 0,
                avgLevel: d.total ? (d.levelSum / d.total) : 0,
                totalCorrect: d.hits,
                totalErrors: d.errors,
                totalAttempts: d.attempts
              };
            });
          }
        }
      }catch(e){ /* fallback */ }
    }
    
    // Fallback local
    const db = getDB();
    const sessions = db.game_sessions.filter(s => (childId? s.child_id===childId : true) && s.game_id===gameId);
    const events = db.game_events.filter(e => sessions.some(s=>s.id===e.session_id));
    
    const byDay = {};
    events.forEach(e=>{
      const ts = new Date(e.ts);
      const dayKey = ts.toISOString().split('T')[0];
      if (!byDay[dayKey]){
        byDay[dayKey] = { date: dayKey, total: 0, hits: 0, errors: 0, rt: 0, levelSum: 0, attempts: 0 };
      }
      const { level, correct, reactionTimeMs, attempts } = e.payload || {};
      if (typeof level === 'number') byDay[dayKey].levelSum += level;
      if (typeof reactionTimeMs === 'number') byDay[dayKey].rt += reactionTimeMs;
      if (typeof attempts === 'number') byDay[dayKey].attempts += attempts;
      if (typeof correct === 'boolean'){
        byDay[dayKey].total++;
        if (correct) byDay[dayKey].hits++;
        else byDay[dayKey].errors++;
      }
    });
    
    const days = Object.keys(byDay).sort();
    return days.map(dayKey => {
      const d = byDay[dayKey];
      return {
        date: dayKey,
        accuracy: d.total ? (d.hits / d.total) : 0,
        avgReaction: d.total ? (d.rt / d.total) : 0,
        avgLevel: d.total ? (d.levelSum / d.total) : 0,
        totalCorrect: d.hits,
        totalErrors: d.errors,
        totalAttempts: d.attempts
      };
    });
  },
};
