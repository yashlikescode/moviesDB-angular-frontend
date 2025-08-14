import { Component, inject , OnInit, PLATFORM_ID} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSnackBar,MatSnackBarVerticalPosition, } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CapitalizeFirstPipe } from '../capitalizeFirst.pipe copy';
import { RemoveTrailingDashesPipe } from '../removeDashes.pipe';

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

  constructor(private http: HttpClient) {}

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