import { Component, OnInit, ViewChild } from '@angular/core';

import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <div >
        <video #inputVideo autoplay muted></video>
        <canvas #overlay></canvas>
      </div>
    </div>

  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('inputVideo') video: any;
  @ViewChild('overlay') overlay: any;
  public newNose: any;
  public nose: any;
  public noseQueue = [];
  public videoEl: HTMLVideoElement;
  public canvas: any;

  ngOnInit() {
    // access video and canvas HTML DOM element
    this.videoEl = this.video.nativeElement;
    this.canvas = this.overlay.nativeElement;

    this.run();
  }

  async run() {
    // load face detection and face expression recognition model named 'tiny_face_detector'
    await faceapi.nets.tinyFaceDetector.load('assets/weights/');
    await faceapi.loadFaceExpressionModel('assets/weights/');
    await faceapi.loadFaceLandmarkModel('assets/weights/');

    // try to access users webcam and stream the images to the video element
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    this.videoEl.srcObject = stream;
    // add event listener callback for manipulating webcam streaming data
    this.videoEl.addEventListener('play', this.onPlay.bind(this));
  }

  // manipulating webcam streaming data
  public async onPlay() {
    // Specify the face detector default options
    const options = new faceapi.TinyFaceDetectorOptions({
      // size at which image is processed
      inputSize: 512,
      // minimum confidence threshold: only show successful inference above 50%
      scoreThreshold: 0.5
    });

    // detect the face with the highest confidence score in an image that coming from webcam
    const result = await faceapi
    // `withFaceExpressions`: Face expression recognition is performed for detected face
      .detectSingleFace(this.videoEl, options)
       .withFaceLandmarks();


    // result: { detection: FaceDetection, expressions: 'neutral', 'angry', 'sad', 'surprised', 'happy', 'disgusted', 'fearful'}
    if (result) {
      // retrieve the detected face dimension
      const { width, height } = faceapi.getMediaDimensions(this.videoEl);
      // create a bounding box in canvas element overlayed on top of video element
      this.canvas.width = width;
      this.canvas.height = height;

      // resize detections in case displayed image has a different size then the original
      //  const landmarksArray = fullFaceDescriptions.map(fd => fd.landmarks)

      const resizedResults = faceapi.resizeResults([result], { width, height });

      // the function to draw face detection into a canvas
      faceapi.drawDetection(
        this.canvas,
        resizedResults.map((det: any) => det.detection),
        { withScore: false }
      );

      // the function to draw face expression recognition into a canvas
      // faceapi.drawLandmarks(canvas, landmarksArray, { drawLines: true })
      const landmarksArray =  await resizedResults.map(fd => fd.landmarks);
      this.nose = this.newNose;
      this.newNose = landmarksArray[0].positions[30];
      this.noseQueue.push(this.newNose);
      const len = 5;
      if (this.noseQueue.length >= len) {
        this.noseQueue.shift();
      }

      let left = true;
      let i = 0;

      while (left && i < this.noseQueue.length - 1) {
        if (this.noseQueue[i]._x > this.noseQueue[i + 1]._x) {
          left = true;
        } else {
          left = false;
        }
        i += 1;
      }
      if (left) {
        console.log('LEFT');
      } else {
        console.log('no LEFT');
      }

      if (this.nose !== undefined) {
        // console.log('oyyy: ', this.nose._x, this.newNose._x);
        if (this.newNose._x < 250) {
          // console.log('nose: ', this.nose._x);
          // history.back()
        }
        if (this.newNose._x > 350) {
          // console.log('knowledge: ', this.nose._x);
        }
      }
          // window.open(
          //  'http://www.google.com',
          //  'DescriptiveWindowName',
          //  'resizable,scrollbars,status'
          // );
      faceapi.drawLandmarks(
        this.canvas, landmarksArray, { drawLines: true });
    }

    // repeatedly perform the face detection while webcam stream the image data
    setTimeout(() => this.onPlay(), 40);
  }
}
