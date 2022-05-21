import { initPhysics } from './cloth-physics.js';
import { initClothRenderer } from './renderer-webgl.js';

async function main() {
  const canvas = document.querySelector('canvas');
  const fpsInput = document.querySelector('#fps');

  let canvasWidth;
  let canvasHeight;

  const { getData, tick, fire, generatePhysicCloth } = await initPhysics()
  const { render } = await initClothRenderer(canvas)

  {
    const resizeHandler = () => {
      canvasWidth = canvas.clientWidth
      canvasHeight = canvas.clientHeight
    }
    window.addEventListener('resize', resizeHandler)
    resizeHandler()
  }

  let num = 0
  {
    const clickHandler = (e) => {
      num = 0
      fire(e.offsetX - canvas.clientWidth / 2, e.offsetY - canvas.clientHeight / 2)
    }
    canvas.addEventListener('click', clickHandler)
  }

  {
    let lastTs = 0
    let framesDrawn = 0

    const clothParticlesNum = { x: 25, y: 25 }
    const clothSize = [1.0, 1.0]
    generatePhysicCloth(clothParticlesNum, clothSize)

    const frame = (timestamp) => {
      requestAnimationFrame(frame)


      tick({ nParticles: clothParticlesNum, clothSize })

      const { positions, normals } = getData()
      render(positions, normals, clothParticlesNum, canvasWidth, canvasHeight);

      framesDrawn++;
      if (timestamp > lastTs + 2000) {
        fpsInput.value = (1000 * framesDrawn / (timestamp - lastTs)).toFixed(1) + ' FPS'
        lastTs = timestamp
        framesDrawn = 0
      }

      num++
    }
    await frame()
  }
}

main()
