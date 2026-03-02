import base64 as b64, os
from cryptography.fernet import Fernet, InvalidToken

LETTERS = "abcdefghijklmnopqrstuvwxyz"
COMMON  = "etaoinshrd"

def load_key():
    if not os.path.exists("secret.key"):
        open("secret.key", "wb").write(Fernet.generate_key())
        print("[!] New 'secret.key' generated. Keep it safe!")
    return open("secret.key", "rb").read()

def process_file(path, mode):
    try:
        f = Fernet(load_key())
        data = open(path, "rb").read()
        if mode == 'encrypt':
            out, name = f.encrypt(data), path + ".fernet"
        else:
            out = f.decrypt(data)
            name = path[:-7] if path.endswith(".fernet") else "decrypted_" + path
        open(name, "wb").write(out)
        print(f"[+] {mode.capitalize()}ed: {name}")
    except InvalidToken:
        print("[!] Invalid key or corrupted file.")
    except Exception as e:
        print(f"[!] Error: {e}")

def encrypt_text(text):
    print("\n1 - Base64\n2 - Caesar\n3 - Mixed Mode")
    c = input("Mode: ").strip()
    try:
        if c == '1':
            print(f"Result: {b64.b64encode(text.encode()).decode()}")
        elif c == '2':
            key = int(input("Shift (1-25): "))
            print(f"Result: {''.join(LETTERS[(LETTERS.index(ch)+key)%26] if ch in LETTERS else ch for ch in text.lower())}")
        elif c == '3':
            key = int(input("Key (1-25): "))
            print(f"Result: {b64.b64encode(''.join(chr(ord(ch)+key) for ch in text).encode()).decode()}")
        else:
            print("Invalid choice.")
    except ValueError:
        print("Invalid key!")

def decrypt_text():
    text = input("Text to decrypt: ").strip()
    if not text: return

    # Mixed Mode
    try:
        decoded = b64.b64decode(text).decode()
        for k in range(1, 27):
            r = "".join(chr(ord(c) - k) for c in decoded)
            if r.isprintable():
                print(f"Mixed Match (Key {k:02}): {r}")
                if input("Correct? (y/n): ").lower() == 'y': return
    except: pass

    # Standard Base64
    try:
        r = b64.b64decode(text, validate=True).decode()
        print(f"Base64: {r}")
        if input("Correct? (y/n): ").lower() == 'y': return
    except: pass

    # Caesar brute force (ranked by letter frequency)
    results = sorted(
        [(sum(1 for c in "".join(LETTERS[(LETTERS.index(c)-k)%26] if c in LETTERS else c for c in text.lower()) if c in COMMON),
          k,
          "".join(LETTERS[(LETTERS.index(c)-k)%26] if c in LETTERS else c for c in text.lower()))
         for k in range(1, 27)],
        reverse=True
    )
    for _, k, r in results:
        print(f"Caesar Key {k:02}: {r}")
        if input("Correct? (y/n): ").lower() == 'y': return

def main():
    while True:
        print("\n=== SECURITY PRO ===")
        action = input("(E)ncrypt / (D)ecrypt / (X)it: ").lower().strip()
        if action == 'x': break
        if action not in ('e', 'd'): continue

        target = input("(A) Text  (B) File: ").lower().strip()
        if target == 'a':
            encrypt_text(input("Text: ")) if action == 'e' else decrypt_text()
        elif target == 'b':
            path = input("File path: ").strip()
            if os.path.exists(path):
                process_file(path, 'encrypt' if action == 'e' else 'decrypt')
            else:
                print("[!] File not found.")

if __name__ == "__main__":
    main()
