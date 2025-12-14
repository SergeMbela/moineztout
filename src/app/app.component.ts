import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './services/navbar.component';
import { MobileMenuComponent } from './components/mobile-menu/mobile-menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, MobileMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  styles: [`
    @media (max-width: 767px) {
      app-navbar {
        display: none;
      }
    }
  `]
})
export class AppComponent {
  title = 'moineztout-dashboard';
}
