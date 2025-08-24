import { Component, inject , OnInit, PLATFORM_ID} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSnackBar,MatSnackBarVerticalPosition, } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CapitalizeFirstPipe } from '../capitalizeFirst.pipe copy';
import { RemoveTrailingDashesPipe } from '../removeDashes.pipe';
import { CollectionService } from '../../collection.service';
import {ChangeDetectionStrategy, model, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
  MatDialogClose,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
interface Row {
  collection_name: string;
}

import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';


@Component({
  standalone: true,
  selector: 'home',
  imports: [
    FormsModule,
    HttpClientModule,
    MatTableModule,
    CommonModule,
    MatProgressSpinnerModule,
    RemoveTrailingDashesPipe,
    CapitalizeFirstPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,MatButtonModule, MatDividerModule, MatIconModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit{
  moviesList: any;
  totalRecords: Number = 0;
  displayedColumns: string[] = ['Poster', 'Title', 'Year', 'Type', 'Action'];
  showMoviesTable: boolean = false;
  showSearchSpinner:boolean = false;
  searchTerm: string = '';
  isAddMovieModalOpen: boolean = false;

  constructor(private http: HttpClient, private collectionService: CollectionService) {}

  collectionsList: string[] = [];

    ngOnInit() {
    const savedValue = localStorage.getItem('searchTerm');
    if (savedValue !== null) {
      this.searchTerm = savedValue;
    }
  }
    setSearchTerm() {
    localStorage.setItem('searchTerm', this.searchTerm);
  }
  goToMovie(row: any) {
    const movieId = row.imdbID;
    window.location.href = `/movie/${movieId}`;
  }
  addToCollection(movie: any) {
    this.collectionService.getCollectionsListById('1111').subscribe({
      next: (data) => {
        this.collectionsList = data.rows.map(((row: Row) => row.collection_name));
        this.isAddMovieModalOpen = true;
      },
      error: (err) => {
        console.error('Error fetching user collections:', err);
      },
    });
  }
  
  readonly dialog = inject(MatDialog);
openMovieAddDialog(movie:any) {
}

  onSubmitSearch() {
    this.showMoviesTable = false;
    this.showSearchSpinner = true;
    this.http
      .get('https://node-backend-7q02.onrender.com/api/movie-search-by-name', {
        params: { s: this.searchTerm, page: 1 },
      })
      .subscribe({
        next: (data: any) => {
          console.log('Success:', data);
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
        },
      });
  }

  private _snackBar = inject(MatSnackBar);

  durationInSeconds = 5;
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  openSnackBar() {
    this._snackBar.openFromComponent(PizzaPartyComponent, {
      duration: this.durationInSeconds * 1000,
    });
  }
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
