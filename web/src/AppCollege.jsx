import React, { useState, useEffect, useMemo } from "react";
const CSS = "  :root{\n    --bg:#E9EDF2; --card:#FFFFFF; --ink:#0B1220; --muted:#5B6B7C; --line:#DCE3EB;\n    --chrome:#141414; --chrome2:#242424; --gold:#D50000; --good:#1A8A4B; --bad:#D50000;\n    --field:#C8102E; --shadow:0 1px 2px rgba(17,17,17,.06),0 8px 24px rgba(17,17,17,.09);\n    --disp:\"Anton\",Impact,Haettenschweiler,\"Arial Narrow Bold\",sans-serif;\n    --body:\"Oswald\",system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;\n  }\n  *{box-sizing:border-box}\n  body{margin:0;color:var(--ink);font-family:var(--body);font-weight:400;font-size:15px;line-height:1.4;\n    -webkit-font-smoothing:antialiased;background:var(--bg);\n    background-image:radial-gradient(1100px 380px at 50% -120px,#ffffff 0%,rgba(255,255,255,0) 70%),\n      linear-gradient(180deg,#eef1f6 0%,#e4e8ef 100%);background-attachment:fixed}\n  h1,h2,h3{margin:0}\n  a{color:inherit;text-decoration:none}\n  .wrap{max-width:1180px;margin:0 auto;padding:0 20px}\n  .tnum{font-variant-numeric:tabular-nums}\n  .disp{font-family:var(--disp);font-weight:400;letter-spacing:.5px}\n\n  /* ---------- top chrome ---------- */\n  header.top{color:#fff;position:sticky;top:0;z-index:20;border-bottom:3px solid var(--gold);\n    background:linear-gradient(180deg,#1e1e1e 0%,#0d0d0d 100%);\n    box-shadow:0 2px 14px rgba(0,0,0,.28)}\n  header.top::after{content:\"\";position:absolute;inset:0;pointer-events:none;opacity:.5;\n    background:repeating-linear-gradient(115deg,rgba(255,255,255,.03) 0 2px,transparent 2px 26px)}\n  .mark{width:30px;height:30px;flex:0 0 auto;display:grid;place-items:center;border-radius:8px;\n    background:var(--gold);box-shadow:0 2px 8px rgba(213,0,0,.5)}\n  .mark svg{width:17px;height:17px;color:#fff}\n  .top .wrap{display:flex;align-items:center;gap:24px;height:60px}\n  .brand{display:flex;align-items:baseline;gap:3px;font-family:var(--disp);\n    font-size:27px;letter-spacing:1px;line-height:1}\n  .brand .b1{color:#fff}.brand .b2{color:var(--gold)}\n  nav.tabs{display:flex;gap:2px;margin-left:6px}\n  nav.tabs a{font-family:var(--body);font-weight:600;font-size:14px;letter-spacing:1.2px;\n    text-transform:uppercase;color:#9fb0c6;padding:8px 13px;border-radius:7px}\n  nav.tabs a:hover{color:#fff;background:rgba(255,255,255,.06)}\n  nav.tabs a.on{color:#fff;background:var(--gold)}\n  .top .right{margin-left:auto;display:flex;align-items:center;gap:14px}\n  .live{display:flex;align-items:center;gap:7px;font-weight:600;font-size:12px;\n    letter-spacing:1.2px;text-transform:uppercase;color:#cfe}\n  .live .dot{width:8px;height:8px;border-radius:50%;background:#31d07a;\n    box-shadow:0 0 0 0 rgba(49,208,122,.7);animation:pulse 2s infinite}\n  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(49,208,122,.6)}70%{box-shadow:0 0 0 7px rgba(49,208,122,0)}100%{box-shadow:0 0 0 0 rgba(49,208,122,0)}}\n  @media (prefers-reduced-motion:reduce){.live .dot{animation:none}}\n\n  /* ---------- season / week bar ---------- */\n  .seasonbar{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:60px;z-index:15}\n  .seasonbar .wrap{display:flex;align-items:center;gap:18px;height:56px}\n  .season-label{font-family:var(--disp);font-size:20px;letter-spacing:.8px;\n    text-transform:uppercase;white-space:nowrap}\n  .season-label span{color:var(--muted)}\n  .weekstep{display:flex;align-items:center;gap:0;border:1px solid var(--line);border-radius:10px;\n    overflow:hidden;background:#fff;box-shadow:var(--shadow)}\n  .weekstep button{border:0;background:#fff;color:var(--ink);cursor:pointer;width:44px;height:40px;\n    display:grid;place-items:center;font-size:16px;transition:background .12s}\n  .weekstep button:hover:not(:disabled){background:#f1f4f8}\n  .weekstep button:disabled{color:#c4ccd6;cursor:not-allowed}\n  .weekstep button svg{width:15px;height:15px}\n  .wlabel{font-family:var(--disp);font-size:20px;letter-spacing:.8px;text-transform:uppercase;\n    min-width:118px;text-align:center;border-left:1px solid var(--line);border-right:1px solid var(--line);\n    height:40px;display:flex;align-items:center;justify-content:center;padding:0 6px}\n  .wlabel b{color:var(--gold);margin-left:7px}\n  .asof{margin-left:auto;font-size:12px;color:var(--muted);white-space:nowrap;letter-spacing:.3px;text-transform:uppercase}\n\n  /* ---------- section headings ---------- */\n  .eyebrow{font-family:var(--body);font-weight:600;font-size:14px;letter-spacing:2px;\n    text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:10px;margin:26px 0 12px}\n  .eyebrow::after{content:\"\";flex:1;height:1px;background:var(--line)}\n  .eyebrow .tag{color:var(--field);background:rgba(200,16,46,.09);padding:2px 8px;border-radius:5px;\n    font-size:11px;letter-spacing:1px}\n\n  /* ---------- featured matchup ---------- */\n  .feature{background:var(--chrome);border-radius:16px;overflow:hidden;color:#fff;\n    box-shadow:var(--shadow);cursor:pointer;transition:transform .12s ease}\n  .feature:hover{transform:translateY(-2px)}\n  .fteams{display:grid;grid-template-columns:1fr 78px 1fr;align-items:stretch}\n  .fside{padding:26px 24px;display:flex;flex-direction:column;gap:10px;position:relative}\n  .fside.home{align-items:flex-end;text-align:right}\n  .fside .badge{width:66px;height:66px;border-radius:50%;display:grid;place-items:center;\n    font-family:var(--disp);font-size:23px;letter-spacing:.5px;\n    box-shadow:0 3px 10px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.14)}\n  .fside .tname{font-family:var(--disp);font-size:46px;line-height:.88;\n    letter-spacing:.5px;text-transform:uppercase}\n  .fside .trec{color:#9fb2c9;font-weight:500;font-size:14px;letter-spacing:.6px;text-transform:uppercase}\n  .fside .seed{font-size:12px;color:#7f93ad;font-weight:600;letter-spacing:1.5px;text-transform:uppercase}\n  .fvs{display:grid;place-items:center;position:relative}\n  .fvs .at{font-family:var(--disp);font-size:19px;color:#8ea3bd;\n    background:var(--chrome);width:50px;height:50px;border-radius:50%;display:grid;place-items:center;\n    border:1px solid rgba(255,255,255,.14);position:relative;z-index:2}\n  .spine{position:absolute;top:0;bottom:0;width:6px;left:50%;transform:translateX(-50%);z-index:1}\n  .fmeta{display:flex;flex-wrap:wrap;gap:8px 18px;padding:14px 24px;background:rgba(255,255,255,.04);\n    border-top:1px solid rgba(255,255,255,.08);font-size:12.5px;color:#b9c8da;\n    letter-spacing:.3px;text-transform:uppercase}\n  .fmeta b{color:#fff;font-weight:600}\n  .fmeta .chip{background:rgba(255,255,255,.08);padding:3px 10px;border-radius:20px;font-weight:500;color:#dce7f2}\n  .fopen{padding:12px 24px;background:rgba(255,180,0,.10);border-top:1px solid rgba(255,255,255,.08);\n    display:flex;align-items:center;justify-content:center;gap:8px;color:var(--gold);\n    font-family:var(--body);font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase}\n  .fopen svg{width:14px;height:14px}\n\n  /* comparison rows (shared by feature + modal) */\n  .compare{background:var(--card);color:var(--ink);padding:18px 24px 22px}\n  .compare .sample{font-size:11px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;\n    font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px}\n  .compare .sample::before{content:\"\";width:6px;height:6px;border-radius:50%;background:var(--gold)}\n  .row{display:grid;grid-template-columns:66px 1fr 150px 1fr 66px;align-items:center;gap:10px;\n    padding:7px 0;border-top:1px solid var(--line)}\n  .row:first-of-type{border-top:0}\n  .row .v{font-family:var(--disp);font-size:20px;letter-spacing:.3px}\n  .row .v.l{text-align:right}.row .v.r{text-align:left}\n  .row .lab{text-align:center;font-size:11px;letter-spacing:.8px;text-transform:uppercase;\n    color:var(--muted);font-weight:500}\n  .bar{height:9px;border-radius:5px;background:#eef2f6;overflow:hidden;position:relative}\n  .bar i{position:absolute;top:0;bottom:0;display:block}\n  .bar.l i{right:0;border-radius:5px 0 0 5px}\n  .bar.r i{left:0;border-radius:0 5px 5px 0}\n  .win{color:var(--ink)}.lose{color:#9aa8b6}\n\n  /* ---------- games grid ---------- */\n  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}\n  .game{background:var(--card);border-radius:13px;box-shadow:var(--shadow);overflow:hidden;\n    border:1px solid var(--line);transition:transform .12s ease,box-shadow .12s ease;cursor:pointer}\n  .game:hover{transform:translateY(-3px);box-shadow:0 2px 4px rgba(11,18,32,.08),0 14px 30px rgba(11,18,32,.14)}\n  .game .spine2{height:5px;display:flex}\n  .game .spine2 span{flex:1}\n  .ghead{display:flex;align-items:center;justify-content:space-between;padding:10px 15px 4px;\n    font-size:11px;color:var(--muted);font-weight:500;letter-spacing:1px;text-transform:uppercase}\n  .ghead .kick{font-family:var(--body);font-weight:600;font-size:14px;color:var(--ink);letter-spacing:.5px}\n  .grow{display:flex;align-items:center;gap:12px;padding:9px 15px}\n  .grow+.grow{border-top:1px solid var(--line)}\n  .gbadge{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;\n    font-family:var(--disp);font-size:15px;letter-spacing:.3px;border:2px solid rgba(0,0,0,.06)}\n  .gteam{display:flex;flex-direction:column;line-height:1}\n  .gteam .gn{font-family:var(--disp);font-size:22px;letter-spacing:.4px;text-transform:uppercase}\n  .gteam .gc{font-size:11px;color:var(--muted);font-weight:500;letter-spacing:.6px;text-transform:uppercase;margin-top:2px}\n  .grow .rec{margin-left:auto;font-family:var(--disp);font-size:18px;color:var(--muted)}\n  .grow .gsc{margin-left:auto;font-family:var(--disp);font-size:30px;line-height:1;color:var(--muted);min-width:38px;text-align:right}\n  .grow .gsc.w{color:var(--ink)}\n  .grow.dim .gn{color:var(--muted)}\n  .kick.fin{color:var(--field);font-weight:700}\n  .boxln{display:grid;grid-template-columns:1fr auto auto;gap:2px 16px;align-items:center;\n    padding:8px 15px;border-top:1px solid var(--line);background:#fbfcfe}\n  .boxln .boxlbl{font-size:11px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;color:var(--muted)}\n  .boxln .tnum{font-family:var(--disp);font-size:15px;color:var(--ink);min-width:34px;text-align:right}\n  .gfoot{display:flex;align-items:center;gap:7px;padding:10px 15px;border-top:1px solid var(--line);flex-wrap:wrap}\n  .vchip{font-size:11px;font-weight:500;color:var(--muted);background:#f1f4f8;border-radius:20px;\n    padding:3px 9px;letter-spacing:.4px;text-transform:uppercase}\n  .vchip.div{background:rgba(200,16,46,.12);color:#a10c22}\n  .gfoot .cta{margin-left:auto;font-family:var(--body);font-weight:600;font-size:13px;letter-spacing:1px;\n    text-transform:uppercase;color:var(--field);display:flex;align-items:center;gap:5px}\n  .gfoot .cta svg{width:13px;height:13px}\n\n  /* ---------- detail modal ---------- */\n  .overlay{position:fixed;inset:0;background:rgba(6,12,24,.62);backdrop-filter:blur(3px);\n    z-index:50;display:none;padding:28px 16px;overflow-y:auto}\n  .overlay.on{display:block;animation:overlayIn .18s ease}\n  @keyframes overlayIn{from{opacity:0}to{opacity:1}}\n  /* press feedback + view transitions */\n  .game,nav.tabs a,.weekstep button,.wmenu button,.qfull,.mclose,.trhead,.cta,.tmore{transition:transform .1s ease,background .12s ease,box-shadow .12s ease}\n  nav.tabs a:active,.weekstep button:active,.wmenu button:active,.qfull:active,.mclose:active{transform:scale(.94)}\n  .game:active{transform:scale(.988)}\n  .trhead:active{background:#eef2f6}\n  .cta:active,.tmore:active{transform:translateX(2px)}\n  @keyframes viewIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}\n  .viewfade{animation:viewIn .28s cubic-bezier(.4,0,.2,1)}\n  @keyframes cardIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}\n  .grid .game,#tgrid .trow{animation:cardIn .3s cubic-bezier(.4,0,.2,1) both}\n  @media(prefers-reduced-motion:reduce){\n    .trbody{transition:none}.overlay.on,.viewfade,.grid .game,#tgrid .trow{animation:none}\n    .game:active,nav.tabs a:active,.weekstep button:active{transform:none}}\n  .modal{max-width:820px;margin:0 auto;background:var(--card);border-radius:16px;overflow:hidden;\n    box-shadow:0 24px 70px rgba(0,0,0,.4);animation:rise .18s ease}\n  @keyframes rise{from{transform:translateY(14px);opacity:.6}to{transform:translateY(0);opacity:1}}\n  @media (prefers-reduced-motion:reduce){.modal{animation:none}}\n  .mhead{background:var(--chrome);color:#fff;padding:20px 22px;position:relative}\n  .mclose{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;border:0;\n    background:rgba(255,255,255,.12);color:#fff;cursor:pointer;font-size:17px;display:grid;place-items:center}\n  .mclose:hover{background:rgba(255,255,255,.22)}\n  .mteams{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap}\n  .mteam{display:flex;align-items:center;gap:12px}\n  .mteam.h{flex-direction:row-reverse;text-align:right}\n  .mbadge{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;\n    font-family:var(--disp);font-size:18px;border:2px solid rgba(255,255,255,.16)}\n  .mteam .mn{font-family:var(--disp);font-size:30px;line-height:.9;text-transform:uppercase;letter-spacing:.5px}\n  .mteam .mr{font-size:12px;color:#9fb2c9;letter-spacing:.6px;text-transform:uppercase}\n  .mat{font-family:var(--disp);color:#8ea3bd;font-size:16px}\n  .mmeta{display:flex;flex-wrap:wrap;gap:7px 14px;justify-content:center;margin-top:14px;\n    font-size:12px;color:#b9c8da;letter-spacing:.3px;text-transform:uppercase}\n  .mmeta b{color:#fff;font-weight:600}\n  .mbody{padding:8px 22px 22px}\n  .gtitle{font-family:var(--body);font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;\n    color:var(--field);margin:20px 0 4px;display:flex;align-items:center;gap:9px}\n  .gtitle::after{content:\"\";flex:1;height:1px;background:var(--line)}\n  .legend{display:flex;justify-content:center;gap:20px;padding:14px 0 2px;font-size:11px;\n    color:var(--muted);letter-spacing:.6px;text-transform:uppercase}\n  .legend span{display:flex;align-items:center;gap:7px}\n  .legend i{width:12px;height:12px;border-radius:3px;display:inline-block}\n\n  .v .u{font-size:12px;color:var(--muted);margin-left:2px;font-family:var(--body);font-weight:600}\n  .row.na .v{color:#b4bec8;font-family:var(--body);font-weight:600;font-size:16px}\n  .row.na .lab{color:#aab4be}\n  .inj,.props{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px}\n  .injcol,.propcol{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fbfcfd}\n  .injteam{font-family:var(--disp);font-size:17px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px}\n  .injrow{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--muted);\n    letter-spacing:.4px;text-transform:uppercase;margin-top:7px}\n  .injrow b{color:var(--ink);font-family:var(--body);font-weight:600}\n  .injbar{height:7px;border-radius:4px;background:#eef2f6;overflow:hidden;margin-top:4px}\n  .injbar i{display:block;height:100%}\n  .injlist{margin-top:7px;display:flex;flex-direction:column;gap:6px}\n  .injlrow{display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-family:var(--body)}\n  .injlrow .injnm{font-weight:600;color:var(--ink);font-size:13px}\n  .injlrow .injpos{color:var(--muted);font-size:11px;letter-spacing:.4px;text-transform:uppercase;margin-left:6px}\n  .injlrow .injst{font-size:10.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}\n  .injlrow .injst.out{color:var(--bad)}.injlrow .injst.q{color:#8a6400}\n  .pill{font-size:11px;padding:2px 9px;border-radius:20px;letter-spacing:.5px}\n  .pill.ok{background:rgba(18,161,80,.14);color:#0e7a3b}\n  .pill.warn{background:rgba(229,150,0,.16);color:#8a6400}\n  .edge{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-top:6px}\n  .edgerow{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;font-size:13px;\n    letter-spacing:.3px;text-transform:uppercase;color:var(--muted)}\n  .edgerow+.edgerow{border-top:1px solid var(--line)}\n  .edgerow b{font-family:var(--disp);font-size:18px;color:var(--muted)}\n  .edgerow b.pos{color:var(--good)}.edgerow b.neg{color:var(--bad)}\n  .pnote{font-size:12px;color:var(--muted);margin:4px 0 8px;letter-spacing:.2px}\n  .ptab{width:100%;border-collapse:collapse;font-size:13px}\n  .ptab th{text-align:left;color:var(--muted);font-weight:600;font-size:11px;letter-spacing:.6px;\n    text-transform:uppercase;padding:5px 6px;border-bottom:1px solid var(--line)}\n  .ptab td{padding:6px 6px;border-bottom:1px solid #eef2f6;font-weight:500}\n  .ptab td:first-child{font-family:var(--disp);font-size:15px;letter-spacing:.2px}\n  .ptab .oddsline{display:block;font-size:9.5px;color:var(--muted);font-family:var(--body);letter-spacing:.2px;margin-top:1px}\n  .ptabwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}\n  .ptabwrap .ptab{min-width:360px}\n  .qline{margin-top:7px;font-family:var(--body);font-weight:600;font-size:12px;color:#8ea3bd;letter-spacing:.4px}\n  .qline b{color:#fff}\n  .ptab td.tnum b{font-family:var(--body);font-weight:700}\n  .ptab th{white-space:nowrap}\n  @media(max-width:560px){.inj,.props{grid-template-columns:1fr}}\n  /* ---- recent form (W-L / ATS / O/U, last 7) ---- */\n  .recform{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px}\n  .reccol{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fbfcfd}\n  .recrecs{display:flex;gap:8px;margin:2px 0 12px}\n  .recrec{flex:1;text-align:center;background:#fff;border:1px solid var(--line);border-radius:8px;padding:6px 4px}\n  .recrec span{display:block;font-size:9.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:600}\n  .recrec b{font-family:var(--disp);font-size:19px;letter-spacing:.5px;color:var(--ink)}\n  .reclog{display:flex;gap:6px}\n  .recg{flex:1;min-width:0;text-align:center}\n  .recg .rw{display:grid;place-items:center;height:26px;border-radius:6px;font-family:var(--disp);\n    font-size:14px;color:#fff;box-shadow:0 1px 3px rgba(11,18,32,.18)}\n  .recg .rw.win{background:var(--good)}.recg .rw.loss{background:var(--bad)}\n  .recg .rtag{font-size:10px;letter-spacing:.2px;margin-top:4px;color:var(--muted);line-height:1.2}\n  .recg .rtag i{font-style:normal;font-weight:700}\n  .rc-c{color:var(--good)}.rc-x{color:var(--bad)}.rc-p{color:var(--muted)}\n  .recleg{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:10.5px;color:var(--muted);letter-spacing:.3px}\n  .recleg i{font-style:normal;font-weight:700}\n  @media(max-width:560px){.inj,.props,.recform{grid-template-columns:1fr}}\n\n  /* logo badges (swap-in for abbreviations) */\n  .haslogo{background:#fff !important;border:2px solid rgba(0,0,0,.10) !important;overflow:hidden;padding:0}\n  .haslogo img{width:82%;height:82%;object-fit:contain;display:block}\n  .tbadge.haslogo{border-color:rgba(255,255,255,.55) !important}\n\n  /* week dropdown */\n  .weekstep{position:relative}\n  .wlabel{cursor:pointer;display:flex;align-items:center;gap:2px}\n  .wlabel .caret{width:13px;height:13px;margin-left:5px;color:var(--muted)}\n  .wmenu{position:absolute;top:46px;left:44px;z-index:30;background:#fff;border:1px solid var(--line);\n    border-radius:10px;box-shadow:0 14px 34px rgba(11,18,32,.18);padding:6px;display:grid;\n    grid-template-columns:repeat(3,1fr);gap:4px;width:210px}\n  .wmenu button{font-family:var(--disp);font-size:15px;letter-spacing:.4px;border:1px solid transparent;\n    background:#f6f8fa;color:var(--ink);border-radius:6px;padding:8px 0;cursor:pointer;text-transform:uppercase}\n  .wmenu button:hover{background:#e9eef4}\n  .wmenu button.on{background:var(--ink);color:#fff}\n\n  /* teams tab */\n  .tgrid{display:flex;flex-direction:column;gap:10px;max-width:840px;margin:0 auto}\n  .tcard{background:var(--card);border:1px solid var(--line);border-radius:13px;box-shadow:var(--shadow);\n    overflow:hidden;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}\n  .tcard:hover{transform:translateY(-3px);box-shadow:0 2px 4px rgba(11,18,32,.08),0 14px 30px rgba(11,18,32,.14)}\n  .tcard .thead{display:flex;align-items:center;gap:11px;padding:12px 14px;color:#fff}\n  .tcard .tbadge{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;\n    font-family:var(--disp);font-size:14px;background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.25)}\n  .tcard .tnm{font-family:var(--disp);font-size:21px;letter-spacing:.4px;text-transform:uppercase;line-height:1}\n  .tcard .tcity{font-size:10.5px;letter-spacing:.8px;text-transform:uppercase;opacity:.82;margin-top:2px}\n  .ngs{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line)}\n  .ngs .cell{background:#fff;padding:9px 12px}\n  .ngs .cell.wide{grid-column:1 / -1}\n  .ngs .n{font-family:var(--disp);font-size:20px;letter-spacing:.3px}\n  .ngs .n .u{font-family:var(--body);font-weight:600;font-size:12px;color:var(--muted);margin-left:2px}\n  .ngs .k{font-size:10px;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);font-weight:600;margin-top:2px}\n  .tmore{padding:9px 14px;border-top:1px solid var(--line);font-family:var(--body);font-weight:600;\n    font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--field);display:flex;align-items:center;gap:5px}\n  .tmore svg{width:12px;height:12px}\n\n  /* teams list (accordion) */\n  #tgrid{display:flex;flex-direction:column;gap:8px}\n  .trow{background:var(--card);border:1px solid var(--line);border-radius:11px;box-shadow:var(--shadow);overflow:hidden}\n  .trhead{display:flex;align-items:center;gap:13px;width:100%;border:0;background:transparent;cursor:pointer;\n    padding:0 15px 0 0;text-align:left;font-family:var(--body);color:var(--ink)}\n  .trhead:hover{background:#fafbfc}\n  .tstripe{width:6px;align-self:stretch;min-height:62px;flex:0 0 auto}\n  .trlogo{width:44px;height:44px;border-radius:50%;background:#fff;border:2px solid rgba(0,0,0,.08);\n    display:grid;place-items:center;flex:0 0 auto;overflow:hidden;margin:9px 3px 9px 0}\n  .trlogo img{width:82%;height:82%;object-fit:contain}\n  .trlogo.abbr{font-family:var(--disp);font-size:15px}\n  .trmeta{display:flex;flex-direction:column;gap:2px;line-height:1.02}\n  .trname{font-family:var(--disp);font-size:23px;letter-spacing:.4px;text-transform:uppercase}\n  .trcity{font-size:11px;color:var(--muted);letter-spacing:.7px;text-transform:uppercase}\n  .trkey{margin-left:auto;font-size:11px;color:var(--muted);letter-spacing:.7px;text-transform:uppercase}\n  .trkey b{font-family:var(--disp);font-size:19px;color:var(--ink);margin-left:6px}\n  .trchev{width:16px;height:16px;color:var(--muted);transition:transform .18s ease;flex:0 0 auto;margin-left:14px}\n  .trow.open .trchev{transform:rotate(90deg)}\n  .trow.open{box-shadow:0 2px 4px rgba(11,18,32,.08),0 12px 28px rgba(11,18,32,.13)}\n  .trbody{max-height:0;overflow:hidden;opacity:0;padding:0 16px;\n    transition:max-height .32s cubic-bezier(.4,0,.2,1),opacity .22s ease,padding .32s ease}\n  .trow.open .trbody{max-height:1400px;opacity:1;padding:2px 16px 16px}\n  .trbody .gtitle:first-child{margin-top:10px}\n  @media(prefers-reduced-motion:reduce){.trchev{transition:none}}\n  @media(max-width:560px){.trcity{display:none}.trname{font-size:20px}}\n\n  /* quick preview modal */\n  .qmodal{max-width:460px;margin:8vh auto 0;background:var(--card);border-radius:16px;overflow:hidden;\n    box-shadow:0 24px 70px rgba(0,0,0,.4);animation:rise .16s ease}\n  .qhead{background:var(--chrome);color:#fff;padding:16px 18px}\n  .qteams{display:flex;align-items:center;justify-content:space-between;gap:10px}\n  .qt{display:flex;align-items:center;gap:9px}\n  .qt.h{flex-direction:row-reverse}\n  .qbadge{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-family:var(--disp);\n    font-size:14px;border:2px solid rgba(255,255,255,.18)}\n  .qn{font-family:var(--disp);font-size:23px;text-transform:uppercase;letter-spacing:.4px;line-height:.95}\n  .qat{font-family:var(--disp);color:#8ea3bd;font-size:14px}\n  .qkick{text-align:center;font-size:11.5px;color:#b9c8da;letter-spacing:.5px;text-transform:uppercase;margin-top:9px}\n  .qscore{display:flex;align-items:center;justify-content:center;gap:20px;margin-top:11px}\n  .qscore .qsc{font-family:var(--disp);font-size:40px;line-height:1;color:#8ea3bd}\n  .qscore .qsc.w{color:#fff}\n  .qscore .qfin{font-family:var(--body);font-weight:700;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:var(--field);background:rgba(255,255,255,.08);border-radius:20px;padding:4px 11px}\n  .qsub{font-family:var(--body);font-weight:700;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--field);margin:12px 0 2px;padding-top:10px;border-top:2px solid var(--field)}\n  .qsub:first-child{padding-top:0;border-top:0}\n  .qsub + .qrow{border-top:0}\n  .qbody{padding:8px 18px 16px}\n  .qrow{display:grid;grid-template-columns:52px 1fr 52px;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}\n  .qrow:first-child{border-top:0}\n  .qrow .qv{font-family:var(--disp);font-size:20px}\n  .qrow .qv.l{text-align:right}.qrow .qv.r{text-align:left}\n  .qrow .qk{text-align:center;font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);font-weight:600}\n  .qfull{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;\n    background:var(--field);color:#fff;border:0;border-radius:9px;padding:11px;cursor:pointer;\n    font-family:var(--body);font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase}\n  .qfull:hover{filter:brightness(1.06)}\n  .qfull svg{width:14px;height:14px}\n  .qhead{position:relative}\n  .kv{display:grid;grid-template-columns:1fr 1fr;gap:2px 22px;margin-top:4px}\n  .kvrow{display:flex;justify-content:space-between;align-items:center;padding:8px 2px;border-bottom:1px solid #eef2f6;\n    font-size:12.5px;letter-spacing:.4px;text-transform:uppercase;color:var(--muted)}\n  .kvrow b{font-family:var(--disp);font-size:19px;color:var(--ink);letter-spacing:.3px}\n  .kvrow b .u{font-family:var(--body);font-weight:600;font-size:12px;color:var(--muted);margin-left:2px}\n  @media(max-width:560px){.kv{grid-template-columns:1fr}}\n\n  /* ---------- richness / polish ---------- */\n  .eyebrow::before{content:\"\";width:4px;height:16px;background:var(--gold);border-radius:2px;\n    display:inline-block;box-shadow:0 0 8px rgba(213,0,0,.35)}\n  .season-label{font-size:22px;color:var(--ink)}\n  .seasonbar{background:linear-gradient(180deg,#ffffff,#f5f8fb);box-shadow:0 1px 0 rgba(11,18,32,.05)}\n  nav.tabs a.on{box-shadow:0 2px 12px rgba(213,0,0,.45)}\n  .game{position:relative;border-color:#e6ebf1}\n  .game::before{content:\"\";position:absolute;inset:0;border-radius:13px;pointer-events:none;z-index:2;\n    box-shadow:inset 0 0 0 1px rgba(255,255,255,.55)}\n  .game:hover{box-shadow:0 3px 6px rgba(11,18,32,.10),0 18px 42px rgba(11,18,32,.17)}\n  .ghead{background:linear-gradient(180deg,#f8fafc,#ffffff)}\n  .gbadge.haslogo,.trlogo{box-shadow:0 2px 6px rgba(11,18,32,.15)}\n  .grow{transition:background .14s ease}\n  .game:hover .grow{background:linear-gradient(90deg,rgba(200,16,46,.045),transparent)}\n  .spine2 span{box-shadow:inset 0 -2px 4px rgba(0,0,0,.18)}\n  .gfoot{background:#fbfcfe}\n  .vchip{border:1px solid rgba(11,18,32,.05)}\n  .cta{padding:5px 9px;border-radius:20px}\n  .cta:hover{background:rgba(200,16,46,.10)}\n  .trow{position:relative}\n  .trhead:hover{background:linear-gradient(90deg,rgba(200,16,46,.05),#fafbfc)}\n  .trkey b{color:var(--gold)}\n  .trow.open{border-color:rgba(200,16,46,.30)}\n  .trow.open .trhead{background:linear-gradient(90deg,rgba(200,16,46,.06),#fff)}\n  .weekstep{box-shadow:0 2px 10px rgba(11,18,32,.10)}\n\n  /* ---- Next Gen Search ---- */\n  .searchbar{max-width:1180px;margin:0 auto 14px;background:var(--card);border:1px solid var(--line);\n    border-radius:14px;box-shadow:var(--shadow);overflow:hidden}\n  .sbtop{display:flex;align-items:stretch;gap:0;background:linear-gradient(180deg,#181818,#101010);\n    border-bottom:1px solid rgba(255,255,255,.06)}\n  .posseg{display:flex;flex:1;min-width:0}\n  .posseg button{flex:1;border:0;background:transparent;color:#c9cfd6;cursor:pointer;\n    font-family:var(--disp);font-size:16px;letter-spacing:.8px;text-transform:uppercase;\n    padding:13px 8px;position:relative;transition:color .12s ease,background .12s ease}\n  .posseg button:hover{color:#fff;background:rgba(255,255,255,.05)}\n  .posseg button.on{color:#fff}\n  .posseg button.on::after{content:\"\";position:absolute;left:14%;right:14%;bottom:0;height:3px;\n    background:var(--gold);border-radius:3px 3px 0 0;box-shadow:0 -1px 8px rgba(213,0,0,.6)}\n  .posseg button:active{transform:scale(.96)}\n  .sbfilters{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;padding:14px 16px}\n  .fld{display:flex;flex-direction:column;gap:5px}\n  .fld label{font-family:var(--body);font-weight:600;font-size:10.5px;letter-spacing:1.4px;\n    text-transform:uppercase;color:var(--muted)}\n  .fld select,.fld input{font-family:var(--body);font-weight:500;font-size:14px;color:var(--ink);\n    background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 11px;min-width:150px;\n    outline:none;transition:border-color .12s ease,box-shadow .12s ease}\n  .fld select:focus,.fld input:focus{border-color:var(--field);box-shadow:0 0 0 3px rgba(200,16,46,.12)}\n  .fld.grow{flex:1;min-width:180px}.fld.grow input{width:100%;box-sizing:border-box}\n  .schint{margin-left:auto;align-self:center;font-family:var(--body);font-weight:500;font-size:12.5px;\n    color:var(--muted);white-space:nowrap}\n  .schint b{color:var(--field)}\n  .stbl-wrap{max-width:1180px;margin:0 auto;overflow-x:auto;border:1px solid var(--line);\n    border-radius:14px;background:var(--card);box-shadow:var(--shadow)}\n  table.stbl{border-collapse:collapse;width:100%;font-family:var(--body);font-size:13.5px;min-width:760px}\n  table.stbl thead th{position:sticky;top:0;background:linear-gradient(180deg,#1c1c1c,#141414);color:#e7ebef;\n    font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:11px;padding:11px 10px;\n    text-align:right;white-space:nowrap;cursor:pointer;user-select:none;border-bottom:2px solid var(--gold)}\n  table.stbl thead th.lft{text-align:left}\n  table.stbl thead th:hover{background:#252525;color:#fff}\n  table.stbl thead th .arw{opacity:0;margin-left:4px;color:var(--gold);font-size:10px}\n  table.stbl thead th.sorted .arw{opacity:1}\n  table.stbl thead th.hero{color:#fff}\n  table.stbl thead th.hero.sorted .arw{color:#fff}\n  table.stbl tbody td{padding:9px 10px;text-align:right;white-space:nowrap;border-top:1px solid var(--line);\n    font-variant-numeric:tabular-nums}\n  table.stbl tbody tr:nth-child(even){background:#f7f9fb}\n  table.stbl tbody tr:hover{background:rgba(200,16,46,.06)}\n  table.stbl td.rk{text-align:center;color:var(--muted);font-weight:600;width:38px;font-size:12px}\n  table.stbl td.plr{text-align:left;min-width:210px}\n  .plrcell{display:flex;align-items:center;gap:9px}\n  .plrlogo{width:26px;height:26px;border-radius:6px;flex:0 0 26px;display:grid;place-items:center;\n    overflow:hidden;box-shadow:0 1px 4px rgba(11,18,32,.18)}\n  .plrlogo img{width:100%;height:100%;object-fit:contain;padding:2px;box-sizing:border-box}\n  .plrlogo.abbr{font-family:var(--disp);font-size:10px;letter-spacing:.3px}\n  .plrname{font-weight:600;color:var(--ink);line-height:1.1}\n  .plrsub{font-size:11px;color:var(--muted);letter-spacing:.4px}\n  table.stbl td.hero{font-family:var(--disp);font-size:16px;color:var(--ink);background:rgba(200,16,46,.05)}\n  table.stbl tbody td.hero{}\n  .pos-good{color:var(--good);font-weight:600}.pos-bad{color:var(--bad);font-weight:600}\n  .stbl-empty{padding:34px 16px;text-align:center;color:var(--muted);font-family:var(--body)}\n  .stmode{display:flex;gap:6px;max-width:1180px;margin:0 auto 16px;flex-wrap:wrap}\n  .stmode button{font-family:var(--body);font-weight:600;font-size:13px;letter-spacing:.5px;padding:8px 16px;\n    border:1px solid var(--line);background:var(--card);color:var(--muted);border-radius:9px;cursor:pointer;\n    transition:background .12s ease,color .12s ease,border-color .12s ease}\n  .stmode button:hover{color:var(--ink)}\n  .stmode button.on{background:var(--gold);color:#fff;border-color:var(--gold);box-shadow:0 2px 10px rgba(213,0,0,.35)}\n  .stmode button:active{transform:scale(.96)}\n  .stgrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:1180px;margin:0 auto}\n  .stgrp .grouphd{font-family:var(--disp);font-size:16px;letter-spacing:.5px;text-transform:uppercase;color:var(--ink);\n    margin:0 0 8px;display:flex;align-items:center;gap:9px}\n  .stgrp .grouphd::before{content:\"\";width:4px;height:15px;border-radius:2px;background:var(--gold)}\n  .stgrid .stbl{min-width:0}\n  .confgrp{margin-top:20px}\n  .confgrp:first-of-type{margin-top:2px}\n  .confhd{font-family:var(--disp);font-size:20px;letter-spacing:.5px;text-transform:uppercase;color:var(--ink);\n    margin:0 0 10px;display:flex;align-items:center;gap:10px}\n  .confhd::before{content:\"\";width:5px;height:19px;border-radius:2px;background:var(--gold)}\n  .confhd .n{font-family:var(--body);font-weight:600;font-size:12px;color:var(--muted);letter-spacing:.6px}\n  @media(max-width:820px){.stgrid{grid-template-columns:1fr}}\n  @media(max-width:560px){.schint{display:none}.fld select,.fld input{min-width:130px}}\n\n  footer{color:var(--muted);font-size:12px;text-align:center;padding:30px 0 40px;letter-spacing:.4px;text-transform:uppercase}\n  .note{max-width:1180px;margin:22px auto 0;padding:12px 16px;background:#fff;border:1px dashed var(--line);\n    border-radius:10px;color:var(--muted);font-size:12.5px;letter-spacing:.2px}\n  .note b{color:var(--ink)}\n  @media(max-width:720px){\n    .fside .tname{font-size:32px}.fside .badge{width:54px;height:54px;font-size:19px}\n    .top .wrap{height:auto;min-height:56px;gap:10px 12px;padding:8px 16px;flex-wrap:wrap}\n    .brand{font-size:21px}\n    nav.tabs{order:3;width:100%;overflow-x:auto;gap:2px;-webkit-overflow-scrolling:touch}\n    nav.tabs::-webkit-scrollbar{display:none}\n    nav.tabs a{padding:7px 11px;font-size:12.5px;white-space:nowrap}\n    .top .right{margin-left:auto}\n    .season-label span{display:none}\n    .row{grid-template-columns:50px 1fr 110px 1fr 50px}\n    .mteam .mn{font-size:23px}\n  }\n  @media(max-width:560px){\n    nav.tabs{gap:1px}\n    nav.tabs a{padding:7px 8px;font-size:11.5px;letter-spacing:.4px}\n    .mhead{padding:16px 16px}\n    .mteams{flex-direction:column;align-items:stretch;justify-content:flex-start;gap:9px}\n    .mteam,.mteam.a,.mteam.h{flex-direction:row;text-align:left;justify-content:flex-start;gap:12px}\n    .mbadge{width:44px;height:44px;font-size:16px;flex:0 0 44px}\n    .mteam .mn{font-size:22px}\n    .mteam .mr{font-size:11px}\n    .mat{align-self:center;font-size:15px}\n    .mclose{top:12px;right:12px}\n    .row{grid-template-columns:44px 1fr 96px 1fr 44px}\n    .legend{flex-wrap:wrap;gap:8px}\n  }\n  .statkey{margin:22px 0 0;border:1px solid var(--line);border-radius:11px;background:#fff;overflow:hidden;box-shadow:var(--shadow)} .statkey>summary{list-style:none;cursor:pointer;padding:13px 16px;font-family:var(--body);font-weight:700;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:var(--field);display:flex;align-items:center;gap:9px} .statkey>summary::-webkit-details-marker{display:none} .statkey>summary::before{content:'?';flex:0 0 auto;width:18px;height:18px;border-radius:50%;background:var(--field);color:#fff;font-weight:700;font-size:11px;display:grid;place-items:center} .statkey>summary::after{content:'+';margin-left:auto;font-family:var(--disp);font-size:20px;line-height:1;color:var(--muted)} .statkey[open]>summary::after{content:'-'} .statkey[open]>summary{border-bottom:1px solid var(--line)} .lgrid{display:grid;grid-template-columns:1fr 1fr;gap:2px 26px;padding:14px 16px 18px} .lgrp .lgh{font-family:var(--disp);font-size:14px;letter-spacing:.5px;text-transform:uppercase;color:var(--ink);margin:12px 0 5px;display:flex;align-items:center;gap:8px} .lgrp .lgh::before{content:'';width:4px;height:13px;border-radius:2px;background:var(--gold)} .lgrp:first-child .lgh,.lgrp:nth-child(2) .lgh{margin-top:0} .lrow{display:flex;gap:10px;padding:5px 0;border-top:1px solid #eef2f6;font-size:12.5px;line-height:1.35} .lrow:first-of-type{border-top:0} .lrow b{flex:0 0 42%;color:var(--ink);font-weight:700;letter-spacing:.2px} .lrow span{color:var(--muted)} @media(max-width:620px){.lgrid{grid-template-columns:1fr}.lgrp .lgh{margin-top:12px}.lgrp:nth-child(2) .lgh{margin-top:12px}.lrow b{flex:0 0 46%}}  .rlog{display:flex;flex-direction:column;gap:2px;margin-top:2px} .rlrow{display:grid;grid-template-columns:22px 1fr auto auto auto;align-items:center;gap:8px;padding:5px 2px;border-top:1px solid #eef2f6;font-size:12.5px} .rlrow:first-child{border-top:0} .rlhead{color:var(--muted);font-size:9.5px;letter-spacing:.8px;text-transform:uppercase;font-weight:600;padding:0 2px 1px} .rlhead span{font-family:var(--body);font-weight:600;color:var(--muted)} .rlres{width:20px;height:20px;border-radius:5px;display:grid;place-items:center;font-family:var(--disp);font-size:12px;color:#fff;line-height:1} .rlres.win{background:var(--good)}.rlres.loss{background:var(--bad)}.rlres.push{background:#8a94a0} .rlopp{font-family:var(--disp);font-size:13px;letter-spacing:.3px;text-transform:uppercase;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .rlsc{font-variant-numeric:tabular-nums;color:var(--muted);text-align:right;white-space:nowrap} .rlnum{font-variant-numeric:tabular-nums;font-weight:600;text-align:right;white-space:nowrap;min-width:46px;color:var(--ink)} .rlnum.rc-c{color:var(--good)}.rlnum.rc-x{color:var(--bad)}.rlnum.rc-p{color:var(--muted)}  .rkp{font-family:var(--body);font-weight:600;font-size:10px;letter-spacing:.3px;color:var(--muted);font-style:normal;white-space:nowrap} table.stbl td .rkp{display:block;margin-top:2px} .kvrow b .rkp{margin-left:7px;font-size:11px} .rkp.rktop{color:var(--gold)} .rkp.rkgood{color:var(--good)} .rkp.rkbad{color:var(--bad)}";

