import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.scss']
})
export class MobileMenuComponent {
  isOpen = false;

  menuItems = [

    { label: 'Marques', route: '/marques' },
    { label: 'Parfums', route: '/parfums' },
    { label: 'Conditionnements', route: '/types-conditionnement' },
    { label: 'Familles Olfactives', route: '/familles-olfactives' },
    { label: 'Modes de Livraison', route: '/modes-livraison' },
    { label: 'Clients', route: '/clients' },
    { label: 'Commandes Clients', route: '/commandes-clients' },
    { label: 'Commandes Fournisseurs', route: '/commandes-fournisseurs' },
    { label: 'Mouvements Stock', route: '/mouvements-stock' }
  ];

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  async logout() {
    try {
      await this.supabase.signOut();
      this.closeMenu();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
    }
  }
}