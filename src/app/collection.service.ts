import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  constructor(private http: HttpClient) {}

  private baseUrl = `${environment.nodeServerUrl}api`;

  getCollectionsListById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/userCollectionsList/${id}`);
  }

    addMovieToCollection(userId: string, collectionName: string, movie: any): Observable<any> {
    const payload = {
      user_id: String(userId),
      collection_name: collectionName,
      movie
    };
    return this.http.post(`${this.baseUrl}/collections/movies`, payload);
  }
}