const LEAGUES = {
  cfb: {
    name: "NCAAF", long: "College Football", dataFile: "cfb_data.json", step: "week",
    seasonLabel: (s) => (s != null ? String(s) : ""),
    confOrder: ["SEC", "Big Ten", "Big 12", "ACC", "Pac-12", "Ind"],
    confFull: { SEC: "SEC", "Big Ten": "Big Ten", "Big 12": "Big 12", ACC: "ACC", "Pac-12": "Pac-12", Ind: "Independents" },
    overview: [
      ["ppg", "Points/G", "f1", false], ["papg", "Opp Pts/G", "f1", true], ["diff", "Point Diff", "fs1", false],
      ["totYdsG", "Total Yds/G", "f1", false], ["rushYdsG", "Rush Yds/G", "f1", false], ["passYdsG", "Pass Yds/G", "f1", false],
      ["ydsAllowedG", "Yds Allowed/G", "f1", true], ["toG", "Giveaways/G", "f1", true], ["takeG", "Takeaways/G", "f1", false],
      ["toMargin", "TO Margin", "fs1", false], ["thirdPct", "3rd Down %", "f1", false],
    ],
    standings: [["ppg", "PF", "f1"], ["papg", "PA", "f1"], ["diff", "Diff", "fs1"], ["totYdsG", "Yds/G", "f1"], ["ydsAllowedG", "YdsA/G", "f1"]],
    boxRows: [["Total Yds", "totYds", "f0"], ["Rush Yds", "rushYds", "f0"], ["Pass Yds", "passYds", "f0"], ["Turnovers", "to", "f0"]],
    boxLower: ["to"], hasLines: false,
  },
  ncaam: {
    name: "NCAAM", long: "College Basketball", dataFile: "ncaam_data.json", step: "date",
    seasonLabel: (s) => (s != null ? (s - 1) + "–" + String(s).slice(2) : ""),
    confOrder: ["ACC", "Big Ten", "Big 12", "SEC", "Big East", "Pac-12"],
    confFull: { ACC: "ACC", "Big Ten": "Big Ten", "Big 12": "Big 12", SEC: "SEC", "Big East": "Big East", "Pac-12": "Pac-12" },
    overview: [
      ["ppg", "Points/G", "f1", false], ["papg", "Opp Pts/G", "f1", true], ["diff", "Point Diff", "fs1", false],
      ["rpg", "Rebounds/G", "f1", false], ["apg", "Assists/G", "f1", false], ["spg", "Steals/G", "f1", false],
      ["bpg", "Blocks/G", "f1", false], ["topg", "Turnovers/G", "f1", true],
      ["fgPct", "FG%", "f1", false], ["fg3Pct", "3P%", "f1", false], ["ftPct", "FT%", "f1", false],
    ],
    standings: [["ppg", "PPG", "f1"], ["papg", "PAPG", "f1"], ["diff", "Diff", "fs1"], ["fgPct", "FG%", "f1"], ["fg3Pct", "3P%", "f1"]],
    boxRows: [["FG%", "fgPct", "f1"], ["3P%", "fg3Pct", "f1"], ["Rebounds", "reb", "f0"], ["Assists", "ast", "f0"], ["Turnovers", "to", "f0"]],
    boxLower: ["to"], hasLines: true,
  },
};
const RAW = "https://raw.githubusercontent.com/westonnick7/gridiron-report/main/data/";
const DASH = "—";
const FMT = {
  f1: (v) => (v == null ? DASH : Number(v).toFixed(1)),
  f0: (v) => (v == null ? DASH : Math.round(v)),
  fs1: (v) => (v == null ? DASH : (v > 0 ? "+" : "") + Number(v).toFixed(1)),
};
const f1 = FMT.f1, f0 = FMT.f0, fs1 = FMT.fs1;
const ord = (n) => { if (n == null) return ""; const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

function rankList(items, lower) {
  const vals = items.filter((x) => x.v != null && !isNaN(x.v)).sort((a, b) => (lower ? a.v - b.v : b.v - a.v));
  const out = {}; let prev = null, prevRank = 0;
  vals.forEach((x, i) => { const r = prev != null && x.v === prev ? prevRank : i + 1; out[x.id] = r; prev = x.v; prevRank = r; });
  return { ranks: out, n: vals.length };
}
function computeTeamRanks(d, overview) {
  const codes = Object.keys(d.teamStats || {});
  const ranks = {}, counts = {}; codes.forEach((c) => (ranks[c] = {}));
  overview.forEach(([k, , , lower]) => { const r = rankList(codes.map((c) => ({ id: c, v: (d.teamStats[c] || {})[k] })), !!lower); counts[k] = r.n; codes.forEach((c) => { if (r.ranks[c] != null) ranks[c][k] = r.ranks[c]; }); });
  return { ranks, counts };
}
function rkClass(rank, n, markBad) { let c = "rkp"; if (rank == null) return c; if (rank === 1) c += " rktop"; else if (rank <= 5) c += " rkgood"; else if (markBad && n && rank > n - 5) c += " rkbad"; return c; }

const META = (d, c) => (d.teamMeta && d.teamMeta[c]) || {};
const nick = (d, c) => META(d, c).name || c;
const cityOf = (d, c) => META(d, c).city || "";
const colorOf = (d, c) => META(d, c).color || "#555";
function txt(hex) {
  try { const h = hex.replace("#", ""); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#111" : "#fff"; } catch (e) { return "#fff"; }
}
function Logo({ d, code, cls }) {
  const [ok, setOk] = useState(true);
  const c = colorOf(d, code), url = META(d, code).logo;
  if (ok && url) return <div className={cls + " haslogo"}><img src={url} alt={code} loading="lazy" onError={() => setOk(false)} /></div>;
  return <div className={cls} style={{ background: c, color: txt(c) }}>{code}</div>;
}
const ChevR = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>);
const ChevL = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>);
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}
function useData(file) {
  const [data, setData] = useState({ teamStats: {}, teamMeta: {}, teamRecent: {}, schedule: [], conf: {} });
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    setStatus("loading");
    fetch(RAW + file).then((r) => r.json()).then((d) => { setData(d); setStatus("ok"); }).catch(() => setStatus("failed"));
  }, [file]);
  return { data, status };
}
const Rk = ({ n }) => (n ? <span style={{ fontFamily: "var(--body)", fontWeight: 700, fontSize: "11px", color: "var(--gold)", marginRight: "5px" }}>#{n}</span> : null);

function useApRank(d) {
  return useMemo(() => {
    const by = {}, m = {};
    (d.schedule || []).forEach((g) => {
      if (g.homeRank) (by[g.home] = by[g.home] || []).push([g.date, g.homeRank]);
      if (g.awayRank) (by[g.away] = by[g.away] || []).push([g.date, g.awayRank]);
    });
    Object.entries(by).forEach(([t, a]) => { a.sort((x, y) => (x[0] < y[0] ? -1 : 1)); m[t] = a[a.length - 1][1]; });
    return m;
  }, [d]);
}

// ---------- Box modal ----------
function BoxModal({ d, cfg, game, onClose, ap }) {
  const b = game.box || {};
  const a = game.away, h = game.home;
  const aH = b.awayH || b.awayQ || [], hH = b.homeH || b.homeQ || [];
  const nL = Math.max(aH.length, hH.length, cfg.key === "ncaam" ? 2 : 0);
  const llabels = Array.from({ length: nL }, (_, i) => (cfg.key === "ncaam" ? (i < 2 ? "H" + (i + 1) : "OT" + (i - 1)) : "Q" + (i + 1)));
  const as = b.awayStats, hs = b.homeStats;
  const rows = as && hs ? cfg.boxRows : [];
  return (
    <div className="modal">
      <div className="mhead">
        <button className="mclose" aria-label="Close" onClick={onClose}>{"×"}</button>
        <div className="mteams">
          <div className="mteam a"><Logo d={d} code={a} cls="mbadge" /><div><div className="mn"><Rk n={ap[a]} />{nick(d, a)}</div><div className="mr">{cityOf(d, a)}</div></div></div>
          <div className="mat">{b.awayScore}&nbsp;&ndash;&nbsp;{b.homeScore}</div>
          <div className="mteam h"><Logo d={d} code={h} cls="mbadge" /><div><div className="mn"><Rk n={ap[h]} />{nick(d, h)}</div><div className="mr">{cityOf(d, h)}</div></div></div>
        </div>
        <div className="mmeta"><span className="chip">Final</span><span>{fmtDate(game.date)}</span>{game.venue && <span>{game.venue}</span>}</div>
      </div>
      <div className="mbody">
        {cfg.hasLines && nL > 0 && <>
          <div className="gtitle">Line Score</div>
          <div className="stbl-wrap"><table className="stbl">
            <thead><tr><th className="lft">Team</th>{llabels.map((q) => <th key={q}>{q}</th>)}<th>Final</th></tr></thead>
            <tbody>
              <tr><td className="plr"><div className="plrcell"><Logo d={d} code={a} cls="plrlogo" /><span className="plrname">{nick(d, a)}</span></div></td>{llabels.map((q, i) => <td key={q}>{aH[i] != null ? aH[i] : DASH}</td>)}<td className="hero">{b.awayScore}</td></tr>
              <tr><td className="plr"><div className="plrcell"><Logo d={d} code={h} cls="plrlogo" /><span className="plrname">{nick(d, h)}</span></div></td>{llabels.map((q, i) => <td key={q}>{hH[i] != null ? hH[i] : DASH}</td>)}<td className="hero">{b.homeScore}</td></tr>
            </tbody>
          </table></div>
        </>}
        {rows.length > 0 && <>
          <div className="gtitle">Team Stats</div>
          <div className="compare">{rows.map(([lab, key, fk]) => {
            const fmt = FMT[fk]; const av = as[key], hv = hs[key];
            const a2 = av == null ? 0 : av, h2 = hv == null ? 0 : hv, max = Math.max(a2, h2) || 1, ca = colorOf(d, a), ch = colorOf(d, h);
            const lower = cfg.boxLower.indexOf(key) >= 0;
            const aw = lower ? a2 < h2 : a2 > h2, hw = lower ? h2 < a2 : h2 > a2;
            return (<div className="row" key={lab}>
              <div className={"v l " + (aw ? "win" : "lose")}>{fmt(av)}</div>
              <div className="bar l"><i style={{ width: Math.round(a2 / max * 100) + "%", background: ca }} /></div>
              <div className="lab">{lab}</div>
              <div className="bar r"><i style={{ width: Math.round(h2 / max * 100) + "%", background: ch }} /></div>
              <div className={"v r " + (hw ? "win" : "lose")}>{fmt(hv)}</div>
            </div>);
          })}</div>
        </>}
      </div>
    </div>
  );
}

// ---------- Scores ----------
function ScoresView({ d, cfg, status, onOpen, ap }) {
  const sched = d.schedule || [];
  const byWeek = cfg.step === "week";
  const keys = byWeek
    ? Array.from(new Set(sched.map((g) => g.week).filter((w) => w != null))).sort((a, b) => a - b)
    : Array.from(new Set(sched.map((g) => g.date))).sort();
  const keyOf = (g) => (byWeek ? g.week : g.date);
  const lastFinal = [...sched].filter((g) => g.final).map(keyOf).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).pop();
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstUpcoming = byWeek ? keys.find((w) => sched.some((g) => g.week === w && !g.final)) : keys.find((dt) => dt >= todayStr);
  const def = lastFinal != null ? lastFinal : (firstUpcoming != null ? firstUpcoming : (keys.length ? keys[0] : null));
  const [sel, setSel] = useState(null);
  useEffect(() => { if (sel == null && def != null) setSel(def); }, [def]);
  const cur = sel != null ? sel : def;
  const idx = keys.indexOf(cur);
  const games = sched.filter((g) => keyOf(g) === cur).sort((x, y) => (x.date < y.date ? -1 : 1));
  const label = byWeek ? ("Week " + cur) : fmtDate(cur);
  return (
    <main className="wrap viewfade" key="scores">
      <div className="seasonbar"><div className="wrap">
        <div className="season-label">{cfg.seasonLabel(d.season)}</div>
        <div className="weekstep">
          <button onClick={() => idx > 0 && setSel(keys[idx - 1])} disabled={idx <= 0}><ChevL /></button>
          <button className="wlabel">{label}</button>
          <button onClick={() => idx < keys.length - 1 && setSel(keys[idx + 1])} disabled={idx >= keys.length - 1}><ChevR /></button>
        </div>
        <div className="asof">Updated {d.updated || ""}</div>
      </div></div>
      <div className="wrap">
        <div className="eyebrow">{label} <span className="tag">{games.length} games</span></div>
        {games.length ? <div className="grid">{games.map((g, i) => {
          const a = g.away, h = g.home, ca = colorOf(d, a), ch = colorOf(d, h), bx = g.box;
          const aW = bx && bx.awayScore > bx.homeScore, hW = bx && bx.homeScore > bx.awayScore;
          return (<div className={"game" + (bx ? " final" : "")} key={i} onClick={() => bx && onOpen(g)}>
            <div className="spine2"><span style={{ background: ca }} /><span style={{ background: ch }} /></div>
            <div className="ghead"><span>{(d.conf[a] && d.conf[h] && d.conf[a] === d.conf[h]) ? d.conf[a] : "Non-Conf"}</span>{bx ? <span className="kick fin">Final</span> : <span className="kick">{fmtDate(g.date)}</span>}</div>
            <div className={"grow" + (bx && !aW ? " dim" : "")}><Logo d={d} code={a} cls="gbadge" /><div className="gteam"><div className="gn"><Rk n={g.awayRank} />{nick(d, a)}</div><div className="gc">{a} &middot; Away</div></div>{bx ? <span className={"gsc tnum" + (aW ? " w" : "")}>{bx.awayScore}</span> : <span className="rec tnum">{(d.teamStats[a] || {}).record || ""}</span>}</div>
            <div className={"grow" + (bx && !hW ? " dim" : "")}><Logo d={d} code={h} cls="gbadge" /><div className="gteam"><div className="gn"><Rk n={g.homeRank} />{nick(d, h)}</div><div className="gc">{h} &middot; Home</div></div>{bx ? <span className={"gsc tnum" + (hW ? " w" : "")}>{bx.homeScore}</span> : <span className="rec tnum">{(d.teamStats[h] || {}).record || ""}</span>}</div>
            <div className="gfoot">{g.venue && <span className="vchip">{g.venue}</span>}{bx && <a className="cta" href="#" onClick={(e) => e.preventDefault()}>Box score <ChevR /></a>}</div>
          </div>);
        })}</div> : <div className="note">{status === "failed" ? "Schedule unavailable right now." : "No games on this date."}</div>}
      </div>
    </main>
  );
}

