import base64 as b64


# ---------------------------------- Encryption ----------------------------------
def encryption(text):
    print("\n--- Encryption Mode ---")
    print("1 - Simple Base64")
    print("2 - Caesar-Cipher (Alphabet only)")
    print("3 - Mixed Mode (Caesar Shift + Base64 Wrap)")
    
    choice = input("\nSelect mode: ").strip()
    
    if choice == '1':
        result = b64.b64encode(text.encode("utf-8")).decode("utf-8")
        print(f"\nResult: {result}")
        
    elif choice == '2':
        letters = "abcdefghijklmnopqrstuvwxyz"
        try:
            key = int(input("Enter shift key (1-25): "))
            cipher_text = ""
            for char in text.lower():
                if char in letters:
                    index = letters.find(char)
                    cipher_text += letters[(index + key) % 26]
                else:
                    cipher_text += char
            print(f"\nResult: {cipher_text}")
        except ValueError:
            print("Invalid key!")

    elif choice == '3':
        # LAYER 1: Caesar shift using ASCII (Handles all characters)
        try:
            key = int(input("Enter Mixed Mode key (1-25): "))
            shifted = ""
            for char in text:
                shifted += chr(ord(char) + key)
            
            # LAYER 2: Base64 Wrap (Makes the result safe for copy-paste)
            final_result = b64.b64encode(shifted.encode("utf-8")).decode("utf-8")
            print(f"\nResult (Safe Mixed): {final_result}")
        except ValueError:
            print("Invalid key!")
            
    else:
        print("Invalid selection.")

# ---------------------------------- Decryption ----------------------------------
def decryption():
    dtext = input("\nEnter the text to decrypt: ").strip()
    if not dtext:
        return

    # --- 1. Attempt Safe Mixed Mode (Reverse: B64 Decode -> Un-shift) ---
    print("\n[!] Scanning for Safe Mixed Mode patterns...")
    try:
        # Step A: Undo the Base64 "Wrapper"
        b64_decoded = b64.b64decode(dtext).decode("utf-8")
        
        # Step B: Brute force the ASCII shift
        for key in range(1, 27):
            unshifted = ""
            for char in b64_decoded:
                unshifted += chr(ord(char) - key)
            
            # We check if it looks like standard readable text
            if unshifted.isprintable():
                print("-" * 40)
                print(f"Match Found! (Key {key:02}): {unshifted}")
                print("-" * 40)
                confirm = input("Is this correct? (y/n): ").lower()
                if confirm == 'y':
                    return
    except Exception:
        # If the input isn't Base64, this block fails gracefully
        pass

    # --- 2. Attempt Standard Base64 (No Shift) ---
    try:
        result = b64.b64decode(dtext, validate=True).decode("utf-8")
        print(f"\n[!] Decrypted via Standard Base64: {result}")
        confirm = input("Is this correct? (y/n): ").lower()
        if confirm == 'y': return
    except Exception:
        pass

    # --- 3. Interactive Ranked Caesar (Standard Alphabet) ---
    print("\n[!] Attempting Ranked Caesar Decryption...")
    
    letters = "abcdefghijklmnopqrstuvwxyz"
    common_chars = "etaoinshrd" 
    scored_results = []

    for key in range(1, 27):
        current_result = ""
        current_score = 0
        for char in dtext.lower():
            if char in letters:
                index = letters.find(char)
                new_char = letters[(index - key) % 26]
                current_result += new_char
                if new_char in common_chars:
                    current_score += 1
            else:
                current_result += char
        scored_results.append((current_score, key, current_result))

    # Sort results by the highest frequency score
    scored_results.sort(key=lambda x: x[0], reverse=True)

    for score, key, result in scored_results:
        print("-" * 40)
        print(f"Ranked Match (Key {key:02}): {result}")
        print("-" * 40)
        
        confirm = input("Is this correct? (y/n): ").lower()
        if confirm == 'y':
            print("\nGreat! Decryption successful.")
            return
        else:
            print("Trying next most likely match...")

    print("\nAll possibilities exhausted.")

# ---------------------------------- Main ----------------------------------
def main():
    while True:
        print("\n" + "="*30)
        print("   ENCODER / DECODER PRO   ")
        print("="*30)
        print("1 - Encryption\n2 - Decryption\n3 - Exit")
        
        choice = input("\nChoose action: ").strip()
        
        if choice == '1':
            text_input = input("Enter your text: ")
            encryption(text_input)
        elif choice == '2':
            decryption()
        elif choice == '3':
            print("Goodbye!")
            break
        else:
            print("Invalid input. Please choose 1, 2, or 3.")

if __name__ == "__main__":
    main()
