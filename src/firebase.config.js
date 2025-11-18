/**
 * src/firebase.config.js
 *
 * Firebase servislerini başlatır, kimlik doğrulama jetonunu kullanır
 * ve uygulamanın tüm Firebase bağımlılıklarını yönetir.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, query, where, onSnapshot, orderBy, setLogLevel } from 'firebase/firestore';

// Hata ayıklama modunu aç (Konsolda Firebase işlemlerini görmek için zorunlu)
setLogLevel('debug');

// --- MANDATORY GLOBAL VARIABLE CHECKS AND PARSING ---

// 1. Firebase yapılandırmasını al
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// 2. Uygulama ID'sini al
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// 3. Başlangıç kimlik doğrulama jetonunu al
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- INITIALIZATION ---

// Uygulamayı başlat (Çift başlatmayı önler)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Servisleri başlat
const auth = getAuth(app);
const db = getFirestore(app);

// --- MANDATORY AUTHENTICATION SETUP ---

/**
 * Platform tarafından sağlanan jetonla veya anonim olarak oturum açmayı dener.
 */
const initializeAuth = async () => {
    try {
        if (initialAuthToken) {
            console.log("Firebase Auth: Custom token ile oturum açılıyor...");
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Firebase Auth: Custom token ile oturum açma başarılı.");
        } else {
            console.log("Firebase Auth: Token yok, anonim oturum açılıyor...");
            await signInAnonymously(auth);
            console.log("Firebase Auth: Anonim oturum açma başarılı.");
        }
    } catch (error) {
        console.error("Firebase Auth başlatma hatası:", error);
    }
};

// Modül yüklendiğinde kimlik doğrulamayı başlat
initializeAuth();

// --- Firestore Yol Yardımcıları (Güvenlik Kurallarına Uyumlu) ---

/**
 * Belirli bir kullanıcının özel verileri için Firestore koleksiyon yolunu döndürür.
 * Yolu: /artifacts/{appId}/users/{userId}/{collectionName}
 * @param {string} collectionName Koleksiyon adı (örn: "messages", "settings")
 * @returns {string} Tam koleksiyon yolu
 */
export const getUserCollectionPath = (collectionName) => {
    const userId = auth.currentUser?.uid || 'anonymous';
    return `artifacts/${appId}/users/${userId}/${collectionName}`;
};

/**
 * Ortak (public) veriler için Firestore koleksiyon yolunu döndürür.
 * Yolu: /artifacts/{appId}/public/data/{collectionName}
 * @param {string} collectionName Koleksiyon adı (örn: "channels", "global_reels")
 * @returns {string} Tam koleksiyon yolu
 */
export const getPublicCollectionPath = (collectionName) => {
    return `artifacts/${appId}/public/data/${collectionName}`;
};

// --- EXPORTLAR ---

// Tüm Firebase hizmetlerini ve yardımcı fonksiyonları dışa aktar
export { db, auth, onAuthStateChanged, collection, doc, query, where, onSnapshot, orderBy };
