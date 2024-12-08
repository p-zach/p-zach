import * as tf from '@tensorflow/tfjs';
import Canvas from './components/Canvas';

function CarDemo() {
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

  const draw = (ctx, frameCount) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(100, 100, 20*Math.sin(frameCount*0.05)**2, 0, 2*Math.PI)
    ctx.fill()
  }
  
  return <div>
    <Canvas draw={draw}/>
  </div>;
}

export default CarDemo;