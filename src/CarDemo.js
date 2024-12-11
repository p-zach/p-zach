import { useState, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs';
import { useCanvas } from './components/useCanvas';
import { CarEnvironment } from './models/car/CarEnvironment';
import { CarModel } from './models/car/CarModel';
import { Vector2 } from './models/Vector2';

export function CarDemo() {
  const [resetKey, setResetKey] = useState(0);

  // model input should be velocity as (forward, sideways) -- normalized with the main forward ray as +x. then 5 rays so 7 total inputs
  // display best net from previous iteration
  // or best net currently?
//   const model = tf.sequential();
//   model.add(tf.layers.dense({units: 1, inputShape: [1]}));

//   model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

//   // Generate some synthetic data for training.
//   const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
//   const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

//   // Train the model using the data.
//   model.fit(xs, ys, {epochs: 10}).then(() => {
//     // Use the model to do inference on a data point the model hasn't seen before:
//     model.predict(tf.tensor2d([5], [1, 1])).print();
//     // Open the browser devtools to see the output
//   });

  // let pos = {x: 100, y: 100};
  // let speed = 3;
  
  let env = new CarEnvironment('/course1.png');
  let carModel = null;
  env.on('onFindOrigin', () => { carModel = new CarModel(env.origin); })  

  const carImage = new Image();
  carImage.crossOrigin = 'Anonymous';
  carImage.src = '/car40.png';

  let prevFrameTime = 0;

  let keysDown = [false, false, false, false];

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowUp':
          keysDown[0] = true;
          break;
        case 'ArrowDown':
          keysDown[1] = true;
          break;
        case 'ArrowLeft':
          keysDown[2] = true;
          break;
        case 'ArrowRight':
          keysDown[3] = true;
          break;
        default:
          break;
      }
    };
    const handleKeyUp = (event) => {
      switch (event.key) {
        case 'ArrowUp':
          keysDown[0] = false;
          break;
        case 'ArrowDown':
          keysDown[1] = false;
          break;
        case 'ArrowLeft':
          keysDown[2] = false;
          break;
        case 'ArrowRight':
          keysDown[3] = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  function drawCar(ctx, car) {
    if (car == null)
      return;
    ctx.save();
    ctx.translate(car.position.x, car.position.y);
    ctx.rotate(car.heading);
    ctx.drawImage(carImage, -carImage.width / 2, -carImage.height / 2);
    ctx.restore();
  }

  const draw = (ctx, frameCount) => {
    let currFrameTime = Date.now();
    let delta = (currFrameTime - prevFrameTime) / 1000;
    prevFrameTime = currFrameTime;

    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    let inputVector = Vector2.zero();
    if (keysDown[0])
      inputVector.x += 1;
    if (keysDown[1])
      inputVector.x -= 1;
    if (keysDown[2])
      inputVector.y -= 1;
    if (keysDown[3])
      inputVector.y += 1;

    if (carModel != null)
    {
      carModel.update(inputVector.x, inputVector.y, delta);
    }
    
    // const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    // if (pixel[0] === 255 && pixel[1] === 255 && pixel[2] === 255)
    //   pos = prevPos;

    env.drawCourse(ctx);
    drawCar(ctx, carModel);

  }

  const canvasRef = useCanvas(draw)

  const resetSize = () => { canvasRef.width = env.courseImage.width; canvasRef.height = env.courseImage.height; };
  if (env.courseImage.complete)
    resetSize();
  else env.on('onFindOrigin', resetSize);
  
  return <div>
    {/* <button onClick={() => setResetKey(resetKey + 1)}>Reset</button> */}
    <canvas ref={canvasRef} key={resetKey} width={800} height={400}/>
  </div>;
}