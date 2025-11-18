import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String senderUid; 
  final String anonymousSenderName;
  final String chatRoomId; 
  final String encryptedContent; 
  final Timestamp timestamp;
  final bool isFlagged; 
  final String? reportReason;

  ChatMessage({
    required this.id,
    required this.senderUid,
    required this.anonymousSenderName,
    required this.chatRoomId,
    required this.encryptedContent,
    required this.timestamp,
    this.isFlagged = false,
    this.reportReason,
  });

  factory ChatMessage.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return ChatMessage(
      id: doc.id,
      senderUid: data['senderUid'] as String,
      anonymousSenderName: data['anonymousSenderName'] as String,
      chatRoomId: data['chatRoomId'] as String,
      encryptedContent: data['encryptedContent'] as String,
      timestamp: data['timestamp'] as Timestamp,
      isFlagged: data['isFlagged'] ?? false,
      reportReason: data['reportReason'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'senderUid': senderUid,
      'anonymousSenderName': anonymousSenderName,
      'chatRoomId': chatRoomId,
      'encryptedContent': encryptedContent,
      'timestamp': timestamp,
      'isFlagged': isFlagged,
      'reportReason': reportReason,
    };
  }
}
