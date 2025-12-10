// Load YOLOv8-tiny ONNX model
let session;

async function loadYOLO() {
    session = await ort.InferenceSession.create("./yolov8n.onnx", {
        executionProviders: ["wasm"]
    });
}
loadYOLO();

// PREPROCESS (resize + normalize)
async function detectObjects(imageData) {
    if (!session) return [];

    const tensor = new ort.Tensor("float32", imageData.data, [1, 3, 640, 640]);
    const result = await session.run({ images: tensor });
    return result.output0.data; // YOLO output
}
