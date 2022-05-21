precision lowp float;

varying vec3 norm;

void main() {
    vec3 ambient = vec3(0.5) * 0.2;

    vec3 normal = normalize(norm);
    vec3 lightDir = normalize(vec3(0.0, 1.0, 1.0));
    vec3 lightColor = vec3(1., 1., 1.);

    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * 0.2 * lightColor;

    vec3 result = ambient + diffuse;
    gl_FragColor = vec4(result, 1.0);
}
