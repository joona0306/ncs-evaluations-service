// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Node.js 18+ 에서는 fetch가 내장되어 있지만, Jest 환경에서는 polyfill이 필요할 수 있습니다.
// 통합 테스트를 위해 fetch polyfill 추가
if (typeof global.fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    // node-fetch가 설치되지 않은 경우, Node.js 18+ 내장 fetch 사용
    // 또는 빈 함수로 대체 (통합 테스트는 별도로 처리)
    console.warn('fetch polyfill을 사용할 수 없습니다. Node.js 18+를 사용하거나 node-fetch를 설치하세요.');
  }
}

// Request/Response polyfill for Next.js API routes
// Note: Next.js provides its own Request/Response implementations
// These are minimal polyfills for testing
if (typeof global.Request === 'undefined' || !global.Request.prototype.json) {
  const OriginalRequest = global.Request;
  if (OriginalRequest) {
    // Request가 이미 존재하는 경우, json 메서드만 추가
    if (!OriginalRequest.prototype.json) {
      OriginalRequest.prototype.json = async function() {
        if (this.bodyUsed) {
          throw new Error('Body already consumed');
        }
        const body = await this.text();
        return body ? JSON.parse(body) : {};
      };
    }
  } else {
    // Request가 없는 경우 새로 생성
    global.Request = class Request {
      constructor(url, init) {
        this.url = url;
        this.init = init || {};
        this.method = this.init.method || 'GET';
        this.headers = new Headers(this.init.headers || {});
        this._body = this.init.body;
        this.bodyUsed = false;
      }
      
      async json() {
        if (this.bodyUsed) {
          throw new Error('Body already consumed');
        }
        this.bodyUsed = true;
        if (this._body) {
          return typeof this._body === 'string' 
            ? JSON.parse(this._body) 
            : this._body;
        }
        return {};
      }
      
      async text() {
        if (this.bodyUsed) {
          throw new Error('Body already consumed');
        }
        this.bodyUsed = true;
        return this._body || '';
      }
    };
  }
}

// Headers polyfill
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = {};
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }
    }
    
    get(name) {
      return this._headers[name.toLowerCase()];
    }
    
    set(name, value) {
      this._headers[name.toLowerCase()] = value;
    }
  };
}

// Response polyfill for Next.js
if (typeof global.Response === 'undefined' || !global.Response.json) {
  const OriginalResponse = global.Response;
  if (OriginalResponse) {
    // Response가 이미 존재하는 경우, json 메서드만 추가
    if (!OriginalResponse.prototype.json) {
      OriginalResponse.prototype.json = async function() {
        const body = await this.text();
        return body ? JSON.parse(body) : {};
      };
    }
    // Response.json static method
    if (!OriginalResponse.json) {
      OriginalResponse.json = function(data, init) {
        return new OriginalResponse(JSON.stringify(data), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
          },
        });
      };
    }
  } else {
    // Response가 없는 경우 새로 생성
    global.Response = class Response {
      constructor(body, init) {
        this._body = body;
        this.init = init || {};
        this.status = this.init.status || 200;
        this.statusText = this.init.statusText || 'OK';
        this.headers = new Headers(this.init.headers || {});
        this.ok = this.status >= 200 && this.status < 300;
        this.bodyUsed = false;
      }
      
      async json() {
        if (this.bodyUsed) {
          throw new Error('Body already consumed');
        }
        this.bodyUsed = true;
        if (this._body) {
          return typeof this._body === 'string' 
            ? JSON.parse(this._body) 
            : this._body;
        }
        return {};
      }
      
      async text() {
        if (this.bodyUsed) {
          throw new Error('Body already consumed');
        }
        this.bodyUsed = true;
        return this._body || '';
      }
    };
    
    // Response.json static method
    global.Response.json = function(data, init) {
      return new global.Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
    };
  }
}

