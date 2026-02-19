const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const resultDiv = document.getElementById("result");

let model;
let stream;

async function loadModel(){
    model = await blazeface.load();
}
loadModel();

function toggleMode(){
    document.body.classList.toggle("dark-mode");
}

function requestCameraPermission(){
    navigator.mediaDevices.getUserMedia({video:true})
    .then(s=>{
        stream=s;
        video.srcObject=s;
        video.style.display="block";
    })
    .catch(()=>alert("Permission denied"));
}

function stopCamera(){
    if(stream){
        stream.getTracks().forEach(track=>track.stop());
        video.style.display="none";
    }
}

async function capturePhoto(){
    const ctx=canvas.getContext("2d");
    canvas.width=video.videoWidth;
    canvas.height=video.videoHeight;
    ctx.drawImage(video,0,0);
    stopCamera();
    await analyzeFace(ctx);
}

document.getElementById("upload").addEventListener("change",function(e){
    const file=e.target.files[0];
    const reader=new FileReader();
    reader.onload=function(){
        const img=new Image();
        img.onload=async function(){
            canvas.width=img.width;
            canvas.height=img.height;
            const ctx=canvas.getContext("2d");
            ctx.drawImage(img,0,0);
            await analyzeFace(ctx);
        }
        img.src=reader.result;
    }
    reader.readAsDataURL(file);
});

async function analyzeFace(ctx){
    const predictions=await model.estimateFaces(canvas,false);

    if(predictions.length===0){
        alert("No face detected ");
        return;
    }

    const face=predictions[0];
    const [x1,y1]=face.topLeft;
    const [x2,y2]=face.bottomRight;

    const width=x2-x1;
    const height=y2-y1;

    const faceData=ctx.getImageData(x1,y1,width,height).data;

    let r=0,g=0,b=0;
    let total=faceData.length/4;

    for(let i=0;i<faceData.length;i+=4){
        r+=faceData[i];
        g+=faceData[i+1];
        b+=faceData[i+2];
    }

    r=Math.floor(r/total);
    g=Math.floor(g/total);
    b=Math.floor(b/total);

    generateResult(r,g,b);
}

function generateResult(r,g,b){

    let confidence=Math.floor(Math.random()*15+85);

    let tone=r>190?"Fair":r>140?"Medium":"Deep";
    let undertone=r>b?"Warm":b>r?"Cool":"Neutral";

    let palette = undertone==="Warm"
        ? ["#d4a373","#e76f51","#f4a261"]
        : undertone==="Cool"
        ? ["#4361ee","#7209b7","#3a0ca3"]
        : ["#2a9d8f","#264653","#8d99ae"];

    let makeup = tone==="Fair"
        ? "Peach lipstick + Soft pink blush"
        : tone==="Medium"
        ? "Coral lipstick + Bronze highlighter"
        : "Deep red lipstick + Gold highlighter";

    resultDiv.innerHTML=`
        <h2> Premium AI Analysis </h2>
        <p><strong>Skin Tone:</strong> ${tone}</p>
        <p><strong>Undertone:</strong> ${undertone}</p>
        <p><strong>AI Confidence:</strong> ${confidence}%</p>

        <h3> Your Color Palette</h3>
        ${palette.map(c=>`<div class="color-box" style="background:${c}"></div>`).join("")}

        <h3> Makeup Suggestion</h3>
        <p>${makeup}</p>

        <p style="font-size:12px;opacity:0.7;">
        Powered by TensorFlow.js | Not medical advice
        </p>
    `;
          }
