import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatSnackBar,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { AuthService } from '../../auth.service';
import { CollectionService } from '../../collection.service';
import { environment } from '../../../environments/environment';
import {
  AddMovieDialogComponent,
  AddMovieDialogData,
  Movie,
} from './add-movie-dialog.component';

interface Row {
  collection_name: string;
}

@Component({
  standalone: true,
  selector: 'home',
  imports: [
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  moviesList: Movie[] = [];
  totalRecords: number = 0;
  showMoviesTable: boolean = false;
  showSearchSpinner: boolean = false;
  searchTerm: string = '';
  pageNumber: number = 1;
  isLoadingMore: boolean = false;
  showLoadingMoreSpinner: boolean = false;

  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly currentUser$: any;

  constructor(
    private http: HttpClient,
    private collectionService: CollectionService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    const savedValue = localStorage.getItem('searchTerm');
    if (savedValue !== null) {
      this.searchTerm = savedValue;
    }
  }

  setSearchTerm(): void {
    localStorage.setItem('searchTerm', this.searchTerm);
  }

  goToMovie(row: Movie): void {
    if (row.imdbID) {
      this.router.navigate(['/movie', row.imdbID]);
    }
  }

  addToCollection(movie: Movie): void {
    this.currentUser$.pipe(take(1)).subscribe((user: any) => {
      const userId = user?.username || '1111';

      this.collectionService.getCollectionsListById(userId).subscribe({
        next: (data: { rows: Row[] }) => {
          const dialogData: AddMovieDialogData = {
            movie,
            collections: data.rows.map((row) => row.collection_name),
          };

          const dialogRef = this.dialog.open(AddMovieDialogComponent, {
            data: dialogData,
            width: 'min(640px, calc(100vw - 1rem))',
            maxWidth: '100vw',
            autoFocus: false,
          });

          dialogRef
            .afterClosed()
            .subscribe((selectedCollections?: string[]) => {
              if (!selectedCollections?.length) {
                return;
              }

              this.addMovieToCollections(userId, movie, selectedCollections);
            });
        },
        error: (err) => {
          console.error('Error fetching user collections:', err);
          this._snackBar.open('Unable to load your collections.', 'OK', {
            duration: 4000,
            verticalPosition: this.verticalPosition,
          });
        },
      });
    });
  }

  private addMovieToCollections(
    userId: string,
    movieInAddPopup: Movie,
    selectedCollections: string[],
  ): void {
    const moviePayload = {
      imdb_id: movieInAddPopup.imdbID,
      movie_name: movieInAddPopup.Title,
      movie_type: movieInAddPopup.Type,
      movie_year: movieInAddPopup.Year,
      movie_genre: null,
      movie_poster_link: movieInAddPopup.Poster,
    };

    const requests = selectedCollections.map((collectionName) =>
      this.collectionService
        .addMovieToCollection(userId, collectionName, moviePayload)
        .pipe(catchError((err) => of({ error: true, collectionName, err }))),
    );

    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        const successes = results.filter((result) => !result?.error);
        const failures = results.filter((result) => result?.error);

        if (successes.length > 0) {
          this._snackBar.open(
            `${successes.length} added to ${successes.length > 1 ? 'collections' : 'collection'}`,
            'OK',
            { duration: 3000, verticalPosition: this.verticalPosition },
          );
        }

        if (failures.length > 0) {
          const messages = failures.map((failure) => {
            if (failure.err?.status === 409) {
              return `${failure.collectionName}: already exists`;
            }
            return `${failure.collectionName}: failed`;
          });

          this._snackBar.open(`Failed: ${messages.join('; ')}`, 'OK', {
            duration: 6000,
            verticalPosition: this.verticalPosition,
          });
        }
      },
      error: (err) => {
        console.error('Unexpected error adding movies to collections', err);
        this._snackBar.open('Unexpected error occurred', 'OK', {
          duration: 4000,
          verticalPosition: this.verticalPosition,
        });
      },
    });
  }

  onSubmitSearch(): void {
    this.showMoviesTable = false;
    this.showSearchSpinner = true;
    this.pageNumber = 1;
    this.http
      .get<any>(`${environment.nodeServerUrl}api/movie-search-by-name`, {
        params: { s: this.searchTerm, page: this.pageNumber.toString() },
      })
      .subscribe({
        next: (data) => {
          this.showSearchSpinner = false;

          if (
            data['Response'] === 'False' &&
            data['Error'] === 'Too many results.'
          ) {
            this.openSnackBar();
            return;
          }

          if (data['Response'] === 'True' && Number(data['totalResults']) > 0) {
            this.moviesList = data['Search'];
            this.totalRecords = Number(data['totalResults']);
            this.showMoviesTable = true;
            return;
          }

          this.moviesList = [];
          this.totalRecords = 0;
        },
        error: (err) => {
          console.error('Error occurred:', err);
          this.showSearchSpinner = false;
        },
      });
  }

  onLoadMore(): void {
    this.showLoadingMoreSpinner = true;
    this.pageNumber++;
    this.http
      .get<any>(`${environment.nodeServerUrl}api/movie-search-by-name`, {
        params: { s: this.searchTerm, page: this.pageNumber.toString() },
      })
      .subscribe({
        next: (data) => {
          this.showLoadingMoreSpinner = false;

          if (
            data['Response'] === 'False' &&
            data['Error'] === 'Too many results.'
          ) {
            this.openSnackBar();
            return;
          }

          if (data['Response'] === 'True' && Number(data['totalResults']) > 0) {
            this.moviesList.push(...data['Search']);
            this.totalRecords = Number(data['totalResults']);
            return;
          }
        },
        error: (err) => {
          console.error('Error occurred:', err);
          this.showLoadingMoreSpinner = false;
        },
      });
  }

  openSnackBar(): void {
    this._snackBar.openFromComponent(PizzaPartyComponent, {
      duration: this.durationInSeconds * 1000,
    });
  }

  durationInSeconds = 5;
  verticalPosition: MatSnackBarVerticalPosition = 'top';
}

@Component({
  selector: 'snack-bar-component-example-snack',
  standalone: true,
  template:
    '<span class="example-pizza-party">Too many results. Try a more specific search.</span>',
  styles: `
    .example-pizza-party {
      color: white;
    }
  `,
})
export class PizzaPartyComponent {}
