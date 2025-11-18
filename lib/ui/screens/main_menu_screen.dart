import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dert_ortagi_app/core/constants/app_data.dart';
import 'package:dert_ortagi_app/core/state/app_notifier.dart';
import 'package:dert_ortagi_app/core/models/app_user.dart';

class MainMenuScreen extends StatefulWidget {
  const MainMenuScreen({super.key});

  @override
  State<MainMenuScreen> createState() => _MainMenuScreenState();
}

class _MainMenuScreenState extends State<MainMenuScreen> {
  String? _selectedTopicKey;
  int _selectedGroupSize = 3;

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppNotifier>(context);
    final AppUser? currentUser = appState.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('DERT ORTAĞI V1.0 - CYBERPUNK EDITION'),
        backgroundColor: const Color(0xFF1B1B1B),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Text('Karma: ${currentUser?.karmaScore.toStringAsFixed(1) ?? 'N/A'}',
              style: const TextStyle(color: Color(0xFF00FF41))),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: appState.logOut,
            color: Colors.redAccent,
          ),
        ],
      ),
      body: Row(
        children: [
          // Sol Panel: Kategori Listesi
          Expanded(
            flex: 3,
            child: _buildTopicList(appState),
          ),
          // Sağ Panel: Seçenekler ve Eşleşme Başlatma
          Expanded(
            flex: 2,
            child: _buildMatchingOptions(appState),
          ),
        ],
      ),
    );
  }

  Widget _buildTopicList(AppNotifier appState) {
    return Container(
      color: const Color(0xFF2C3E50), // Koyu Mavi Gri
      child: ListView.builder(
        itemCount: AppData.kGroupTopics.length,
        itemBuilder: (context, index) {
          final topic = AppData.kGroupTopics[index];
          final bool isSelected = topic['topicKey'] == _selectedTopicKey;
          
          return ListTile(
            leading: Icon(
              topic['icon'] as IconData,
              color: isSelected ? const Color(0xFF00FF41) : topic['color'] as Color,
            ),
            title: Text(
              topic['displayName'] as String,
              style: TextStyle(
                color: isSelected ? const Color(0xFF00FF41) : Colors.white70,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            subtitle: Text(
              topic['description'] as String,
              style: const TextStyle(color: Colors.white54, fontSize: 10),
            ),
            onTap: () {
              setState(() {
                _selectedTopicKey = topic['topicKey'] as String;
              });
            },
          );
        },
      ),
    );
  }

  Widget _buildMatchingOptions(AppNotifier appState) {
    return Container(
      color: const Color(0xFF34495E), // Orta Koyu Gri
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Grup Büyüklüğü Seç:', style: TextStyle(color: Colors.white, fontSize: 16)),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSizeButton(2),
              _buildSizeButton(3),
              _buildSizeButton(4),
            ],
          ),
          const SizedBox(height: 30),
          ElevatedButton(
            onPressed: appState.isLoading || _selectedTopicKey == null
                ? null
                : () {
                    appState.startMatching(
                      topicKey: _selectedTopicKey!,
                      desiredGroupSize: _selectedGroupSize,
                    );
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00FF41), // Neon Yeşil
              minimumSize: const Size(double.infinity, 50),
            ),
            child: appState.isLoading
                ? const CircularProgressIndicator(color: Colors.black)
                : Text(
                    _selectedTopicKey == null ? 'Kategori Seç' : 'EŞLEŞMEYİ BAŞLAT (${_selectedGroupSize} Kişilik)',
                    style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                  ),
          ),
          if (appState.errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text("HATA: ${appState.errorMessage}", style: const TextStyle(color: Colors.redAccent)),
            ),
        ],
      ),
    );
  }

  Widget _buildSizeButton(int size) {
    final bool isSelected = size == _selectedGroupSize;
    return ChoiceChip(
      label: Text('$size Kişi'),
      selected: isSelected,
      selectedColor: const Color(0xFF00FF41),
      labelStyle: TextStyle(color: isSelected ? Colors.black : Colors.white),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedGroupSize = size;
          });
        }
      },
      backgroundColor: const Color(0xFF5D6D7E),
    );
  }
}
