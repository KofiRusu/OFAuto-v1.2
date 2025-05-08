const { Server } = require('http');
const { NextServer } = require('next/dist/server/next-server');

// Create a simple Lambda adapter for Next.js
const app = new NextServer({
  dev: false,
  dir: __dirname,
  conf: require('./next.config.js')
});

const handler = async (event, context) => {
  const request = createRequest(event);
  const response = await app.getRequestHandler()(
    request,
    new ServerResponse(request)
  );

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body,
    isBase64Encoded: false
  };
};

// Helper classes to adapt Lambda to Next.js
function createRequest(event) {
  const { httpMethod, path, queryStringParameters, headers, body } = event;
  
  const req = new Server.IncomingMessage(null);
  req.method = httpMethod;
  req.url = path + (queryStringParameters ? '?' + new URLSearchParams(queryStringParameters).toString() : '');
  req.headers = headers || {};
  
  if (body) {
    req.push(body);
  }
  req.push(null);
  
  return req;
}

class ServerResponse extends Server.ServerResponse {
  constructor(req) {
    super(req);
    this.body = '';
    this.headers = {};
  }
  
  end(data) {
    if (data) {
      this.body = data;
    }
    super.end(data);
  }
  
  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }
  
  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
    return super.setHeader(name, value);
  }
  
  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    if (headers) {
      this.headers = { ...this.headers, ...headers };
    }
    return super.writeHead(statusCode, headers);
  }
}

module.exports = { handler }; 