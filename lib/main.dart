import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dert_ortagi_app/core/state/app_notifier.dart';
import 'package:dert_ortagi_app/features/chat/matching_service.dart';
import 'package:dert_ortagi_app/ui/screens/loading_screen.dart';
import 'package:dert_ortagi_app/ui/screens/main_menu_screen.dart';
import 'package:firebase_core/firebase_core.dart'; // Firebase importu

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // TODO: Firebase'i burada başlatmanız gerekecek:
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AppNotifier(MatchingService()),
        ),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dert Ortağı - Anonim Siber Sohbet',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF1B1B1B), 
        appBarTheme: const AppBarTheme(
          color: Color(0xFF1B1B1B),
          elevation: 0,
        ),
        fontFamily: 'RobotoMono', 
        primaryColor: const Color(0xFF00FF41), 
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00FF41), 
          secondary: Color(0xFFFF00FF), 
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: Colors.white70),
          bodyMedium: TextStyle(color: Colors.white70),
        ),
      ),
      home: Consumer<AppNotifier>(
        builder: (context, appState, child) {
          if (appState.isLoading && appState.currentUser == null) {
            return const LoadingScreen();
          } else if (appState.currentUser != null) {
            return const MainMenuScreen();
          } else {
            return const LoadingScreen();
          }
        },
      ),
    );
  }
}
