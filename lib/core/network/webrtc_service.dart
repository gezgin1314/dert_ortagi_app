import 'dart:async';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart'; // Bu paketi varsayımsal olarak dahil ediyoruz
import 'package:dert_ortagi_app/core/models/call_session.dart';

class WebRTCService extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  CallSession? _currentCallSession;
  String? _currentUserUid;

  final StreamController<RTCSessionDescription?> _remoteSdpController = StreamController<RTCSessionDescription?>.broadcast();
  Stream<RTCSessionDescription?> get remoteSdpStream => _remoteSdpController.stream;

  WebRTCService(this._currentUserUid);
  
  // 1. Peer Connection Yapılandırması
  Future<void> _createPeerConnection() async {
    final Map<String, dynamic> configuration = {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
        // TODO: Production için TURN sunucuları eklenecek.
      ]
    };

    _peerConnection = await createPeerConnection(configuration, {});

    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      if (candidate == null) return;
      _sendIceCandidate(candidate);
    };

    _peerConnection!.onAddStream = (MediaStream stream) {
      // Uzak akışı burada yönet
    };

    _peerConnection!.onIceConnectionState = (RTCIceConnectionState state) {
      // Bağlantı durumlarını izle
    };
  }

  // 2. Yerel Akışı Başlatma (Kamera ve Mikrofon)
  Future<MediaStream> startLocalStream() async {
    final Map<String, dynamic> mediaConstraints = {
      'audio': true,
      'video': {
        'mandatory': {
          'minWidth': '1280', 
          'minHeight': '720',
          'minFrameRate': '30',
        },
        'facingMode': 'user', 
      }
    };

    _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    _localStream!.getTracks().forEach((track) {
      _peerConnection?.addTrack(track, _localStream!);
    });
    return _localStream!;
  }

  // 3. Çağrı Başlat (Offer Oluşturucu)
  Future<void> makeCall(String chatRoomId, String targetUid) async {
    await _createPeerConnection();
    final callRef = _firestore.collection('callSessions');
    
    // Yeni çağrı oturumu oluştur
    final newSession = CallSession(
      callId: '', 
      chatRoomId: chatRoomId,
      participants: [_currentUserUid!, targetUid],
      initiatedAt: Timestamp.now(),
      signalingStatus: 'OFFER_SENT',
    );
    final docRef = await callRef.add(newSession.toFirestore());
    _currentCallSession = newSession.copyWith(callId: docRef.id);

    // SDP Offer oluştur ve Firestore'a gönder
    final offer = await _peerConnection!.createOffer({'offerToReceiveVideo': true, 'offerToReceiveAudio': true});
    await _peerConnection!.setLocalDescription(offer);
    
    await docRef.update({'sdpOffer': offer.sdp, 'sdpType': offer.type});
    // Diğer signaling adımları (ICE Candidate listener vb.) buraya eklenecek
  }
  
  // 4. ICE Candidate Gönderimi
  void _sendIceCandidate(RTCIceCandidate candidate) {
    if (_currentCallSession == null) return;
    final candidateData = {
      'sdpMid': candidate.sdpMid,
      'sdpMLineIndex': candidate.sdpMLineIndex,
      'candidate': candidate.candidate,
    };
    _firestore.collection('callSessions').doc(_currentCallSession!.callId).update({
      'iceCandidateJson': jsonEncode(candidateData),
    });
  }
  
  // 5. Temizlik
  void dispose() {
    _localStream?.getTracks().forEach((track) => track.stop());
    _localStream?.dispose();
    _peerConnection?.close();
    _peerConnection = null;
    _remoteSdpController.close();
    super.dispose();
  }
}

// Modelin kopyalama metodu eksik olduğu için ekleyelim
extension CallSessionExtension on CallSession {
  CallSession copyWith({
    String? callId,
    String? chatRoomId,
    List<String>? participants,
    Timestamp? initiatedAt,
    String? signalingStatus,
    String? iceCandidateJson,
    String? sdpOffer,
    String? sdpAnswer,
    bool? isEnded,
  }) {
    return CallSession(
      callId: callId ?? this.callId,
      chatRoomId: chatRoomId ?? this.chatRoomId,
      participants: participants ?? this.participants,
      initiatedAt: initiatedAt ?? this.initiatedAt,
      signalingStatus: signalingStatus ?? this.signalingStatus,
      iceCandidateJson: iceCandidateJson ?? this.iceCandidateJson,
      sdpOffer: sdpOffer ?? this.sdpOffer,
      sdpAnswer: sdpAnswer ?? this.sdpAnswer,
      isEnded: isEnded ?? this.isEnded,
    );
  }
}
