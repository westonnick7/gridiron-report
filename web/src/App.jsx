import React, { useState, useEffect, useCallback } from "react";

const CSS = "  :root{\n    --bg:#E9EDF2; --card:#FFFFFF; --ink:#0B1220; --muted:#5B6B7C; --line:#DCE3EB;\n    --chrome:#141414; --chrome2:#242424; --gold:#D50000; --good:#1A8A4B; --bad:#D50000;\n    --field:#C8102E; --shadow:0 1px 2px rgba(17,17,17,.06),0 8px 24px rgba(17,17,17,.09);\n    --disp:\"Anton\",Impact,Haettenschweiler,\"Arial Narrow Bold\",sans-serif;\n    --body:\"Oswald\",system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;\n  }\n  *{box-sizing:border-box}\n  body{margin:0;color:var(--ink);font-family:var(--body);font-weight:400;font-size:15px;line-height:1.4;\n    -webkit-font-smoothing:antialiased;background:var(--bg);\n    background-image:radial-gradient(1100px 380px at 50% -120px,#ffffff 0%,rgba(255,255,255,0) 70%),\n      linear-gradient(180deg,#eef1f6 0%,#e4e8ef 100%);background-attachment:fixed}\n  h1,h2,h3{margin:0}\n  a{color:inherit;text-decoration:none}\n  .wrap{max-width:1180px;margin:0 auto;padding:0 20px}\n  .tnum{font-variant-numeric:tabular-nums}\n  .disp{font-family:var(--disp);font-weight:400;letter-spacing:.5px}\n\n  /* ---------- top chrome ---------- */\n  header.top{color:#fff;position:sticky;top:0;z-index:20;border-bottom:3px solid var(--gold);\n    background:linear-gradient(180deg,#1e1e1e 0%,#0d0d0d 100%);\n    box-shadow:0 2px 14px rgba(0,0,0,.28)}\n  header.top::after{content:\"\";position:absolute;inset:0;pointer-events:none;opacity:.5;\n    background:repeating-linear-gradient(115deg,rgba(255,255,255,.03) 0 2px,transparent 2px 26px)}\n  .mark{width:30px;height:30px;flex:0 0 auto;display:grid;place-items:center;border-radius:8px;\n    background:var(--gold);box-shadow:0 2px 8px rgba(213,0,0,.5)}\n  .mark svg{width:17px;height:17px;color:#fff}\n  .top .wrap{display:flex;align-items:center;gap:24px;height:60px}\n  .brand{display:flex;align-items:baseline;gap:3px;font-family:var(--disp);\n    font-size:27px;letter-spacing:1px;line-height:1}\n  .brand .b1{color:#fff}.brand .b2{color:var(--gold)}\n  nav.tabs{display:flex;gap:2px;margin-left:6px}\n  nav.tabs a{font-family:var(--body);font-weight:600;font-size:14px;letter-spacing:1.2px;\n    text-transform:uppercase;color:#9fb0c6;padding:8px 13px;border-radius:7px}\n  nav.tabs a:hover{color:#fff;background:rgba(255,255,255,.06)}\n  nav.tabs a.on{color:#fff;background:var(--gold)}\n  .top .right{margin-left:auto;display:flex;align-items:center;gap:14px}\n  .live{display:flex;align-items:center;gap:7px;font-weight:600;font-size:12px;\n    letter-spacing:1.2px;text-transform:uppercase;color:#cfe}\n  .live .dot{width:8px;height:8px;border-radius:50%;background:#31d07a;\n    box-shadow:0 0 0 0 rgba(49,208,122,.7);animation:pulse 2s infinite}\n  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(49,208,122,.6)}70%{box-shadow:0 0 0 7px rgba(49,208,122,0)}100%{box-shadow:0 0 0 0 rgba(49,208,122,0)}}\n  @media (prefers-reduced-motion:reduce){.live .dot{animation:none}}\n\n  /* ---------- season / week bar ---------- */\n  .seasonbar{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:60px;z-index:15}\n  .seasonbar .wrap{display:flex;align-items:center;gap:18px;height:56px}\n  .season-label{font-family:var(--disp);font-size:20px;letter-spacing:.8px;\n    text-transform:uppercase;white-space:nowrap}\n  .season-label span{color:var(--muted)}\n  .weekstep{display:flex;align-items:center;gap:0;border:1px solid var(--line);border-radius:10px;\n    overflow:hidden;background:#fff;box-shadow:var(--shadow)}\n  .weekstep button{border:0;background:#fff;color:var(--ink);cursor:pointer;width:44px;height:40px;\n    display:grid;place-items:center;font-size:16px;transition:background .12s}\n  .weekstep button:hover:not(:disabled){background:#f1f4f8}\n  .weekstep button:disabled{color:#c4ccd6;cursor:not-allowed}\n  .weekstep button svg{width:15px;height:15px}\n  .wlabel{font-family:var(--disp);font-size:20px;letter-spacing:.8px;text-transform:uppercase;\n    min-width:118px;text-align:center;border-left:1px solid var(--line);border-right:1px solid var(--line);\n    height:40px;display:flex;align-items:center;justify-content:center;padding:0 6px}\n  .wlabel b{color:var(--gold);margin-left:7px}\n  .asof{margin-left:auto;font-size:12px;color:var(--muted);white-space:nowrap;letter-spacing:.3px;text-transform:uppercase}\n\n  /* ---------- section headings ---------- */\n  .eyebrow{font-family:var(--body);font-weight:600;font-size:14px;letter-spacing:2px;\n    text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:10px;margin:26px 0 12px}\n  .eyebrow::after{content:\"\";flex:1;height:1px;background:var(--line)}\n  .eyebrow .tag{color:var(--field);background:rgba(200,16,46,.09);padding:2px 8px;border-radius:5px;\n    font-size:11px;letter-spacing:1px}\n\n  /* ---------- featured matchup ---------- */\n  .feature{background:var(--chrome);border-radius:16px;overflow:hidden;color:#fff;\n    box-shadow:var(--shadow);cursor:pointer;transition:transform .12s ease}\n  .feature:hover{transform:translateY(-2px)}\n  .fteams{display:grid;grid-template-columns:1fr 78px 1fr;align-items:stretch}\n  .fside{padding:26px 24px;display:flex;flex-direction:column;gap:10px;position:relative}\n  .fside.home{align-items:flex-end;text-align:right}\n  .fside .badge{width:66px;height:66px;border-radius:50%;display:grid;place-items:center;\n    font-family:var(--disp);font-size:23px;letter-spacing:.5px;\n    box-shadow:0 3px 10px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.14)}\n  .fside .tname{font-family:var(--disp);font-size:46px;line-height:.88;\n    letter-spacing:.5px;text-transform:uppercase}\n  .fside .trec{color:#9fb2c9;font-weight:500;font-size:14px;letter-spacing:.6px;text-transform:uppercase}\n  .fside .seed{font-size:12px;color:#7f93ad;font-weight:600;letter-spacing:1.5px;text-transform:uppercase}\n  .fvs{display:grid;place-items:center;position:relative}\n  .fvs .at{font-family:var(--disp);font-size:19px;color:#8ea3bd;\n    background:var(--chrome);width:50px;height:50px;border-radius:50%;display:grid;place-items:center;\n    border:1px solid rgba(255,255,255,.14);position:relative;z-index:2}\n  .spine{position:absolute;top:0;bottom:0;width:6px;left:50%;transform:translateX(-50%);z-index:1}\n  .fmeta{display:flex;flex-wrap:wrap;gap:8px 18px;padding:14px 24px;background:rgba(255,255,255,.04);\n    border-top:1px solid rgba(255,255,255,.08);font-size:12.5px;color:#b9c8da;\n    letter-spacing:.3px;text-transform:uppercase}\n  .fmeta b{color:#fff;font-weight:600}\n  .fmeta .chip{background:rgba(255,255,255,.08);padding:3px 10px;border-radius:20px;font-weight:500;color:#dce7f2}\n  .fopen{padding:12px 24px;background:rgba(255,180,0,.10);border-top:1px solid rgba(255,255,255,.08);\n    display:flex;align-items:center;justify-content:center;gap:8px;color:var(--gold);\n    font-family:var(--body);font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase}\n  .fopen svg{width:14px;height:14px}\n\n  /* comparison rows (shared by feature + modal) */\n  .compare{background:var(--card);color:var(--ink);padding:18px 24px 22px}\n  .compare .sample{font-size:11px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;\n    font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px}\n  .compare .sample::before{content:\"\";width:6px;height:6px;border-radius:50%;background:var(--gold)}\n  .row{display:grid;grid-template-columns:66px 1fr 150px 1fr 66px;align-items:center;gap:10px;\n    padding:7px 0;border-top:1px solid var(--line)}\n  .row:first-of-type{border-top:0}\n  .row .v{font-family:var(--disp);font-size:20px;letter-spacing:.3px}\n  .row .v.l{text-align:right}.row .v.r{text-align:left}\n  .row .lab{text-align:center;font-size:11px;letter-spacing:.8px;text-transform:uppercase;\n    color:var(--muted);font-weight:500}\n  .bar{height:9px;border-radius:5px;background:#eef2f6;overflow:hidden;position:relative}\n  .bar i{position:absolute;top:0;bottom:0;display:block}\n  .bar.l i{right:0;border-radius:5px 0 0 5px}\n  .bar.r i{left:0;border-radius:0 5px 5px 0}\n  .win{color:var(--ink)}.lose{color:#9aa8b6}\n\n  /* ---------- games grid ---------- */\n  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}\n  .game{background:var(--card);border-radius:13px;box-shadow:var(--shadow);overflow:hidden;\n    border:1px solid var(--line);transition:transform .12s ease,box-shadow .12s ease;cursor:pointer}\n  .game:hover{transform:translateY(-3px);box-shadow:0 2px 4px rgba(11,18,32,.08),0 14px 30px rgba(11,18,32,.14)}\n  .game .spine2{height:5px;display:flex}\n  .game .spine2 span{flex:1}\n  .ghead{display:flex;align-items:center;justify-content:space-between;padding:10px 15px 4px;\n    font-size:11px;color:var(--muted);font-weight:500;letter-spacing:1px;text-transform:uppercase}\n  .ghead .kick{font-family:var(--body);font-weight:600;font-size:14px;color:var(--ink);letter-spacing:.5px}\n  .grow{display:flex;align-items:center;gap:12px;padding:9px 15px}\n  .grow+.grow{border-top:1px solid var(--line)}\n  .gbadge{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;\n    font-family:var(--disp);font-size:15px;letter-spacing:.3px;border:2px solid rgba(0,0,0,.06)}\n  .gteam{display:flex;flex-direction:column;line-height:1}\n  .gteam .gn{font-family:var(--disp);font-size:22px;letter-spacing:.4px;text-transform:uppercase}\n  .gteam .gc{font-size:11px;color:var(--muted);font-weight:500;letter-spacing:.6px;text-transform:uppercase;margin-top:2px}\n  .grow .rec{margin-left:auto;font-family:var(--disp);font-size:18px;color:var(--muted)}\n  .gfoot{display:flex;align-items:center;gap:7px;padding:10px 15px;border-top:1px solid var(--line);flex-wrap:wrap}\n  .vchip{font-size:11px;font-weight:500;color:var(--muted);background:#f1f4f8;border-radius:20px;\n    padding:3px 9px;letter-spacing:.4px;text-transform:uppercase}\n  .vchip.div{background:rgba(200,16,46,.12);color:#a10c22}\n  .gfoot .cta{margin-left:auto;font-family:var(--body);font-weight:600;font-size:13px;letter-spacing:1px;\n    text-transform:uppercase;color:var(--field);display:flex;align-items:center;gap:5px}\n  .gfoot .cta svg{width:13px;height:13px}\n\n  /* ---------- detail modal ---------- */\n  .overlay{position:fixed;inset:0;background:rgba(6,12,24,.62);backdrop-filter:blur(3px);\n    z-index:50;display:none;padding:28px 16px;overflow-y:auto}\n  .overlay.on{display:block;animation:overlayIn .18s ease}\n  @keyframes overlayIn{from{opacity:0}to{opacity:1}}\n  /* press feedback + view transitions */\n  .game,nav.tabs a,.weekstep button,.wmenu button,.qfull,.mclose,.trhead,.cta,.tmore{transition:transform .1s ease,background .12s ease,box-shadow .12s ease}\n  nav.tabs a:active,.weekstep button:active,.wmenu button:active,.qfull:active,.mclose:active{transform:scale(.94)}\n  .game:active{transform:scale(.988)}\n  .trhead:active{background:#eef2f6}\n  .cta:active,.tmore:active{transform:translateX(2px)}\n  @keyframes viewIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}\n  .viewfade{animation:viewIn .28s cubic-bezier(.4,0,.2,1)}\n  @keyframes cardIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}\n  .grid .game,#tgrid .trow{animation:cardIn .3s cubic-bezier(.4,0,.2,1) both}\n  @media(prefers-reduced-motion:reduce){\n    .trbody{transition:none}.overlay.on,.viewfade,.grid .game,#tgrid .trow{animation:none}\n    .game:active,nav.tabs a:active,.weekstep button:active{transform:none}}\n  .modal{max-width:820px;margin:0 auto;background:var(--card);border-radius:16px;overflow:hidden;\n    box-shadow:0 24px 70px rgba(0,0,0,.4);animation:rise .18s ease}\n  @keyframes rise{from{transform:translateY(14px);opacity:.6}to{transform:translateY(0);opacity:1}}\n  @media (prefers-reduced-motion:reduce){.modal{animation:none}}\n  .mhead{background:var(--chrome);color:#fff;padding:20px 22px;position:relative}\n  .mclose{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;border:0;\n    background:rgba(255,255,255,.12);color:#fff;cursor:pointer;font-size:17px;display:grid;place-items:center}\n  .mclose:hover{background:rgba(255,255,255,.22)}\n  .mteams{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap}\n  .mteam{display:flex;align-items:center;gap:12px}\n  .mteam.h{flex-direction:row-reverse;text-align:right}\n  .mbadge{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;\n    font-family:var(--disp);font-size:18px;border:2px solid rgba(255,255,255,.16)}\n  .mteam .mn{font-family:var(--disp);font-size:30px;line-height:.9;text-transform:uppercase;letter-spacing:.5px}\n  .mteam .mr{font-size:12px;color:#9fb2c9;letter-spacing:.6px;text-transform:uppercase}\n  .mat{font-family:var(--disp);color:#8ea3bd;font-size:16px}\n  .mmeta{display:flex;flex-wrap:wrap;gap:7px 14px;justify-content:center;margin-top:14px;\n    font-size:12px;color:#b9c8da;letter-spacing:.3px;text-transform:uppercase}\n  .mmeta b{color:#fff;font-weight:600}\n  .mbody{padding:8px 22px 22px}\n  .gtitle{font-family:var(--body);font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;\n    color:var(--field);margin:20px 0 4px;display:flex;align-items:center;gap:9px}\n  .gtitle::after{content:\"\";flex:1;height:1px;background:var(--line)}\n  .legend{display:flex;justify-content:center;gap:20px;padding:14px 0 2px;font-size:11px;\n    color:var(--muted);letter-spacing:.6px;text-transform:uppercase}\n  .legend span{display:flex;align-items:center;gap:7px}\n  .legend i{width:12px;height:12px;border-radius:3px;display:inline-block}\n\n  .v .u{font-size:12px;color:var(--muted);margin-left:2px;font-family:var(--body);font-weight:600}\n  .row.na .v{color:#b4bec8;font-family:var(--body);font-weight:600;font-size:16px}\n  .row.na .lab{color:#aab4be}\n  .inj,.props{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px}\n  .injcol,.propcol{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fbfcfd}\n  .injteam{font-family:var(--disp);font-size:17px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px}\n  .injrow{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--muted);\n    letter-spacing:.4px;text-transform:uppercase;margin-top:7px}\n  .injrow b{color:var(--ink);font-family:var(--body);font-weight:600}\n  .injbar{height:7px;border-radius:4px;background:#eef2f6;overflow:hidden;margin-top:4px}\n  .injbar i{display:block;height:100%}\n  .pill{font-size:11px;padding:2px 9px;border-radius:20px;letter-spacing:.5px}\n  .pill.ok{background:rgba(18,161,80,.14);color:#0e7a3b}\n  .pill.warn{background:rgba(229,150,0,.16);color:#8a6400}\n  .edge{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-top:6px}\n  .edgerow{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;font-size:13px;\n    letter-spacing:.3px;text-transform:uppercase;color:var(--muted)}\n  .edgerow+.edgerow{border-top:1px solid var(--line)}\n  .edgerow b{font-family:var(--disp);font-size:18px;color:var(--muted)}\n  .edgerow b.pos{color:var(--good)}.edgerow b.neg{color:var(--bad)}\n  .pnote{font-size:12px;color:var(--muted);margin:4px 0 8px;letter-spacing:.2px}\n  .ptab{width:100%;border-collapse:collapse;font-size:13px}\n  .ptab th{text-align:left;color:var(--muted);font-weight:600;font-size:11px;letter-spacing:.6px;\n    text-transform:uppercase;padding:5px 6px;border-bottom:1px solid var(--line)}\n  .ptab td{padding:6px 6px;border-bottom:1px solid #eef2f6;font-weight:500}\n  .ptab td:first-child{font-family:var(--disp);font-size:15px;letter-spacing:.2px}\n  .ptab .oddsline{display:block;font-size:9.5px;color:var(--muted);font-family:var(--body);letter-spacing:.2px;margin-top:1px}\n  .ptabwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}\n  .ptabwrap .ptab{min-width:360px}\n  .qline{margin-top:7px;font-family:var(--body);font-weight:600;font-size:12px;color:#8ea3bd;letter-spacing:.4px}\n  .qline b{color:#fff}\n  .ptab td.tnum b{font-family:var(--body);font-weight:700}\n  .ptab th{white-space:nowrap}\n  @media(max-width:560px){.inj,.props{grid-template-columns:1fr}}\n  /* ---- recent form (W-L / ATS / O/U, last 7) ---- */\n  .recform{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px}\n  .reccol{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fbfcfd}\n  .recrecs{display:flex;gap:8px;margin:2px 0 12px}\n  .recrec{flex:1;text-align:center;background:#fff;border:1px solid var(--line);border-radius:8px;padding:6px 4px}\n  .recrec span{display:block;font-size:9.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:600}\n  .recrec b{font-family:var(--disp);font-size:19px;letter-spacing:.5px;color:var(--ink)}\n  .reclog{display:flex;gap:6px}\n  .recg{flex:1;min-width:0;text-align:center}\n  .recg .rw{display:grid;place-items:center;height:26px;border-radius:6px;font-family:var(--disp);\n    font-size:14px;color:#fff;box-shadow:0 1px 3px rgba(11,18,32,.18)}\n  .recg .rw.win{background:var(--good)}.recg .rw.loss{background:var(--bad)}\n  .recg .rtag{font-size:10px;letter-spacing:.2px;margin-top:4px;color:var(--muted);line-height:1.2}\n  .recg .rtag i{font-style:normal;font-weight:700}\n  .rc-c{color:var(--good)}.rc-x{color:var(--bad)}.rc-p{color:var(--muted)}\n  .recleg{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:10.5px;color:var(--muted);letter-spacing:.3px}\n  .recleg i{font-style:normal;font-weight:700}\n  @media(max-width:560px){.inj,.props,.recform{grid-template-columns:1fr}}\n\n  /* logo badges (swap-in for abbreviations) */\n  .haslogo{background:#fff !important;border:2px solid rgba(0,0,0,.10) !important;overflow:hidden;padding:0}\n  .haslogo img{width:82%;height:82%;object-fit:contain;display:block}\n  .tbadge.haslogo{border-color:rgba(255,255,255,.55) !important}\n\n  /* week dropdown */\n  .weekstep{position:relative}\n  .wlabel{cursor:pointer;display:flex;align-items:center;gap:2px}\n  .wlabel .caret{width:13px;height:13px;margin-left:5px;color:var(--muted)}\n  .wmenu{position:absolute;top:46px;left:44px;z-index:30;background:#fff;border:1px solid var(--line);\n    border-radius:10px;box-shadow:0 14px 34px rgba(11,18,32,.18);padding:6px;display:grid;\n    grid-template-columns:repeat(3,1fr);gap:4px;width:210px}\n  .wmenu button{font-family:var(--disp);font-size:15px;letter-spacing:.4px;border:1px solid transparent;\n    background:#f6f8fa;color:var(--ink);border-radius:6px;padding:8px 0;cursor:pointer;text-transform:uppercase}\n  .wmenu button:hover{background:#e9eef4}\n  .wmenu button.on{background:var(--ink);color:#fff}\n\n  /* teams tab */\n  .tgrid{display:flex;flex-direction:column;gap:10px;max-width:840px;margin:0 auto}\n  .tcard{background:var(--card);border:1px solid var(--line);border-radius:13px;box-shadow:var(--shadow);\n    overflow:hidden;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}\n  .tcard:hover{transform:translateY(-3px);box-shadow:0 2px 4px rgba(11,18,32,.08),0 14px 30px rgba(11,18,32,.14)}\n  .tcard .thead{display:flex;align-items:center;gap:11px;padding:12px 14px;color:#fff}\n  .tcard .tbadge{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;\n    font-family:var(--disp);font-size:14px;background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.25)}\n  .tcard .tnm{font-family:var(--disp);font-size:21px;letter-spacing:.4px;text-transform:uppercase;line-height:1}\n  .tcard .tcity{font-size:10.5px;letter-spacing:.8px;text-transform:uppercase;opacity:.82;margin-top:2px}\n  .ngs{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line)}\n  .ngs .cell{background:#fff;padding:9px 12px}\n  .ngs .cell.wide{grid-column:1 / -1}\n  .ngs .n{font-family:var(--disp);font-size:20px;letter-spacing:.3px}\n  .ngs .n .u{font-family:var(--body);font-weight:600;font-size:12px;color:var(--muted);margin-left:2px}\n  .ngs .k{font-size:10px;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);font-weight:600;margin-top:2px}\n  .tmore{padding:9px 14px;border-top:1px solid var(--line);font-family:var(--body);font-weight:600;\n    font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--field);display:flex;align-items:center;gap:5px}\n  .tmore svg{width:12px;height:12px}\n\n  /* teams list (accordion) */\n  #tgrid{display:flex;flex-direction:column;gap:8px}\n  .trow{background:var(--card);border:1px solid var(--line);border-radius:11px;box-shadow:var(--shadow);overflow:hidden}\n  .trhead{display:flex;align-items:center;gap:13px;width:100%;border:0;background:transparent;cursor:pointer;\n    padding:0 15px 0 0;text-align:left;font-family:var(--body);color:var(--ink)}\n  .trhead:hover{background:#fafbfc}\n  .tstripe{width:6px;align-self:stretch;min-height:62px;flex:0 0 auto}\n  .trlogo{width:44px;height:44px;border-radius:50%;background:#fff;border:2px solid rgba(0,0,0,.08);\n    display:grid;place-items:center;flex:0 0 auto;overflow:hidden;margin:9px 3px 9px 0}\n  .trlogo img{width:82%;height:82%;object-fit:contain}\n  .trlogo.abbr{font-family:var(--disp);font-size:15px}\n  .trmeta{display:flex;flex-direction:column;gap:2px;line-height:1.02}\n  .trname{font-family:var(--disp);font-size:23px;letter-spacing:.4px;text-transform:uppercase}\n  .trcity{font-size:11px;color:var(--muted);letter-spacing:.7px;text-transform:uppercase}\n  .trkey{margin-left:auto;font-size:11px;color:var(--muted);letter-spacing:.7px;text-transform:uppercase}\n  .trkey b{font-family:var(--disp);font-size:19px;color:var(--ink);margin-left:6px}\n  .trchev{width:16px;height:16px;color:var(--muted);transition:transform .18s ease;flex:0 0 auto;margin-left:14px}\n  .trow.open .trchev{transform:rotate(90deg)}\n  .trow.open{box-shadow:0 2px 4px rgba(11,18,32,.08),0 12px 28px rgba(11,18,32,.13)}\n  .trbody{max-height:0;overflow:hidden;opacity:0;padding:0 16px;\n    transition:max-height .32s cubic-bezier(.4,0,.2,1),opacity .22s ease,padding .32s ease}\n  .trow.open .trbody{max-height:1400px;opacity:1;padding:2px 16px 16px}\n  .trbody .gtitle:first-child{margin-top:10px}\n  @media(prefers-reduced-motion:reduce){.trchev{transition:none}}\n  @media(max-width:560px){.trcity{display:none}.trname{font-size:20px}}\n\n  /* quick preview modal */\n  .qmodal{max-width:460px;margin:8vh auto 0;background:var(--card);border-radius:16px;overflow:hidden;\n    box-shadow:0 24px 70px rgba(0,0,0,.4);animation:rise .16s ease}\n  .qhead{background:var(--chrome);color:#fff;padding:16px 18px}\n  .qteams{display:flex;align-items:center;justify-content:space-between;gap:10px}\n  .qt{display:flex;align-items:center;gap:9px}\n  .qt.h{flex-direction:row-reverse}\n  .qbadge{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-family:var(--disp);\n    font-size:14px;border:2px solid rgba(255,255,255,.18)}\n  .qn{font-family:var(--disp);font-size:23px;text-transform:uppercase;letter-spacing:.4px;line-height:.95}\n  .qat{font-family:var(--disp);color:#8ea3bd;font-size:14px}\n  .qkick{text-align:center;font-size:11.5px;color:#b9c8da;letter-spacing:.5px;text-transform:uppercase;margin-top:9px}\n  .qbody{padding:8px 18px 16px}\n  .qrow{display:grid;grid-template-columns:52px 1fr 52px;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}\n  .qrow:first-child{border-top:0}\n  .qrow .qv{font-family:var(--disp);font-size:20px}\n  .qrow .qv.l{text-align:right}.qrow .qv.r{text-align:left}\n  .qrow .qk{text-align:center;font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);font-weight:600}\n  .qfull{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;\n    background:var(--field);color:#fff;border:0;border-radius:9px;padding:11px;cursor:pointer;\n    font-family:var(--body);font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase}\n  .qfull:hover{filter:brightness(1.06)}\n  .qfull svg{width:14px;height:14px}\n  .qhead{position:relative}\n  .kv{display:grid;grid-template-columns:1fr 1fr;gap:2px 22px;margin-top:4px}\n  .kvrow{display:flex;justify-content:space-between;align-items:center;padding:8px 2px;border-bottom:1px solid #eef2f6;\n    font-size:12.5px;letter-spacing:.4px;text-transform:uppercase;color:var(--muted)}\n  .kvrow b{font-family:var(--disp);font-size:19px;color:var(--ink);letter-spacing:.3px}\n  .kvrow b .u{font-family:var(--body);font-weight:600;font-size:12px;color:var(--muted);margin-left:2px}\n  @media(max-width:560px){.kv{grid-template-columns:1fr}}\n\n  /* ---------- richness / polish ---------- */\n  .eyebrow::before{content:\"\";width:4px;height:16px;background:var(--gold);border-radius:2px;\n    display:inline-block;box-shadow:0 0 8px rgba(213,0,0,.35)}\n  .season-label{font-size:22px;color:var(--ink)}\n  .seasonbar{background:linear-gradient(180deg,#ffffff,#f5f8fb);box-shadow:0 1px 0 rgba(11,18,32,.05)}\n  nav.tabs a.on{box-shadow:0 2px 12px rgba(213,0,0,.45)}\n  .game{position:relative;border-color:#e6ebf1}\n  .game::before{content:\"\";position:absolute;inset:0;border-radius:13px;pointer-events:none;z-index:2;\n    box-shadow:inset 0 0 0 1px rgba(255,255,255,.55)}\n  .game:hover{box-shadow:0 3px 6px rgba(11,18,32,.10),0 18px 42px rgba(11,18,32,.17)}\n  .ghead{background:linear-gradient(180deg,#f8fafc,#ffffff)}\n  .gbadge.haslogo,.trlogo{box-shadow:0 2px 6px rgba(11,18,32,.15)}\n  .grow{transition:background .14s ease}\n  .game:hover .grow{background:linear-gradient(90deg,rgba(200,16,46,.045),transparent)}\n  .spine2 span{box-shadow:inset 0 -2px 4px rgba(0,0,0,.18)}\n  .gfoot{background:#fbfcfe}\n  .vchip{border:1px solid rgba(11,18,32,.05)}\n  .cta{padding:5px 9px;border-radius:20px}\n  .cta:hover{background:rgba(200,16,46,.10)}\n  .trow{position:relative}\n  .trhead:hover{background:linear-gradient(90deg,rgba(200,16,46,.05),#fafbfc)}\n  .trkey b{color:var(--gold)}\n  .trow.open{border-color:rgba(200,16,46,.30)}\n  .trow.open .trhead{background:linear-gradient(90deg,rgba(200,16,46,.06),#fff)}\n  .weekstep{box-shadow:0 2px 10px rgba(11,18,32,.10)}\n\n  /* ---- Next Gen Search ---- */\n  .searchbar{max-width:1180px;margin:0 auto 14px;background:var(--card);border:1px solid var(--line);\n    border-radius:14px;box-shadow:var(--shadow);overflow:hidden}\n  .sbtop{display:flex;align-items:stretch;gap:0;background:linear-gradient(180deg,#181818,#101010);\n    border-bottom:1px solid rgba(255,255,255,.06)}\n  .posseg{display:flex;flex:1;min-width:0}\n  .posseg button{flex:1;border:0;background:transparent;color:#c9cfd6;cursor:pointer;\n    font-family:var(--disp);font-size:16px;letter-spacing:.8px;text-transform:uppercase;\n    padding:13px 8px;position:relative;transition:color .12s ease,background .12s ease}\n  .posseg button:hover{color:#fff;background:rgba(255,255,255,.05)}\n  .posseg button.on{color:#fff}\n  .posseg button.on::after{content:\"\";position:absolute;left:14%;right:14%;bottom:0;height:3px;\n    background:var(--gold);border-radius:3px 3px 0 0;box-shadow:0 -1px 8px rgba(213,0,0,.6)}\n  .posseg button:active{transform:scale(.96)}\n  .sbfilters{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;padding:14px 16px}\n  .fld{display:flex;flex-direction:column;gap:5px}\n  .fld label{font-family:var(--body);font-weight:600;font-size:10.5px;letter-spacing:1.4px;\n    text-transform:uppercase;color:var(--muted)}\n  .fld select,.fld input{font-family:var(--body);font-weight:500;font-size:14px;color:var(--ink);\n    background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 11px;min-width:150px;\n    outline:none;transition:border-color .12s ease,box-shadow .12s ease}\n  .fld select:focus,.fld input:focus{border-color:var(--field);box-shadow:0 0 0 3px rgba(200,16,46,.12)}\n  .fld.grow{flex:1;min-width:180px}.fld.grow input{width:100%;box-sizing:border-box}\n  .schint{margin-left:auto;align-self:center;font-family:var(--body);font-weight:500;font-size:12.5px;\n    color:var(--muted);white-space:nowrap}\n  .schint b{color:var(--field)}\n  .stbl-wrap{max-width:1180px;margin:0 auto;overflow-x:auto;border:1px solid var(--line);\n    border-radius:14px;background:var(--card);box-shadow:var(--shadow)}\n  table.stbl{border-collapse:collapse;width:100%;font-family:var(--body);font-size:13.5px;min-width:760px}\n  table.stbl thead th{position:sticky;top:0;background:linear-gradient(180deg,#1c1c1c,#141414);color:#e7ebef;\n    font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:11px;padding:11px 10px;\n    text-align:right;white-space:nowrap;cursor:pointer;user-select:none;border-bottom:2px solid var(--gold)}\n  table.stbl thead th.lft{text-align:left}\n  table.stbl thead th:hover{background:#252525;color:#fff}\n  table.stbl thead th .arw{opacity:0;margin-left:4px;color:var(--gold);font-size:10px}\n  table.stbl thead th.sorted .arw{opacity:1}\n  table.stbl thead th.hero{color:#fff}\n  table.stbl thead th.hero.sorted .arw{color:#fff}\n  table.stbl tbody td{padding:9px 10px;text-align:right;white-space:nowrap;border-top:1px solid var(--line);\n    font-variant-numeric:tabular-nums}\n  table.stbl tbody tr:nth-child(even){background:#f7f9fb}\n  table.stbl tbody tr:hover{background:rgba(200,16,46,.06)}\n  table.stbl td.rk{text-align:center;color:var(--muted);font-weight:600;width:38px;font-size:12px}\n  table.stbl td.plr{text-align:left;min-width:210px}\n  .plrcell{display:flex;align-items:center;gap:9px}\n  .plrlogo{width:26px;height:26px;border-radius:6px;flex:0 0 26px;display:grid;place-items:center;\n    overflow:hidden;box-shadow:0 1px 4px rgba(11,18,32,.18)}\n  .plrlogo img{width:100%;height:100%;object-fit:contain;padding:2px;box-sizing:border-box}\n  .plrlogo.abbr{font-family:var(--disp);font-size:10px;letter-spacing:.3px}\n  .plrname{font-weight:600;color:var(--ink);line-height:1.1}\n  .plrsub{font-size:11px;color:var(--muted);letter-spacing:.4px}\n  table.stbl td.hero{font-family:var(--disp);font-size:16px;color:var(--ink);background:rgba(200,16,46,.05)}\n  table.stbl tbody td.hero{}\n  .pos-good{color:var(--good);font-weight:600}.pos-bad{color:var(--bad);font-weight:600}\n  .stbl-empty{padding:34px 16px;text-align:center;color:var(--muted);font-family:var(--body)}\n  @media(max-width:560px){.schint{display:none}.fld select,.fld input{min-width:130px}}\n\n  footer{color:var(--muted);font-size:12px;text-align:center;padding:30px 0 40px;letter-spacing:.4px;text-transform:uppercase}\n  .note{max-width:1180px;margin:22px auto 0;padding:12px 16px;background:#fff;border:1px dashed var(--line);\n    border-radius:10px;color:var(--muted);font-size:12.5px;letter-spacing:.2px}\n  .note b{color:var(--ink)}\n  @media(max-width:720px){\n    .fside .tname{font-size:32px}.fside .badge{width:54px;height:54px;font-size:19px}\n    .top .wrap{height:auto;min-height:56px;gap:10px 12px;padding:8px 16px;flex-wrap:wrap}\n    .brand{font-size:21px}\n    nav.tabs{order:3;width:100%;overflow-x:auto;gap:2px;-webkit-overflow-scrolling:touch}\n    nav.tabs::-webkit-scrollbar{display:none}\n    nav.tabs a{padding:7px 11px;font-size:12.5px;white-space:nowrap}\n    .top .right{margin-left:auto}\n    .season-label span{display:none}\n    .row{grid-template-columns:50px 1fr 110px 1fr 50px}\n    .mteam .mn{font-size:23px}\n  }\n  @media(max-width:560px){\n    nav.tabs{gap:1px}\n    nav.tabs a{padding:7px 8px;font-size:11.5px;letter-spacing:.4px}\n    .mhead{padding:16px 16px}\n    .mteams{flex-direction:column;align-items:stretch;justify-content:flex-start;gap:9px}\n    .mteam,.mteam.a,.mteam.h{flex-direction:row;text-align:left;justify-content:flex-start;gap:12px}\n    .mbadge{width:44px;height:44px;font-size:16px;flex:0 0 44px}\n    .mteam .mn{font-size:22px}\n    .mteam .mr{font-size:11px}\n    .mat{align-self:center;font-size:15px}\n    .mclose{top:12px;right:12px}\n    .row{grid-template-columns:44px 1fr 96px 1fr 44px}\n    .legend{flex-wrap:wrap;gap:8px}\n  }\n";

