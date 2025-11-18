/**
 * src/components/HumanVerification.jsx
 *
 * * Amaç: Bot ve otomatik erişimi engellemek için görsel eşleştirme tabanlı
 * "Ben Robot Değilim" (Captcha benzeri) doğrulama bileşeni.
 * * Özellikler: Rastgele ızgara oluşturur ve kullanıcıdan iki özdeş resmi eşleştirmesini ister.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, RefreshCw, Loader } from 'lucide-react';

const icons = [
  'Feather', 'Activity', 'Anchor', 'Aperture', 'BatteryCharging', 'Bell', 'Bookmark', 'Briefcase',
  'Code', 'Coffee', 'Crosshair', 'Database', 'Disc', 'Droplet', 'Feather', 'Figma', 'Zap',
  'Gift', 'Globe', 'HardDrive', 'Heart', 'Infinity', 'Key', 'Lock', 'Mail', 'MessageCircle',
  'MousePointer', 'Octagon', 'Package', 'Paperclip', 'PenTool', 'Pocket', 'Power', 'Radio',
  'RefreshCcw', 'Send', 'Server', 'Settings', 'Shield', 'Speaker', 'Star', 'Sunrise', 'Target',
  'Terminal', 'Thermometer', 'ThumbsUp', 'Tool', 'Umbrella', 'Usb', 'Watch', 'Wifi', 'Zap'
];

/**
 * Rastgele bir ikon eşleştirme ızgarası oluşturur.
 * @param {number} size Izgara boyutu (size x size)
 * @returns {Array<Object>} Dizi formatında ızgara verisi
 */
const initializeGrid = (size = 3) => {
  const totalCells = size * size;
  if (totalCells % 2 !== 0) {
    console.error("Izgara boyutu çift sayıda hücreye sahip olmalıdır.");
    return [];
  }

  // Kullanılacak rastgele ikonları seç
  const selectedIcons = [];
  const requiredPairs = totalCells / 2;
  const availableIcons = [...icons];

  // Yeterli ikon yoksa hata
  if (availableIcons.length < requiredPairs) {
    console.error("Yeterli ikon yok.");
    return [];
  }

  // Eşleşecek çiftleri seç
  for (let i = 0; i < requiredPairs; i++) {
    const randomIndex = Math.floor(Math.random() * availableIcons.length);
    const iconName = availableIcons.splice(randomIndex, 1)[0];
    selectedIcons.push(iconName, iconName);
  }

  // Ikonları karıştır
  for (let i = selectedIcons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedIcons[i], selectedIcons[j]] = [selectedIcons[j], selectedIcons[i]];
  }

  // Izgarayı oluştur
  return selectedIcons.map((iconName, index) => ({
    id: index,
    iconName: iconName,
    isFlipped: false,
    isMatched: false,
  }));
};

// Ikonları Lucide-React'ten dinamik olarak yüklemek için yardımcı fonksiyon
const getIconComponent = (name) => {
    // Lucide-react'ten dinamik olarak ikon bileşenini döndürür
    const IconComponent = require('lucide-react')[name];
    return IconComponent || X; // Bulunamazsa varsayılan olarak X ikonunu kullan
};


