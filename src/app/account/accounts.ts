import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.html',
  styleUrls: ['./accounts.scss']
})
export class AccountsPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  newAccount() {
    this.router.navigate(['/accounts/new']);
  }
}