// Where the nightly GitHub Action commits fresh data.
const LIVE_DATA_URL =
  "https://raw.githubusercontent.com/westonnick7/gridiron-report/main/data/gridiron_report_data.json";

// ---------- Team identity (abbr -> [nickname, primary color]) ----------
const TEAM = {
  ARI: ["Cardinals", "#97233F"], ATL: ["Falcons", "#A71930"], BAL: ["Ravens", "#241773"],
  BUF: ["Bills", "#00338D"], CAR: ["Panthers", "#0085CA"], CHI: ["Bears", "#0B162A"],
  CIN: ["Bengals", "#FB4F14"], CLE: ["Browns", "#3B2314"], DAL: ["Cowboys", "#041E42"],
  DEN: ["Broncos", "#FB4F14"], DET: ["Lions", "#0076B6"], GB: ["Packers", "#203731"],
  HOU: ["Texans", "#03202F"], IND: ["Colts", "#002C5F"], JAX: ["Jaguars", "#046A78"],
  KC: ["Chiefs", "#E31837"], LA: ["Rams", "#003594"], LAC: ["Chargers", "#0080C6"],
  LV: ["Raiders", "#111214"], MIA: ["Dolphins", "#008E97"], MIN: ["Vikings", "#4F2683"],
  NE: ["Patriots", "#0A2342"], NO: ["Saints", "#101820"], NYG: ["Giants", "#0B2265"],
  NYJ: ["Jets", "#125740"], PHI: ["Eagles", "#004C54"], PIT: ["Steelers", "#FFB612"],
  SEA: ["Seahawks", "#4E9F2F"], SF: ["49ers", "#AA0000"], TB: ["Buccaneers", "#D50A0A"],
  TEN: ["Titans", "#4B92DB"], WAS: ["Commanders", "#5A1414"],
};
const CITY = {
  NE: "New England", SEA: "Seattle", SF: "San Francisco", LA: "Los Angeles", CHI: "Chicago",
  CAR: "Carolina", TB: "Tampa Bay", CIN: "Cincinnati", NO: "New Orleans", DET: "Detroit", BUF: "Buffalo",
  HOU: "Houston", BAL: "Baltimore", IND: "Indianapolis", CLE: "Cleveland", JAX: "Jacksonville", ATL: "Atlanta",
  PIT: "Pittsburgh", NYJ: "New York", TEN: "Tennessee", ARI: "Arizona", LAC: "Los Angeles", MIA: "Miami",
  LV: "Las Vegas", GB: "Green Bay", MIN: "Minnesota", WAS: "Washington", PHI: "Philadelphia", DAL: "Dallas",
  NYG: "New York", DEN: "Denver", KC: "Kansas City",
};
const VENUE = {
  SEA: "Lumen Field", LA: "SoFi Stadium", CAR: "Bank of America Stadium", CIN: "Paycor Stadium",
  DET: "Ford Field", HOU: "NRG Stadium", IND: "Lucas Oil Stadium", JAX: "EverBank Stadium", PIT: "Acrisure Stadium",
  TEN: "Nissan Stadium", LAC: "SoFi Stadium", LV: "Allegiant Stadium", MIN: "U.S. Bank Stadium", PHI: "Lincoln Financial Field",
  NYG: "MetLife Stadium", KC: "Arrowhead Stadium",
};
function nick(ab) { return (TEAM[ab] && TEAM[ab][0]) || ab; }
function color(ab) { return (TEAM[ab] && TEAM[ab][1]) || "#555"; }
function txt(hex) {
  const c = String(hex).replace("#", "");
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0B1220" : "#ffffff";
}
function tc(s) {
  return typeof s === "string" && s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : s || "";
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function fmtKick(s) {
  if (!s) return "";
  const parts = String(s).split(" ");
  const d = parts[0], t = parts[1] || "00:00";
  const dt = new Date(d + "T" + t + ":00Z");
  if (isNaN(dt.getTime())) return String(s);
  let h = parseInt(t.split(":")[0], 10);
  const m = t.split(":")[1];
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return DOW[dt.getUTCDay()] + " " + (dt.getUTCMonth() + 1) + "/" + dt.getUTCDate() + " · " + h + ":" + m + " " + ap + " ET";
}

// ---------- formatters (null -> em dash) ----------
const DASH = "—";
const f0 = (v) => (v == null ? DASH : String(Math.round(v)));
const f1 = (v) => (v == null ? DASH : (+v).toFixed(1));
const f2 = (v) => (v == null ? DASH : (+v).toFixed(2));
const fs0 = (v) => (v == null ? DASH : (v > 0 ? "+" : "") + Math.round(v));
const fs1 = (v) => (v == null ? DASH : (v > 0 ? "+" : "") + (+v).toFixed(1));
const fs2 = (v) => (v == null ? DASH : (v > 0 ? "+" : "") + (+v).toFixed(2));
const fsec = (v) => (v == null ? DASH : (+v).toFixed(2) + "s");
const fmin = (v) => (v == null ? DASH : (+v).toFixed(1) + " min");

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}
function teamValue(code, path, teamStats, teamDetail) {
  if (path.indexOf(".") >= 0) return getPath(teamDetail[code], path);
  return teamStats[code] ? teamStats[code][path] : null;
}

