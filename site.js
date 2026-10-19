/* АНГЕЛ-МЕД: интерактив сайта. Ванильный JS, переносится в блок T123 Тильды. */
(function () {
  "use strict";
  var D = document, AM = window.AM;
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var el = function (t, c, txt) { var n = D.createElement(t); if (c) n.className = c; if (txt) n.textContent = txt; return n; };
  var plural = function (n, a, b, c) { var m = n % 100, d = n % 10; return m > 10 && m < 15 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };

  /* ---------- список запроса (сессия браузера, без цен и корзины) ---------- */
  var Req = {
    key: "am-req",
    get: function () { try { var v = JSON.parse(sessionStorage.getItem(this.key) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } },
    set: function (a) { try { sessionStorage.setItem(this.key, JSON.stringify(a)); } catch (e) {} }
  };

  /* ---------- заголовок: слова проявляются из размытия ---------- */
  $$(".blur-words").forEach(function (h) {
    var words = h.textContent.replace(/\s+/g, " ").trim().split(" ");
    h.setAttribute("aria-label", words.join(" "));
    h.textContent = "";
    words.forEach(function (w, i) {
      var s = D.createElement("span"); s.className = "w"; s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--i", i); s.textContent = w; h.appendChild(s);
      if (i < words.length - 1) h.appendChild(D.createTextNode(" "));
    });
  });

  /* ---------- форма заявки ---------- */
  function fillRequest(form) {
    var list = Req.get(), box = $(".form__req", form), ta = $("textarea", form);
    if (box) {
      box.classList.toggle("has", list.length > 0);
      box.textContent = list.length ? "Из перечня в запрос добавлено позиций: " + list.length + "." : "";
    }
    if (ta && !ta.dataset.dirty) ta.value = list.length ? list.map(function (n) { return "- " + n; }).join("\n") : "";
  }
  $$(".form").forEach(function (form) {
    var ta = $("textarea", form);
    if (ta) ta.addEventListener("input", function () { ta.dataset.dirty = "1"; });
    fillRequest(form);
    var MSG = { org: "Укажите организацию", name: "Укажите контактное лицо", contact: "Оставьте телефон или почту, чтобы мы ответили", consent: "Нужно согласие на обработку персональных данных" };
    var uid = 0;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      $$("[required]", form).forEach(function (f) {
        var bad = f.type === "checkbox" ? !f.checked : !f.value.trim();
        var wrap = f.closest(".field") || f.closest(".consent"), er = $(".field__err", wrap);
        if (bad) {
          if (!er) { er = el("p", "field__err"); er.id = "err-" + (++uid) + "-" + (f.name || "consent"); wrap.appendChild(er); }
          er.textContent = MSG[f.name || "consent"];
          f.setAttribute("aria-invalid", "true"); f.setAttribute("aria-describedby", er.id);
          if (!first) first = f;
        } else { if (er) er.remove(); f.removeAttribute("aria-invalid"); f.removeAttribute("aria-describedby"); }
      });
      if (first) { first.focus(); return; }
      form.classList.add("sent");
      var ok = $(".form__ok", form); if (ok) ok.focus();
    });
    $$("[required]", form).forEach(function (f) {
      f.addEventListener(f.type === "checkbox" ? "change" : "input", function () {
        if (f.getAttribute("aria-invalid") !== "true") return;
        var ok = f.type === "checkbox" ? f.checked : f.value.trim();
        if (ok) { var er = $(".field__err", f.closest(".field") || f.closest(".consent")); if (er) er.remove(); f.removeAttribute("aria-invalid"); f.removeAttribute("aria-describedby"); }
      });
    });
  });
  window.addEventListener("am-req", function () { $$(".form").forEach(fillRequest); });

  /* ---------- главная: режим закупки и живой пример ---------- */
  var mode = $("[data-mode-root]");
  if (mode && AM) {
    var picks = [
      { l: "Монитор пациента", f: "Монитор пациента" },
      { l: "УЗИ", f: "ультразвуковой" },
      { l: "Рентген", f: "Рентген" },
      { l: "ЛОР-кабинет", f: "ЛОР" },
      { l: "Операционные столы", f: "Операционные столы" }
    ];
    var items = [];
    AM.sections.forEach(function (s) { s.items.forEach(function (it) { items.push(it); }); });
    var find = function (f) { return items.filter(function (it) { return it.n.indexOf(f) > -1; })[0]; };
    var cur = { m: "44", p: 0 };
    var list = $("[data-demo-list]", mode), pickBox = $("[data-demo-pick]", mode), cap = $("[data-demo-cap]", mode), link = $("[data-demo-link]", mode);
    var render = function () {
      var it = find(picks[cur.p].f), n = 0;
      list.textContent = "";
      it.mk.forEach(function (m) {
        var ok;
        if (cur.m === "44") ok = m[3] === "b" || m[3] === "4" || m[3] === "?"; else ok = m[3] === "b" || m[3] === "3" || m[3] === "?";
        if (!ok) return;
        var row = D.createElement("div"); row.className = "demo__row"; row.style.setProperty("--i", n++);
        var b = D.createElement("b"); b.textContent = m[0];
        var s = D.createElement("span"); s.textContent = m[3] === "?" ? m[1] + ", режим уточняется" : m[1];
        row.appendChild(b); row.appendChild(s); list.appendChild(row);
      });
      cap.textContent = cur.m === "44"
        ? "Производители позиции «" + it.n + "» под 44-ФЗ (по перечню заказчика)."
        : "Производители позиции «" + it.n + "» под 223-ФЗ (по перечню заказчика).";
      link.setAttribute("href", "katalog.html?mode=" + cur.m);
      $$("[data-mode-text]", mode).forEach(function (t) { t.hidden = t.getAttribute("data-mode-text") !== cur.m; });
      $$("[data-mode-btn]", mode).forEach(function (bt) { bt.setAttribute("aria-selected", String(bt.getAttribute("data-mode-btn") === cur.m)); });
      $$("button", pickBox).forEach(function (bt, i) { bt.setAttribute("aria-pressed", String(i === cur.p)); });
    };
    picks.forEach(function (p, i) {
      var bt = D.createElement("button"); bt.type = "button"; bt.textContent = p.l;
      bt.addEventListener("click", function () { cur.p = i; render(); });
      pickBox.appendChild(bt);
    });
    $$("[data-mode-btn]", mode).forEach(function (bt) {
      bt.addEventListener("click", function () { cur.m = bt.getAttribute("data-mode-btn"); render(); });
    });
    render();
  }

  /* ---------- таймлайн закупки ---------- */
  var steps = $$(".step");
  if (steps.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("on"); } });
    }, { rootMargin: "0px 0px -38% 0px" });
    steps.forEach(function (s) { io.observe(s); });
  } else { steps.forEach(function (s) { s.classList.add("on"); }); }

  /* ---------- перечень оборудования ---------- */
  var idx = $("[data-idx]");
  if (idx && AM) {
    var state = { mode: "all", groups: {}, req: Req.get() };
    var NOTES = {
      all: "Показаны все производители позиции. Выберите режим закупки, и список сузится до тех, кто под него подходит.",
      "44": "44-ФЗ: учитываем ограничения и запреты ПП № 1875 и позиции КТРУ. Где действуют запреты, предлагаем российских производителей из реестра российской промышленной продукции (РРПП).",
      "223": "223-ФЗ, национальный режим: подбираем из полного списка мировых брендов."
    };
    var rows = [];
    var svgPlus = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 2v12M2 8h12"/></svg>';

    AM.sections.forEach(function (s) {
      var row = el("article", "irow"); row.id = "sec-" + s.id; row.style.setProperty("--tint", s.tint);
      var head = el("button", "irow__head"); head.type = "button"; head.setAttribute("aria-expanded", "false"); head.setAttribute("aria-controls", "body-" + s.id);
      var th = el("span", "irow__thumb"); var ti = D.createElement("img"); ti.src = "assets/" + s.img + ".webp"; ti.alt = ""; ti.loading = "lazy"; th.appendChild(ti); head.appendChild(th);
      var tt = el("span", "irow__title"); tt.appendChild(el("b", "", s.t)); var sub = el("span", "", s.lede); tt.appendChild(sub); head.appendChild(tt);
      var cnt = el("span", "irow__cnt", s.items.length + " " + plural(s.items.length, "позиция", "позиции", "позиций")); head.appendChild(cnt);
      var pl = el("span", "irow__plus"); pl.innerHTML = svgPlus; pl.setAttribute("aria-hidden", "true"); head.appendChild(pl);
      row.appendChild(head);

      var body = el("div", "irow__body"); body.id = "body-" + s.id;
      var inner = el("div", "irow__inner"); inner.setAttribute("inert", "");
      var grid = el("div", "irow__grid");
      var pic = el("figure", "irow__pic"); var pi = D.createElement("img"); pi.src = "assets/" + s.img + ".webp"; pi.alt = s.t + ": оборудование"; pi.loading = "lazy"; pic.appendChild(pi); grid.appendChild(pic);
      var list = el("div", "poslist");
      var posEls = [];
      s.items.forEach(function (it) {
        var pos = el("div", "pos");
        var top = el("div", "pos__top"); top.appendChild(el("h3", "", it.n));
        var add = el("button", "add"); add.type = "button"; add.setAttribute("aria-pressed", "false");
        add.innerHTML = svgPlus + '<span>В запрос</span>';
        top.appendChild(add); pos.appendChild(top);
        var ul = el("ul", "mk"); var mks = [];
        it.mk.forEach(function (m) {
          var li = el("li", m[3] === "?" ? "q" : ""); li.appendChild(el("b", "", m[0])); li.appendChild(el("i", "", m[1]));
          li.title = m[3] === "?" ? "Режим закупки по этому производителю уточняется" : "";
          ul.appendChild(li); mks.push({ el: li, m: m });
        });
        if (it.note) ul.appendChild(el("li", "mk__note", it.note));
        pos.appendChild(ul);
        add.addEventListener("click", function () {
          var i = state.req.indexOf(it.n);
          if (i > -1) state.req.splice(i, 1); else state.req.push(it.n);
          Req.set(state.req); sync(); window.dispatchEvent(new Event("am-req"));
        });
        list.appendChild(pos); posEls.push({ el: pos, mks: mks, it: it, add: add });
      });
      grid.appendChild(list); inner.appendChild(grid); body.appendChild(inner); row.appendChild(body);
      idx.appendChild(row);
      head.addEventListener("click", function () { toggle(row, !row.classList.contains("open")); });
      rows.push({ el: row, s: s, pos: posEls, inner: inner, head: head, cnt: cnt });
    });

    function toggle(row, open) {
      row.classList.toggle("open", open);
      $(".irow__head", row).setAttribute("aria-expanded", String(open));
      var inn = $(".irow__inner", row); if (open) inn.removeAttribute("inert"); else inn.setAttribute("inert", "");
    }
    function modeOk(m) { return state.mode === "all" ? true : state.mode === "44" ? (m === "b" || m === "4" || m === "?") : (m === "b" || m === "3" || m === "?"); }
    function groupOk(g) {
      var keys = Object.keys(state.groups).filter(function (k) { return state.groups[k]; });
      if (!keys.length) return true;
      return keys.some(function (k) { return g.indexOf(k) > -1; });
    }
    var total = 0; rows.forEach(function (r) { total += r.pos.length; });
    function apply() {
      var shown = 0, secs = 0;
      rows.forEach(function (r) {
        var any = 0;
        r.pos.forEach(function (p) {
          var vis = 0;
          p.mks.forEach(function (k) { var ok = modeOk(k.m[3]) && groupOk(k.m[2]); k.el.hidden = !ok; if (ok) vis++; });
          var note = $(".mk__note", p.el); if (note) note.hidden = vis === 0;
          p.el.hidden = vis === 0; if (vis) any++;
        });
        r.el.hidden = any === 0; if (any) { secs++; shown += any; }
        r.cnt.textContent = any !== r.pos.length ? any + " из " + r.pos.length : r.pos.length + " " + plural(r.pos.length, "позиция", "позиции", "позиций");
      });
      $("[data-count]").textContent = "Позиций: " + shown + " из " + total;
      $("[data-note]").textContent = NOTES[state.mode];
      $$("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === state.mode)); });
      $(".empty").classList.toggle("on", shown === 0);
      $("[data-legend-q]").hidden = state.mode === "all";
    }
    function sync() {
      rows.forEach(function (r) { r.pos.forEach(function (p) {
        var on = state.req.indexOf(p.it.n) > -1; p.add.setAttribute("aria-pressed", String(on));
        $("span", p.add).textContent = on ? "В запросе" : "В запрос";
      }); });
      var bar = $(".reqbar"); $("[data-req-n]", bar).textContent = state.req.length; bar.classList.toggle("on", state.req.length > 0);
    }
    $$("[data-mode]").forEach(function (b) { b.addEventListener("click", function () { state.mode = b.getAttribute("data-mode"); apply(); }); });
    var chips = $("[data-groups]");
    Object.keys(AM.groups).forEach(function (k) {
      var c = el("button", "chip", AM.groups[k]); c.type = "button"; c.setAttribute("aria-pressed", "false");
      c.addEventListener("click", function () { state.groups[k] = !state.groups[k]; c.setAttribute("aria-pressed", String(!!state.groups[k])); apply(); });
      chips.appendChild(c);
    });
    $("[data-reset]").addEventListener("click", function () {
      state.mode = "all"; state.groups = {}; $$("button", chips).forEach(function (c) { c.setAttribute("aria-pressed", "false"); }); apply();
    });

    var q = /[?&]mode=(44|223)/.exec(location.search); if (q) state.mode = q[1];
    apply(); sync();
    var h = /^#sec-(\d\d)$/.exec(location.hash);
    var target = h ? rows.filter(function (r) { return r.s.id === h[1]; })[0] : rows[0];
    if (target) { toggle(target.el, true); if (h) setTimeout(function () { target.el.scrollIntoView({ block: "start" }); }, 60); }
    window.addEventListener("hashchange", function () {
      var m = /^#sec-(\d\d)$/.exec(location.hash); if (!m) return;
      var r = rows.filter(function (x) { return x.s.id === m[1]; })[0]; if (r) { toggle(r.el, true); r.el.scrollIntoView({ block: "start" }); }
    });
  }

  /* ---------- производители по странам (из тех же данных, что и перечень) ---------- */
  var byg = $("[data-byg]");
  if (byg && AM) {
    Object.keys(AM.groups).forEach(function (g) {
      var names = [];
      AM.sections.forEach(function (sec) { sec.items.forEach(function (it) { it.mk.forEach(function (m) { if (m[2].indexOf(g) > -1 && names.indexOf(m[0]) < 0) names.push(m[0]); }); }); });
      var row = el("div"); row.appendChild(el("dt", "", AM.groups[g])); row.appendChild(el("dd", "", names.join(", "))); byg.appendChild(row);
    });
  }
})();
