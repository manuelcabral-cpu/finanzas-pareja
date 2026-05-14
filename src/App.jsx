import { useState, useReducer, useMemo, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
//import { Plus, Trash2, X, Home, User, Users, ShoppingBag, Settings } from "lucide-react";
//import { supabase, getTxs, insertTx, deleteTx, updateProfile, getProfiles } from "./lib/supabase";

//---- Imports para seccion patrimonio ------------------------------
import { supabase, getTxs, insertTx, deleteTx, updateProfile, getProfiles,
  getPatrimonio, insertPatrimonio, updatePatrimonio, deletePatrimonio
} from "./lib/supabase";
import { Plus, Trash2, X, Home, User, Users, ShoppingBag, Settings, TrendingUp } from "lucide-react";


/* ═══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:2px;}`;

/*const useIsMobile = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w < 768;
};*/

/* ═══════════════════════════════════════════════════════
   THEMES
═══════════════════════════════════════════════════════ */
const THEMES = {
  ocean:    { name:"Océano 🌊",    pr:"#0ea5e9", dk:"#0369a1", ac:"#38bdf8", bg:"#f0f9ff", sf:"#ffffff", sa:"#e0f2fe", tx:"#0c4a6e", mt:"#64748b", br:"#bae6fd", gr:"linear-gradient(135deg,#0ea5e9,#0369a1)" },
  rose:     { name:"Rosa 🌸",      pr:"#f43f5e", dk:"#be123c", ac:"#fb7185", bg:"#fff1f2", sf:"#ffffff", sa:"#ffe4e6", tx:"#881337", mt:"#71717a", br:"#fecdd3", gr:"linear-gradient(135deg,#f43f5e,#be123c)" },
  forest:   { name:"Bosque 🌿",    pr:"#10b981", dk:"#047857", ac:"#34d399", bg:"#f0fdf4", sf:"#ffffff", sa:"#dcfce7", tx:"#064e3b", mt:"#6b7280", br:"#bbf7d0", gr:"linear-gradient(135deg,#10b981,#047857)" },
  lavender: { name:"Lavanda 💜",   pr:"#8b5cf6", dk:"#6d28d9", ac:"#a78bfa", bg:"#f5f3ff", sf:"#ffffff", sa:"#ede9fe", tx:"#2e1065", mt:"#6b7280", br:"#ddd6fe", gr:"linear-gradient(135deg,#8b5cf6,#6d28d9)" },
  midnight: { name:"Medianoche 🌙",pr:"#6366f1", dk:"#4338ca", ac:"#818cf8", bg:"#0f0e1a", sf:"#1a1928", sa:"#252440", tx:"#e0e7ff", mt:"#94a3b8", br:"#3730a3", gr:"linear-gradient(135deg,#6366f1,#4338ca)" },
  sunset:   { name:"Atardecer 🌅", pr:"#f97316", dk:"#c2410c", ac:"#fb923c", bg:"#fff7ed", sf:"#ffffff", sa:"#ffedd5", tx:"#7c2d12", mt:"#78716c", br:"#fed7aa", gr:"linear-gradient(135deg,#f97316,#c2410c)" },
  gold:     { name:"Dorado ✨",    pr:"#d97706", dk:"#92400e", ac:"#fbbf24", bg:"#fffbeb", sf:"#ffffff", sa:"#fef3c7", tx:"#78350f", mt:"#78716c", br:"#fde68a", gr:"linear-gradient(135deg,#d97706,#92400e)" },
  slate:    { name:"Pizarra 🪨",   pr:"#475569", dk:"#1e293b", ac:"#94a3b8", bg:"#f8fafc", sf:"#ffffff", sa:"#f1f5f9", tx:"#0f172a", mt:"#64748b", br:"#e2e8f0", gr:"linear-gradient(135deg,#475569,#1e293b)" },
};

const CHART_COLORS = ["#6366f1","#10b981","#f97316","#f43f5e","#0ea5e9","#8b5cf6","#eab308","#06b6d4","#84cc16","#64748b"];

/* ═══════════════════════════════════════════════════════
   CATEGORIES
═══════════════════════════════════════════════════════ */
const CATS = {
  personal_income:  ["Sueldo","Freelance","Bono","Inversiones","Regalo","Otros"],
  personal_expense: ["Comida","Transporte","Salud","Entretenimiento","Ropa","Educación","Tecnología","Cuidado personal","Ahorro","Otros"],
  shared_income:    ["Aporte propio","Aporte pareja","Devolución","Otros"],
  shared_expense:   ["Alquiler","Luz","Gas","Internet","Agua","Supermercado","Limpieza","Impuestos","Expensas","Mantenimiento","Otros"],
  business_income:  ["Ventas presenciales","Ventas delivery","Catering","Otros ingresos"],
  business_expense: ["Ingredientes","Packaging","Delivery","Publicidad","Equipamiento","Gas cocina","Servicios","Otros"],
};

/* ═══════════════════════════════════════════════════════
   MODELS — POO
═══════════════════════════════════════════════════════ */
class Transaction {
  constructor(d) {
    this.id          = d.id;
    this.type        = d.type;
    this.amount      = parseFloat(d.amount);
    this.category    = d.category;
    this.description = d.description || "";
    this.date        = d.date || new Date().toISOString().split("T")[0];
    this.userId      = d.user_id || d.userId;
    this.fundId      = d.fund_id || d.fundId;
  }
  get isIncome() { return this.type === "income"; }
}

class Fund {
  constructor(data) { Object.assign(this, data); }
  get balance()       { return this.transactions.reduce((a,t) => t.isIncome ? a+t.amount : a-t.amount, 0); }
  get totalIncome()   { return this.transactions.filter(t=>t.isIncome).reduce((a,t)=>a+t.amount,0); }
  get totalExpenses() { return this.transactions.filter(t=>!t.isIncome).reduce((a,t)=>a+t.amount,0); }
  get byCategory() {
    const m={};
    this.transactions.filter(t=>!t.isIncome).forEach(t=>{ m[t.category]=(m[t.category]||0)+t.amount; });
    return Object.entries(m).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  }
}

/* ═══════════════════════════════════════════════════════
   REDUCER
═══════════════════════════════════════════════════════ */
function reducer(s, a) {
  switch(a.type) {
    case "SET_MOD":  return {...s, activeModule:a.mod};
    default: return s;
  }
}

const INITIAL = { activeModule: "dashboard" };

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const fmt = n => `$${Math.abs(n).toLocaleString("es-AR",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
const mkFund = (data) => {
  const f = new Fund({...data, transactions: (data.transactions||[]).map(t => new Transaction(t))});
  return f;
};

/* ═══════════════════════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════════════════════ */
function AuthScreen() {
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  

  const login = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setError("Email o contraseña incorrectos"); setLoading(false); }
  };

  const inp = {
    width:"100%", padding:"13px 16px", borderRadius:14,
    border:"2px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.12)",
    color:"#fff", fontSize:15, fontFamily:"Sora,sans-serif", outline:"none", marginBottom:10
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#1e1b4b,#312e81,#4c1d95,#6d28d9)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Sora,sans-serif",padding:20}}>
      <style>{FONTS}</style>
      <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:10}}>💰</div>
        <h1 style={{fontSize:28,fontWeight:800,color:"#fff",marginBottom:6}}>Finanzas en Pareja</h1>
        <p style={{color:"rgba(255,255,255,0.6)",marginBottom:32,fontSize:14}}>Ingresá con tu cuenta</p>
        <input
          type="email" placeholder="Email" value={email}
          onChange={e=>setEmail(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&login()}
          style={inp}
        />
        <input
          type="password" placeholder="Contraseña" value={pass}
          onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&login()}
          style={inp}
        />
        {error && <p style={{color:"#fb7185",fontSize:13,marginBottom:10}}>{error}</p>}
        <button onClick={login} disabled={loading}
          style={{width:"100%",padding:14,borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",fontWeight:700,fontSize:15,fontFamily:"Sora,sans-serif",cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TRANSACTION MODAL
═══════════════════════════════════════════════════════ */
function TxModal({th, fundId, fundType, userId, onClose, onAdd}) {
  const [txType, setTxType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [cat,    setCat]    = useState("");
  const [desc,   setDesc]   = useState("");
  const [date,   setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const incCats = CATS[`${fundType}_income`]  || CATS.personal_income;
  const expCats = CATS[`${fundType}_expense`] || CATS.personal_expense;
  const cats    = txType==="income" ? incCats : expCats;

  const submit = async () => {
    if (!amount || !cat) return;
    setSaving(true);
    await onAdd({ type:txType, amount:parseFloat(amount), category:cat, description:desc, date, user_id:userId, fund_id:fundId });
    setSaving(false);
    onClose();
  };

  const inp = {width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${th.br}`,background:th.sa,color:th.tx,fontSize:14,fontFamily:"Sora,sans-serif",outline:"none"};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,backdropFilter:"blur(4px)"}}>
      <div style={{background:th.sf,borderRadius:24,padding:24,width:"100%",maxWidth:440,boxShadow:"0 24px 64px rgba(0,0,0,0.25)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{fontWeight:700,fontSize:17,color:th.tx}}>Nueva transacción</h3>
          <button onClick={onClose} style={{background:th.sa,border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X size={15} color={th.mt}/>
          </button>
        </div>

        <div style={{display:"flex",background:th.sa,borderRadius:14,padding:4,marginBottom:16,gap:4}}>
          {["income","expense"].map(t=>(
            <button key={t} onClick={()=>{setTxType(t);setCat("");}}
              style={{flex:1,padding:"10px",borderRadius:10,border:"none",fontFamily:"Sora,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s",
                background:txType===t?(t==="income"?"#10b981":"#f43f5e"):"transparent",
                color:txType===t?"#fff":th.mt}}>
              {t==="income"?"↑ Ingreso":"↓ Egreso"}
            </button>
          ))}
        </div>

        <label style={{fontSize:11,fontWeight:600,color:th.mt,display:"block",marginBottom:6,letterSpacing:.5}}>MONTO</label>
        <input type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)}
          style={{...inp,fontSize:26,fontWeight:800,marginBottom:14}}/>

        <label style={{fontSize:11,fontWeight:600,color:th.mt,display:"block",marginBottom:8,letterSpacing:.5}}>CATEGORÍA</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${cat===c?th.pr:th.br}`,background:cat===c?th.pr:"transparent",color:cat===c?"#fff":th.tx,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"Sora,sans-serif",transition:"all .15s"}}>
              {c}
            </button>
          ))}
        </div>

        <label style={{fontSize:11,fontWeight:600,color:th.mt,display:"block",marginBottom:6,letterSpacing:.5}}>DETALLE <span style={{fontWeight:400,textTransform:"lowercase"}}>(opcional)</span></label>
        <input type="text" placeholder="¿En qué se gastó?" value={desc} onChange={e=>setDesc(e.target.value)} style={{...inp,marginBottom:14}}/>

        <label style={{fontSize:11,fontWeight:600,color:th.mt,display:"block",marginBottom:6,letterSpacing:.5}}>FECHA</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...inp,marginBottom:20}}/>

        <button onClick={submit} disabled={!amount||!cat||saving}
          style={{width:"100%",padding:14,borderRadius:14,border:"none",background:(!amount||!cat)?th.br:th.gr,color:"#fff",fontWeight:700,fontSize:15,fontFamily:"Sora,sans-serif",cursor:(!amount||!cat)?"not-allowed":"pointer",transition:"all .2s"}}>
          {saving ? "Guardando..." : "Agregar transacción"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FUND VIEW
═══════════════════════════════════════════════════════ */
function FundView({th, fundId, fundType, title, icon, subtitle, userId, allTxs, onAdd, onDelete}) {
  const [showModal, setShowModal] = useState(false);

  const fund = useMemo(() => {
    const txs = allTxs.filter(t => t.fund_id === fundId || t.fundId === fundId);
    return mkFund({ id:fundId, type:fundType, transactions: txs });
  }, [allTxs, fundId, fundType]);

  const pieData = fund.byCategory;
  const card = {background:th.sf,borderRadius:20,padding:20,boxShadow:`0 2px 16px ${th.br}20`,marginBottom:16};

  return (
    <div>
      <div style={{background:th.gr,borderRadius:24,padding:24,marginBottom:16,color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,background:"rgba(255,255,255,0.08)",borderRadius:"50%"}}/>
        <div style={{position:"absolute",bottom:-20,right:60,width:90,height:90,background:"rgba(255,255,255,0.06)",borderRadius:"50%"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,position:"relative"}}>
          <span style={{fontSize:22}}>{icon}</span>
          <div>
            <div style={{fontWeight:700,fontSize:17}}>{title}</div>
            {subtitle&&<div style={{opacity:.75,fontSize:11,marginTop:1}}>{subtitle}</div>}
          </div>
        </div>
        <div style={{fontSize:11,opacity:.75,marginBottom:3,letterSpacing:.5,position:"relative"}}>BALANCE ACTUAL</div>
        <div style={{fontSize:40,fontWeight:800,letterSpacing:-1,position:"relative"}}>{fmt(fund.balance)}</div>
        <div style={{display:"flex",gap:24,marginTop:14,position:"relative"}}>
          <div><div style={{fontSize:10,opacity:.7,letterSpacing:.5}}>↑ INGRESOS</div><div style={{fontWeight:700,fontSize:15,marginTop:2}}>{fmt(fund.totalIncome)}</div></div>
          <div><div style={{fontSize:10,opacity:.7,letterSpacing:.5}}>↓ EGRESOS</div><div style={{fontWeight:700,fontSize:15,marginTop:2}}>{fmt(fund.totalExpenses)}</div></div>
        </div>
      </div>

      <button onClick={()=>setShowModal(true)}
        style={{width:"100%",padding:14,borderRadius:16,border:"none",background:th.gr,color:"#fff",fontWeight:700,fontSize:14,fontFamily:"Sora,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16}}>
        <Plus size={18}/> Nueva transacción
      </button>

      {pieData.length > 0 && (
        <div style={card}>
          <div style={{fontWeight:700,fontSize:14,color:th.tx,marginBottom:14}}>Gastos por categoría</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                {pieData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:10,border:`1px solid ${th.br}`,fontFamily:"Sora,sans-serif",fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
            {pieData.slice(0,8).map((item,i)=>(
              <div key={item.name} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/>
                <span style={{fontSize:11,color:th.mt}}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{fontWeight:700,fontSize:14,color:th.tx,marginBottom:14}}>Historial</div>
        {fund.transactions.length===0 ? (
          <div style={{textAlign:"center",color:th.mt,padding:"24px 0",fontSize:14}}>Sin transacciones aún 💸</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {fund.transactions.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:th.bg,borderRadius:14}}>
                <div style={{width:38,height:38,borderRadius:11,background:t.isIncome?"rgba(16,185,129,0.15)":"rgba(244,63,94,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>
                  {t.isIncome?"↑":"↓"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,color:th.tx,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.description||t.category}</div>
                  <div style={{fontSize:11,color:th.mt,marginTop:1}}>{t.category} · {t.date}</div>
                </div>
                <div style={{fontWeight:700,fontSize:13,color:t.isIncome?"#10b981":"#f43f5e",flexShrink:0}}>
                  {t.isIncome?"+":"-"}{fmt(t.amount)}
                </div>
                {t.userId===userId&&(
                  <button onClick={()=>onDelete(t.id)}
                    style={{background:"none",border:"none",cursor:"pointer",color:th.mt,padding:4,borderRadius:6,display:"flex",alignItems:"center",flexShrink:0}}>
                    <Trash2 size={13}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal&&<TxModal th={th} fundId={fundId} fundType={fundType} userId={userId}
        onClose={()=>setShowModal(false)} onAdd={onAdd}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
function Dashboard({th, userId, users, allTxs, dispatch, isMobile}) {
  const user = users[userId];

  const myFund  = useMemo(()=>mkFund({id:`personal_${userId}`, type:"personal", transactions:allTxs.filter(t=>(t.fund_id||t.fundId)===`personal_${userId}`)}), [allTxs, userId]);
  const shared  = useMemo(()=>mkFund({id:"shared",   type:"shared",    transactions:allTxs.filter(t=>(t.fund_id||t.fundId)==="shared")}),   [allTxs]);
  const biz     = useMemo(()=>mkFund({id:"business", type:"business",  transactions:allTxs.filter(t=>(t.fund_id||t.fundId)==="business")}), [allTxs]);

  if (!user) return null;

  const pct  = Math.min(100,(myFund.totalExpenses/(user.budget||1))*100);
  const over = pct > 80;

  const summaries = [
    {label:"Mi Presupuesto", icon:"👤", fund:myFund, mod:"personal"},
    {label:"Fondo Común",    icon:"🏠", fund:shared, mod:"shared"},
    {label:"Emprendimiento", icon:"🍕", fund:biz,    mod:"business"},
  ];

  const barData = [
    {name:"Personal", Ingresos:myFund.totalIncome, Egresos:myFund.totalExpenses},
    {name:"Común",    Ingresos:shared.totalIncome,  Egresos:shared.totalExpenses},
    {name:"Negocio",  Ingresos:biz.totalIncome,     Egresos:biz.totalExpenses},
  ];

  const recentTxs = [...allTxs]
    .map(t=>new Transaction(t))
    .sort((a,b)=>new Date(b.date)-new Date(a.date))
    .slice(0,6);

  const col = isMobile ? "1fr" : "1fr 1fr";
  const card = {background:th.sf,borderRadius:20,padding:20,boxShadow:`0 2px 16px ${th.br}20`,marginBottom:14};

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:isMobile?26:34,fontWeight:800,color:th.tx}}>{`Hola, ${user.name}! ${user.emoji}`}</h1>
        <p style={{color:th.mt,fontSize:isMobile?13:15,marginTop:3}}>Resumen general de tus finanzas</p>
      </div>

      {/* Presupuesto — ancho completo */}
      <div style={card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontWeight:700,fontSize:isMobile?14:16,color:th.tx}}>Presupuesto personal</div>
            <div style={{fontSize:isMobile?12:14,color:th.mt,marginTop:1}}>Gastado este mes</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontWeight:800,fontSize:isMobile?15:18,color:over?"#f43f5e":th.pr}}>{fmt(myFund.totalExpenses)}</div>
            <div style={{fontSize:isMobile?11:13,color:th.mt}}>de {fmt(user.budget||0)}</div>
          </div>
        </div>
        <div style={{background:th.sa,borderRadius:999,height:8,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",background:over?"linear-gradient(90deg,#f97316,#f43f5e)":th.gr,borderRadius:999,transition:"width .5s ease"}}/>
        </div>
        <div style={{fontSize:isMobile?11:13,color:over?"#f43f5e":th.mt,marginTop:6,textAlign:"right",fontWeight:over?700:400}}>
          {pct.toFixed(0)}% usado {over?"⚠️ ¡Casi al límite!":""}
        </div>
      </div>

      {/* Fund cards — grid 2 col en PC */}
      <div style={{display:"grid",gridTemplateColumns:col,gap:14,marginBottom:14}}>
        {summaries.map(s=>(
          <div key={s.mod} onClick={()=>dispatch({type:"SET_MOD",mod:s.mod})}
            style={{...card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"transform .15s",userSelect:"none",marginBottom:0}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:46,height:46,borderRadius:14,background:th.sa,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{s.icon}</div>
              <div>
                <div style={{fontWeight:700,fontSize:isMobile?14:16,color:th.tx}}>{s.label}</div>
                <div style={{fontSize:isMobile?11:13,color:th.mt,marginTop:2}}>↑{fmt(s.fund.totalIncome)} · ↓{fmt(s.fund.totalExpenses)}</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:800,fontSize:isMobile?15:18,color:s.fund.balance>=0?th.pr:"#f43f5e"}}>{fmt(s.fund.balance)}</div>
              <div style={{fontSize:isMobile?10:12,color:th.mt,marginTop:1}}>{s.fund.balance>=0?"superávit":"déficit"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + actividad — lado a lado en PC */}
      <div style={{display:"grid",gridTemplateColumns:col,gap:14}}>
        <div style={card}>
          <div style={{fontWeight:700,fontSize:isMobile?14:16,color:th.tx,marginBottom:14}}>Ingresos vs Egresos</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barGap={4}>
              <XAxis dataKey="name" tick={{fontSize:isMobile?11:13,fill:th.mt,fontFamily:"Sora,sans-serif"}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:10,border:`1px solid ${th.br}`,fontFamily:"Sora,sans-serif",fontSize:12}}/>
              <Bar dataKey="Ingresos" fill="#10b981" radius={[6,6,0,0]}/>
              <Bar dataKey="Egresos"  fill="#f43f5e" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:8}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:"#10b981"}}/><span style={{fontSize:isMobile?11:13,color:th.mt}}>Ingresos</span></div>
            <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:"#f43f5e"}}/><span style={{fontSize:isMobile?11:13,color:th.mt}}>Egresos</span></div>
          </div>
        </div>

        <div style={card}>
          <div style={{fontWeight:700,fontSize:isMobile?14:16,color:th.tx,marginBottom:14}}>Actividad reciente</div>
          {recentTxs.length===0
            ? <div style={{textAlign:"center",color:th.mt,padding:"16px 0",fontSize:14}}>Sin actividad aún 💸</div>
            : <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {recentTxs.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:34,height:34,borderRadius:10,background:t.isIncome?"rgba(16,185,129,0.13)":"rgba(244,63,94,0.13)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>
                      {t.isIncome?"↑":"↓"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:isMobile?12:14,fontWeight:600,color:th.tx,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.description||t.category}</div>
                      <div style={{fontSize:isMobile?10:12,color:th.mt}}>{t.category} · {t.date}</div>
                    </div>
                    <div style={{fontWeight:700,fontSize:isMobile?12:14,color:t.isIncome?"#10b981":"#f43f5e",flexShrink:0}}>
                      {t.isIncome?"+":"-"}{fmt(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════ */
function SettingsView({th, userId, users, onTheme, onBudget, onName, onLogout}) {
  const user = users[userId];
  const [bud,       setBud]       = useState(user?.budget?.toString()||"");
  const [nombre,    setNombre]    = useState(user?.name||"");
  const [savedBud,  setSavedBud]  = useState(false);
  const [savedName, setSavedName] = useState(false);

  const saveBudget = async () => {
    if(!bud||isNaN(bud)) return;
    await onBudget(parseFloat(bud));
    setSavedBud(true); setTimeout(()=>setSavedBud(false),2000);
  };
  const saveName = async () => {
    if(!nombre.trim()) return;
    await onName(nombre.trim());
    setSavedName(true); setTimeout(()=>setSavedName(false),2000);
  };

  const card = {background:th.sf,borderRadius:20,padding:20,boxShadow:`0 2px 16px ${th.br}20`,marginBottom:14};
  const inp  = {flex:1,padding:"12px 14px",borderRadius:12,border:`1.5px solid ${th.br}`,background:th.bg,color:th.tx,fontSize:15,fontWeight:600,fontFamily:"Sora,sans-serif",outline:"none"};
  const btn  = (saved,fn) => ({padding:"12px 18px",borderRadius:12,border:"none",background:saved?"#10b981":th.gr,color:"#fff",fontWeight:700,fontFamily:"Sora,sans-serif",cursor:"pointer",fontSize:13,transition:"all .2s",flexShrink:0});

  if(!user) return null;

  return (
    <div>
      <h2 style={{fontSize:22,fontWeight:800,color:th.tx,marginBottom:4}}>Configuración</h2>
      <p style={{color:th.mt,fontSize:13,marginBottom:22}}>Personalizá tu experiencia</p>

      <div style={card}>
        <div style={{fontWeight:700,fontSize:15,color:th.tx,marginBottom:14}}>✏️ Tu nombre</div>
        <div style={{display:"flex",gap:10}}>
          <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} style={inp}/>
          <button onClick={saveName} style={btn(savedName)}>{savedName?"✓ Listo":"Guardar"}</button>
        </div>
      </div>

      <div style={card}>
        <div style={{fontWeight:700,fontSize:15,color:th.tx,marginBottom:14}}>💰 Presupuesto mensual personal</div>
        <div style={{display:"flex",gap:10}}>
          <input type="number" value={bud} onChange={e=>setBud(e.target.value)} style={{...inp,fontSize:16}}/>
          <button onClick={saveBudget} style={btn(savedBud)}>{savedBud?"✓ Listo":"Guardar"}</button>
        </div>
      </div>

      <div style={card}>
        <div style={{fontWeight:700,fontSize:15,color:th.tx,marginBottom:14}}>🎨 Tu tema de color</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
          {Object.entries(THEMES).map(([key,t])=>(
            <button key={key} onClick={()=>onTheme(key)}
              style={{padding:"11px 8px",borderRadius:14,border:`2px solid ${user.theme===key?th.pr:th.br}`,background:user.theme===key?th.sa:th.bg,cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .15s",fontFamily:"Sora,sans-serif"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:t.gr,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:user.theme===key?700:500,color:th.tx,textAlign:"left"}}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{fontWeight:700,fontSize:15,color:th.tx,marginBottom:14}}>👤 Perfil</div>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:16,background:th.gr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{user.emoji}</div>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:th.tx}}>{user.name}</div>
            <div style={{fontSize:12,color:th.mt,marginTop:2}}>Tema activo: {THEMES[user.theme]?.name}</div>
          </div>
        </div>
        <button onClick={onLogout}
          style={{width:"100%",padding:12,borderRadius:14,border:"1.5px solid #f43f5e",background:"transparent",color:"#f43f5e",fontWeight:700,fontSize:14,fontFamily:"Sora,sans-serif",cursor:"pointer",transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="#f43f5e";e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#f43f5e";}}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

//---- Agregado de nuevos navs
/* ═══ PATRIMONIO VIEW ═══ */
function PatrimonioView({th, userId, users, allTxs, patrimonio, onAdd, onUpdate, onDelete, isMobile}) {
  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo]           = useState("por_cobrar");
  const [desc, setDesc]           = useState("");
  const [monto, setMonto]         = useState("");
  const [persona, setPersona]     = useState("");
  const [fechaEst, setFechaEst]   = useState("");
  const [saving, setSaving]       = useState(false);

  const porCobrar   = patrimonio.filter(p => p.tipo === "por_cobrar"  && p.estado === "pendiente");
  const inversiones = patrimonio.filter(p => p.tipo === "inversion"   && p.estado === "pendiente");
  const cobrados    = patrimonio.filter(p => p.estado === "cobrado");

  const totalPorCobrar   = porCobrar.reduce((a,p)   => a + parseFloat(p.monto), 0);
  const totalInversiones = inversiones.reduce((a,p) => a + parseFloat(p.monto), 0);

  const myFund = (() => {
    const txs = allTxs.filter(t => (t.fund_id||t.fundId) === `personal_${userId}`);
    return txs.reduce((a,t) => t.type==="income" ? a+parseFloat(t.amount) : a-parseFloat(t.amount), 0);
  })();

  const patrimonioTotal = myFund + totalPorCobrar + totalInversiones;

  const submit = async () => {
    if(!desc||!monto) return;
    setSaving(true);
    await onAdd({tipo, descripcion:desc, monto:parseFloat(monto), persona, fecha_est:fechaEst||null, estado:"pendiente"});
    setDesc(""); setMonto(""); setPersona(""); setFechaEst(""); setSaving(false);
    setShowModal(false);
  };

  const card  = {background:th.sf, borderRadius:20, padding:20, boxShadow:`0 2px 16px ${th.br}20`, marginBottom:14};
  const col   = isMobile ? "1fr" : "1fr 1fr";
  const inp   = {width:"100%", padding:"11px 14px", borderRadius:12, border:`1.5px solid ${th.br}`, background:th.sa, color:th.tx, fontSize:14, fontFamily:"Sora,sans-serif", outline:"none"};

  const ItemCard = ({item}) => (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px",background:th.bg,borderRadius:14,marginBottom:8}}>
      <div style={{width:40,height:40,borderRadius:12,background:item.tipo==="por_cobrar"?"rgba(234,179,8,0.15)":"rgba(99,102,241,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
        {item.tipo==="por_cobrar"?"💸":"🔒"}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:isMobile?13:15,color:th.tx,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.descripcion}</div>
        <div style={{fontSize:isMobile?11:12,color:th.mt,marginTop:1}}>
          {item.persona && `${item.persona} · `}
          {item.fecha_est && `Vence: ${item.fecha_est}`}
        </div>
      </div>
      <div style={{fontWeight:700,fontSize:isMobile?13:15,color:item.tipo==="por_cobrar"?"#eab308":"#6366f1",flexShrink:0}}>
        {fmt(item.monto)}
      </div>
      {item.estado==="pendiente" && (
        <button onClick={()=>onUpdate(item.id,{estado:"cobrado"})}
          style={{background:"rgba(16,185,129,0.15)",border:"none",borderRadius:8,padding:"5px 8px",cursor:"pointer",fontSize:11,color:"#10b981",fontWeight:600,fontFamily:"Sora,sans-serif",flexShrink:0}}>
          ✓
        </button>
      )}
      <button onClick={()=>onDelete(item.id)}
        style={{background:"none",border:"none",cursor:"pointer",color:th.mt,padding:4,display:"flex",alignItems:"center",flexShrink:0}}>
        <Trash2 size={14}/>
      </button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{background:th.gr,borderRadius:24,padding:28,marginBottom:16,color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"rgba(255,255,255,0.08)",borderRadius:"50%"}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,position:"relative"}}>
          <span style={{fontSize:24}}>📊</span>
          <div>
            <div style={{fontWeight:700,fontSize:isMobile?17:20}}>Mi Patrimonio</div>
            <div style={{opacity:.75,fontSize:isMobile?11:13,marginTop:1}}>Disponible + Por cobrar + Invertido</div>
          </div>
        </div>
        <div style={{fontSize:11,opacity:.75,marginBottom:3,letterSpacing:.5,position:"relative"}}>PATRIMONIO TOTAL</div>
        <div style={{fontSize:isMobile?38:48,fontWeight:800,letterSpacing:-1,position:"relative"}}>{fmt(patrimonioTotal)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginTop:16,position:"relative"}}>
          <div>
            <div style={{fontSize:10,opacity:.7,letterSpacing:.5}}>💵 DISPONIBLE</div>
            <div style={{fontWeight:700,fontSize:isMobile?14:16,marginTop:2}}>{fmt(myFund)}</div>
          </div>
          <div>
            <div style={{fontSize:10,opacity:.7,letterSpacing:.5}}>⏳ POR COBRAR</div>
            <div style={{fontWeight:700,fontSize:isMobile?14:16,marginTop:2}}>{fmt(totalPorCobrar)}</div>
          </div>
          <div>
            <div style={{fontSize:10,opacity:.7,letterSpacing:.5}}>🔒 INVERTIDO</div>
            <div style={{fontWeight:700,fontSize:isMobile?14:16,marginTop:2}}>{fmt(totalInversiones)}</div>
          </div>
        </div>
      </div>

      <button onClick={()=>setShowModal(true)}
        style={{width:"100%",padding:14,borderRadius:16,border:"none",background:th.gr,color:"#fff",fontWeight:700,fontSize:isMobile?14:16,fontFamily:"Sora,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16}}>
        <Plus size={18}/> Agregar
      </button>

      <div style={{display:"grid",gridTemplateColumns:col,gap:14}}>
        {/* Por cobrar */}
        <div style={card}>
          <div style={{fontWeight:700,fontSize:isMobile?14:16,color:th.tx,marginBottom:4}}>⏳ Por cobrar</div>
          <div style={{fontSize:isMobile?11:13,color:th.mt,marginBottom:14}}>Total: <span style={{fontWeight:700,color:"#eab308"}}>{fmt(totalPorCobrar)}</span></div>
          {porCobrar.length===0
            ? <div style={{textAlign:"center",color:th.mt,padding:"16px 0",fontSize:13}}>Sin deudas pendientes 🎉</div>
            : porCobrar.map(item=><ItemCard key={item.id} item={item}/>)
          }
        </div>

        {/* Inversiones */}
        <div style={card}>
          <div style={{fontWeight:700,fontSize:isMobile?14:16,color:th.tx,marginBottom:4}}>🔒 Invertido</div>
          <div style={{fontSize:isMobile?11:13,color:th.mt,marginBottom:14}}>Total: <span style={{fontWeight:700,color:"#6366f1"}}>{fmt(totalInversiones)}</span></div>
          {inversiones.length===0
            ? <div style={{textAlign:"center",color:th.mt,padding:"16px 0",fontSize:13}}>Sin inversiones registradas</div>
            : inversiones.map(item=><ItemCard key={item.id} item={item}/>)
          }
        </div>
      </div>

      {/* Historial cobrados */}
      {cobrados.length>0 && (
        <div style={card}>
          <div style={{fontWeight:700,fontSize:isMobile?14:16,color:th.tx,marginBottom:14}}>✅ Cobrados / Vencidos</div>
          {cobrados.map(item=>(
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:th.bg,borderRadius:14,marginBottom:8,opacity:.6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:th.tx}}>{item.descripcion}</div>
                <div style={{fontSize:11,color:th.mt}}>{item.persona}</div>
              </div>
              <div style={{fontWeight:700,fontSize:13,color:"#10b981"}}>{fmt(item.monto)}</div>
              <button onClick={()=>onDelete(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:th.mt,padding:4,display:"flex",alignItems:"center"}}>
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,backdropFilter:"blur(4px)"}}>
          <div style={{background:th.sf,borderRadius:24,padding:24,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.25)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontWeight:700,fontSize:18,color:th.tx}}>Nuevo registro</h3>
              <button onClick={()=>setShowModal(false)} style={{background:th.sa,border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={15} color={th.mt}/>
              </button>
            </div>

            <div style={{display:"flex",background:th.sa,borderRadius:14,padding:4,marginBottom:16,gap:4}}>
              {[["por_cobrar","⏳ Por cobrar"],["inversion","🔒 Inversión"]].map(([val,label])=>(
                <button key={val} onClick={()=>setTipo(val)}
                  style={{flex:1,padding:10,borderRadius:10,border:"none",fontFamily:"Sora,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",background:tipo===val?th.pr:"transparent",color:tipo===val?"#fff":th.mt}}>
                  {label}
                </button>
              ))}
            </div>

            <label style={{fontSize:11,fontWeight:600,color:th.mt,display:"block",marginBottom:6,letterSpacing:.5}}>MONTO</label>
            <input type="number" placeholder="0" value={monto} onChange={e=>setMonto(e.target.value)} style={{...inp,fontSize:26,fontWeight:800,marginBottom:14}}/>

            <label style={{fontSize:11,fontWeight:600,color:th.mt,display:"block",marginBottom:6,letterSpacing:.5}}>DESCRIPCIÓN</label>
            <input type="text" placeholder={tipo==="por_cobrar"?"Ej: Préstamo a Juan":"Ej: Plazo fijo Banco Nación"} value={desc} onChange={e=>setDesc(e.target.value)} style={{...inp,marginBottom:14}}/>

            {tipo==="por_cobrar" && <>
              <label style={{fontSize:11,fontWeight:600,color:th.mt,display:"block",marginBottom:6,letterSpacing:.5}}>QUIÉN TE DEBE <span style={{fontWeight:400,textTransform:"lowercase"}}>(opcional)</span></label>
              <input type="text" placeholder="Nombre" value={persona} onChange={e=>setPersona(e.target.value)} style={{...inp,marginBottom:14}}/>
            </>}

            <label style={{fontSize:11,fontWeight:600,color:th.mt,display:"block",marginBottom:6,letterSpacing:.5}}>FECHA ESTIMADA <span style={{fontWeight:400,textTransform:"lowercase"}}>(opcional)</span></label>
            <input type="date" value={fechaEst} onChange={e=>setFechaEst(e.target.value)} style={{...inp,marginBottom:20}}/>

            <button onClick={submit} disabled={!desc||!monto||saving}
              style={{width:"100%",padding:14,borderRadius:14,border:"none",background:(!desc||!monto)?th.br:th.gr,color:"#fff",fontWeight:700,fontSize:15,fontFamily:"Sora,sans-serif",cursor:(!desc||!monto)?"not-allowed":"pointer"}}>
              {saving?"Guardando...":"Agregar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════ */
const NAV = [
  {id:"dashboard",  label:"Inicio",     Icon:Home},
  {id:"personal",   label:"Personal",   Icon:User},
  {id:"shared",     label:"Común",      Icon:Users},
  {id:"business",   label:"Negocio",    Icon:ShoppingBag},
  {id:"patrimonio", label:"Patrimonio", Icon:TrendingUp},
  {id:"settings",   label:"Config",     Icon:Settings},
];
/* ═══════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════ */
export default function App() {
  const [appState, dispatch] = useReducer(reducer, INITIAL);
  const [windowW, setWindowW] = useState(window.innerWidth);
  useEffect(() => { const fn = () => setWindowW(window.innerWidth); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  const isMobile = windowW < 480;
  const [session,  setSession]  = useState(null);
  const [users,    setUsers]    = useState({});
  const [allTxs,   setAllTxs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [patrimonio, setPatrimonio] = useState([]);

  // ── Auth listener ──────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({data}) => setSession(data.session));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // ── Load data on login ─────────────────────────────
  useEffect(() => {
    
    
    
    if (!session) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const [txs, profs, pat] = await Promise.all([getTxs(), getProfiles(), getPatrimonio()]);
      
      setAllTxs(txs);
      const map = {};
      profs.forEach(p => { map[p.id] = { id:p.id, name:p.name, emoji:p.emoji||"👤", theme:p.theme||"ocean", budget:p.budget||100000 }; });
      setUsers(map);
      setPatrimonio(pat);
      setLoading(false);
    };
    load();
  }, [session]);

  // ── Real-time sync ─────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const ch = supabase.channel("rt-transactions")
      .on("postgres_changes", {event:"INSERT", schema:"public", table:"transactions"},
        p => setAllTxs(prev => [p.new, ...prev]))
      .on("postgres_changes", {event:"DELETE", schema:"public", table:"transactions"},
        p => setAllTxs(prev => prev.filter(t => t.id !== p.old.id)))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session]);

  // ── Actions ────────────────────────────────────────
  const handleAddTx = useCallback(async(tx) => {
    const nuevo = await insertTx(tx);
    if(nuevo) setAllTxs(prev => [nuevo, ...prev]);
  }, []);

  const handleDeleteTx = useCallback(async(id) => {
    await deleteTx(id);
    setAllTxs(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleTheme = useCallback(async (theme) => {
    const uid = session.user.id;
    setUsers(prev => ({...prev, [uid]:{...prev[uid], theme}}));
    await updateProfile(uid, {theme});
  }, [session]);

  const handleBudget = useCallback(async (val) => {
    const uid = session.user.id;
    setUsers(prev => ({...prev, [uid]:{...prev[uid], budget:val}}));
    await updateProfile(uid, {budget:val});
  }, [session]);

  const handleName = useCallback(async (name) => {
    const uid = session.user.id;
    setUsers(prev => ({...prev, [uid]:{...prev[uid], name}}));
    await updateProfile(uid, {name});
  }, [session]);

  const handleLogout = async()=>{ await supabase.auth.signOut(); setSession(null); setUsers({}); setAllTxs([]); setPatrimonio([]); };

  const handleAddPatrimonio = useCallback(async (item) => {
    const nuevo = await insertPatrimonio({ ...item, user_id: session.user.id });
    setPatrimonio(prev => [nuevo, ...prev]);
  }, [session]);

  const handleUpdatePatrimonio = useCallback(async(id, fields) => {
    await updatePatrimonio(id, fields);
    setPatrimonio(prev => prev.map(p => p.id === id ? {...p, ...fields} : p));

    // Si se cobra un "por cobrar", agrega ingreso automático al fondo personal
    if(fields.estado === "cobrado") {
      const item = patrimonio.find(p => p.id === id);
      if(item && item.tipo === "por_cobrar") {
        const tx = {
          type: "income",
          amount: parseFloat(item.monto),
          category: "Cobro de deuda",
          description: item.descripcion,
          date: new Date().toISOString().split("T")[0],
          user_id: session.user.id,
          fund_id: `personal_${session.user.id}`
        };
        const nuevo = await insertTx(tx);
        if(nuevo) setAllTxs(prev => [nuevo, ...prev]);
      }
      // Si es inversión → no agrega nada, solo cambia el estado
    }
  }, [patrimonio, session]);

  const handleDeletePatrimonio = useCallback(async (id) => {
    await deletePatrimonio(id);
    setPatrimonio(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Render ─────────────────────────────────────────
  if (!session) return <AuthScreen/>;

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",fontFamily:"Sora,sans-serif",flexDirection:"column",gap:14,background:"linear-gradient(145deg,#1e1b4b,#312e81)"}}>
      <style>{FONTS}</style>
      <div style={{fontSize:36}}>💰</div>
      <div style={{fontSize:15,color:"rgba(255,255,255,0.7)"}}>Cargando tus finanzas...</div>
    </div>
  );

  const userId = session.user.id;
  const user   = users[userId];
  if (!user) return null;
  const th = THEMES[user.theme] || THEMES.ocean;

  const renderModule = () => {
    switch(appState.activeModule) {
      case "dashboard":
        return <Dashboard th={th} userId={userId} users={users} allTxs={allTxs} dispatch={dispatch} isMobile={isMobile}/>;
      case "personal":
        return <FundView th={th} fundId={`personal_${userId}`} fundType="personal"
          title="Mi Presupuesto" icon="👤" subtitle={`${user.name} · ${new Date().toLocaleString("es-AR",{month:"long",year:"numeric"})}`}
          userId={userId} allTxs={allTxs} onAdd={handleAddTx} onDelete={handleDeleteTx}/>;
      case "shared":
        return <FundView th={th} fundId="shared" fundType="shared"
          title="Fondo Común" icon="🏠" subtitle="Alquiler, servicios, gastos compartidos"
          userId={userId} allTxs={allTxs} onAdd={handleAddTx} onDelete={handleDeleteTx}/>;
      case "business":
        return <FundView th={th} fundId="business" fundType="business"
          title="Emprendimiento 🍕" icon="🍕" subtitle="Ingresos y gastos del negocio"
          userId={userId} allTxs={allTxs} onAdd={handleAddTx} onDelete={handleDeleteTx}/>;
      
      case "patrimonio": 
        return <PatrimonioView th={th} userId={userId} users={users} allTxs={allTxs} patrimonio={patrimonio} onAdd={handleAddPatrimonio} onUpdate={handleUpdatePatrimonio} onDelete={handleDeletePatrimonio} isMobile={isMobile}/>;
      
      case "settings":
        return <SettingsView th={th} userId={userId} users={users}
          onTheme={handleTheme} onBudget={handleBudget} onName={handleName} onLogout={handleLogout}/>;
      default: return null;
    }
  };

  
  return (
    <div style={{fontFamily:"Sora,sans-serif",background:th.bg,minHeight:"100vh"}}>
      <style>{FONTS}</style>

      {/* SIDEBAR — solo desktop */}
      {!isMobile && (
        <div style={{width:220,flexShrink:0,background:th.sf,borderRight:`1px solid ${th.br}`,display:"flex",flexDirection:"column",padding:"24px 12px",position:"fixed",top:0,left:0,height:"100vh",zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 8px",marginBottom:32}}>
            <div style={{width:36,height:36,borderRadius:10,background:th.gr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💰</div>
            <span style={{fontWeight:800,fontSize:15,color:th.tx}}>Finanzas</span>
          </div>
          {NAV.map(({id,label,Icon})=>{
            const active = appState.activeModule===id;
            return (
              <button key={id} onClick={()=>dispatch({type:"SET_MOD",mod:id})}
                style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:14,border:"none",background:active?th.sa:"transparent",cursor:"pointer",fontFamily:"Sora,sans-serif",marginBottom:4,transition:"all .15s",textAlign:"left"}}>
                <Icon size={18} strokeWidth={active?2.5:1.8} color={active?th.pr:th.mt}/>
                <span style={{fontSize:13,fontWeight:active?700:500,color:active?th.pr:th.mt}}>{label}</span>
                {active&&<div style={{width:5,height:5,borderRadius:"50%",background:th.pr,marginLeft:"auto"}}/>}
              </button>
            );
          })}
          {/* Usuario activo abajo */}
          <div style={{marginTop:"auto",padding:"12px 14px",borderRadius:14,background:th.sa,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:th.gr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{user.emoji}</div>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:700,fontSize:12,color:th.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
              <div style={{fontSize:10,color:th.mt}}>{THEMES[user.theme]?.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div style={{
        marginLeft: isMobile ? 0 : 220,
        padding: isMobile ? "20px 16px 100px" : "32px 48px",
        minHeight: "100vh",
      }}>
        {renderModule()}
      </div>

      {/* BOTTOM NAV — solo mobile */}
      {isMobile && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:th.sf,borderTop:`1px solid ${th.br}`,display:"flex",zIndex:100,boxShadow:"0 -4px 24px rgba(0,0,0,0.07)",paddingBottom:6}}>
          {NAV.map(({id,label,Icon})=>{
            const active = appState.activeModule===id;
            return (
              <button key={id} onClick={()=>dispatch({type:"SET_MOD",mod:id})}
                style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 4px 4px",transition:"all .15s",fontFamily:"Sora,sans-serif"}}>
                <Icon size={20} strokeWidth={active?2.5:1.8} color={active?th.pr:th.mt} style={{transition:"all .15s",transform:active?"scale(1.1)":"scale(1)"}}/>
                <span style={{fontSize:10,fontWeight:active?700:400,color:active?th.pr:th.mt,transition:"all .15s"}}>{label}</span>
                {active&&<div style={{width:4,height:4,borderRadius:"50%",background:th.pr}}/>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}