import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/layout/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    // We load "Material Symbols Outlined" (index.html) instead of the
    // classic "Material Icons" font, so mat-icon needs to be told to use
    // that font-set class - otherwise it renders the ligature text literally.
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }
}
