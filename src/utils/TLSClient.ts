import https from 'https';
import fs from 'fs';
import path from 'path';

export interface TLSResponse {
  statusCode: number | undefined;
  headers: any;
  data: string;
}

export class TLSClient {
  private options: https.RequestOptions;

  constructor(certInput: string, keyInput: string) {
    let cert: Buffer;
    let key: Buffer;

    // 1. Certificate 처리
    if (this.isPemContent(certInput)) {
      cert = Buffer.from(certInput);
    } else if (this.isBase64(certInput)) {
      cert = Buffer.from(certInput, 'base64');
    } else {
      const resolvedPath = path.isAbsolute(certInput) ? certInput : path.resolve(process.cwd(), certInput);
      cert = fs.readFileSync(resolvedPath);
    }

    // 2. Private Key 처리
    if (this.isPemContent(keyInput)) {
      key = Buffer.from(keyInput);
    } else if (this.isBase64(keyInput)) {
      key = Buffer.from(keyInput, 'base64');
    } else {
      const resolvedPath = path.isAbsolute(keyInput) ? keyInput : path.resolve(process.cwd(), keyInput);
      key = fs.readFileSync(resolvedPath);
    }

    this.options = {
      cert,
      key,
      rejectUnauthorized: true,
    };
  }

  private isPemContent(input: string): boolean {
    return input.includes('-----BEGIN');
  }

  private isBase64(input: string): boolean {
    // 공백이나 줄바꿈이 없고 base64 패턴인 경우 (대략적인 판별)
    return /^[A-Za-z0-9+/=]+$/.test(input.replace(/\n|\r/g, '')) && input.length > 50;
  }

  private makeRequest(url: string, method: string = 'GET', data: any = null, headers: any = {}): Promise<TLSResponse> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const requestOptions: https.RequestOptions = {
        ...this.options,
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...headers,
        },
      };

      const req = https.request(requestOptions, (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        });
      });

      req.on('error', (error) => reject(error));

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async get(url: string, headers: any = {}): Promise<TLSResponse> {
    return this.makeRequest(url, 'GET', null, headers);
  }

  async post(url: string, data: any, headers: any = {}): Promise<TLSResponse> {
    return this.makeRequest(url, 'POST', data, headers);
  }
}
