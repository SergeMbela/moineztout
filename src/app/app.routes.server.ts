import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'commandes-clients/:id/lignes',
    renderMode: RenderMode.Server,
  },
  {
    path: 'commandes-fournisseurs/:id/lignes',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];