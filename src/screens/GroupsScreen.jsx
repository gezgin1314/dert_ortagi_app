/**
 * src/screens/GroupsScreen.jsx
 *
 * * Amaç: Discord tarzı, çok sütunlu, yüksek performanslı grup/kanal navigasyon arayüzü.
 * * Özellikler: Solda Sunucular (Gruplar), ortada Kanallar, sağda Üye Listesi.
 * * Veri: Firestore'dan (getPublicCollectionPath: 'channels' koleksiyonu) okuma simülasyonu.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Hash, Users, Zap, Settings, Plus, X, List, Mic, Volume2, User, ChevronDown, Activity, Loader } from 'lucide-react';
import { db, collection, query, onSnapshot, getPublicCollectionPath } from '../firebase.config';

// Sunucu/Grup Verisi (Sabit Simülasyon Verisi)
const mockServers = [
    { id: '1', name: 'PROFESYONEL HUB', icon: 'zap', color: 'bg-blue-600', description: 'Geliştiriciler ve Analistler' },
    { id: '2', name: 'KRİPTO GRUP', icon: 'zap', color: 'bg-indigo-600', description: 'AES-GCM Uzmanları' },
    { id: '3', name: 'REELS KULÜBÜ', icon: 'zap', color: 'bg-red-600', description: 'Kısa Video İçerik Üreticileri' },
];

// Mock Kanal Verisi
const mockChannels = [
    { id: 'c1', serverId: '1', name: 'genel-sohbet', type: 'text', icon: Hash, status: 'new' },
    { id: 'c2', serverId: '1', name: 'kripto-tartışma', type: 'text', icon: Hash, status: 'unread' },
    { id: 'c3', serverId: '1', name: 'geliştirici-ses', type: 'voice', icon: Mic, status: 'active' },
    { id: 'c4', serverId: '1', name: 'duyurular', type: 'text', icon: Volume2, status: 'read' },

    { id: 'c5', serverId: '2', name: 'aes-gcm-pro', type: 'text', icon: Hash, status: 'new' },
    { id: 'c6', serverId: '2', name: 'pbkdf2-analiz', type: 'text', icon: Hash, status: 'read' },
    
    { id: 'c7', serverId: '3', name: 'reels-paylaşım', type: 'text', icon: Hash, status: 'new' },
    { id: 'c8', serverId: '3', name: 'sesli-yayını', type: 'voice', icon: Mic, status: 'read' },
];

const mockUsers = [
    { id: 'u1', name: 'Alice_Dev', status: 'online', role: 'Admin' },
    { id: 'u2', name: 'Bob_Crypto', status: 'online', role: 'Geliştirici' },
    { id: 'u3', name: 'Charlie_Reels', status: 'idle', role: 'İçerikçi' },
    { id: 'u4', name: 'Diana_Analist', status: 'offline', role: 'Analist' },
    { id: 'u5', name: 'Guest_User', status: 'online', role: 'Misafir' },
    { id: 'u6', name: 'Mustafa_Pro', status: 'online', role: 'CEO' },
];


const ServerIcon = ({ server, isSelected, onClick }) => (
    <div
        className={`w-14 h-14 rounded-3xl mb-2 flex items-center justify-center cursor-pointer transition-all duration-200 group relative
            ${isSelected ? 'rounded-2xl ' + server.color : 'hover:rounded-2xl hover:bg-gray-700/50 ' + server.color}
            ${!isSelected ? 'bg-gray-700/80 hover:bg-gray-600/50' : ''}
            shadow-lg
        `}
        onClick={() => onClick(server.id)}
        title={server.name}
    >
        {/* Seçili Durum Göstergesi */}
        <div className={`absolute left-[-12px] h-6 w-1.5 rounded-r-lg bg-white transition-all duration-200 ${isSelected ? 'h-10' : 'h-2 group-hover:h-5'}`}></div>

        {/* İkon / Baş harf */}
        <div className={`text-xl font-bold text-white uppercase`}>
            {server.name.charAt(0)}
        </div>
    </div>
);


