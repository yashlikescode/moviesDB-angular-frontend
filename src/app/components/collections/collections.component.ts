import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  MatSnackBar,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../auth.service';

@Component({
  standalone: true,
  selector: 'home',
  imports: [
    FormsModule,
    KeyValuePipe,
    HttpClientModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.css'],
})
export class CollectionsComponent implements OnInit {
  showSearchSpinner: boolean = false;
  userId: string = '1111';
  collectionsList: any;
  groupedMovies: { [collection: string]: any[] } = {};

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {

    this.showSearchSpinner = true;
        const username = this.route.snapshot.paramMap.get('username');
        this.userId = username || '1111';

        if (username) {
          this.authService.saveData(username);
        }
    this.http
      .get(`${environment.nodeServerUrl}api/userCollectionDetails/${this.userId}`, {})
      .subscribe({
        next: (data: any) => {
          this.groupedMovies = this.groupByCollection(data.rows);
          this.showSearchSpinner = false;
        },
        error: (err) => {
          console.error('Error occurred:', err);
        },
      });
  }
  groupByCollection(rows: any[]): { [collection: string]: any[] } {
    const grouped: { [collection: string]: any[] } = {};
    for (const row of rows) {
      const collection = row.collection_name || 'Uncategorized';
      if (!grouped[collection]) {
        grouped[collection] = [];
      }
      grouped[collection].push(row);
    }
    return grouped;
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
