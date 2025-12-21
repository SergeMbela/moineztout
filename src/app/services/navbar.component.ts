import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  // Liste des liens de navigation demandés
  navItems = [
    { label: 'Fournisseurs', path: '/fournisseurs' },
    { label: 'Boutique', path: '/boutique' },
    { label: 'Approvisionnement', path: '/approvisionnement' },
    { label: 'Gestion de stock', path: '/stock' },
    { label: 'Prospects', path: '/prospects' },
    { label: 'Commissions', path: '/commissions' },
    { label: 'Ventes', path: '/ventes' },
    { label: 'CA', path: '/ca' }
  ];
}