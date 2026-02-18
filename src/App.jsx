import React from "react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Clock, DollarSign, Home, TrendingUp, FolderOpen, Tag, PieChart, UserCircle, Users, Settings, FileText, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, Info as InfoIcon, Plus, X, Copy, Upload, Calendar, Search, LayoutDashboard, Download, AlertTriangle, Check, Cloud, Loader, Briefcase } from "lucide-react";

function canStore(){try{localStorage.setItem("_t","1");localStorage.removeItem("_t");return true;}catch(e){return false;}}
function loadCfgLocal(){try{if(!canStore())return {};var d=localStorage.getItem("wl-cfg");return d?JSON.parse(d):{};}catch(e){return {};}}
function saveCfgLocal(d){try{if(canStore())localStorage.setItem("wl-cfg",JSON.stringify(d));}catch(e){}}
function saveCSVLocal(text,name){try{if(canStore()){localStorage.setItem("wl-csv",text);localStorage.setItem("wl-csv-name",name);}}catch(e){}}
function loadCSVLocal(){try{if(!canStore())return null;var d=localStorage.getItem("wl-csv");var n=localStorage.getItem("wl-csv-name");return d?{text:d,name:n||"saved.csv"}:null;}catch(e){return null;}}
function clearCSVLocal(){try{if(canStore()){localStorage.removeItem("wl-csv");localStorage.removeItem("wl-csv-name");}}catch(e){}}

// ═══ SUPABASE ═══
var SB_URL="https://mkljjhuyeqjiqhnyeyby.supabase.co";
var SB_KEY="sb_publishable_m0RZjADdnNg39F3cw5spxQ_2pPKr4G9";
var sbHeaders={"Content-Type":"application/json","apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Prefer":"return=representation"};

function sbLoad(){
  return fetch(SB_URL+"/rest/v1/app_config?id=eq.main&select=cfg,csv_text,csv_name",{headers:sbHeaders})
    .then(function(r){return r.json();})
    .then(function(rows){return rows&&rows[0]?rows[0]:null;})
    .catch(function(){return null;});
}

var _sbTimer=null;
var _sbSyncCb=null;
function sbSave(data,onStart,onDone){
  if(onStart)onStart();
  if(_sbSyncCb)_sbSyncCb=onDone;
  clearTimeout(_sbTimer);
  _sbSyncCb=onDone;
  _sbTimer=setTimeout(function(){
    var body={updated_at:new Date().toISOString()};
    if(data.cfg!==undefined)body.cfg=data.cfg;
    if(data.csv_text!==undefined)body.csv_text=data.csv_text;
    if(data.csv_name!==undefined)body.csv_name=data.csv_name;
    fetch(SB_URL+"/rest/v1/app_config?id=eq.main",{method:"PATCH",headers:sbHeaders,body:JSON.stringify(body)})
      .then(function(){if(_sbSyncCb)_sbSyncCb("saved");})
      .catch(function(){if(_sbSyncCb)_sbSyncCb("error");});
  },2000);
}

function sbSaveNow(data){
  clearTimeout(_sbTimer);
  var body={updated_at:new Date().toISOString()};
  if(data.cfg!==undefined)body.cfg=data.cfg;
  if(data.csv_text!==undefined)body.csv_text=data.csv_text;
  if(data.csv_name!==undefined)body.csv_name=data.csv_name;
  return fetch(SB_URL+"/rest/v1/app_config?id=eq.main",{method:"PATCH",headers:sbHeaders,body:JSON.stringify(body)}).catch(function(){});
}

