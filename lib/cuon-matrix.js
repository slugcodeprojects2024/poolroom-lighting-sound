// cuon-matrix.js (c) 2012 kanda and matsuda
// Matrix4 class: Represents a 4x4 matrix for 3D graphics transformations
class Matrix4 {
    constructor() {
      this.elements = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]);
    }
  
    // Set the identity matrix
    setIdentity() {
      var e = this.elements;
      e[0] = 1;   e[4] = 0;   e[8]  = 0;   e[12] = 0;
      e[1] = 0;   e[5] = 1;   e[9]  = 0;   e[13] = 0;
      e[2] = 0;   e[6] = 0;   e[10] = 1;   e[14] = 0;
      e[3] = 0;   e[7] = 0;   e[11] = 0;   e[15] = 1;
      return this;
    }
  
    // Copy matrix
    set(src) {
      var i, s, d;
      s = src.elements;
      d = this.elements;
      if (s === d) {
        return;
      }
      for (i = 0; i < 16; ++i) {
        d[i] = s[i];
      }
      return this;
    }
  
    // Matrix multiplication
    multiply(other) {
      var i, e, a, b, ai0, ai1, ai2, ai3;
      
      // Calculate e = a * b
      e = this.elements;
      a = this.elements;
      b = other.elements;
      
      // If a equals b, copy b to temporary matrix.
      if (e === b) {
        b = new Float32Array(16);
        for (i = 0; i < 16; ++i) {
          b[i] = e[i];
        }
      }
      
      for (i = 0; i < 4; i++) {
        ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12];
        e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
        e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
        e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
        e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
      }
      
      return this;
    }
  
    // Multiply a vector by this matrix (result = this * vec)
    multiplyVector3(vec) {
      var e = this.elements;
      var p = vec.elements;
      var v = new Vector3();
      var result = v.elements;
  
      result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[8] + e[12];
      result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[9] + e[13];
      result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + e[14];
  
      return v;
    }
  
    // Set the perspective projection matrix
    setPerspective(fovy, aspect, near, far) {
      var e, rd, s, ct;
  
      if (near === far || aspect === 0) {
        throw 'null frustum';
      }
      if (near <= 0) {
        throw 'near <= 0';
      }
      if (far <= 0) {
        throw 'far <= 0';
      }
  
      fovy = Math.PI * fovy / 180 / 2;
      s = Math.sin(fovy);
      if (s === 0) {
        throw 'null frustum';
      }
  
      rd = 1 / (far - near);
      ct = Math.cos(fovy) / s;
  
      e = this.elements;
  
      e[0]  = ct / aspect;
      e[1]  = 0;
      e[2]  = 0;
      e[3]  = 0;
  
      e[4]  = 0;
      e[5]  = ct;
      e[6]  = 0;
      e[7]  = 0;
  
      e[8]  = 0;
      e[9]  = 0;
      e[10] = -(far + near) * rd;
      e[11] = -1;
  
      e[12] = 0;
      e[13] = 0;
      e[14] = -2 * near * far * rd;
      e[15] = 0;
  
      return this;
    }
  
    // Set the viewing transformation matrix
    setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
      var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;
  
      fx = centerX - eyeX;
      fy = centerY - eyeY;
      fz = centerZ - eyeZ;
  
      // Normalize f
      rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
      fx *= rlf;
      fy *= rlf;
      fz *= rlf;
  
      // Calculate cross product of f and up
      sx = fy * upZ - fz * upY;
      sy = fz * upX - fx * upZ;
      sz = fx * upY - fy * upX;
  
      // Normalize s
      rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
      sx *= rls;
      sy *= rls;
      sz *= rls;
  
      // Calculate cross product of s and f
      ux = sy * fz - sz * fy;
      uy = sz * fx - sx * fz;
      uz = sx * fy - sy * fx;
  
      // Set to this
      e = this.elements;
      e[0] = sx;
      e[1] = ux;
      e[2] = -fx;
      e[3] = 0;
  
      e[4] = sy;
      e[5] = uy;
      e[6] = -fy;
      e[7] = 0;
  
      e[8] = sz;
      e[9] = uz;
      e[10] = -fz;
      e[11] = 0;
  
      e[12] = 0;
      e[13] = 0;
      e[14] = 0;
      e[15] = 1;
  
      // Translation
      this.translate(-eyeX, -eyeY, -eyeZ);
  
      return this;
    }
  
    // Set translation component of matrix
    setTranslate(x, y, z) {
      var e = this.elements;
      e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = x;
      e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = y;
      e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = z;
      e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
      return this;
    }
  
    // Multiply by a translation matrix
    translate(x, y, z) {
      var e = this.elements;
      e[12] += e[0] * x + e[4] * y + e[8]  * z;
      e[13] += e[1] * x + e[5] * y + e[9]  * z;
      e[14] += e[2] * x + e[6] * y + e[10] * z;
      e[15] += e[3] * x + e[7] * y + e[11] * z;
      return this;
    }
  
    // Set rotation component of matrix
    setRotate(angle, x, y, z) {
      var e, s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;
  
      angle = Math.PI * angle / 180;
      e = this.elements;
  
      s = Math.sin(angle);
      c = Math.cos(angle);
  
      if (x === 0 && y === 0 && z === 0) {
        throw 'null rotation vector';
      }
  
      // Normalize rotation vector
      len = Math.sqrt(x*x + y*y + z*z);
      if (len !== 1) {
        rlen = 1 / len;
        x *= rlen;
        y *= rlen;
        z *= rlen;
      }
  
      nc = 1 - c;
      xy = x * y;
      yz = y * z;
      zx = z * x;
      xs = x * s;
      ys = y * s;
      zs = z * s;
  
      e[ 0] = x*x*nc +  c;
      e[ 1] = xy *nc + zs;
      e[ 2] = zx *nc - ys;
      e[ 3] = 0;
  
      e[ 4] = xy *nc - zs;
      e[ 5] = y*y*nc +  c;
      e[ 6] = yz *nc + xs;
      e[ 7] = 0;
  
      e[ 8] = zx *nc + ys;
      e[ 9] = yz *nc - xs;
      e[10] = z*z*nc +  c;
      e[11] = 0;
  
      e[12] = 0;
      e[13] = 0;
      e[14] = 0;
      e[15] = 1;
  
      return this;
    }
  
    // Multiply by a scale matrix
    scale(x, y, z) {
      var e = this.elements;
      e[0] *= x;  e[4] *= y;  e[8]  *= z;
      e[1] *= x;  e[5] *= y;  e[9]  *= z;
      e[2] *= x;  e[6] *= y;  e[10] *= z;
      e[3] *= x;  e[7] *= y;  e[11] *= z;
      return this;
    }
  }
  
  // Vector3 class: Represents a 3D vector
  class Vector3 {
    constructor(opt_src) {
      this.elements = new Float32Array(3);
      if (opt_src && typeof opt_src === 'object') {
        this.elements[0] = opt_src[0];
        this.elements[1] = opt_src[1]; 
        this.elements[2] = opt_src[2];
      } else {
        this.elements[0] = 0;
        this.elements[1] = 0;
        this.elements[2] = 0;
      }
    }
  
    // Normalize the vector
    normalize() {
      var v = this.elements;
      var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c*c+d*d+e*e);
      if(g){
        if(g == 1)
            return this;
     } else {
        v[0] = 0; v[1] = 0; v[2] = 0;
        return this;
     }
     g = 1/g;
     v[0] = c*g; v[1] = d*g; v[2] = e*g;
     return this;
    }
  
    // Set the vector components
    set(src) {
      var v = this.elements;
      if (typeof src === 'object' && src.elements) {
        var s = src.elements;
        v[0] = s[0]; v[1] = s[1]; v[2] = s[2];
        return this;
      }
      v[0] = src[0]; v[1] = src[1]; v[2] = src[2];
      return this;
    }
  
    // Add another vector
    add(other) {
      var v = this.elements;
      var s = other.elements;
      v[0] += s[0]; v[1] += s[1]; v[2] += s[2];
      return this;
    }
  
    // Subtract another vector
    sub(other) {
      var v = this.elements;
      var s = other.elements;
      v[0] -= s[0]; v[1] -= s[1]; v[2] -= s[2];
      return this;
    }
  
    // Multiply by scalar
    mul(scalar) {
      var v = this.elements;
      v[0] *= scalar; v[1] *= scalar; v[2] *= scalar;
      return this;
    }
  
    // Calculate the inner product
    static dot(v1, v2) {
      var c = v1.elements, d = v2.elements;
      return c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
    }
  
    // Calculate the cross product
    static cross(v1, v2) {
      var c = v1.elements, d = v2.elements;
      var e = new Vector3();
      var p = e.elements;
      
      p[0] = c[1] * d[2] - c[2] * d[1];
      p[1] = c[2] * d[0] - c[0] * d[2];
      p[2] = c[0] * d[1] - c[1] * d[0];
      
      return e;
    }
  }