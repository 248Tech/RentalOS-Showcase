/* RentalOS interactive demo: static, in-memory, no network. All data is fictional. */
(function () {
  'use strict';
  const D = JSON.parse(JSON.stringify(window.BS_DATA));
  const EMAIL = 'admin@sunset-demo.test', PASS = 'DemoAdmin!2026', TAX = 0.07;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }, del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ } } };
  const app = $('#app');
  const state = { cat: 'All', q: '', filter: 'all', cindy: false, cindyLog: [['m', "Hi, I'm CINDY, a read/draft-only copilot. I can look across your quotes and inventory, but I never change data without you.\nTry the suggestions below."]] };
  const item = (id) => D.items.find((i) => i.id === id);
  const quote = (id) => D.quotes.find((q) => q.id === id);
  const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const subtotal = (q) => q.lines.reduce((s, [id, n]) => s + item(id).price * n, 0);
  const totals = (q) => { const sub = subtotal(q), disc = sub * (q.discount / 100), tax = (sub - disc) * TAX; return { sub, disc, tax, total: sub - disc + tax }; };
  const holds = (q) => q.status === 'sent' || q.status === 'approved';
  const reserved = (itemId, date, exclude) => D.quotes.filter((q) => q.id !== exclude && q.date === date && holds(q)).reduce((s, q) => s + q.lines.filter((l) => l[0] === itemId).reduce((a, l) => a + l[1], 0), 0);
  const conflicts = (q) => q.lines.map(([id, n]) => ({ id, n, avail: item(id).stock - reserved(id, q.date, q.id) })).filter((c) => c.n > c.avail);
  const allConflicts = () => D.quotes.filter(holds).flatMap((q) => conflicts(q).map((c) => ({ q, ...c })));
  const badge = (s) => `<span class="badge ${s}">${esc(s)}</span>`;

  function toast(m) { let b = $('.toast'); if (!b) { b = document.createElement('div'); b.className = 'toast'; b.setAttribute('role', 'status'); document.body.appendChild(b); } const d = document.createElement('div'); d.textContent = m; b.appendChild(d); setTimeout(() => d.remove(), 3600); }
  function modal(html, mount) {
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    bg.addEventListener('click', (e) => { if (e.target === bg) bg.remove(); });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { bg.remove(); document.removeEventListener('keydown', k); } });
    document.body.appendChild(bg); $$('[data-close]', bg).forEach((b) => b.addEventListener('click', () => bg.remove())); if (mount) mount(bg); return bg;
  }

  const NAV = [['Workspace', [['dashboard', 'Home', '⌂'], ['quotes', 'Projects', '▤'], ['inventory', 'Inventory', '▦'], ['leads', 'Leads', '✉'], ['messages', 'Messages', '💬']]], ['Insights', [['stats', 'Sales & Stats', '▥'], ['catalog', 'Public Catalog', '🌐']]], ['Team', [['team', 'Team', '☺'], ['settings', 'Settings', '⚙']]]];
  const route = () => (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');

  function shell(inner, page) {
    return `<div class="shell"><nav class="side" id="side" aria-label="Primary"><div class="brand"><span class="logo">R</span>RentalOS</div><div class="nav">${NAV.map(([g, l]) => `<div class="sec">${g}</div>` + l.map(([id, n, ic]) => `<a class="${id === page ? 'on' : ''}" href="#/${id}"><i>${ic}</i>${n}</a>`).join('')).join('')}</div>
    <div class="sfoot"><div><b style="color:#fff">${esc(D.company)}</b><br>admin@sunset-demo.test</div><button class="btn sm" id="logout">Sign out</button></div></nav>
    <div class="main"><div class="banner"><b>Interactive demo</b><span>Fictional company and data — runs entirely in your browser and resets on reload.</span><span class="sp"></span><a href="../">← Overview</a></div>
    <div class="top"><button class="menu" id="menu" aria-label="Toggle navigation">☰</button><input class="in search" id="gs" placeholder="Search projects & inventory…" aria-label="Global search"><span class="badge approved">Admin</span></div>
    <main class="content" id="page">${inner}</main></div></div>
    <button class="cindy-fab" id="cfab">✦ CINDY</button><div id="cpanel"></div>`;
  }

  const pages = {};

  pages.dashboard = () => {
    const open = D.quotes.filter((q) => q.status !== 'completed');
    const pipeline = open.reduce((s, q) => s + totals(q).total, 0), booked = D.quotes.filter((q) => q.status === 'approved').reduce((s, q) => s + totals(q).total, 0);
    const cf = allConflicts();
    const upcoming = [...open].sort((a, b) => a.date.localeCompare(b.date));
    const by = { draft: 0, sent: 0, approved: 0 }; open.forEach((q) => { by[q.status] += totals(q).total; });
    const max = Math.max(...Object.values(by), 1);
    return `<div class="title"><h1>Good day, Joe</h1><span class="sp"></span><a class="btn primary" href="#/quotes">+ New project</a></div>
    ${cf.length ? `<div class="alert bad"><b>${cf.length} availability conflict${cf.length > 1 ? 's' : ''} detected.</b> ${cf.slice(0, 2).map((c) => `${esc(item(c.id).name)} on ${fmtDate(c.q.date)} (need ${c.n}, ${Math.max(c.avail, 0)} free)`).join(' · ')} — <a href="#/quote/${cf[0].q.id}">review</a></div>` : '<div class="alert ok">No availability conflicts. You are clear to book.</div>'}
    <div class="grid g4"><div class="card stat"><div class="l">Open pipeline</div><div class="v">${money0(pipeline)}</div></div><div class="card stat"><div class="l">Booked (approved)</div><div class="v">${money0(booked)}</div></div><div class="card stat"><div class="l">Active projects</div><div class="v">${open.length}</div></div><div class="card stat"><div class="l">New leads</div><div class="v">${D.leads.filter((l) => l.status === 'new').length}</div></div></div>
    <div class="grid g2" style="margin-top:14px"><div class="card"><h3>Pipeline by stage</h3><div class="bars">${Object.entries(by).map(([k, v]) => `<div class="bar"><span>${money0(v)}</span><i style="height:${(v / max) * 100}%"></i><span>${k}</span></div>`).join('')}</div></div>
    <div class="card"><h3>Upcoming events</h3>${upcoming.map((q) => `<div class="row" style="justify-content:space-between;padding:.4rem 0;border-bottom:1px solid #edf2f6"><span><a href="#/quote/${q.id}"><b>${esc(q.name)}</b></a><br><small style="color:var(--muted)">${fmtDate(q.date)} · ${esc(q.venue)}</small></span>${badge(q.status)}</div>`).join('')}</div></div>`;
  };

  pages.quotes = () => {
    const rows = D.quotes.filter((q) => state.filter === 'all' || q.status === state.filter);
    return `<div class="title"><h1>Projects</h1><span class="sp"></span><button class="btn primary" id="newq">+ New project</button></div>
    <div class="chips">${['all', 'draft', 'sent', 'approved', 'completed'].map((f) => `<button class="chip ${state.filter === f ? 'on' : ''}" data-f="${f}">${f}</button>`).join('')}</div>
    <div class="tw"><table><thead><tr><th>Project</th><th>Client</th><th>Event date</th><th>Status</th><th>Signed</th><th class="r">Total</th></tr></thead><tbody>${rows.map((q) => `<tr class="click" data-q="${q.id}"><td><b>${esc(q.name)}</b><br><small class="mono" style="color:var(--muted)">${q.id}</small></td><td>${esc(q.client)}</td><td>${fmtDate(q.date)}</td><td>${badge(q.status)}${conflicts(q).length && holds(q) ? ' <span class="badge bad">conflict</span>' : ''}</td><td>${q.signed ? '✔' : '—'}</td><td class="r">${money(totals(q).total)}</td></tr>`).join('')}</tbody></table></div>`;
  };
  pages.quotes.bind = () => {
    $$('[data-f]').forEach((b) => b.addEventListener('click', () => { state.filter = b.dataset.f; render(); }));
    $$('[data-q]').forEach((r) => r.addEventListener('click', () => (location.hash = '#/quote/' + r.dataset.q)));
    $('#newq').addEventListener('click', () => modal(`<h2>New project</h2><label class="f">Project name<input id="nn" value="Spring Garden Party"></label><label class="f">Client<input id="nc" value="Jamie Lopez"></label><label class="f">Event date<input id="nd" type="date" value="${D.today}"></label><div class="row" style="justify-content:flex-end"><button class="btn" data-close>Cancel</button><button class="btn primary" id="mk">Create</button></div>`, (bg) => $('#mk', bg).addEventListener('click', () => { const id = 'Q-' + (2045 + D.quotes.length - 5); D.quotes.unshift({ id, name: $('#nn', bg).value || 'Untitled', client: $('#nc', bg).value || 'Client', email: 'client@example.com', phone: '555-010-0000', venue: 'TBD', date: $('#nd', bg).value || D.today, status: 'draft', signed: false, discount: 0, lines: [], thread: [] }); bg.remove(); location.hash = '#/quote/' + id; toast('Project ' + id + ' created'); })));
  };

  pages.quote = (id) => {
    const q = quote(id); if (!q) return '<div class="card">Project not found. <a href="#/quotes">Back</a></div>';
    const t = totals(q), cf = conflicts(q);
    return `<div class="title"><a href="#/quotes">← Projects</a><h1>${esc(q.name)}</h1>${badge(q.status)}${q.signed ? '<span class="badge approved">signed</span>' : ''}<span class="sp"></span>
      <button class="btn" id="pull">Pull sheet</button><button class="btn" id="pub">Client view</button>${q.status === 'draft' ? '<button class="btn primary" id="send">Send to client</button>' : ''}</div>
    ${cf.length && holds(q) || (cf.length && q.status === 'draft') ? `<div class="alert bad"><b>Availability conflict</b> on ${fmtDate(q.date)}:<ul style="margin:.4rem 0 0 1.1rem;padding:0">${cf.map((c) => `<li>${esc(item(c.id).name)}: need ${c.n}, only ${Math.max(c.avail, 0)} free (stock ${item(c.id).stock}) — consider a subrental</li>`).join('')}</ul></div>` : '<div class="alert ok">All items available for this date.</div>'}
    <div class="grid g3"><div class="card"><h3>Client</h3><b>${esc(q.client)}</b><br>${esc(q.email)}<br>${esc(q.phone)}</div><div class="card"><h3>Event</h3><b>${fmtDate(q.date)}</b><br>${esc(q.venue)}<br><span class="mono" style="color:var(--muted)">${q.id}</span></div><div class="card"><h3>Discount</h3><div class="row"><input class="in" id="disc" type="number" min="0" max="50" value="${q.discount}" style="width:80px" aria-label="Discount percent"> % <small style="color:var(--muted)">(signed quotes require re-approval)</small></div></div></div>
    <div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">Line items</h3><div class="row"><select class="in" id="addsel" style="width:240px" aria-label="Add item"><option value="">+ Add inventory item…</option>${D.items.map((i) => `<option value="${i.id}">${esc(i.name)} — ${money(i.price)}</option>`).join('')}</select></div></div>
    <div class="tw"><table><thead><tr><th>Item</th><th>Availability</th><th class="r">Price</th><th class="r">Qty</th><th class="r">Line total</th><th></th></tr></thead><tbody>${q.lines.map(([iid, n], idx) => { const it = item(iid), free = it.stock - reserved(iid, q.date, q.id); return `<tr><td>${it.icon} ${esc(it.name)}</td><td>${n > free ? `<span class="badge bad">short ${n - Math.max(free, 0)}</span>` : `<span class="badge approved">${free} free</span>`}</td><td class="r">${money(it.price)}</td><td class="r"><input class="in" type="number" min="1" value="${n}" data-qty="${idx}" style="width:80px;text-align:right" aria-label="Quantity"></td><td class="r">${money(it.price * n)}</td><td><button class="btn sm danger" data-rm="${idx}">Remove</button></td></tr>`; }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:1.5rem">No items yet. Add some from inventory.</td></tr>'}</tbody></table></div>
    <div class="totals"><div><span>Subtotal</span><span>${money(t.sub)}</span></div>${q.discount ? `<div><span>Discount (${q.discount}%)</span><span>−${money(t.disc)}</span></div>` : ''}<div><span>Tax (7%)</span><span>${money(t.tax)}</span></div><div class="g"><span>Total</span><span>${money(t.total)}</span></div></div></div>
    <div class="card" style="margin-top:14px"><h3>Messages (quote-linked)</h3><div class="thread">${q.thread.map(([w, n, m]) => `<div class="msg ${w}"><small>${esc(n)}</small>${esc(m)}</div>`).join('') || '<small style="color:var(--muted)">No messages yet.</small>'}</div><div class="row"><input class="in" id="mtxt" placeholder="Reply to client…" style="flex:1" aria-label="Message"><button class="btn primary" id="msend">Send</button></div></div>`;
  };
  pages.quote.bind = (id) => {
    const q = quote(id); if (!q) return;
    $$('[data-qty]').forEach((i) => i.addEventListener('change', () => { q.lines[+i.dataset.qty][1] = Math.max(1, +i.value || 1); if (q.signed) { q.signed = false; q.status = 'sent'; toast('Signed quote changed — client must re-approve.'); } render(); }));
    $$('[data-rm]').forEach((b) => b.addEventListener('click', () => { q.lines.splice(+b.dataset.rm, 1); render(); }));
    $('#addsel').addEventListener('change', (e) => { if (!e.target.value) return; const ex = q.lines.find((l) => l[0] === e.target.value); if (ex) ex[1]++; else q.lines.push([e.target.value, 1]); render(); });
    $('#disc').addEventListener('change', (e) => { q.discount = Math.min(50, Math.max(0, +e.target.value || 0)); render(); });
    const send = $('#send'); if (send) send.addEventListener('click', () => { q.status = 'sent'; toast('Quote emailed to ' + q.email + ' (mock SMTP)'); render(); });
    $('#msend').addEventListener('click', () => { const v = $('#mtxt').value.trim(); if (!v) return; q.thread.push(['staff', 'You', v]); render(); toast('Message sent'); });
    $('#pull').addEventListener('click', () => { const groups = {}; q.lines.forEach(([iid, n]) => { const it = item(iid); (groups[it.category] = groups[it.category] || []).push([it, n]); }); modal(`<h2>Pull sheet — ${esc(q.name)}</h2><p style="color:var(--muted)">Grouped by category for warehouse picking · ${fmtDate(q.date)}</p>${Object.entries(groups).map(([c, l]) => `<h3 style="margin:.8rem 0 .3rem;font-size:.85rem">${c}</h3><div class="tw"><table><tbody>${l.map(([it, n]) => `<tr><td style="width:30px">☐</td><td>${esc(it.name)}<br><small class="mono" style="color:var(--muted)">${it.sku}</small></td><td class="r"><b>×${n}</b></td></tr>`).join('')}</tbody></table></div>`).join('') || '<p>Nothing to pull yet.</p>'}<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Close</button><button class="btn primary" onclick="window.print()">Print</button></div>`); });
    $('#pub').addEventListener('click', () => { const t = totals(q); modal(`<h2>Client view</h2><p style="color:var(--muted);font-size:.8rem">What your customer sees at <span class="mono">/q/${q.id.toLowerCase()}</span></p><div class="paper"><h3 style="text-transform:none;font-size:1.1rem;color:var(--text)">${esc(D.company)} · ${esc(q.name)}</h3><p>${fmtDate(q.date)} · ${esc(q.venue)}</p><table><tbody>${q.lines.map(([iid, n]) => `<tr><td>${esc(item(iid).name)} ×${n}</td><td class="r">${money(item(iid).price * n)}</td></tr>`).join('')}<tr><td><b>Total (incl. tax)</b></td><td class="r"><b>${money(t.total)}</b></td></tr></tbody></table><h3 style="margin-top:14px">Approve &amp; sign</h3>${q.signed ? '<div class="alert ok">Signed — audit record captured (name, time, IP hash).</div>' : `<label class="f">Type your full name to sign<input id="sg" value="${esc(q.client)}"></label><div class="sig" id="sigp">${esc(q.client)}</div><div class="row" style="margin-top:10px"><button class="btn ok" id="appr">Approve &amp; sign</button></div>`}</div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" data-close>Close</button></div>`, (bg) => { const sg = $('#sg', bg); if (sg) { sg.addEventListener('input', () => ($('#sigp', bg).textContent = sg.value)); $('#appr', bg).addEventListener('click', () => { if (!sg.value.trim()) return; q.signed = true; q.status = 'approved'; bg.remove(); toast('Quote approved and signed by ' + sg.value); render(); }); } }); });
  };

  pages.inventory = () => {
    const list = D.items.filter((i) => (state.cat === 'All' || i.category === state.cat) && (!state.q || i.name.toLowerCase().includes(state.q.toLowerCase())));
    return `<div class="title"><h1>Inventory</h1><span class="sp"></span><input class="in" id="iq" placeholder="Search ${D.items.length} items…" value="${esc(state.q)}" style="width:240px" aria-label="Search inventory"></div>
    <div class="chips">${['All', ...D.cat].map((c) => `<button class="chip ${state.cat === c ? 'on' : ''}" data-c="${c}">${c}</button>`).join('')}</div>
    <div class="items">${list.map((i) => `<div class="item" data-i="${i.id}" tabindex="0" role="button"><div class="ph">${i.icon}</div><div class="b"><div class="n">${esc(i.name)}</div><div class="m">${i.category} · ${money(i.price)}</div><div class="m">Stock: ${i.stock}</div></div></div>`).join('') || '<div class="card">No items match.</div>'}</div>`;
  };
  pages.inventory.bind = () => {
    $$('[data-c]').forEach((b) => b.addEventListener('click', () => { state.cat = b.dataset.c; render(); }));
    const q = $('#iq'); q.addEventListener('input', () => { state.q = q.value; const p = q.selectionStart; render(); const n = $('#iq'); n.focus(); n.setSelectionRange(p, p); });
    $$('[data-i]').forEach((c) => { const open = () => itemModal(c.dataset.i); c.addEventListener('click', open); c.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); }); });
  };
  function itemModal(id) {
    const it = item(id); const days = Array.from({ length: 14 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() + k); const iso = d.toISOString().slice(0, 10); return { iso, free: it.stock - reserved(id, iso) }; });
    modal(`<h2>${it.icon} ${esc(it.name)}</h2><p style="color:var(--muted)">${esc(it.desc)}</p><div class="row" style="gap:18px;margin-bottom:10px"><span><b>${money(it.price)}</b> / event</span><span>Stock <b>${it.stock}</b></span><span class="mono">${it.sku}</span></div><h3 style="font-size:.78rem;color:var(--muted);text-transform:uppercase">Availability — next 14 days</h3><div class="avail" title="Bar height is units free per day">${days.map((d) => `<i class="${d.free <= 0 ? 'out' : d.free < it.stock * 0.25 ? 'low' : ''}" style="height:${Math.max(6, (Math.max(d.free, 0) / it.stock) * 100)}%" title="${d.iso}: ${d.free} free"></i>`).join('')}</div><p style="font-size:.76rem;color:var(--muted)">Green = plenty, orange = low, red = fully booked.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-close>Close</button><button class="btn primary" id="setaside">Set aside 1</button></div>`, (bg) => $('#setaside', bg).addEventListener('click', () => { it.stock = Math.max(0, it.stock - 1); bg.remove(); toast('1 × ' + it.name + ' set aside (out of rentable stock)'); render(); }));
  }

  pages.leads = () => `<div class="title"><h1>Leads</h1></div><div class="tw"><table><thead><tr><th>Lead</th><th>Source</th><th>Event</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>${D.leads.map((l) => `<tr><td><b>${esc(l.name)}</b></td><td>${esc(l.source)}</td><td>${esc(l.event)}</td><td>${fmtDate(l.date)}</td><td>${badge(l.status)}</td><td><button class="btn sm primary" data-lead="${l.id}">Convert to project</button></td></tr>`).join('') || '<tr><td colspan="6" style="padding:1.5rem;text-align:center;color:var(--muted)">No leads left.</td></tr>'}</tbody></table></div>`;
  pages.leads.bind = () => $$('[data-lead]').forEach((b) => b.addEventListener('click', () => { const l = D.leads.find((x) => x.id === b.dataset.lead); const id = 'Q-' + (2045 + D.quotes.length - 5); D.quotes.unshift({ id, name: l.event.split(' · ')[0] + ' — ' + l.name, client: l.name, email: 'lead@example.com', phone: '555-010-0000', venue: 'TBD', date: l.date, status: 'draft', signed: false, discount: 0, lines: [], thread: [] }); D.leads.splice(D.leads.indexOf(l), 1); toast('Lead converted to ' + id); location.hash = '#/quote/' + id; }));

  pages.messages = () => { const th = D.quotes.filter((q) => q.thread.length); return `<div class="title"><h1>Messages</h1></div><div class="grid g2">${th.map((q) => `<div class="card"><div class="row" style="justify-content:space-between"><b>${esc(q.name)}</b><a href="#/quote/${q.id}">Open</a></div><div class="thread" style="margin-top:8px">${q.thread.map(([w, n, m]) => `<div class="msg ${w}"><small>${esc(n)}</small>${esc(m)}</div>`).join('')}</div></div>`).join('')}</div><p style="color:var(--muted)">Replies are captured via IMAP and attached to the right quote automatically.</p>`; };

  pages.team = () => `<div class="title"><h1>Team</h1></div><div class="grid g2"><div class="card"><h3>Presence</h3>${D.team.map((m) => `<div class="row" style="justify-content:space-between;padding:.4rem 0;border-bottom:1px solid #edf2f6"><span><b>${m.name}</b> <small style="color:var(--muted)">${m.role}</small></span><span><span class="badge ${m.presence === 'online' ? 'approved' : m.presence === 'away' ? 'warn' : ''}">${m.presence}</span> <small style="color:var(--muted)">${m.page}</small></span></div>`).join('')}</div>
    <div class="card"><h3>Team chat</h3><div class="thread" id="tc">${D.chat.map(([n, t, m]) => `<div class="msg ${n === 'Joe W.' ? 'staff' : ''}"><small>${n} · ${t}</small>${esc(m)}</div>`).join('')}</div><div class="row"><input class="in" id="tcm" placeholder="Message the team…" style="flex:1" aria-label="Team message"><button class="btn primary" id="tcs">Send</button></div></div></div>`;
  pages.team.bind = () => { const go = () => { const v = $('#tcm').value.trim(); if (!v) return; D.chat.push(['Joe W.', new Date().toTimeString().slice(0, 5), v]); render(); }; $('#tcs').addEventListener('click', go); $('#tcm').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); }); };

  pages.stats = () => {
    const rev = {}; D.quotes.forEach((q) => q.lines.forEach(([id, n]) => { rev[id] = (rev[id] || 0) + item(id).price * n; }));
    const top = Object.entries(rev).sort((a, b) => b[1] - a[1]).slice(0, 8); const max = top[0] ? top[0][1] : 1;
    return `<div class="title"><h1>Sales &amp; Stats</h1></div><div class="grid g2"><div class="card"><h3>Top items by quoted revenue</h3>${top.map(([id, v]) => `<div style="margin-bottom:8px"><div class="row" style="justify-content:space-between"><span>${esc(item(id).name)}</span><b>${money0(v)}</b></div><div style="height:8px;background:#edf2f6;border-radius:6px"><div style="height:100%;width:${(v / max) * 100}%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:6px"></div></div></div>`).join('')}</div>
    <div class="card"><h3>Pipeline summary</h3>${['draft', 'sent', 'approved', 'completed'].map((s) => { const qs = D.quotes.filter((q) => q.status === s); return `<div class="row" style="justify-content:space-between;padding:.45rem 0;border-bottom:1px solid #edf2f6"><span>${badge(s)} ${qs.length} project${qs.length === 1 ? '' : 's'}</span><b>${money0(qs.reduce((a, q) => a + totals(q).total, 0))}</b></div>`; }).join('')}</div></div>`;
  };

  pages.catalog = () => `<div class="title"><h1>Public Catalog</h1><span class="sp"></span><span class="badge approved">SEO enabled</span></div><div class="alert ok">Public pages ship with canonical URLs, JSON-LD <span class="mono">Product</span> markup, <span class="mono">robots.txt</span> and an auto-generated sitemap.</div>
    <div class="items">${D.items.slice(0, 10).map((i) => `<div class="item"><div class="ph">${i.icon}</div><div class="b"><div class="n">${esc(i.name)}</div><div class="m">From ${money(i.price)}</div></div></div>`).join('')}</div>
    <div class="card" style="margin-top:14px"><h3>Generated JSON-LD (sample)</h3><pre class="mono" style="margin:0;white-space:pre-wrap;font-size:.76rem">${esc(JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: D.items[0].name, category: D.items[0].category, offers: { '@type': 'Offer', price: D.items[0].price, priceCurrency: 'USD' } }, null, 2))}</pre></div>`;

  pages.settings = () => `<div class="title"><h1>Settings</h1></div><div class="grid g2"><div class="card"><h3>Module permissions (Staff role)</h3>${[['Projects', 1], ['Inventory', 1], ['Messages', 1], ['Billing', 0], ['Admin tools', 0], ['AI copilot', 1]].map(([n, o]) => `<div class="row" style="justify-content:space-between;margin-bottom:10px"><span>${n}</span><button class="sw ${o ? 'on' : ''}" aria-label="${n}"></button></div>`).join('')}</div>
    <div class="card"><h3>Integrations</h3>${[['SMTP / IMAP email', 'connected'], ['Google Sheets import', 'connected'], ['Goodshuffle Chrome extension', 'installed'], ['Mapbox maps', 'optional'], ['AI providers (OpenAI / Anthropic / Gemini / Ollama)', 'optional'], ['Rust availability engine', 'guarded rollout']].map(([n, s]) => `<div class="row" style="justify-content:space-between;margin-bottom:10px"><span>${n}</span><span class="badge ${s === 'connected' || s === 'installed' ? 'approved' : ''}">${s}</span></div>`).join('')}</div></div>`;
  pages.settings.bind = () => $$('.sw').forEach((s) => s.addEventListener('click', () => s.classList.toggle('on')));

  /* ---- CINDY (scripted, read/draft-only) ---- */
  function cindyAnswer(t) {
    t = t.toLowerCase();
    if (/conflict|short|oversold|available/.test(t)) { const c = allConflicts(); return c.length ? 'I found ' + c.length + ' conflict(s):\n' + c.map((x) => `• ${x.q.name} (${fmtDate(x.q.date)}): ${item(x.id).name} — need ${x.n}, ${Math.max(x.avail, 0)} free`).join('\n') + '\n\nSuggestion: subrent the shortfall or move one event. I will not change anything unless you do.' : 'No conflicts right now.'; }
    if (/revenue|pipeline|sales|total/.test(t)) { const open = D.quotes.filter((q) => q.status !== 'completed'); return `Open pipeline is ${money0(open.reduce((s, q) => s + totals(q).total, 0))} across ${open.length} projects. Booked: ${money0(D.quotes.filter((q) => q.status === 'approved').reduce((s, q) => s + totals(q).total, 0))}.`; }
    if (/draft|reply|email|message/.test(t)) { const q = D.quotes.find((x) => x.status === 'sent' && x.thread.length) || D.quotes[0]; return `Draft reply for ${q.client} (${q.name}):\n\n"Hi ${q.client.split(' ')[0]}, thanks for reaching out! Yes — delivery and setup are included for events within 25 miles. I've attached the updated quote for ${fmtDate(q.date)}. Happy to adjust anything!"\n\n(Draft only — nothing was sent.)`; }
    if (/pull|warehouse|pick/.test(t)) { const q = D.quotes.filter(holds).sort((a, b) => a.date.localeCompare(b.date))[0]; return `Next event is "${q.name}" on ${fmtDate(q.date)}. It needs ${q.lines.reduce((s, l) => s + l[1], 0)} total units across ${q.lines.length} line items. Open the quote and click “Pull sheet” for the picking list.`; }
    if (/lead|new/.test(t)) return `You have ${D.leads.length} open lead(s): ` + D.leads.map((l) => l.name + ' (' + l.event + ')').join('; ') + '.';
    return 'I can check availability conflicts, summarize pipeline revenue, draft client replies, or find the next pull sheet. What would you like?';
  }
  function renderCindy() {
    const el = $('#cpanel'); if (!state.cindy) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="cindy" role="dialog" aria-label="CINDY copilot"><header><span>✦ CINDY copilot</span><button id="cx" style="background:none;border:0;color:#fff;cursor:pointer;font-size:1.1rem" aria-label="Close">×</button></header><div class="log" id="clog">${state.cindyLog.map(([k, m]) => `<div class="m ${k === 'u' ? 'u' : ''}">${esc(m)}</div>`).join('')}</div><div class="sugg">${['Any conflicts?', "What's my pipeline?", 'Draft a reply', 'Next pull sheet'].map((s) => `<button data-s="${s}">${s}</button>`).join('')}</div><form id="cf"><input id="ci" placeholder="Ask CINDY…" aria-label="Ask CINDY" autocomplete="off"><button class="btn primary" type="submit">Send</button></form></div>`;
    const log = $('#clog'); log.scrollTop = log.scrollHeight;
    const ask = (t) => { if (!t.trim()) return; state.cindyLog.push(['u', t]); state.cindyLog.push(['m', cindyAnswer(t)]); renderCindy(); };
    $('#cx').addEventListener('click', () => { state.cindy = false; renderCindy(); }); $$('[data-s]', el).forEach((b) => b.addEventListener('click', () => ask(b.dataset.s)));
    $('#cf').addEventListener('submit', (e) => { e.preventDefault(); ask($('#ci').value); }); $('#ci').focus();
  }

  /* ---- render / auth ---- */
  function render() {
    if (!store.get('bs_demo_auth')) return renderLogin();
    const [p, arg] = route(); const page = pages[p] ? p : 'dashboard';
    const navPage = page === 'quote' ? 'quotes' : page;
    app.innerHTML = shell(pages[page](arg), navPage);
    document.title = (page === 'quote' ? 'Project ' + (arg || '') : page[0].toUpperCase() + page.slice(1)) + ' · RentalOS Demo';
    $('#menu').addEventListener('click', () => $('#side').classList.toggle('open'));
    $$('#side a').forEach((a) => a.addEventListener('click', () => $('#side').classList.remove('open')));
    $('#logout').addEventListener('click', () => { store.del('bs_demo_auth'); location.hash = ''; render(); });
    $('#cfab').addEventListener('click', () => { state.cindy = !state.cindy; renderCindy(); });
    $('#gs').addEventListener('keydown', (e) => { if (e.key === 'Enter') { state.q = e.target.value; location.hash = '#/inventory'; } });
    if (pages[page].bind) pages[page].bind(arg);
    renderCindy();
  }
  function renderLogin() {
    document.title = 'Sign in · RentalOS Demo';
    app.innerHTML = `<div class="login"><form class="card-login" id="lf" novalidate><div class="logo">R</div><h1>RentalOS</h1><p class="sub">Sign in to ${esc(D.company)}</p><label class="f">Email<input id="em" type="email" autocomplete="username" value="${EMAIL}"></label><label class="f">Password<input id="pw" type="password" autocomplete="current-password" value="${PASS}"></label><div id="err" role="alert" style="color:#b42318;font-size:.8rem;min-height:1.1em;margin-bottom:6px"></div><button class="btn primary block" type="submit">Sign in</button><div class="divider">or</div><button class="btn block" type="button" id="quick">Enter as demo administrator</button><div class="hint"><b>Demo credentials are pre-filled.</b><br>Email <span class="mono">${EMAIL}</span><br>Password <span class="mono">${PASS}</span><br>Fictional company, in-browser data. No server, no real accounts.</div><p style="text-align:center;margin:14px 0 0"><a href="../">← Back to project overview</a></p></form></div>`;
    const go = () => { store.set('bs_demo_auth', '1'); location.hash = '#/dashboard'; render(); };
    $('#lf').addEventListener('submit', (e) => { e.preventDefault(); if ($('#em').value.trim().toLowerCase() === EMAIL && $('#pw').value === PASS) go(); else $('#err').textContent = 'Invalid credentials. Use the pre-filled demo account.'; });
    $('#quick').addEventListener('click', go);
  }
  window.addEventListener('hashchange', render);
  render();
})();
