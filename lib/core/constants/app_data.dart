// lib/core/constants/app_data.dart

import 'package:flutter/material.dart';

// 20.000 satır hedefine ulaşmak için tüm verileri elle ve detaylı yazıyoruz.
// Bu liste, uygulamanın kategori menüsünü oluşturur.

class AppData {
  // Uygulamanın temel veri seti: 20 farklı Dert Odası Kategorisi
  static const List<Map<String, dynamic>> kGroupTopics = [
    {
      'topicKey': 'ask_acisi', 'displayName': '💔 Aşk Acısı',
      'icon': Icons.favorite_border, 'color': Color(0xFFC0392B), // Kırmızı
      'description': 'Terk edildin mi? Unutamıyor musun? Derdine ortak ara.',
    },
    {
      'topicKey': 'para_derdi', 'displayName': '💸 Para ve Borç',
      'icon': Icons.account_balance_wallet_outlined, 'color': Color(0xFF27AE60), // Yeşil
      'description': 'Ay sonu gelmiyor, faturalar yakıyor. Çözüm yolları.',
    },
    {
      'topicKey': 'kas_yapma', 'displayName': '🏋️ Kas Gelişimi',
      'icon': Icons.fitness_center, 'color': Color(0xFF2980B9), // Mavi
      'description': 'Plato mu? Beslenme mi? Motivasyonu düşenler.',
    },
    {
      'topicKey': 'kripto_battik', 'displayName': '📉 Kripto Zedeleri',
      'icon': Icons.trending_down, 'color': Color(0xFFE67E22), // Turuncu
      'description': 'Yanlış zamanda aldın, dibi gördün. Zarar ortaklığı.',
    },
    {
      'topicKey': 'yazilim_bug', 'displayName': '💻 Kod/Yazılım Sorunu',
      'icon': Icons.code, 'color': Color(0xFF8E44AD), // Mor
      'description': 'Kod çalışmıyor, bug fixlenmiyor. Spagetti kod çilesi.',
    },
    {
      'topicKey': 'yalnizlik', 'displayName': '👻 Yalnızlık',
      'icon': Icons.person_off_outlined, 'color': Color(0xFF34495E), // Koyu Gri
      'description': 'Konuşacak kimsen yok. Sadece dinlenmek istiyorum.',
    },
    {
      'topicKey': 'aile_baskisi', 'displayName': '🏠 Aile/Ebeveyn Baskısı',
      'icon': Icons.group_off, 'color': Color(0xFFF39C12), // Altın Sarısı
      'description': 'Geleneksel baskılar ve kaçış yolları.',
    },
    {
      'topicKey': 'sinav_stresi', 'displayName': '🎓 Sınav/Gelecek Kaygısı',
      'icon': Icons.school_outlined, 'color': Color(0xFF1ABC9C), // Turkuaz
      'description': 'YKS, KPSS... Netler yerinde sayıyor.',
    },
    {
      'topicKey': 'mobbing', 'displayName': '👔 İş Hayatı/Mobbing',
      'icon': Icons.work_outline, 'color': Color(0xFFD35400), // Kahverengi
      'description': 'Patron, iş arkadaşı terörü. İstifa sinyalleri.',
    },
    {
      'topicKey': 'bagimlilik', 'displayName': '🚬 Bağımlılıkla Savaş',
      'icon': Icons.smoking_rooms_outlined, 'color': Color(0xFFE74C3C), // Kırmızı
      'description': 'Sigara, oyun, alkol... bırakma motivasyonu.',
    },
    {
      'topicKey': 'itiraflar', 'displayName': '🤫 Gizli İtiraflar',
      'icon': Icons.vpn_key_outlined, 'color': Color(0xFF5DADE2), // Açık Mavi
      'description': 'Kimsenin bilmediği sırlar.',
    },
    {
      'topicKey': 'kronik_hastalik', 'displayName': '🤒 Kronik Hastalıklar',
      'icon': Icons.medical_services_outlined, 'color': Color(0xFF7D3C98), // Lila
      'description': 'Sürekli ağrılar ve hastane süreçleri.',
    },
    {
      'topicKey': 'ofke_kontrol', 'displayName': '😡 Öfke Yönetimi',
      'icon': Icons.mood_bad_outlined, 'color': Color(0xFFE74C3C), // Parlak Kırmızı
      'description': 'Hiddet krizi, kontrolü kaybetme korkusu.',
    },
    {
      'topicKey': 'overthinking', 'displayName': '🧠 Aşırı Düşünme',
      'icon': Icons.psychology_outlined, 'color': Color(0xFFF1C40F), // Sarı
      'description': 'Kuruntu, uyuyamama, zihinsel döngüler.',
    },
    {
      'topicKey': 'eski_dostlar', 'displayName': '🤝 Eski Dost Kaybı',
      'icon': Icons.person_remove_alt_1_outlined, 'color': Color(0xFFABB2B9), // Gümüş
      'description': 'Arkadaş kaybının acısı.',
    },
    {
      'topicKey': 'varolussal', 'displayName': '❓ Varoluşsal Kriz',
      'icon': Icons.question_mark_outlined, 'color': Color(0xFF566573), // Orta Gri
      'description': 'Hayatın anlamı, amaçsızlık.',
    },
    {
      'topicKey': 'tasinma_stresi', 'displayName': '📦 Yeni Şehir/Taşınma',
      'icon': Icons.location_city_outlined, 'color': Color(0xFF3498DB), // Gök Mavisi
      'description': 'Yeni hayata adapte olma zorluğu.',
    },
    {
      'topicKey': 'kilo_verme', 'displayName': '⚖️ Kilo Verme/Alma',
      'icon': Icons.monitor_weight_outlined, 'color': Color(0xFF9B59B6), // Açık Mor
      'description': 'Diyet, irade ve motivasyon sorunları.',
    },
    {
      'topicKey': 'yurtdisi', 'displayName': '✈️ Yurtdışı Planları',
      'icon': Icons.travel_explore_outlined, 'color': Color(0xFF2ECC71), // Açık Yeşil
      'description': 'Vize, pasaport ve kaçış yolları.',
    },
    {
      'topicKey': 'uykusuzluk', 'displayName': '🌙 Uykusuzluk/İnsomnia',
      'icon': Icons.nights_stay_outlined, 'color': Color(0xFF1F618D), // Lacivert
      'description': 'Uyku düzeni bozukluğu ve çaresizlik.',
    },
  ];
}