const HumanVerification = ({ onVerified }) => {
  const [grid, setGrid] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Lütfen eşleşen iki resmi bulun.");
  const [locked, setLocked] = useState(false); // Yeni kart seçimi için kilitleme durumu

  // Açık olan kartları takip et
  const [flippedCards, setFlippedCards] = useState([]);

  const gridSize = 3; // 3x3 = 9 hücre. Tek sayı olduğu için 4x4'e geçiyoruz.
  const size = 4; // 4x4 = 16 hücre (8 çift) kullanmak daha iyidir.

  // Izgarayı sıfırla ve yeniden başlat
  const resetGame = useCallback(() => {
    setGrid(initializeGrid(size));
    setFlippedCards([]);
    setLocked(false);
    setStatusMessage("Yeniden başlatıldı. Eşleşen iki resmi bulun.");
    setAttempts(attempts => attempts + 1);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Kazanma kontrolü
  useEffect(() => {
    if (grid.length > 0 && grid.every(card => card.isMatched)) {
      setIsProcessing(true);
      setStatusMessage("Başarılı! Doğrulandı...");
      setTimeout(() => {
        onVerified(true); // Ana uygulamaya başarıyı bildir
      }, 1500);
    }
  }, [grid, onVerified]);


  const handleCardClick = (clickedCard) => {
    if (locked || clickedCard.isMatched || flippedCards.some(c => c.id === clickedCard.id)) {
      return; // Kilitliyse, eşleşmişse veya zaten açıksa yoksay
    }

    setGrid(prevGrid =>
      prevGrid.map(card =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
    );

    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);

    // İki kart açıldıysa
    if (newFlippedCards.length === 2) {
      setLocked(true); // Yeni kart seçimini kilitle
      const [card1, card2] = newFlippedCards;

      if (card1.iconName === card2.iconName) {
        // Eşleşme Başarılı
        setStatusMessage("Eşleşme bulundu!");
        setGrid(prevGrid =>
          prevGrid.map(card =>
            card.id === card1.id || card.id === card2.id
              ? { ...card, isMatched: true, isFlipped: true }
              : card
          )
        );
        setTimeout(() => {
          setFlippedCards([]);
          setLocked(false);
        }, 800);
      } else {
        // Eşleşme Başarısız
        setStatusMessage("Hata. Tekrar deneyin.");
        setTimeout(() => {
          setGrid(prevGrid =>
            prevGrid.map(card =>
              card.id === card1.id || card.id === card2.id
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setLocked(false);
        }, 1200);
      }
    } else if (newFlippedCards.length > 2) {
        // Fazla kart açma durumunda sıfırla (olmamalı)
        resetGame();
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-lg bg-gray-800 p-8 rounded-xl shadow-2xl border border-blue-700/50">
        <h2 className="text-3xl font-extrabold text-white mb-2 text-center">
          <span className="text-blue-400">GÜVENLİK KONTROLÜ</span>
        </h2>
        <p className="text-gray-400 mb-6 text-center">
          Bot saldırılarını önlemek için kimliğinizi doğrulayın.
        </p>

        <div className="bg-gray-700 p-4 rounded-lg mb-4 flex justify-between items-center">
            <div className={`font-semibold transition-colors duration-300 ${grid.every(c => c.isMatched) ? 'text-green-400' : 'text-yellow-400'}`}>
                {isProcessing ? <div className="flex items-center"><Loader className="animate-spin mr-2" size={16} /> Doğrulanıyor...</div> : statusMessage}
            </div>
            <button
                onClick={resetGame}
                disabled={isProcessing}
                className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition duration-150 disabled:opacity-50"
                title="Yeniden Başlat"
            >
                <RefreshCw size={20} className="text-white" />
            </button>
        </div>

        {/* Captcha Izgara Alanı */}
        <div 
            className="grid gap-2 p-2"
            style={{ 
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                aspectRatio: '1 / 1' // Kare alan
            }}
        >
          {grid.map(card => {
            const isFlipped = card.isFlipped || card.isMatched;
            const IconComponent = getIconComponent(card.iconName);

            return (
              <div 
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`
                  relative w-full h-full rounded-lg perspective-1000 cursor-pointer transition-transform duration-500
                  ${!isFlipped ? 'hover:scale-[1.02]' : ''}
                `}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Kartın Ön Yüzü (Geri) */}
                <div 
                  className={`
                    absolute inset-0 bg-blue-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-lg
                    backface-hidden transition-all duration-500
                    ${isFlipped ? 'rotate-y-180 opacity-0' : 'rotate-y-0 opacity-100'}
                  `}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  ?
                </div>

                {/* Kartın Arka Yüzü (İkon) */}
                <div 
                  className={`
                    absolute inset-0 rounded-lg flex items-center justify-center shadow-lg
                    backface-hidden transition-all duration-500
                    ${isFlipped ? 'rotate-y-0 opacity-100' : 'rotate-y-180 opacity-0'}
                    ${card.isMatched ? 'bg-green-600' : 'bg-gray-600'}
                  `}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {isFlipped && (
                    <IconComponent size={36} className="text-white" />
                  )}
                  {card.isMatched && <Check size={24} className="absolute top-2 right-2 text-white" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Deneme Sayısı */}
        <p className="text-xs text-gray-500 mt-4 text-center">
            Mevcut Doğrulama Denemesi: {attempts}
        </p>

      </div>
    </div>
  );
};

export default HumanVerification;
