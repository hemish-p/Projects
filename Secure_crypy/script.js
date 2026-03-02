document.addEventListener('DOMContentLoaded', () => {

  // --- UI Elements ---
  const modeBtns     = document.querySelectorAll('.mode-btn');
  const algoSelect   = document.getElementById('algorithm');
  const keyGroup     = document.getElementById('key-group');
  const keyInput     = document.getElementById('key-input');
  const inputText    = document.getElementById('input-text');
  const actionBtn    = document.getElementById('action-btn');
  const copyBtn      = document.getElementById('copy-btn');
  const outputArea   = document.getElementById('output-area');
  const decryptTools = document.getElementById('decryption-tools');
  const detectBadge  = document.getElementById('auto-detect-badge');
  const rankControls = document.getElementById('rank-controls');
  const nextMatchBtn = document.getElementById('next-match-btn');

  // --- State ---
  let currentMode = 'encrypt', rankedResults = [], currentRankIndex = 0;

  // --- Mode Switching ---
  modeBtns.forEach(btn => btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    actionBtn.textContent = currentMode === 'encrypt' ? '> Encrypt' : '> Decrypt';
    updateUI();
  }));

  algoSelect.addEventListener('change', updateUI);

  function updateUI() {
    const algo = algoSelect.value;
    keyGroup.style.display = (currentMode === 'encrypt' && (algo === 'caesar' || algo === 'mixed')) ? 'flex' : 'none';
    outputArea.innerHTML = '<span class="placeholder">// output will render here...</span>';
    decryptTools.style.display = detectBadge.style.display = rankControls.style.display = 'none';
  }

  // --- Utilities ---
  const isPrintable   = str => /^[\x20-\x7E\s]*$/.test(str);
  const utf8_to_b64   = str => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
  const b64_to_utf8   = str => decodeURIComponent(Array.prototype.map.call(atob(str), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  const displayOutput = text => { outputArea.textContent = text; };

  // --- Encryption ---
  function performEncryption() {
    const text = inputText.value;
    if (!text) return;
    const algo = algoSelect.value, key = parseInt(keyInput.value) || 0;
    try {
      if (algo === 'base64') {
        displayOutput(utf8_to_b64(text));
      } else if (algo === 'caesar') {
        displayOutput(text.toLowerCase().replace(/[a-z]/g, c => {
          const l = "abcdefghijklmnopqrstuvwxyz";
          return l[(l.indexOf(c) + key) % 26];
        }));
      } else if (algo === 'mixed') {
        let shifted = '';
        for (let i = 0; i < text.length; i++) shifted += String.fromCharCode(text.charCodeAt(i) + key);
        displayOutput(utf8_to_b64(shifted));
      }
    } catch(e) { displayOutput("Encryption Error: " + e.message); }
  }

  // --- Decryption ---
  function performDecryption() {
    const text = inputText.value.trim();
    if (!text) return;
    const algo = algoSelect.value;
    decryptTools.style.display = detectBadge.style.display = rankControls.style.display = 'none';
    try {
      if (algo === 'base64') {
        displayOutput(b64_to_utf8(text));
      } else if (algo === 'mixed') {
        const decoded = b64_to_utf8(text);
        rankedResults = [];
        for (let k = 1; k <= 26; k++) {
          let out = '';
          for (let i = 0; i < decoded.length; i++) out += String.fromCharCode(decoded.charCodeAt(i) - k);
          if (isPrintable(out)) rankedResults.push({ key: k, text: out });
        }
        finalizeDecryptionUI('Safe Mixed Mode Pattern');
      } else if (algo === 'caesar') {
        const l = "abcdefghijklmnopqrstuvwxyz";
        rankedResults = Array.from({length: 26}, (_, i) => ({
          key: i + 1,
          text: text.toLowerCase().replace(/[a-z]/g, c => {
            let idx = (l.indexOf(c) - (i + 1)) % 26;
            return l[idx < 0 ? idx + 26 : idx];
          })
        }));
        finalizeDecryptionUI('Caesar Brute Force');
      }
    } catch(e) { displayOutput("Decryption Error: " + e.message); }
  }

  function finalizeDecryptionUI(badgeText) {
    if (rankedResults.length > 0) {
      currentRankIndex = 0;
      showRankedResult();
      rankControls.style.display = detectBadge.style.display = 'flex';
      detectBadge.style.display = 'inline-block';
      detectBadge.textContent = badgeText;
      decryptTools.style.display = 'flex';
    } else {
      displayOutput("No readable patterns found.");
    }
  }

  function showRankedResult() {
    if (!rankedResults.length) return;
    const item = rankedResults[currentRankIndex];
    displayOutput(`Match Found! (Key ${String(item.key).padStart(2,'0')}): ${item.text}`);
    // rankIndexSpan removed — not in HTML, was causing the null error
  }

  // --- Nav Logic ---
  const navTrigger   = document.getElementById('nav-trigger');
  const navDropdown  = document.getElementById('nav-dropdown');
  const navOverlay   = document.getElementById('nav-overlay');
  const navItems     = document.querySelectorAll('.nav-item');
  const tabContents  = document.querySelectorAll('.tab-content');
  const moduleBadge  = document.getElementById('module-badge');
  let menuTimeout;

  const openMenu = () => { clearTimeout(menuTimeout); navTrigger.classList.add('open'); navDropdown.classList.add('visible'); if (window.innerWidth <= 768) navOverlay.classList.add('visible'); };
  const closeMenu = () => { menuTimeout = setTimeout(() => { navTrigger.classList.remove('open'); navDropdown.classList.remove('visible'); navOverlay.classList.remove('visible'); }, 150); };

  navTrigger.addEventListener('mouseenter', openMenu);
  navTrigger.addEventListener('mouseleave', closeMenu);
  navDropdown.addEventListener('mouseenter', openMenu);
  navDropdown.addEventListener('mouseleave', closeMenu);
  navTrigger.addEventListener('click', () => { if (window.innerWidth <= 768) navDropdown.classList.contains('visible') ? closeMenu() : openMenu(); });
  navOverlay.addEventListener('click', closeMenu);

  navItems.forEach(item => item.addEventListener('click', () => {
    const tabId = item.dataset.tab;
    navItems.forEach(i => { i.classList.remove('active'); i.querySelector('.nav-icon').textContent = '[ ]'; });
    item.classList.add('active');
    item.querySelector('.nav-icon').textContent = '[■]';
    tabContents.forEach(c => {
      if (c.id === `tab-${tabId}`) { c.style.display = c.classList.contains('grid-layout') ? 'grid' : 'flex'; c.offsetHeight; c.classList.add('active'); }
      else { c.style.display = 'none'; c.classList.remove('active'); }
    });
    moduleBadge.textContent = `MODULE: ${item.querySelector('.nav-label').textContent.replace('> ', '').toUpperCase()}`;
    closeMenu();
  }));

  // --- Password Checker ---
  const pwdInput      = document.getElementById('password-input');
  const togglePwdBtn  = document.getElementById('toggle-password');
  const strengthFill  = document.getElementById('strength-fill');
  const strengthText  = document.getElementById('strength-text');
  const crackTime     = document.getElementById('crack-time');
  const entropyScore  = document.getElementById('entropy-score');
  const feedbackList  = document.getElementById('password-feedback');
  let weakPasswords   = new Set();

  fetch('weak_passwords.txt').then(r => r.ok ? r.text() : '').then(t => t.split(/\r?\n/).forEach(p => p.trim() && weakPasswords.add(p.trim().toLowerCase()))).catch(() => {});

  if (togglePwdBtn) togglePwdBtn.addEventListener('click', () => {
    const show = pwdInput.getAttribute('type') === 'password';
    pwdInput.setAttribute('type', show ? 'text' : 'password');
    togglePwdBtn.innerHTML = show
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  });

  function updatePasswordAnalysis() {
    const pwd = pwdInput.value;
    if (!pwd) { resetAnalysis(); return; }
    if (pwd.startsWith(' ') || pwd.endsWith(' ')) { updateUIState(0, "Invalid Format", "Instant", 0, ["Password cannot start or end with a space."]); return; }

    const lower = pwd.toLowerCase(), feedback = [];
    if (weakPasswords.has(lower)) {
      if (pwd === lower || pwd === pwd.toUpperCase()) { updateUIState(0, "Very Weak", "Instant", 0, ["Common pattern detected!"]); return; }
      feedback.push("Good job mixing case! But this is still a known pattern.");
    }
    if (/^[0-9]+$/.test(pwd)) feedback.push("Avoid using only numbers.");
    if (pwd.length < 8) feedback.push("Make it at least 8 characters long.");

    const pool = (/[a-z]/.test(pwd) ? 26 : 0) + (/[A-Z]/.test(pwd) ? 26 : 0) + (/[0-9]/.test(pwd) ? 10 : 0) + (/[^a-zA-Z0-9]/.test(pwd) ? 32 : 0) || 1;
    const entropy = Math.log2(Math.pow(pool, pwd.length));
    const secs = Math.pow(2, entropy) / 1e10;
    let score = Math.min(100, (entropy / 100) * 100);
    if (pwd.length < 6) score = 10;
    if (feedback.length > 0 && score > 50) score = 40;
    const label = score < 40 ? "Weak" : score < 60 ? "Moderate" : score < 80 ? "Strong" : "Very Strong";
    if (score >= 80 && !feedback.length) feedback.push("Great password!");
    updateUIState(score, label, formatTime(secs), entropy, feedback);
  }

  const formatTime = s => s < 1 ? "Instant" : s < 60 ? "Seconds" : s < 3600 ? "Minutes" : s < 86400 ? "Hours" : s < 31536000 ? "Days" : "Years";

  function updateUIState(score, label, time, entropy, feedback) {
    const colors = { "Very Weak":"strength-weak","Weak":"strength-weak","Moderate":"strength-moderate","Strong":"strength-strong","Very Strong":"strength-very-strong" };
    strengthFill.className = colors[label] || "strength-weak";
    strengthFill.style.width = `${score}%`;
    strengthText.textContent = label;
    entropyScore.textContent = `${Math.floor(entropy)} bits`;
    crackTime.textContent = time;
    feedbackList.innerHTML = feedback.map(m => `<li>${m}</li>`).join('');
  }

  function resetAnalysis() {
    strengthFill.style.width = "0%";
    strengthText.textContent = "Enter a password";
    crackTime.textContent = "--";
    entropyScore.textContent = "0 bits";
    feedbackList.innerHTML = "";
  }

  // --- File Encryptor ---
  const fileModeBtns    = document.querySelectorAll('.file-mode-btn');
  const fileEncryptView = document.getElementById('file-encrypt-view');
  const fileDecryptView = document.getElementById('file-decrypt-view');
  const encryptFileInput = document.getElementById('encrypt-file-input');
  const encryptDropZone  = document.getElementById('encrypt-drop-zone');
  const encryptFileName  = document.getElementById('encrypt-file-name');
  const encryptFileBtn   = document.getElementById('encrypt-file-btn');
  const encryptStatus    = document.getElementById('encrypt-status');
  const keyFileInput     = document.getElementById('key-file-input');
  const keyDropZone      = document.getElementById('key-drop-zone');
  const keyFileName      = document.getElementById('key-file-name');
  const fernetFileInput  = document.getElementById('fernet-file-input');
  const fernetDropZone   = document.getElementById('fernet-drop-zone');
  const fernetFileName   = document.getElementById('fernet-file-name');
  const decryptFileBtn   = document.getElementById('decrypt-file-btn');
  const decryptStatus    = document.getElementById('decrypt-status');
  let encryptFile = null, keyFile = null, fernetFile = null;

  fileModeBtns.forEach(btn => btn.addEventListener('click', () => {
    fileModeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const enc = btn.dataset.fileMode === 'encrypt';
    fileEncryptView.style.display = enc ? 'flex' : 'none';
    fileDecryptView.style.display = enc ? 'none' : 'flex';
  }));

  function setupDropZone(zone, input, nameDisplay, onFile) {
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) { onFile(e.dataTransfer.files[0]); setFileDisplay(zone, nameDisplay, e.dataTransfer.files[0].name); } });
    input.addEventListener('change', () => { if (input.files[0]) { onFile(input.files[0]); setFileDisplay(zone, nameDisplay, input.files[0].name); } });
  }

  const setFileDisplay = (zone, nameDisplay, name) => { if (nameDisplay) { nameDisplay.textContent = name; nameDisplay.classList.add('has-file'); } zone.classList.add('file-selected'); };
  const setStatus = (el, msg, type) => { if (el) { el.textContent = msg; el.className = 'file-status ' + type; } };
  const triggerDownload = (blob, filename) => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename }); document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href); };
  const toBase64 = buf => btoa(Array.from(new Uint8Array(buf), b => String.fromCharCode(b)).join(''));
  const fromBase64 = b64 => { const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return arr.buffer; };

  setupDropZone(encryptDropZone, encryptFileInput, encryptFileName, f => { encryptFile = f; encryptFileBtn.disabled = false; });
  setupDropZone(keyDropZone,     keyFileInput,     keyFileName,     f => { keyFile = f;     decryptFileBtn.disabled = !(keyFile && fernetFile); });
  setupDropZone(fernetDropZone,  fernetFileInput,  fernetFileName,  f => { fernetFile = f;  decryptFileBtn.disabled = !(keyFile && fernetFile); });

  encryptFileBtn.addEventListener('click', async () => {
    if (!encryptFile) return;
    setStatus(encryptStatus, 'Encrypting...', 'processing');
    encryptFileBtn.disabled = true;
    try {
      const key = await crypto.subtle.generateKey({ name:'AES-GCM', length:256 }, true, ['encrypt','decrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, await encryptFile.arrayBuffer());
      const rawKey = await crypto.subtle.exportKey('raw', key);
      triggerDownload(new Blob([toBase64(rawKey)]), 'secret.key');
      await new Promise(r => setTimeout(r, 500));
      triggerDownload(new Blob([iv, new Uint8Array(encrypted)]), encryptFile.name + '.fernet');
      setStatus(encryptStatus, `✓ Encrypted! Downloaded secret.key and ${encryptFile.name}.fernet`, 'success');
    } catch(e) { setStatus(encryptStatus, '✗ Encryption failed: ' + e.message, 'error'); }
    encryptFileBtn.disabled = false;
  });

  decryptFileBtn.addEventListener('click', async () => {
    if (!keyFile || !fernetFile) return;
    setStatus(decryptStatus, 'Decrypting...', 'processing');
    decryptFileBtn.disabled = true;
    try {
      const key = await crypto.subtle.importKey('raw', fromBase64((await keyFile.text()).trim()), { name:'AES-GCM', length:256 }, false, ['decrypt']);
      const encData = await fernetFile.arrayBuffer();
      const decrypted = await crypto.subtle.decrypt({ name:'AES-GCM', iv: new Uint8Array(encData.slice(0,12)) }, key, new Uint8Array(encData.slice(12)));
      const name = fernetFile.name.endsWith('.fernet') ? fernetFile.name.slice(0,-7) : 'decrypted_' + fernetFile.name;
      triggerDownload(new Blob([decrypted]), name);
      setStatus(decryptStatus, `✓ Decrypted! Downloaded as ${name}`, 'success');
    } catch(e) { setStatus(decryptStatus, e.name === 'OperationError' ? '✗ Incorrect key or corrupted file.' : '✗ ' + e.message, 'error'); }
    decryptFileBtn.disabled = false;
  });

  // --- Core Listeners ---
  actionBtn.addEventListener('click', () => currentMode === 'encrypt' ? performEncryption() : performDecryption());
  nextMatchBtn.addEventListener('click', () => { if (!rankedResults.length) return; currentRankIndex = (currentRankIndex + 1) % rankedResults.length; showRankedResult(); });
  if (copyBtn) copyBtn.addEventListener('click', () => navigator.clipboard.writeText(outputArea.textContent));
  pwdInput.addEventListener('input', updatePasswordAnalysis);

  updateUI();
});