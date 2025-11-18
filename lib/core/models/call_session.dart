import 'package:cloud_firestore/cloud_firestore.dart';

class CallSession {
  final String callId;
  final String chatRoomId; 
  final List<String> participants;
  final Timestamp initiatedAt;
  final String signalingStatus; 
  final String? iceCandidateJson;
  final String? sdpOffer;
  final String? sdpAnswer;
  final bool isEnded;

  CallSession({
    required this.callId,
    required this.chatRoomId,
    required this.participants,
    required this.initiatedAt,
    required this.signalingStatus,
    this.iceCandidateJson,
    this.sdpOffer,
    this.sdpAnswer,
    this.isEnded = false,
  });

  factory CallSession.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return CallSession(
      callId: doc.id,
      chatRoomId: data['chatRoomId'] as String,
      participants: List<String>.from(data['participants'] ?? []),
      initiatedAt: data['initiatedAt'] as Timestamp,
      signalingStatus: data['signalingStatus'] as String,
      iceCandidateJson: data['iceCandidateJson'],
      sdpOffer: data['sdpOffer'],
      sdpAnswer: data['sdpAnswer'],
      isEnded: data['isEnded'] ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'chatRoomId': chatRoomId,
      'participants': participants,
      'initiatedAt': initiatedAt,
      'signalingStatus': signalingStatus,
      'iceCandidateJson': iceCandidateJson,
      'sdpOffer': sdpOffer,
      'sdpAnswer': sdpAnswer,
      'isEnded': isEnded,
    };
  }
}
