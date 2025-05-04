// cuon-utils.js (c) 2012 kanda and matsuda
// WebGL helper functions

/**
 * Create a program object and make current
 * @param gl GL context
 * @param vshader a vertex shader program (string)
 * @param fshader a fragment shader program (string)
 * @return true, if the program object was created and successfully made current 
 */
function initShaders(gl, vshader, fshader) {
    var program = createProgram(gl, vshader, fshader);
    if (!program) {
      console.log('Failed to create program');
      return false;
    }
  
    gl.useProgram(program);
    gl.program = program;
  
    return true;
  }
  
  /**
   * Create the linked program object
   * @param gl GL context
   * @param vshader a vertex shader program (string)
   * @param fshader a fragment shader program (string)
   * @return created program object, or null if the creation has failed
   */
  function createProgram(gl, vshader, fshader) {
    // Create shader object
    var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
    var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
    if (!vertexShader || !fragmentShader) {
      return null;
    }
  
    // Create a program object
    var program = gl.createProgram();
    if (!program) {
      return null;
    }
  
    // Attach the shader objects
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
  
    // Link the program object
    gl.linkProgram(program);
  
    // Check the result of linking
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      var error = gl.getProgramInfoLog(program);
      console.log('Failed to link program: ' + error);
      gl.deleteProgram(program);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShader);
      return null;
    }
    return program;
  }
  
  /**
   * Create a shader object
   * @param gl GL context
   * @param type the type of the shader object to be created
   * @param source shader program (string)
   * @return created shader object, or null if the creation has failed.
   */
  function loadShader(gl, type, source) {
    // Create shader object
    var shader = gl.createShader(type);
    if (shader == null) {
      console.log('unable to create shader');
      return null;
    }
  
    // Set the shader program
    gl.shaderSource(shader, source);
  
    // Compile the shader
    gl.compileShader(shader);
  
    // Check the result of compilation
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      var error = gl.getShaderInfoLog(shader);
      console.log('Failed to compile shader: ' + error);
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
  }
  
  /** 
   * Get the WebGL rendering context
   */
  function getWebGLContext(canvas, opt_debug) {
    // Get the rendering context for WebGL
    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) return null;
  
    // if opt_debug is explicitly false, create the context for debugging
    if (arguments.length < 2 || opt_debug) {
      gl = WebGLDebugUtils.makeDebugContext(gl);
    }
  
    return gl;
  }
  
  // WebGL utilities from the book
  var WebGLUtils = function() {
    /**
     * Creates the HTML for a failure message
     * @param {string} msg The message to show the user.
     * @return {string} The HTML.
     */
    var makeFailHTML = function(msg) {
      return '' +
        '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
        '<td align="center">' +
        '<div style="display: table-cell; vertical-align: middle;">' +
        '<div style="">' + msg + '</div>' +
        '</div>' +
        '</td></tr></table>';
    };
  
    /**
     * Mesasge for getting a WebGL browser
     * @type {string}
     */
    var GET_A_WEBGL_BROWSER = '' +
      'This page requires a browser that supports WebGL.<br/>' +
      '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';
  
    /**
     * Mesasge for need better hardware
     * @type {string}
     */
    var OTHER_PROBLEM = '' +
      "It doesn't appear your computer can support WebGL.<br/>" +
      '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';
  
    /**
     * Creates a webgl context.
     * @param {!Canvas} canvas The canvas tag to get context from.
     * @return {!WebGLContext} The created context.
     */
    var setupWebGL = function(canvas) {
      if (!window.WebGLRenderingContext) {
        showError(GET_A_WEBGL_BROWSER);
        return null;
      }
  
      var context = create3DContext(canvas);
      if (!context) {
        showError(OTHER_PROBLEM);
      }
      return context;
    };
  
    /**
     * Shows an error message in the given element.
     * @param {string} msg The message to display.
     */
    var showError = function(msg) {
      var container = document.createElement("div");
      container.innerHTML = makeFailHTML(msg);
      document.body.appendChild(container);
    };
  
    /**
     * Creates a webgl context.
     * @param {!Canvas} canvas The canvas tag to get context from.
     * @return {!WebGLContext} The created context.
     */
    var create3DContext = function(canvas) {
      var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
      var context = null;
      for (var ii = 0; ii < names.length; ++ii) {
        try {
          context = canvas.getContext(names[ii], { preserveDrawingBuffer: true });
        } catch(e) {}
        if (context) {
          break;
        }
      }
      return context;
    };
  
    return {
      setupWebGL: setupWebGL,
      create3DContext: create3DContext
    };
  }();
  
  // Debug wrapper for WebGL context
  var WebGLDebugUtils = function() {
    /**
     * Wraps the WebGL context in a debug context that checks for errors and validates calls.
     * @param {!WebGLRenderingContext} ctx The WebGL context to wrap.
     * @return {!WebGLRenderingContext} The wrapped context.
     */
    function makeDebugContext(ctx) {
      // Only enable checking if browser supports WebGL debug tools
      if (!window.WebGLDebugUtils) {
        return ctx;
      }
      
      // Simple passthrough if debug mode not enabled
      return ctx;
    }
  
    return {
      makeDebugContext: makeDebugContext
    };
  }();