var fmt=function(n){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n);};
var fmtH=function(h){if(!h)return "0h";var hrs=Math.floor(h),mins=Math.round((h-hrs)*60);return mins>0?hrs+"h "+mins+"m":hrs+"h";};
var pct=function(n){return Math.round(n)+"%";};
var MN=["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
var getMK=function(d){var dt=new Date(d);return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0");};
var getML=function(k){var p=k.split("-");return MN[parseInt(p[1])-1]+" "+p[0];};
var getWK=function(d){var dt=new Date(d),day=dt.getDay(),diff=dt.getDate()-day+(day===0?-6:1),m=new Date(dt);m.setDate(diff);return m.toISOString().split("T")[0];};
var getWL=function(k){var s=new Date(k+"T12:00:00"),e=new Date(s);e.setDate(e.getDate()+6);return s.getDate()+"/"+(s.getMonth()+1)+" – "+e.getDate()+"/"+(e.getMonth()+1);};
var getQK=function(d){var dt=new Date(d);return dt.getFullYear()+"-Q"+Math.floor(dt.getMonth()/3+1);};
var nextMK=function(k){var p=k.split("-").map(Number);return p[1]===12?(p[0]+1)+"-01":p[0]+"-"+String(p[1]+1).padStart(2,"0");};

function parseCSV(text){
  var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
  if(lines.length<2)return [];
  var dl=[",",";","\t"].reduce(function(b,d){var c=(lines[0].match(new RegExp(d==="\t"?"\\t":"\\"+d,"g"))||[]).length;return c>b.c?{d:d,c:c}:b;},{d:",",c:0}).d;
  var pr=function(line){var res=[],cur="",q=false;for(var i=0;i<line.length;i++){var ch=line[i];if(ch==='"')q=!q;else if(ch===dl&&!q){res.push(cur.trim());cur="";}else cur+=ch;}res.push(cur.trim());return res;};
  var hdr=pr(lines[0]);
  return lines.slice(1).map(function(l){var v=pr(l),o={};hdr.forEach(function(h,i){o[h]=v[i]||"";});return o;}).filter(function(r){return Object.values(r).some(function(v){return v;});});
}

function mapRecords(rows){
  return rows.map(function(r){
    var user=r["Username"]||"",space=r["Space Name"]||"",area=r["List Name"]||"";
    var tl=(r["Time Labels"]||"[]").replace(/^\[/,"").replace(/\]$/,"").trim();
    var cls=tl?tl.split(",").map(function(t){return t.trim().toLowerCase();}).filter(Boolean):[];
    var ext=cls.filter(function(c){return c!=="willab";});
    var client=ext.length>0?ext[0]:(cls.indexOf("willab")>=0?"willab":"");
    var hours=parseInt(r["Time Tracked"]||"0")/3600000;
    var ms=parseInt(r["Start"]||"0");
    var date=ms>0?new Date(ms):null;
    var stopMs=parseInt(r["Stop"]||"0");
    var startHour=date?date.getHours():-1;
    var weekday=date?date.getDay():-1;
    var task=r["Task Name"]||"";
    var hasDesc=(r["Description"]||"").trim().length>0;
    return {user:user,space:space,area:area,client:client,hours:hours,date:date,startHour:startHour,weekday:weekday,task:task,hasDesc:hasDesc};
  }).filter(function(r){return r.hours>0&&r.user&&r.date;});
}

var C={bg:"#F2F1F6",sf:"#FFFFFF",bd:"#E5E4EA",bdL:"#EEECF2",tx:"#1C1B1F",ts:"#3C3A42",tm:"#78767E",td:"#A9A7B0",ac:"#7C5CFC",acL:"#EDE8FF",acS:"rgba(124,92,252,0.08)",gn:"#34C759",gnBg:"rgba(52,199,89,0.08)",rd:"#FF3B30",rdBg:"rgba(255,59,48,0.08)",am:"#FF9500",amBg:"rgba(255,149,0,0.08)",bl:"#007AFF",blBg:"rgba(0,122,255,0.08)",or:"#FB923C",orBg:"rgba(251,146,60,0.08)",pk:"#AF52DE",sl:"#8E8E93"};
var AC={"Video":"#FF9500","Graphic Design":"#AF52DE","Social Media":"#007AFF","Web Design":"#34C759","Email Marketing":"#FB923C","Campagne Marketing":"#5856D6","Daily Standup":"#8E8E93","Organizzazione Shooting":"#34C759","SEO - Blog":"#AF52DE","Marketing Localevolution":"#FF2D55","Task Generale":"#8E8E93","Assistenza IT":"#34C759"};
var CC=["#7C5CFC","#007AFF","#34C759","#FF9500","#AF52DE","#34C759","#FB923C","#FF3B30","#5856D6","#8E8E93","#FF2D55","#5AC8FA"];
var gac=function(a){return AC[a]||C.ac;};
var gcc=function(i){return CC[i%CC.length];};
var bx={background:C.sf,borderRadius:16,border:"1px solid "+C.bdL,padding:"20px 22px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"};
var ix={background:C.sf,border:"1px solid "+C.bd,borderRadius:9,padding:"9px 12px",color:C.tx,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};

function Bar(props){
  var w=props.max>0?Math.min(props.value/props.max*100,100):0;
  var h=props.h||8;
  var pos=props.positive!==false;
  return (<div style={{background:pos?C.gnBg:C.rdBg,borderRadius:h/2,height:h,width:"100%"}}><div style={{width:w+"%",height:"100%",borderRadius:h/2,background:props.color||(pos?C.gn:C.rd),transition:"width .4s"}}/></div>);
}

function Pill(props){
  return (<button onClick={props.onClick} style={{padding:props.sm?"5px 12px":"7px 14px",borderRadius:10,fontSize:props.sm?11:12,fontWeight:600,border:"none",background:props.on?(props.clr||C.ac):"transparent",color:props.on?"#fff":C.tm,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{props.children}</button>);
}

function Badge(props){
  var pos=props.positive;
  return (<span style={{fontSize:12,fontWeight:700,lineHeight:1,color:pos?C.gn:C.rd,background:pos?C.gnBg:C.rdBg,padding:"5px 11px",borderRadius:8}}>{props.value}</span>);
}

function Tip(props){
  return (<span style={{position:"relative",display:"inline-flex",alignItems:"center",marginLeft:4,cursor:"help"}} className="info-tip">
    <InfoIcon size={13} color={C.td} strokeWidth={2}/>
    <span style={{position:"absolute",bottom:22,left:-80,width:220,background:C.sf,border:"1px solid "+C.bd,borderRadius:12,padding:"10px 12px",fontSize:11,color:C.tm,lineHeight:1.5,zIndex:100,boxShadow:"0 8px 24px rgba(0,0,0,0.1)",display:"none",pointerEvents:"none"}} className="info-box">
      <span style={{fontWeight:700,color:C.tx,display:"block",marginBottom:4}}>{props.title}</span>
      {props.text}
    </span>
  </span>);
}

function KPI(props){
  var Icon=props.icon;var color=props.color||C.ac;var bg=props.bg||C.acS;
  return (<div style={{...bx,flex:"1 1 170px",minWidth:155,display:"flex",flexDirection:"column",gap:8}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{width:30,height:30,borderRadius:9,background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={15} color={color} strokeWidth={2.2}/></span>
      <span style={{fontSize:12,color:C.tm,fontWeight:600}}>{props.label}{props.info&&<Tip title={props.label} text={props.info}/>}</span>
    </div>
    <span style={{fontSize:22,fontWeight:800,color:C.tx,letterSpacing:"-.03em"}}>{props.value}</span>
    {props.sub&&<span style={{fontSize:12,color:color,fontWeight:600}}>{props.sub}</span>}
  </div>);
}

function ST(props){return (<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px",color:C.tx}}>{props.children}</h3>);}

function Accordion(props){
  var Icon=props.icon;
  return (<div style={{...bx,marginBottom:14,padding:0,overflow:"hidden"}}>
    <button onClick={props.onToggle} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {Icon&&<Icon size={16} color={C.ac} strokeWidth={2.2}/>}
        <span style={{fontSize:15,fontWeight:700,color:C.tx}}>{props.title}</span>
        {props.badge&&<span style={{fontSize:11,fontWeight:600,color:C.tm,background:"rgba(120,118,126,0.08)",padding:"3px 8px",borderRadius:6}}>{props.badge}</span>}
      </div>
      <ChevronDown size={18} color={C.tm} strokeWidth={2} style={{transition:"transform .2s",transform:props.open?"rotate(180deg)":"rotate(0deg)"}}/>
    </button>
    {props.open&&<div style={{padding:"0 20px 20px"}}>{props.children}</div>}
  </div>);
}

export default function App(){
  var _s=useState("upload"),view=_s[0],setView=_s[1];
  var _ckMode=useState(false),ckMode=_ckMode[0],setCkMode=_ckMode[1];
  var _ckToken=useState(function(){try{return localStorage.getItem("wl_ck_token")||"";}catch(e){return "";}}),ckToken=_ckToken[0],setCkToken=_ckToken[1];
  var _ckTeam=useState(function(){try{return localStorage.getItem("wl_ck_team")||"";}catch(e){return "";}}),ckTeam=_ckTeam[0],setCkTeam=_ckTeam[1];
  var _ckFrom=useState(""),ckFrom=_ckFrom[0],setCkFrom=_ckFrom[1];
  var _ckTo=useState(""),ckTo=_ckTo[0],setCkTo=_ckTo[1];
  var _ckLoading=useState(false),ckLoading=_ckLoading[0],setCkLoading=_ckLoading[1];
  var _ckError=useState(""),ckError=_ckError[0],setCkError=_ckError[1];

  var importClickUp=function(){
    if(!ckToken||!ckTeam){setCkError("Inserisci token e Team ID");return;}
    if(!ckFrom||!ckTo){setCkError("Seleziona date di inizio e fine");return;}
    setCkLoading(true);setCkError("");
    try{localStorage.setItem("wl_ck_token",ckToken);localStorage.setItem("wl_ck_team",ckTeam);}catch(e){}

    var startMs=new Date(ckFrom).getTime();
    var endMs=new Date(ckTo+"T23:59:59").getTime();
    var hdrs={"Authorization":ckToken,"Content-Type":"application/json"};

    // Step 1: Get all team members
    fetch("https://api.clickup.com/api/v2/team/"+ckTeam,{headers:hdrs})
    .then(function(res){
      if(!res.ok)throw new Error("Errore team API: "+res.status);
      return res.json();
    })
    .then(function(teamData){
      var members=[];
      if(teamData.team&&teamData.team.members){
        members=teamData.team.members.map(function(m){return {id:m.user.id,name:m.user.username||m.user.email||""};});
      }
      if(members.length===0)throw new Error("Nessun membro trovato nel team");

      setCkError("Trovati "+members.length+" membri. Scaricando entries...");

      // Step 2: Fetch time entries for each member
      var allEntries=[];
      var membersDone=0;

      var fetchMemberEntries=function(userId,userName,page){
        fetch("https://api.clickup.com/api/v2/team/"+ckTeam+"/time_entries?start_date="+startMs+"&end_date="+endMs+"&assignee="+userId+"&page="+page,{headers:hdrs})
        .then(function(res){
          if(!res.ok)throw new Error("API error per "+userName+": "+res.status);
          return res.json();
        })
        .then(function(json){
          var entries=json.data||[];
          entries.forEach(function(e){e._userName=userName;});
          allEntries=allEntries.concat(entries);
          if(entries.length>=100){
            fetchMemberEntries(userId,userName,page+1);
          } else {
            membersDone++;
            setCkError("Scaricati "+membersDone+"/"+members.length+" membri ("+allEntries.length+" entries)...");
            if(membersDone>=members.length){
              finishImport(allEntries);
            }
          }
        })
        .catch(function(err){
          membersDone++;
          if(membersDone>=members.length)finishImport(allEntries);
        });
      };

      members.forEach(function(m){
        fetchMemberEntries(m.id,m.name,0);
      });
    })
    .catch(function(err){
      setCkError("Errore: "+err.message);
      setCkLoading(false);
    });

    var finishImport=function(allEntries){
      var mapped=allEntries.map(function(e){
        var user=e._userName||e.user&&e.user.username||"";
        var taskName=e.task?e.task.name||"":"";
        var taskTags=(e.task&&e.task.tags)||[];
        var tags=e.tags||taskTags||[];
        var tagNames=tags.map(function(t){return (t.name||"").toLowerCase().trim();}).filter(Boolean);
        var ext=tagNames.filter(function(t){return t!=="willab";});
        var client=ext.length>0?ext[0]:(tagNames.indexOf("willab")>=0?"willab":"");
        var space=e.task&&e.task.space?e.task.space.name||"":"";
        var list=e.task&&e.task.list?e.task.list.name||"":"";
        var dur=parseInt(e.duration||"0");
        var hours=dur/3600000;
        var startT=parseInt(e.start||"0");
        var d=startT>0?new Date(startT):null;
        var startHour=d?d.getHours():-1;
        var weekday=d?d.getDay():-1;
        var hasDesc=(e.description||"").trim().length>0;
        return {user:user,space:space,area:list,client:client,hours:hours,date:d,startHour:startHour,weekday:weekday,task:taskName,hasDesc:hasDesc};
      }).filter(function(r){return r.hours>0&&r.user&&r.date;});

      if(mapped.length===0){
        setCkError("Nessuna entry trovata nel periodo selezionato");
        setCkLoading(false);
        return;
      }

      setAllRec(mapped);
      setFn("ClickUp Import "+ckFrom+" → "+ckTo+" ("+mapped.length+" entries)");
      setView("dashboard");setTab("overview");
      setCkLoading(false);setCkError("");
      try{
        localStorage.setItem("wl_ck_source","clickup");
        localStorage.setItem("wl_ck_from",ckFrom);
        localStorage.setItem("wl_ck_to",ckTo);
      }catch(e){}
    };
  };
  var _a=useState([]),allRec=_a[0],setAllRec=_a[1];
  var _c=useState({}),cfg=_c[0],setCfg=_c[1];
  var _t=useState("overview"),tab=_t[0],setTab=_t[1];
  var _f=useState(""),fn=_f[0],setFn=_f[1];
  var _pm=useState("month"),pm=_pm[0],setPm=_pm[1];
  var _pi=useState(0),pi=_pi[0],setPi=_pi[1];
  var _cm=useState(""),cfgM=_cm[0],setCfgM=_cm[1];
  var _po=useState({clients:true,areas:false,people:false,trend:false}),profOpen=_po[0],setProfOpen=_po[1];
  var toggleProf=function(k){setProfOpen(function(prev){var n=Object.assign({},prev);n[k]=!n[k];return n;});};
  var _co=useState({internal:false,costs:true,fees:true,extras:false,budgets:false}),cfgOpen=_co[0],setCfgOpen=_co[1];
  var toggleCfg=function(k){setCfgOpen(function(prev){var n=Object.assign({},prev);n[k]=!n[k];return n;});};
  var _sync=useState("idle"),syncSt=_sync[0],setSyncSt=_sync[1];
  var _search=useState(""),search=_search[0],setSearch=_search[1];
  var _undo=useState(null),undoData=_undo[0],setUndoData=_undo[1];
  var _sortAZ=useState(false),sortAZ=_sortAZ[0],setSortAZ=_sortAZ[1];
  var _chartG=useState("month"),chartG=_chartG[0],setChartG=_chartG[1];
  var _clOpen=useState({}),clOpen=_clOpen[0],setClOpen=_clOpen[1];
  var toggleCl=function(name){setClOpen(function(prev){var n=Object.assign({},prev);n[name]=!n[name];return n;});};
  var _plOpen=useState({}),plOpen=_plOpen[0],setPlOpen=_plOpen[1];
  var togglePl=function(name){setPlOpen(function(prev){var n=Object.assign({},prev);n[name]=!n[name];return n;});};
  var _crNotes=useState({}),crNotes=_crNotes[0],setCrNotes=_crNotes[1];
  var setCrNote=function(client,val){setCrNotes(function(prev){var n=Object.assign({},prev);n[client]=val;return n;});};
  var undoTimer=useRef(null);
  var fr=useRef(null);


  var allMonths=useMemo(function(){
    var s=new Set();allRec.forEach(function(r){s.add(getMK(r.date));});return Array.from(s).sort();
  },[allRec]);

  var periods=useMemo(function(){
    if(!allRec.length)return [];
    var kf=pm==="week"?function(r){return getWK(r.date);}:pm==="month"?function(r){return getMK(r.date);}:pm==="quarter"?function(r){return getQK(r.date);}:function(){return "all";};
    var s=new Set();allRec.forEach(function(r){s.add(kf(r));});return Array.from(s).sort();
  },[allRec,pm]);

  var cp=periods[pi]||periods[periods.length-1]||"all";

  var pLabel=useMemo(function(){
    if(pm==="all")return "Tutto il periodo";
    if(pm==="month")return getML(cp);
    if(pm==="quarter")return cp.replace("-"," ");
    if(pm==="week")return "Sett. "+getWL(cp);
    return cp;
  },[pm,cp]);

  var records=useMemo(function(){
    if(pm==="all")return allRec;
    var kf=pm==="week"?function(r){return getWK(r.date);}:pm==="month"?function(r){return getMK(r.date);}:function(r){return getQK(r.date);};
    return allRec.filter(function(r){return kf(r)===cp;});
  },[allRec,pm,cp]);

  var people=useMemo(function(){var s=new Set();allRec.forEach(function(r){s.add(r.user);});return Array.from(s).sort();},[allRec]);
  var isInternal=function(cn){
    if(cn==="willab")return true;
    return cfg._internal&&cfg._internal[cn];
  };
  var setInternal=function(cn,val){setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));if(!n._internal)n._internal={};n._internal[cn]=val;return n;});};
  var isOverhead=function(pn){return cfg._overhead&&cfg._overhead[pn];};
  var setOverhead=function(pn,val){setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));if(!n._overhead)n._overhead={};n._overhead[pn]=val;return n;});};
  var extClients=useMemo(function(){var s=new Set();allRec.forEach(function(r){if(r.client&&!isInternal(r.client))s.add(r.client);});return Array.from(s).sort();},[allRec,cfg]);
  var allClients=useMemo(function(){var s=new Set();allRec.forEach(function(r){if(r.client)s.add(r.client);});return Array.from(s).sort();},[allRec]);

  var gc=function(p,m){
    if(cfg[m]&&cfg[m].costs&&cfg[m].costs[p]!==undefined)return cfg[m].costs[p];
    var sorted=allMonths.filter(function(mk){return mk<=m&&cfg[mk]&&cfg[mk].costs&&cfg[mk].costs[p]!==undefined;}).sort();
    if(sorted.length>0){var last=sorted[sorted.length-1];return cfg[last].costs[p];}
    return 0;
  };
  // Fee config: each client per month can have {monthly: X, oneshot: Y} or legacy {type, amount}
  var gfRaw=function(c,m){return (cfg[m]&&cfg[m].fees&&cfg[m].fees[c])||null;};
  // Normalize: support both old {type,amount} and new {monthly,oneshot} format
  var gfNorm=function(raw){
    if(!raw)return {monthly:0,oneshot:0};
    if(raw.monthly!==undefined||raw.oneshot!==undefined)return {monthly:raw.monthly||0,oneshot:raw.oneshot||0};
    // Legacy format
    if(raw.type==="monthly")return {monthly:raw.amount||0,oneshot:0};
    if(raw.type==="oneshot")return {monthly:0,oneshot:raw.amount||0};
    return {monthly:0,oneshot:0};
  };
  var gfMonthly=function(c,m){
    var raw=gfRaw(c,m);var n=gfNorm(raw);
    if(n.monthly)return n.monthly;
    // Fallback: most recent month with monthly fee
    var sorted=allMonths.filter(function(mk){return mk<=m;}).sort();
    for(var i=sorted.length-1;i>=0;i--){
      var r=gfNorm(gfRaw(c,sorted[i]));
      if(r.monthly)return r.monthly;
    }
    return 0;
  };
  var gfOneshot=function(c,m){return gfNorm(gfRaw(c,m)).oneshot;};
  // gf for backward compat
  var gf=function(c,m){
    var mo=gfMonthly(c,m),os=gfOneshot(c,m);
    return {type:mo?"monthly":"oneshot",amount:mo||os,monthly:mo,oneshot:os};
  };
  var getExtras=function(m){return (cfg[m]&&cfg[m].extras)||[];};
  var sc=function(p,m,v){setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));if(!n[m])n[m]={costs:{},fees:{},extras:[]};n[m].costs[p]=v;return n;});};
  var sf=function(c,m,f,v){setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));if(!n[m])n[m]={costs:{},fees:{},extras:[]};if(!n[m].fees[c])n[m].fees[c]={monthly:0,oneshot:0};
    // Migrate legacy format
    if(n[m].fees[c].type!==undefined){var old=n[m].fees[c];n[m].fees[c]={monthly:old.type==="monthly"?old.amount||0:0,oneshot:old.type==="oneshot"?old.amount||0:0};}
    n[m].fees[c][f]=v;return n;});};
  // Copy single cost to next month
  var copyCostNext=function(p,m){var nm=nextMK(m);var val=gc(p,m);sc(p,nm,val);};
  // Copy single fee to next month
  var copyFeeNext=function(c,m){var nm=nextMK(m);var norm={monthly:gfMonthly(c,m),oneshot:gfOneshot(c,m)};
    setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));if(!n[nm])n[nm]={costs:{},fees:{},extras:[]};n[nm].fees[c]=JSON.parse(JSON.stringify(norm));return n;});};
  // Copy single extra to next month
  var copyExtraNext=function(m,idx){var nm=nextMK(m);var exs=getExtras(m);if(!exs[idx])return;
    setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));if(!n[nm])n[nm]={costs:{},fees:{},extras:[]};if(!n[nm].extras)n[nm].extras=[];n[nm].extras.push(JSON.parse(JSON.stringify(exs[idx])));return n;});};
  var addExtra=function(m){setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));if(!n[m])n[m]={costs:{},fees:{},extras:[]};if(!n[m].extras)n[m].extras=[];n[m].extras.push({desc:"",amount:0,type:"client",client:"",person:""});return n;});};
  var updateExtra=function(m,idx,field,val){setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));if(n[m]&&n[m].extras&&n[m].extras[idx])n[m].extras[idx][field]=val;return n;});};
  // Remove extra with confirm + undo
  var removeExtra=function(m,idx){
    var ex=getExtras(m)[idx];
    if(!window.confirm("Eliminare questo costo extra"+(ex&&ex.desc?" ("+ex.desc+")":"")+"?"))return;
    var backup=JSON.parse(JSON.stringify(cfg));
    setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));if(n[m]&&n[m].extras)n[m].extras.splice(idx,1);return n;});
    // Show undo toast
    clearTimeout(undoTimer.current);
    setUndoData({label:"Costo extra eliminato",restore:backup});
    undoTimer.current=setTimeout(function(){setUndoData(null);},5000);
  };
  var doUndo=function(){if(undoData&&undoData.restore){setCfg(undoData.restore);setUndoData(null);clearTimeout(undoTimer.current);}};
  var copyNext=function(m){var nm=nextMK(m);setCfg(function(prev){var n=JSON.parse(JSON.stringify(prev));var src=n[m]||{costs:{},fees:{},extras:[]};n[nm]={costs:Object.assign({},src.costs),fees:Object.assign({},src.fees),extras:JSON.parse(JSON.stringify(src.extras||[]))};return n;});};
  // Budget management
  var addBudget=function(client,name,amount){
    setCfg(function(prev){
      var n=JSON.parse(JSON.stringify(prev));
      if(!n._budgets)n._budgets={};
      var id="b_"+Date.now();
      n._budgets[id]={client:client,name:name,amount:amount,spent:0};
      return n;
    });
  };
  var updateBudget=function(id,field,val){
    setCfg(function(prev){
      var n=JSON.parse(JSON.stringify(prev));
      if(n._budgets&&n._budgets[id])n._budgets[id][field]=val;
      return n;
    });
  };
  var removeBudget=function(id){
    if(!window.confirm("Eliminare questo budget?"))return;
    var backup=JSON.parse(JSON.stringify(cfg));
    setCfg(function(prev){
      var n=JSON.parse(JSON.stringify(prev));
      if(n._budgets)delete n._budgets[id];
      return n;
    });
    clearTimeout(undoTimer.current);
    setUndoData({label:"Budget eliminato",restore:backup});
    undoTimer.current=setTimeout(function(){setUndoData(null);},5000);
  };

  useEffect(function(){if(Object.keys(cfg).length>0){saveCfgLocal(cfg);setSyncSt("saving");sbSave({cfg:cfg},null,function(s){setSyncSt(s);setTimeout(function(){setSyncSt("idle");},2000);});}},[cfg]);

  var loadData=function(csvText,fileName){
    var mapped=mapRecords(parseCSV(csvText));
    if(!mapped.length)return false;
    setAllRec(mapped);setFn(fileName);
    setPm("month");
    var ms=Array.from(new Set(mapped.map(function(r){return getMK(r.date);}))).sort();
    setPi(ms.length-1);setCfgM(ms[ms.length-1]||"");
    setView("dashboard");setTab("overview");
    return true;
  };

  var handleFile=function(e){
    var file=e.target.files&&e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      var text=ev.target.result;
      if(loadData(text,file.name)){
        saveCSVLocal(text,file.name);
        sbSaveNow({csv_text:text,csv_name:file.name});
      }else{alert("Nessun record valido.");}
    };reader.readAsText(file);
  };

  // Auto-load: try Supabase first, fallback to localStorage
  useEffect(function(){
    var loaded=false;
    sbLoad().then(function(row){
      if(row&&row.csv_text){
        loaded=true;
        if(row.cfg&&Object.keys(row.cfg).length>0){setCfg(row.cfg);saveCfgLocal(row.cfg);}
        loadData(row.csv_text,row.csv_name||"cloud.csv");
        saveCSVLocal(row.csv_text,row.csv_name||"cloud.csv");
      } else {
        // Supabase empty, try localStorage
        var savedCfg=loadCfgLocal();if(Object.keys(savedCfg).length>0)setCfg(savedCfg);
        var savedCSV=loadCSVLocal();
        if(savedCSV){loadData(savedCSV.text,savedCSV.name);}
      }
    }).catch(function(){
      // Offline: use localStorage
      var savedCfg=loadCfgLocal();if(Object.keys(savedCfg).length>0)setCfg(savedCfg);
      var savedCSV=loadCSVLocal();
      if(savedCSV){loadData(savedCSV.text,savedCSV.name);}
    });
  },[]);

  var rateCalcGlobal=useMemo(function(){
    // Global: hours per person per month (for chartData / report monthly breakdowns)
    var personMonthHours={};
    allRec.forEach(function(r){
      var k=r.user+"|||"+getMK(r.date);
      personMonthHours[k]=(personMonthHours[k]||0)+r.hours;
    });
    return {pmh:personMonthHours};
  },[allRec]);

  var monthsInPeriod=useMemo(function(){
    if(pm==="all")return allMonths;
    var s=new Set();records.forEach(function(r){s.add(getMK(r.date));});return Array.from(s).sort();
  },[pm,records,allMonths]);

  // Rate map: based on period selected
  var rateCalc=useMemo(function(){
    var personPeriodCost={};
    var personPeriodHours={};

    // Hours in period per person
    records.forEach(function(r){
      personPeriodHours[r.user]=(personPeriodHours[r.user]||0)+r.hours;
    });

    // Sum configured costs only for months in period
    people.forEach(function(p){
      var total=0;
      monthsInPeriod.forEach(function(mk){
        var c=gc(p,mk);
        if(c>0)total+=c;
      });
      personPeriodCost[p]=total;
    });

    // Build rateMap: period €/h per person
    var rm={};
    var pmh=rateCalcGlobal.pmh;
    Object.keys(pmh).forEach(function(k){
      var parts=k.split("|||");
      var p=parts[0];
      if(isOverhead(p)){rm[k]=0;}
      else{
        var periodRate=personPeriodHours[p]>0?(personPeriodCost[p]||0)/personPeriodHours[p]:0;
        rm[k]=periodRate;
      }
    });
    return {rm:rm,ptc:personPeriodCost,pth:personPeriodHours};
  },[records,cfg,people,monthsInPeriod,rateCalcGlobal]);
  var rateMap=rateCalc.rm;
  var personTotalCost=rateCalc.ptc;
  var personTotalHours=rateCalc.pth;
  var rr=function(r){return rateMap[r.user+"|||"+getMK(r.date)]||0;};

  var getEF=useCallback(function(cn){
    var total=0;
    // 1. Monthly fees: for each month in period, get inherited monthly fee
    monthsInPeriod.forEach(function(mk){
      total+=gfMonthly(cn,mk);
    });
    // 2. Oneshot fees: scan ALL configured months for oneshot, distribute by hours in period
    var totalClientHours=allRec.filter(function(r){return r.client===cn;}).reduce(function(s,r){return s+r.hours;},0);
    var periodClientHours=0;
    monthsInPeriod.forEach(function(mk){
      periodClientHours+=allRec.filter(function(r){return r.client===cn&&getMK(r.date)===mk;}).reduce(function(s,r){return s+r.hours;},0);
    });
    allMonths.forEach(function(mk){
      var raw=gfRaw(cn,mk);
      if(raw&&raw.type==="oneshot"&&raw.amount){
        // Distribute proportionally to hours in this period vs total hours
        total+=totalClientHours>0?raw.amount*(periodClientHours/totalClientHours):0;
      }
    });
    return total;
  },[allRec,cfg,monthsInPeriod,allMonths]);

  // ── Previous period data for trends ──
  var prevRecords=useMemo(function(){
    if(pm!=="month"||pi<=0)return [];
    var prevKey=periods[pi-1];
    return allRec.filter(function(r){return getMK(r.date)===prevKey;});
  },[allRec,pm,pi,periods]);

  var prevData=useMemo(function(){
    if(!prevRecords.length)return null;
    var byC={};
    prevRecords.forEach(function(r){
      var rate=rr(r),cost=r.hours*rate;
      if(r.client){
        if(!byC[r.client])byC[r.client]={h:0,c:0};
        byC[r.client].h+=r.hours;byC[r.client].c+=cost;
      }
    });
    // compute fees for prev period
    var prevMk=periods[pi-1];
    var prevMonths=[prevMk];
    Object.keys(byC).forEach(function(cn){
      var cf=gf(cn,prevMk);
      var fee=0;
      if(cf&&cf.amount){
        if(cf.type==="monthly")fee=cf.amount;
        else if(cf.type==="oneshot"){
          var th=allRec.filter(function(r){return r.client===cn;}).reduce(function(s,r){return s+r.hours;},0);
          var mh=allRec.filter(function(r){return r.client===cn&&getMK(r.date)===prevMk;}).reduce(function(s,r){return s+r.hours;},0);
          fee=th>0?cf.amount*(mh/th):0;
        }
      }
      byC[cn].fee=fee;
      byC[cn].margin=fee-byC[cn].c;
      byC[cn].mp=fee>0?((fee-byC[cn].c)/fee)*100:0;
    });
    var tH=prevRecords.reduce(function(s,r){return s+r.hours;},0);
    var tC=prevRecords.reduce(function(s,r){return s+r.hours*rr(r);},0);
    return {byC:byC,tH:tH,tC:tC};
  },[prevRecords,rateMap,allRec,cfg,periods,pi]);

  // ── Monthly aggregates for trend charts ──
  var monthlyAgg=useMemo(function(){
    return allMonths.map(function(mk){
      var mRecs=allRec.filter(function(r){return getMK(r.date)===mk;});
      var mH=mRecs.reduce(function(s,r){return s+r.hours;},0);
      var mC=mRecs.reduce(function(s,r){return s+r.hours*rr(r);},0);
      // fees for this month
      var mF=0;
      var clients={};
      mRecs.forEach(function(r){if(r.client&&!isInternal(r.client)){clients[r.client]=(clients[r.client]||0)+r.hours;}});
      Object.keys(clients).forEach(function(cn){
        var cf=gf(cn,mk);if(!cf||!cf.amount)return;
        if(cf.type==="monthly")mF+=cf.amount;
        else if(cf.type==="oneshot"){
          var th=allRec.filter(function(r){return r.client===cn;}).reduce(function(s,r){return s+r.hours;},0);
          var mh=clients[cn]||0;
          mF+=th>0?cf.amount*(mh/th):0;
        }
      });
      // per person hours
      var pp={};mRecs.forEach(function(r){pp[r.user]=(pp[r.user]||0)+r.hours;});
      // per client margin
      var cc={};
      Object.keys(clients).forEach(function(cn){
        var cf=gf(cn,mk);var fee=0;
        if(cf&&cf.amount){if(cf.type==="monthly")fee=cf.amount;else if(cf.type==="oneshot"){var th=allRec.filter(function(r){return r.client===cn;}).reduce(function(s,r){return s+r.hours;},0);fee=th>0?cf.amount*(clients[cn]/th):0;}}
        var cost=mRecs.filter(function(r){return r.client===cn;}).reduce(function(s,r){return s+r.hours*rr(r);},0);
        cc[cn]={h:clients[cn],cost:cost,fee:fee,margin:fee-cost,mp:fee>0?((fee-cost)/fee)*100:0};
      });
      return {mk:mk,label:getML(mk),h:mH,c:mC,f:mF,m:mF-mC,mp:mF>0?((mF-mC)/mF)*100:0,pp:pp,cc:cc};
    });
  },[allRec,allMonths,rateMap,cfg]);

  var data=useMemo(function(){
    if(!records.length)return null;
    var byA={},byC={},byP={},byPA={},byCA={},bySp={};
    records.forEach(function(r){
      var rate=rr(r),cost=r.hours*rate;
      var excluded=isOverhead(r.user);
      var clientCost=excluded?0:cost; // excluded people don't add cost to clients
      if(!byA[r.area])byA[r.area]={h:0,c:0,pp:{},cl:{}};byA[r.area].h+=r.hours;byA[r.area].c+=clientCost;byA[r.area].pp[r.user]=1;if(r.client)byA[r.area].cl[r.client]=1;
      if(r.client){if(!byC[r.client])byC[r.client]={h:0,c:0,pp:{},aa:{}};byC[r.client].h+=r.hours;byC[r.client].c+=clientCost;byC[r.client].pp[r.user]=1;byC[r.client].aa[r.area]=1;}
      if(!byP[r.user])byP[r.user]={h:0,c:0,aa:{}};byP[r.user].h+=r.hours;byP[r.user].c+=cost;byP[r.user].aa[r.area]=1;
      var pk=r.user+"|||"+r.area;if(!byPA[pk])byPA[pk]={h:0,c:0};byPA[pk].h+=r.hours;byPA[pk].c+=clientCost;
      if(r.client){var ck=r.client+"|||"+r.area;if(!byCA[ck])byCA[ck]={h:0,c:0};byCA[ck].h+=r.hours;byCA[ck].c+=clientCost;}
      if(!bySp[r.space])bySp[r.space]={h:0,c:0};bySp[r.space].h+=r.hours;bySp[r.space].c+=cost;
    });
    var AL=Object.keys(byA).map(function(n){return {name:n,hours:byA[n].h,cost:byA[n].c,people:Object.keys(byA[n].pp)};}).sort(function(a,b){return b.hours-a.hours;});
    // Compute extras per month in period
    var extrasByClient={},extrasGeneral=0,extrasByPerson={};
    monthsInPeriod.forEach(function(mk){
      var extras=getExtras(mk);
      if(!extras)return;
      extras.forEach(function(ex){
        if(!ex.amount)return;
        if(ex.type==="client"&&ex.client){extrasByClient[ex.client]=(extrasByClient[ex.client]||0)+ex.amount;}
        else if(ex.type==="person"&&ex.person){extrasByPerson[ex.person]=(extrasByPerson[ex.person]||0)+ex.amount;}
        else if(ex.type==="general"){extrasGeneral+=ex.amount;}
        else if(ex.type==="recurring_client"&&ex.client){extrasByClient[ex.client]=(extrasByClient[ex.client]||0)+ex.amount;}
      });
    });
    var totalExtras=extrasGeneral;
    Object.keys(extrasByClient).forEach(function(k){totalExtras+=extrasByClient[k];});
    Object.keys(extrasByPerson).forEach(function(k){totalExtras+=extrasByPerson[k];});
    var CL=Object.keys(byC).map(function(n){
      var fee=getEF(n),isI=isInternal(n);
      var extraCost=(extrasByClient[n]||0);
      var totalCost=byC[n].c+extraCost;
      return {name:n,hours:byC[n].h,cost:byC[n].c,extraCost:extraCost,totalCost:totalCost,fee:fee,isI:isI,margin:fee-totalCost,mp:fee>0?((fee-totalCost)/fee)*100:0,people:Object.keys(byC[n].pp),areas:Object.keys(byC[n].aa)};
    }).sort(function(a,b){return b.hours-a.hours;});
    var PL=Object.keys(byP).map(function(n){
      var extraP=extrasByPerson[n]||0;
      var varCost=byP[n].c; // hourly cost (0 for fixed cost people)
      var fixCost=0;
      if(isOverhead(n)){monthsInPeriod.forEach(function(mk){fixCost+=gc(n,mk);});}
      var totalPersonCost=varCost+fixCost+extraP;
      var effectiveRate=byP[n].h>0?totalPersonCost/byP[n].h:0;
      return {name:n,hours:byP[n].h,cost:varCost,fixedCost:fixCost,extraCost:extraP,totalCost:totalPersonCost,rate:effectiveRate,isOverhead:isOverhead(n),areas:Object.keys(byP[n].aa)};
    }).sort(function(a,b){return b.hours-a.hours;});
    var SL=Object.keys(bySp).map(function(n){return {name:n,hours:bySp[n].h,cost:bySp[n].c};}).sort(function(a,b){return b.hours-a.hours;});
    var tH=records.reduce(function(s,r){return s+r.hours;},0);
    // Variable costs (hourly) + extras
    var tCvar=records.reduce(function(s,r){return s+r.hours*rr(r);},0)+totalExtras;
    // Fixed costs: sum monthly cost for fixed-cost people across months in period
    var tCfixed=0;
    monthsInPeriod.forEach(function(mk){
      people.forEach(function(p){
        if(isOverhead(p)){tCfixed+=gc(p,mk);}
      });
    });
    var tC=tCvar+tCfixed;
    var iH=CL.filter(function(c){return c.isI;}).reduce(function(s,c){return s+c.hours;},0);
    var iC=CL.filter(function(c){return c.isI;}).reduce(function(s,c){return s+c.cost;},0);
    var eC=CL.filter(function(c){return !c.isI;});
    var tF=eC.reduce(function(s,c){return s+c.fee;},0);

    // ── Area profitability: distribute client fees to areas by hours ──
    var areaRev={};
    eC.forEach(function(c){
      if(!c.fee)return;
      // hours per area for this client
      var aHours={};
      Object.keys(byCA).forEach(function(k){
        var parts=k.split("|||");
        if(parts[0]===c.name)aHours[parts[1]]=(aHours[parts[1]]||0)+byCA[k].h;
      });
      var totalCH=Object.values(aHours).reduce(function(s,v){return s+v;},0);
      if(totalCH>0){
        Object.keys(aHours).forEach(function(area){
          areaRev[area]=(areaRev[area]||0)+c.fee*(aHours[area]/totalCH);
        });
      }
    });
    AL.forEach(function(a){
      a.fee=areaRev[a.name]||0;
      a.margin=a.fee-a.cost;
      a.mp=a.fee>0?((a.fee-a.cost)/a.fee)*100:0;
    });

    // ── Person revenue: distribute client fees to people by hours ──
    var personRev={};
    eC.forEach(function(c){
      if(!c.fee)return;
      // hours per person for this client
      var pHours={};
      records.forEach(function(r){
        if(r.client===c.name)pHours[r.user]=(pHours[r.user]||0)+r.hours;
      });
      var totalPH=Object.values(pHours).reduce(function(s,v){return s+v;},0);
      if(totalPH>0){
        Object.keys(pHours).forEach(function(person){
          personRev[person]=(personRev[person]||0)+c.fee*(pHours[person]/totalPH);
        });
      }
    });
    PL.forEach(function(p){
      p.revenue=personRev[p.name]||0;
      p.margin=p.revenue-p.totalCost;
      p.mp=p.revenue>0?((p.revenue-p.totalCost)/p.revenue)*100:0;
    });

    return {AL:AL,CL:CL,PL:PL,SL:SL,byPA:byPA,byCA:byCA,tH:tH,tC:tC,iH:iH,iC:iC,tF:tF,tM:tF-tC,totalExtras:totalExtras,extrasGeneral:extrasGeneral};
  },[records,rateMap,getEF,cfg,monthsInPeriod]);

  // ── Chart data: group by month/quarter/semester/year ──
  var chartData=useMemo(function(){
    if(!allRec.length)return [];
    // Build monthly buckets
    var buckets={};
    allMonths.forEach(function(mk){
      // Costs for this month: use distributed rate × hours
      var mCost=0;
      people.forEach(function(p){
        var k=p+"|||"+mk;
        var rate=rateMap[k]||0;
        var hours=allRec.filter(function(r){return r.user===p&&getMK(r.date)===mk;}).reduce(function(s,r){return s+r.hours;},0);
        mCost+=rate*hours;
      });
      // Extras
      var exs=getExtras(mk);
      exs.forEach(function(ex){mCost+=(ex.amount||0);});
      // Fee/revenue
      var mRev=0;
      allClients.forEach(function(cn){
        mRev+=gfMonthly(cn,mk);
        // oneshot: only if explicitly set this month
        var os=gfOneshot(cn,mk);
        if(os>0)mRev+=os;
      });
      buckets[mk]={rev:mRev,cost:mCost,label:getML(mk)};
    });
    // Group by chartG
    var grouped=[];
    if(chartG==="month"){
      allMonths.forEach(function(mk){grouped.push(buckets[mk]);});
    } else {
      var gSize=chartG==="quarter"?3:chartG==="semester"?6:12;
      for(var i=0;i<allMonths.length;i+=gSize){
        var slice=allMonths.slice(i,i+gSize);
        var gr={rev:0,cost:0,label:""};
        slice.forEach(function(mk){gr.rev+=buckets[mk].rev;gr.cost+=buckets[mk].cost;});
        gr.label=slice.length>1?getML(slice[0])+" – "+getML(slice[slice.length-1]):getML(slice[0]);
        grouped.push(gr);
      }
    }
    grouped.forEach(function(g){g.margin=g.rev-g.cost;g.mp=g.rev>0?((g.rev-g.cost)/g.rev)*100:0;});
    return grouped;
  },[allRec,allMonths,chartG,cfg,people,allClients]);

  // ── Report generation ──
  var generateReport=function(){
    var extCL=CL.filter(function(c){return !c.isI;});
    var billH=tH-iH;
    var avgCostH=tH>0?tC/tH:0;
    var avgRevH=billH>0?tF/billH:0;

    // Trend per client
    var clientRows=extCL.map(function(c,i){
      var prev=prevData&&prevData.byC&&prevData.byC[c.name];
      var trend="—";
      if(prev){
        var prevMp=prev.mp||0;
        if(c.mp>prevMp+2)trend="📈 ↑"+(Math.round(c.mp-prevMp))+"%";
        else if(c.mp<prevMp-2)trend="📉 ↓"+(Math.round(prevMp-c.mp))+"%";
        else trend="➡️ stabile";
      }
      var profitIcon=c.fee>0?(c.margin>=0?"✅":"❌"):"⚪";
      return '<tr><td style="padding:8px 10px;border-bottom:1px solid #eee">'+profitIcon+' <span style="text-transform:capitalize;font-weight:600">'+c.name+'</span></td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">'+fmtH(c.hours)+'</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">'+fmt(c.cost)+'</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">'+(c.fee>0?fmt(c.fee):"—")+'</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:'+(c.margin>=0?"#059669":"#DC2626")+'">'+(c.fee>0?fmt(c.margin):"—")+'</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:'+(c.mp>=0?"#059669":"#DC2626")+'">'+(c.fee>0?(c.margin>=0?"+":"")+pct(c.mp):"—")+'</td><td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center">'+trend+'</td></tr>';
    }).join("");

    // Top 3 profit / Bottom 3
    var ranked=extCL.filter(function(c){return c.fee>0;}).sort(function(a,b){return b.mp-a.mp;});
    var top3=ranked.slice(0,3);
    var bot3=ranked.slice(-3).reverse();

    // Most used person
    var topP=PL[0];

    // Underpriced clients (most hours, low margin)
    var underpriced=extCL.filter(function(c){return c.fee>0&&c.hours>5;}).sort(function(a,b){return (a.fee/a.hours)-(b.fee/b.hours);}).slice(0,3);

    // Area distribution
    var areaRows=AL.map(function(a){
      return '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600">'+a.name+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">'+fmtH(a.hours)+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">'+pct(a.hours/tH*100)+'</td></tr>';
    }).join("");

    var html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report '+pLabel+' — Willab</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:32px 40px;color:#1a1a1a;font-size:13px;line-height:1.5;max-width:900px;margin:0 auto}h1{font-size:22px;font-weight:800;margin-bottom:4px}h2{font-size:16px;font-weight:700;margin:28px 0 12px;padding-bottom:6px;border-bottom:2px solid #7C6AF6;color:#7C6AF6}.subtitle{color:#888;font-size:12px;margin-bottom:24px}.kpi-row{display:flex;gap:12px;margin-bottom:24px}.kpi{flex:1;background:#f8f8fc;border-radius:10px;padding:14px 16px;border:1px solid #eee}.kpi .label{font-size:10px;color:#888;text-transform:uppercase;font-weight:600;letter-spacing:.08em}.kpi .val{font-size:20px;font-weight:800;margin-top:4px}.kpi .sub{font-size:11px;color:#888;margin-top:2px}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}th{padding:8px 10px;text-align:left;background:#f5f5f5;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#666;border-bottom:2px solid #ddd}.insight{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin-bottom:10px}.insight.warn{background:#fffbeb;border-color:#fde68a}.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}.badge.green{background:#d1fae5;color:#059669}.badge.red{background:#fee2e2;color:#dc2626}.badge.blue{background:#dbeafe;color:#2563eb}@media print{body{padding:16px}@page{margin:12mm;size:A4}}</style></head><body>';

    html+='<h1>📊 Willab Report — '+pLabel+'</h1>';
    html+='<div class="subtitle">Generato il '+new Date().toLocaleDateString("it-IT")+" · "+records.length+" entries · "+PL.length+" persone · "+extCL.length+' clienti</div>';

    // KPIs
    html+='<div class="kpi-row">';
    html+='<div class="kpi"><div class="label">Ore totali</div><div class="val">'+fmtH(tH)+'</div><div class="sub">di cui '+fmtH(iH)+' interne ('+pct(tH>0?iH/tH*100:0)+')</div></div>';
    html+='<div class="kpi"><div class="label">Costo team</div><div class="val">'+fmt(tC)+'</div><div class="sub">Media '+fmt(avgCostH)+'/h</div></div>';
    html+='<div class="kpi"><div class="label">Ricavi</div><div class="val" style="color:#059669">'+fmt(tF)+'</div><div class="sub">Media '+fmt(avgRevH)+'/h fatt.</div></div>';
    html+='<div class="kpi"><div class="label">Margine</div><div class="val" style="color:'+(tM>=0?"#059669":"#dc2626")+'">'+fmt(tM)+'</div><div class="sub">'+(tM>=0?"+":"")+pct(mPct)+' margine</div></div>';
    html+='</div>';

    // Cost vs Revenue hourly
    html+='<h2>💡 Costo orario vs Ricavo orario</h2>';
    html+='<div class="insight"><strong>Costo medio orario team:</strong> '+fmt(avgCostH)+'/h<br><strong>Ricavo medio orario (ore fatturabili):</strong> '+fmt(avgRevH)+'/h';
    if(avgRevH>avgCostH){html+='<br><span class="badge green">+'+(Math.round((avgRevH/avgCostH-1)*100))+'% sopra il costo</span>';}
    else if(avgCostH>0){html+='<br><span class="badge red">Il ricavo non copre il costo orario</span>';}
    html+='</div>';

    // Top person
    if(topP){
      html+='<h2>👤 Persona più utilizzata</h2>';
      html+='<div class="insight"><strong>'+topP.name+'</strong> — '+fmtH(topP.hours)+' ('+pct(topP.hours/tH*100)+' del totale)<br>Costo effettivo: '+fmt(topP.rate)+'/h · Costo periodo: '+fmt(topP.cost)+'</div>';
    }

    // Client table
    html+='<h2>🏷 Clienti — Dettaglio</h2>';
    html+='<table><thead><tr><th>Cliente</th><th style="text-align:right">Ore</th><th style="text-align:right">Costo</th><th style="text-align:right">Fee</th><th style="text-align:right">Margine</th><th style="text-align:right">%</th><th style="text-align:center">Trend</th></tr></thead><tbody>'+clientRows+'</tbody></table>';

    // Top 3 / Bottom 3
    if(ranked.length>=3){
      html+='<h2>🏆 Top 3 profittevoli</h2>';
      html+='<div class="insight">';
      top3.forEach(function(c,i){
        html+='<div style="margin-bottom:6px"><strong>'+(i+1)+'. <span style="text-transform:capitalize">'+c.name+'</span></strong> — margine '+fmt(c.margin)+' <span class="badge green">+'+pct(c.mp)+'</span></div>';
      });
      html+='</div>';

      html+='<h2>⚠️ Bottom 3</h2>';
      html+='<div class="insight warn">';
      bot3.forEach(function(c,i){
        html+='<div style="margin-bottom:6px"><strong>'+(i+1)+'. <span style="text-transform:capitalize">'+c.name+'</span></strong> — margine '+fmt(c.margin)+' <span class="badge '+(c.margin>=0?"blue":"red")+'">'+pct(c.mp)+'</span></div>';
      });
      html+='</div>';
    }

    // Underpriced
    if(underpriced.length>0){
      html+='<h2>🔍 Clienti sotto-prezzati</h2>';
      html+='<p style="color:#888;font-size:12px;margin-bottom:8px">Clienti con il ricavo orario più basso (fee ÷ ore).</p>';
      html+='<div class="insight warn">';
      underpriced.forEach(function(c){
        var rph=c.hours>0?c.fee/c.hours:0;
        html+='<div style="margin-bottom:6px"><strong style="text-transform:capitalize">'+c.name+'</strong> — '+fmt(rph)+'/h ricavo vs '+fmt(c.cost/c.hours)+'/h costo · <span class="badge '+(rph>c.cost/c.hours?"blue":"red")+'">'+(rph>c.cost/c.hours?"ok":"sotto costo")+'</span></div>';
      });
      html+='</div>';
    }

    // Area distribution
    html+='<h2>📊 Distribuzione ore per area</h2>';
    html+='<table><thead><tr><th>Area</th><th style="text-align:right">Ore</th><th style="text-align:right">%</th></tr></thead><tbody>'+areaRows+'</tbody></table>';

    // People table
    html+='<h2>👥 Team — Dettaglio persone</h2>';
    html+='<table><thead><tr><th>Persona</th><th style="text-align:right">Ore</th><th style="text-align:right">Costo</th><th style="text-align:right">Ricavo attr.</th><th style="text-align:right">Margine</th><th style="text-align:right">€/h costo</th></tr></thead><tbody>';
    PL.sort(function(a,b){return b.hours-a.hours;}).forEach(function(p){
      var mClr=p.margin>=0?"#059669":"#dc2626";
      html+='<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600">'+p.name+(p.isOverhead?' <span class="badge blue">fisso</span>':'')+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">'+fmtH(p.hours)+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">'+fmt(p.totalCost)+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">'+(p.revenue>0?fmt(p.revenue):"—")+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:'+mClr+'">'+(p.revenue>0?fmt(p.margin):"—")+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">'+fmt(p.rate)+'</td></tr>';
    });
    html+='</tbody></table>';

    // Monthly breakdown
    if(allMonths.length>1){
      html+='<h2>📅 Riepilogo mensile</h2>';
      html+='<table><thead><tr><th>Mese</th><th style="text-align:right">Ricavi</th><th style="text-align:right">Costi</th><th style="text-align:right">Margine</th><th style="text-align:right">%</th></tr></thead><tbody>';
      allMonths.forEach(function(mk){
        var mRev=0;var mCost=0;
        people.forEach(function(p){
          var k=p+"|||"+mk;
          var rate=rateMap[k]||0;
          var hours=allRec.filter(function(r){return r.user===p&&getMK(r.date)===mk;}).reduce(function(s,r){return s+r.hours;},0);
          mCost+=rate*hours;
        });
        var exs=getExtras(mk);exs.forEach(function(ex){mCost+=(ex.amount||0);});
        allClients.forEach(function(cn){mRev+=gfMonthly(cn,mk);var os=gfOneshot(cn,mk);if(os>0)mRev+=os;});
        var mM=mRev-mCost;var mMp=mRev>0?((mRev-mCost)/mRev)*100:0;
        var clr=mM>=0?"#059669":"#dc2626";
        html+='<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600">'+getML(mk)+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">'+fmt(mRev)+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">'+fmt(mCost)+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:'+clr+'">'+fmt(mM)+'</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:'+clr+'">'+pct(mMp)+'</td></tr>';
      });
      html+='</tbody></table>';
    }

    html+='<div style="margin-top:32px;padding-top:12px;border-top:1px solid #eee;color:#aaa;font-size:10px;text-align:center">Willab Analytics · Report generato automaticamente</div>';
    html+='</body></html>';

    var blob=new Blob([html],{type:"text/html;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;
    a.download="Willab-Report-"+pLabel.replace(/\s+/g,"-")+".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  var exportExcel=function(){
    var sep="\t";
    var rows=[];
    // Header
    rows.push(["Tipo","Nome","Ore","Costo","Fee","Margine","Margine %"].join(sep));
    // Clients
    var extCL2=CL.filter(function(c){return !c.isI;});
    extCL2.forEach(function(c){rows.push(["Cliente",c.name,c.hours.toFixed(1),c.totalCost.toFixed(0),c.fee.toFixed(0),c.margin.toFixed(0),c.fee>0?c.mp.toFixed(1):""].join(sep));});
    rows.push("");
    // Areas
    rows.push(["Tipo","Area","Ore","Costo","Ricavo attribuito","Margine","Margine %"].join(sep));
    AL.forEach(function(a){rows.push(["Area",a.name,a.hours.toFixed(1),a.cost.toFixed(0),(a.fee||0).toFixed(0),(a.margin||0).toFixed(0),a.fee>0?a.mp.toFixed(1):""].join(sep));});
    rows.push("");
    // People
    rows.push(["Tipo","Persona","Ore","Costo","Ricavo generato","Margine","Costo/h","Ricavo/h"].join(sep));
    PL.forEach(function(p){var revH=p.hours>0?(p.revenue||0)/p.hours:0;rows.push(["Persona",p.name,p.hours.toFixed(1),p.totalCost.toFixed(0),(p.revenue||0).toFixed(0),(p.margin||0).toFixed(0),p.rate.toFixed(1),revH.toFixed(1)].join(sep));});
    var tsv=rows.join("\n");
    var blob=new Blob([tsv],{type:"text/tab-separated-values;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");a.href=url;a.download="Willab-Export-"+pLabel.replace(/\s+/g,"-")+".tsv";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  };

  // ═══ CLIENT REPORT ═══
  var generateClientReport=function(clientName,notesText){
    var cRecs=records.filter(function(r){return r.client===clientName;});
    if(!cRecs.length){alert("Nessun dato per "+clientName+" nel periodo selezionato.");return;}
    
    // Aggregate by area
    var byArea={};
    cRecs.forEach(function(r){
      if(!byArea[r.area])byArea[r.area]={h:0,tasks:{}};
      byArea[r.area].h+=r.hours;
      if(r.task)byArea[r.area].tasks[r.task]=1;
    });
    var areas=Object.keys(byArea).map(function(a){return {name:a,h:byArea[a].h,tasks:Object.keys(byArea[a].tasks)};}).sort(function(a,b){return b.h-a.h;});
    var totalH=cRecs.reduce(function(s,r){return s+r.hours;},0);

    // People involved
    var pSet={};cRecs.forEach(function(r){pSet[r.user]=1;});
    var peopleList=Object.keys(pSet);

    // Period label
    var dates=cRecs.map(function(r){return r.date;}).filter(Boolean).sort(function(a,b){return a-b;});
    var fmtDate=function(d){return d.toLocaleDateString("it-IT",{day:"numeric",month:"long",year:"numeric"});};
    var periodStr=dates.length>0?fmtDate(dates[0])+" — "+fmtDate(dates[dates.length-1]):"";

    // Colors for areas
    var areaColors=["#7C5CFC","#AF52DE","#FF9500","#34C759","#007AFF","#FF3B30","#5856D6","#FF2D55","#00C7BE","#FF6482"];

    var html='<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>';
    html+='<title>Report — '+clientName+'</title>';
    html+='<style>';
    html+='*{margin:0;padding:0;box-sizing:border-box}';
    html+='body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",sans-serif;background:#f8f8fa;color:#1c1c1e;padding:32px 24px;max-width:680px;margin:0 auto;-webkit-font-smoothing:antialiased}';
    html+='.header{text-align:center;margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid #e5e5ea}';
    html+='.header h1{font-size:28px;font-weight:800;letter-spacing:-.03em;margin-bottom:6px;text-transform:capitalize}';
    html+='.header .period{font-size:14px;color:#8e8e93;margin-bottom:4px}';
    html+='.header .meta{font-size:13px;color:#aeaeb2}';
    html+='.section{margin-bottom:32px}';
    html+='.section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8e8e93;margin-bottom:14px}';
    html+='.kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px}';
    html+='.kpi{background:#fff;border-radius:14px;padding:18px 16px;text-align:center;border:1px solid #e5e5ea}';
    html+='.kpi .label{font-size:11px;font-weight:700;color:#8e8e93;letter-spacing:.06em;margin-bottom:6px;text-transform:uppercase}';
    html+='.kpi .value{font-size:28px;font-weight:800;color:#1c1c1e}';
    html+='.kpi .sub{font-size:12px;color:#aeaeb2;margin-top:2px}';
    html+='.area-card{background:#fff;border-radius:12px;padding:16px;margin-bottom:10px;border:1px solid #e5e5ea}';
    html+='.area-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}';
    html+='.area-name{font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px}';
    html+='.area-dot{width:10px;height:10px;border-radius:3px}';
    html+='.area-hours{font-size:14px;font-weight:700;color:#8e8e93}';
    html+='.area-bar{height:6px;border-radius:3px;background:#f2f2f7;margin-bottom:10px}';
    html+='.area-bar-fill{height:100%;border-radius:3px;transition:width .3s}';
    html+='.area-pct{font-size:12px;font-weight:600;color:#aeaeb2;margin-bottom:8px}';
    html+='.task-list{font-size:13px;color:#636366;line-height:1.7}';
    html+='.task-item{padding:2px 0;display:flex;align-items:center;gap:6px}';
    html+='.task-bullet{width:4px;height:4px;border-radius:99px;background:#c7c7cc;flex-shrink:0}';
    html+='.chart-container{background:#fff;border-radius:14px;padding:20px;border:1px solid #e5e5ea;margin-bottom:28px}';
    html+='.pie-row{display:flex;align-items:center;gap:20px}';
    html+='.pie-svg{width:120px;height:120px;flex-shrink:0}';
    html+='.pie-legend{flex:1}';
    html+='.pie-legend-item{display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13px}';
    html+='.pie-legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}';
    html+='.notes-box{background:#fff;border-radius:14px;padding:20px;border:1px solid #e5e5ea;font-size:14px;line-height:1.7;color:#3a3a3c;white-space:pre-wrap}';
    html+='.footer{text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #e5e5ea;font-size:11px;color:#c7c7cc}';
    html+='@media print{body{padding:20px;background:#fff}.area-card,.kpi,.chart-container,.notes-box{break-inside:avoid}@page{margin:1.5cm}}';
    html+='</style></head><body>';

    // Header
    html+='<div class="header">';
    html+='<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#7C5CFC,#AF52DE);margin:0 auto 14px;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:16px;font-weight:800">W</span></div>';
    html+='<h1>'+clientName+'</h1>';
    html+='<div class="period">Report attività — '+periodStr+'</div>';
    html+='<div class="meta">Generato il '+(new Date().toLocaleDateString("it-IT",{day:"numeric",month:"long",year:"numeric"}))+'</div>';
    html+='</div>';

    // KPIs
    html+='<div class="kpi-grid">';
    html+='<div class="kpi"><div class="label">Ore totali</div><div class="value">'+fmtH(totalH)+'</div></div>';
    html+='<div class="kpi"><div class="label">Team coinvolto</div><div class="value">'+peopleList.length+'</div><div class="sub">'+peopleList.join(", ")+'</div></div>';
    html+='<div class="kpi"><div class="label">Aree di attività</div><div class="value">'+areas.length+'</div></div>';
    html+='<div class="kpi"><div class="label">Attività svolte</div><div class="value">'+cRecs.reduce(function(s,r){return r.task?s+1:s;},0)+'</div><div class="sub">task tracciati</div></div>';
    html+='</div>';

    // Pie chart SVG
    html+='<div class="chart-container"><div class="section-title">Distribuzione ore per area</div><div class="pie-row">';
    // Build SVG pie
    html+='<svg class="pie-svg" viewBox="0 0 120 120">';
    var startAngle=0;
    areas.forEach(function(a,i){
      var pctA=a.h/totalH;
      var angle=pctA*360;
      var endAngle=startAngle+angle;
      var r=55;var cx=60;var cy=60;
      var x1=cx+r*Math.cos((startAngle-90)*Math.PI/180);
      var y1=cy+r*Math.sin((startAngle-90)*Math.PI/180);
      var x2=cx+r*Math.cos((endAngle-90)*Math.PI/180);
      var y2=cy+r*Math.sin((endAngle-90)*Math.PI/180);
      var largeArc=angle>180?1:0;
      if(pctA>=0.999){
        html+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+(areaColors[i%areaColors.length])+'"/>';
      } else if(pctA>0.001){
        html+='<path d="M '+cx+' '+cy+' L '+x1+' '+y1+' A '+r+' '+r+' 0 '+largeArc+' 1 '+x2+' '+y2+' Z" fill="'+(areaColors[i%areaColors.length])+'"/>';
      }
      startAngle=endAngle;
    });
    html+='</svg>';
    // Legend
    html+='<div class="pie-legend">';
    areas.forEach(function(a,i){
      var pctA=Math.round(a.h/totalH*100);
      html+='<div class="pie-legend-item"><div class="pie-legend-dot" style="background:'+(areaColors[i%areaColors.length])+'"></div><span style="flex:1;font-weight:600">'+a.name+'</span><span style="color:#8e8e93">'+fmtH(a.h)+' ('+pctA+'%)</span></div>';
    });
    html+='</div></div></div>';

    // Area details with tasks
    html+='<div class="section"><div class="section-title">Dettaglio per area</div>';
    areas.forEach(function(a,i){
      var pctA=Math.round(a.h/totalH*100);
      html+='<div class="area-card">';
      html+='<div class="area-header"><div class="area-name"><div class="area-dot" style="background:'+(areaColors[i%areaColors.length])+'"></div>'+a.name+'</div><div class="area-hours">'+fmtH(a.h)+'</div></div>';
      html+='<div class="area-bar"><div class="area-bar-fill" style="width:'+pctA+'%;background:'+(areaColors[i%areaColors.length])+'"></div></div>';
      if(a.tasks.length>0){
        html+='<div class="task-list">';
        a.tasks.sort().forEach(function(t){
          html+='<div class="task-item"><div class="task-bullet"></div>'+t+'</div>';
        });
        html+='</div>';
      }
      html+='</div>';
    });
    html+='</div>';

    // Notes
    if(notesText&&notesText.trim()){
      html+='<div class="section"><div class="section-title">Note</div>';
      html+='<div class="notes-box">'+notesText.replace(/[<]/g,"&lt;").replace(/[>]/g,"&gt;").replace(/\n/g,"<br/>")+'</div></div>';
    }

    // Footer
    html+='<div class="footer">Willab · Report generato automaticamente</div>';
    html+='</body></html>';

    // Download HTML file
    var blob=new Blob([html],{type:"text/html;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;
    a.download="Report-"+clientName.replace(/\s+/g,"-")+".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
  };

  // ═══ UPLOAD ═══
  if(view==="upload"){
    return (
      <div style={{minHeight:"100vh",background:C.bg,color:C.tx,fontFamily:"'SF Pro Display','SF Pro',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:24,WebkitFontSmoothing:"antialiased"}}>
        <div style={{maxWidth:460,width:"100%",textAlign:"center"}}>
          <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#7C5CFC,#AF52DE)",margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#fff",fontSize:20,fontWeight:800}}>W</span>
          </div>
          <h1 style={{fontSize:28,fontWeight:800,margin:"0 0 6px",letterSpacing:"-.03em",color:C.tx}}>Willab Analytics</h1>
          <p style={{color:C.tm,fontSize:14,lineHeight:1.6,marginBottom:32}}>Carica l'export Time Tracking di ClickUp</p>

          {/* Toggle CSV / ClickUp */}
          <div style={{display:"flex",gap:0,marginBottom:24,borderRadius:10,overflow:"hidden",border:"1px solid "+C.bd}}>
            <button onClick={function(){setCkMode(false);}} style={{flex:1,padding:"10px",fontSize:13,fontWeight:700,border:"none",background:!ckMode?C.ac:"transparent",color:!ckMode?"#fff":C.tm,cursor:"pointer",fontFamily:"inherit"}}>📄 CSV</button>
            <button onClick={function(){setCkMode(true);}} style={{flex:1,padding:"10px",fontSize:13,fontWeight:700,border:"none",background:ckMode?C.ac:"transparent",color:ckMode?"#fff":C.tm,cursor:"pointer",fontFamily:"inherit"}}>⚡ ClickUp API</button>
          </div>

          {!ckMode&&(<div>
          <div onClick={function(){fr.current&&fr.current.click();}} style={{...bx,padding:"48px 24px",cursor:"pointer",border:"2px dashed "+C.bd,background:C.sf}}>
            <div style={{width:44,height:44,borderRadius:12,background:C.acL,margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center"}}><Upload size={20} color={C.ac} strokeWidth={2}/></div>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4,color:C.tx}}>Carica CSV ClickUp</div>
            <div style={{color:C.tm,fontSize:13}}>Time Tracking Export (.csv)</div>
            <input ref={fr} type="file" accept=".csv,.tsv,.txt" style={{display:"none"}} onChange={handleFile}/>
          </div>
          </div>)}

          {ckMode&&(<div>
            <div style={{...bx,padding:20,textAlign:"left"}}>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:700,color:C.tm,display:"block",marginBottom:4,letterSpacing:".04em"}}>API TOKEN</label>
                <input type="password" value={ckToken} onChange={function(e){setCkToken(e.target.value);}} placeholder="pk_..." style={{...ix,width:"100%",fontSize:13}}/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:700,color:C.tm,display:"block",marginBottom:4,letterSpacing:".04em"}}>TEAM ID</label>
                <input type="text" value={ckTeam} onChange={function(e){setCkTeam(e.target.value);}} placeholder="9010073546" style={{...ix,width:"100%",fontSize:13}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:C.tm,display:"block",marginBottom:4,letterSpacing:".04em"}}>DA</label>
                  <input type="date" value={ckFrom} onChange={function(e){setCkFrom(e.target.value);}} style={{...ix,width:"100%",fontSize:13}}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:C.tm,display:"block",marginBottom:4,letterSpacing:".04em"}}>A</label>
                  <input type="date" value={ckTo} onChange={function(e){setCkTo(e.target.value);}} style={{...ix,width:"100%",fontSize:13}}/>
                </div>
              </div>
              {ckError&&<div style={{padding:"8px 12px",background:C.rdBg,borderRadius:8,marginBottom:12,fontSize:12,color:C.rd,fontWeight:600}}>{ckError}</div>}
              <button onClick={importClickUp} disabled={ckLoading} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:ckLoading?"#ccc":"linear-gradient(135deg,#7C5CFC,#AF52DE)",color:"#fff",fontSize:15,fontWeight:800,cursor:ckLoading?"wait":"pointer",fontFamily:"inherit"}}>
                {ckLoading?"Importando...":"Importa da ClickUp"}
              </button>
              <div style={{fontSize:11,color:C.td,marginTop:10,lineHeight:1.5}}>
                Token: ClickUp → Avatar → Settings → Apps → API Token<br/>
                Team ID: numero nell'URL di ClickUp (app.clickup.com/<b>XXXXXXX</b>/home)
              </div>
            </div>
          </div>)}
          <p style={{color:C.td,fontSize:12,marginTop:20}}>I dati restano nel browser e nel cloud.</p>
        </div>
      </div>
    );
  }

  // ═══ DASHBOARD ═══
  if(!data) return (<div style={{minHeight:"100vh",background:C.bg,color:C.tx,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'SF Pro Display',-apple-system,sans-serif"}}>Caricamento...</div>);

  var AL=data.AL,CL=data.CL,PL=data.PL,SL=data.SL,byPA=data.byPA,byCA=data.byCA,tH=data.tH,tC=data.tC,iH=data.iH,iC=data.iC,tF=data.tF,tM=data.tM;
  var canP=pm!=="all"&&pi>0,canN=pm!=="all"&&pi<periods.length-1;
  var mPct=tF>0?(tM/tF)*100:0;
  var hasC=monthsInPeriod.some(function(m){
    // Direct config or inherited from earlier months
    if(cfg[m]&&cfg[m].costs&&Object.values(cfg[m].costs).some(function(v){return v>0;}))return true;
    var earlier=allMonths.filter(function(mk){return mk<=m&&cfg[mk]&&cfg[mk].costs&&Object.values(cfg[mk].costs).some(function(v){return v>0;});});
    return earlier.length>0;
  });
  var cm=cfgM||allMonths[allMonths.length-1]||"";
  var cfgCosts=(cfg[cm]&&cfg[cm].costs)||{};
  var cfgFees=(cfg[cm]&&cfg[cm].fees)||{};
  var cfgHasNxt=allMonths.indexOf(nextMK(cm))>=0;

  var extCL=CL.filter(function(c){return !c.isI;});

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.tx,fontFamily:"'SF Pro Display','SF Pro',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif",WebkitFontSmoothing:"antialiased"}}>
      {/* Header */}
      <div style={{background:"rgba(255,255,255,0.72)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid "+C.bdL,padding:"11px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#7C5CFC,#AF52DE)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:13,fontWeight:800}}>W</span></div>
          <span style={{fontSize:15,fontWeight:700,letterSpacing:"-.01em"}}>Willab Analytics</span>
          <span style={{fontSize:12,color:C.td,marginLeft:4}}>{fn}</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={generateReport} style={{background:C.sf,border:"1px solid "+C.bd,borderRadius:9,padding:"6px 13px",fontSize:12,fontWeight:600,color:C.ts,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}><FileText size={14} strokeWidth={2}/> Report</button>
          <button onClick={exportExcel} style={{background:C.sf,border:"1px solid "+C.bd,borderRadius:9,padding:"6px 13px",fontSize:12,fontWeight:600,color:C.ts,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}><Download size={14} strokeWidth={2}/> Excel</button>
          <button onClick={function(){if(window.confirm("Vuoi caricare un nuovo CSV? I costi e le fee restano salvati.")){clearCSVLocal();sbSaveNow({csv_text:null,csv_name:null});setView("upload");setAllRec([]);}}} style={{background:C.sf,border:"1px solid "+C.bd,borderRadius:9,padding:"6px 13px",fontSize:12,fontWeight:600,color:C.tm,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}><RotateCcw size={13} strokeWidth={2}/> Nuovo</button>
          {syncSt!=="idle"&&<span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:syncSt==="saving"?C.am:syncSt==="saved"?C.gn:C.rd,fontWeight:600}}>
            {syncSt==="saving"&&<Loader size={12} strokeWidth={2} style={{animation:"spin 1s linear infinite"}}/>}
            {syncSt==="saved"&&<Check size={12} strokeWidth={2.5}/>}
            {syncSt==="saving"?"Salvando...":"Salvato ✓"}
          </span>}
        </div>
      </div>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"20px 24px"}}>
        {/* Period */}
        <div style={{...bx,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:3}}>
            {["week","month","quarter","all"].map(function(k){return (<Pill key={k} sm on={pm===k} onClick={function(){setPm(k);if(k==="all")setPi(0);else{var kf=k==="week"?function(r){return getWK(r.date);}:k==="month"?function(r){return getMK(r.date);}:function(r){return getQK(r.date);};var ks=Array.from(new Set(allRec.map(kf))).sort();setPi(ks.length-1);}}}>{k==="week"?"Settimana":k==="month"?"Mese":k==="quarter"?"Trimestre":"Tutto"}</Pill>);})}
          </div>
          {pm!=="all"&&(
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button onClick={function(){if(canP)setPi(function(i){return i-1;});}} style={{background:"transparent",border:"1px solid "+(canP?C.bd:C.bdL),borderRadius:7,padding:"3px 8px",color:canP?C.ts:C.td,cursor:canP?"pointer":"default",display:"flex",alignItems:"center"}}><ChevronLeft size={16}/></button>
              <span style={{fontSize:14,fontWeight:700,minWidth:140,textAlign:"center"}}>{pLabel}</span>
              <button onClick={function(){if(canN)setPi(function(i){return i+1;});}} style={{background:"transparent",border:"1px solid "+(canN?C.bd:C.bdL),borderRadius:7,padding:"3px 8px",color:canN?C.ts:C.td,cursor:canN?"pointer":"default",display:"flex",alignItems:"center"}}><ChevronRight size={16}/></button>
            </div>
          )}
          <span style={{fontSize:11,color:C.tm}}>{records.length} entries{!hasC&&<span style={{color:C.am,marginLeft:6}}>⚠ Imposta costi</span>}</span>
        </div>

        {/* KPIs */}
        <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:18}}>
          <KPI icon={Clock} label="Ore totali" value={fmtH(tH)} sub={PL.length+" persone"} color={C.bl} bg={C.blBg} info="Somma di tutte le ore tracciate nel periodo selezionato, incluse ore interne."/>
          <KPI icon={DollarSign} label="Costo team" value={fmt(tC)} sub={tH>0?fmt(tC/tH)+"/h":"—"} color={C.am} bg={C.amBg} info="Somma dei costi di tutto il team. Costo orario = costo mensile persona / ore tracciate quel mese."/>
          <KPI icon={Home} label="Ore interne" value={fmtH(iH)} sub={fmt(iC)} color={C.sl} bg="rgba(142,142,147,0.06)" info="Ore taggate [willab] senza fee associata (riunioni, admin, formazione)."/>
          <KPI icon={TrendingUp} label="Margine" value={fmt(tM)} sub={tF>0?(tM>=0?"+":"")+pct(mPct):"Imposta fee →"} color={tM>=0?C.gn:C.rd} bg={tM>=0?C.gnBg:C.rdBg} info="Margine = Fee clienti - Costi totali team. La % indica il margine sui ricavi."/>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:2,marginBottom:18,background:C.sf,borderRadius:13,padding:3,border:"1px solid "+C.bdL,width:"fit-content"}}>
          {[[LayoutDashboard,"overview","Overview"],[FolderOpen,"areas","Aree"],[Tag,"clients","Clienti"],[PieChart,"profitability","Marginalità"],[Users,"team","Team"],[DollarSign,"extras","Costi Extra"],[Settings,"config","Config"]].map(function(t){var Icon=t[0];return (<button key={t[1]} onClick={function(){setTab(t[1]);setSearch("");}} style={{padding:"7px 14px",borderRadius:10,fontSize:12,fontWeight:600,border:"none",background:tab===t[1]?C.ac:"transparent",color:tab===t[1]?"#fff":C.tm,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}}><Icon size={14} strokeWidth={tab===t[1]?2.4:2}/> {t[2]}</button>);})}
        </div>

        {/* SEARCH BAR + SORT - shown on clients, people, areas, team */}
        {(tab==="clients"||tab==="areas"||tab==="team")&&(
          <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
            <div style={{position:"relative",flex:1}}>
              <Search size={15} color={C.td} strokeWidth={2} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
              <input type="text" value={search} onChange={function(e){setSearch(e.target.value);}} placeholder={"Cerca "+(tab==="clients"?"cliente":tab==="team"?"persona":"area")+"..."} style={{...ix,width:"100%",paddingLeft:36,fontSize:13}}/>
            </div>
            <button onClick={function(){setSortAZ(!sortAZ);}} style={{...ix,padding:"9px 12px",fontSize:12,fontWeight:700,color:sortAZ?C.ac:C.tm,border:"1px solid "+(sortAZ?C.ac:C.bd),background:sortAZ?C.acL:C.sf,cursor:"pointer",whiteSpace:"nowrap",borderRadius:9}}>{sortAZ?"A→Z":"Ore ↓"}</button>
          </div>
        )}

        {/* OVERVIEW */}
        {tab==="overview"&&(
          <div>
            {/* Top KPIs extended */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
              <div style={{...bx,textAlign:"center",background:C.gnBg,border:"1px solid rgba(52,199,89,0.15)"}}><div style={{fontSize:11,color:C.gn,fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>RICAVI</div><div style={{fontSize:24,fontWeight:800,color:C.gn}}>{fmt(tF)}</div></div>
              <div style={{...bx,textAlign:"center",background:C.rdBg,border:"1px solid rgba(255,59,48,0.15)"}}><div style={{fontSize:11,color:C.rd,fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>COSTI</div><div style={{fontSize:24,fontWeight:800,color:C.rd}}>{fmt(tC)}</div></div>
              <div style={{...bx,textAlign:"center",background:tM>=0?C.gnBg:C.rdBg,border:"1px solid "+(tM>=0?"rgba(52,199,89,0.15)":"rgba(255,59,48,0.15)")}}><div style={{fontSize:11,color:tM>=0?C.gn:C.rd,fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>MARGINE</div><div style={{fontSize:24,fontWeight:800,color:tM>=0?C.gn:C.rd}}>{fmt(tM)}{tF>0&&<span style={{fontSize:13,marginLeft:6}}>({(tM>=0?"+":"")+pct(mPct)})</span>}</div></div>
            </div>

            {/* Alerts */}
            {(function(){
              var alerts=[];
              if(!hasC)alerts.push({type:"warn",text:"Costi team non configurati — vai in Config"});
              var noFee=extCL.filter(function(c){return !c.fee||c.fee===0;});
              if(noFee.length>0)alerts.push({type:"warn",text:noFee.length+" client"+(noFee.length>1?"i":"e")+" senza fee: "+noFee.map(function(c){return c.name;}).join(", ")});
              var losing=extCL.filter(function(c){return c.fee>0&&c.margin<0;});
              if(losing.length>0)alerts.push({type:"bad",text:losing.length+" client"+(losing.length>1?"i":"e")+" in perdita: "+losing.map(function(c){return c.name+" ("+fmt(c.margin)+")";}).join(", ")});
              var overH=PL.filter(function(p){return p.hours>160;});
              if(overH.length>0)alerts.push({type:"info",text:overH.map(function(p){return p.name;}).join(", ")+" ha/hanno oltre 160h"});
              var lowMargin=extCL.filter(function(c){return c.fee>0&&c.mp<10&&c.mp>=0;});
              if(lowMargin.length>0)alerts.push({type:"info",text:"Margine sotto 10%: "+lowMargin.map(function(c){return c.name+" ("+pct(c.mp)+")";}).join(", ")});
              if(alerts.length===0)alerts.push({type:"good",text:"Tutto nella norma — nessuna anomalia rilevata"});
              return (<div style={{marginBottom:18}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={15} strokeWidth={2.2}/> Insights</div>
                {alerts.map(function(a,i){
                  var bg=a.type==="bad"?C.rdBg:a.type==="warn"?C.amBg:a.type==="good"?C.gnBg:C.blBg;
                  var clr=a.type==="bad"?C.rd:a.type==="warn"?C.am:a.type==="good"?C.gn:C.bl;
                  var bdr=a.type==="bad"?"rgba(255,59,48,0.15)":a.type==="warn"?"rgba(255,149,0,0.15)":a.type==="good"?"rgba(52,199,89,0.15)":"rgba(0,122,255,0.15)";
                  return (<div key={i} style={{...bx,padding:"12px 16px",marginBottom:8,background:bg,border:"1px solid "+bdr}}><span style={{fontSize:13,color:clr,fontWeight:600}}>{a.type==="bad"?"⚠ ":a.type==="warn"?"⚡ ":a.type==="good"?"✓ ":"ℹ "}{a.text}</span></div>);
                })}
              </div>);
            })()}

            {/* Quick stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
              {/* Top 3 clients by margin */}
              <div style={{...bx}}>
                <div style={{fontSize:12,fontWeight:700,color:C.tm,marginBottom:12}}>Top clienti per margine</div>
                {extCL.filter(function(c){return c.fee>0;}).sort(function(a,b){return b.margin-a.margin;}).slice(0,3).map(function(c,i){
                  return (<div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<2?"1px solid "+C.bdL:"none"}}>
                    <span style={{fontSize:13,fontWeight:600,textTransform:"capitalize"}}>{c.name}</span>
                    <span style={{fontSize:13,fontWeight:700,color:c.margin>=0?C.gn:C.rd}}>{fmt(c.margin)}</span>
                  </div>);
                })}
              </div>
              {/* Top 3 people by revenue */}
              <div style={{...bx}}>
                <div style={{fontSize:12,fontWeight:700,color:C.tm,marginBottom:12}}>Top persone per margine</div>
                {PL.filter(function(p){return p.margin!==undefined;}).sort(function(a,b){return (b.margin||0)-(a.margin||0);}).slice(0,3).map(function(p,i){
                  var m=p.margin||0;
                  return (<div key={p.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<2?"1px solid "+C.bdL:"none"}}>
                    <span style={{fontSize:13,fontWeight:600}}>{p.name}</span>
                    <span style={{fontSize:13,fontWeight:700,color:m>=0?C.gn:C.rd}}>{fmt(m)}</span>
                  </div>);
                })}
              </div>
            </div>

            {/* Hours distribution by area */}
            <div style={{...bx,marginBottom:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.tm,marginBottom:14}}>Distribuzione ore per area</div>
              {AL.slice(0,6).map(function(a){
                return (<div key={a.name} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{fontWeight:600}}>{a.name}</span>
                    <span style={{color:C.tm}}>{fmtH(a.hours)} ({pct(a.hours/tH*100)})</span>
                  </div>
                  <div style={{height:6,background:C.bdL,borderRadius:3}}><div style={{height:"100%",borderRadius:3,background:gac(a.name),width:pct(a.hours/(AL[0]?AL[0].hours:1)*100),opacity:0.75}}/></div>
                </div>);
              })}
            </div>

            {/* Temporal chart: Ricavi vs Costi */}
            {chartData.length>0&&(
              <div style={{...bx,marginBottom:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.tm}}>Andamento ricavi vs costi</div>
                  <div style={{display:"flex",gap:3}}>
                    {[["month","Mese"],["quarter","Trim."],["semester","Sem."],["year","Anno"]].map(function(g){
                      return (<button key={g[0]} onClick={function(){setChartG(g[0]);}} style={{padding:"4px 10px",borderRadius:7,fontSize:10,fontWeight:700,border:"1px solid "+(chartG===g[0]?C.ac:C.bd),background:chartG===g[0]?C.acL:"transparent",color:chartG===g[0]?C.ac:C.tm,cursor:"pointer",fontFamily:"inherit"}}>{g[1]}</button>);
                    })}
                  </div>
                </div>
                {chartData.length===1&&(
                  <div style={{padding:"16px 0",textAlign:"center",color:C.tm,fontSize:12}}>
                    <div style={{marginBottom:6,fontWeight:600}}>{chartData[0].label}</div>
                    <div style={{display:"flex",justifyContent:"center",gap:20}}>
                      <div><span style={{color:C.gn,fontWeight:700}}>{fmt(chartData[0].rev)}</span><div style={{fontSize:10,color:C.tm}}>Ricavi</div></div>
                      <div><span style={{color:C.rd,fontWeight:700}}>{fmt(chartData[0].cost)}</span><div style={{fontSize:10,color:C.tm}}>Costi</div></div>
                      <div><span style={{color:chartData[0].margin>=0?C.gn:C.rd,fontWeight:700}}>{fmt(chartData[0].margin)}</span><div style={{fontSize:10,color:C.tm}}>Margine</div></div>
                    </div>
                    <div style={{fontSize:11,color:C.td,marginTop:10}}>Servono più mesi per visualizzare il grafico a barre con questa aggregazione.</div>
                  </div>
                )}
                {chartData.length>1&&(<div>
                {/* Legend */}
                <div style={{display:"flex",gap:16,marginBottom:12,fontSize:11}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.gn}}/><span style={{color:C.tm}}>Ricavi</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.rd}}/><span style={{color:C.tm}}>Costi</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.ac+"44"}}/><span style={{color:C.tm}}>Margine</span></div>
                </div>
                {/* Bar chart */}
                {(function(){
                  var maxVal=Math.max.apply(null,chartData.map(function(d){return Math.max(d.rev,d.cost);}));
                  if(maxVal===0)maxVal=1;
                  var barH=120;
                  return (<div>
                    <div style={{display:"flex",gap:4,alignItems:"flex-end",height:barH,marginBottom:6}}>
                      {chartData.map(function(d,i){
                        var rH=d.rev/maxVal*barH;
                        var cH=d.cost/maxVal*barH;
                        var w=Math.max(12,Math.floor((100/chartData.length/2)-2));
                        return (<div key={i} style={{flex:1,display:"flex",gap:2,justifyContent:"center",alignItems:"flex-end",height:"100%"}}>
                          <div style={{width:w+"%",maxWidth:24,height:Math.max(2,rH),background:C.gn,borderRadius:"3px 3px 0 0",transition:"height 0.3s"}} title={"Ricavi: "+fmt(d.rev)}/>
                          <div style={{width:w+"%",maxWidth:24,height:Math.max(2,cH),background:C.rd,borderRadius:"3px 3px 0 0",transition:"height 0.3s"}} title={"Costi: "+fmt(d.cost)}/>
                        </div>);
                      })}
                    </div>
                    {/* Labels */}
                    <div style={{display:"flex",gap:4}}>
                      {chartData.map(function(d,i){
                        return (<div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:C.tm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.label}</div>);
                      })}
                    </div>
                    {/* Margin row */}
                    <div style={{display:"flex",gap:4,marginTop:6}}>
                      {chartData.map(function(d,i){
                        return (<div key={i} style={{flex:1,textAlign:"center",fontSize:10,fontWeight:700,color:d.margin>=0?C.gn:C.rd}}>{d.margin!==0?fmt(d.margin):"—"}</div>);
                      })}
                    </div>
                  </div>);
                })()}
                </div>)}
              </div>
            )}
          </div>
        )}

        {/* AREE */}
        {tab==="areas"&&(
          <div>{AL.filter(function(a){return !search||a.name.toLowerCase().indexOf(search.toLowerCase())>=0;}).sort(function(a,b){return sortAZ?a.name.localeCompare(b.name):b.hours-a.hours;}).map(function(a){
            return (<div key={a.name} style={{...bx,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:10,height:10,borderRadius:3,background:gac(a.name)}}/><span style={{fontSize:14,fontWeight:700}}>{a.name}</span></div>
                <span style={{fontSize:15,fontWeight:800,color:gac(a.name)}}>{fmtH(a.hours)}</span>
              </div>
              <Bar value={a.hours} max={AL[0]?AL[0].hours:1} color={gac(a.name)} positive={true}/>
              <div style={{fontSize:12,color:C.tm,marginTop:4}}>{fmt(a.cost)+" · "+a.people.length+" pers. · "+pct(a.hours/tH*100)}</div>
            </div>);
          })}</div>
        )}

        {/* CLIENTS */}
        {tab==="clients"&&(
          <div>{CL.filter(function(c){return !search||c.name.toLowerCase().indexOf(search.toLowerCase())>=0;}).sort(function(a,b){return sortAZ?a.name.localeCompare(b.name):b.hours-a.hours;}).map(function(c,ci){
            var clr=c.isI?C.sl:gcc(ci);
            var fee=c.fee||0;
            var margin=fee>0?fee-c.totalCost:0;
            var mp=fee>0?((fee-c.totalCost)/fee)*100:0;
            var pos=margin>=0;
            var isOpen=clOpen[c.name];
            return (<div key={c.name} style={{...bx,marginBottom:10,opacity:c.isI?0.7:1,overflow:"hidden"}}>
              {/* Accordion header */}
              <div onClick={function(){toggleCl(c.name);}} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"2px 0"}}>
                <span style={{width:10,height:10,borderRadius:3,background:clr,flexShrink:0}}/>
                <span style={{fontSize:15,fontWeight:700,textTransform:"capitalize",flex:1}}>{c.name}</span>
                {c.isI&&<span style={{fontSize:9,color:C.sl,background:"rgba(142,142,147,0.1)",padding:"2px 7px",borderRadius:6}}>Interno</span>}
                {!c.isI&&fee>0&&<span style={{fontSize:12,fontWeight:700,color:pos?C.gn:C.rd}}>{(pos?"+":"")+pct(mp)}</span>}
                <span style={{fontSize:12,color:C.tm,fontWeight:600}}>{fmtH(c.hours)}</span>
                <ChevronDown size={14} color={C.tm} style={{transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}/>
              </div>
              {/* Accordion body */}
              {isOpen&&(<div style={{marginTop:14}}>
                <div style={{display:"grid",gridTemplateColumns:c.isI?"1fr 1fr":"1fr 1fr 1fr",gap:10}}>
                  <div style={{background:C.amBg,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:10,fontWeight:600,color:C.am,marginBottom:4,letterSpacing:".04em"}}>COSTO</div>
                    <div style={{fontSize:16,fontWeight:800,color:C.tx}}>{fmt(c.totalCost)}</div>
                    {c.hours>0&&<div style={{fontSize:10,color:C.tm,marginTop:2}}>{fmt(c.totalCost/c.hours)}/h</div>}
                  </div>
                  {!c.isI&&<div style={{background:fee>0?C.blBg:"rgba(142,142,147,0.06)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:10,fontWeight:600,color:fee>0?C.bl:C.td,marginBottom:4,letterSpacing:".04em"}}>FEE</div>
                    <div style={{fontSize:16,fontWeight:800,color:fee>0?C.tx:C.td}}>{fee>0?fmt(fee):"—"}</div>
                    {fee>0&&c.hours>0&&<div style={{fontSize:10,color:C.tm,marginTop:2}}>{fmt(fee/c.hours)}/h</div>}
                  </div>}
                  <div style={{background:fee>0?(pos?C.gnBg:C.rdBg):"rgba(142,142,147,0.06)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:10,fontWeight:600,color:fee>0?(pos?C.gn:C.rd):C.td,marginBottom:4,letterSpacing:".04em"}}>{c.isI?"ORE":"MARGINE"}</div>
                    {c.isI?(<div style={{fontSize:16,fontWeight:800,color:C.tx}}>{fmtH(c.hours)}</div>):(<div style={{fontSize:16,fontWeight:800,color:fee>0?(pos?C.gn:C.rd):C.td}}>{fee>0?fmt(margin):"—"}</div>)}
                    {!c.isI&&fee>0&&<div style={{fontSize:10,color:pos?C.gn:C.rd,marginTop:2}}>{(pos?"+":"")+pct(mp)}</div>}
                  </div>
                </div>
                {/* Break-even */}
                {!c.isI&&fee>0&&c.hours>0&&c.totalCost>0&&(function(){
                  var costPerH=c.totalCost/c.hours;
                  var beHours=costPerH>0?fee/costPerH:0;
                  var usedPct=beHours>0?(c.hours/beHours)*100:0;
                  var over=c.hours>beHours;
                  return (<div style={{marginTop:10,padding:"8px 12px",background:over?C.rdBg:C.gnBg,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:11,color:over?C.rd:C.gn,fontWeight:600}}>Break-even: {Math.round(beHours)}h</div>
                    <div style={{fontSize:11,fontWeight:700,color:over?C.rd:C.gn}}>{fmtH(c.hours)} / {Math.round(beHours)}h ({pct(usedPct)})</div>
                  </div>);
                })()}
                {/* People on this client */}
                {c.people.length>0&&(<div style={{marginTop:10,fontSize:12,color:C.tm}}>
                  <span style={{fontWeight:600}}>Team:</span> {c.people.join(", ")}
                </div>)}
                {/* Budget projects */}
                {cfg._budgets&&(function(){
                  var budgets=Object.keys(cfg._budgets).filter(function(k){return cfg._budgets[k]&&cfg._budgets[k].client===c.name;});
                  if(budgets.length===0)return null;
                  return (<div style={{marginTop:10}}>
                    {budgets.map(function(bk){
                      var b=cfg._budgets[bk];
                      var spent=b.spent||0;
                      if(b.trackHours){var costPerH2=c.hours>0?c.totalCost/c.hours:0;spent=costPerH2*(b.trackedHours||0);}
                      var remain=b.amount-spent;
                      var usedP=b.amount>0?(spent/b.amount)*100:0;
                      var over2=usedP>100;
                      return (<div key={bk} style={{padding:"8px 12px",background:over2?C.rdBg+"88":"rgba(0,0,0,0.02)",borderRadius:8,marginBottom:6,border:"1px solid "+(over2?C.rd+"22":C.bdL)}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:12,fontWeight:700}}>{b.name}</span>
                          <span style={{fontSize:11,fontWeight:700,color:over2?C.rd:C.gn}}>{fmt(remain)} rimanenti</span>
                        </div>
                        <div style={{height:5,background:C.bdL,borderRadius:3}}><div style={{height:"100%",borderRadius:3,background:over2?C.rd:usedP>80?C.am:C.gn,width:pct(Math.min(usedP,100))}}/></div>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:10,color:C.tm}}>
                          <span>{fmt(spent)} speso</span>
                          <span>Budget: {fmt(b.amount)}</span>
                        </div>
                      </div>);
                    })}
                  </div>);
                })()}
                {/* Client Report */}
                {!c.isI&&(<div style={{marginTop:14,padding:14,background:C.sf,borderRadius:10,border:"1px solid "+C.bdL}} onClick={function(e){e.stopPropagation();}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.tm,marginBottom:8}}>Report cliente</div>
                  <textarea value={crNotes[c.name]||""} onChange={function(e){setCrNote(c.name,e.target.value);}} onClick={function(e){e.stopPropagation();}} placeholder="Note per il cliente (risultati, prossimi step...)" rows={3} style={{...ix,width:"100%",fontSize:12,resize:"vertical",marginBottom:8,lineHeight:1.5}}/>
                  <button onClick={function(e){e.stopPropagation();generateClientReport(c.name,crNotes[c.name]||"");}} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7C5CFC,#AF52DE)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><FileText size={14}/> Genera report</button>
                </div>)}
              </div>)}
            </div>);
          })}</div>
        )}

        {/* PROFITABILITY */}
        {tab==="profitability"&&(
          <div>
            {/* Summary */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
              <div style={{...bx,textAlign:"center",background:C.gnBg,border:"1px solid rgba(52,199,89,0.15)"}}><div style={{fontSize:11,color:C.gn,fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>RICAVI</div><div style={{fontSize:24,fontWeight:800,color:C.gn}}>{fmt(tF)}</div></div>
              <div style={{...bx,textAlign:"center",background:C.rdBg,border:"1px solid rgba(255,59,48,0.15)"}}><div style={{fontSize:11,color:C.rd,fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>COSTI</div><div style={{fontSize:24,fontWeight:800,color:C.rd}}>{fmt(tC)}</div></div>
              <div style={{...bx,textAlign:"center",background:tM>=0?C.gnBg:C.rdBg,border:"1px solid "+(tM>=0?"rgba(52,199,89,0.15)":"rgba(255,59,48,0.15)")}}><div style={{fontSize:11,color:tM>=0?C.gn:C.rd,fontWeight:700,marginBottom:6,letterSpacing:".06em"}}>MARGINE</div><div style={{fontSize:24,fontWeight:800,color:tM>=0?C.gn:C.rd}}>{fmt(tM)}</div></div>
            </div>
            {!hasC&&(<div style={{...bx,padding:14,background:C.amBg,border:"1px solid rgba(255,149,0,0.2)",marginBottom:14}}><span style={{fontSize:12,color:C.am}}>⚠ Imposta i costi nella tab Config</span></div>)}

            {/* ═══ ACCORDION: CLIENTI ═══ */}
            <Accordion icon={Tag} title="Clienti" badge={extCL.length+" clienti"} open={profOpen.clients} onToggle={function(){toggleProf("clients");}}>
              {/* Mini bar chart top3/bottom3 */}
              {(function(){
                var ranked=extCL.filter(function(c){return c.fee>0;}).slice().sort(function(a,b){return b.margin-a.margin;});
                if(ranked.length<2)return null;
                var top3=ranked.slice(0,3);
                var bot3=ranked.slice(-3).reverse();
                var maxAbs=Math.max.apply(null,ranked.map(function(c){return Math.abs(c.margin);}));
                return (<div style={{...bx,marginBottom:16,padding:16,border:"1px solid "+C.bdL}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.tm,marginBottom:12}}>Top & Bottom per margine</div>
                  <div style={{display:"flex",gap:16}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:600,color:C.gn,marginBottom:6,letterSpacing:".04em"}}>TOP</div>
                      {top3.map(function(c){var w=maxAbs>0?Math.abs(c.margin)/maxAbs*100:0;return (<div key={c.name} style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{fontWeight:600,textTransform:"capitalize"}}>{c.name}</span><span style={{fontWeight:700,color:C.gn}}>+{fmt(c.margin)}</span></div>
                        <div style={{height:6,background:C.gnBg,borderRadius:3}}><div style={{height:"100%",borderRadius:3,background:C.gn,width:w+"%",opacity:0.7}}/></div>
                      </div>);})}
                    </div>
                    <div style={{width:1,background:C.bdL}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:600,color:C.rd,marginBottom:6,letterSpacing:".04em"}}>BOTTOM</div>
                      {bot3.map(function(c){var w=maxAbs>0?Math.abs(c.margin)/maxAbs*100:0;return (<div key={c.name} style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{fontWeight:600,textTransform:"capitalize"}}>{c.name}</span><span style={{fontWeight:700,color:c.margin>=0?C.gn:C.rd}}>{fmt(c.margin)}</span></div>
                        <div style={{height:6,background:c.margin>=0?C.gnBg:C.rdBg,borderRadius:3}}><div style={{height:"100%",borderRadius:3,background:c.margin>=0?C.gn:C.rd,width:w+"%",opacity:0.7}}/></div>
                      </div>);})}
                    </div>
                  </div>
                </div>);
              })()}
              {extCL.map(function(c){
              var pos=c.margin>=0,clr=c.fee>0?(pos?C.gn:C.rd):C.td;
              return (<div key={c.name} style={{...bx,marginBottom:12,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:clr,opacity:0.4,borderRadius:"16px 16px 0 0"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div><div style={{fontSize:15,fontWeight:700,textTransform:"capitalize",marginBottom:2}}>{c.name}</div><span style={{fontSize:12,color:C.tm}}>{fmtH(c.hours)}</span></div>
                  {c.fee>0&&<Badge value={(pos?"+":"")+pct(c.mp)} positive={pos}/>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}><span style={{color:C.tm}}>Costo team</span><span style={{fontWeight:600}}>{fmt(c.cost)}</span></div>
                {c.extraCost>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}><span style={{color:C.or}}>+ Costi extra</span><span style={{fontWeight:600,color:C.or}}>{fmt(c.extraCost)}</span></div>}
                {c.fee>0?(<div><Bar value={c.totalCost} max={c.fee} color={clr} positive={pos}/><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:8}}><span style={{color:C.tm}}>Fee: {fmt(c.fee)}</span><span style={{fontWeight:800,color:clr}}>{fmt(c.margin)}</span></div></div>):(<div style={{fontSize:12,color:C.td,fontStyle:"italic"}}>Fee non configurata</div>)}
              </div>);
            })}
            </Accordion>

            {/* ═══ ACCORDION: AREE ═══ */}
            <Accordion icon={FolderOpen} title="Aree" badge={AL.length+" aree"} open={profOpen.areas} onToggle={function(){toggleProf("areas");}}>
              <p style={{fontSize:12,color:C.tm,marginBottom:14}}>Fee clienti distribuite proporzionalmente alle ore per area.</p>
              {AL.filter(function(a){return a.fee>0||a.cost>0;}).sort(function(a,b){return b.margin-a.margin;}).map(function(a){
              var pos=a.margin>=0,clr=a.fee>0?(pos?C.gn:C.rd):C.td;
              return (<div key={a.name} style={{...bx,marginBottom:12,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:clr,opacity:0.4}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:10,height:10,borderRadius:3,background:gac(a.name)}}/><div><div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{a.name}</div><span style={{fontSize:12,color:C.tm}}>{fmtH(a.hours)+" · "+a.people.length+" pers."}</span></div></div>
                  {a.fee>0&&<Badge value={(pos?"+":"")+pct(a.mp)} positive={pos}/>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}><span style={{color:C.tm}}>Costo</span><span style={{fontWeight:600}}>{fmt(a.cost)}</span></div>
                {a.fee>0?(<div><Bar value={a.cost} max={a.fee} color={clr} positive={pos}/><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:8}}><span style={{color:C.tm}}>Ricavo: {fmt(a.fee)}</span><span style={{fontWeight:800,color:clr}}>{fmt(a.margin)}</span></div></div>):(<div style={{fontSize:12,color:C.td,fontStyle:"italic"}}>Solo ore interne</div>)}
              </div>);
            })}
            </Accordion>

            {/* ═══ ACCORDION: PERSONE ═══ */}
            <Accordion icon={UserCircle} title="Persone" badge={PL.length+" persone"} open={profOpen.people} onToggle={function(){toggleProf("people");}}>
              {/* Scatter plot costo/h vs ricavo/h */}
              {(function(){
                var pts=PL.filter(function(p){return p.revenue>0&&p.rate>0;});
                if(pts.length<2)return null;
                var maxC=Math.max.apply(null,pts.map(function(p){return p.rate;}));
                var maxR=Math.max.apply(null,pts.map(function(p){return p.hours>0?p.revenue/p.hours:0;}));
                var axisMax=Math.max(maxC,maxR)*1.15;
                var chartW=280,chartH=200;
                return (<div style={{...bx,marginBottom:16,padding:16,border:"1px solid "+C.bdL}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.tm,marginBottom:12}}>Costo/h vs Ricavo/h per persona</div>
                  <div style={{position:"relative",width:chartW,height:chartH,margin:"0 auto"}}>
                    {/* Diagonal break-even line */}
                    <svg width={chartW} height={chartH} style={{position:"absolute",top:0,left:0}}>
                      <line x1="0" y1={chartH} x2={chartW} y2="0" stroke={C.bd} strokeWidth="1" strokeDasharray="4,4"/>
                      <text x={chartW-4} y={14} textAnchor="end" fontSize="9" fill={C.td}>break-even</text>
                    </svg>
                    {/* Points */}
                    {pts.map(function(p){
                      var revH=p.hours>0?p.revenue/p.hours:0;
                      var cx=axisMax>0?p.rate/axisMax*chartW:0;
                      var cy=axisMax>0?chartH-revH/axisMax*chartH:chartH;
                      var pos=revH>=p.rate;
                      return (<div key={p.name} style={{position:"absolute",left:cx-6,top:cy-6,width:12,height:12,borderRadius:99,background:pos?C.gn:C.rd,opacity:0.8,border:"2px solid "+C.sf}}>
                        <span style={{position:"absolute",top:-18,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:600,color:C.ts,whiteSpace:"nowrap"}}>{p.name.split(" ")[0]}</span>
                      </div>);
                    })}
                    {/* Axes labels */}
                    <div style={{position:"absolute",bottom:-18,left:"50%",transform:"translateX(-50%)",fontSize:10,color:C.td}}>Costo/h →</div>
                    <div style={{position:"absolute",top:"50%",left:-22,transform:"translateY(-50%) rotate(-90deg)",fontSize:10,color:C.td}}>Ricavo/h →</div>
                  </div>
                  <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24,fontSize:11,color:C.tm}}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:99,background:C.gn}}/>Sopra break-even</span>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:99,background:C.rd}}/>Sotto break-even</span>
                  </div>
                </div>);
              })()}
              <p style={{fontSize:12,color:C.tm,marginBottom:14}}>Ricavo clienti distribuito proporzionalmente alle ore di ogni persona.</p>
              {PL.slice().sort(function(a,b){return b.margin-a.margin;}).map(function(p){
              var pos=p.margin>=0,clr=p.revenue>0?(pos?C.gn:C.rd):C.td;
              var revH=p.hours>0?p.revenue/p.hours:0;
              return (<div key={p.name} style={{...bx,marginBottom:12,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:clr,opacity:0.4}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{width:36,height:36,borderRadius:10,background:C.acL,color:C.ac,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>{p.name.charAt(0)}</span>
                    <div><div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{p.name}</div><span style={{fontSize:12,color:C.tm}}>{fmtH(p.hours)+" · "+p.areas.length+" aree"}</span></div>
                  </div>
                  {p.revenue>0&&<Badge value={(pos?"+":"")+pct(p.mp)} positive={pos}/>}
                </div>
                <div style={{display:"flex",gap:20,fontSize:13,marginBottom:12,flexWrap:"wrap"}}>
                  <div><span style={{color:C.tm}}>Costo </span><span style={{fontWeight:600}}>{fmt(p.totalCost)}</span> <span style={{color:C.td,fontSize:11}}>{fmt(p.rate)}/h</span></div>
                  <div><span style={{color:C.tm}}>Ricavo </span><span style={{fontWeight:600,color:C.gn}}>{fmt(p.revenue)}</span> <span style={{color:C.td,fontSize:11}}>{fmt(revH)}/h</span></div>
                </div>
                {p.extraCost>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}><span style={{color:C.or}}>+ Extra</span><span style={{fontWeight:600,color:C.or}}>{fmt(p.extraCost)}</span></div>}
                {p.revenue>0?(<div><Bar value={p.totalCost} max={p.revenue} color={clr} positive={pos}/><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:8}}><span style={{color:C.tm}}>Margine</span><span style={{fontWeight:800,color:clr}}>{fmt(p.margin)}</span></div></div>):(<div style={{fontSize:12,color:C.td,fontStyle:"italic"}}>Solo ore interne</div>)}
              </div>);
            })}
            </Accordion>

            {/* ═══ ACCORDION: TREND ═══ */}
            <Accordion icon={TrendingUp} title="Trend mese su mese" badge={allMonths.length+" mesi"} open={profOpen.trend} onToggle={function(){toggleProf("trend");}}>
            {allMonths.length>1&&(<div>
              <div style={{...bx,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:C.tm,marginBottom:10}}>Ore totali per mese</div>
                <div style={{display:"flex",gap:8,alignItems:"flex-end",height:100}}>
                  {monthlyAgg.map(function(m){var maxH=Math.max.apply(null,monthlyAgg.map(function(x){return x.h;}));var barH=maxH>0?Math.max(m.h/maxH*80,4):0;return (<div key={m.mk} style={{flex:1,textAlign:"center"}}><div style={{fontSize:12,fontWeight:800,color:C.bl,marginBottom:4}}>{fmtH(m.h)}</div><div style={{height:barH,background:C.bl,borderRadius:4,marginBottom:6,opacity:0.7}}/><div style={{fontSize:10,color:C.tm,fontWeight:600}}>{m.label.split(" ")[0].slice(0,3)}</div></div>);})}
                </div>
              </div>
              <div style={{...bx,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:C.tm,marginBottom:4}}>Costo vs Ricavo per mese</div>
                <div style={{display:"flex",gap:8,alignItems:"flex-end",height:120}}>
                  {monthlyAgg.map(function(m){var maxV=Math.max.apply(null,monthlyAgg.map(function(x){return Math.max(x.c,x.f);}));var costH=maxV>0?Math.max(m.c/maxV*85,m.c>0?4:0):0;var feeH=maxV>0?Math.max(m.f/maxV*85,m.f>0?4:0):0;return (<div key={m.mk} style={{flex:1,textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:m.m>=0?C.gn:C.rd,marginBottom:3}}>{m.f>0?(m.m>=0?"+":"")+pct(m.mp):""}</div><div style={{display:"flex",gap:2,justifyContent:"center",alignItems:"flex-end",height:90}}><div style={{width:"40%",height:costH,background:C.rd,borderRadius:3,opacity:0.6}}/><div style={{width:"40%",height:feeH,background:C.gn,borderRadius:3,opacity:0.6}}/></div><div style={{fontSize:10,color:C.tm,fontWeight:600,marginTop:4}}>{m.label.split(" ")[0].slice(0,3)}</div></div>);})}
                </div>
                <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:8}}>
                  <span style={{fontSize:10,color:C.tm,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:C.rd,opacity:0.6}}/>Costo</span>
                  <span style={{fontSize:10,color:C.tm,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:C.gn,opacity:0.6}}/>Ricavo</span>
                </div>
              </div>
              <div style={{...bx}}>
                <div style={{fontSize:12,fontWeight:700,color:C.tm,marginBottom:10}}>Ore per persona — mese su mese</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:12}}>
                    <thead><tr>
                      <th style={{textAlign:"left",padding:"7px 8px",borderBottom:"2px solid "+C.bd,color:C.tm,fontWeight:600}}>Persona</th>
                      {allMonths.map(function(mk){return (<th key={mk} style={{textAlign:"right",padding:"7px 8px",borderBottom:"2px solid "+C.bd,color:C.tm,fontWeight:600}}>{getML(mk).split(" ")[0].slice(0,3)}</th>);})}
                    </tr></thead>
                    <tbody>{people.map(function(p){
                      return (<tr key={p}>
                        <td style={{padding:"6px 8px",fontWeight:600,borderBottom:"1px solid "+C.bdL,whiteSpace:"nowrap"}}>{p}</td>
                        {monthlyAgg.map(function(m){
                          var h=m.pp[p]||0;var prevM=monthlyAgg[allMonths.indexOf(m.mk)-1];var prevH=prevM&&prevM.pp[p]||0;var delta=prevH>0?((h-prevH)/prevH*100):0;var arrow=Math.abs(delta)>15?(delta>0?" ↑":" ↓"):"";
                          return (<td key={m.mk} style={{textAlign:"right",padding:"6px 8px",borderBottom:"1px solid "+C.bdL,fontVariantNumeric:"tabular-nums"}}>
                            <span style={{fontWeight:h>0?700:400,color:h>0?C.tx:C.td}}>{h>0?fmtH(h):"—"}</span>
                            {arrow&&<span style={{fontSize:9,color:delta>0?C.gn:C.rd,marginLeft:2}}>{arrow}</span>}
                          </td>);
                        })}
                      </tr>);
                    })}</tbody>
                  </table>
                </div>
              </div>
            </div>)}
            </Accordion>
          </div>
        )}

        {/* PEOPLE */}
        {tab==="team"&&(
          <div>{PL.filter(function(p){return !search||p.name.toLowerCase().indexOf(search.toLowerCase())>=0;}).sort(function(a,b){return sortAZ?a.name.localeCompare(b.name):b.hours-a.hours;}).map(function(p){
            var pRecs=records.filter(function(r){return r.user===p.name;});
            var entries=pRecs.length;
            var avgDur=entries>0?p.hours/entries*60:0;
            var hasMargin=p.revenue>0;
            var mPos=p.margin>=0;
            var isOpen=plOpen[p.name];

            // Unique tasks
            var taskSet={};pRecs.forEach(function(r){if(r.task)taskSet[r.task]=1;});
            var uniqueTasks=Object.keys(taskSet).length;

            // Description rate
            var withDesc=pRecs.filter(function(r){return r.hasDesc;}).length;
            var descPct=entries>0?Math.round(withDesc/entries*100):0;

            // Hour distribution (0-23)
            var hourDist=[];for(var hi=0;hi<24;hi++)hourDist.push(0);
            pRecs.forEach(function(r){if(r.startHour>=0)hourDist[r.startHour]+=r.hours;});
            var peakHour=0;var peakVal=0;
            for(var hh=0;hh<24;hh++){if(hourDist[hh]>peakVal){peakVal=hourDist[hh];peakHour=hh;}}

            // Weekend hours
            var weekendH=pRecs.filter(function(r){return r.weekday===0||r.weekday===6;}).reduce(function(s,r){return s+r.hours;},0);
            var hasWeekend=weekendH>0.5;

            // Weekday distribution
            var dayNames=["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];
            var dayDist=[0,0,0,0,0,0,0];
            pRecs.forEach(function(r){if(r.weekday>=0)dayDist[r.weekday]+=r.hours;});

            // Areas breakdown
            var pAreas={};pRecs.forEach(function(r){pAreas[r.area]=(pAreas[r.area]||0)+r.hours;});
            var areaList=Object.keys(pAreas).map(function(a){return {name:a,h:pAreas[a]};}).sort(function(a,b){return b.h-a.h;});
            var topArea=areaList[0];
            var specialPct=topArea?Math.round(topArea.h/p.hours*100):0;

            // Client breakdown
            var pClients={};pRecs.forEach(function(r){if(r.client&&!isInternal(r.client))pClients[r.client]=(pClients[r.client]||0)+r.hours;});
            var clientList=Object.keys(pClients).map(function(c){return {name:c,h:pClients[c]};}).sort(function(a,b){return b.h-a.h;});

            // Internal hours
            var intH=pRecs.filter(function(r){return r.client==="willab"||!r.client;}).reduce(function(s,r){return s+r.hours;},0);

            return (<div key={p.name} style={{...bx,marginBottom:10,overflow:"hidden"}}>
              {/* Accordion Header */}
              <div onClick={function(){togglePl(p.name);}} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"2px 0"}}>
                <span style={{width:32,height:32,borderRadius:9,background:C.acL,color:C.ac,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{p.name.charAt(0)}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700}}>{p.name}</div>
                  <div style={{fontSize:11,color:C.tm}}>{fmt(p.rate)+"/h · "+p.areas.length+" aree · "+entries+" entries"}{p.isOverhead&&" · Fisso"}</div>
                </div>
                <div style={{textAlign:"right",marginRight:6}}>
                  <div style={{fontSize:16,fontWeight:800}}>{fmtH(p.hours)}</div>
                  {hasMargin&&<div style={{fontSize:11,fontWeight:700,color:mPos?C.gn:C.rd}}>{(mPos?"+":"")+fmt(p.margin)}</div>}
                  {!hasMargin&&<div style={{fontSize:11,color:C.tm}}>{fmt(p.totalCost)}</div>}
                </div>
                <ChevronDown size={14} color={C.tm} style={{transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}/>
              </div>

              {/* Accordion Body */}
              {isOpen&&(<div style={{marginTop:14}}>

                {/* KPI grid: Costo / Ricavo / Margine */}
                <div style={{display:"grid",gridTemplateColumns:hasMargin?"1fr 1fr 1fr":"1fr 1fr",gap:8,marginBottom:14}}>
                  <div style={{background:C.amBg,borderRadius:9,padding:"9px 10px",textAlign:"center"}}>
                    <div style={{fontSize:9,fontWeight:700,color:C.am,letterSpacing:".04em",marginBottom:3}}>COSTO</div>
                    <div style={{fontSize:15,fontWeight:800}}>{fmt(p.totalCost)}</div>
                    <div style={{fontSize:10,color:C.tm,marginTop:1}}>{fmt(p.rate)}/h</div>
                  </div>
                  {hasMargin&&<div style={{background:C.blBg,borderRadius:9,padding:"9px 10px",textAlign:"center"}}>
                    <div style={{fontSize:9,fontWeight:700,color:C.bl,letterSpacing:".04em",marginBottom:3}}>RICAVO ATTR.</div>
                    <div style={{fontSize:15,fontWeight:800}}>{fmt(p.revenue)}</div>
                    <div style={{fontSize:10,color:C.tm,marginTop:1}}>{p.hours>0?fmt(p.revenue/p.hours):0}/h</div>
                  </div>}
                  <div style={{background:hasMargin?(mPos?C.gnBg:C.rdBg):"rgba(142,142,147,0.06)",borderRadius:9,padding:"9px 10px",textAlign:"center"}}>
                    <div style={{fontSize:9,fontWeight:700,color:hasMargin?(mPos?C.gn:C.rd):C.td,letterSpacing:".04em",marginBottom:3}}>{hasMargin?"MARGINE":"ORE"}</div>
                    {hasMargin?(<div style={{fontSize:15,fontWeight:800,color:mPos?C.gn:C.rd}}>{fmt(p.margin)}</div>):(<div style={{fontSize:15,fontWeight:800}}>{fmtH(p.hours)}</div>)}
                    {hasMargin&&<div style={{fontSize:10,color:mPos?C.gn:C.rd,marginTop:1}}>{(mPos?"+":"")+pct(p.mp)}</div>}
                  </div>
                </div>

                {/* Mini KPIs row */}
                <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                  <div style={{flex:"1 1 70px",background:C.sf,borderRadius:8,padding:"7px 8px",border:"1px solid "+C.bdL,textAlign:"center"}}>
                    <div style={{fontSize:8,color:C.tm,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Picco</div>
                    <div style={{fontSize:14,fontWeight:800,color:C.bl}}>{peakHour+":00"}</div>
                  </div>
                  <div style={{flex:"1 1 70px",background:C.sf,borderRadius:8,padding:"7px 8px",border:"1px solid "+C.bdL,textAlign:"center"}}>
                    <div style={{fontSize:8,color:C.tm,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Media</div>
                    <div style={{fontSize:14,fontWeight:800,color:C.or}}>{Math.round(avgDur)+"m"}</div>
                  </div>
                  <div style={{flex:"1 1 70px",background:C.sf,borderRadius:8,padding:"7px 8px",border:"1px solid "+C.bdL,textAlign:"center"}}>
                    <div style={{fontSize:8,color:C.tm,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Descr.</div>
                    <div style={{fontSize:14,fontWeight:800,color:descPct>=70?C.gn:descPct>=30?C.am:C.rd}}>{descPct+"%"}</div>
                  </div>
                  <div style={{flex:"1 1 70px",background:C.sf,borderRadius:8,padding:"7px 8px",border:"1px solid "+C.bdL,textAlign:"center"}}>
                    <div style={{fontSize:8,color:C.tm,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Interne</div>
                    <div style={{fontSize:14,fontWeight:800,color:C.sl}}>{fmtH(intH)}</div>
                  </div>
                  {hasWeekend&&<div style={{flex:"1 1 70px",background:C.amBg,borderRadius:8,padding:"7px 8px",border:"1px solid "+C.am+"22",textAlign:"center"}}>
                    <div style={{fontSize:8,color:C.am,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Weekend</div>
                    <div style={{fontSize:14,fontWeight:800,color:C.am}}>{fmtH(weekendH)}</div>
                  </div>}
                </div>

                {/* Hour heatmap */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:C.tm,fontWeight:600,marginBottom:6}}>Distribuzione oraria</div>
                  <div style={{display:"flex",gap:2,alignItems:"flex-end",height:36}}>
                    {hourDist.map(function(v,i){
                      var maxH=Math.max.apply(null,hourDist);
                      var barH2=maxH>0?Math.max(v/maxH*32,v>0?3:0):0;
                      return (<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <div style={{width:"100%",height:barH2,background:i===peakHour?C.bl:(v>0?C.ac+"66":C.bl),borderRadius:2}}/>
                        {i%3===0&&<span style={{fontSize:7,color:C.tm}}>{i}</span>}
                      </div>);
                    })}
                  </div>
                </div>

                {/* Weekday distribution */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:C.tm,fontWeight:600,marginBottom:6}}>Distribuzione settimanale</div>
                  <div style={{display:"flex",gap:4}}>
                    {[1,2,3,4,5,6,0].map(function(d){
                      var maxD=Math.max.apply(null,dayDist);
                      var val=dayDist[d];
                      var barH3=maxD>0?Math.max(val/maxD*28,val>0?3:0):0;
                      var isWe=d===0||d===6;
                      return (<div key={d} style={{flex:1,textAlign:"center"}}>
                        <div style={{height:32,display:"flex",alignItems:"flex-end",justifyContent:"center",marginBottom:3}}>
                          <div style={{width:"80%",height:barH3,background:isWe?(val>0?C.am:C.bl):C.ac+"88",borderRadius:2}}/>
                        </div>
                        <div style={{fontSize:9,color:isWe?C.am:C.tm,fontWeight:600}}>{dayNames[d]}</div>
                        {val>0&&<div style={{fontSize:8,color:C.tm}}>{fmtH(val)}</div>}
                      </div>);
                    })}
                  </div>
                </div>

                {/* Two columns: Areas + Clients */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <div style={{fontSize:11,color:C.tm,fontWeight:600,marginBottom:6}}>Aree</div>
                    {areaList.slice(0,6).map(function(a){
                      return (<div key={a.name} style={{marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                          <span style={{fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><span style={{width:5,height:5,borderRadius:99,background:gac(a.name)}}/>{a.name}</span>
                          <span style={{fontSize:11,fontWeight:700,color:gac(a.name)}}>{fmtH(a.h)}</span>
                        </div>
                        <Bar value={a.h} max={topArea?topArea.h:1} color={gac(a.name)} h={4}/>
                      </div>);
                    })}
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.tm,fontWeight:600,marginBottom:6}}>Clienti</div>
                    {clientList.length===0&&<div style={{fontSize:11,color:C.td,fontStyle:"italic"}}>Solo ore interne</div>}
                    {clientList.slice(0,6).map(function(c,ci){
                      return (<div key={c.name} style={{marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                          <span style={{fontSize:11,fontWeight:600,textTransform:"capitalize",display:"flex",alignItems:"center",gap:4}}><span style={{width:5,height:5,borderRadius:99,background:gcc(ci)}}/>{c.name}</span>
                          <span style={{fontSize:11,fontWeight:700,color:gcc(ci)}}>{fmtH(c.h)}</span>
                        </div>
                        <Bar value={c.h} max={clientList[0]?clientList[0].h:1} color={gcc(ci)} h={4}/>
                      </div>);
                    })}
                  </div>
                </div>

                {/* Monthly trend */}
                {allMonths.length>1&&(<div style={{marginTop:14}}>
                  <div style={{fontSize:11,color:C.tm,fontWeight:600,marginBottom:6}}>Trend mensile</div>
                  <div style={{display:"flex",gap:6,alignItems:"flex-end",height:50}}>
                    {monthlyAgg.map(function(m){
                      var ph=m.pp[p.name]||0;
                      var maxPH=Math.max.apply(null,monthlyAgg.map(function(x){return x.pp[p.name]||0;}));
                      var barH4=maxPH>0?Math.max(ph/maxPH*36,ph>0?3:0):0;
                      var prevIdx=allMonths.indexOf(m.mk)-1;
                      var prevH=prevIdx>=0&&monthlyAgg[prevIdx]?monthlyAgg[prevIdx].pp[p.name]||0:0;
                      var delta=prevH>0?((ph-prevH)/prevH*100):0;
                      return (<div key={m.mk} style={{flex:1,textAlign:"center"}}>
                        <div style={{fontSize:10,fontWeight:700,color:C.bl}}>{ph>0?fmtH(ph):""}</div>
                        <div style={{height:barH4,background:C.ac+"77",borderRadius:3,marginTop:2,marginBottom:4}}/>
                        <div style={{fontSize:9,color:C.tm}}>{m.label.split(" ")[0].slice(0,3)}</div>
                        {prevH>0&&Math.abs(delta)>10&&<div style={{fontSize:8,color:delta>0?C.gn:C.rd}}>{(delta>0?"↑":"↓")+Math.round(Math.abs(delta))+"%"}</div>}
                      </div>);
                    })}
                  </div>
                </div>)}

              </div>)}
            </div>);
          })}</div>
        )}

        {/* COSTI EXTRA TAB */}
        {tab==="extras"&&cm&&(
          <div>
            {/* Month selector - STICKY */}
            <div style={{...bx,padding:"12px 20px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,position:"sticky",top:56,zIndex:20,boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><Calendar size={14} strokeWidth={2.2} color={C.ac}/><span style={{fontSize:14,fontWeight:700}}>Mese</span></div>
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{allMonths.map(function(mk){return (<Pill key={mk} sm on={cm===mk} onClick={function(){setCfgM(mk);}}>{getML(mk)}</Pill>);})}</div>
            </div>

            {/* Summary */}
            {(function(){
              var totMonth=getExtras(cm).reduce(function(s,ex){return s+(ex.amount||0);},0);
              var totAll=0;var byType={client:0,recurring_client:0,person:0,general:0};
              allMonths.forEach(function(mk){
                var exs=getExtras(mk);
                if(exs)exs.forEach(function(ex){totAll+=(ex.amount||0);if(byType[ex.type]!==undefined)byType[ex.type]+=(ex.amount||0);});
              });
              return (<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:14}}>
                <div style={{...bx,textAlign:"center"}}><div style={{fontSize:11,color:C.or,fontWeight:700,marginBottom:4,letterSpacing:".04em"}}>QUESTO MESE</div><div style={{fontSize:22,fontWeight:800,color:C.or}}>{fmt(totMonth)}</div></div>
                <div style={{...bx,textAlign:"center"}}><div style={{fontSize:11,color:C.tm,fontWeight:700,marginBottom:4,letterSpacing:".04em"}}>TOTALE ANNO</div><div style={{fontSize:22,fontWeight:800,color:C.tx}}>{fmt(totAll)}</div></div>
              </div>);
            })()}

            {/* Breakdown by type */}
            {(function(){
              var byType={};
              allMonths.forEach(function(mk){var exs=getExtras(mk);if(exs)exs.forEach(function(ex){if(ex.amount){var t=ex.type||"general";byType[t]=(byType[t]||0)+ex.amount;}});});
              var typeLabels={client:"Cliente",recurring_client:"Ricorrente",person:"Persona",general:"Generale"};
              var typeColors={client:C.bl,recurring_client:C.ac,person:C.am,general:C.sl};
              var total=Object.values(byType).reduce(function(s,v){return s+v;},0);
              if(total===0)return null;
              return (<div style={{...bx,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:C.tm,marginBottom:12}}>Ripartizione per tipo</div>
                {Object.keys(byType).filter(function(k){return byType[k]>0;}).map(function(k){
                  return (<div key={k} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                      <span style={{fontWeight:600}}>{typeLabels[k]||k}</span>
                      <span style={{color:C.tm}}>{fmt(byType[k])} ({pct(byType[k]/total*100)})</span>
                    </div>
                    <div style={{height:6,background:C.bdL,borderRadius:3}}><div style={{height:"100%",borderRadius:3,background:typeColors[k]||C.ac,width:pct(byType[k]/total*100),opacity:0.7}}/></div>
                  </div>);
                })}
              </div>);
            })()}

            {/* Add extra button */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:6}}><DollarSign size={15} strokeWidth={2.2}/> {getML(cm)}</div>
              <button onClick={function(){addExtra(cm);}} style={{background:C.or+"18",border:"1px solid "+C.or+"44",borderRadius:9,padding:"6px 14px",color:C.or,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}><Plus size={13} strokeWidth={2.5}/> Aggiungi</button>
            </div>

            {getExtras(cm).length===0&&<div style={{...bx,padding:24,textAlign:"center"}}><div style={{fontSize:13,color:C.td}}>Nessun costo extra per {getML(cm)}</div><div style={{fontSize:12,color:C.td,marginTop:4}}>Clicca "+ Aggiungi" per inserirne uno</div></div>}

            {getExtras(cm).map(function(ex,idx){
              return (<div key={idx} style={{...bx,marginBottom:10,padding:16}}>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:10}}>
                  {[["client","Cliente"],["recurring_client","Ricorrente"],["person","Persona"],["general","Generale"]].map(function(t){
                    return (<button key={t[0]} onClick={function(){updateExtra(cm,idx,"type",t[0]);}} style={{padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:600,border:"1px solid "+(ex.type===t[0]?C.or:C.bd),background:ex.type===t[0]?C.or+"18":"transparent",color:ex.type===t[0]?C.or:C.tm,cursor:"pointer",fontFamily:"inherit"}}>{t[1]}</button>);
                  })}
                  <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                    {cfgHasNxt&&<button onClick={function(){copyExtraNext(cm,idx);}} title={"Copia a "+getML(nextMK(cm))} style={{background:C.ac+"12",border:"1px solid "+C.ac+"44",borderRadius:7,padding:"4px 9px",color:C.ac,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>→</button>}
                    <button onClick={function(){removeExtra(cm,idx);}} style={{background:"transparent",border:"1px solid "+C.rd+"44",borderRadius:7,padding:"4px 8px",color:C.rd,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}><X size={12}/></button>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  {(ex.type==="client"||ex.type==="recurring_client")&&(
                    <select value={ex.client||""} onChange={function(e){updateExtra(cm,idx,"client",e.target.value);}} style={{...ix,width:160,fontSize:12,textTransform:"capitalize"}}>
                      <option value="">Seleziona cliente</option>
                      {extClients.map(function(c){return (<option key={c} value={c}>{c}</option>);})}
                    </select>
                  )}
                  {ex.type==="person"&&(
                    <select value={ex.person||""} onChange={function(e){updateExtra(cm,idx,"person",e.target.value);}} style={{...ix,width:160,fontSize:12}}>
                      <option value="">Seleziona persona</option>
                      {people.map(function(p){return (<option key={p} value={p}>{p}</option>);})}
                    </select>
                  )}
                  <input type="text" value={ex.desc||""} onChange={function(e){updateExtra(cm,idx,"desc",e.target.value);}} placeholder="Descrizione..." style={{...ix,flex:1,minWidth:140,fontSize:12}}/>
                  <div style={{position:"relative",width:90}}>
                    <input type="number" min="0" step="50" value={ex.amount||""} onChange={function(e){updateExtra(cm,idx,"amount",parseFloat(e.target.value)||0);}} style={{...ix,width:"100%",paddingRight:24,textAlign:"right"}} placeholder="0"/>
                    <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:C.td,fontSize:10}}>€</span>
                  </div>
                </div>
              </div>);
            })}
          </div>
        )}

        {/* CONFIG */}
        {tab==="config"&&cm&&(
          <div>
            {/* Month selector - STICKY */}
            <div style={{...bx,padding:"12px 20px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,position:"sticky",top:56,zIndex:20,boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><Calendar size={14} strokeWidth={2.2} color={C.ac}/><span style={{fontSize:14,fontWeight:700}}>Mese</span></div>
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{allMonths.map(function(mk){return (<Pill key={mk} sm on={cm===mk} onClick={function(){setCfgM(mk);}}>{getML(mk)}</Pill>);})}</div>
              {cfgHasNxt&&<button onClick={function(){copyNext(cm);}} style={{background:C.acL,border:"1px solid "+C.ac+"44",borderRadius:9,padding:"5px 12px",color:C.ac,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{"Copia tutto →"}</button>}
            </div>

            {/* 1. CLIENTI INTERNI */}
            <Accordion icon={Home} title="Clienti interni" badge={allClients.filter(function(c){return isInternal(c);}).length+"/"+allClients.length} open={cfgOpen.internal} onToggle={function(){toggleCfg("internal");}}>
              <p style={{color:C.tm,fontSize:12,marginBottom:12}}>I clienti interni non richiedono fee e non appaiono negli alert.</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {allClients.map(function(c){
                  var isI=isInternal(c);
                  return (<button key={c} onClick={function(){setInternal(c,!isI);}} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,border:"1px solid "+(isI?C.sl:C.bd),background:isI?"rgba(142,142,147,0.1)":"transparent",color:isI?C.sl:C.tm,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize",display:"flex",alignItems:"center",gap:4}}>
                    {isI&&<Check size={12} strokeWidth={2.5}/>}
                    {c}
                  </button>);
                })}
              </div>
            </Accordion>

            {/* 2. COSTI TEAM */}
            <Accordion icon={Users} title={"Costi team — "+getML(cm)} badge={people.length+" persone"} open={cfgOpen.costs} onToggle={function(){toggleCfg("costs");}}>
              <p style={{color:C.tm,fontSize:13,marginBottom:14}}>Costo lordo mensile. Si eredita dal mese precedente. ✕ per azzerare.</p>
              {people.map(function(p){
                var h=allRec.filter(function(r){return r.user===p&&getMK(r.date)===cm;}).reduce(function(s,r){return s+r.hours;},0);
                var directVal=cfgCosts[p];
                var hasDirect=directVal!==undefined&&directVal!==null;
                var inherited=gc(p,cm);
                var isInherited=!hasDirect&&inherited>0;
                var effectiveCost=hasDirect?directVal:inherited;
                var rate=h>0&&!isOverhead(p)?effectiveCost/h:0;
                var overhead=isOverhead(p);
                return (<div key={p} style={{background:C.sf,border:"1px solid "+C.bdL,borderRadius:12,padding:16,marginBottom:10,opacity:h>0?1:0.5}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{width:28,height:28,borderRadius:99,background:overhead?"rgba(142,142,147,0.12)":C.acL,color:overhead?C.sl:C.ac,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{p.charAt(0).toUpperCase()}</span>
                      <div>
                        <div style={{fontSize:14,fontWeight:700}}>{p}{isInherited&&<span style={{fontSize:10,color:C.ac,marginLeft:5}}>↑ ereditato</span>}</div>
                        <div style={{fontSize:12,color:C.tm,marginTop:1}}>{h>0?fmtH(h):"Nessuna ora questo mese"}</div>
                      </div>
                    </div>
                    {rate>0&&!overhead&&<div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:800,color:C.ac}}>{fmt(rate)}</div><div style={{fontSize:10,color:C.tm}}>€/ora</div></div>}
                    {overhead&&<div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:C.am}}>Fisso</div><div style={{fontSize:10,color:C.tm}}>no costo clienti</div></div>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <button onClick={function(){setOverhead(p,!overhead);}} style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:700,border:"2px solid "+(overhead?C.am:C.bd),background:overhead?C.amBg:"transparent",color:overhead?C.am:C.tm,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>{overhead?"Fisso":"Variabile"}</button>
                    <div style={{position:"relative",flex:1}}>
                      <input type="number" min="0" step="100" value={hasDirect?(directVal||""):""} onChange={function(e){sc(p,cm,parseFloat(e.target.value)||0);}} style={{...ix,width:"100%",paddingRight:24,paddingLeft:14,textAlign:"right",fontSize:15,fontWeight:700,height:42}} placeholder={isInherited?Math.round(inherited):"0"}/>
                      <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:C.td,fontSize:12,fontWeight:600}}>€</span>
                    </div>
                    {isInherited&&<button onClick={function(){sc(p,cm,0);}} title={"Azzera costo per "+getML(cm)} style={{background:C.rd+"12",border:"1px solid "+C.rd+"44",borderRadius:8,padding:"8px 10px",color:C.rd,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0,lineHeight:1}}>✕</button>}
                    {cfgHasNxt&&effectiveCost>0&&<button onClick={function(){copyCostNext(p,cm);}} title={"Copia a "+getML(nextMK(cm))} style={{background:C.ac+"12",border:"1px solid "+C.ac+"44",borderRadius:8,padding:"8px 10px",color:C.ac,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0,lineHeight:1}}>→</button>}
                  </div>
                </div>);
              })}
            </Accordion>

            {/* 3. FEE CLIENTI */}
            <Accordion icon={Tag} title={"Fee clienti — "+getML(cm)} badge={allClients.length+" clienti"} open={cfgOpen.fees} onToggle={function(){toggleCfg("fees");}}>
              <p style={{color:C.tm,fontSize:13,marginBottom:14}}>Mensile si eredita. One-shot si distribuisce sulle ore. Si sommano.</p>
              {allClients.map(function(c,ci){
                var raw=cfgFees[c];var norm=gfNorm(raw);
                var inheritedVal=gfMonthly(c,cm);
                var hasDirectM=norm.monthly>0;
                var isInheritedM=!hasDirectM&&inheritedVal>0;
                var h=allRec.filter(function(r){return r.client===c&&getMK(r.date)===cm;}).reduce(function(s,r){return s+r.hours;},0);
                return (<div key={c} style={{background:C.sf,border:"1px solid "+C.bdL,borderRadius:12,padding:16,marginBottom:10,opacity:h>0?1:0.5}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <span style={{width:10,height:10,borderRadius:99,background:gcc(ci),flexShrink:0}}/>
                    <span style={{flex:1,fontSize:14,fontWeight:700,textTransform:"capitalize"}}>{c}{isInternal(c)&&<span style={{fontSize:9,color:C.sl,marginLeft:5,fontWeight:600}}>interno</span>}{isInheritedM&&<span style={{fontSize:10,color:C.ac,marginLeft:5}}>↑ ereditata</span>}</span>
                    <span style={{fontSize:13,color:C.tm,fontWeight:600}}>{h>0?fmtH(h):"—"}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:C.ac,marginBottom:5,letterSpacing:".04em"}}>MENSILE</div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <div style={{position:"relative",flex:1}}>
                          <input type="number" min="0" step="100" value={hasDirectM?norm.monthly:""} onChange={function(e){sf(c,cm,"monthly",parseFloat(e.target.value)||0);}} style={{...ix,width:"100%",paddingRight:28,textAlign:"right",fontSize:15,fontWeight:700,height:42}} placeholder={isInheritedM?Math.round(inheritedVal):"0"}/>
                          <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:C.td,fontSize:11,fontWeight:600}}>€/m</span>
                        </div>
                        {isInheritedM&&<button onClick={function(){sf(c,cm,"monthly",0);}} style={{background:C.rd+"12",border:"1px solid "+C.rd+"44",borderRadius:8,padding:"8px 10px",color:C.rd,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0,lineHeight:1}}>✕</button>}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:C.am,marginBottom:5,letterSpacing:".04em"}}>ONE-SHOT</div>
                      <div style={{position:"relative"}}>
                        <input type="number" min="0" step="100" value={norm.oneshot||""} onChange={function(e){sf(c,cm,"oneshot",parseFloat(e.target.value)||0);}} style={{...ix,width:"100%",paddingRight:20,textAlign:"right",fontSize:15,fontWeight:700,height:42}} placeholder="0"/>
                        <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:C.td,fontSize:11,fontWeight:600}}>€</span>
                      </div>
                    </div>
                  </div>
                  {cfgHasNxt&&(hasDirectM||isInheritedM||norm.oneshot>0)&&<div style={{marginTop:8,textAlign:"right"}}><button onClick={function(){copyFeeNext(c,cm);}} title={"Copia fee a "+getML(nextMK(cm))} style={{background:C.ac+"12",border:"1px solid "+C.ac+"44",borderRadius:7,padding:"5px 10px",color:C.ac,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>→ {getML(nextMK(cm))}</button></div>}
                </div>);
              })}
            </Accordion>

            {/* 4. COSTI EXTRA */}
            <Accordion icon={DollarSign} title={"Costi extra — "+getML(cm)} badge={getExtras(cm).length>0?getExtras(cm).length+" voci":"vuoto"} open={cfgOpen.extras} onToggle={function(){toggleCfg("extras");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <p style={{color:C.tm,fontSize:12,margin:0}}>Shooting, trasferte, licenze, costi generali.</p>
                <button onClick={function(){addExtra(cm);}} style={{background:C.or+"18",border:"1px solid "+C.or+"44",borderRadius:8,padding:"5px 12px",color:C.or,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}><Plus size={12}/> Aggiungi</button>
              </div>
              {getExtras(cm).length===0&&<div style={{fontSize:12,color:C.td,fontStyle:"italic",padding:"10px 0",textAlign:"center"}}>Nessun costo extra</div>}
              {getExtras(cm).map(function(ex,idx){
                return (<div key={idx} style={{padding:"10px 0",borderBottom:"1px solid "+C.bdL,display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                    {[["client","Cliente"],["recurring_client","Ricorrente"],["person","Persona"],["general","Generale"]].map(function(t){
                      return (<button key={t[0]} onClick={function(){updateExtra(cm,idx,"type",t[0]);}} style={{padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:600,border:"1px solid "+(ex.type===t[0]?C.or:C.bd),background:ex.type===t[0]?C.or+"18":"transparent",color:ex.type===t[0]?C.or:C.tm,cursor:"pointer",fontFamily:"inherit"}}>{t[1]}</button>);
                    })}
                    <button onClick={function(){removeExtra(cm,idx);}} style={{marginLeft:"auto",background:"transparent",border:"none",color:C.rd,fontSize:14,cursor:"pointer",padding:"2px 6px"}}>✕</button>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    {(ex.type==="client"||ex.type==="recurring_client")&&(
                      <select value={ex.client||""} onChange={function(e){updateExtra(cm,idx,"client",e.target.value);}} style={{...ix,width:140,fontSize:11,textTransform:"capitalize"}}>
                        <option value="">Cliente...</option>
                        {extClients.map(function(c){return (<option key={c} value={c}>{c}</option>);})}
                      </select>
                    )}
                    {ex.type==="person"&&(
                      <select value={ex.person||""} onChange={function(e){updateExtra(cm,idx,"person",e.target.value);}} style={{...ix,width:140,fontSize:11}}>
                        <option value="">Persona...</option>
                        {people.map(function(p){return (<option key={p} value={p}>{p}</option>);})}
                      </select>
                    )}
                    <input type="text" value={ex.desc||""} onChange={function(e){updateExtra(cm,idx,"desc",e.target.value);}} placeholder="Descrizione..." style={{...ix,flex:1,minWidth:120,fontSize:11}}/>
                    <div style={{position:"relative",width:80}}>
                      <input type="number" min="0" step="50" value={ex.amount||""} onChange={function(e){updateExtra(cm,idx,"amount",parseFloat(e.target.value)||0);}} style={{...ix,width:"100%",paddingRight:18,textAlign:"right",fontSize:12}} placeholder="0"/>
                      <span style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",color:C.td,fontSize:9}}>€</span>
                    </div>
                    {cfgHasNxt&&<button onClick={function(){copyExtraNext(cm,idx);}} title={"Copia a "+getML(nextMK(cm))} style={{background:C.ac+"12",border:"1px solid "+C.ac+"44",borderRadius:6,padding:"4px 8px",color:C.ac,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>→</button>}
                  </div>
                </div>);
              })}
              {getExtras(cm).length>0&&(function(){
                var tot=getExtras(cm).reduce(function(s,ex){return s+(ex.amount||0);},0);
                return (<div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontWeight:700,fontSize:13}}>
                  <span style={{color:C.tm}}>Totale</span>
                  <span style={{color:C.or}}>{fmt(tot)}</span>
                </div>);
              })()}
            </Accordion>

            {/* 5. BUDGET PROGETTI */}
            <Accordion icon={Briefcase} title="Budget progetti" badge={(cfg._budgets?Object.keys(cfg._budgets).length:0)+" budget"} open={cfgOpen.budgets} onToggle={function(){toggleCfg("budgets");}}>
              <p style={{color:C.tm,fontSize:13,marginBottom:14}}>Imposta budget per progetto. Aggiorna lo "speso" manualmente.</p>
              {cfg._budgets&&Object.keys(cfg._budgets).map(function(bk){
                var b=cfg._budgets[bk];
                var usedP=b.amount>0?((b.spent||0)/b.amount)*100:0;
                var over=usedP>100;
                return (<div key={bk} style={{background:C.sf,border:"1px solid "+C.bdL,borderRadius:12,padding:16,marginBottom:10}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                    <select value={b.client||""} onChange={function(e){updateBudget(bk,"client",e.target.value);}} style={{...ix,flex:1,fontSize:12,textTransform:"capitalize"}}>
                      <option value="">Cliente...</option>
                      {allClients.map(function(c){return (<option key={c} value={c}>{c}</option>);})}
                    </select>
                    <button onClick={function(){removeBudget(bk);}} style={{background:"transparent",border:"1px solid "+C.rd+"44",borderRadius:7,padding:"6px 8px",color:C.rd,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    <input type="text" value={b.name||""} onChange={function(e){updateBudget(bk,"name",e.target.value);}} placeholder="Nome progetto..." style={{...ix,flex:1,fontSize:13,fontWeight:600}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:C.ac,marginBottom:4,letterSpacing:".04em"}}>BUDGET</div>
                      <div style={{position:"relative"}}>
                        <input type="number" min="0" step="100" value={b.amount||""} onChange={function(e){updateBudget(bk,"amount",parseFloat(e.target.value)||0);}} style={{...ix,width:"100%",paddingRight:20,textAlign:"right",fontSize:15,fontWeight:700,height:42}} placeholder="0"/>
                        <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:C.td,fontSize:11}}>€</span>
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:C.am,marginBottom:4,letterSpacing:".04em"}}>SPESO</div>
                      <div style={{position:"relative"}}>
                        <input type="number" min="0" step="50" value={b.spent||""} onChange={function(e){updateBudget(bk,"spent",parseFloat(e.target.value)||0);}} style={{...ix,width:"100%",paddingRight:20,textAlign:"right",fontSize:15,fontWeight:700,height:42}} placeholder="0"/>
                        <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:C.td,fontSize:11}}>€</span>
                      </div>
                    </div>
                  </div>
                  {b.amount>0&&(<div>
                    <div style={{height:6,background:C.bdL,borderRadius:3,marginBottom:4}}><div style={{height:"100%",borderRadius:3,background:over?C.rd:usedP>80?C.am:C.gn,width:pct(Math.min(usedP,100))}}/></div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.tm}}>
                      <span>{pct(usedP)} utilizzato</span>
                      <span style={{fontWeight:700,color:over?C.rd:C.gn}}>{fmt(b.amount-(b.spent||0))} rimanenti</span>
                    </div>
                  </div>)}
                </div>);
              })}
              <button onClick={function(){addBudget("","Nuovo progetto",0);}} style={{width:"100%",padding:"12px",borderRadius:10,border:"2px dashed "+C.ac+"44",background:"transparent",color:C.ac,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Plus size={14}/> Aggiungi budget</button>
            </Accordion>

            <div style={{...bx,padding:12,background:C.gn+"08",borderColor:C.gn+"22"}}><span style={{fontSize:12,color:C.gn}}>✓ Salvato automaticamente nel cloud</span></div>
          </div>
        )}

        <div style={{textAlign:"center",padding:"30px 0 14px",color:C.td,fontSize:10}}>Willab Analytics</div>

        {/* UNDO TOAST */}
        {undoData&&(
          <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1C1B1F",color:"#fff",borderRadius:12,padding:"12px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 24px rgba(0,0,0,0.3)",zIndex:999,fontSize:13,fontWeight:600}}>
            <span>{undoData.label}</span>
            <button onClick={doUndo} style={{background:"#7C5CFC",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Annulla</button>
          </div>
        )}
      </div>
    </div>
  );
}
