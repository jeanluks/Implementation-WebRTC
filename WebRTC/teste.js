  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyCQ85prRdE5aEbnIGwmibcTEHQjpWk4lKY",
    authDomain: "webrtc-12e7c.firebaseapp.com",
    databaseURL: "https://webrtc-12e7c.firebaseio.com",
    projectId: "webrtc-12e7c",
    storageBucket: "webrtc-12e7c.appspot.com",
    messagingSenderId: "634452159184"
};
firebase.initializeApp(config);

var database = firebase.database().ref();
var yourVideo = document.getElementById("yourVideo");
var friendsVideo = document.getElementById("friendsVideo");
var yourId = Math.floor(Math.random() * 1000000000);
var servers = { 'iceServers': [{ 'urls': 'stun:stun.services.mozilla.com' }, { 'urls': 'stun:stun.l.google.com:19302' }, { 'urls': 'turn:numb.viagenie.ca', 'credential': 'Cr&&1992.', 'username': 'tiago.valenca@hotmail.com' }] };
var pc = new RTCPeerConnection(servers);
pc.onicecandidate = (event => event.candidate ? sendMessage(yourId, JSON.stringify({ 'ice': event.candidate })) : console.log("Sent All Ice"));
pc.onaddstream = (event => friendsVideo.srcObject = event.stream);

function sendMessage(senderId, data) {
    var msg = database.push({ sender: senderId, message: data });
    msg.remove();
}

function readMessage(data) {
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;

    if (sender != yourId) {
        if (msg.ice != undefined)
            pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        else if (msg.sdp.type == "offer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
                .then(() => pc.createAnswer())
                .then(answer => pc.setLocalDescription(answer))
                .then(() => sendMessage(yourId, JSON.stringify({ 'sdp': pc.localDescription })));
        else if (msg.sdp.type == "answer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
};

database.on('child_added', readMessage);

function showMyFace() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => yourVideo.srcObject = stream)
        .then(stream => pc.addStream(stream));
}

function showFriendsFace() {
    pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => sendMessage(yourId, JSON.stringify({ 'sdp': pc.localDescription })));
}