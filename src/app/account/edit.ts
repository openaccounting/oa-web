import { Component, ViewChild, ElementRef } from '@angular/core';
import { Logger } from '../core/logger';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { AccountService } from '../core/account.service';
import { Account, AccountApi, AccountTree } from '../shared/account';
import { AppError } from '../shared/error';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import 'rxjs/add/operator/first';

@Component({
  selector: 'app-accounts-edit',
  templateUrl: 'edit.html'
})
export class EditAccountPage {

  public form: FormGroup;
  public selectAccounts: any[];
  public error: AppError;
  private account: Account;
  private accountTree: AccountTree;
  @ViewChild('confirmDeleteModal') confirmDeleteModal: ElementRef;

  constructor(
    private log: Logger,
    private router: Router,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private fb: FormBuilder,
    private modalService: NgbModal
    ) {
    this.form = fb.group({
      'name': [null, Validators.required],
      'currency': [null],
      'precision': [null],
      'parent': [null, Validators.required]
    });

    this.accountService.getAccountTree().first().subscribe(tree => {
      this.accountTree = tree;
      this.selectAccounts = tree.getFlattenedAccounts();
      let accountId = this.route.snapshot.paramMap.get('id');
      this.account = tree.accountMap[accountId];

      this.form = fb.group({
        'name': [this.account.name, Validators.required],
        'currency': [this.account.currency],
        'precision': [this.account.precision],
        'parent': [this.account.parent.id, Validators.required]
      });
    });

  }

  onSubmit() {
    let account = new AccountApi(this.form.value);
    let parentAccount = this.accountTree.accountMap[account.parent];

    if(!parentAccount) {
      this.error = new AppError('Invalid parent account');
      return;
    }

    account.id = this.account.id;
    account.orgId = this.account.orgId;
    account.debitBalance = parentAccount.debitBalance;
    account.currency = account.currency || parentAccount.currency;
    account.precision = account.precision !== null ? account.precision : parentAccount.precision;

    this.log.debug('put account');
    this.log.debug(account);
    this.accountService.putAccount(account)
      .subscribe(
        account => {
          this.log.debug(account);
          this.router.navigate(['/accounts']);
        },
        err => {
          this.error = err;
        }
    );
  }

  confirmDelete() {
    this.modalService.open(this.confirmDeleteModal).result.then((result) => {
      this.log.debug('delete');
      this.accountService.deleteAccount(this.account.id)
        .subscribe(() => {
          this.log.debug('successfully deleted account ' + this.account.id);
          this.router.navigate(['/accounts']);
        }, error => {
          this.error = error;
        })
    }, (reason) => {
      this.log.debug('cancel delete');
    });
  }
}