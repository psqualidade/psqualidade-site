
    /* =========================
       CONFIGURAÇÃO CENTRAL
       ========================= */
    const CONFIG = {
      email: "caio.skroch@psqualidade.onmicrosoft.com.br",
      whatsapp: "+55 (41) 99713-0771",
      linkedin: "https://www.linkedin.com/in/skrochcaio/",
      formEndpoint: "",
      privacyUrl: "",
      canonicalUrl: "",
      ogImage: "",
      responseSla: "até 1 dia útil",
      analyticsEnabled: true,
      analyticsProvider: "Microsoft Clarity",
      clarityProjectId: "",
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Utilidades */
    const $ = (s, ctx=document) => ctx.querySelector(s);
    const $$ = (s, ctx=document) => [...ctx.querySelectorAll(s)];

    function track(name, data = {}) {
      if (!CONFIG.analyticsEnabled) return;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: name, ...data });
      if (typeof window.clarity === "function") {
        window.clarity("event", name);
      }
    }

    /* Contatos e ano */
    $("#year").textContent = new Date().getFullYear();

    function isConfigured(value) {
      return Boolean(value && String(value).trim());
    }
    if (isConfigured(CONFIG.linkedin)) {
      $("#footerLinkedin").href = CONFIG.linkedin;
      $("#footerLinkedin").target = "_blank";
      $("#footerLinkedin").rel = "noopener";
      $("#footerLinkedin").textContent = "LinkedIn";
    }

    /* Bloqueia links ainda não configurados */
    $$('a[aria-disabled="true"]').forEach(a => a.addEventListener("click", e => e.preventDefault()));

    /* Microsoft Clarity: ativa apenas com ID configurado e consentimento explícito. */
    const cookieBanner = $("#cookieBanner");
    const analyticsConsentKey = "psq_analytics_consent_v2";
    function storageGet(key){ try { return localStorage.getItem(key); } catch(e){ return null; } }
    function storageSet(key,value){ try { localStorage.setItem(key,value); } catch(e){} }
    function loadClarity(){
      if(!CONFIG.analyticsEnabled || CONFIG.analyticsProvider!=="Microsoft Clarity" || !CONFIG.clarityProjectId || window.clarity) return;
      (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",CONFIG.clarityProjectId);
    }
    function initAnalyticsConsent(){
      if(!CONFIG.analyticsEnabled || !CONFIG.clarityProjectId){ cookieBanner?.classList.remove("show"); return; }
      let saved=null; try { saved=JSON.parse(storageGet(analyticsConsentKey)||"null"); } catch(e){}
      if(saved?.choice==="accepted"){ loadClarity(); return; }
      if(saved?.choice==="rejected") return;
      cookieBanner?.classList.add("show");
    }
    $("#acceptAnalytics")?.addEventListener("click",()=>{storageSet(analyticsConsentKey,JSON.stringify({choice:"accepted",at:new Date().toISOString()}));cookieBanner?.classList.remove("show");loadClarity();});
    $("#rejectAnalytics")?.addEventListener("click",()=>{storageSet(analyticsConsentKey,JSON.stringify({choice:"rejected",at:new Date().toISOString()}));cookieBanner?.classList.remove("show");});
    initAnalyticsConsent();

    /* Header compacto, progresso e navegação ativa */
    const header = $("#siteHeader");
    const progress = $("#scroll-progress");
    const desktopLinks = $$("#desktopNav a");
    const observedSections = desktopLinks.map(a => $(a.getAttribute("href"))).filter(Boolean);

    function onScroll() {
      header.classList.toggle("compact", window.scrollY > 24);
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = max > 0 ? `${(scrollY / max) * 100}%` : "0%";
    }
    addEventListener("scroll", onScroll, {passive:true});
    onScroll();

    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if (!visible) return;
      desktopLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${visible.target.id}`));
    }, {rootMargin:"-28% 0px -62% 0px", threshold:[0,.25,.5,.75]});
    observedSections.forEach(s => sectionObserver.observe(s));

    /* Menu mobile acessível */
    const menuBtn=$("#menuBtn"), drawer=$("#mobileDrawer"), overlay=$("#drawerOverlay"); let lastFocused=null;
    const drawerBg=[$("main"),$(".site-footer"),$(".mobile-cta-bar"),$("#cookieBanner")].filter(Boolean);
    function trapFocus(container,e){ if(e.key!=="Tab") return; const items=$$("a,button,input,select,textarea,[tabindex]:not([tabindex='-1'])",container).filter(el=>!el.disabled&&!el.hidden); if(!items.length)return; const first=items[0],last=items.at(-1); if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    function openMenu(){ lastFocused=document.activeElement; menuBtn.setAttribute("aria-expanded","true");drawer.classList.add("open");drawer.removeAttribute("inert");drawer.setAttribute("aria-hidden","false");overlay.classList.add("show");document.body.classList.add("menu-open");drawerBg.forEach(el=>el.setAttribute("inert",""));drawer.querySelector("a")?.focus(); }
    function closeMenu(returnFocus=true){ menuBtn.setAttribute("aria-expanded","false");drawer.classList.remove("open");drawer.setAttribute("inert","");drawer.setAttribute("aria-hidden","true");overlay.classList.remove("show");document.body.classList.remove("menu-open");drawerBg.forEach(el=>el.removeAttribute("inert"));if(returnFocus)lastFocused?.focus(); }
    menuBtn.addEventListener("click",()=>menuBtn.getAttribute("aria-expanded")==="true"?closeMenu():openMenu());overlay.addEventListener("click",()=>closeMenu());drawer.addEventListener("keydown",e=>trapFocus(drawer,e));$$("a",drawer).forEach(a=>a.addEventListener("click",()=>closeMenu(false)));addEventListener("keydown",e=>{if(e.key==="Escape"&&drawer.classList.contains("open"))closeMenu();});

    /* Tabs do mockup - acessíveis, com pausa e sem rotação após interação */
    const mockup=$("#heroMockup"), tabs=$$(".tab-btn",mockup), panels=$$(".tab-panel",mockup), pauseBtn=$("#tabPause");
    let activeTab=0, tabTimer=null, paused=false, manuallyStopped=false, mockupVisible=true;
    const coarse=matchMedia("(pointer: coarse)").matches;
    function setTab(index,focus=false,manual=false){activeTab=(index+tabs.length)%tabs.length;tabs.forEach((t,i)=>{const sel=i===activeTab;t.setAttribute("aria-selected",sel?"true":"false");t.tabIndex=sel?0:-1;panels[i].hidden=!sel;});if(focus)tabs[activeTab].focus();if(!reduceMotion&&activeTab===0)animateCounters(mockup);if(manual){manuallyStopped=true;stopTabs();pauseBtn.textContent="Retomar";pauseBtn.setAttribute("aria-pressed","true");}}
    function stopTabs(){clearInterval(tabTimer);tabTimer=null;}
    function startTabs(){stopTabs();if(reduceMotion||coarse||manuallyStopped||paused||!mockupVisible)return;tabTimer=setInterval(()=>{if(!paused&&mockupVisible)setTab(activeTab+1);},6000);}
    tabs.forEach((t,i)=>{t.addEventListener("click",()=>setTab(i,false,true));t.addEventListener("keydown",e=>{if(["ArrowRight","ArrowLeft","Home","End"].includes(e.key)){e.preventDefault();const next=e.key==="ArrowRight"?i+1:e.key==="ArrowLeft"?i-1:e.key==="Home"?0:tabs.length-1;setTab(next,true,true);}});});
    pauseBtn?.addEventListener("click",()=>{if(manuallyStopped){manuallyStopped=false;paused=false;pauseBtn.textContent="Pausar";pauseBtn.setAttribute("aria-pressed","false");startTabs();}else{manuallyStopped=true;stopTabs();pauseBtn.textContent="Retomar";pauseBtn.setAttribute("aria-pressed","true");}});
    ["mouseenter","focusin"].forEach(evt=>mockup.addEventListener(evt,()=>{paused=true;stopTabs();}));["mouseleave","focusout"].forEach(evt=>mockup.addEventListener(evt,()=>{paused=false;startTabs();}));
    new IntersectionObserver(([e])=>{mockupVisible=e.isIntersecting;if(mockupVisible)startTabs();else stopTabs();},{threshold:.2}).observe(mockup);startTabs();

    /* Parallax leve */
    if (!reduceMotion) {
      mockup.addEventListener("pointermove", e => {
        const r = mockup.getBoundingClientRect();
        const x = (e.clientX-r.left)/r.width-.5;
        const y = (e.clientY-r.top)/r.height-.5;
        $$("[data-parallax]",mockup).forEach(el => {
          const dir = Number(el.dataset.parallax||1);
          el.style.transform = `translate(${x*6*dir}px, ${y*5*dir}px)`;
        });
      });
      mockup.addEventListener("pointerleave",() => $$("[data-parallax]",mockup).forEach(el=>el.style.transform=""));
    }

    /* Reveal e timeline */
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        entry.target.addEventListener("transitionend",()=>entry.target.classList.add("settled"),{once:true});
        revealObserver.unobserve(entry.target);
      });
    }, {threshold:.12, rootMargin:"0px 0px -40px 0px"});
    if (reduceMotion) $$("[data-reveal]").forEach(el=>el.classList.add("revealed"));
    else $$("[data-reveal]").forEach(el=>revealObserver.observe(el));

    const timeline = $("#timeline");
    const timelineObserver = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { timeline.classList.add("revealed"); timelineObserver.disconnect(); }
    }, {threshold:.25});
    timelineObserver.observe(timeline);

    /* Contadores apenas em dados ilustrativos do mockup */
    function animateCounters(root=document) {
      if (reduceMotion) {
        $$("[data-counter]",root).forEach(el => {
          const n=Number(el.dataset.counter), d=Number(el.dataset.decimals||0), s=el.dataset.suffix||"";
          el.textContent=n.toFixed(d).replace(".",",")+s;
        });
        return;
      }
      $$("[data-counter]",root).forEach(el => {
        if (el.dataset.animating==="1") return;
        el.dataset.animating="1";
        const target=Number(el.dataset.counter), decimals=Number(el.dataset.decimals||0), suffix=el.dataset.suffix||"";
        const start=performance.now(), duration=900;
        function frame(now) {
          const p=Math.min(1,(now-start)/duration);
          const eased=1-Math.pow(1-p,3);
          el.textContent=(target*eased).toFixed(decimals).replace(".",",")+suffix;
          if (p<1) requestAnimationFrame(frame); else el.dataset.animating="0";
        }
        requestAnimationFrame(frame);
      });
    }
    const counterObserver = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { animateCounters(mockup); counterObserver.disconnect(); }
    }, {threshold:.35});
    counterObserver.observe(mockup);

    /* Benchmarks de mercado são exibidos de forma transparente e com fonte. */

    /* Tilt sutil nos exemplos */
    if (!reduceMotion) {
      $$(".example-card").forEach(card => {
        card.addEventListener("pointermove", e => {
          const r=card.getBoundingClientRect();
          const rx=((e.clientY-r.top)/r.height-.5)*-4;
          const ry=((e.clientX-r.left)/r.width-.5)*5;
          card.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
        });
        card.addEventListener("pointerleave",()=>card.style.transform="");
      });
    }

    /* Lightbox acessível, com navegação e zoom */
    const lightbox=$("#lightbox"),stage=$("#lightboxStage"),lightboxTitle=$("#lightboxTitle"),closeLightboxBtn=$("#lightboxClose"),prevBtn=$("#lightboxPrev"),nextBtn=$("#lightboxNext");
    const galleryItems=$$(".example-card,.case-image-button"); let lightboxOrigin=null,currentIndex=0,touchStartX=0;
    const bgForLightbox=[$("main"),$(".site-header"),$(".site-footer"),$(".mobile-cta-bar"),$("#cookieBanner")].filter(Boolean);
    function renderLightbox(item){const full=item.dataset.full;stage.classList.remove("zoomed");stage.innerHTML=`<img src="${full}" alt="${item.getAttribute("aria-label")||item.dataset.title||"Exemplo ampliado"}" decoding="async">`;lightboxTitle.textContent=item.dataset.title||"Exemplo";}
    function openLightbox(item){lightboxOrigin=item;currentIndex=Math.max(0,galleryItems.indexOf(item));renderLightbox(item);lightbox.classList.add("open");document.body.classList.add("lightbox-lock");bgForLightbox.forEach(el=>el.setAttribute("inert",""));closeLightboxBtn.focus();}
    function closeLightbox(){lightbox.classList.remove("open");stage.innerHTML="";document.body.classList.remove("lightbox-lock");bgForLightbox.forEach(el=>el.removeAttribute("inert"));lightboxOrigin?.focus();}
    function moveLightbox(delta){currentIndex=(currentIndex+delta+galleryItems.length)%galleryItems.length;renderLightbox(galleryItems[currentIndex]);}
    galleryItems.forEach(item=>item.addEventListener("click",()=>openLightbox(item)));closeLightboxBtn.addEventListener("click",closeLightbox);prevBtn.addEventListener("click",()=>moveLightbox(-1));nextBtn.addEventListener("click",()=>moveLightbox(1));stage.addEventListener("click",()=>stage.classList.toggle("zoomed"));stage.addEventListener("touchstart",e=>touchStartX=e.changedTouches[0].clientX,{passive:true});stage.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-touchStartX;if(Math.abs(dx)>50)moveLightbox(dx<0?1:-1);},{passive:true});lightbox.addEventListener("click",e=>{if(e.target===lightbox)closeLightbox();});addEventListener("keydown",e=>{if(!lightbox.classList.contains("open"))return;if(e.key==="Escape")closeLightbox();if(e.key==="ArrowLeft")moveLightbox(-1);if(e.key==="ArrowRight")moveLightbox(1);if(e.key==="Tab"){const items=[closeLightboxBtn,prevBtn,stage,nextBtn].filter(Boolean);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});

    /* Formulário */
    const form=$("#leadForm"),submitBtn=$("#submitBtn"),formStatus=$("#formStatus"),formSuccess=$("#formSuccess"),formFallback=$("#formFallback");
    const formStartedAt=Date.now();
    if(CONFIG.formEndpoint){form.hidden=false;formFallback.hidden=true;}else{form.hidden=true;formFallback.hidden=false;}
    const rules={name:v=>v.trim().length>=2?"":"Informe seu nome.",email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?"":"Informe um e-mail válido.",company:v=>v.trim().length>=2?"":"Informe a empresa.",interest:v=>v?"":"Selecione um interesse."};
    function validateField(input){const field=input.closest(".field");if(!field)return true;const msg=rules[input.name]?rules[input.name](input.value):"";field.classList.toggle("invalid",!!msg);const err=field.querySelector(".error-text");if(err)err.textContent=msg;input.setAttribute("aria-invalid",msg?"true":"false");return !msg;}
    ["name","email","company","interest"].forEach(id=>{const input=$("#"+id);input?.addEventListener("blur",()=>validateField(input));input?.addEventListener("input",()=>{if(input.getAttribute("aria-invalid")==="true")validateField(input);});});
    form?.addEventListener("submit",async e=>{e.preventDefault();formStatus.className="form-status";formStatus.textContent="";if(Date.now()-formStartedAt<3000){formStatus.classList.add("fail");formStatus.textContent="Aguarde alguns segundos e tente novamente.";return;}const valid=["name","email","company","interest"].map(id=>validateField($("#"+id))).every(Boolean);if(!$("#consent").checked){formStatus.classList.add("fail");formStatus.textContent="Confirme o consentimento LGPD para continuar.";$("#consent").focus();return;}if(!valid){formStatus.classList.add("fail");formStatus.textContent="Revise os campos destacados.";form.querySelector('[aria-invalid="true"]')?.focus();return;}if($("#website").value)return;if(!CONFIG.formEndpoint){formStatus.classList.add("fail");formStatus.textContent=`Não foi possível enviar agora. Escreva para ${CONFIG.email} ou chame no WhatsApp.`;return;}const data=Object.fromEntries(new FormData(form).entries());delete data.website;submitBtn.disabled=true;submitBtn.setAttribute("aria-busy","true");formStatus.textContent="Enviando…";try{const res=await fetch(CONFIG.formEndpoint,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(data)});if(!res.ok)throw new Error(`HTTP ${res.status}`);form.reset();form.hidden=true;formSuccess.hidden=false;formSuccess.focus();track("form_submit",{interest:data.interest});}catch(err){formStatus.className="form-status fail";formStatus.textContent=`Não foi possível enviar agora. Escreva para ${CONFIG.email} ou chame no WhatsApp.`;}finally{submitBtn.disabled=false;submitBtn.removeAttribute("aria-busy");}});

    /* Conversões */
    $$(".track-cta").forEach(el=>el.addEventListener("click",()=>track("cta_click",{label:el.textContent.trim()})));
    $$(".track-whatsapp").forEach(el=>el.addEventListener("click",()=>track("whatsapp_click")));

    /* Política de privacidade em modal acessível */
    const privacyDialog=$("#privacyDialog");
    $$('[data-open-privacy]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();privacyDialog?.showModal();$("#privacyClose")?.focus();}));
    $("#privacyClose")?.addEventListener("click",()=>privacyDialog?.close());privacyDialog?.addEventListener("click",e=>{if(e.target===privacyDialog)privacyDialog.close();});

    /* CTA mobile não cobre contato, menu, lightbox ou consentimento */
    const mobileCta=$(".mobile-cta-bar");
    if(mobileCta&&$("#contato")){new IntersectionObserver(([e])=>mobileCta.classList.toggle("is-hidden",e.isIntersecting),{threshold:.08}).observe($("#contato"));}
    const uiObserver=new MutationObserver(()=>{if(!mobileCta)return;const obstructed=drawer?.classList.contains("open")||lightbox?.classList.contains("open")||cookieBanner?.classList.contains("show");mobileCta.classList.toggle("is-hidden",obstructed||mobileCta.classList.contains("is-hidden")&&$("#contato").getBoundingClientRect().top<innerHeight);});[drawer,lightbox,cookieBanner].filter(Boolean).forEach(el=>uiObserver.observe(el,{attributes:true,attributeFilter:["class"]}));

