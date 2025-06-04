import { Component, inject , PLATFORM_ID} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSnackBar,MatSnackBarVerticalPosition, } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'home',
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    HttpClientModule,
    MatTableModule,
    CommonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  searchTerm: string = '';
  moviesList: any;
  totalRecords: Number = 0;
  displayedColumns: string[] = ['Poster', 'Title', 'Year', 'Type'];
  showMoviesTable: boolean = false;
  showSearchSpinner:boolean = false;

  constructor(private http: HttpClient) {}

  onSubmitSearch() {
    this.showMoviesTable = false;
    this.showSearchSpinner = true;
    this.http
      .get('https://node.yashlikescode.in/api/movie-search-by-name', {
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