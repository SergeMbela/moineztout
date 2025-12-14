import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container">
      <div class="error-card">
        <h1>404</h1>
        <h2>Page non trouvée</h2>
        <p>Désolé, la page que vous recherchez n'existe pas.</p>
        <a routerLink="/stock" class="btn">Retourner à l'accueil</a>
      </div>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      padding: 20px;
    }
    .error-card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      text-align: center;
      max-width: 480px;
      width: 100%;
      border: 1px solid #f0f0f0;
    }
    h1 { font-size: 6rem; margin: 0; color: #e2e8f0; line-height: 1; font-weight: 800; }
    h2 { font-size: 1.5rem; margin: 1rem 0; color: #2d3748; }
    p { color: #718096; margin-bottom: 2rem; }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .btn:hover { background: #0056b3; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  `]
})
export class PageNotFoundComponent {}