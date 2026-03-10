import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { AdminPageComponent } from './pages/admin-page.component';
import { HomePageNewComponent } from './pages/home-page-new.component';
import { ProductsPageComponent } from './pages/products-page.component';
import { AboutPageComponent } from './pages/about-page.component';
import { ContactPageComponent } from './pages/contact-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page';

export const routes: Routes = [
        {
                path: '',
                component: HomePageNewComponent
        },
        {
                path: 'produits',
                component: ProductsPageComponent
        },
        {
                path: 'panier',
                component: CartPageComponent
        },
        {
                path: 'a-propos',
                component: AboutPageComponent
        },
        {
                path: 'contact',
                component: ContactPageComponent
        },
        {
                path: 'admin',
                component: AdminPageComponent,
                canActivate: [adminGuard]
        },
        {
                path: '**',
                redirectTo: ''
        }
];
