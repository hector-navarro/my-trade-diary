import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-setups-tags-page',
  templateUrl: './setups-tags-page.component.html',
})
export class SetupsTagsPageComponent implements OnInit {
  setups: any[] = [];
  tags: any[] = [];
  accounts: any[] = [];
  setupForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });
  tagForm = this.fb.group({
    name: ['', Validators.required],
  });
  accountForm = this.fb.group({
    name: ['', Validators.required],
    currency: ['USD', Validators.required],
  });

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.api.getSetups().subscribe((data: any) => (this.setups = data.setups || []));
    this.api.getTags().subscribe((data: any) => (this.tags = data.tags || []));
    this.api.getAccounts().subscribe((data: any) => (this.accounts = data.accounts || []));
  }

  createSetup() {
    if (this.setupForm.invalid) {
      return;
    }
    this.api.createSetup(this.setupForm.value).subscribe(() => {
      this.setupForm.reset();
      this.load();
    });
  }

  deleteSetup(id: number) {
    this.api.deleteSetup(id).subscribe(() => this.load());
  }

  createTag() {
    if (this.tagForm.invalid) {
      return;
    }
    this.api.createTag(this.tagForm.value).subscribe(() => {
      this.tagForm.reset();
      this.load();
    });
  }

  deleteTag(id: number) {
    this.api.deleteTag(id).subscribe(() => this.load());
  }

  createAccount() {
    if (this.accountForm.invalid) {
      return;
    }
    this.api.createAccount(this.accountForm.value).subscribe(() => {
      this.accountForm.reset({ name: '', currency: 'USD' });
      this.load();
    });
  }

  deleteAccount(id: number) {
    this.api.deleteAccount(id).subscribe(() => this.load());
  }
}
