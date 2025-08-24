import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  constructor(private http: HttpClient) {}

  getCollectionsListById(id: string): Observable<any> {
    return this.http.get(`https://node-backend-7q02.onrender.com/api/userCollectionsList/${id}`);
  }
}
