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
    { label: 'Tableau de bord', route: '/' },
    { label: 'Stock', route: '/stock' },
    { label: 'Fournisseurs', route: '/fournisseurs' },
    { label: 'Boutique', route: '/boutique' },
    { label: 'Approvisionnement', route: '/approvisionnement' },
    { label: 'Prospects', route: '/prospects' },
    { label: 'Commissions', route: '/commissions' },
    { label: 'Ventes', route: '/ventes' },
    { label: 'Achats', route: '/achats' }
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