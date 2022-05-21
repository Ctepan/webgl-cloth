export async function initPhysics() {
  const particleStep = 4

  let positions = new Float32Array(0)
  let newPositions = new Float32Array(positions.length)
  let normals = new Float32Array(0)
  let velocities = []
  let windSourcePoint = [0, 0, 1]

  let forces = []

  let dx = 0;
  let dy = 0;
  let restLengthHoriz = 0;
  let restLengthVert = 0;
  let restLengthDiag = 0;

  const gravity = [0, 10.0, 0]
  const particleMass = 1.1
  const particleInvMass = 1.0 / particleMass
  const springK = 100000.0
  const deltaT = 0.00001
  const dampingConst = -10.0

  const forceMul = 10000

  const length = (vec) => {
    return Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2)
  }
  const normalize = (vec, len) => {
    return len ? [vec[0] / len, vec[1] / len, vec[2] / len] : [0, 0, 0]
  }
  const sub = (vecA, vecB) => {
    return [vecA[0] - vecB[0], vecA[1] - vecB[1], vecA[2] - vecB[2]]
  }
  const placeSub = (vecA, vecB) => {
    vecA[0] = vecA[0] - vecB[0]
    vecA[1] = vecA[1] - vecB[1]
    vecA[2] = vecA[2] - vecB[2]
  }
  const placeAdd = (vecA, vecB) => {
    vecA[0] = vecA[0] + vecB[0]
    vecA[1] = vecA[1] + vecB[1]
    vecA[2] = vecA[2] + vecB[2]
  }
  const mulConst = (vec, num) => {
    return [vec[0] * num, vec[1] * num, vec[2] * num]
  }
  const getParticle = (buff, offset) => {
    return [buff[offset + 0], buff[offset + 1], buff[offset + 2]]
  }
  const cross = (vecA, vecB) => {
    return [vecA[1] * vecB[2] - vecA[2] * vecB[1], vecA[2] * vecB[0] - vecA[0] * vecB[2], vecA[0] * vecB[1] - vecA[1] * vecB[0]]
  }

  function getData() {
    return { positions, normals };
  }

  function generatePhysicCloth(nParticles, clothSize) {
    initPositions(nParticles, clothSize)
    initVelocities(nParticles)
    initNormals(nParticles)

    forces = []
    for (let i = 0; i < nParticles.y; i++) {
      forces.push([])
      for (let j = 0; j < nParticles.x; j++) {
        forces[i].push([0, 0])
      }
    }

    restLengthHoriz = dx
    restLengthVert = dy
    restLengthDiag = Math.sqrt(dx * dx + dy * dy)
  }

  function initPositions(nParticles, clothSize) {
    let initPos = []

    dx = clothSize[0] / (nParticles.x - 1)
    dy = clothSize[1] / (nParticles.y - 1)
    for (let i = 0; i < nParticles.y; i++) {
      for (let j = 0; j < nParticles.x; j++) {
        initPos.push(dx * j - (clothSize[0] / 2))
        initPos.push(dy * i - (clothSize[1] / 2))
        initPos.push(0.0)
        initPos.push(1.0)
      }
    }

    positions = new Float32Array(initPos)
    newPositions = new Float32Array(positions.length)
  }

  function initVelocities(nParticles) {
    velocities = Array.from({ length: nParticles.x * nParticles.y * 4 }).map(() => 0.0)
  }

  function initNormals(nParticles) {
    normals = new Float32Array(nParticles.x * nParticles.y * 3)
  }

  function tick({ nParticles }) {
    for (let i = 0; i < 5; i++) {
      moveParticles({ nParticles })
      ;[positions, newPositions] = [newPositions, positions]
    }
    computeNormals({ nParticles })
  }

  function fire(x, y) {
    const len = length([x, y, -0.5])
    windSourcePoint = mulConst(normalize([x, y, 1], len), dampingConst)
  }

  function moveParticles({ nParticles }) {
    forces[0][0][0] = 0
    forces[0][0][1] = 0
    forces[0][0][2] = 0

    for (let i = 0; i < positions.length; i += particleStep) {
      const p = getParticle(positions, i)

      const particleFlatIndex = Math.trunc(i / particleStep)
      const x = particleFlatIndex % nParticles.x
      const y = Math.trunc((particleFlatIndex - x) / nParticles.x)

      if (y === 0 && x < nParticles.x - 1) {
        forces[y][x + 1][0] = 0
        forces[y][x + 1][1] = 0
        forces[y][x + 1][2] = 0
      }

      if (x === 0 && y < nParticles.y - 1) {
        forces[y + 1][x][0] = 0
        forces[y + 1][x][1] = 0
        forces[y + 1][x][2] = 0
      }

      if (y < nParticles.y - 1) {
        let r = sub(getParticle(positions,(particleFlatIndex + nParticles.x) * particleStep), p)
        const rLen = length(r)
        let force = mulConst(normalize(r, rLen), springK * (rLen - restLengthVert))
        placeAdd(forces[y][x], force)
        placeSub(forces[y + 1][x], force)
      }
      if (x < nParticles.x - 1) {
        let r = sub(getParticle(positions,(i + particleStep)), p)
        const rLen = length(r)
        let force = mulConst(normalize(r, rLen), springK * (rLen - restLengthHoriz))
        placeAdd(forces[y][x], force)
        placeSub(forces[y][x + 1], force)
      }
      if (x < nParticles.x - 1 && y < nParticles.y - 1) {
        let r = sub(getParticle(positions,(particleFlatIndex + nParticles.x + 1) * particleStep), p)
        const rLen = length(r)
        let force = mulConst(normalize(r, rLen), springK * (rLen - restLengthDiag))
        placeAdd(forces[y][x], force)
        forces[y + 1][x + 1] = sub([0, 0, 0], force)
      }
      if (x < nParticles.x - 1 && y > 0) {
        let r = sub(getParticle(positions,(particleFlatIndex - nParticles.x + 1) * particleStep), p)
        const rLen = length(r)
        let force = mulConst(normalize(r, rLen), springK * (rLen - restLengthDiag))
        placeAdd(forces[y][x], force)
        placeSub(forces[y - 1][x + 1], force)
      }
    }


    for (let i = 0; i < positions.length; i += particleStep) {
      const p = getParticle(positions, i)
      const v = getParticle(velocities, i)

      const particleFlatIndex = Math.trunc(i / particleStep)
      const x = particleFlatIndex % nParticles.x
      const y = Math.trunc((particleFlatIndex - x) / nParticles.x)

      if (
        (y === 0) && (
          x === 0 ||
          x === nParticles.x / 5 ||
          x === nParticles.x * 2 / 5 ||
          x === nParticles.x * 3 / 5 ||
          x === nParticles.x * 4 / 5 ||
          x === nParticles.x - 1
        )
      ) {
        newPositions[i + 0] = p[0]
        newPositions[i + 1] = p[1]
        newPositions[i + 2] = p[2]

        velocities[i + 0] = 0
        velocities[i + 1] = 0
        velocities[i + 2] = 0

        continue
      }

      let force = mulConst(gravity, particleMass)
      placeAdd(force, forces[y][x])
      placeAdd(force, windSourcePoint)

      let a = [force[0] * particleInvMass * forceMul, force[1] * particleInvMass * forceMul, force[2] * particleInvMass * forceMul]

      function f(x, y) {
        return y + x * deltaT
      }

      let k1, k2, k3, k4, k5, k6
      k1 = [
        deltaT * f(a[0], v[0]),
        deltaT * f(a[1], v[1]),
        deltaT * f(a[2], v[2])
      ]
      k2 = [
        deltaT * f(a[0] + deltaT / 4, v[0] + k1[0] / 4),
        deltaT * f(a[1] + deltaT / 4, v[1] + k1[1] / 4),
        deltaT * f(a[2] + deltaT / 4, v[2] + k1[2] / 4)
      ]
      k3 = [
        deltaT * f(a[0] + deltaT / 2, v[0] + k1[0] / 2),
        deltaT * f(a[1] + deltaT / 2, v[1] + k1[1] / 2),
        deltaT * f(a[2] + deltaT / 2, v[2] + k1[2] / 2)
      ]
      k4 = [
        deltaT * f(a[0] + deltaT / 2, v[0] + k1[0] / 7 + 2 * k2[0] / 7 + k3[0] / 14),
        deltaT * f(a[1] + deltaT / 2, v[1] + k1[1] / 7 + 2 * k2[1] / 7 + k3[1] / 14),
        deltaT * f(a[2] + deltaT / 2, v[2] + k1[2] / 7 + 2 * k2[2] / 7 + k3[2] / 14)
      ]
      k5 = [
        deltaT * f(a[0] + 3 * deltaT / 4, v[0] + 3 * k1[0] / 8 - k3[0] / 2 + 7 * k4[0] / 8),
        deltaT * f(a[1] + 3 * deltaT / 4, v[1] + 3 * k1[1] / 8 - k3[1] / 2 + 7 * k4[1] / 8),
        deltaT * f(a[2] + 3 * deltaT / 4, v[2] + 3 * k1[2] / 8 - k3[2] / 2 + 7 * k4[2] / 8)
      ]
      k6 = [
        deltaT * f(a[0] + deltaT, v[0] - 4 * k1[0] / 7 + 12 * k2[0] / 7 - 2 * k3[0] / 7 - k4[0] + 8 * k5[0] / 7),
        deltaT * f(a[1] + deltaT, v[1] - 4 * k1[1] / 7 + 12 * k2[1] / 7 - 2 * k3[1] / 7 - k4[1] + 8 * k5[1] / 7),
        deltaT * f(a[2] + deltaT, v[2] - 4 * k1[2] / 7 + 12 * k2[2] / 7 - 2 * k3[2] / 7 - k4[2] + 8 * k5[2] / 7)
      ]

      newPositions[i + 0] = p[0] + 7 / 90 * (k1[0] + k6[0]) + 16 / 45 * (k2[0] + k5[0]) - k3[0] / 3 + 7 * k4[0] / 15
      newPositions[i + 1] = p[1] + 7 / 90 * (k1[1] + k6[1]) + 16 / 45 * (k2[1] + k5[1]) - k3[1] / 3 + 7 * k4[1] / 15
      newPositions[i + 2] = p[2] + 7 / 90 * (k1[2] + k6[2]) + 16 / 45 * (k2[2] + k5[2]) - k3[2] / 3 + 7 * k4[2] / 15

      velocities[i + 0] = v[0] + a[0] * deltaT
      velocities[i + 1] = v[1] + a[1] * deltaT
      velocities[i + 2] = v[2] + a[2] * deltaT
    }
  }

  function computeNormals({ nParticles }) {
    for (let i = 0; i < positions.length; i += particleStep) {
      const p = getParticle(positions, i)

      const particleFlatIndex = Math.trunc(i / particleStep)
      const x = particleFlatIndex % nParticles.x
      const y = Math.trunc((particleFlatIndex - x) / nParticles.x)

      let n = [0, 0, 0]
      let a, b, c

      if (y < nParticles.y - 1) {
        c = sub(getParticle(positions,(particleFlatIndex + nParticles.x) * particleStep), p)
        if (x < nParticles.x - 1) {
          a = sub(getParticle(positions,(particleFlatIndex + 1) * particleStep), p)
          b = sub(getParticle(positions,(particleFlatIndex + nParticles.x + 1) * particleStep), p)
          placeAdd(n, cross(a,b))
          placeAdd(n, cross(b,c))
        }
        if (x > 0) {
          a = c
          b = sub(getParticle(positions,(particleFlatIndex + nParticles.x - 1) * particleStep), p)
          c = sub(getParticle(positions,(particleFlatIndex - 1) * particleStep), p)
          placeAdd(n, cross(a,b))
          placeAdd(n, cross(b,c))
        }
      }

      if (y > 0) {
        c = sub(getParticle(positions,(particleFlatIndex - nParticles.x) * particleStep), p)
        if (x > 0) {
          a = sub(getParticle(positions,(particleFlatIndex - 1) * particleStep), p)
          b = sub(getParticle(positions,(particleFlatIndex - nParticles.x - 1) * particleStep), p)
          placeAdd(n, cross(a,b))
          placeAdd(n, cross(b,c))
        }
        if (x < nParticles.x - 1) {
          a = c;
          b = sub(getParticle(positions,(particleFlatIndex - nParticles.x + 1) * particleStep), p)
          c = sub(getParticle(positions,(particleFlatIndex + 1) * particleStep), p)
          placeAdd(n, cross(a,b))
          placeAdd(n, cross(b,c))
        }
      }

      const normIdx = particleFlatIndex * 3
      normals[normIdx + 0] = n[0]
      normals[normIdx + 1] = n[1]
      normals[normIdx + 2] = n[2]
    }
  }

  return { getData, tick, fire, generatePhysicCloth }
}
