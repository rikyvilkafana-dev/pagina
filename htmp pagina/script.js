
// mobile menu
const menuToggle = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
if(menuToggle && mobileNav){
  menuToggle.addEventListener('click', ()=>{
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    mobileNav.hidden = expanded;
  });
}

// active nav link
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(a=>{
  const href = a.getAttribute('href');
  if(href === currentPage){ a.classList.add('active'); }
});

// Lightweight motion: do not animate on slow / reduced-motion systems.
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData=Boolean(navigator.connection && navigator.connection.saveData);
const motionEnabled=!reducedMotion&&!saveData;
if(motionEnabled && 'IntersectionObserver' in window){
  document.documentElement.classList.add('has-js');
  const observer=new IntersectionObserver((entries,observer)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
    });
  },{threshold:0.06,rootMargin:'0px 0px 65px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}

// Efficient banner: one timer, disabled in background, pauses on hover or keyboard focus.
const slides=[...document.querySelectorAll('.hero-slide')];
const slider=document.getElementById('hero-slider');
const dotsWrap=document.querySelector('.hero-dots');
let current=0,auto=null,hovering=false,hasFocus=false,visible=true;
if(slider&&slides.length&&dotsWrap){
  slides.forEach((_,i)=>{
    const dot=document.createElement('button');
    dot.setAttribute('type','button');dot.setAttribute('aria-label',`Ir a diapositiva ${i+1}`);
    dot.addEventListener('click',()=>{showSlide(i);restart();});
    dotsWrap.appendChild(dot);
  });
  const dots=[...dotsWrap.children];
  function showSlide(i){
    current=(i+slides.length)%slides.length;
    slides.forEach((s,j)=>{
      const active=j===current;
      s.classList.toggle('active',active);
      s.setAttribute('aria-hidden',String(!active));
      s.querySelectorAll('a').forEach(a=>a.tabIndex=active?0:-1);
    });
    dots.forEach((d,j)=>{d.classList.toggle('active',j===current);d.setAttribute('aria-current',j===current?'true':'false');});
  }
  function stop(){if(auto!==null){clearInterval(auto);auto=null;}}
  function shouldRun(){return motionEnabled&&!hovering&&!hasFocus&&!document.hidden&&visible;}
  function start(){stop();if(shouldRun())auto=setInterval(()=>showSlide(current+1),8500);}
  function restart(){start();}
  slider.querySelector('.hero-arrow.next')?.addEventListener('click',()=>{showSlide(current+1);restart();});
  slider.querySelector('.hero-arrow.prev')?.addEventListener('click',()=>{showSlide(current-1);restart();});
  slider.addEventListener('mouseenter',()=>{hovering=true;stop()});
  slider.addEventListener('mouseleave',()=>{hovering=false;start()});
  slider.addEventListener('focusin',()=>{hasFocus=true;stop()});
  slider.addEventListener('focusout',(event)=>{if(!slider.contains(event.relatedTarget)){hasFocus=false;start()}});
  document.addEventListener('visibilitychange',start);
  if('IntersectionObserver'in window){
    const visibilityObserver=new IntersectionObserver(entries=>{
      visible=entries[0]?.isIntersecting??true;start();
    },{threshold:0.06});
    visibilityObserver.observe(slider);
  }
  let touchX=null;
  slider.addEventListener('touchstart',e=>{touchX=e.changedTouches[0]?.screenX??null;},{passive:true});
  slider.addEventListener('touchend',e=>{if(touchX===null)return;const delta=(e.changedTouches[0]?.screenX??touchX)-touchX;if(Math.abs(delta)>60){showSlide(current+(delta<0?1:-1));restart();}touchX=null;},{passive:true});
  showSlide(0);start();
}

// products filter
const grid = document.getElementById('productsGrid');
if(grid){
  const items = [...grid.querySelectorAll('.product-item')];
  const filterButtons = [...document.querySelectorAll('.filter-btn')];
  const searchInput = document.getElementById('searchProducts');
  const sortSelect = document.getElementById('sortProducts');
  const resultsText = document.getElementById('resultsText');
  let filter = 'all';
  function normalize(v=''){ return v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function render(){
    let visible = items.filter(item=>{
      const matchFilter = filter === 'all' || item.dataset.category === filter;
      const term = normalize(searchInput?.value || '');
      const matchSearch = !term || normalize(item.dataset.name).includes(term) || normalize(item.textContent).includes(term);
      const show = matchFilter && matchSearch;
      item.style.display = show ? '' : 'none';
      return show;
    });
    const sorted = [...visible];
    if(sortSelect?.value === 'az') sorted.sort((a,b)=>a.dataset.name.localeCompare(b.dataset.name,'es',{sensitivity:'base'}));
    if(sortSelect?.value === 'za') sorted.sort((a,b)=>b.dataset.name.localeCompare(a.dataset.name,'es',{sensitivity:'base'}));
    sorted.forEach(card=>grid.appendChild(card));
    if(resultsText) resultsText.textContent = `Mostrando ${visible.length} producto${visible.length===1?'':'s'}`;
  }
  filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
    filterButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
  }));
  searchInput?.addEventListener('input', render);
  sortSelect?.addEventListener('change', render);
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  if(cat){
    const match = filterButtons.find(btn=>btn.dataset.filter===cat);
    if(match){ match.click(); }
    else render();
  } else render();
}


// Consulta: sin servidor ni número oficial no se simula un envío.
const contactForm=document.getElementById('form-consulta');
if(contactForm){
  contactForm.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!contactForm.reportValidity())return;
    const fd=new FormData(contactForm);
    const message=`Consulta para TOVEN FOODS\nNombre: ${fd.get('nombre')}\nCorreo: ${fd.get('correo')}\nMensaje: ${fd.get('mensaje')}`;
    const status=document.getElementById('consulta-estado');
    try{
      await navigator.clipboard.writeText(message);
      status.textContent='Consulta copiada. Puedes pegarla en el canal oficial de TOVEN FOODS cuando esté habilitado.';
    }catch(err){
      const ta=document.createElement('textarea');ta.value=message;ta.readOnly=true;ta.style.width='100%';ta.style.minHeight='150px';status.replaceChildren(document.createTextNode('Selecciona y copia esta consulta: '),ta);ta.select();
    }
  });
}
