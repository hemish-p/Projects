document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const algoSelect = document.getElementById('algorithm');
    const keyGroup = document.getElementById('key-group');
    const keyInput = document.getElementById('key-input');
    const inputText = document.getElementById('input-text');
    const actionBtn = document.getElementById('action-btn');
    const copyBtn = document.getElementById('copy-btn');
    const outputArea = document.getElementById('output-area');

    const decryptionTools = document.getElementById('decryption-tools');
    const autoDetectBadge = document.getElementById('auto-detect-badge');
    const rankControls = document.getElementById('rank-controls');
    const rankIndexSpan = document.getElementById('rank-index');
    const nextMatchBtn = document.getElementById('next-match-btn');

    // --- State ---
    let currentMode = 'encrypt';
    let rankedResults = [];
    let currentRankIndex = 0;

    // --- Theme Logic (removed — always dark cyberpunk) ---
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
        });
    }

    // --- Mode Switching ---
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            actionBtn.textContent = currentMode === 'encrypt' ? '> Encrypt' : '> Decrypt';
            updateUI();
        });
    });

    algoSelect.addEventListener('change', updateUI);

    function updateUI() {
        const algo = algoSelect.value;
        // Key input for encryption only; decryption is brute-force
        keyGroup.style.display = (currentMode === 'encrypt' && (algo === 'caesar' || algo === 'mixed')) ? 'flex' : 'none';

        outputArea.innerHTML = '<span class="placeholder">// output will render here...</span>';
        decryptionTools.style.display = 'none';
        autoDetectBadge.style.display = 'none';
        rankControls.style.display = 'none';
    }

    // --- Core Utilities ---
    const isPrintable = (str) => /^[\x20-\x7E\s]*$/.test(str);
    const utf8_to_b64 = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
    const b64_to_utf8 = (str) => decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));

    // --- 1. Encryption Engine ---
    function performEncryption() {
        const text = inputText.value;
        if (!text) return;

        const algo = algoSelect.value;
        const key = parseInt(keyInput.value) || 0;
        let result = '';

        try {
            if (algo === 'base64') {
                result = utf8_to_b64(text);
            } else if (algo === 'caesar') {
                result = text.toLowerCase().replace(/[a-z]/g, char => {
                    const letters = "abcdefghijklmnopqrstuvwxyz";
                    const index = letters.indexOf(char);
                    return letters[(index + key) % 26];
                });
            } else if (algo === 'mixed') {
                let shifted = "";
                for (let i = 0; i < text.length; i++) {
                    shifted += String.fromCharCode(text.charCodeAt(i) + key);
                }
                result = utf8_to_b64(shifted);
            }
        } catch (e) {
            result = "Encryption Error: " + e.message;
        }
        displayOutput(result);
    }

    // --- 2. Decryption Engine ---
    function performDecryption() {
        const text = inputText.value.trim();
        if (!text) return;

        const algo = algoSelect.value;
        decryptionTools.style.display = 'none';
        autoDetectBadge.style.display = 'none';
        rankControls.style.display = 'none';

        try {
            if (algo === 'mixed') {
                let b64_decoded = b64_to_utf8(text);
                rankedResults = [];
                for (let k = 1; k <= 26; k++) {
                    let unshifted = "";
                    for (let i = 0; i < b64_decoded.length; i++) {
                        unshifted += String.fromCharCode(b64_decoded.charCodeAt(i) - k);
                    }
                    if (isPrintable(unshifted)) {
                        rankedResults.push({ key: k, text: unshifted });
                    }
                }
                finalizeDecryptionUI('Safe Mixed Mode Pattern');
            } else if (algo === 'base64') {
                displayOutput(b64_to_utf8(text));
            } else if (algo === 'caesar') {
                rankedResults = [];
                const letters = "abcdefghijklmnopqrstuvwxyz";
                for (let k = 1; k <= 26; k++) {
                    let unshifted = text.toLowerCase().replace(/[a-z]/g, char => {
                        let index = letters.indexOf(char);
                        let newIndex = (index - k) % 26;
                        if (newIndex < 0) newIndex += 26;
                        return letters[newIndex];
                    });
                    rankedResults.push({ key: k, text: unshifted });
                }
                finalizeDecryptionUI('Caesar Brute Force');
            }
        } catch (e) {
            displayOutput("Decryption Error: " + e.message);
        }
    }

    function finalizeDecryptionUI(badgeText) {
        if (rankedResults.length > 0) {
            currentRankIndex = 0;
            showRankedResult();
            rankControls.style.display = 'flex';
            autoDetectBadge.style.display = 'inline-block';
            autoDetectBadge.textContent = badgeText;
            decryptionTools.style.display = 'flex';
        } else {
            displayOutput("No readable patterns found.");
        }
    }

    function showRankedResult() {
        if (rankedResults.length === 0) return;
        const item = rankedResults[currentRankIndex];
        const keyStr = item.key.toString().padStart(2, '0');
        displayOutput(`Match Found! (Key ${keyStr}): ${item.text}`);
        rankIndexSpan.textContent = `Match ${currentRankIndex + 1} / ${rankedResults.length}`;
    }

    function displayOutput(text) {
        outputArea.textContent = text;
    }

    // --- Floating Nav Logic ---
    const navTrigger = document.getElementById('nav-trigger');
    const navDropdown = document.getElementById('nav-dropdown');
    const navOverlay = document.getElementById('nav-overlay');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const moduleBadge = document.getElementById('module-badge');

    let menuTimeout;

    const openMenu = () => {
        clearTimeout(menuTimeout);
        navTrigger.classList.add('open');
        navDropdown.classList.add('visible');
        if (window.innerWidth <= 768) {
            navOverlay.classList.add('visible');
        }
    };

    const closeMenu = () => {
        menuTimeout = setTimeout(() => {
            navTrigger.classList.remove('open');
            navDropdown.classList.remove('visible');
            navOverlay.classList.remove('visible');
        }, 150);
    };

    // Hover listeners for Desktop
    navTrigger.addEventListener('mouseenter', openMenu);
    navTrigger.addEventListener('mouseleave', closeMenu);
    navDropdown.addEventListener('mouseenter', openMenu);
    navDropdown.addEventListener('mouseleave', closeMenu);

    // Click/Tap toggle for Mobile
    navTrigger.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (navDropdown.classList.contains('visible')) {
                closeMenu();
            } else {
                openMenu();
            }
        }
    });

    navOverlay.addEventListener('click', closeMenu);

    // Module Switching Logic
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;

            // 1. Update UI Classes
            navItems.forEach(i => {
                i.classList.remove('active');
                i.querySelector('.nav-icon').textContent = '[ ]';
            });
            item.classList.add('active');
            item.querySelector('.nav-icon').textContent = '[■]';

            // 2. Update Content Sections
            tabContents.forEach(content => {
                if (content.id === `tab-${tabId}`) {
                    content.style.display = content.classList.contains('grid-layout') ? 'grid' : 'flex';
                    // Trigger reflow for animation
                    content.offsetHeight;
                    content.classList.add('active');
                } else {
                    content.style.display = 'none';
                    content.classList.remove('active');
                }
            });

            // 3. Update Badge
            const label = item.querySelector('.nav-label').textContent.replace('> ', '');
            moduleBadge.textContent = `MODULE: ${label.toUpperCase()}`;

            // 4. Close menu
            closeMenu();
        });
    });

    // --- 3. Password Checker Logic ---
    const pwdInput = document.getElementById('password-input');
    const togglePwdBtn = document.getElementById('toggle-password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    const crackTimeDisplay = document.getElementById('crack-time');
    const entropyDisplay = document.getElementById('entropy-score');
    const feedbackList = document.getElementById('password-feedback');

    let weakPasswords = new Set();

    async function fetchWeakPasswords() {
        try {
            const response = await fetch('weak_passwords.txt');
            if (response.ok) {
                const text = await response.text();
                text.split(/\r?\n/).forEach(p => {
                    if (p.trim()) weakPasswords.add(p.trim().toLowerCase());
                });
            }
        } catch (e) { console.warn("Error fetching blacklist", e); }
    }

    fetchWeakPasswords();

    // Toggle Password Visibility
    if (togglePwdBtn) {
        togglePwdBtn.addEventListener('click', () => {
            const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
            pwdInput.setAttribute('type', type);

            // Update Icon
            const isShow = type === 'text';
            togglePwdBtn.innerHTML = isShow
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        });
    }

    function updatePasswordAnalysis() {
        const password = pwdInput.value;
        if (!password) { resetAnalysis(); return; }

        if (password.startsWith(' ') || password.endsWith(' ')) {
            updateUIState(0, "Invalid Format", "Instant", 0, ["Password cannot start or end with a space."]);
            return;
        }

        const lowerCasePwd = password.toLowerCase();
        const feedback = [];

        // FLAG: Pattern Check
        // If the pattern exists in the blacklist (case-insensitive check)
        if (weakPasswords.has(lowerCasePwd)) {
            // "QwErTy" logic: If it is NOT all lower and NOT all upper, allow it (but warn)
            const isAllLower = password === lowerCasePwd;
            const isAllUpper = password === password.toUpperCase();

            if (isAllLower || isAllUpper) {
                updateUIState(0, "Very Weak", "Instant", 0, ["Common pattern detected! Case variations do not stop hackers."]);
                return;
            } else {
                feedback.push("Good job mixing case! But this is still a known pattern.");
            }
        }

        // HEURISTICS
        if (/^[0-9]+$/.test(password)) feedback.push("Avoid using only numbers.");
        if (password.length < 8) feedback.push("Make it at least 8 characters long.");

        // ENTROPY
        const poolSize = getPoolSize(password);
        const entropy = Math.log2(Math.pow(poolSize, password.length));

        // CRACK TIME (Standard Brute-force Math)
        const guessesPerSec = 1e10;
        const secondsToCrack = Math.pow(2, entropy) / guessesPerSec;

        let score = Math.min(100, (entropy / 100) * 100);
        if (password.length < 6) score = 10;
        if (feedback.length > 0 && score > 50) score = 40;

        let label = score < 40 ? "Weak" : score < 60 ? "Moderate" : score < 80 ? "Strong" : "Very Strong";
        if (score >= 80 && feedback.length === 0) feedback.push("Great password!");

        updateUIState(score, label, formatTime(secondsToCrack), entropy, feedback);
    }

    function getPoolSize(pwd) {
        let pool = 0;
        if (/[a-z]/.test(pwd)) pool += 26;
        if (/[A-Z]/.test(pwd)) pool += 26;
        if (/[0-9]/.test(pwd)) pool += 10;
        if (/[^a-zA-Z0-9]/.test(pwd)) pool += 32;
        return pool || 1;
    }

    function formatTime(seconds) {
        if (seconds < 1) return "Instant";
        if (seconds < 60) return "Seconds";
        if (seconds < 3600) return "Minutes";
        if (seconds < 86400) return "Hours";
        if (seconds < 31536000) return "Days";
        return "Years";
    }

    function updateUIState(score, label, time, entropy, feedback) {
        const colors = { "Very Weak": "strength-weak", "Weak": "strength-weak", "Moderate": "strength-moderate", "Strong": "strength-strong", "Very Strong": "strength-very-strong" };
        strengthFill.className = colors[label] || "strength-weak";
        strengthFill.style.width = `${score}%`;
        strengthText.textContent = label;
        entropyDisplay.textContent = `${Math.floor(entropy)} bits`;
        crackTimeDisplay.textContent = time;
        feedbackList.innerHTML = feedback.map(msg => `<li>${msg}</li>`).join('');
    }

    function resetAnalysis() {
        strengthFill.style.width = "0%";
        strengthText.textContent = "Enter a password";
        crackTimeDisplay.textContent = "--";
        entropyDisplay.textContent = "0 bits";
        feedbackList.innerHTML = "";
    }

    // --- Core Listeners ---
    actionBtn.addEventListener('click', () => { currentMode === 'encrypt' ? performEncryption() : performDecryption(); });
    nextMatchBtn.addEventListener('click', () => {
        if (rankedResults.length === 0) return;
        currentRankIndex = (currentRankIndex + 1) % rankedResults.length;
        showRankedResult();
    });
    pwdInput.addEventListener('input', updatePasswordAnalysis);

    updateUI();

    // ===== 4. FILE ENCRYPTOR LOGIC =====
    const fileModeBtns = document.querySelectorAll('.file-mode-btn');
    const fileEncryptView = document.getElementById('file-encrypt-view');
    const fileDecryptView = document.getElementById('file-decrypt-view');

    // Encrypt elements
    const encryptFileInput = document.getElementById('encrypt-file-input');
    const encryptDropZone = document.getElementById('encrypt-drop-zone');
    const encryptFileName = document.getElementById('encrypt-file-name');
    const encryptFileBtn = document.getElementById('encrypt-file-btn');
    const encryptStatus = document.getElementById('encrypt-status');

    // Decrypt elements
    const keyFileInput = document.getElementById('key-file-input');
    const keyDropZone = document.getElementById('key-drop-zone');
    const keyFileName = document.getElementById('key-file-name');
    const fernetFileInput = document.getElementById('fernet-file-input');
    const fernetDropZone = document.getElementById('fernet-drop-zone');
    const fernetFileName = document.getElementById('fernet-file-name');
    const decryptFileBtn = document.getElementById('decrypt-file-btn');
    const decryptStatus = document.getElementById('decrypt-status');

    let encryptFile = null;
    let keyFile = null;
    let fernetFile = null;

    // --- File Mode Switching ---
    fileModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            fileModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.fileMode;
            if (mode === 'encrypt') {
                fileEncryptView.style.display = 'flex';
                fileDecryptView.style.display = 'none';
            } else {
                fileEncryptView.style.display = 'none';
                fileDecryptView.style.display = 'flex';
            }
        });
    });

    // --- Drag & Drop + Click Helpers ---
    function setupDropZone(zone, fileInput, nameDisplay, onFileSelected) {
        zone.addEventListener('click', () => fileInput.click());

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                onFileSelected(e.dataTransfer.files[0]);
                updateFileDisplay(zone, nameDisplay, e.dataTransfer.files[0].name);
            }
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                onFileSelected(fileInput.files[0]);
                updateFileDisplay(zone, nameDisplay, fileInput.files[0].name);
            }
        });
    }

    function updateFileDisplay(zone, nameDisplay, name) {
        nameDisplay.textContent = name;
        nameDisplay.classList.add('has-file');
        zone.classList.add('file-selected');
    }

    // Setup all three drop zones
    setupDropZone(encryptDropZone, encryptFileInput, encryptFileName, (file) => {
        encryptFile = file;
        encryptFileBtn.disabled = false;
    });
    setupDropZone(keyDropZone, keyFileInput, keyFileName, (file) => {
        keyFile = file;
        checkDecryptReady();
    });
    setupDropZone(fernetDropZone, fernetFileInput, fernetFileName, (file) => {
        fernetFile = file;
        checkDecryptReady();
    });

    function checkDecryptReady() {
        decryptFileBtn.disabled = !(keyFile && fernetFile);
    }

    // --- Status Helper ---
    function setStatus(element, message, type) {
        element.textContent = message;
        element.className = 'file-status ' + type;
    }

    // --- Download Helper ---
    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- ENCRYPT ---
    encryptFileBtn.addEventListener('click', async () => {
        if (!encryptFile) return;

        setStatus(encryptStatus, 'Encrypting...', 'processing');
        encryptFileBtn.disabled = true;

        try {
            // 1. Generate AES-GCM key
            const key = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true, // extractable
                ['encrypt', 'decrypt']
            );

            // 2. Read file as ArrayBuffer
            const fileData = await encryptFile.arrayBuffer();

            // 3. Generate random IV (12 bytes for AES-GCM)
            const iv = crypto.getRandomValues(new Uint8Array(12));

            // 4. Encrypt
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                fileData
            );

            // 5. Export the key as raw bytes -> Base64 for the .key file
            const rawKey = await crypto.subtle.exportKey('raw', key);
            const keyBase64 = arrayBufferToBase64(rawKey);

            // 6. Build the encrypted file: [12 bytes IV] + [encrypted data]
            const encryptedBlob = new Blob([iv, new Uint8Array(encrypted)]);

            // 7. Trigger downloads
            const keyBlob = new Blob([keyBase64], { type: 'application/octet-stream' });
            triggerDownload(keyBlob, 'secret.key');

            // Small delay so browser doesn't block second download
            await new Promise(r => setTimeout(r, 500));

            triggerDownload(encryptedBlob, encryptFile.name + '.fernet');

            setStatus(encryptStatus, `✓ Encrypted! Downloaded secret.key and ${encryptFile.name}.fernet`, 'success');
        } catch (err) {
            setStatus(encryptStatus, '✗ Encryption failed: ' + err.message, 'error');
        }

        encryptFileBtn.disabled = false;
    });

    // --- DECRYPT ---
    decryptFileBtn.addEventListener('click', async () => {
        if (!keyFile || !fernetFile) return;

        setStatus(decryptStatus, 'Decrypting...', 'processing');
        decryptFileBtn.disabled = true;

        try {
            // 1. Read the key file (Base64 text)
            const keyText = await keyFile.text();
            const rawKey = base64ToArrayBuffer(keyText.trim());

            // 2. Import the key
            const key = await crypto.subtle.importKey(
                'raw',
                rawKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );

            // 3. Read encrypted file
            const encData = await fernetFile.arrayBuffer();

            // 4. Split IV (first 12 bytes) and ciphertext
            const iv = new Uint8Array(encData.slice(0, 12));
            const ciphertext = new Uint8Array(encData.slice(12));

            // 5. Decrypt
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                ciphertext
            );

            // 6. Determine original filename (strip .fernet)
            let originalName = fernetFile.name;
            if (originalName.endsWith('.fernet')) {
                originalName = originalName.slice(0, -7);
            } else {
                originalName = 'decrypted_' + originalName;
            }

            // 7. Trigger download
            const decBlob = new Blob([decrypted]);
            triggerDownload(decBlob, originalName);

            setStatus(decryptStatus, `✓ Decrypted! Downloaded as ${originalName}`, 'success');
        } catch (err) {
            if (err.name === 'OperationError') {
                setStatus(decryptStatus, '✗ Decryption failed: Incorrect key or corrupted file.', 'error');
            } else {
                setStatus(decryptStatus, '✗ Decryption failed: ' + err.message, 'error');
            }
        }

        decryptFileBtn.disabled = false;
    });

    // --- Base64 Utilities ---
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
});