// ---------- stat groups (mirror the original dashboard, wired to real data) ----------
const STAT_GROUPS = [
  ["Team", [
    { label: "PPG", path: "ppg", fmt: f1, hi: true },
    { label: "PAPG", path: "papg", fmt: f1, hi: false },
    { label: "YPG", path: "ypg", fmt: f0, hi: true },
    { label: "YPG Allowed", path: "ypgAllow", fmt: f0, hi: false },
    { label: "Off EPA/Play", path: "offEpa", fmt: f2, hi: true },
    { label: "Def EPA/Play", path: "defEpa", fmt: f2, hi: false },
    { label: "TO Margin", path: "toMargin", fmt: fs0, hi: true },
  ]],
  ["Passing", [
    { label: "CPOE", path: "passing.cpoe", fmt: fs1, hi: true },
    { label: "EPA/Dropback", path: "passing.epaDropback", fmt: f2, hi: true },
    { label: "Time to Throw", path: "passing.timeToThrow", fmt: fsec, hi: false },
    { label: "Deep Ball %", path: "passing.deepBallPct", fmt: f1, hi: true },
    { label: "Pressure-to-Sack %", path: "passing.pressureToSackPct", fmt: f1, hi: false },
    { label: "TO-Worthy Play %", path: "passing.toWorthyPct", fmt: f1, hi: false },
  ]],
  ["Rushing", [
    { label: "Rush Yds Over Exp", path: "rushing.ryoe", fmt: fs2, hi: true },
    { label: "Explosive Run %", path: "rushing.explosiveRunPct", fmt: f1, hi: true },
    { label: "Success Rate", path: "rushing.successRate", fmt: f1, hi: true },
    { label: "YPC", path: "rushing.ypc", fmt: f1, hi: true },
    { label: "Broken Tackle %", path: "rushing.brokenTacklePct", fmt: f1, hi: true },
    { label: "Stuff Rate", path: "rushing.stuffPct", fmt: f1, hi: false },
  ]],
  ["Receiving", [
    { label: "Yds/Route Run", path: "receiving.yprr", fmt: f2, hi: true },
    { label: "Avg Separation", path: "receiving.separation", fmt: f1, hi: true },
    { label: "Catch Rate Over Exp", path: "receiving.cROE", fmt: fs1, hi: true },
    { label: "Drop %", path: "receiving.dropPct", fmt: f1, hi: false },
    { label: "YAC/Reception", path: "receiving.yacPerRec", fmt: f1, hi: true },
  ]],
  ["Defense", [
    { label: "Pressure Rate", path: "defense.pressureRate", fmt: f1, hi: true },
    { label: "Sack Rate", path: "defense.sackRate", fmt: f1, hi: true },
    { label: "Missed Tackle %", path: "defense.missedTacklePct", fmt: f1, hi: false },
    { label: "Havoc Rate", path: "defense.havocRate", fmt: f1, hi: true },
    { label: "Pts/Drive Allowed", path: "defense.ptsPerDriveAllowed", fmt: f2, hi: false },
    { label: "Coverage Grade", path: "defense.coverageGrade", fmt: f1, hi: true },
  ]],
  ["Situational", [
    { label: "3rd Down %", path: "thirdDownPct", fmt: f1, hi: true },
    { label: "4th Down %", path: "situational.fourthDownPct", fmt: f1, hi: true },
    { label: "Red Zone TD %", path: "redZonePct", fmt: f1, hi: true },
    { label: "Time of Possession", path: "situational.timeOfPossession", fmt: fmin, hi: true },
    { label: "Plays/Drive", path: "situational.playsPerDrive", fmt: f1, hi: true },
    { label: "Penalties/Gm", path: "situational.penaltiesPerGm", fmt: f1, hi: false },
    { label: "Sec/Play (Pace)", path: "situational.secPerPlay", fmt: f1, hi: false },
  ]],
];

