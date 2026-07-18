import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  private baseUrl = `${environment.nodeServerUrl}api`;

  // fetch collections for the currently-authenticated user
  getCollectionsList(): Observable<any> {
    const username = this.authService.getUsername();
    if (!username) {
      return throwError(() => new Error('No username available in AuthService'));
    }
    return this.http.get(`${this.baseUrl}/userCollectionsList/${username}`);
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
