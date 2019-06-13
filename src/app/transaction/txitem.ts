import { Transaction, Split} from '../shared/transaction';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';

export class TxItem {
  tx: Transaction;
  activeSplit: Split;
  activeSplitIndex: number;
  form: FormGroup;
  balance: number;
  editing: boolean;
  edit$: Subject<any>;
}