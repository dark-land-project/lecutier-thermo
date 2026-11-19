(() => {
  'use strict';
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
  const header = $('#header');
  const menu = $('#navigation');
  const toggle = $('#menu-toggle');
  const dropdown = $('.nav-dropdown');
  const dropdownBtn = $('#nav-dropdown-button');
  const progress = $('.page-progress');
  const backtop = $('#backtop');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const closeMenu = () => {
    if (!menu) return;
    menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    toggle?.setAttribute('aria-expanded','false');
    toggle?.setAttribute('aria-label','Ouvrir le menu');
    dropdown?.classList.remove('is-open');
    dropdownBtn?.setAttribute('aria-expanded','false');
  };
  toggle?.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  dropdownBtn?.addEventListener('click', () => {
    const open = !dropdown.classList.contains('is-open');
    dropdown.classList.toggle('is-open',open);
    dropdownBtn.setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('keydown',e => { if (e.key === 'Escape') closeMenu(); });
  $$('.navigation a').forEach(a => a.addEventListener('click',closeMenu));
  document.addEventListener('click',e => {
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.classList.remove('is-open');
      dropdownBtn?.setAttribute('aria-expanded','false');
    }
  });
  let ticking=false;
  const updateProgress=()=>{
    const h=document.documentElement;
    const max=Math.max(1,h.scrollHeight-innerHeight);
    if(progress) progress.style.width=`${Math.min(100,scrollY/max*100)}%`;
    backtop?.classList.toggle('is-visible',scrollY>650);
    ticking=false;
  };
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateProgress)}},{passive:true});
  addEventListener('resize', updateProgress,{passive:true});
  updateProgress();
  backtop?.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduceMotion?'instant':'smooth'}));
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){entry.target.classList.add('is-shown');revealObserver.unobserve(entry.target)}
      });
    },{threshold:.09,rootMargin:'0px 0px -25px 0px'});
    $$('.reveal').forEach((el,i)=> {el.style.transitionDelay=`${Math.min((i % 4)*60,180)}ms`;revealObserver.observe(el)});
  } else $$('.reveal').forEach(el=>el.classList.add('is-shown'));
  // Keep the art-directed colour fallback visible if remote stock photography fails.
  $$('img.photo').forEach(img => {
    const hide=()=>img.classList.add('img-unavailable');
    img.addEventListener('error',hide,{once:true});
    if(img.complete && img.naturalWidth===0) hide();
  });
  // An actual interactive palette-control, deliberately not a connected thermostat.
  const range = $('#temp-range');
  if(range){
    const display=$('#temp-value');
    const label=$('#temp-label');
    const photo=$('.hero-photo');
    const labels={17:'Fraîcheur',18:'Légèreté',19:'Douceur',20:'Bien-être',21:'Équilibre',22:'Cocooning',23:'Chaleur',24:'Douce chaleur',25:'Très chaleureux'};
    const updateTemp=()=>{
      const n=Number(range.value);
      display.textContent=String(n);
      label.textContent=labels[n]||'Confort';
      const t=(n-17)/8;
      document.documentElement.style.setProperty('--heat-ratio',String(t));
      if(photo) photo.style.background=`linear-gradient(${145+t*40}deg,${t>.5?'#403036':'#243e53'} 0%,${t>.5?'#a3614a':'#547d80'} 60%,${t>.5?'#f9ad7b':'#b0dbdd'} 100%)`;
    };
    range.addEventListener('input',updateTemp);updateTemp();
  }
  // Gallery: accessible filter and keyboard-operable lightbox.
  const cells=$$('.gallery-cell');
  const lightbox=$('#lightbox');
  if(cells.length && lightbox){
    let activeIndex=0;
    let trigger=null;
    const img=$('#lightbox-image'), caption=$('#lightbox-caption');
    const visibleCells=()=>cells.filter(el=>!el.hidden);
    const renderImage=()=>{
      const selected=visibleCells();
      if(!selected.length) return;
      activeIndex=(activeIndex+selected.length)%selected.length;
      const el=selected[activeIndex];
      img.src=el.dataset.image;
      img.alt=el.dataset.caption||'Photographie d’illustration';
      caption.textContent=el.dataset.caption||'';
    };
    const openLightbox=el=>{
      trigger=el;
      activeIndex=visibleCells().indexOf(el);
      renderImage();
      lightbox.hidden=false;
      document.body.style.overflow='hidden';
      $('.lightbox-close',lightbox)?.focus();
    };
    const closeLightbox=()=>{
      lightbox.hidden=true;
      document.body.style.overflow='';
      img.removeAttribute('src');
      trigger?.focus();
    };
    cells.forEach(el=>el.addEventListener('click',()=>openLightbox(el)));
    $$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
      const target=btn.dataset.filter;
      cells.forEach(el=>el.hidden=target!=='all' && el.dataset.category!==target);
      $$('.filter-btn').forEach(other=>{const selected=other===btn;other.classList.toggle('active',selected);other.setAttribute('aria-pressed',String(selected))});
    }));
    $('.lightbox-close',lightbox)?.addEventListener('click',closeLightbox);
    $('.lightbox-next',lightbox)?.addEventListener('click',()=>{activeIndex++;renderImage()});
    $('.lightbox-prev',lightbox)?.addEventListener('click',()=>{activeIndex--;renderImage()});
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox()});
    document.addEventListener('keydown',e=>{
      if(lightbox.hidden)return;
      if(e.key==='Escape')closeLightbox();
      if(e.key==='ArrowRight'){activeIndex++;renderImage()}
      if(e.key==='ArrowLeft'){activeIndex--;renderImage()}
      if(e.key==='Tab'){
        const controls=$$('button',lightbox);
        if(e.shiftKey && document.activeElement===controls[0]){e.preventDefault();controls[controls.length-1].focus()}
        if(!e.shiftKey && document.activeElement===controls[controls.length-1]){e.preventDefault();controls[0].focus()}
      }
    });
  }
  // Functional no-backend mailto; does not claim to send or store user information.
  const form=$('#contact-form');
  form?.addEventListener('submit',e=>{
    e.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const subject=`Demande Lecutier — ${data.get('service')}`;
    const lines=[`Nom : ${data.get('name')}`,`E-mail : ${data.get('email')}`,`Téléphone : ${data.get('phone')||'Non renseigné'}`,`Domaine : ${data.get('service')}`,'',String(data.get('message'))];
    const target=`mailto:contact@lecutier.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    const notice=$('#form-notice');
    if(notice)notice.textContent='Votre messagerie va s’ouvrir avec la demande préparée. Vérifiez-la puis cliquez sur Envoyer dans votre application.';
    window.location.href=target;
  });
})();