const NGS_TEAM = [
  { label: "CPOE", path: "passing.cpoe", fmt: fs1 },
  { label: "Time to Throw", path: "passing.timeToThrow", fmt: fsec },
  { label: "Deep Ball %", path: "passing.deepBallPct", fmt: f1 },
  { label: "Rush Yds Over Exp", path: "rushing.ryoe", fmt: fs2 },
  { label: "Explosive Run %", path: "rushing.explosiveRunPct", fmt: f1 },
  { label: "Avg Separation", path: "receiving.separation", fmt: f1 },
  { label: "YAC/Reception", path: "receiving.yacPerRec", fmt: f1 },
];
const OVERVIEW_TEAM = [
  { label: "PPG", path: "ppg", fmt: f1 },
  { label: "PAPG", path: "papg", fmt: f1 },
  { label: "YPG", path: "ypg", fmt: f0 },
  { label: "YPG Allowed", path: "ypgAllow", fmt: f0 },
  { label: "Off EPA/Play", path: "offEpa", fmt: f2 },
  { label: "Def EPA/Play", path: "defEpa", fmt: f2 },
  { label: "TO Margin", path: "toMargin", fmt: fs0 },
];

const QUICK = [
  { label: "PPG", path: "ppg", fmt: f1 },
  { label: "YPG", path: "ypg", fmt: f0 },
  { label: "Off EPA/Play", path: "offEpa", fmt: f2 },
  { label: "Red Zone TD %", path: "redZonePct", fmt: f1 },
];

