/* rumo landing: behavior layer. No dependencies, no scroll listeners (IntersectionObserver only). */
(() => {
  'use strict';

  const CFG = Object.assign(
    { WAITLIST_ENDPOINT: '', CONTACT_EMAIL: '', DEMO_VIDEO: { provider: '', src: '', poster: '' }, APP_STORE_URL: '', SITE_URL: '' },
    window.RUMO_CONFIG || {}
  );
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* private mode */ } },
  };

  /* ------------------------------------------------------------------ analytics shim */
  function track(event, props) {
    const payload = Object.assign({ lang }, props || {});
    try {
      if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(event, payload);
      else if (typeof window.plausible === 'function') window.plausible(event, { props: payload });
      else if (typeof window.gtag === 'function') window.gtag('event', event, payload);
    } catch (_) { /* never break the page for analytics */ }
    (window.__rumoEvents = window.__rumoEvents || []).push({ event, payload, t: Date.now() });
  }

  /* ------------------------------------------------------------------ i18n */
  const LOC = { pt: 'pt-BR', en: 'en-US' };
  const CUR = { pt: 'BRL', en: 'USD' }; // the demo shows the visitor's own currency, nothing else
  let lang = 'pt';

  const EN = {
    skip: 'Skip to content',
    'nav.app': 'How it works', 'nav.widget': 'Widget', 'nav.contact': 'Contact',
    'cta.join': 'Join the waitlist', 'cta.download': 'Download for iPhone',
    'hero.eyebrow': 'On iPhone · From Lock Screen to dashboard in 1 tap',
    'hero.l1': 'Your', 'hero.l2': 'personal', 'hero.l3a': '', 'hero.l3b': 'AI CFO.',
    'hero.sub': 'See where every cent goes. rumo analyzes your spending and shows what matters on your Home Screen.',
    'hero.calloutT': 'Apple Wallet → rumo',
    'hero.calloutB': 'Expense categorized live',
    'hero.swAria': 'Demo screens',
    'hero.swLock': 'Lock Screen + Widget',
    'hero.swDash': 'rumo Dashboard',
    'wl.label': 'Your email', 'wl.ph': 'name@example.com',
    'wl.help': 'We only use your email to tell you when the app opens. No spam, and you can leave anytime.',
    'hero.demo': 'See the app in 60 seconds',
    'demo.h': 'See rumo in 60 seconds.', 'demo.p': 'Your spending, the AI analysis and the widget in one quick tour. No sign-up.',
    'demo.soon': 'Demo video coming soon', 'demo.c1': 'Spending', 'demo.c2': 'AI analysis', 'demo.c3': 'Widget', 'demo.c4': 'Ask rumo', 'demo.play': 'Watch the demo',
    'app.h': 'From expense to answer, effortlessly.', 'app.caption': 'Screens with sample data.', 'app.ctaP': 'Want to see this with your own spending?',
    'st1.h': 'Your spending, sorted on its own.', 'st1.p': 'Paid with Apple Wallet? The expense lands in rumo already categorized. You just check it.', 'st1.pill': 'Spending',
    'st2.h': 'The AI shows what changed.', 'st2.p': 'Dining went up, a subscription is duplicated, the budget is on track. Every note comes with the amount and one next step, no drama.', 'st2.pill': 'rumo analysis',
    'st3.h': 'Ask. It answers with your numbers.', 'st3.p': 'Can I order delivery today? How much did I spend on groceries? rumo answers from your own spending, no guesswork.', 'st3.pill': 'Ask rumo',
    'tab.today': 'Today', 'tab.spend': 'Spending', 'tab.wallet': 'Wallet', 'tab.rumo': 'Rumo',
    'ls.date': 'Sat, October 17', 'ls.wTitle': 'October spending', 'ls.paceLbl': 'Daily pace', 'ls.leftLbl': 'Available',
    'ls.aiNote': 'AI CFO: budget on track. You still have about $95/day left in October.',
    'ls.hint': 'Tap the widget to open the dashboard',
    's1.month': 'October', 's1.day': 'Day 17 of 31', 's1.ok': 'On track', 's1.over': 'A bit over pace', 's1.of': 'of',
    'spend.left': '{amt} left over {days} days', 'w.left': '{amt} left',
    'cat.groc': 'Groceries', 'cat.dine': 'Dining', 'cat.trans': 'Transport', 'cat.leis': 'Leisure', 'cat.oth': 'Other',
    'feed.now': 'now', 'feed.today': 'today', 'feed.yday': 'yesterday', 'via.pay': 'Apple Pay', 'via.card': 'Card',
    's2.title': 'rumo analysis', 's2.sub': 'What changed in October',
    's2.i1.k': 'Dining', 's2.i1.o': 'Delivery is up 18% since September.', 's2.i1.p': 'That is $63.90 more, across 14 purchases.', 's2.i1.c': 'See the 14 purchases',
    's2.i2.k': 'Subscriptions', 's2.i2.o': 'Two music subscriptions.', 's2.i2.p': 'Canceling the smaller one saves $262.80 a year.', 's2.i2.c': 'See both charges',
    's2.i3.k': 'Budget', 's2.i3.o': 'On track for the month.', 's2.i3.p': '$1,335 left for 14 days, about $95 a day.', 's2.i3.c': 'See the weekly summary',
    's3.title': 'Ask rumo', 's3.sub': 'Answers with your numbers', 's3.q': 'Can I order delivery today without going over budget?',
    's3.a': 'You can. $1,335 is left for 14 days, about $95 a day. Your average order is $29.90.', 's3.src': 'Based on your October spending.',
    's3.s1': 'How much did I spend on groceries?', 's3.s2': 'Where can I save?', 's3.ph': 'Ask about your spending',
    'w.month': 'October', 'w.of': 'of', 'w.today': 'Today', 'w.avg': 'Month average', 'w.perday': '/day', 'w.cats': 'By category', 'w.add': 'New expense',
    'wid.h': 'Your budget on the Home Screen.', 'wid.p': 'See what is left without opening the app. When an expense comes in, the widget updates on its own.',
    'wid.b1t': 'What is left', 'wid.b1p': 'The month budget and the daily average, always in view.',
    'wid.b2t': 'Where it goes', 'wid.b2p': 'Spending by category, updated with every purchase.',
    'wid.b3t': 'One tap', 'wid.b3p': 'Log an expense straight from the widget.', 'wid.caption': 'Widgets with sample data.',
    'banner.now': 'now', 'banner.b': 'Categorized as {cat}.',
    'prom.h': 'rumo never holds, moves or converts your money.',
    'prom.p': 'We are software, not a bank. We do not ask for your bank password and we never sell your data.',
    'prom.1t': 'No bank password', 'prom.1p': 'Expenses come from Apple Wallet and the statements you choose to import.',
    'prom.2t': 'Encrypted statements', 'prom.2p': 'The files you import are protected with encryption.',
    'prom.3t': 'Delete everything anytime', 'prom.3p': "Ask us to delete your account and data and we will, as Brazil's LGPD requires.",
    'faq.h': 'Questions we hear.',
    'faq.q1': 'Do I need to connect my bank?', 'faq.a1': 'No. Purchases paid with Apple Wallet come in on their own, and you can also import statements (PDF, CSV or OFX) or log an expense with one tap. rumo never asks for your bank password.',
    'faq.q2': 'Does rumo touch my money?', 'faq.a2': 'Never. rumo does not hold, move or convert money. It only analyzes and guides, and you decide.',
    'faq.q3': 'How much does it cost?', 'faq.a3': 'Getting started is free. A Pro plan, with the full analysis and questions to the AI, comes later, and people on the waitlist hear about it first.',
    'faq.q4': 'Is it iPhone only?', 'faq.a4': 'The iPhone app comes first, with widgets. On the waitlist you can tell us you use Android, which helps us prioritize.',
    'faq.q5': 'What about investments?', 'faq.a5': 'They come in a later phase. First rumo takes care of your spending, which is where money slips away.',
    'final.h': 'Join the waitlist and meet your CFO.', 'final.p': 'Get your invite as soon as the app opens.',
    'ct.h': 'Talk to us.', 'ct.p': 'A question, an idea, a partnership or press? Write to us and we will reply.', 'ct.lang': 'We reply in Portuguese and English.',
    'ct.name': 'Name', 'ct.email': 'Email', 'ct.msg': 'Message', 'ct.send': 'Send message', 'ct.ok': 'Message sent. We will reply soon.', 'ct.sending': 'Sending...',
    'ft.tag': 'Your personal AI CFO.',
    'ft.legal': 'rumo offers educational information. It is not investment advice or tax consulting. The figures on the screens are sample data.',
    'ft.copy': '© 2026 rumo',
    'done.t': 'You are on the list.', 'done.s1': 'We will email', 'done.s2': 'as soon as the app opens.',
    'done.more': 'Help us prioritize (30 seconds, optional)', 'done.q1': 'Where do you live?', 'done.q2': 'What weighs on you most?', 'done.q3': 'Which phone do you use?',
    'done.save': 'Save answers', 'done.thanks': 'Thank you. This helps us decide what to build first.',
    'done.share': 'Know someone who also wonders where the money went?', 'done.wa': 'Send on WhatsApp', 'done.copy': 'Copy link', 'done.copied': 'Link copied',
    'v.br': 'Brazil', 'v.us': 'United States', 'v.other': 'Somewhere else',
    'k.where': 'Not knowing where my money goes', 'k.subs': 'Forgotten subscriptions', 'k.over': 'Going over budget', 'k.save': 'Saving more', 'k.org': 'Organizing accounts and cards',
    'err.email': 'That email looks incomplete. Check it and try again.',
    'err.net': 'We could not save that right now. That is on us. Please try again in a moment.',
    'err.req': 'Please fill in every field.',
    'wl.sending': 'Joining...',
    'share.text': 'I found an app that works like a personal AI CFO for my spending. Join the waitlist:',
    'meta.title': 'rumo: your personal AI CFO',
    'meta.desc': 'rumo analyzes your spending, sorts it all on its own and shows what matters on your iPhone Home Screen. Join the waitlist.',
  };
  /** Portuguese comes from the HTML itself; these are only the strings that live in JS */
  const PT = {
    'cta.download': 'Baixar para iPhone',
    's1.over': 'Um pouco acima do ritmo',
    'spend.left': 'Sobram {amt} em {days} dias', 'w.left': 'Sobram {amt}',
    'feed.now': 'agora', 'feed.today': 'hoje', 'feed.yday': 'ontem', 'via.pay': 'Apple Pay', 'via.card': 'Cartão',
    'banner.b': 'Categorizado como {cat}.',
    'err.email': 'Esse e-mail parece incompleto. Confira e tente de novo.',
    'err.net': 'Não conseguimos salvar agora. A culpa é nossa. Tente de novo em instantes.',
    'err.req': 'Preencha todos os campos.',
    'wl.sending': 'Entrando…', 'ct.sending': 'Enviando…',
    'ct.ok': 'Mensagem enviada. A gente responde em breve.',
    'done.copied': 'Link copiado',
    'share.text': 'Achei um app que funciona como um CFO pessoal com IA para os meus gastos. Entra na lista:',
    'meta.title': document.title,
    'meta.desc': ($('meta[name="description"]') || {}).content || '',
  };
  const t = (k) => (lang === 'en' && EN[k] != null ? EN[k] : PT[k] != null ? PT[k] : k);

  function capturePT(root) {
    $$('[data-i18n]', root).forEach((el) => { const k = el.dataset.i18n; if (!(k in PT)) PT[k] = el.textContent.trim(); });
    $$('[data-i18n-ph]', root).forEach((el) => { const k = el.dataset.i18nPh; if (!(k in PT)) PT[k] = el.getAttribute('placeholder') || ''; });
    $$('[data-i18n-aria]', root).forEach((el) => { const k = el.dataset.i18nAria; if (!(k in PT)) PT[k] = el.getAttribute('aria-label') || ''; });
  }

  /* ------------------------------------------------------------------ money: the visitor's currency, tabular, odometer roll */
  const nfCache = {};
  function nf(cents) {
    const key = `${lang}|${cents}`;
    return nfCache[key] || (nfCache[key] = new Intl.NumberFormat(LOC[lang], {
      style: 'currency', currency: CUR[lang], minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0,
    }));
  }
  const fmt = (amt, cents = true) => nf(cents).format(amt);

  /** per-character tokens with the brand's money typography: symbol small, cents soft */
  function chars(amt, cents = true) {
    const out = [];
    for (const p of nf(cents).formatToParts(amt)) {
      const cls = p.type === 'currency' ? 'm-cur' : p.type === 'decimal' || p.type === 'fraction' ? 'm-dec' : '';
      for (const ch of p.value) out.push({ ch: ch === ' ' ? ' ' : ch, cls });
    }
    return out;
  }
  function setChars(el, list) {
    clearTimeout(el._rollTimer);
    const frag = document.createDocumentFragment();
    let cur = null;
    for (const c of list) {
      if (!cur || cur.cls !== c.cls) { cur = { cls: c.cls, node: document.createElement('span') }; if (c.cls) cur.node.className = c.cls; frag.appendChild(cur.node); }
      cur.node.textContent += c.ch;
    }
    el.replaceChildren(frag);
    el.removeAttribute('aria-label');
    el._chars = list;
  }
  /** odometer: only the characters that change roll, left to right, 45ms cascade, exponential ease-out, no bounce */
  function rollTo(el, to) {
    const from = el._chars;
    if (!from || reduceMotion.matches || !document.body.contains(el)) { setChars(el, to); return; }
    const fromStr = from.map((c) => c.ch).join('');
    const toStr = to.map((c) => c.ch).join('');
    if (fromStr === toStr) return;
    const n = Math.max(from.length, to.length);
    const f = from.slice().reverse(), g = to.slice().reverse();
    const frag = document.createDocumentFragment();
    const cells = [];
    let j = 0;
    for (let i = n - 1; i >= 0; i--, j++) {
      const a = f[i], b = g[i];
      const cell = document.createElement('span'); cell.className = 'rc'; cell.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span'); inner.className = 'rc__in';
      const same = a && b && a.ch === b.ch && a.cls === b.cls;
      const faces = same ? [b] : [a, b];
      inner.style.setProperty('--d', `${j * 45}ms`);
      for (const c of faces) {
        const w = document.createElement('span'); const s = document.createElement('span');
        s.className = c ? c.cls : ''; s.textContent = c ? c.ch : ''; w.appendChild(s); inner.appendChild(w);
      }
      cell.appendChild(inner); frag.appendChild(cell); if (!same) cells.push(cell);
    }
    el.setAttribute('aria-label', toStr);
    el.replaceChildren(frag);
    requestAnimationFrame(() => requestAnimationFrame(() => cells.forEach((c) => c.classList.add('go'))));
    clearTimeout(el._rollTimer);
    el._rollTimer = setTimeout(() => setChars(el, to), n * 45 + 900);
    el._chars = to;
  }
  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

})();