// ---------- Standings ----------
function wins(s) { const m = /^(\d+)-(\d+)/.exec((s && s.record) || ""); return m ? +m[1] : 0; }
function losses(s) { const m = /^(\d+)-(\d+)/.exec((s && s.record) || ""); return m ? +m[2] : 0; }
function sortTeams(d, codes) {
  return codes.slice().sort((a, b) => {
    const sa = d.teamStats[a] || {}, sb = d.teamStats[b] || {};
    const pa = wins(sa) / ((wins(sa) + losses(sa)) || 1), pb = wins(sb) / ((wins(sb) + losses(sb)) || 1);
    if (pb !== pa) return pb - pa; return (sb.diff || 0) - (sa.diff || 0);
  });
}
function StTable({ d, cfg, codes, ap }) {
  return (<div className="stbl-wrap"><table className="stbl">
    <thead><tr><th className="lft">Team</th><th>Rec</th>{cfg.standings.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
    <tbody>{codes.map((c) => { const s = d.teamStats[c] || {}; return (<tr key={c}>
      <td className="plr"><div className="plrcell"><Logo d={d} code={c} cls="plrlogo" /><span><span className="plrname"><Rk n={ap[c]} />{nick(d, c)}</span><br /><span className="plrsub">{cityOf(d, c)}</span></span></div></td>
      <td>{s.record || DASH}</td>{cfg.standings.map(([k, , fk]) => <td key={k}>{FMT[fk](s[k])}</td>)}
    </tr>); })}</tbody>
  </table></div>);
}
function StandingsView({ d, cfg, ap }) {
  const codes = Object.keys(d.teamStats);
  if (!codes.length) return <div className="note">Standings load once the season tips off and games are played.</div>;
  const confs = cfg.confOrder.filter((cf) => codes.some((c) => d.conf[c] === cf));
  return (<section className="wrap viewfade" key="standings">
    <div className="eyebrow">Standings <span className="tag">{cfg.seasonLabel(d.season)}</span></div>
    <div className="stgrid">{confs.map((cf) => (
      <div className="stgrp" key={cf}><div className="grouphd">{cfg.confFull[cf] || cf}</div>
        <StTable d={d} cfg={cfg} codes={sortTeams(d, codes.filter((c) => d.conf[c] === cf))} ap={ap} /></div>))}</div>
  </section>);
}

// ---------- Teams ----------
function TeamRow({ d, cfg, code, open, onToggle, ranks, counts, ap }) {
  const s = d.teamStats[code] || {}, c = colorOf(d, code);
  const log = (d.teamRecent[code] || []).slice(0, 10);
  const rk = ranks || {}, cn = counts || {};
  return (<div className={"trow" + (open ? " open" : "")}>
    <button className="trhead" aria-expanded={open} onClick={onToggle}>
      <span className="tstripe" style={{ background: c }} /><Logo d={d} code={code} cls="trlogo" />
      <span className="trmeta"><span className="trname"><Rk n={ap[code]} />{nick(d, code)}</span><span className="trcity">{cityOf(d, code)}</span></span>
      <span className="trkey">Rec <b>{s.record || "0-0"}</b></span>
      <svg className="trchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
    </button>
    <div className="trbody">
      <div className="gtitle">Team Overview <span style={{ marginLeft: "auto", fontFamily: "var(--body)", fontWeight: 600, fontSize: "10px", letterSpacing: ".6px", color: "var(--muted)" }}>Avg &middot; League Rank</span></div>
      <div className="kv">{cfg.overview.map(([k, lab, fk]) => (<div className="kvrow" key={k}><span>{lab}</span><b>{FMT[fk](s[k])}{rk[k] ? <i className={rkClass(rk[k], cn[k], true)} title={ord(rk[k]) + " of " + cn[k] + " teams"}>{ord(rk[k])}</i> : null}</b></div>))}</div>
      {log.length > 0 && <>
        <div className="gtitle">Recent Form &middot; Last {log.length}</div>
        <div className="rlog">
          <div className="rlrow rlhead" style={{ gridTemplateColumns: "22px 1fr auto" }}><span /><span className="rlopp">Opp</span><span className="rlsc">Score</span></div>
          {log.map((r, i) => (<div className="rlrow" key={i} style={{ gridTemplateColumns: "22px 1fr auto" }}>
            <span className={"rlres " + (r.result === "W" ? "win" : "loss")}>{r.result}</span>
            <span className="rlopp">{(r.home ? "vs " : "@ ") + r.opp}</span>
            <span className="rlsc">{r.ptsFor}&ndash;{r.ptsAgainst}</span>
          </div>))}
        </div>
      </>}
    </div>
  </div>);
}
function TeamsView({ d, cfg, ap }) {
  const [openC, setOpenC] = useState(null);
  const codes = Object.keys(d.teamStats);
  const tr = useMemo(() => computeTeamRanks(d, cfg.overview), [d]);
  if (!codes.length) return <div className="note">Team pages load once the season tips off and games are played.</div>;
  const confs = cfg.confOrder.filter((cf) => codes.some((c) => d.conf[c] === cf));
  return (<section className="wrap viewfade" key="teams">
    <div className="eyebrow">All Teams <span className="tag">Overview &middot; League Rank</span></div>
    {confs.map((cf) => { const cc = codes.filter((c) => d.conf[c] === cf).sort((a, b) => nick(d, a).localeCompare(nick(d, b)));
      return (<div className="confgrp" key={cf}><div className="confhd">{cfg.confFull[cf] || cf} <span className="n">{cc.length} teams</span></div>
        <div className="tgrid">{cc.map((c) => <TeamRow key={c} d={d} cfg={cfg} code={c} ranks={tr.ranks[c]} counts={tr.counts} ap={ap} open={openC === c} onToggle={() => setOpenC(openC === c ? null : c)} />)}</div></div>);
    })}
  </section>);
}

// ---------- App ----------
const TABS = [["scores", "Scores"], ["standings", "Standings"], ["teams", "Teams"]];
export default function CollegeApp({ sport, setSport, league }) {
  const cfg = { ...LEAGUES[league], key: league };
  const { data, status } = useData(cfg.dataFile);
  const ap = useApRank(data);
  const [view, setView] = useState("scores");
  const [modal, setModal] = useState(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setModal(null); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (<>
    <style>{CSS}</style>
    <header className="top"><div className="wrap">
      <div className="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg></div>
      <div className="brand"><span className="b1">REDZONE</span><span className="b2">LABS</span></div>
      <nav className="tabs">{TABS.map(([v, l]) => <a key={v} href="#" className={view === v ? "on" : ""} onClick={(e) => { e.preventDefault(); setView(v); }}>{l}</a>)}</nav>
      <div className="right"><select value={sport} onChange={(e) => setSport(e.target.value)} aria-label="Sport" style={{ fontFamily: "var(--body)", fontWeight: 700, fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: "#fff", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.25)", borderRadius: "7px", padding: "6px 10px", cursor: "pointer", marginRight: "10px", outline: "none" }}><option value="nfl">NFL</option><option value="nba">NBA</option><option value="nhl">NHL</option><option value="ncaaf">NCAAF</option><option value="ncaam">NCAAM</option></select><div className="live"><span className="dot" />{cfg.name}</div></div>
    </div></header>
    {view === "scores" && <ScoresView d={data} cfg={cfg} status={status} onOpen={(g) => setModal(g)} ap={ap} />}
    {view === "standings" && <StandingsView d={data} cfg={cfg} ap={ap} />}
    {view === "teams" && <TeamsView d={data} cfg={cfg} ap={ap} />}
    <footer>Redzone Labs &middot; {cfg.long} &middot; Power conferences &middot; Data via SportsDataverse</footer>
    <div className={"overlay" + (modal ? " on" : "")} onClick={(e) => { if (e.target.classList.contains("overlay")) setModal(null); }}>
      {modal && <BoxModal d={data} cfg={cfg} game={modal} onClose={() => setModal(null)} ap={ap} />}
    </div>
  </>);
}