// ---------- little inline SVGs ----------
const ChevR = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
);
const Flask = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5V3" /><path d="M7.5 14h9" /></svg>
);

const ESPN_CODE = { LA: "lar", WAS: "wsh" };
function logoUrl(ab) {
  const code = ESPN_CODE[ab] || ab.toLowerCase();
  return "https://a.espncdn.com/i/teamlogos/nfl/500/" + code + ".png";
}
function Badge({ ab, cls }) {
  const [ok, setOk] = useState(true);
  const c = color(ab);
  if (ok) return (
    <div className={cls + " haslogo"} style={{ "--tc": c }}>
      <img src={logoUrl(ab)} alt={nick(ab)} loading="lazy" onError={() => setOk(false)} />
    </div>
  );
  return <div className={cls} style={{ background: c, color: txt(c) }}>{ab}</div>;
}
function TeamLogo({ ab }) {
  const [ok, setOk] = useState(true);
  const c = color(ab);
  if (ok) return <span className="trlogo"><img src={logoUrl(ab)} alt={nick(ab)} loading="lazy" onError={() => setOk(false)} /></span>;
  return <span className="trlogo abbr" style={{ background: c, color: txt(c) }}>{ab}</span>;
}
function PlrLogo({ ab }) {
  const [ok, setOk] = useState(true);
  const c = color(ab);
  if (ok) return <span className="plrlogo"><img src={logoUrl(ab)} alt={ab} loading="lazy" onError={() => setOk(false)} /></span>;
  return <span className="plrlogo abbr" style={{ background: c, color: txt(c) }}>{ab}</span>;
}

// ---------- record helper ----------
function record(teamStats, code) {
  return (teamStats[code] && teamStats[code].record) || "0-0";
}

// ================= Comparison rows =================
function StatRow({ row, away, home, ts, td, ca, ch }) {
  const a = teamValue(away, row.path, ts, td);
  const h = teamValue(home, row.path, ts, td);
  if (a == null && h == null) {
    return (
      <div className="row na">
        <div className="v l">{DASH}</div><div className="bar l"></div>
        <div className="lab">{row.label}</div>
        <div className="bar r"></div><div className="v r">{DASH}</div>
      </div>
    );
  }
  const av = a == null ? 0 : a, hv = h == null ? 0 : h;
  const max = Math.max(Math.abs(av), Math.abs(hv)) || 1;
  const both = a != null && h != null;
  const aw = both && (row.hi ? av > hv : av < hv);
  const hw = both && (row.hi ? hv > av : hv < av);
  return (
    <div className="row">
      <div className={"v l " + (aw ? "win" : "lose")}>{row.fmt(a)}</div>
      <div className="bar l"><i style={{ width: (a == null ? 0 : Math.round((Math.abs(av) / max) * 100)) + "%", background: ca }} /></div>
      <div className="lab">{row.label}</div>
      <div className="bar r"><i style={{ width: (h == null ? 0 : Math.round((Math.abs(hv) / max) * 100)) + "%", background: ch }} /></div>
      <div className={"v r " + (hw ? "win" : "lose")}>{row.fmt(h)}</div>
    </div>
  );
}

