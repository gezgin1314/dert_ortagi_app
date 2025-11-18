/**
 * App.jsx
 *
 * * Amaç: Uygulamanın ana iskeletini oluşturur, Firebase'i başlatır,
 * * kullanıcı kimliğini yönetir ve sayfa (ekran) geçişlerini sağlar.
 * * Özellikler: Durum tabanlı basit navigasyon.
 */
import React, { useState, useEffect } from 'react';
import { Home, MessageSquare, Video, Loader, LogOut, User } from 'lucide-react';
import { auth, signInAnonymouslyOrWithCustomToken } from './src/firebase.config.js';

// Ekranları içeri aktar
import HomeScreen from './src/screens/HomeScreen.jsx';
import ChatScreen from './src/screens/ChatScreen.jsx';
import ReelsScreen from './src/screens/ReelsScreen.jsx';

// Uygulama ekranlarını tanımla
const SCREENS = {
    HOME: 'home',
    CHAT: 'chat',
    REELS: 'reels',
};

// Ana Uygulama Bileşeni
const App = () => {
    // Navigasyon durumu
    const [currentScreen, setCurrentScreen] = useState(SCREENS.HOME);
    // Kimlik doğrulama ve yükleme durumu
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    // 1. Firebase Başlatma ve Kimlik Doğrulama
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Özel token varsa onunla giriş yap, yoksa anonim giriş yap
                const user = await signInAnonymouslyOrWithCustomToken();
                setUserId(user.uid);
                console.log("Firebase Auth Başarılı. Kullanıcı ID:", user.uid);
            } catch (error) {
                console.error("Firebase Kimlik Doğrulama Hatası:", error);
                // Hata durumunda bile anonim ID oluşturup devam et (UI'ı kırmamak için)
                setUserId('auth-error-anon');
            } finally {
                setLoading(false);
            }
        };

        initializeApp();

        // Auth durumu dinleyicisi (gereksiz olsa da iyi uygulama için)
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setUserId(user.uid);
            }
        });

        return () => unsubscribe();
    }, []);

    // 2. Aktif Ekranı Yükleme Mantığı
    const renderScreen = () => {
        switch (currentScreen) {
            case SCREENS.HOME:
                return <HomeScreen setCurrentScreen={setCurrentScreen} />;
            case SCREENS.CHAT:
                return <ChatScreen />;
            case SCREENS.REELS:
                return <ReelsScreen />;
            default:
                return <HomeScreen setCurrentScreen={setCurrentScreen} />;
        }
    };

    // Yükleme Durumu
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <Loader className="animate-spin text-blue-500 mr-3" size={32} />
                <h1 className="text-xl font-semibold">Uygulama Başlatılıyor...</h1>
            </div>
        );
    }

    // Kullanıcı Kimlik Bilgilerini Gösterme
    const CurrentUserCard = () => (
        <div className="absolute top-4 right-4 bg-gray-700/80 backdrop-blur-sm text-xs text-white p-2 rounded-lg shadow-xl flex items-center space-x-2 z-50 border border-gray-600">
            <User size={14} className="text-green-400" />
            <span className="font-mono truncate max-w-[150px]">ID: {userId}</span>
            <button
                onClick={() => auth.signOut()}
                className="text-red-400 hover:text-red-300 transition"
                title="Çıkış Yap"
            >
                <LogOut size={14} />
            </button>
        </div>
    );

    // 3. Ana Arayüz (Navigasyon Çubuğu ve Ekran)
    return (
        <div className="flex flex-col h-screen max-w-lg mx-auto bg-gray-900">
            
            {/* Kullanıcı Bilgi Kartı */}
            <CurrentUserCard />

            {/* Ekran İçeriği */}
            <div className="flex-grow overflow-hidden">
                {renderScreen()}
            </div>

            {/* Alt Navigasyon Çubuğu */}
            <nav className="flex justify-around items-center h-16 bg-gray-800 border-t border-gray-700 shadow-2xl">
                {Object.keys(SCREENS).map(key => {
                    const screenName = SCREENS[key];
                    const isActive = currentScreen === screenName;
                    let Icon;
                    let label;

                    switch (screenName) {
                        case SCREENS.HOME:
                            Icon = Home;
                            label = 'Ana Sayfa';
                            break;
                        case SCREENS.CHAT:
                            Icon = MessageSquare;
                            label = 'Şifreli Sohbet';
                            break;
                        case SCREENS.REELS:
                            Icon = Video;
                            label = 'Video Akışı';
                            break;
                        default:
                            Icon = Home;
                            label = '';
                    }

                    return (
                        <button
                            key={key}
                            onClick={() => setCurrentScreen(screenName)}
                            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300
                                ${isActive ? 'text-blue-400 transform scale-110' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Icon size={24} />
                            <span className="text-xs mt-1">{label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default App;
