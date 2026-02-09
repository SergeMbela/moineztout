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
    { label: 'Marques', path: '/marques' },
    { label: 'Parfums', path: '/parfums' },
    { label: 'Conditionnements', path: '/types-conditionnement' },
    { label: 'Familles Olfactives', path: '/familles-olfactives' },
    { label: 'Modes de Livraison', path: '/modes-livraison' },
    { label: 'Clients', path: '/clients' },
    { label: 'Commandes Clients', path: '/commandes-clients' },
    { label: 'Commandes Fournisseurs', path: '/commandes-fournisseurs' },
    { label: 'Mouvements Stock', path: '/mouvements-stock' },
    { label: 'Bénéfices', path: '/benefice-stock' }
  ];
}