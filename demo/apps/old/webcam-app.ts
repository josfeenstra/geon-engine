// // author: Jos Feenstra
// // purpose: Use this to test tensorflow's face-landmarks with a webcam.

// // tensorflow
// import * as tffl from "@tensorflow-models/face-landmarks-detection";
// import { AnnotatedPrediction } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";
// import { Coord2D } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";
// import { MediaPipeFaceMesh } from "@tensorflow-models/face-landmarks-detection/dist/types";

// import { Core } from "../../src/core";
// import { Vector2, Triangle2, InputState } from "../../src/lib";

// // import { model } from "@tensorflow/tfjs";
// require("@tensorflow/tfjs-backend-webgl");

// // PUBLIC

// // TODO rewrite this into the webcam app constructor
// // TODO get rid of ctx
// export function addWebcamAppWhenReady(core: Core, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) {

//     let app: CtxApp;
//     var constraints = {audio:false, video:true};

//     var p = navigator.mediaDevices.getUserMedia(constraints);

//     p.then(function(stream) {
//         video.srcObject = stream;

//         video.play();
//         draw.resize(canvas, video);
//     })

//     p.catch(function(err) {
//         console.log(err.name + " : " + err.message);
//     });

//     tffl.load(tffl.SupportedPackages.mediapipeFacemesh).then((model) => {
//         app = new WebcamApp(ctx, canvas, video, model);
//         //
//     });
// }

// export class WebcamApp extends CtxApp {

//     video: HTMLVideoElement;

//     points: Array<Vector2>;
//     triangles: Array<Triangle2>;

//     drawVideo: boolean = false;
//     model: MediaPipeFaceMesh;
//     // ------- basics -------

//     constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement, model: MediaPipeFaceMesh) {
//         super(ctx);
//         this.video = video;
//         this.points = [];
//         this.triangles = [];
//         this.model = model;
//     }

//     start() {
//         let video = this.video;

//         // load the tensorflow face mesh predictor

//         // canvas.addEventListener("click", this.clickEvent.bind(this));
//         video.addEventListener("loadeddata", (ev: Event) => {

//             this.drawVideo = true;
//             this.startPredictions();
//         });
//     }

//     update(state: InputState) {

//     }

//     drawCtx(ctx: CanvasRenderingContext2D) {
//         ctx.canvas.width = 1000;
//         ctx.canvas.height = 800;

//         ctx.canvas.style.width = "1000";
//         ctx.canvas.style.height = "800";

//         ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

//         if (this.drawVideo)
//         {
//             ctx.drawImage(this.video, 0, 0, ctx.canvas.width, ctx.canvas.height);
//             this.startPredictions();
//         }

//         this.points.forEach((p) => {
//             drawPoint(ctx, p);
//         })
//     }

//     // ------- interface -------
//     async startPredictions() {

//         // Pass in a video stream (or an image, canvas, or 3D tensor) to obtain an
//         // array of detected faces from the MediaPipe graph. If passing in a video
//         // stream, a single prediction per frame will be returned.
//         console.log("estimating...");
//         this.model.estimateFaces({
//             input: this.video
//         }).then((predictions) => {

//             console.log("drawing...");

//             // just draw 1 face
//             if (predictions.length == 1) {

//                 // draw.drawPrediction(ctx, predictions[0]);
//                 this.visualizePrediction(predictions[0]);
//             } else {
//                 console.log("not 1 face");
//             }
//             console.log("done!");
//         });
//     }

//     flushPoints() {
//         this.points = [];
//     }

//     addPoint(p: Vector2) {
//         this.points.push(p);
//     }

//     addPoints(points: Vector2[]) {
//         points.forEach((p) => {
//             this.addPoint(p);
//         })
//     }

//     flushTriangle(t: Triangle2) {
//         this.triangles = [];
//     }

//     addTriangle(t: Triangle2) {
//         this.triangles.push(t);
//     }

//     visualizePrediction(prediction: AnnotatedPrediction) {

//         // bounding box
//         let tl = prediction.boundingBox.topLeft as Coord2D;
//         let br = prediction.boundingBox.bottomRight as Coord2D;

//         let a = Vector2.fromArray(tl);
//         let b = Vector2.fromArray(br);
//         let c = new Vector2(a.x, b.y);
//         let d = new Vector2(b.x, a.y);

//         this.addPoints([a, b, c, d]);
//     }

//     // ------- events -------

//     clickEvent(e: MouseEvent) {
//         let x = e.x;
//         let y = e.y;

//         console.log("click at {}, {}", x, y);
//         this.points.push(new Vector2(x, y))
//     }

// }

// // ----- pure utils -----
// // TODO move this to draw utils
// function drawPoint(ctx: CanvasRenderingContext2D, p: Vector2) {

//     ctx.strokeStyle = "white";
//     ctx.fillStyle = "white";
//     // ctx.moveTo(x, y);
//     ctx.beginPath();
//     ctx.arc(p.x, p.y, 3, 0, 7, false);
//     ctx.fill();
// }
