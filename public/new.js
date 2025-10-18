// New Password page logic (enhanced)
(function(){
  const form = document.getElementById('newForm');
  const genPw = document.getElementById('genPw');
  const togglePwEye = document.getElementById('togglePwEye');
  const msg = document.getElementById('msg');
  const pwInput = document.getElementById('password');
  const strengthFill = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');
  const errTitle = document.getElementById('err-title');
  const errPassword = document.getElementById('err-password');

  function authHeader(){
    const t = localStorage.getItem('bp_token');
    return t ? `Bearer ${t}` : '';
  }

  function ensureAuth(){
    if (!localStorage.getItem('bp_token')){
      window.location.href = '/';
    }
  }

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function generatePassword(){ const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=[]{}<>?'; let l = 16; let pw=''; for(let i=0;i<l;i++) pw += charset[randInt(0,charset.length-1)]; return pw; }

  function strengthOf(pw){
    const len = (pw||'').length;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSym = /[^A-Za-z0-9]/.test(pw);
    const diversity = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;
    if (len >= 12 && diversity >= 3) return 'strong';
    if (len >= 8 && diversity >= 2) return 'medium';
    return 'weak';
  }

  function updateStrengthUI(){
    const pw = pwInput.value;
    const s = strengthOf(pw);
    let width = 0, color = '#dc2626', label = 'Weak';
    if (s === 'weak'){ width = Math.min(33, pw.length*4); color = '#dc2626'; label = 'Weak'; }
    if (s === 'medium'){ width = 66; color = '#ca8a04'; label = 'Medium'; }
    if (s === 'strong'){ width = 100; color = '#16a34a'; label = 'Strong'; }
    strengthFill.style.width = width + '%';
    strengthFill.style.background = color;
    strengthLabel.textContent = label;
  }

  genPw.addEventListener('click', ()=>{
    const pw = generatePassword();
    pwInput.value = pw;
    updateStrengthUI();
    // small pulse animation
    genPw.classList.add('pulse');
    setTimeout(()=> genPw.classList.remove('pulse'), 650);
  });

  togglePwEye.addEventListener('click', ()=>{
    if (pwInput.type === 'password'){ pwInput.type='text'; togglePwEye.textContent='🙈'; }
    else { pwInput.type='password'; togglePwEye.textContent='👁️'; }
  });

  pwInput.addEventListener('input', updateStrengthUI);
  updateStrengthUI();

  function clearErrors(){ errTitle.textContent=''; errPassword.textContent=''; }
  function validate(){
    clearErrors();
    let ok = true;
    if (!form.title.value.trim()){ errTitle.textContent = 'Title is required.'; ok=false; }
    if (!pwInput.value){ errPassword.textContent = 'Password is required.'; ok=false; }
    return ok;
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); msg.textContent='';
    if (!validate()) return;
    const payload = {
      title: form.title.value.trim(),
      website_url: form.website_url.value.trim(),
      email: form.email.value.trim(),
      category: form.category.value,
      password: pwInput.value
    };
    try{
      const res = await fetch('/api/entries', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization': authHeader()}, body: JSON.stringify(payload)
      });
      if (!res.ok){ const e = await res.json(); throw new Error(e.error || 'Save failed'); }
      window.location.href = '/';
    }catch(err){ msg.textContent = err.message; }
  });

  ensureAuth();
})();