function GroupsBlock({ away, home, ts, td }) {
  const ca = color(away), ch = color(home);
  return (
    <>
      {STAT_GROUPS.map(([name, rows]) => (
        <React.Fragment key={name}>
          <div className="gtitle">{name}</div>
          {rows.map((r) => (
            <StatRow key={r.label} row={r} away={away} home={home} ts={ts} td={td} ca={ca} ch={ch} />
          ))}
        </React.Fragment>
      ))}
    </>
  );
}

function InjCol({ code, inj }) {
  const c = color(code);
  const d = inj || { qbStatus: "—", oLineHealth: 0, secondaryDepth: 0, keyInjuries: [] };
  const key = d.keyInjuries || [];
  return (
    <div className="injcol">
      <div className="injteam">{nick(code)}</div>
      <div className="injrow"><span>QB Status</span><b className={"pill " + (d.qbStatus === "Healthy" ? "ok" : "warn")}>{d.qbStatus}</b></div>
      <div className="injrow"><span>O-Line Health</span><b>{d.oLineHealth}</b></div>
      <div className="injbar"><i style={{ width: (d.oLineHealth || 0) + "%", background: c }} /></div>
      <div className="injrow"><span>Secondary Depth</span><b>{d.secondaryDepth}</b></div>
      <div className="injbar"><i style={{ width: (d.secondaryDepth || 0) + "%", background: c }} /></div>
      <div className="injrow"><span>Key Injuries</span>{key.length ? (
        <b>{key.map((k, i) => (k.pos || k) + (k.status ? " (" + k.status + ")" : "") + (i < key.length - 1 ? ", " : ""))}</b>
      ) : <b style={{ color: "var(--muted)" }}>None reported</b>}</div>
    </div>
  );
}

function EdgeBlock({ away, home, td }) {
  const a = td[away], h = td[home];
  const num = (x) => (typeof x === "number" ? x : null);
  function edge(x) { return x == null ? null : x; }
  let rows = [];
  if (a && h) {
    const pa = num(a.passing.epaDropback), pah = num(h.defense.passEpaAllowed);
    const ph = num(h.passing.epaDropback), pha = num(a.defense.passEpaAllowed);
    const ra = num(a.rushing.ryoe), rah = num(h.defense.rushEpaAllowed);
    const rh = num(h.rushing.ryoe), rha = num(a.defense.rushEpaAllowed);
    const paceA = num(a.situational.secPerPlay), paceH = num(h.situational.secPerPlay);
    const mk = (p, q) => (p == null || q == null ? null : p - q);
    rows = [
      ["Pass Edge (" + away + ")", mk(pa, pah)],
      ["Pass Edge (" + home + ")", mk(ph, pha)],
      ["Rush Edge (" + away + ")", ra == null || rah == null ? null : ra / 5 - rah],
      ["Rush Edge (" + home + ")", rh == null || rha == null ? null : rh / 5 - rha],
      ["Pace Mismatch (sec/play)", mk(paceA, paceH)],
    ];
  } else {
    rows = [["Pass Edge (" + away + ")", null], ["Pass Edge (" + home + ")", null], ["Rush Edge (" + away + ")", null], ["Rush Edge (" + home + ")", null], ["Pace Mismatch (sec/play)", null]];
  }
  return (
    <>
      <div className="gtitle">Matchup Edge</div>
      <div className="edge">
        {rows.map(([label, v]) => {
          const cls = v == null ? "" : v > 0 ? "pos" : v < 0 ? "neg" : "";
          return (
            <div className="edgerow" key={label}><span>{label}</span><b className={cls}>{v == null ? DASH : (v > 0 ? "+" : "") + v.toFixed(v && Math.abs(v) < 10 ? 2 : 1)}</b></div>
          );
        })}
      </div>
    </>
  );
}

function EnvChips({ g }) {
  const w = g.weather || {};
  return (
    <div className="mmeta">
      <span className="chip">{fmtKick(g.kickoff)}</span>
      <span>Site <b>{VENUE[g.home] || CITY[g.home]}</b></span>
      <span>Surface <b>{tc(g.surface) || "—"}</b></span>
      <span>Roof <b>{tc(g.roof) || "—"}</b></span>
      <span>Rest <b>{(g.awayRestDays != null ? g.awayRestDays : "—") + " / " + (g.homeRestDays != null ? g.homeRestDays : "—")}</b></span>
      <span>{g.away} Travel <b>{g.awayTravelMiles != null ? g.awayTravelMiles.toLocaleString() + " mi" : "—"}</b></span>
      {w.temp != null && <span>Wx <b>{w.temp}°F{w.wind != null ? ", " + w.wind + " mph" : ""}</b></span>}
      {g.divisional && <span className="chip" style={{ background: "var(--gold)", color: "#fff" }}>Division</span>}
    </div>
  );
}

