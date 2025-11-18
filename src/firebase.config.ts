import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- MANDATORY GLOBAL VARIABLE CHECKS AND PARSING ---

// Retrieve the application ID or use a default
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Parse the Firebase configuration string
let firebaseConfig = null;
try {
    firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
} catch (e) {
    console.error("Failed to parse __firebase_config. Using empty config.", e);
    firebaseConfig = {};
}

// Initialize Firebase App (ensures only one instance is created)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

// --- MANDATORY AUTHENTICATION SETUP ---

// This function handles the initial sign-in using the platform-provided custom token
// or falls back to anonymous sign-in if the token is not available.
const initializeAuth = async () => {
    try {
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        
        if (initialAuthToken) {
            console.log("Authenticating with custom token...");
            // Use the provided custom token for sign-in
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Custom token sign-in successful.");
        } else {
            console.log("Custom token not available. Signing in anonymously...");
            // Fallback to anonymous sign-in
            await signInAnonymously(auth);
            console.log("Anonymous sign-in successful.");
        }
    } catch (error) {
        console.error("Firebase Auth initialization failed:", error);
    }
};

// Execute the authentication setup upon module load
initializeAuth();

// Export the initialized services and app ID for use throughout the application
export { db, auth, appId };
