import { useState, useEffect } from 'react'
import { useCanvas } from './components/useCanvas';
import { CarEnvironment, COURSE_IMAGE_WIDTH, COURSE_IMAGE_HEIGHT } from './models/car/CarEnvironment';
import { CarModel } from './models/car/CarModel';
import { Vector2, vectorFromAngle } from './models/Vector2';

export function CarDemo() {
  const [resetKey, setResetKey] = useState(0);

  // model input should be velocity as (forward, sideways) -- normalized with the main forward ray as +x. then 5 rays so 7 total inputs
  // display best net from previous iteration
  // or best net currently?
  // be able to change friction, acceleration etc parameters

  const NUM_CARS = 10;
  let cars = [];
  
  let env = new CarEnvironment('/course1.png');
  env.on('onFindOrigin', () => { 
    for (let i = 0; i < NUM_CARS; i++) {
      cars.push(new CarModel(env.origin, [5, 5], true));
    }
  });  

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
    // Calculate delta time
    let currFrameTime = Date.now();
    let delta = (currFrameTime - prevFrameTime) / 1000;
    prevFrameTime = currFrameTime;

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

    // Update the car models
    for (let i = 0; i < cars.length; i++)
    {
        // carModel.update(inputVector.x, inputVector.y, delta);
        cars[i].updateFromModel(delta, env);
  
        if (env.offTrack(cars[i].position))
          cars[i].reset(env.origin);
        
        drawCar(ctx, cars[i]);
    }
  }

  const canvasRef = useCanvas(draw)
  
  return <div>
    {/* <button onClick={() => setResetKey(resetKey + 1)}>Reset</button> */}
    <canvas ref={canvasRef} key={resetKey} width={COURSE_IMAGE_WIDTH} height={COURSE_IMAGE_HEIGHT}/>
  </div>;
}