// straight-up recent form; only rendered when real game logs exist
function recentSummary(log) {
  const g = log.slice(0, 7);
  let w = 0, l = 0, c = 0, x = 0, ap = 0, o = 0, u = 0, op = 0;
  g.forEach((r) => {
    if (r.result === "W") w++; else if (r.result === "L") l++;
    if (r.ats === "C") c++; else if (r.ats === "X") x++; else if (r.ats === "P") ap++;
    if (r.ou === "O") o++; else if (r.ou === "U") u++; else if (r.ou === "P") op++;
  });
  const hasLines = g.some((r) => r.ats || r.ou);
  return { g, w, l, c, x, ap, o, u, op, hasLines };
}
function RecentBlock({ away, home, teamRecent, season }) {
  const la = teamRecent[away] || [], lh = teamRecent[home] || [];
  if (!la.length && !lh.length) return null;
  const col = (code, log) => {
    const s = recentSummary(log);
    return (
      <div className="reccol">
        <div className="injteam">{nick(code)}</div>
        <div className="recrecs">
          <div className="recrec"><span>Record</span><b>{s.w}-{s.l}</b></div>
          {s.hasLines && <div className="recrec"><span>ATS</span><b>{s.c}-{s.x}-{s.ap}</b></div>}
          {s.hasLines && <div className="recrec"><span>O/U</span><b>{s.o}-{s.u}-{s.op}</b></div>}
        </div>
        <div className="reclog">
          {s.g.map((r, i) => {
            const atsCls = r.ats === "C" ? "rc-c" : r.ats === "X" ? "rc-x" : "rc-p";
            const ouCls = r.ou === "O" ? "" : "rc-p";
            return (
              <div className="recg" key={i}>
                <div className={"rw " + (r.result === "W" ? "win" : "loss")}>{r.result}</div>
                <div className="rtag">
                  {r.ats ? <i className={atsCls}>{r.ats}</i> : <span>&middot;</span>}
                  {" \u00b7 "}
                  {r.ou ? <i className={ouCls}>{r.ou}</i> : <span>&middot;</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const anyLines = [...la, ...lh].some((r) => r.ats || r.ou);
  return (
    <>
      <div className="gtitle">Recent Form &middot; Last 7{season ? " \u00b7 " + season : ""}</div>
      <div className="recform">{col(away, la)}{col(home, lh)}</div>
      {anyLines && (
        <div className="recleg">
          <span><i className="rc-c">C</i> Cover &nbsp; <i className="rc-x">X</i> No cover &nbsp; <i className="rc-p">P</i> Push</span>
          <span><i>O</i> Over &nbsp; <i>U</i> Under &nbsp; <i className="rc-p">P</i> Push</span>
          <span style={{ marginLeft: "auto" }}>Most recent first</span>
        </div>
      )}
    </>
  );
}
function oddsFmt(v) { return v == null ? "" : (v > 0 ? "+" + v : "" + v); }
function PropCell({ m }) {
  if (!m || m.l == null) return <td className="tnum">{DASH}</td>;
  return <td className="tnum"><b>{m.l}</b>{(m.o != null || m.u != null) && <span className="oddsline">{oddsFmt(m.o)}/{oddsFmt(m.u)}</span>}</td>;
}
function PropsBlock({ away, home, props, book }) {
  if (!props) return null;
  const ra = props[away] || [], rh = props[home] || [];
  if (!ra.length && !rh.length) return null;
  const col = (code, rows) => {
    if (!rows.length) return null;
    return (
      <div className="propcol">
        <div className="injteam">{nick(code)} &middot; Player Props</div>
        <div className="ptabwrap"><table className="ptab"><thead><tr>
          <th>Player</th><th>Pass</th><th>Rush</th><th>Rec Yds</th><th>Rec</th><th>TD</th>
        </tr></thead><tbody>
          {rows.map((p, i) => (
            <tr key={i}>
              <td>{p.name}</td>
              <PropCell m={p.pass} /><PropCell m={p.rush} /><PropCell m={p.recyds} /><PropCell m={p.rec} />
              <td className="tnum">{p.td && p.td.p != null ? <b>{oddsFmt(p.td.p)}</b> : DASH}</td>
            </tr>
          ))}
        </tbody></table></div>
      </div>
    );
  };
  return (
    <>
      <div className="gtitle">Player Props</div>
      <div className="pnote">{book === "consensus" ? "Consensus lines across major books" : "Sportsbook lines"} &mdash; over/under odds under each yardage line; TD is the anytime-touchdown price.</div>
      <div className="props">{col(away, ra)}{col(home, rh)}</div>
    </>
  );
}

function mlFmt(v) { return v == null ? DASH : (v > 0 ? "+" + v : "" + v); }
function BettingBlock({ g, away, home }) {
  const o = g && g.odds;
  if (!o) return null;
  const spread = o.detail || (o.spread != null ? nick(home) + " " + (o.spread > 0 ? "+" : "") + o.spread : DASH);
  return (
    <>
      <div className="gtitle">Betting Line{o.book ? " \u00b7 " + o.book : ""}</div>
      <div className="edge">
        <div className="edgerow"><span>Spread</span><b>{spread}</b></div>
        <div className="edgerow"><span>Total (O/U)</span><b>{o.total != null ? o.total : DASH}</b></div>
        <div className="edgerow"><span>Moneyline</span><b>{away} {mlFmt(o.mlAway)} &nbsp;/&nbsp; {home} {mlFmt(o.mlHome)}</b></div>
      </div>
    </>
  );
}

// ================= Modals =================
function GameModal({ away, home, sched, data, onClose, onQuickToFull }) {
  const g = sched.find((x) => x.away === away && x.home === home) || { away, home, kickoff: "", surface: "", roof: "", weather: {}, divisional: false };
  const ca = color(away), ch = color(home);
  return (
    <div className="modal">
      <div className="mhead">
        <button className="mclose" aria-label="Close" onClick={onClose}>{"×"}</button>
        <div className="mteams">
          <div className="mteam a"><Badge ab={away} cls="mbadge" /><div><div className="mn">{nick(away)}</div><div className="mr">{CITY[away]} · {record(data.teamStats, away)}</div></div></div>
          <div className="mat">@</div>
          <div className="mteam h"><Badge ab={home} cls="mbadge" /><div><div className="mn">{nick(home)}</div><div className="mr">{CITY[home]} · {record(data.teamStats, home)}</div></div></div>
        </div>
        <EnvChips g={g} />
      </div>
      <div className="mbody">
        <div className="legend"><span><i style={{ background: ca }} />{nick(away)}</span><span><i style={{ background: ch }} />{nick(home)}</span><span style={{ color: "var(--muted)" }}>Season-to-date team stats</span></div>
        <BettingBlock g={g} away={away} home={home} />
        <GroupsBlock away={away} home={home} ts={data.teamStats} td={data.teamDetail} />
        <EdgeBlock away={away} home={home} td={data.teamDetail} />
        <RecentBlock away={away} home={home} teamRecent={data.teamRecent} season={data.recentSeason} />
        <div className="gtitle">Injury Report</div>
        <div className="inj"><InjCol code={away} inj={data.teamInjuries[away]} /><InjCol code={home} inj={data.teamInjuries[home]} /></div>
        <PropsBlock away={away} home={home} props={data.props} book={data.propsBook} />
      </div>
    </div>
  );
}

function QuickModal({ away, home, sched, data, onFull, onClose }) {
  const g = sched.find((x) => x.away === away && x.home === home) || { home, kickoff: "" };
  return (
    <div className="qmodal">
      <div className="qhead">
        <button className="mclose" aria-label="Close" onClick={onClose}>{"×"}</button>
        <div className="qteams">
          <div className="qt"><Badge ab={away} cls="qbadge" /><div className="qn">{away}</div></div>
          <div className="qat">@</div>
          <div className="qt h"><Badge ab={home} cls="qbadge" /><div className="qn">{home}</div></div>
        </div>
        <div className="qkick">{fmtKick(g.kickoff)} · {VENUE[home] || CITY[home]}</div>
        {g.odds && <div className="qline"><b>{g.odds.detail || ""}</b>{g.odds.total != null ? "  \u00b7  O/U " + g.odds.total : ""}</div>}
      </div>
      <div className="qbody">
        {QUICK.map((m) => (
          <div className="qrow" key={m.label}>
            <div className="qv l">{m.fmt(teamValue(away, m.path, data.teamStats, data.teamDetail))}</div>
            <div className="qk">{m.label}</div>
            <div className="qv r">{m.fmt(teamValue(home, m.path, data.teamStats, data.teamDetail))}</div>
          </div>
        ))}
        <button className="qfull" onClick={onFull}>Full Stat Breakdown <ChevR /></button>
      </div>
    </div>
  );
}

// ================= Teams tab =================
function KvList({ code, rows, ts, td }) {
  return (
    <div className="kv">
      {rows.map((m) => (
        <div className="kvrow" key={m.label}><span>{m.label}</span><b>{m.fmt(teamValue(code, m.path, ts, td))}</b></div>
      ))}
    </div>
  );
}
function TeamRow({ code, data, open, onToggle }) {
  const c = color(code);
  return (
    <div className={"trow" + (open ? " open" : "")}>
      <button className="trhead" aria-expanded={open} onClick={onToggle}>
        <span className="tstripe" style={{ background: c }} />
        <TeamLogo ab={code} />
        <span className="trmeta"><span className="trname">{nick(code)}</span><span className="trcity">{CITY[code]}</span></span>
        <span className="trkey">Rec <b>{record(data.teamStats, code)}</b></span>
        <svg className="trchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>
      <div className="trbody">
        <div className="gtitle">Next Gen Stats</div>
        <KvList code={code} rows={NGS_TEAM} ts={data.teamStats} td={data.teamDetail} />
        <div className="gtitle">Team Overview</div>
        <KvList code={code} rows={OVERVIEW_TEAM} ts={data.teamStats} td={data.teamDetail} />
        <div className="pnote">Next Gen Stats populate from nflverse each week once the season is underway.</div>
      </div>
    </div>
  );
}

function StandingsView({ data }) {
  const codes = Object.keys(data.teamStats);
  if (!codes.length) return <div className="note">Standings load once live data is available.</div>;
  const parseW = (r) => { const m = /^(\d+)-(\d+)/.exec(r || ""); return m ? parseInt(m[1], 10) : 0; };
  const rows = codes.slice().sort((a, b) => {
    const wa = parseW(record(data.teamStats, a)), wb = parseW(record(data.teamStats, b));
    if (wb !== wa) return wb - wa;
    return (data.teamStats[b].ppg || 0) - (data.teamStats[a].ppg || 0);
  });
  return (
    <div className="stbl-wrap"><table className="stbl">
      <thead><tr><th className="lft">Team</th><th>Rec</th><th>PPG</th><th>PAPG</th><th>Off EPA</th><th>Def EPA</th></tr></thead>
      <tbody>{rows.map((c) => {
        const s = data.teamStats[c];
        return (
          <tr key={c}>
            <td className="plr"><div className="plrcell"><PlrLogo ab={c} /><span><span className="plrname">{nick(c)}</span><br /><span className="plrsub">{CITY[c]}</span></span></div></td>
            <td>{s.record}</td><td>{f1(s.ppg)}</td><td>{f1(s.papg)}</td><td>{f2(s.offEpa)}</td><td>{f2(s.defEpa)}</td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}

function RefereesView({ referees }) {
  if (!referees || !referees.length) return <div className="note"><b>Referee tendencies</b> appear here once the season's officiating assignments and flag data are available.</div>;
  return (
    <div className="stbl-wrap"><table className="stbl">
      <thead><tr><th className="lft">Referee</th><th>Games</th><th>Flags Idx</th><th>Home Adj</th><th>Over %</th></tr></thead>
      <tbody>{referees.map((r, i) => (
        <tr key={i}><td className="plr">{r.name}</td><td>{r.gamesCalled}</td><td>{r.flagsPerGameIdx}</td><td>{fs1(r.homeAdvAdj)}</td><td>{r.overPct}</td></tr>
      ))}</tbody>
    </table></div>
  );
}

// ================= App =================
// ================= Next Gen Search =================
const SEARCH_META = {
  passing: { label: "Passing", metrics: [
    ["att", "Att", 0, false], ["cmp", "Cmp %", 1, false], ["xcmp", "xCmp %", 1, false],
    ["cpoe", "CPOE", 1, true], ["ttt", "Time to Throw", 2, false], ["iay", "Air Yds/Att", 1, false],
    ["aggr", "Aggr %", 1, false], ["yds", "Pass Yds", 0, false], ["td", "Pass TD", 0, false] ], hero: "cpoe" },
  rushing: { label: "Rushing", metrics: [
    ["att", "Att", 0, false], ["yds", "Rush Yds", 0, false], ["ypc", "Yds/Att", 1, false], ["eff", "Efficiency", 2, false],
    ["stack", "8+ Box %", 1, false], ["ryoe", "RYOE/Att", 2, true], ["td", "Rush TD", 0, false], ["tlos", "Time to LOS", 2, false] ], hero: "ryoe" },
  receiving: { label: "Receiving", metrics: [
    ["rec", "Rec", 0, false], ["yds", "Rec Yds", 0, false], ["sep", "Avg Sep", 1, false], ["cush", "Cushion", 1, false],
    ["iay", "Intended AY", 1, false], ["yac", "Avg YAC", 1, false], ["yacoe", "YAC OE", 1, true], ["ctch", "Catch %", 1, false], ["td", "Rec TD", 0, false] ], hero: "yacoe" },
};
function fmtVal(v, dec, signed) {
  if (v == null) return DASH;
  const s = signed && v > 0 ? "+" : "";
  return s + (dec ? Number(v).toFixed(dec) : Math.round(v));
}
function SearchView({ players, season }) {
  const [group, setGroup] = useState("passing");
  const [team, setTeam] = useState("");
  const [sort, setSort] = useState(null);
  const [order, setOrder] = useState("desc");
  const [name, setName] = useState("");
  const meta = SEARCH_META[group];
  const heroKey = meta.hero;
  const sortKey = sort || heroKey;
  let rows = players.filter((p) => p.group === group);
  const teams = Array.from(new Set(rows.map((p) => p.team))).sort();
  if (team) rows = rows.filter((p) => p.team === team);
  if (name) rows = rows.filter((p) => (p.name || "").toLowerCase().includes(name.toLowerCase()));
  rows = rows.slice().sort((a, b) => {
    if (sortKey === "name") { const r = (a.name || "").localeCompare(b.name || ""); return order === "asc" ? r : -r; }
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return order === "asc" ? av - bv : bv - av;
  });
  function clickSort(k) { if (sortKey === k) setOrder(order === "desc" ? "asc" : "desc"); else { setSort(k); setOrder("desc"); } }
  return (
    <section className="wrap viewfade" key="search">
      <div className="eyebrow">Next Gen Search <span className="tag">{season ? season + " \u00b7 " : ""}Player Leaderboard</span></div>
      <div className="searchbar">
        <div className="sbtop"><div className="posseg">
          {Object.keys(SEARCH_META).map((g) => (
            <button key={g} className={group === g ? "on" : ""} onClick={() => { setGroup(g); setSort(null); setTeam(""); }}>{SEARCH_META[g].label}</button>
          ))}
        </div></div>
        <div className="sbfilters">
          <div className="fld"><label>Team</label>
            <select value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">All Teams</option>
              {teams.map((t) => <option key={t} value={t}>{nick(t)}</option>)}
            </select></div>
          <div className="fld"><label>Sort By</label>
            <select value={sortKey} onChange={(e) => setSort(e.target.value)}>
              {meta.metrics.map((m) => <option key={m[0]} value={m[0]}>{m[1]}</option>)}
            </select></div>
          <div className="fld"><label>Order</label>
            <select value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="desc">High &rarr; Low</option><option value="asc">Low &rarr; High</option>
            </select></div>
          <div className="fld grow"><label>Search Player</label>
            <input type="text" value={name} placeholder="Type a name..." onChange={(e) => setName(e.target.value)} /></div>
          <div className="schint"><b>{rows.length}</b> players</div>
        </div>
      </div>
      <div className="stbl-wrap"><table className="stbl">
        <thead><tr>
          <th className="lft" style={{ cursor: "default" }}>#</th>
          <th className="lft" onClick={() => clickSort("name")}>Player</th>
          {meta.metrics.map((m) => (
            <th key={m[0]} className={(m[0] === heroKey ? "hero " : "") + (sortKey === m[0] ? "sorted" : "")} onClick={() => clickSort(m[0])}>
              {m[1]}<span className="arw">{sortKey === m[0] ? (order === "asc" ? "\u25b2" : "\u25bc") : "\u25bc"}</span>
            </th>
          ))}
        </tr></thead>
        <tbody>
          {rows.length ? rows.map((p, i) => (
            <tr key={i}>
              <td className="rk">{i + 1}</td>
              <td className="plr"><div className="plrcell"><PlrLogo ab={p.team} /><span><span className="plrname">{p.name}</span><br /><span className="plrsub">{p.pos} &middot; {p.team}</span></span></div></td>
              {meta.metrics.map((m) => {
                const v = p[m[0]]; const signed = m[3];
                const cls = (m[0] === heroKey ? "hero " : "") + (signed && v != null ? (v > 0 ? "pos-good" : v < 0 ? "pos-bad" : "") : "");
                return <td key={m[0]} className={cls.trim()}>{fmtVal(v, m[2], signed)}</td>;
              })}
            </tr>
          )) : <tr><td className="stbl-empty" colSpan={meta.metrics.length + 2}>No players match those filters.</td></tr>}
        </tbody>
      </table></div>
      <div className="note"><b>Next Gen Search</b> mirrors Baseball Savant's Statcast Search for the NFL &mdash; pick a position group, filter by team, and sort any Next Gen metric. Per-player Next Gen Stats come from nflverse{season ? " (" + season + " season)" : ""}.</div>
    </section>
  );
}

const EMPTY = { teamStats: {}, teamDetail: {}, teamInjuries: {}, teamRecent: {}, schedule: [], offense: [], referees: [], week: null, players: [], recentSeason: null, props: {}, propsBook: null };

export default function RedzoneLabs() {
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState("loading"); // loading | live | failed
  const [updated, setUpdated] = useState(null);
  const [view, setView] = useState("scores"); // scores | standings | teams | referees
  const [modal, setModal] = useState(null); // {type:'game'|'quick', away, home}
  const [openTeamCode, setOpenTeamCode] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(LIVE_DATA_URL + "?t=" + Date.now());
      if (!res.ok) throw new Error("HTTP " + res.status);
      const live = await res.json();
      setData({
        teamStats: live.teamStats || {},
        teamDetail: live.teamDetail || {},
        teamInjuries: live.teamInjuries || {},
        teamRecent: live.teamRecent || {},
        schedule: Array.isArray(live.schedule) ? live.schedule : [],
        offense: Array.isArray(live.offense) ? live.offense : [],
        referees: Array.isArray(live.referees) ? live.referees : [],
        week: live.week != null ? live.week : null,
        players: Array.isArray(live.players) ? live.players : [],
        recentSeason: live.recentSeason != null ? live.recentSeason : null,
        props: live.props && typeof live.props === "object" ? live.props : {},
        propsBook: live.propsBook != null ? live.propsBook : null,
      });
      setStatus("live");
      setUpdated(new Date());
    } catch (e) {
      console.warn("Live data fetch failed:", e);
      setStatus("failed");
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setModal(null); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  const sched = data.schedule;
  const hasSearch = (data.players || []).length > 0;
  const TABS = [["scores", "Scores"], ["standings", "Standings"], ["teams", "Teams"], ...(hasSearch ? [["search", "Next Gen"]] : []), ["referees", "Referees"]];

  return (
    <>
      <style>{CSS}</style>

      <header className="top">
        <div className="wrap">
          <span className="mark" aria-hidden="true"><Flask /></span>
          <div className="brand"><span className="b1">REDZONE</span><span className="b2">LABS</span></div>
          <nav className="tabs">
            {TABS.map(([v, label]) => (
              <a key={v} className={view === v ? "on" : ""} href="#" onClick={(e) => { e.preventDefault(); setView(v); }}>{label}</a>
            ))}
          </nav>
          <div className="right">
            <span className="live" title={status === "live" && updated ? "Updated " + updated.toLocaleString() : ""}>
              <span className="dot" style={status === "failed" ? { background: "#D50000" } : undefined} />
              {status === "live" ? "Live Data" : status === "loading" ? "Loading…" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      {view === "scores" && (
        <div className="seasonbar">
          <div className="wrap">
            <div className="season-label">2026 <span>/ Regular Season</span></div>
            <div className="weekstep" style={{ pointerEvents: "none" }}>
              <button className="wlabel" style={{ borderRadius: 10 }}>Week <b>{data.week != null ? data.week : "—"}</b></button>
            </div>
            <div className="asof">{status === "live" && updated ? "Updated " + updated.toLocaleDateString() : status === "failed" ? "Live data unavailable" : "Loading…"}</div>
          </div>
        </div>
      )}

      {view === "scores" && (
        <main className="wrap viewfade" key="scores">
          <div className="eyebrow"><span>Week {data.week != null ? data.week : ""}</span> · All Games <span className="tag">{sched.length} games</span></div>
          {sched.length ? (
            <div className="grid">
              {sched.map((g, i) => {
                const a = g.away, h = g.home, ca = color(a), ch = color(h);
                return (
                  <div className="game" key={i} onClick={(e) => { if (e.target.closest(".cta")) { e.preventDefault(); setModal({ type: "quick", away: a, home: h }); } else setModal({ type: "game", away: a, home: h }); }}>
                    <div className="spine2"><span style={{ background: ca }} /><span style={{ background: ch }} /></div>
                    <div className="ghead"><span>{g.divisional ? "Division" : "Inter-conf"}</span><span className="kick">{fmtKick(g.kickoff)}</span></div>
                    <div className="grow"><Badge ab={a} cls="gbadge" /><div className="gteam"><div className="gn">{nick(a)}</div><div className="gc">{a} · Away</div></div><span className="rec tnum">{record(data.teamStats, a)}</span></div>
                    <div className="grow"><Badge ab={h} cls="gbadge" /><div className="gteam"><div className="gn">{nick(h)}</div><div className="gc">{h} · Home</div></div><span className="rec tnum">{record(data.teamStats, h)}</span></div>
                    <div className="gfoot">
                      {g.divisional && <span className="vchip div">Division</span>}
                      {g.odds && g.odds.detail && <span className="vchip">{g.odds.detail}</span>}
                      {g.odds && g.odds.total != null && <span className="vchip">O/U {g.odds.total}</span>}
                      <span className="vchip">{tc(g.roof)}</span><span className="vchip">{tc(g.surface)}</span>
                      {g.awayTravelMiles != null && <span className="vchip">{g.awayTravelMiles.toLocaleString()} mi</span>}
                      <a className="cta" href="#" onClick={(e) => e.preventDefault()}>Preview <ChevR /></a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="note">{status === "failed" ? "Live schedule unavailable right now. It refreshes nightly from nflverse." : "Loading this week’s schedule…"}</div>
          )}
          <div className="note">Schedule, sites, travel and team stats come from your nightly nflverse pull. Pre-season, stat columns fill in once games are played. Betting lines, per-player Next Gen search and player props are held until a live source is connected.</div>
        </main>
      )}

      {view === "standings" && (
        <section className="wrap viewfade" key="standings">
          <div className="eyebrow">Standings <span className="tag">2026</span></div>
          <StandingsView data={data} />
        </section>
      )}

      {view === "teams" && (
        <section className="wrap viewfade" key="teams">
          <div className="eyebrow">All Teams <span className="tag">Next Gen Stats</span></div>
          <div className="tgrid">
            {Object.keys(data.teamStats).sort().map((c) => (
              <TeamRow key={c} code={c} data={data} open={openTeamCode === c} onToggle={() => setOpenTeamCode(openTeamCode === c ? null : c)} />
            ))}
          </div>
          {!Object.keys(data.teamStats).length && <div className="note">Team pages load once live data is available.</div>}
          <div className="note"><b>Next Gen Stats</b> (CPOE, time to throw, rush yards over expected, separation, YAC/reception) come from nflverse. Values fill in per team each week; click a team to expand its full profile.</div>
        </section>
      )}

      {view === "search" && <SearchView players={data.players} season={data.recentSeason} />}

      {view === "referees" && (
        <section className="wrap viewfade" key="referees">
          <div className="eyebrow">Referees</div>
          <RefereesView referees={data.referees} />
        </section>
      )}

      <footer>Redzone Labs · westonnick7.github.io/gridiron-report</footer>

      {modal && (
        <div className="overlay on" onClick={(e) => { if (e.target.classList.contains("overlay")) setModal(null); }}>
          {modal.type === "game" ? (
            <GameModal away={modal.away} home={modal.home} sched={sched} data={data} onClose={() => setModal(null)} />
          ) : (
            <QuickModal away={modal.away} home={modal.home} sched={sched} data={data} onFull={() => setModal({ type: "game", away: modal.away, home: modal.home })} onClose={() => setModal(null)} />
          )}
        </div>
      )}
    </>
  );
}
