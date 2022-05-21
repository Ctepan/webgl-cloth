export async function initClothRenderer(canvas) {
	const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
	gl.clearColor(0.8, 0.8, 0.8, 1);

	const program = gl.createProgram();

	{
		const shader = gl.createShader(gl.VERTEX_SHADER);
		const source = await (await fetch('vert.glsl')).text();
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		console.log(gl.getShaderInfoLog(shader));
		gl.attachShader(program, shader);
	}

	{
		const shader = gl.createShader(gl.FRAGMENT_SHADER);
		const source = await (await fetch('frag.glsl')).text();
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		console.log(gl.getShaderInfoLog(shader));
		gl.attachShader(program, shader);
	}

	gl.linkProgram(program);
	gl.useProgram(program);

	const posBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)

	{
		const attribLocation = gl.getAttribLocation(program, 'coord');
		gl.enableVertexAttribArray(attribLocation);
		gl.vertexAttribPointer(
			attribLocation,
			3,
			gl.FLOAT,
			false,
			16,
			0
		);
	}

	const normBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer)

	{
		const attribLocation = gl.getAttribLocation(program, 'normal');
		gl.enableVertexAttribArray(attribLocation);
		gl.vertexAttribPointer(
			attribLocation,
			3,
			gl.FLOAT,
			false,
			0,
			0
		);
	}

	function multiplyMatrices(a, b) {
		const result = [];

		const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
			a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
			a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
			a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

		let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
		result[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		result[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		result[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		result[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
		result[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		result[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		result[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		result[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
		result[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		result[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		result[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		result[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
		result[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		result[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		result[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		result[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		return result;
	}

	function translateMatrix(x, y, z) {
		return [
			1,    0,    0,   0,
			0,    1,    0,   0,
			0,    0,    1,   0,
			x,    y,    z,   1
		];
	}

	function scaleMatrix(w, h , d) {
		return [
			w,    0,    0,   0,
			0,    h,    0,   0,
			0,    0,    d,   0,
			0,    0,    0,   1
		]
	}

	function multiplyArrayOfMatrices(matrices) {
		let inputMatrix = matrices[0];

		for (let i = 1; i < matrices.length; i++) {
			inputMatrix = multiplyMatrices(inputMatrix, matrices[i]);
		}

		return inputMatrix;
	}
	function invertMatrix(matrix) {
		const result = [];

		const n11 = matrix[0], n12 = matrix[4], n13 = matrix[ 8], n14 = matrix[12];
		const n21 = matrix[1], n22 = matrix[5], n23 = matrix[ 9], n24 = matrix[13];
		const n31 = matrix[2], n32 = matrix[6], n33 = matrix[10], n34 = matrix[14];
		const n41 = matrix[3], n42 = matrix[7], n43 = matrix[11], n44 = matrix[15];

		result[ 0] = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
		result[ 4] = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
		result[ 8] = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
		result[12] = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
		result[ 1] = n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44;
		result[ 5] = n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44;
		result[ 9] = n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44;
		result[13] = n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34;
		result[ 2] = n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44;
		result[ 6] = n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44;
		result[10] = n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44;
		result[14] = n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34;
		result[ 3] = n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43;
		result[ 7] = n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43;
		result[11] = n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43;
		result[15] = n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33;

		const determinant = n11 * result[0] + n21 * result[4] + n31 * result[8] + n41 * result[12];

		if ( determinant === 0 ) {
			throw new Error("Can't invert matrix, determinant is 0");
		}

		for (let i = 0; i < result.length; i++ ) {
			result[i] /= determinant;
		}

		return result;
	}

	function computeViewMatrix({ positionV }) {
		const position = translateMatrix(...positionV);

		const matrix = multiplyArrayOfMatrices([
			position
		]);

		return invertMatrix(matrix);
	}

	function perspectiveMatrix(fieldOfViewInRadians, aspectRatio, near, far) {
		const f = 1.0 / Math.tan(fieldOfViewInRadians / 2);
		const rangeInv = 1 / (near - far);

		return [
			f / aspectRatio, 0,                          0,   0,
			0,               f,                          0,   0,
			0,               0,    (near + far) * rangeInv,  -1,
			0,               0,  near * far * rangeInv * 2,   0
		];
	}

	 function computePerspectiveMatrix({ width, height, nearClippingPlaneDistance = 1, farClippingPlaneDistance = 50, fieldOfView = 0.4 }) {
		const fieldOfViewInRadians = Math.PI * fieldOfView;
		const aspectRatio = width / height;

		return perspectiveMatrix(
			fieldOfViewInRadians,
			aspectRatio,
			nearClippingPlaneDistance,
			farClippingPlaneDistance
		)
	}

	let cachedNParticles
	const indexBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

	function render(posData, normData, nParticles, width, height) {
		if (width !== canvas.width || height !== canvas.height) {
			canvas.width = width;
			canvas.height = height;
			gl.viewport(0, 0, width, height);

			{
				const projection = computePerspectiveMatrix({ width: canvas.width, height: canvas.height })
				const uniformLocation = gl.getUniformLocation(program, 'projection')
				gl.uniformMatrix4fv(uniformLocation, false, new Float32Array(projection))
			}

			{
				const transform = scaleMatrix(1, -1, 1)
				const uniformLocation = gl.getUniformLocation(program, 'transform')
				gl.uniformMatrix4fv(uniformLocation, false, new Float32Array(transform))
			}

			{
				const view = computeViewMatrix({ positionV: [0, 0, 2]})
				const uniformLocation = gl.getUniformLocation(program, 'view')
				gl.uniformMatrix4fv(uniformLocation, false, new Float32Array(view))
			}
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW)

		gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, normData, gl.DYNAMIC_DRAW)

		let el
		if (!el || !cachedNParticles || cachedNParticles.x !== nParticles.x || cachedNParticles.y !== nParticles.y) {
			cachedNParticles = nParticles
			el = indexSurface(nParticles)
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(el), gl.STATIC_DRAW)
		}

		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
		gl.drawElements(gl.TRIANGLE_STRIP, el.length, gl.UNSIGNED_SHORT, 0);
	}

	return { render }
}

function indexSurface(nParticles) {
	let el = []

	for (let row = 0; row < nParticles.y - 1; row++) {
		for (let col = 0; col < nParticles.x; col++) {
			el.push((row + 1) * nParticles.x + (col))
			el.push((row)* nParticles.x + (col))
		}

		row++

		if (row < nParticles.y - 1) {
			for (let col = nParticles.x - 1; col >= 0; col--) {
				el.push((row) * nParticles.x + (col))
				el.push((row + 1) * nParticles.x + (col))
			}
		}
	}
	return el
}
