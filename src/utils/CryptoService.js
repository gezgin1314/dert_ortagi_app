/**
 * src/utils/CryptoService.js
 * * Tarayıcının Web Cryptography API'sini (window.crypto.subtle) kullanarak
 * Gerçek AES-GCM (256-bit) Şifreleme ve Çözme işlemlerini gerçekleştirir.
 * * Bu, simülasyon DEĞİL, gerçek kriptografik işlemdir.
 */

// Sabitler
const AES_GCM_ALGORITHM = { name: "AES-GCM", ivLength: 12 }; // 12-byte IV (Initialization Vector)
const KEY_USAGE = ["encrypt", "decrypt"];
const KEY_LENGTH = 256; // 256-bit AES anahtarı

/**
 * Anahtarı rastgele bir string'den (password) türetmek için
 * PBKDF2 (Password-Based Key Derivation Function 2) kullanır.
 * * @param {string} password Kullanıcı/sohbet anahtarı
 * @param {Uint8Array} salt Anahtar türetme için kullanılan tuz (salt)
 * @returns {Promise<CryptoKey>} Türetilmiş CryptoKey nesnesi
 */
const deriveKey = async (password, salt) => {
    // Şifreyi Uint8Array'e dönüştür
    const passwordBytes = new TextEncoder().encode(password);

    // Anahtarı import et (raw formatında)
    const baseKey = await window.crypto.subtle.importKey(
        "raw",
        passwordBytes,
        { name: "PBKDF2" },
        false, // Dışa aktarılamaz
        ["deriveKey"]
    );

    // PBKDF2 parametreleri (Yüksek Güvenlik İçin İterasyonlar Yüksek Olmalı)
    const pbkdf2Params = {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000, // Yüksek iterasyon sayısı güvenliği artırır
        hash: "SHA-256",
    };

    // Anahtarı türet
    return window.crypto.subtle.deriveKey(
        pbkdf2Params,
        baseKey,
        { name: AES_GCM_ALGORITHM.name, length: KEY_LENGTH },
        false, // Dışa aktarılamaz
        KEY_USAGE
    );
};

/**
 * Bir mesajı AES-GCM ile şifreler.
 * * Şifreli çıktı formatı: [IV (12 byte)] + [Salt (16 byte)] + [Ciphertext + AuthTag]
 * Tümü Base64 ile kodlanır.
 * * @param {string} plaintext Şifrelenecek düz metin.
 * @param {string} conversationKey Sohbet anahtarı (şifre).
 * @returns {Promise<{success: boolean, data: string, elapsedTimeMs: number, error?: string}>}
 */
const encrypt = async (plaintext, conversationKey) => {
    const startTime = performance.now();
    try {
        // 1. Rastgele IV ve Salt Oluştur
        const iv = window.crypto.getRandomValues(new Uint8Array(AES_GCM_ALGORITHM.ivLength));
        const salt = window.crypto.getRandomValues(new Uint8Array(16));

        // 2. Anahtarı Türet
        const key = await deriveKey(conversationKey, salt);

        // 3. Metni şifrele
        const encoded = new TextEncoder().encode(plaintext);
        const algorithm = { name: AES_GCM_ALGORITHM.name, iv: iv };
        
        const ciphertextBuffer = await window.crypto.subtle.encrypt(
            algorithm,
            key,
            encoded
        );

        // 4. Sonuçları birleştir: IV + Salt + Ciphertext (ArrayBuffer)
        const totalLength = iv.byteLength + salt.byteLength + ciphertextBuffer.byteLength;
        const result = new Uint8Array(totalLength);
        
        // IV'yi kopyala
        result.set(iv, 0); 
        // Salt'ı kopyala
        result.set(salt, iv.byteLength); 
        // Şifreli metin (Ciphertext + AuthTag) kopyala
        result.set(new Uint8Array(ciphertextBuffer), iv.byteLength + salt.byteLength);

        // 5. Base64 olarak döndür
        const base64Ciphertext = btoa(String.fromCharCode.apply(null, result));

        const elapsedTimeMs = performance.now() - startTime;
        return { success: true, data: base64Ciphertext, elapsedTimeMs };

    } catch (e) {
        console.error("AES-GCM Şifreleme Hatası:", e);
        const elapsedTimeMs = performance.now() - startTime;
        return { success: false, data: "", elapsedTimeMs, error: e.message || 'Unknown encryption error' };
    }
};

/**
 * Şifreli bir mesajı AES-GCM ile çözer.
 * * @param {string} base64Ciphertext Base64 kodlanmış şifreli metin ([IV] + [Salt] + [Ciphertext + AuthTag]).
 * @param {string} conversationKey Sohbet anahtarı (şifre).
 * @returns {Promise<{success: boolean, data: string, elapsedTimeMs: number, error?: string}>}
 */
const decrypt = async (base64Ciphertext, conversationKey) => {
    const startTime = performance.now();
    try {
        // 1. Base64 Çözme
        const binaryString = atob(base64Ciphertext);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 2. Parçaları ayır
        const ivLength = AES_GCM_ALGORITHM.ivLength; // 12
        const saltLength = 16;
        
        const iv = bytes.subarray(0, ivLength);
        const salt = bytes.subarray(ivLength, ivLength + saltLength);
        const ciphertextWithTag = bytes.subarray(ivLength + saltLength);

        // 3. Anahtarı Türet
        const key = await deriveKey(conversationKey, salt);

        // 4. Şifreyi Çöz
        const algorithm = { name: AES_GCM_ALGORITHM.name, iv: iv };
        
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            algorithm,
            key,
            ciphertextWithTag
        );

        // 5. Metne Dönüştür
        const plaintext = new TextDecoder().decode(decryptedBuffer);

        const elapsedTimeMs = performance.now() - startTime;
        return { success: true, data: plaintext, elapsedTimeMs };

    } catch (e) {
        // Çözme hatası genellikle Auth Tag'in eşleşmemesi, yani
        // anahtarın veya verinin kurcalanması anlamına gelir.
        console.error("AES-GCM Çözme Hatası:", e);
        const elapsedTimeMs = performance.now() - startTime;
        return { success: false, data: "", elapsedTimeMs, error: "Decryption failed (Authentication Tag mismatch or corrupt data)." };
    }
};


export const CryptoService = {
    encrypt: encrypt,
    decrypt: decrypt,
    
    /**
     * Sistemin bu tarayıcıda Web Crypto API'sini destekleyip desteklemediğini kontrol eder.
     * @returns {boolean}
     */
    isSupported: () => {
        return typeof window !== 'undefined' && window.crypto && window.crypto.subtle;
    },

    /**
     * Hata ayıklama amaçlı bir test çalıştırır.
     * @param {string} text Test metni.
     * @param {string} key Test anahtarı.
     * @returns {Promise<boolean>}
     */
    runTest: async (text, key) => {
        if (!CryptoService.isSupported()) return false;
        try {
            const encrypted = await encrypt(text, key);
            if (!encrypted.success) return false;
            
            const decrypted = await decrypt(encrypted.data, key);
            return decrypted.success && decrypted.data === text;

        } catch (e) {
            console.error("Kripto Test Hatası:", e);
            return false;
        }
    }
};
```eof

Sırada, projemizin bir sonraki önemli parçası olan **Firebase Yapılandırması (`src/firebase.config.js`)** var.
