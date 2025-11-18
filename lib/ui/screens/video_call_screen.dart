import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:dert_ortagi_app/core/models/call_session.dart';
import 'package:dert_ortagi_app/core/network/webrtc_service.dart';

class VideoCallScreen extends StatefulWidget {
  final CallSession session;
  const VideoCallScreen({super.key, required this.session});

  @override
  State<VideoCallScreen> createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends State<VideoCallScreen> {
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();
  bool _isCameraOn = true;
  bool _isMicOn = true;

  @override
  void initState() {
    super.initState();
    initRenderers();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startCallSession();
    });
  }

  void initRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
  }

  void _startCallSession() async {
    final webRtcService = Provider.of<WebRTCService>(context, listen: false);
    
    // Yerel akışı başlat
    final localStream = await webRtcService.startLocalStream();
    _localRenderer.srcObject = localStream;
    setState(() {});
    
    // TODO: Sinyalleşme ve Uzak Akışı dinleme mantığı eklenecek.
  }

  void _toggleCamera() {
    _isCameraOn = !_isCameraOn;
    _localRenderer.srcObject?.getVideoTracks().forEach((track) {
      track.enabled = _isCameraOn;
    });
    setState(() {});
  }

  void _toggleMic() {
    _isMicOn = !_isMicOn;
    _localRenderer.srcObject?.getAudioTracks().forEach((track) {
      track.enabled = _isMicOn;
    });
    setState(() {});
  }

  void _hangUp() {
    final webRtcService = Provider.of<WebRTCService>(context, listen: false);
    webRtcService.dispose(); 
    Navigator.pop(context);
  }

  @override
  void dispose() {
    _localRenderer.dispose();
    _remoteRenderer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text('${widget.session.chatRoomId} - Görüntülü Sohbet'),
        backgroundColor: const Color(0xFF1B1B1B),
        automaticallyImplyLeading: false, 
      ),
      body: Stack(
        children: [
          // Uzak Akış (Ana Ekran)
          Positioned.fill(
            child: RTCVideoView(
              _remoteRenderer, 
              objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
            ),
          ),
          // Yerel Akış (Küçük Pencere)
          Positioned(
            top: 20,
            right: 20,
            width: 120,
            height: 180,
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF00FF41), width: 2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: RTCVideoView(
                _localRenderer,
                objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                mirror: true,
              ),
            ),
          ),
          // Kontrol Butonları
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 40),
              child: _buildControlButtons(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        FloatingActionButton(
          heroTag: "micBtn",
          onPressed: _toggleMic,
          backgroundColor: _isMicOn ? Colors.white : Colors.red,
          child: Icon(
            _isMicOn ? Icons.mic : Icons.mic_off, 
            color: Colors.black,
          ),
        ),
        FloatingActionButton(
          heroTag: "hangUpBtn",
          onPressed: _hangUp,
          backgroundColor: Colors.redAccent,
          child: const Icon(Icons.call_end, color: Colors.white),
        ),
        FloatingActionButton(
          heroTag: "camBtn",
          onPressed: _toggleCamera,
          backgroundColor: _isCameraOn ? Colors.white : Colors.red,
          child: Icon(
            _isCameraOn ? Icons.videocam : Icons.videocam_off, 
            color: Colors.black,
          ),
        ),
      ],
    );
  }
}
