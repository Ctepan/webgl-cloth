precision lowp float;

attribute vec3 coord;
attribute vec3 normal;

varying vec3 norm;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 transform;

void main() {
	gl_Position = projection * view * transform * vec4(
		coord.x,
		coord.y,
		coord.z,
		1
	);
	norm = normal;
}
