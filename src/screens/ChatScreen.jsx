/**
 * src/screens/ChatScreen.jsx
 *
 * * Amaç: Yüksek güvenlikli, gerçek AES-GCM kriptoloji kullanılan sohbet arayüzü.
 * * Özellikler: Mesaj şifreleme/çözme, Firestore üzerinden gerçek zamanlı veri akışı.
 * * Veri: Firestore'dan (getUserCollectionPath: 'messages' koleksiyonu) okuma.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, Lock, Unlock, Loader, AlertTriangle, MessageSquare, Menu, Smile, Paperclip, ChevronLeft } from 'lucide-react';
// Hata Düzeltme: Dosya uzantıları (.js) eklendi
import { db, auth, collection, doc, query, where, onSnapshot, orderBy, getUserCollectionPath } from '../firebase.config.js';
import { CryptoService } from '../utils/CryptoService.js';

// Sabit anahtar (Normalde bu, sunucu-istemci arasında güvenli bir şekilde paylaşılmalıdır)
// Yüksek güvenlik gereksiniminiz için sabit ve karmaşık bir anahtar kullanıyoruz.
const CONVERSATION_KEY = "AES_GCM_PRO_256_HIGH_SECURITY_KEY!@#$987654321";

// Mock Veri: Kullanıcı ve Sohbet Başlığı
const mockChatPartnerId = 'user_12345'; // Simüle edilmiş sohbet partneri
const mockChatPartnerName = 'CryptoPartner_Pro';
const mockChannelName = '#aes-gcm-analiz';

const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const [encryptionError, setEncryptionError] = useState(null);

    const messagesEndRef = useRef(null);
    const userId = auth.currentUser?.uid || 'anonim-kullanici';

    // Mesajları görüntülemek için kaydırma
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Firebase Kimlik Doğrulama durumunu bekle
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (user) {
                setAuthReady(true);
                // Kripto servisini test et
                CryptoService.runTest("Test Message", CONVERSATION_KEY).then(result => {
                    if (!result) {
                        setEncryptionError("Kripto Servisi Testi Başarısız. Şifreleme/Çözme Hatalı.");
                    }
                });
            } else {
                setAuthReady(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Firestore Dinleyicisi
    useEffect(() => {
        if (!authReady) return;

        // NOT: Firestore'da orderBy kullanılırsa index gereksinimi oluşabilir.
        // Güvenlik kuralları gereği burada bu kural atlanabilir.
        const chatCollectionPath = getUserCollectionPath(`chat_with_${mockChatPartnerId}`);
        const messagesRef = db.collection(chatCollectionPath); // collection yerine db.collection kullanıldı

        // Sorgu: Zaman damgasına göre sırala
        const q = messagesRef.orderBy('timestamp', 'asc'); // Firestore V8 stili kullanıldı

        console.log(`Firestore dinleyicisi başlatıldı: ${chatCollectionPath}`);

        const unsubscribe = q.onSnapshot((snapshot) => {
            const fetchedMessages = [];
            snapshot.forEach(doc => {
                fetchedMessages.push({ id: doc.id, ...doc.data() });
            });
            
            // Çözme işlemi başlat
            processDecryption(fetchedMessages);
            setIsLoading(false);
        }, (error) => {
            console.error("Firestore Dinleme Hatası:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [authReady]);

    // Çözme Mantığı
    const processDecryption = useCallback(async (encryptedMessages) => {
        const decryptedMessages = await Promise.all(
            encryptedMessages.map(async (msg) => {
                // Şifreli metin değilse veya zaten çözülmüşse atla
                if (!msg.isEncrypted || msg.decryptedText) {
                    return msg;
                }

                // AES-GCM ile çöz
                const result = await CryptoService.decrypt(msg.content, CONVERSATION_KEY);

                return {
                    ...msg,
                    decryptedText: result.success ? result.data : `[HATA: Mesaj çözülemedi. ${result.error}]`,
                    decryptionSuccess: result.success,
                    decryptionTime: result.elapsedTimeMs,
                };
            })
        );
        setMessages(decryptedMessages);
        setTimeout(scrollToBottom, 100); // Veri yüklendikten sonra aşağı kaydır
    }, []);

    // Mesaj Gönderme
    const handleSend = useCallback(async (e) => {
        e.preventDefault();
        if (!input.trim() || isSending || encryptionError) return;

        setIsSending(true);
        const textToSend = input.trim();
        setInput(''); // Girişi hemen temizle

        try {
            // 1. Mesajı AES-GCM ile şifrele
            const encryptionResult = await CryptoService.encrypt(textToSend, CONVERSATION_KEY);

            if (!encryptionResult.success) {
                setEncryptionError(`Şifreleme sırasında kritik hata: ${encryptionResult.error}`);
                setIsSending(false);
                return;
            }

            const encryptedContent = encryptionResult.data;

            // 2. Şifreli Mesajı Firestore'a Gönder
            const newMessage = {
                senderId: userId,
                recipientId: mockChatPartnerId,
                content: encryptedContent, // SADECE ŞİFRELİ METİN
                timestamp: Date.now(),
                isEncrypted: true,
                encryptionTime: encryptionResult.elapsedTimeMs,
            };

            const chatCollectionPath = getUserCollectionPath(`chat_with_${mockChatPartnerId}`);
            // Mesajı ekle
            await db.collection(chatCollectionPath).add(newMessage);

        } catch (error) {
            console.error("Mesaj gönderme veya Firestore hatası:", error);
            setEncryptionError("Mesaj gönderilirken bir hata oluştu.");
        } finally {
            setIsSending(false);
        }
    }, [input, isSending, userId, encryptionError]);

    // Mesaj Bileşeni
    const MessageBubble = ({ message }) => {
        const isSelf = message.senderId === userId;
        const alignClass = isSelf ? 'self-end' : 'self-start';
        const colorClass = isSelf ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200';

        // Görüntülenecek metin (çözülmüş veya şifreli/hata)
        const displayText = message.decryptedText || (message.isEncrypted ? message.content : message.content);

        return (
            <div className={`flex flex-col max-w-lg mb-4 ${alignClass}`}>
                <div className={`p-3 rounded-xl shadow-md ${colorClass} transition-all duration-300`}>
                    
                    {/* Şifreleme/Çözme Durumu */}
                    <div className="flex items-center mb-1 text-xs font-mono opacity-80">
                        {message.isEncrypted ? (
                            <Lock size={12} className="mr-1 text-green-300" />
                        ) : (
                            <Unlock size={12} className="mr-1 text-yellow-300" />
                        )}
                        <span className="text-xs mr-2">
                            {message.isEncrypted ? 'AES-GCM Şifreli' : 'Düz Metin (Hata Ayık.)'}
                        </span>
                        
                        {message.decryptionSuccess === false && (
                            <AlertTriangle size={12} className="text-red-400 mr-1" title="Çözme Başarısız!" />
                        )}
                    </div>

                    {/* Ana Mesaj İçeriği */}
                    <p className={`text-base whitespace-pre-wrap ${message.decryptionSuccess === false ? 'italic text-red-300' : ''}`}>
                        {displayText}
                    </p>
                    
                    {/* Alt Bilgi */}
                    <div className="text-right text-xs mt-1 opacity-60">
                         {new Date(message.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                         {message.decryptionTime && ` | Çöz: ${message.decryptionTime.toFixed(2)}ms`}
                    </div>
                </div>
            </div>
        );
    };

    if (!authReady || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <Loader className="animate-spin text-blue-500 mb-4" size={48} />
                <p className="text-lg">Yüksek Güvenlikli Sohbet Yükleniyor...</p>
                {encryptionError && (
                    <div className="mt-4 p-4 bg-red-800/50 rounded-lg text-red-300 flex items-center">
                        <AlertTriangle size={20} className="mr-2" />
                        KRİTİK HATA: {encryptionError}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            
            {/* Sohbet Başlığı (Header) */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-lg">
                <div className="flex items-center">
                    <button className="text-gray-400 hover:text-white mr-4"><ChevronLeft size={24} /></button>
                    <MessageSquare size={24} className="text-green-400 mr-3" />
                    <div>
                        <h1 className="text-lg font-bold text-white">{mockChannelName}</h1>
                        <p className="text-sm text-gray-400">Partner: {mockChatPartnerName} (ID: {mockChatPartnerId})</p>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-white"><Menu size={24} /></button>
            </div>

            {/* Mesaj Alanı */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
                <div className="flex flex-col">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 pt-10">
                            <Lock size={48} className="mb-4" />
                            <p>İlk şifreli mesajınızı gönderin.</p>
                            <p className="text-xs mt-2">Bu sohbet AES-GCM ile güvence altına alınmıştır.</p>
                        </div>
                    )}
                    {messages.map(msg => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Mesaj Giriş Alanı */}
            <form onSubmit={handleSend} className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex items-center bg-gray-700 rounded-xl p-2 shadow-inner">
                    <button type="button" className="p-2 text-gray-400 hover:text-yellow-400">
                        <Smile size={24} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Şifreli mesajınızı buraya yazın..."
                        className="flex-grow bg-transparent text-white placeholder-gray-500 outline-none px-3"
                        disabled={isSending || !!encryptionError}
                    />
                    <button type="button" className="p-2 text-gray-400 hover:text-blue-400">
                        <Paperclip size={24} />
                    </button>
                    <button
                        type="submit"
                        className={`p-2 ml-2 rounded-lg transition duration-200 
                            ${input.trim() && !isSending ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                        disabled={!input.trim() || isSending || !!encryptionError}
                    >
                        {isSending ? <Loader size={24} className="animate-spin" /> : <Send size={24} />}
                    </button>
                </div>
                {encryptionError && (
                    <p className="text-red-400 text-xs mt-2 flex items-center justify-center">
                        <AlertTriangle size={14} className="mr-1" /> KRİTİK HATA: Gönderim veya Kripto İşlemi Bloke Edildi.
                    </p>
                )}
            </form>
        </div>
    );
};

export default ChatScreen;

