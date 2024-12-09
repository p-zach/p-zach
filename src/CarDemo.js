import { useState, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs';
import Canvas from './components/Canvas';

function CarDemo() {
  const [resetKey, setResetKey] = useState(0);
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

  let pos = {x: 100, y: 100};
  let speed = 3;  

  let loaded = false;
  const img = new Image();
  img.onload = () => loaded = true;
  img.crossOrigin = "Anonymous";
  // img.src = './course1.png';
  img.src = 'https://raw.githubusercontent.com/p-zach/self-driving-car/refs/heads/main/course1.png';

  let prevPos = pos;

  useEffect(() => {
    // Add event listener for key presses
    const handleKeyDown = (event) => {
      prevPos = {x: pos.x, y: pos.y};
      switch (event.key) {
        case 'ArrowUp':
          pos.y -= speed;
          break;
        case 'ArrowDown':
          pos.y += speed;
          break;
        case 'ArrowLeft':
          pos.x -= speed;
          break;
        case 'ArrowRight':
          pos.x += speed;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const draw = (ctx, frameCount) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // ctx.fillStyle = '#DDDDDD'
    // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    
    if (loaded)
      ctx.drawImage(img, 0, 0, 1500, 1000);
    
    const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    if (pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0)
      pos = prevPos;

    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 20*Math.sin(frameCount*0.05)**2, 0, 2*Math.PI)
    ctx.fill()
  }
  
  return <div>
    <button onClick={() => setResetKey(resetKey + 1)}>Reset</button>
    <Canvas draw={draw} key={resetKey} width={1500} height={1000}/>
  </div>;
}

export default CarDemo;