const ChannelItem = ({ channel, isSelected, onClick }) => {
    const Icon = channel.icon;
    const isUnread = channel.status === 'unread' || channel.status === 'new';

    return (
        <div
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-150 relative
                ${isSelected ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:bg-gray-600/50 hover:text-gray-200'}
                ${isUnread && !isSelected ? 'text-white font-semibold' : ''}
            `}
            onClick={() => onClick(channel)}
        >
            <Icon size={18} className="mr-2" />
            <span className="truncate">{channel.name}</span>
            {isUnread && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500"></span>
            )}
        </div>
    );
};


const UserStatusIcon = ({ status }) => {
    const baseClasses = "w-3 h-3 rounded-full border-2 absolute bottom-0 right-0";
    let statusClass = "bg-gray-400 border-gray-700"; // Offline/Default
    if (status === 'online') statusClass = "bg-green-500 border-gray-800";
    else if (status === 'idle') statusClass = "bg-yellow-500 border-gray-800";

    return <div className={`${baseClasses} ${statusClass}`}></div>;
};

const MemberListItem = ({ user }) => (
    <div className="flex items-center p-2 rounded-lg hover:bg-gray-600/50 transition-colors duration-100 cursor-pointer">
        <div className="relative mr-3">
            <User size={24} className={`text-gray-400 ${user.status === 'offline' ? 'opacity-50' : ''}`} />
            <UserStatusIcon status={user.status} />
        </div>
        <div>
            <span className={`text-sm font-medium ${user.status === 'online' ? 'text-white' : 'text-gray-400'}`}>
                {user.name}
            </span>
            <p className="text-xs text-blue-400">{user.role}</p>
        </div>
    </div>
);


const GroupsScreen = ({ navigation }) => {
    const [selectedServer, setSelectedServer] = useState(mockServers[0].id);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [channels, setChannels] = useState([]);
    
    // Firestore'dan kanalları simüle etme (onSnapshot dinleyicisi)
    useEffect(() => {
        // Normalde burada canlı bir Firestore dinleyicisi başlatılır:
        // const q = query(collection(db, getPublicCollectionPath('channels')));
        
        // Simülasyon: Veri yükleniyor...
        const timer = setTimeout(() => {
            setChannels(mockChannels);
            setIsLoading(false);
            // Başlangıçta ilk sunucunun ilk kanalını seç
            const initialChannel = mockChannels.find(c => c.serverId === mockServers[0].id);
            if (initialChannel) setSelectedChannel(initialChannel);
        }, 800);

        return () => clearTimeout(timer); // Temizlik
    }, []);


    // Seçili sunucuya ait kanalları filtrele
    const filteredChannels = useMemo(() => {
        return channels
            .filter(c => c.serverId === selectedServer)
            .sort((a, b) => a.type === 'voice' ? 1 : -1); // Sesli kanalları sona at
    }, [channels, selectedServer]);


    const handleChannelSelect = useCallback((channel) => {
        setSelectedChannel(channel);
        // Gerçek uygulamada navigasyon yapılır:
        // navigation.navigate('ChatScreen', { channelId: channel.id, channelName: channel.name });
        console.log(`Navigasyon simülasyonu: ${channel.name} sohbetine gidiliyor.`);
    }, []);


    const handleAddChannel = () => {
        alert('Bu özellik premium kullanıcılar için yakında geliyor!'); // alert yerine daha şık bir modal kullanılmalı
    };

    const currentServer = mockServers.find(s => s.id === selectedServer) || mockServers[0];

    return (
        <div className="flex h-screen bg-gray-900 text-white">

            {/* Sütun 1: Sunucu Listesi */}
            <div className="w-20 bg-gray-800 flex flex-col items-center p-3 overflow-y-auto shadow-xl">
                {mockServers.map(server => (
                    <ServerIcon
                        key={server.id}
                        server={server}
                        isSelected={server.id === selectedServer}
                        onClick={setSelectedServer}
                    />
                ))}
                {/* Yeni Grup Ekle Düğmesi */}
                <div 
                    className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-green-400 cursor-pointer hover:bg-green-500 hover:text-white transition duration-200 mt-4"
                    title="Yeni Grup Oluştur"
                    onClick={handleAddChannel}
                >
                    <Plus size={24} />
                </div>
            </div>

            {/* Sütun 2: Kanal Listesi */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shadow-2xl">
                {/* Sunucu Başlığı */}
                <div className="p-4 flex justify-between items-center border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition">
                    <h3 className="text-lg font-bold truncate">{currentServer.name}</h3>
                    <ChevronDown size={18} className="text-gray-400" />
                </div>

                {/* Kanal Listesi */}
                <div className="p-2 flex-grow overflow-y-auto space-y-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full text-blue-400">
                            <Loader className="animate-spin mr-2" size={24} /> Kanallar Yükleniyor...
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Metin Kanalları */}
                            <p className="text-xs text-gray-500 uppercase mt-4">Metin Kanalları</p>
                            {filteredChannels
                                .filter(c => c.type === 'text')
                                .map(channel => (
                                    <ChannelItem
                                        key={channel.id}
                                        channel={channel}
                                        isSelected={selectedChannel && channel.id === selectedChannel.id}
                                        onClick={handleChannelSelect}
                                    />
                                ))}

                            {/* Sesli Kanallar */}
                            <p className="text-xs text-gray-500 uppercase pt-4">Sesli Kanallar</p>
                            {filteredChannels
                                .filter(c => c.type === 'voice')
                                .map(channel => (
                                    <ChannelItem
                                        key={channel.id}
                                        channel={channel}
                                        isSelected={selectedChannel && channel.id === selectedChannel.id}
                                        onClick={handleChannelSelect}
                                    />
                                ))}
                        </div>
                    )}
                </div>

                {/* Kullanıcı Profili/Ayarlar Alt Alanı */}
                <div className="p-3 bg-gray-700 border-t border-gray-600 flex items-center justify-between">
                    <div className="flex items-center cursor-pointer">
                        <div className="relative mr-2">
                            <User size={28} className="text-blue-400" />
                            <UserStatusIcon status="online" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-white">Guest_User</span>
                            <p className="text-xs text-gray-400">#Anonim</p>
                        </div>
                    </div>
                    <button 
                        className="p-1.5 rounded-full hover:bg-gray-600 transition"
                        title="Ayarlar"
                        onClick={() => alert("Ayarlar Ekranına Yönlendiriliyor...")}
                    >
                        <Settings size={20} className="text-gray-400 hover:text-white" />
                    </button>
                </div>
            </div>

            {/* Sütun 3: Ana İçerik Alanı (Şimdilik Boş/Bilgi) */}
            <div className="flex-grow bg-gray-700 flex flex-col justify-center items-center p-8">
                {selectedChannel ? (
                    <div className="text-center">
                        <Hash size={48} className="text-gray-500 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2">#{selectedChannel.name}</h1>
                        <p className="text-gray-400">
                            Burada sohbet mesajları görüntülenecek. Mesajlar, **AES-GCM Pro** ile şifrelenmiş olacaktır.
                        </p>
                        <button 
                            className="mt-6 px-4 py-2 bg-indigo-600 rounded-lg text-white font-semibold hover:bg-indigo-700 transition duration-200 shadow-md"
                            onClick={() => handleChannelSelect(selectedChannel)} // Normalde burası navigasyon tetikler
                        >
                            Sohbete Giriş Yap
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <Activity size={48} className="text-gray-500 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2">Bir Kanal Seçin</h1>
                        <p className="text-gray-400">
                            Başlamak için sol menüden bir grup ve kanal seçin.
                        </p>
                    </div>
                )}
            </div>

            {/* Sütun 4: Üye Listesi */}
            <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 flex flex-col shadow-2xl">
                <h3 className="text-md font-bold text-gray-300 mb-4 flex items-center">
                    <Users size={18} className="mr-2 text-blue-400" /> Aktif Üyeler
                </h3>
                <div className="space-y-3 overflow-y-auto flex-grow">
                    {mockUsers.map(user => (
                        <MemberListItem key={user.id} user={user} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GroupsScreen;
