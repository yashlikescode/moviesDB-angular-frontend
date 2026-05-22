import { Component, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSnackBar, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { CapitalizeFirstPipe } from '../capitalizeFirst.pipe copy';
import { RemoveTrailingDashesPipe } from '../removeDashes.pipe';
import { CollectionService } from '../../collection.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { AuthService } from '../../auth.service';
import { environment } from '../../../environments/environment';

interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
}

interface Row {
  collection_name: string;
}

@Component({
  standalone: true,
  selector: 'home',
  imports: [
    FormsModule,
    HttpClientModule,
    MatTableModule,
    MatProgressSpinnerModule,
    RemoveTrailingDashesPipe,
    CapitalizeFirstPipe,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  moviesList: Movie[] = [];
  totalRecords: number = 0;
  displayedColumns: string[] = ['Poster', 'Title', 'Year', 'Type', 'Action'];
  showMoviesTable: boolean = false;
  showSearchSpinner: boolean = false;
  searchTerm: string = '';

  // Collections related properties
  collectionsList: string[] = [];
  selectedCollections: string[] = [];
  newCollectionName: string = '';
  isAddMovieModalOpen: boolean = false;
  movieInAddPopup: Movie | null = null;

  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  readonly currentUser$: any;

  constructor(
    private http: HttpClient,
    private collectionService: CollectionService,
    private authService: AuthService,
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {
    const savedValue = localStorage.getItem('searchTerm');
    if (savedValue !== null) {
      this.searchTerm = savedValue;
    }
  }

  setSearchTerm() {
    localStorage.setItem('searchTerm', this.searchTerm);
  }

  goToMovie(row: Movie) {
    if (row.imdbID) {
      window.location.href = `/movie/${row.imdbID}`;
    }
  }

  addToCollection(movie: Movie) {
    this.movieInAddPopup = movie;
    this.currentUser$.pipe(take(1)).subscribe((user:any) => {
      const userId = user?.username || '1111';
      this.collectionService.getCollectionsListById(userId).subscribe({
        next: (data: { rows: Row[] }) => {
          this.collectionsList = data.rows.map((row) => row.collection_name);
          this.selectedCollections = [];
          this.newCollectionName = '';
          this.isAddMovieModalOpen = true;
        },
        error: (err) => {
          console.error('Error fetching user collections:', err);
        },
      });
    });
  }

  onCollectionCheckboxChange(collectionName: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const name = collectionName.trim();

    if (!name) return;

    if (checkbox.checked) {
      if (!this.selectedCollections.includes(name)) {
        this.selectedCollections.push(name);
      }
      if (!this.collectionsList.includes(name)) {
        this.collectionsList.push(name);
      }
    } else {
      const index = this.selectedCollections.indexOf(name);
      if (index > -1) {
        this.selectedCollections.splice(index, 1);
      }
    }
    console.log('Selected Collections:', this.selectedCollections);
  }

  addToSelectedCollections() {
    if (!this.movieInAddPopup || this.selectedCollections.length === 0) {
      return;
    }

    this.currentUser$.pipe(take(1)).subscribe((user:any) => {
      const userId = user?.username || '1111';

      // map movie from OMDB shape to your backend expected fields
      const moviePayload = {
        imdb_id: this.movieInAddPopup!.imdbID,
        movie_name: this.movieInAddPopup!.Title,
        movie_type: this.movieInAddPopup!.Type,
        movie_year: this.movieInAddPopup!.Year,
        movie_genre: null,
        movie_poster_link: this.movieInAddPopup!.Poster,
      };

      // create an Observable for each selected collection
      const requests = this.selectedCollections.map((collectionName) =>
        this.collectionService
          .addMovieToCollection(userId, collectionName, moviePayload)
          .pipe(
          // convert any error into a success object that signals failure so forkJoin won't error-out
          catchError((err) => of({ error: true, collectionName, err })),
        ),
    );

    // run them in parallel
    forkJoin(requests).subscribe(
      (results: any[]) => {
        const successes = results.filter((r) => !r || !r.error);
        const failures = results.filter((r) => r && r.error);

        if (successes.length > 0) {
          this._snackBar.open(
            `${successes.length} added to collection${successes.length > 1 ? 's' : ''}`,
            'OK',
            { duration: 3000, verticalPosition: this.verticalPosition },
          );
        }

        if (failures.length > 0) {
          // try to give actionable messages (e.g., 409 duplicate)
          const msgs = failures.map((f) => {
            const status = f.err?.status;
            if (status === 409) return `${f.collectionName}: already exists`;
            return `${f.collectionName}: failed`;
          });
          this._snackBar.open(`Failed: ${msgs.join('; ')}`, 'OK', {
            duration: 6000,
            verticalPosition: this.verticalPosition,
          });
        }

        // close modal and reset selection
        this.isAddMovieModalOpen = false;
        this.selectedCollections = [];
        this.newCollectionName = '';
      },
      (err) => {
        console.error('Unexpected error adding movies to collections', err);
        this._snackBar.open('Unexpected error occurred', 'OK', {
          duration: 4000,
          verticalPosition: this.verticalPosition,
        });
        this.isAddMovieModalOpen = false;
        this.selectedCollections = [];
        this.newCollectionName = '';
      },
    );
    });
  }

  onSubmitSearch() {
    this.showMoviesTable = false;
    this.showSearchSpinner = true;

    this.http
      .get<any>(`${environment.nodeServerUrl}api/movie-search-by-name`, {
        params: { s: this.searchTerm, page: '1' },
      })
      .subscribe({
        next: (data) => {
          if (
            data['Response'] === 'False' &&
            data['Error'] === 'Too many results.'
          ) {
            this.openSnackBar();
          } else if (
            data['Response'] === 'True' &&
            Number(data['totalResults']) > 0
          ) {
            this.moviesList = data['Search'];
            this.totalRecords = Number(data['totalResults']);
            this.showSearchSpinner = false;
            this.showMoviesTable = true;
          }
        },
        error: (err) => {
          console.error('Error occurred:', err);
          this.showSearchSpinner = false;
        },
      });
  }

  openSnackBar() {
    this._snackBar.openFromComponent(PizzaPartyComponent, {
      duration: this.durationInSeconds * 1000,
    });
  }

  durationInSeconds = 5;
  verticalPosition: MatSnackBarVerticalPosition = 'top';
}
@Component({
  selector: 'snack-bar-component-example-snack',
  template:
    '<span class="example-pizza-party">Too Many Results, Can you be more specific? 🤔</span>',
  styles: `
    .example-pizza-party {
      color: white;
    }
  `,
})
export class PizzaPartyComponent {}
