import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  constructor(private http: HttpClient) {}

  getMovieById(id: string): Observable<any> {
    return this.http.get(`${environment.nodeServerUrl}api/movie-search-by-id?i=${id}`);
  }

  getMovieCollectionsbyMovieId(id: string): Observable<any> {
    return this.http.get(`${environment.nodeServerUrl}api/movieCollectionsList/${id}`);
  }
}
