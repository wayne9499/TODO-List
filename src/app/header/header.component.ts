import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddtaskComponent } from '../user/addtask/addtask.component';
import { ReloadService } from '../reload.service';
import { HttpClient } from '@angular/common/http';
import {SearchService} from '../search.service';
import { FormControl } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';

interface Label {
  value: string;
  viewValue: string;
}
interface Priority {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  firstName = 'User';
  searchData: any[] = [];
  searchResults: any[] = [];
  labels = new FormControl;

  labelList: Label[] = [
    {value: 'personal', viewValue: 'Personal'},
    {value: 'work', viewValue: 'Work'},
    {value: 'shopping', viewValue: 'Shopping'},
    {value: 'others', viewValue: 'Others'}
  ];
  priorityList: Priority[] = [
    {value: 'low', viewValue: 'Low'},
    {value: 'medium', viewValue: 'Medium'},
    {value: 'high', viewValue: 'High'}
  ];

  constructor(private data: SearchService, private http: HttpClient, public dialogBox: MatDialog, private reload: ReloadService) { }

  ngOnInit(): void {
    this.data.currentMessage.subscribe(searchResults => this.searchResults = searchResults);
    this.firstName = sessionStorage.getItem('firstName');
  }
  openAddNewTaskDialog() {
    const dialogRef = this.dialogBox.open(AddtaskComponent);
    dialogRef.afterClosed().subscribe(() => {
      this.reload.sendAction(true);
    });
  }

  searchText(query: string) {
    const args = {
      text: query,
      userID: sessionStorage.getItem('email')
    };
    this.http.post('http://localhost:3000/searchTask', args, { responseType: 'json'}).subscribe(
      (response: any[]) => {
        this.searchData = [];

        for (const task of response) {
          this.searchData.push(task);
        }
        this.data.changeMessage(this.searchData)
      },
      (error) => {
        alert(error);
      }
    );
  }

  filterTasks(){

  }
}
