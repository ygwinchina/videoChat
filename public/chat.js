let socket = io.connect("http://localhost:4000");
let userVideo = document.getElementById('userVideo');
let preVideo = document.getElementById('preVideo');
let joinBtn = document.getElementById('join');
let userName = document.getElementById('username');
let chatTop = document.getElementById('chat-app');
let muteBtn = document.getElementById('mute');
let leaveBtn = document.getElementById('leave');
let cameraBtn = document.getElementById('hiddenCamera');
let vedioRoom = document.getElementsByClassName('video-room')[0];
let tools = document.getElementsByClassName('tools')[0];


let roomName = "";
let creator = false;
let mute = false;
let hiddenCamera = false;
let rtcPeerConnection;
let userStream;

let iceServer = {
  "iceServer": [
    { url: 'stun:stun1.l.google.com:19302' },
    { url: 'stun:stun.voiparound.com' },
  ]
}

const constraints = {
  video: {
    frameRate: { min: 20 },  //视频的帧率最小 20 帧每秒
    width: { min: 640, ideal: 1280 }, //最小宽度640，理想宽度1280
    height: { min: 360, ideal: 720 },//最小高度640，理想高度1280
    aspectRatio: 16 / 9 //宽高比是 16:9
  },
  audio: {
    echoCancellation: true, //音频开启回音消除
    noiseSuppression: true, // 开启降噪
    autoGainControl: true // 开启自动增益功能
  }
};

joinBtn.addEventListener('click', function () {
  roomName = userName.value;
  if (roomName == '') {
    alert("Please press userName");
  }
  else {
    socket.emit("join", roomName);
  }
})

muteBtn.addEventListener('click', function () {
  if (!mute) {
    userStream.getTracks()[0].enabled = false;
    mute = true;
    muteBtn.textContent = "已静音";
  } else {
    userStream.getTracks()[0].enabled = true;
    mute = false;
    muteBtn.textContent = "静音";
  }
})

leaveBtn.addEventListener('click', function () {
  socket.emit("leave", roomName);

  if (userVideo) {
    userVideo.srcObject.getTracks()[0].stop();
    userVideo.srcObject.getTracks()[1].stop();
  }

  if (preVideo) {
    preVideo.srcObject.getTracks()[0].stop();
    preVideo.srcObject.getTracks()[1].stop();
  }

  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
    rtcPeerConnection = null;
  }

  chatTop.style.display = "block";//复现主页面
  vedioRoom.style.display = "none";
  tools.style.display = "none";
  alert("已退出房间");

})

cameraBtn.addEventListener('click', function () {
  if (!hiddenCamera) {
    userStream.getTracks()[1].enabled = false;
    hiddenCamera = true;
    cameraBtn.textContent = "已隐藏摄像头";
  } else {
    userStream.getTracks()[1].enabled = true;
    hiddenCamera = false;
    cameraBtn.textContent = "隐藏摄像头";
  }
})

socket.on("create", function (data) {
  console.log("I create " + data);
  creator = true;
  createUserVideo();
})

socket.on("joined", function (data) {
  console.log("I joinde " + data);
  creator = false;
  createUserVideo();
})

socket.on("full", function (data) {
  alert("this room is Full :" + data);
})

socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServer);
    rtcPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", event.candidate, roomName);
      }
    }
    rtcPeerConnection.ontrack = (event) => {
      preVideo.srcObject = event.streams[0];
    }

    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);//getTracks()[0]为音频 1为视频
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

    rtcPeerConnection.createOffer().then((offer) => {
      rtcPeerConnection.setLocalDescription(offer);
      socket.emit("offer", offer, roomName);
    }).catch((err) => { console.log(err); })

  }
})

socket.on("offer", function (offer) {
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServer);
    rtcPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", event.candidate, roomName);
      }
    }
    rtcPeerConnection.ontrack = (event) => {
      preVideo.srcObject = event.streams[0];
    }

    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);//getTracks()[0]为音频 1为视频
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

    rtcPeerConnection.setRemoteDescription(offer);

    rtcPeerConnection.createAnswer().then((answer) => {
      rtcPeerConnection.setLocalDescription(answer);
      socket.emit("answer", answer, roomName);
    }).catch((err) => { console.log(err); })

  }
})

socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
})

socket.on("candidate", function (candidate) {
  let iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);
})

socket.on("leave", function () {
  creator = true;

  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close;
    rtcPeerConnection = null;
  }

  if (preVideo) {
    preVideo.srcObject.getTracks()[0].stop();
    preVideo.srcObject.getTracks()[1].stop();
  }

  // if (userVideo) {
  //   userVideo.srcObject.getTracks()[0].stop();
  //   userVideo.srcObject.getTracks()[1].stop();
  // }

  alert("对方已退出房间");
  // chatTop.style.display = "block";//复现主页面
  // vedioRoom.style.display = "none";
  // tools.style.display = "none";

})

async function createUserVideo() {
  chatTop.style.display = "none";//隐藏除视频外部分
  vedioRoom.style.display = "block";
  tools.style.display = "flex";
  await navigator.mediaDevices.getUserMedia(constraints)//获取媒体流实际为异步
    .then((stream) => {
      userStream = stream;//提供媒体流给track 使用await确保后续能拿到stream流
      userVideo.srcObject = stream;
    }).catch((e) => {
      console.log("can not catch Video cause : " + e);
    });

  socket.emit("ready", roomName);
}
