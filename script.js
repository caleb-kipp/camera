const video = document.getElementById("camera");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");

let nightVision = false;
let thermalMode = false;

// --- Start Camera ---
async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
    });

    video.srcObject = stream;

    video.onloadedmetadata = () => {
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
        analyzeFrame();
    };
}
startCamera();

// --- Apply Filters ---
document.getElementById("toggleNight").onclick = () => {
    nightVision = !nightVision;
    video.style.filter = nightVision ? "brightness(2.5) contrast(1.7)" : "brightness(1)";
};

document.getElementById("toggleThermal").onclick = () => {
    thermalMode = !thermalMode;
};

// --- Distance estimation helper ---
function estimateDistance(bboxHeightPx) {
    const realHeight = 1.7; // avg human 1.7m
    const focalLength = 720; // calibration needed for accuracy

    return (realHeight * focalLength) / bboxHeightPx;
}

// --- MAIN LOOP ---
async function analyzeFrame() {
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw latest camera frame
    ctx.drawImage(video, 0, 0, overlay.width, overlay.height);

    // Extract image to send to YOLO
    const imgData = ctx.getImageData(0, 0, overlay.width, overlay.height);

    const detections = await detectObjects(imgData);

    // Process YOLO output
    detections.forEach(det => {
        const [x, y, w, h, conf, cls] = det;

        ctx.strokeStyle = thermalMode ? "red" : "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        const distance = estimateDistance(h).toFixed(1);

        ctx.fillStyle = "#000";
        ctx.fillText(`Dist: ${distance}m`, x, y - 5);
    });

    // THERMAL COLOR MAP
    if (thermalMode) {
        const frame = ctx.getImageData(0, 0, overlay.width, overlay.height);
        for (let i = 0; i < frame.data.length; i += 4) {
            const temp = frame.data[i]; // placeholder

            // Fake thermal gradient — real one is mapped from your camera
            frame.data[i] = Math.min(255, temp * 2);
            frame.data[i + 1] = 50;
            frame.data[i + 2] = 255 - temp;
        }
        ctx.putImageData(frame, 0, 0);
    }

    requestAnimationFrame(analyzeFrame);
}

// --- CAPTURE PHOTO ---
document.getElementById("captureBtn").onclick = () => {
    const a = document.createElement("a");
    a.href = overlay.toDataURL("image/png");
    a.download = "captured.png";
    a.click();
};
