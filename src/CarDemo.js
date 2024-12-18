import { useState, useEffect } from 'react'
import { useCanvas } from './components/useCanvas';
import { CarEnvironment, COURSE_IMAGE_WIDTH, COURSE_IMAGE_HEIGHT } from './models/car/CarEnvironment';
import { CarModel } from './models/car/CarModel';
import { Vector2, vectorFromAngle } from './models/Vector2';
import * as tf from '@tensorflow/tfjs';

export function CarDemo() {
  const [resetKey, setResetKey] = useState(0);

  // display best net from previous iteration
  // or best net currently?
  // be able to change friction, acceleration etc parameters

  const NUM_CARS = 25;
  const NUM_BEST_CARS_REPRODUCE = 5;
  const HIDDEN_LAYERS = [7, 5];
  const MUTATION_CHANCE = 0.8;
  const MUTATION_MAX = 0.05;
  const AFTER_DEATH_NEXT_TIME = 1000;

  let cars = [];
  let resetting = false;

  let prevFrameTime = 0;
  let updating = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      updating = true;
      prevFrameTime = Date.now();
    } else {
      updating = false;
    }
  });
  
  let env = new CarEnvironment('/course1.png');
  env.on('onFindOrigin', () => { 
    for (let i = 0; i < NUM_CARS; i++) {
      cars.push(new CarModel(env.origin, HIDDEN_LAYERS, true));
    }
  });  

  const carImage = new Image();
  carImage.crossOrigin = 'Anonymous';
  carImage.src = '/car40.png';

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

  function nextIteration() {
    // Stop all cars
    for (let i = 0; i < cars.length; i++) {
      cars[i].kill();
    }

    // Sort by descending reward
    cars.sort((a,b) => b.reward - a.reward);

    // Top cars survive
    let nextGen = [];
    for (let i = 0; i < NUM_BEST_CARS_REPRODUCE; i++) {
      cars[i].reset(env.origin);
      nextGen.push(cars[i]);
    }

    // Top cars reproduce
    for (let i = NUM_BEST_CARS_REPRODUCE; i < NUM_CARS; i++) {
      let child = new CarModel(env.origin, HIDDEN_LAYERS);

      // Choose two parents from reproducing cars
      // It's OK if they're the same, mutations will make it different
      let parentIndex1 = Math.floor(Math.random() * NUM_BEST_CARS_REPRODUCE);
      let parentIndex2 = Math.floor(Math.random() * NUM_BEST_CARS_REPRODUCE);

      // let numLayers = HIDDEN_LAYERS.length + 1;

      // for (let j = 0; j < numLayers; j++) {
        // let weights1 = cars[parentIndex1].model.getLayer(null, j).getWeights();
        // let weights2 = cars[parentIndex2].model.getLayer(null, j).getWeights();
      let model1 = cars[parentIndex1].model;
      let model2 = cars[parentIndex2].model;

      // Combine and mutate weights
      const newWeights = model1.layers.map((layer1, i) => {
        const layer2 = model2.layers[i];
        const weights1 = layer1.getWeights();
        const weights2 = layer2.getWeights();

        return weights1.map((w1, j) => {
          const w2 = weights2[j];
          return tf.tidy(() => {
              const mask = tf.randomUniform(w1.shape).greater(0.5); // Random binary mask
              const combinedWeights = w1.mul(mask).add(w2.mul(mask.logicalNot()));

              // Apply mutations with probability MUTATION_CHANCE
              const mutationMask = tf.randomUniform(w1.shape).less(MUTATION_CHANCE);
              const mutationValues = tf.randomUniform(w1.shape, -MUTATION_MAX, MUTATION_MAX);
              return combinedWeights.add(mutationMask.mul(mutationValues));
          });
        });
      });

      // Set new weights to the layers of the new model
      newWeights.forEach((weights, i) => {
          child.model.layers[i].setWeights(weights);
      });

      nextGen.push(child);
    }
    // }

    cars = nextGen;
    resetting = false;
  }

  const draw = (ctx, frameCount) => {
    // Calculate delta time
    let currFrameTime = Date.now();
    let delta = (currFrameTime - prevFrameTime) / 1000;
    prevFrameTime = currFrameTime;

    if (!updating)
      return;

    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // let inputVector = Vector2.zero();
    // if (keysDown[0])
    //   inputVector.x += 1;
    // if (keysDown[1])
    //   inputVector.x -= 1;
    // if (keysDown[2])
    //   inputVector.y -= 1;
    // if (keysDown[3])
    //   inputVector.y += 1;

    // Draw course
    env.drawCourse(ctx);

    let numDeadCars = 0;

    // Update the car models
    for (let i = 0; i < cars.length; i++)
    {
        // carModel.update(inputVector.x, inputVector.y, delta);
        cars[i].updateFromModel(delta, env);
  
        if (env.offTrack(cars[i].position))
          cars[i].kill();

        if (cars[i].dead)
          numDeadCars++;
        
        drawCar(ctx, cars[i]);
    }

    if (!resetting && numDeadCars >= NUM_CARS - NUM_BEST_CARS_REPRODUCE * 2)
    {
      setTimeout(nextIteration, AFTER_DEATH_NEXT_TIME);
      resetting = true;
    }
  }

  const canvasRef = useCanvas(draw)
  
  return <div>
    <button onClick={() => { nextIteration(); }}>Next</button>
    <canvas ref={canvasRef} key={resetKey} width={COURSE_IMAGE_WIDTH} height={COURSE_IMAGE_HEIGHT}/>
  </div>;
}