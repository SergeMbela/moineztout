import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  /**
   * Affiche un toast temporaire
   * @param message Le message à afficher
   * @param type Le type de notification ('success' ou 'error')
   */
  show(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.createElement('div');
    toast.innerText = message;
    
    // Styles CSS appliqués dynamiquement
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px 24px',
      borderRadius: '4px',
      color: '#fff',
      zIndex: '10000',
      fontFamily: 'Arial, sans-serif',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      opacity: '0',
      transition: 'opacity 0.3s ease-in-out',
      backgroundColor: type === 'success' ? '#10B981' : '#EF4444', // Vert ou Rouge
      pointerEvents: 'none' // Permet de cliquer au travers si besoin
    });

    document.body.appendChild(toast);

    // Animation d'apparition
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    // Disparition automatique après 3 secondes
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }
}
