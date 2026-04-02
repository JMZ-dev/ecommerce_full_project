
import { createRouter, createWebHistory } from 'vue-router'
import Products from '../views/ProductsView.vue'
import ProductDetail from '../views/ProductDetailView.vue'
import Cart from '../views/CartView.vue'
import Checkout from '../views/CheckoutView.vue'
import Login from '../views/LoginView.vue'
import Register from '../views/RegisterView.vue'
import Profile from '../views/ProfileView.vue'
import Orders from '../views/OrdersView.vue'
import OrderDetail from '../views/OrderDetailView.vue'
import AdminProducts from '../views/AdminProductsView.vue'
import PaymentSuccess from '../views/PaymentSuccessView.vue'
import PaymentCancel from '../views/PaymentCancelView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Products },
    { path: '/products/:id', component: ProductDetail },
    { path: '/cart', component: Cart },
    { path: '/checkout', component: Checkout },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/profile', component: Profile },
    { path: '/orders', component: Orders },
    { path: '/orders/:id', component: OrderDetail },
    { path: '/admin/products', component: AdminProducts },
    { path: '/payment-success', component: PaymentSuccess },
    { path: '/payment-cancel', component: PaymentCancel }
  ]
})
