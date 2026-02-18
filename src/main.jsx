import React from 'react'
import { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

var APP_PWD = typeof __APP_PASSWORD__ !== "undefined" ? __APP_PASSWORD__ : "willab2026";

var C = {
  bg: "#F2F1F6", sf: "#FFFFFF", bd: "#E5E4EA", bdL: "#EEECF2",
  tx: "#1C1B1F", tm: "#78767E", td: "#A9A7B0",
  ac: "#7C5CFC", acL: "#EDE8FF",
  rd: "#FF3B30"
};
var ix = { background: C.sf, border: "1px solid " + C.bd, borderRadius: 9, padding: "9px 12px", color: C.tx, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

function Gate() {
  var _a = useState(function () { try { return sessionStorage.getItem("wl-auth") === "1"; } catch (e) { return false; } });
  var authed = _a[0], setAuthed = _a[1];
  var _p = useState(""), pwd = _p[0], setPwd = _p[1];
  var _e = useState(false), err = _e[0], setErr = _e[1];

  var doLogin = function () {
    if (pwd === APP_PWD) {
      setAuthed(true); setErr(false);
      try { sessionStorage.setItem("wl-auth", "1"); } catch (e) { }
    } else { setErr(true); setPwd(""); }
  };

  if (authed) return (<App />);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.tx, fontFamily: "'SF Pro Display','SF Pro',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, WebkitFontSmoothing: "antialiased" }}>
      <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#7C5CFC,#AF52DE)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-.03em", color: C.tx }}>Willab Analytics</h1>
        <p style={{ color: C.tm, fontSize: 14, marginBottom: 28 }}>Inserisci la password per accedere</p>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            type="password"
            value={pwd}
            onChange={function (e) { setPwd(e.target.value); setErr(false); }}
            onKeyDown={function (e) { if (e.key === "Enter") doLogin(); }}
            placeholder="Password"
            autoFocus
            style={{ ...ix, width: "100%", padding: "12px 16px", fontSize: 15, textAlign: "center", letterSpacing: ".1em", borderColor: err ? C.rd : C.bd }}
          />
        </div>
        {err && <p style={{ color: C.rd, fontSize: 12, marginBottom: 12 }}>Password errata</p>}
        <button onClick={doLogin} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#7C5CFC,#AF52DE)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(124,92,252,0.25)" }}>Accedi</button>
        <p style={{ color: C.td, fontSize: 11, marginTop: 20 }}>Accesso riservato al team Willab</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Gate />
  </React.StrictMode>,
)
