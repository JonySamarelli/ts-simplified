import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  constructor(private cnn: HttpClient) { }

  get(url: string) {
    return this.cnn.get(url);
  }

  getSelectOptions(dbName: string) {
    return this.cnn.get(`http://localhost:3000/select-options/?db=${dbName}`);
  }

  post(url: string, body: any) {
    return this.cnn.post(url, body);
  }

  put(url: string, body: any) {
    return this.cnn.put(url, body);
  }
}
